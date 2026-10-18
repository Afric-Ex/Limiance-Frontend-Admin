import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Copy,
  Eye,
  AlertTriangle,
  FileText,
  X,
} from 'lucide-react';
import { ShimmerTableRows } from '../components/Shimmer';

export default function PendingApprovalsPage() {
  const { user } = useAuth();
  const confirm = useConfirm();

  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING'); // 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'
  const [toast, setToast] = useState(null);

  // Modals
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const [payloadModalItem, setPayloadModalItem] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedId(text);
    showToast('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchApprovals = async (status = statusFilter) => {
    setLoading(true);
    try {
      const query = status && status !== 'ALL' ? `?status=${status}` : '';
      const res = await api(`/api/admin/pending-approvals${query}`);
      setApprovals(res.approvals || []);
    } catch (err) {
      console.error('Failed to load pending approvals', err);
      showToast(err.message || 'Failed to load approvals from Admin API', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals(statusFilter);
  }, [statusFilter]);

  const handleApprove = async (item) => {
    const ok = await confirm({
      title: 'Approve Pending Action',
      message: `Are you sure you want to approve action "${item.action_type}" for resource "${item.resource_id}"? This executes the operation immediately.`,
      confirmText: 'Approve Action',
      variant: 'primary',
    });
    if (!ok) return;

    try {
      await api(`/api/admin/pending-approvals/${item.id}/approve`, {
        method: 'POST',
      });
      showToast(`Action ${item.action_type} approved successfully`);
      fetchApprovals(statusFilter);
    } catch (err) {
      showToast(err.message || 'Failed to approve action', 'error');
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModalItem) return;

    setRejecting(true);
    try {
      await api(`/api/admin/pending-approvals/${rejectModalItem.id}/reject`, {
        method: 'POST',
        body: { reason: rejectReason.trim() },
      });
      showToast(`Action ${rejectModalItem.action_type} rejected and discarded`);
      setRejectModalItem(null);
      setRejectReason('');
      fetchApprovals(statusFilter);
    } catch (err) {
      showToast(err.message || 'Failed to reject action', 'error');
    } finally {
      setRejecting(false);
    }
  };

  const parsePayload = (raw) => {
    if (!raw) return null;
    try {
      return typeof raw === 'object' ? raw : JSON.parse(raw);
    } catch {
      return raw;
    }
  };

  const pendingCount = approvals.filter((a) => a.status === 'PENDING').length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '10px',
            background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
            color: '#fff',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(10px)',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#fff', fontWeight: 700 }}>
              Dual-Control Pending Approvals
            </h1>
            {pendingCount > 0 && (
              <span
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {pendingCount} Action{pendingCount > 1 ? 's' : ''} Pending
              </span>
            )}
          </div>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
            N-of-M sign-off queue for critical administrative mutations, fund adjustments, and emergency delistings.
          </p>
        </div>

        <button
          onClick={() => fetchApprovals(statusFilter)}
          disabled={loading}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filters Toolbar */}
      <div
        style={{
          background: '#13151c',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'PENDING', label: 'Pending Sign-off', icon: Clock },
            { id: 'APPROVED', label: 'Approved Actions', icon: CheckCircle },
            { id: 'REJECTED', label: 'Rejected Actions', icon: XCircle },
            { id: 'ALL', label: 'All Records', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: active ? '#4d77f0' : 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Container */}
      <div
        style={{
          background: '#13151c',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '14px 16px' }}>Approval ID</th>
                <th style={{ padding: '14px 16px' }}>Action Type</th>
                <th style={{ padding: '14px 16px' }}>Resource</th>
                <th style={{ padding: '14px 16px' }}>Requested By</th>
                <th style={{ padding: '14px 16px' }}>Required Role</th>
                <th style={{ padding: '14px 16px' }}>Status</th>
                <th style={{ padding: '14px 16px' }}>Payload</th>
                <th style={{ padding: '14px 16px' }}>Timeline</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <ShimmerTableRows rows={6} cols={9} colWidths={['12%', '14%', '12%', '12%', '10%', '10%', '8%', '12%', '10%']} />
              ) : approvals.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    <ShieldCheck size={36} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }} />
                    No approvals found matching filter "{statusFilter}".
                  </td>
                </tr>
              ) : (
                approvals.map((item) => {
                  const isPending = item.status === 'PENDING';
                  const isApproved = item.status === 'APPROVED';
                  const isRejected = item.status === 'REJECTED';

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {/* ID */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'monospace', color: '#9ca3af', fontSize: '12px' }}>
                            {item.id ? `${item.id.slice(0, 10)}...` : '—'}
                          </span>
                          <button
                            onClick={() => copyToClipboard(item.id)}
                            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '2px' }}
                            title="Copy ID"
                          >
                            <Copy size={12} color={copiedId === item.id ? '#10b981' : undefined} />
                          </button>
                        </div>
                      </td>

                      {/* Action Type */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            background: 'rgba(77, 119, 240, 0.12)',
                            color: '#818cf8',
                            border: '1px solid rgba(77, 119, 240, 0.25)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            fontFamily: 'monospace',
                          }}
                        >
                          {item.action_type}
                        </span>
                      </td>

                      {/* Resource */}
                      <td style={{ padding: '14px 16px', color: '#fff', fontSize: '13px', fontWeight: 500 }}>
                        {item.resource_id || '—'}
                      </td>

                      {/* Requested By */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>
                          {item.requested_by}
                          {item.requested_by === user?.email && (
                            <span style={{ color: '#60a5fa', fontSize: '11px', marginLeft: '4px' }}>(You)</span>
                          )}
                        </div>
                      </td>

                      {/* Required Role */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.8)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          {item.required_role || 'superadmin'}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            background: isApproved
                              ? 'rgba(16, 185, 129, 0.12)'
                              : isRejected
                              ? 'rgba(239, 68, 68, 0.12)'
                              : 'rgba(245, 158, 11, 0.12)',
                            color: isApproved ? '#34d399' : isRejected ? '#f87171' : '#fbbf24',
                            border: `1px solid ${
                              isApproved
                                ? 'rgba(16, 185, 129, 0.25)'
                                : isRejected
                                ? 'rgba(239, 68, 68, 0.25)'
                                : 'rgba(245, 158, 11, 0.25)'
                            }`,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {isApproved && <CheckCircle size={10} />}
                          {isRejected && <XCircle size={10} />}
                          {isPending && <Clock size={10} />}
                          {item.status}
                        </span>
                      </td>

                      {/* Payload Viewer Button */}
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => setPayloadModalItem(item)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                          }}
                        >
                          <Eye size={12} /> View
                        </button>
                      </td>

                      {/* Timeline */}
                      <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                        <div>Created: {item.created_at ? new Date(item.created_at).toLocaleString() : '—'}</div>
                        {item.approved_at && (
                          <div style={{ color: '#34d399', marginTop: '2px' }}>
                            Approved: {new Date(item.approved_at).toLocaleString()} by {item.approved_by || 'admin'}
                          </div>
                        )}
                        {item.rejected_at && (
                          <div style={{ color: '#f87171', marginTop: '2px' }}>
                            Rejected: {new Date(item.rejected_at).toLocaleString()} by {item.rejected_by || 'admin'}
                            {item.reject_reason && (
                              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                                Reason: "{item.reject_reason}"
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {isPending ? (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              onClick={() => handleApprove(item)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                background: '#10b981',
                                border: 'none',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              <CheckCircle size={12} /> Approve
                            </button>
                            <button
                              onClick={() => {
                                setRejectModalItem(item);
                                setRejectReason('');
                              }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#f87171',
                                fontWeight: 600,
                                fontSize: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              <XCircle size={12} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#181a24',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171' }}>
                <AlertTriangle size={20} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                  Reject Approval Action
                </h3>
              </div>
              <button
                onClick={() => setRejectModalItem(null)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: '1.5', margin: '0 0 16px' }}>
              You are rejecting action <strong>{rejectModalItem.action_type}</strong> (Target: {rejectModalItem.resource_id}). Please provide a rejection reason for the audit trail.
            </p>

            <form onSubmit={handleRejectSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
                  Rejection Reason / Justification
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Unverified counterparty, threshold exceeded without risk sign-off..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#13151c',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setRejectModalItem(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejecting || !rejectReason.trim()}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    background: '#ef4444',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: rejecting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payload Modal */}
      {payloadModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#181a24',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              maxWidth: '640px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                  Approval Payload Details
                </h3>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                  Action: {payloadModalItem.action_type} • Resource: {payloadModalItem.resource_id}
                </span>
              </div>
              <button
                onClick={() => setPayloadModalItem(null)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <pre
              style={{
                background: '#13151c',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '16px',
                color: '#34d399',
                fontFamily: 'monospace',
                fontSize: '12px',
                overflowX: 'auto',
                maxHeight: '360px',
                margin: '0 0 16px',
              }}
            >
              {JSON.stringify(parsePayload(payloadModalItem.payload_json), null, 2)}
            </pre>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => copyToClipboard(payloadModalItem.payload_json)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Copy size={12} /> Copy Raw JSON
              </button>

              <button
                type="button"
                onClick={() => setPayloadModalItem(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: '#4d77f0',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
