import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import './DepositsQueuePage.css';

// ---------------------------------------------------------------------------
// Mock data — removed once the backend endpoint is live
// ---------------------------------------------------------------------------
const MOCK_DEPOSITS = [
  {
    deposit_id: 'dep_7f3a9c2e1b4d',
    user_id: 'usr_3891abc',
    uid: '3891abc',
    asset: 'USDT',
    network: 'TRC-20',
    amount: '14,500.00',
    usd_value: '14,500.00',
    tx_hash: '0xf4c7e3a9b2d1e8f6a3c5b9d7e2f1a4c8b3d6e9f2a1c4b7d0e3f6a9c2b5d8e1f4',
    risk_score: 87,
    risk_flags: ['High-risk jurisdiction', 'New deposit address', 'Amount exceeds daily average'],
    received_at: '2026-09-01T14:23:00Z',
    status: 'pending_risk_review',
    address: 'TQn9Y7rvdPNaXmGU2VqZFH8W3jK5bCePs',
  },
  {
    deposit_id: 'dep_1a2b3c4d5e6f',
    user_id: 'usr_f0b22de',
    uid: 'f0b22de',
    asset: 'BTC',
    network: 'Bitcoin',
    amount: '0.89310000',
    usd_value: '54,872.91',
    tx_hash: '3e4d5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
    risk_score: 72,
    risk_flags: ['Flagged counterparty address', 'Mixing service detected'],
    received_at: '2026-09-01T11:08:00Z',
    status: 'pending_risk_review',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  },
  {
    deposit_id: 'dep_a1b2c3d4e5f6',
    user_id: 'usr_8c3f01a',
    uid: '8c3f01a',
    asset: 'ETH',
    network: 'ERC-20',
    amount: '12.500000',
    usd_value: '31,250.00',
    tx_hash: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    risk_score: 61,
    risk_flags: ['Sanctioned address in tx chain'],
    received_at: '2026-08-31T22:55:00Z',
    status: 'pending_risk_review',
    address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  },
];

async function fetchDeposits() {
  try {
    const res = await api('/v1/admin/deposits?status=pending_risk_review');
    return res.deposits || [];
  } catch {
    return MOCK_DEPOSITS;
  }
}

async function fetchDepositDetail(depositId) {
  try {
    const res = await api(`/v1/admin/deposits/${depositId}`);
    return res.deposit || null;
  } catch {
    return MOCK_DEPOSITS.find(d => d.deposit_id === depositId) || null;
  }
}

// ---------------------------------------------------------------------------

export default function DepositsQueuePage() {
  const [deposits, setDeposits] = useState([]);
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

  const load = async () => {
    setLoading(true);
    const data = await fetchDeposits();
    setDeposits(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (dep) => {
    setSelected(dep.deposit_id);
    setDetail(null);
    setRejectReason('');
    setDetailLoading(true);
    const d = await fetchDepositDetail(dep.deposit_id);
    setDetail(d);
    setDetailLoading(false);
  };

  const closeDetail = () => { setSelected(null); setDetail(null); };

  const handleAction = async (action) => {
    if (action === 'reject' && !rejectReason.trim()) {
      showToast('Please provide a rejection reason.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await api(`/v1/admin/deposits/${selected}/${action}`, {
        method: 'POST',
        body: JSON.stringify(action === 'reject' ? { reason: rejectReason } : {}),
      });
      showToast(`Deposit ${action === 'release' ? 'released' : 'rejected'} successfully.`);
    } catch {
      // Mock success — real error would be from backend
      showToast(`Deposit ${action === 'release' ? 'released to user wallet' : 'rejected'} (mocked).`);
    }
    setDeposits(prev => prev.filter(d => d.deposit_id !== selected));
    closeDetail();
    setActionLoading(false);
  };

  const riskColor = (score) => {
    if (score >= 80) return '#EF4444';
    if (score >= 60) return '#F59E0B';
    return '#10B981';
  };

  const riskLabel = (score) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    return 'Medium';
  };

  return (
    <div className="dq-page">
      {toast && (
        <div className={`dq-toast ${toast.type}`}>{toast.msg}</div>
      )}

      <div className="dq-header">
        <div>
          <h1 className="dq-title">Deposit Exceptions</h1>
          <p className="dq-subtitle">
            Deposits flagged by the risk engine for manual compliance review.
          </p>
        </div>
        <div className="dq-count-badge">{deposits.length} Pending</div>
      </div>

      <div className="dq-table-wrap">
        <table className="dq-table">
          <thead>
            <tr>
              <th>Deposit ID</th>
              <th>User</th>
              <th>Asset / Network</th>
              <th>Amount</th>
              <th>USD Value</th>
              <th>Risk Score</th>
              <th>Received</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="dq-empty">Loading deposits...</td></tr>
            ) : deposits.length === 0 ? (
              <tr><td colSpan="8" className="dq-empty">
                <div className="dq-empty-icon">✓</div>
                No deposits awaiting review.
              </td></tr>
            ) : deposits.map(dep => (
              <tr key={dep.deposit_id} className="dq-row">
                <td className="dq-mono">{dep.deposit_id}</td>
                <td className="dq-mono">{dep.uid || dep.user_id}</td>
                <td>
                  <span className="dq-asset-badge">{dep.asset}</span>
                  <span className="dq-network">{dep.network}</span>
                </td>
                <td className="dq-amount">{dep.amount} {dep.asset}</td>
                <td>${dep.usd_value}</td>
                <td>
                  <span className="dq-risk-badge" style={{ background: riskColor(dep.risk_score) + '22', color: riskColor(dep.risk_score), border: `1px solid ${riskColor(dep.risk_score)}44` }}>
                    {dep.risk_score} — {riskLabel(dep.risk_score)}
                  </span>
                </td>
                <td>{new Date(dep.received_at).toLocaleString()}</td>
                <td>
                  <button className="dq-btn-review" onClick={() => openDetail(dep)}>Review</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="dq-overlay" onClick={closeDetail}>
          <div className="dq-modal" onClick={e => e.stopPropagation()}>
            <div className="dq-modal-header">
              <div>
                <h2 className="dq-modal-title">Deposit Review</h2>
                <span className="dq-modal-id">{selected}</span>
              </div>
              <button className="dq-modal-close" onClick={closeDetail}>✕</button>
            </div>

            {/* Audit notice */}
            <div className="dq-audit-notice">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ flexShrink: 0 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Access and decisions on this deposit are actively audited by the Limiance Compliance Team.</span>
            </div>

            {detailLoading || !detail ? (
              <div className="dq-modal-loading">Loading deposit details...</div>
            ) : (
              <>
                <div className="dq-detail-grid">
                  <div className="dq-detail-section">
                    <h3 className="dq-section-title">Transaction</h3>
                    <div className="dq-info-list">
                      <div className="dq-info-row"><span>Asset</span><strong>{detail.asset} ({detail.network})</strong></div>
                      <div className="dq-info-row"><span>Amount</span><strong>{detail.amount} {detail.asset}</strong></div>
                      <div className="dq-info-row"><span>USD Value</span><strong>${detail.usd_value}</strong></div>
                      <div className="dq-info-row"><span>Deposit Address</span><strong className="dq-mono-sm">{detail.address}</strong></div>
                      <div className="dq-info-row"><span>Tx Hash</span>
                        <strong className="dq-mono-sm dq-truncate" title={detail.tx_hash}>{detail.tx_hash}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="dq-detail-section">
                    <h3 className="dq-section-title">Risk Assessment</h3>
                    <div className="dq-risk-score-block" style={{ borderColor: riskColor(detail.risk_score) + '44' }}>
                      <div className="dq-risk-score-num" style={{ color: riskColor(detail.risk_score) }}>{detail.risk_score}</div>
                      <div className="dq-risk-score-label">{riskLabel(detail.risk_score)} Risk</div>
                    </div>
                    <ul className="dq-flags-list">
                      {(detail.risk_flags || []).map((flag, i) => (
                        <li key={i} className="dq-flag-item">
                          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M4 4h16v12H4z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M4 4l8 6 8-6" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Decision */}
                <div className="dq-decision">
                  <h3 className="dq-section-title">Compliance Decision</h3>
                  <div className="dq-decision-form">
                    <div className="dq-input-group">
                      <label>Rejection Reason <span className="dq-required">(required to reject)</span></label>
                      <input
                        type="text"
                        className="dq-input"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="e.g. Funds originate from sanctioned address..."
                      />
                    </div>
                    <div className="dq-decision-actions">
                      <button
                        className="dq-btn-reject"
                        onClick={() => handleAction('reject')}
                        disabled={actionLoading}
                      >
                        {actionLoading ? '...' : 'Reject Deposit'}
                      </button>
                      <button
                        className="dq-btn-release"
                        onClick={() => handleAction('release')}
                        disabled={actionLoading}
                      >
                        {actionLoading ? '...' : 'Release to User'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
