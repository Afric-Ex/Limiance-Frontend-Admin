import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import './WithdrawalsQueuePage.css';

// ---------------------------------------------------------------------------
// Mock data — removed once the backend endpoint is live
// ---------------------------------------------------------------------------
const MOCK_WITHDRAWALS = [
  {
    withdrawal_id: 'wdl_b3c7f2a9e1d4',
    user_id: 'usr_3891abc',
    uid: '3891abc',
    asset: 'BTC',
    network: 'Bitcoin',
    amount: '1.25000000',
    usd_value: '76,812.50',
    to_address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    address_label: 'Personal Hardware Wallet',
    travel_rule_status: 'completed',
    travel_rule_vasp: 'Kraken Exchange',
    requested_at: '2026-09-01T16:42:00Z',
    status: 'pending_approval',
    fireblocks_status: 'pending',
    idempotency_key: 'idem_a1b2c3',
  },
  {
    withdrawal_id: 'wdl_9e8d7c6b5a4f',
    user_id: 'usr_f0b22de',
    uid: 'f0b22de',
    asset: 'ETH',
    network: 'ERC-20',
    amount: '45.000000',
    usd_value: '112,500.00',
    to_address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    address_label: 'Corporate Treasury',
    travel_rule_status: 'pending',
    travel_rule_vasp: null,
    requested_at: '2026-09-01T15:10:00Z',
    status: 'pending_approval',
    fireblocks_status: 'pending',
    idempotency_key: 'idem_d4e5f6',
  },
  {
    withdrawal_id: 'wdl_1f2e3d4c5b6a',
    user_id: 'usr_8c3f01a',
    uid: '8c3f01a',
    asset: 'USDT',
    network: 'TRC-20',
    amount: '50,000.00',
    usd_value: '50,000.00',
    to_address: 'TQn9Y7rvdPNaXmGU2VqZFH8W3jK5bCePs',
    address_label: 'Exchange Deposit',
    travel_rule_status: 'exempt',
    travel_rule_vasp: null,
    requested_at: '2026-09-01T14:55:00Z',
    status: 'pending_approval',
    fireblocks_status: 'pending',
    idempotency_key: 'idem_g7h8i9',
  },
];

async function fetchWithdrawals() {
  try {
    const res = await api('/v1/admin/withdrawals?status=pending_approval');
    return res.withdrawals || [];
  } catch {
    return MOCK_WITHDRAWALS;
  }
}

async function fetchWithdrawalDetail(id) {
  try {
    const res = await api(`/v1/admin/withdrawals/${id}`);
    return res.withdrawal || null;
  } catch {
    return MOCK_WITHDRAWALS.find(w => w.withdrawal_id === id) || null;
  }
}

// ---------------------------------------------------------------------------

const TR_STATUS = {
  completed: { label: 'Completed', color: '#059669', bg: '#D1FAE5', border: '#A7F3D0' },
  pending:   { label: 'Pending',   color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' },
  exempt:    { label: 'Exempt',    color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB' },
  failed:    { label: 'Failed',    color: '#DC2626', bg: '#FEE2E2', border: '#FCA5A5' },
};

export default function WithdrawalsQueuePage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [auditNote, setAuditNote] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    const data = await fetchWithdrawals();
    setWithdrawals(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (w) => {
    setSelected(w.withdrawal_id);
    setDetail(null);
    setAuditNote('');
    setDetailLoading(true);
    const d = await fetchWithdrawalDetail(w.withdrawal_id);
    setDetail(d);
    setDetailLoading(false);
  };

  const closeDetail = () => { setSelected(null); setDetail(null); };

  const handleApprove = async () => {
    if (!auditNote.trim()) {
      showToast('Please provide an audit note before approving.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await api(`/v1/admin/withdrawals/${selected}/approvals`, {
        method: 'POST',
        body: JSON.stringify({ note: auditNote }),
      });
      showToast('Withdrawal approved and sent to Fireblocks for broadcast.');
    } catch {
      showToast('Withdrawal approved (mocked) — would broadcast via Fireblocks.');
    }
    setWithdrawals(prev => prev.filter(w => w.withdrawal_id !== selected));
    closeDetail();
    setActionLoading(false);
  };

  const trBadge = (status) => {
    const s = TR_STATUS[status] || TR_STATUS.pending;
    return (
      <span className="wq-tr-badge" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="wq-page">
      {toast && (
        <div className={`wq-toast ${toast.type}`}>{toast.msg}</div>
      )}

      <div className="wq-header">
        <div>
          <h1 className="wq-title">Withdrawals Approval Queue</h1>
          <p className="wq-subtitle">
            Withdrawal requests pending dual-control compliance approval before Fireblocks broadcast.
          </p>
        </div>
        <div className="wq-count-badge">{withdrawals.length} Awaiting Approval</div>
      </div>

      <div className="wq-table-wrap">
        <table className="wq-table">
          <thead>
            <tr>
              <th>Withdrawal ID</th>
              <th>User</th>
              <th>Asset</th>
              <th>Amount</th>
              <th>USD Value</th>
              <th>Travel Rule</th>
              <th>Requested</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="wq-empty">Loading withdrawals...</td></tr>
            ) : withdrawals.length === 0 ? (
              <tr><td colSpan="8" className="wq-empty">
                <div className="wq-empty-icon">✓</div>
                No withdrawals pending approval.
              </td></tr>
            ) : withdrawals.map(w => (
              <tr key={w.withdrawal_id} className="wq-row">
                <td className="wq-mono">{w.withdrawal_id}</td>
                <td className="wq-mono">{w.uid || w.user_id}</td>
                <td>
                  <span className="wq-asset-badge">{w.asset}</span>
                  <span className="wq-network">{w.network}</span>
                </td>
                <td className="wq-amount">{w.amount} {w.asset}</td>
                <td>${w.usd_value}</td>
                <td>{trBadge(w.travel_rule_status)}</td>
                <td>{new Date(w.requested_at).toLocaleString()}</td>
                <td>
                  <button className="wq-btn-review" onClick={() => openDetail(w)}>Review</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="wq-overlay" onClick={closeDetail}>
          <div className="wq-modal" onClick={e => e.stopPropagation()}>
            <div className="wq-modal-header">
              <div>
                <h2 className="wq-modal-title">Withdrawal Review</h2>
                <span className="wq-modal-id">{selected}</span>
              </div>
              <button className="wq-modal-close" onClick={closeDetail}>✕</button>
            </div>

            <div className="wq-audit-notice">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ flexShrink: 0 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>This approval triggers an irreversible on-chain transaction via Fireblocks. Your approval is permanently audit-logged.</span>
            </div>

            {detailLoading || !detail ? (
              <div className="wq-modal-loading">Loading withdrawal details...</div>
            ) : (
              <>
                <div className="wq-detail-grid">
                  {/* Left: Transaction details */}
                  <div className="wq-detail-section">
                    <h3 className="wq-section-title">Transaction Details</h3>
                    <div className="wq-info-list">
                      <div className="wq-info-row"><span>Asset</span><strong>{detail.asset} ({detail.network})</strong></div>
                      <div className="wq-info-row"><span>Amount</span><strong>{detail.amount} {detail.asset}</strong></div>
                      <div className="wq-info-row"><span>USD Value</span><strong>${detail.usd_value}</strong></div>
                      <div className="wq-info-row"><span>Destination</span>
                        <strong className="wq-mono-sm wq-truncate" title={detail.to_address}>{detail.to_address}</strong>
                      </div>
                      <div className="wq-info-row"><span>Address Label</span><strong>{detail.address_label || 'Unlabelled'}</strong></div>
                      <div className="wq-info-row"><span>Idempotency Key</span><strong className="wq-mono-sm">{detail.idempotency_key}</strong></div>
                    </div>
                  </div>

                  {/* Right: Compliance info */}
                  <div className="wq-detail-section">
                    <h3 className="wq-section-title">Compliance Status</h3>

                    {/* Travel Rule block */}
                    <div className="wq-compliance-block">
                      <div className="wq-compliance-row">
                        <span>Travel Rule</span>
                        {trBadge(detail.travel_rule_status)}
                      </div>
                      {detail.travel_rule_vasp && (
                        <div className="wq-compliance-row">
                          <span>VASP</span>
                          <strong>{detail.travel_rule_vasp}</strong>
                        </div>
                      )}
                      {detail.travel_rule_status === 'pending' && (
                        <div className="wq-tr-warning">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                          Travel rule information is pending. You may still approve, but ensure compliance policy allows this.
                        </div>
                      )}
                    </div>

                    {/* Fireblocks status */}
                    <div className="wq-compliance-block" style={{ marginTop: 16 }}>
                      <div className="wq-compliance-row">
                        <span>Fireblocks Status</span>
                        <span className="wq-fireblocks-badge">{detail.fireblocks_status || 'Not submitted'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Approval form */}
                <div className="wq-decision">
                  <h3 className="wq-section-title">Dual-Control Approval</h3>
                  <div className="wq-decision-form">
                    <div className="wq-input-group">
                      <label>Compliance Audit Note <span className="wq-required">(required)</span></label>
                      <textarea
                        className="wq-textarea"
                        value={auditNote}
                        onChange={e => setAuditNote(e.target.value)}
                        placeholder="Document your compliance review. e.g. Verified user identity, destination address confirmed, travel rule complete..."
                        rows={3}
                      />
                    </div>
                    <div className="wq-decision-actions">
                      <button className="wq-btn-cancel" onClick={closeDetail} disabled={actionLoading}>Cancel</button>
                      <button className="wq-btn-approve" onClick={handleApprove} disabled={actionLoading}>
                        {actionLoading ? 'Approving...' : '✓ Approve & Broadcast'}
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
