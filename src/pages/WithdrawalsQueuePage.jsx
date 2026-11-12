import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import './WithdrawalsQueuePage.css';
import { ShimmerTableRows } from '../components/Shimmer';

export default function WithdrawalsQueuePage() {
  const navigate = useNavigate();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchWithdrawals = async () => {
      setLoading(true);
      try {
        const res = await api(`/api/withdrawals/pending?page=${currentPage}&limit=25`, { signal: controller.signal });
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
        setTotalRecords(res.total_records ?? items.length);
        const pages = Math.max(1, res.total_pages ?? 1);
        setTotalPages(pages);
        if (currentPage > pages) setCurrentPage(pages);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch pending withdrawals', err);
          showToast(err.message || 'Failed to load pending withdrawals', 'error');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchWithdrawals();
    const interval = setInterval(fetchWithdrawals, 20000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [currentPage]);

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
        <div className="wq-count-badge">{totalRecords} Awaiting Approval</div>
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
              <ShimmerTableRows rows={5} cols={7} colWidths={['20%', '25%', '25%', '20%', '35%', '25%', '15%']} />
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
                    <button className="wq-btn-review" onClick={() => navigate(`/withdrawals-queue/${w.approval_id}`)}>
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
          <button
            type="button"
            disabled={loading || currentPage <= 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            style={{ padding: '6px 12px', background: '#374151', color: '#fff', borderRadius: '4px', border: 'none', cursor: loading || currentPage <= 1 ? 'not-allowed' : 'pointer', opacity: loading || currentPage <= 1 ? 0.5 : 1 }}
          >
            Previous
          </button>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
            Page {currentPage} of {totalPages} ({totalRecords.toLocaleString()} requests)
          </span>
          <button
            type="button"
            disabled={loading || currentPage >= totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            style={{ padding: '6px 12px', background: '#374151', color: '#fff', borderRadius: '4px', border: 'none', cursor: loading || currentPage >= totalPages ? 'not-allowed' : 'pointer', opacity: loading || currentPage >= totalPages ? 0.5 : 1 }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
