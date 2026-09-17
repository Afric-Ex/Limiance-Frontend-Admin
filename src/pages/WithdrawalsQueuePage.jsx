import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import './WithdrawalsQueuePage.css';

export default function WithdrawalsQueuePage() {
  const navigate = useNavigate();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await api('/api/withdrawals/pending');
      const items = (res.pending || []).map((item) => {
        const req = item.request || {};
        return {
          approval_id: item.approval_id,
          wallet_id: req.WalletID || req.wallet_id || '—',
          user_id: req.UserID || req.user_id || '—',
          amount: req.Amount || req.amount || '0',
          destination: req.DestinationAddress || req.destination_address || req.to_address || '—',
          chain: req.Chain || req.chain || '—',
          asset: req.Asset || req.asset || '—',
          token_address: req.TokenAddress || req.token_address || '',
          idempotency_key: req.IdempotencyKey || req.idempotency_key || '—',
          raw: req,
        };
      });
      setWithdrawals(items);
    } catch (err) {
      console.error('Failed to fetch pending withdrawals', err);
      showToast(err.message || 'Failed to load pending withdrawals', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
    const interval = setInterval(fetchWithdrawals, 20000);
    return () => clearInterval(interval);
  }, []);

  const openDetail = async (w) => {
    setSelected(w.approval_id);
    setDetail(w);
    setRejectReason('');
    setDetailLoading(true);
    try {
      const res = await api(`/api/withdrawals/${w.approval_id}`);
      const req = res.request || {};
      setDetail({
        approval_id: res.approval_id || w.approval_id,
        wallet_id: req.WalletID || req.wallet_id || w.wallet_id,
        user_id: req.UserID || req.user_id || w.user_id,
        amount: req.Amount || req.amount || w.amount,
        destination: req.DestinationAddress || req.destination_address || w.destination,
        chain: req.Chain || req.chain || w.chain,
        asset: req.Asset || req.asset || w.asset,
        token_address: req.TokenAddress || req.token_address || '',
        idempotency_key: req.IdempotencyKey || req.idempotency_key || w.idempotency_key,
        raw: req,
      });
    } catch (err) {
      console.warn('Could not refresh withdrawal detail, using queue payload', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setDetail(null);
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await api(`/api/withdrawals/${selected}/approve`, {
        method: 'POST',
      });
      showToast('Withdrawal approval recorded — Wallet worker will process shortly.');
      setWithdrawals((prev) => prev.filter((w) => w.approval_id !== selected));
      closeDetail();
    } catch (err) {
      showToast(err.message || 'Failed to approve withdrawal', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showToast('A rejection reason is required.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await api(`/api/withdrawals/${selected}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      showToast('Withdrawal rejected — Wallet will discard without debiting.');
      setWithdrawals((prev) => prev.filter((w) => w.approval_id !== selected));
      closeDetail();
    } catch (err) {
      showToast(err.message || 'Failed to reject withdrawal', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="wq-page">
      {toast && <div className={`wq-toast ${toast.type}`}>{toast.msg}</div>}

      <div className="wq-header">
        <div>
          <h1 className="wq-title">Withdrawals Approval Queue</h1>
          <p className="wq-subtitle">
            Pending large-value withdrawals requiring dual-control compliance and risk approval before on-chain broadcast.
          </p>
        </div>
        <div className="wq-count-badge">{withdrawals.length} Awaiting Approval</div>
      </div>

      <div className="wq-table-wrap">
        <table className="wq-table">
          <thead>
            <tr>
              <th>Approval ID</th>
              <th>User ID</th>
              <th>Asset / Chain</th>
              <th>Amount</th>
              <th>Destination Address</th>
              <th>Idempotency Key</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="wq-empty">
                  Loading pending withdrawals...
                </td>
              </tr>
            ) : withdrawals.length === 0 ? (
              <tr>
                <td colSpan="7" className="wq-empty">
                  <div className="wq-empty-icon">✓</div>
                  No withdrawals pending approval in the queue.
                </td>
              </tr>
            ) : (
              withdrawals.map((w) => (
                <tr key={w.approval_id} className="wq-row">
                  <td className="wq-mono">{w.approval_id}</td>
                  <td className="wq-mono">{w.user_id}</td>
                  <td>
                    <span className="wq-asset-badge">{w.asset}</span>
                    <span className="wq-network">{w.chain}</span>
                  </td>
                  <td className="wq-amount">
                    {w.amount} {w.asset}
                  </td>
                  <td className="wq-mono-sm wq-truncate" title={w.destination} style={{ maxWidth: '200px' }}>
                    {w.destination}
                  </td>
                  <td className="wq-mono-sm">{w.idempotency_key}</td>
                  <td>
                    <button className="wq-btn-review" onClick={() => navigate(`/withdrawals-queue/${w.id}`)}>
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
