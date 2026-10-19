import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import {
  ArrowLeft,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RotateCcw,
  MessageSquare,
  Send,
  Lock,
  User,
  CreditCard,
} from 'lucide-react';
import { ShimmerDetailCard } from '../components/Shimmer';
import AuditReasonModal from '../components/AuditReasonModal';

export default function SupportTicketDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [threadLoading, setThreadLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  // P2P Dispute & Chat state
  const [p2pMatch, setP2pMatch] = useState(null);
  const [p2pChatMessages, setP2pChatMessages] = useState([]);
  const [p2pLoading, setP2pLoading] = useState(false);
  const [p2pChatInput, setP2pChatInput] = useState('');
  const [sendingP2pChat, setSendingP2pChat] = useState(false);
  const [resolvingDispute, setResolvingDispute] = useState(false);
  const [pendingResolution, setPendingResolution] = useState(null); // { resolution, title, actionLabel }

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const statusColor = (st) => {
    switch ((st || '').toUpperCase()) {
      case 'OPEN':
      case 'DISPUTED':
        return 'var(--danger-text)';
      case 'IN_PROGRESS':
      case 'PARTIALLY_COMPLETED':
        return 'var(--warning-text)';
      case 'RESOLVED':
      case 'COMPLETED':
        return 'var(--success-text)';
      case 'CLOSED':
      case 'CANCELLED':
        return 'var(--text-muted)';
      default:
        return 'var(--accent-blue)';
    }
  };

  const fetchP2PDisputeDetails = useCallback(async (matchId) => {
    if (!matchId) return;
    setP2pLoading(true);
    try {
      const [matchRes, chatRes] = await Promise.all([
        api(`/api/p2p/orders/${matchId}`),
        api(`/api/p2p/orders/${matchId}/chat`).catch(() => ({ messages: [] })),
      ]);
      setP2pMatch(matchRes);
      setP2pChatMessages(chatRes?.messages || []);
    } catch (err) {
      showToast(err.message || 'Failed to load P2P match details', 'error');
    } finally {
      setP2pLoading(false);
    }
  }, []);

  const fetchThread = useCallback(async () => {
    setThreadLoading(true);
    try {
      const res = await api('/api/support/tickets/' + id);
      const ticketObj = res.ticket || res;
      setSelectedTicket(ticketObj);
      setMessages(res.messages || []);

      const matchId = ticketObj?.order_match_id || searchParams.get('matchId');
      if (matchId) {
        await fetchP2PDisputeDetails(matchId);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load message thread', 'error');
    } finally {
      setThreadLoading(false);
    }
  }, [id, searchParams, fetchP2PDisputeDetails]);

  useEffect(() => {
    if (id) fetchThread();
  }, [id, fetchThread]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setReplying(true);
    try {
      await api('/api/support/tickets/' + id + '/replies', {
        method: 'POST',
        body: JSON.stringify({ message: replyText.trim(), body: replyText.trim() }),
      });
      setReplyText('');
      showToast('Reply sent to support ticket.');
      fetchThread();
    } catch (err) {
      showToast(err.message || 'Failed to send reply', 'error');
    } finally {
      setReplying(false);
    }
  };

  const handleSendP2PChatMessage = async (e) => {
    e.preventDefault();
    if (!p2pChatInput.trim() || !p2pMatch?.id) return;

    setSendingP2pChat(true);
    try {
      await api(`/api/p2p/orders/${p2pMatch.id}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message: p2pChatInput.trim() }),
      });
      setP2pChatInput('');
      showToast('Message posted to P2P order chat.');
      await fetchP2PDisputeDetails(p2pMatch.id);
    } catch (err) {
      showToast(err.message || 'Failed to send P2P chat message', 'error');
    } finally {
      setSendingP2pChat(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      await api('/api/support/tickets/' + id + '/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
      showToast('Ticket status updated to ' + newStatus);
    } catch (err) {
      showToast(err.message || 'Failed to update ticket status', 'error');
    }
  };

  const openRemediationModal = (resolution) => {
    if (!p2pMatch) return;
    const asset = (p2pMatch.asset || '').toUpperCase();
    const qty = p2pMatch.quantity;
    if (resolution === 'RELEASE_TO_BUYER') {
      setPendingResolution({
        resolution: 'RELEASE_TO_BUYER',
        title: `Force Release ${qty} ${asset} to Buyer`,
        actionLabel: 'Release Escrow to Buyer',
      });
    } else if (resolution === 'REFUND_TO_SELLER') {
      setPendingResolution({
        resolution: 'REFUND_TO_SELLER',
        title: `Refund ${qty} ${asset} to Seller & Cancel Order`,
        actionLabel: 'Refund Seller & Cancel',
      });
    } else if (resolution === 'CANCEL_DISPUTE') {
      setPendingResolution({
        resolution: 'CANCEL_DISPUTE',
        title: 'Cancel / Dismiss Dispute (Resume Trade)',
        actionLabel: 'Dismiss Dispute & Resume Trade',
      });
    }
  };

  const handleConfirmRemediation = async (reason) => {
    if (!pendingResolution || !p2pMatch) return;
    const { resolution } = pendingResolution;
    setPendingResolution(null);
    setResolvingDispute(true);
    try {
      await api(`/api/p2p/orders/${p2pMatch.id}/resolve`, {
        method: 'POST',
        headers: { 'X-Audit-Reason': reason },
        body: JSON.stringify({
          resolution,
          reason,
        }),
      });
      showToast(`P2P Dispute remediated: ${resolution}`);
      await fetchThread();
    } catch (err) {
      showToast(err.message || 'Failed to resolve P2P dispute', 'error');
    } finally {
      setResolvingDispute(false);
    }
  };

  if (threadLoading) {
    return (
      <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '20px 0' }}>
        <ShimmerDetailCard title="Loading support ticket & P2P escrow workspace..." />
      </div>
    );
  }

  if (!selectedTicket) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-primary)' }}>Support Ticket Not Found</h2>
        <button
          onClick={() => navigate('/support-tickets')}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-medium)',
            color: 'var(--text-primary)',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Back to Support Tickets
        </button>
      </div>
    );
  }

  const isP2PDispute = Boolean(p2pMatch || selectedTicket.order_match_id || selectedTicket.category === 'P2P_DISPUTE');
  const canForceReleaseOrRefund =
    p2pMatch && (p2pMatch.status === 'DISPUTED' || p2pMatch.status === 'PARTIALLY_COMPLETED');
  const canCancelDispute = p2pMatch && p2pMatch.status === 'DISPUTED';

  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', position: 'relative', paddingBottom: '40px' }}>
      <AuditReasonModal
        isOpen={Boolean(pendingResolution)}
        onClose={() => setPendingResolution(null)}
        onConfirm={handleConfirmRemediation}
        title={pendingResolution?.title}
        actionLabel={pendingResolution?.actionLabel}
      />

      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '10px',
            background: toast.type === 'error' ? 'var(--danger-solid)' : 'var(--success-solid)',
            color: '#fff',
            boxShadow: 'var(--shadow-md)',
            fontWeight: '600',
            fontSize: '14px',
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Top Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button
          onClick={() => navigate('/support-tickets')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            color: 'var(--text-primary)',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> Back to Support Tickets
        </button>

        <button
          onClick={fetchThread}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-light)',
            color: 'var(--text-primary)',
            padding: '8px 14px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          <RefreshCw size={14} /> Refresh Workspace
        </button>
      </div>

      {/* P2P Dispute & Escrow Remediation Panel */}
      {isP2PDispute && p2pMatch && (
        <div
          style={{
            background: 'var(--bg-surface-2)',
            border: p2pMatch.status === 'DISPUTED' ? '1px solid var(--danger-border)' : '1px solid var(--border-light)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '12px',
              borderBottom: '1px solid var(--border-medium)',
              paddingBottom: '16px',
              marginBottom: '18px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(239, 68, 68, 0.16)',
                    color: 'var(--danger-text)',
                    border: '1px solid var(--danger-border)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  <ShieldAlert size={14} /> P2P ESCROW DISPUTE REMEDIATION
                </span>
                <span
                  style={{
                    color: statusColor(p2pMatch.status),
                    background: `color-mix(in srgb, ${statusColor(p2pMatch.status)} 13%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${statusColor(p2pMatch.status)} 33%, transparent)`,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  Match Status: {p2pMatch.status}
                </span>
                {p2pMatch.dispute_resolution && (
                  <span
                    style={{
                      color: 'var(--success-text)',
                      background: 'rgba(16, 185, 129, 0.14)',
                      border: '1px solid var(--success-border)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    Outcome: {p2pMatch.dispute_resolution}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '8px', fontFamily: 'monospace' }}>
                Match ID: {p2pMatch.id} · Order ID: {p2pMatch.order_id} · Type: {p2pMatch.type}
              </div>
            </div>

            {/* Remediation Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={!canForceReleaseOrRefund || resolvingDispute}
                onClick={() => openRemediationModal('RELEASE_TO_BUYER')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: canForceReleaseOrRefund ? 'var(--success-solid)' : 'var(--bg-surface-2)',
                  color: canForceReleaseOrRefund ? '#fff' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: canForceReleaseOrRefund ? 'pointer' : 'not-allowed',
                }}
              >
                <CheckCircle2 size={15} /> Force Release to Buyer
              </button>

              <button
                type="button"
                disabled={!canForceReleaseOrRefund || resolvingDispute}
                onClick={() => openRemediationModal('REFUND_TO_SELLER')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: canForceReleaseOrRefund ? '1px solid var(--danger-border)' : '1px solid var(--border-light)',
                  background: canForceReleaseOrRefund ? 'rgba(239, 68, 68, 0.18)' : 'var(--bg-surface-2)',
                  color: canForceReleaseOrRefund ? 'var(--danger-text)' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: canForceReleaseOrRefund ? 'pointer' : 'not-allowed',
                }}
              >
                <XCircle size={15} /> Refund to Seller & Cancel
              </button>

              <button
                type="button"
                disabled={!canCancelDispute || resolvingDispute}
                onClick={() => openRemediationModal('CANCEL_DISPUTE')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: canCancelDispute ? '1px solid var(--warning-border)' : '1px solid var(--border-light)',
                  background: canCancelDispute ? 'rgba(245, 158, 11, 0.16)' : 'var(--bg-surface-2)',
                  color: canCancelDispute ? 'var(--warning-text)' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: canCancelDispute ? 'pointer' : 'not-allowed',
                }}
              >
                <RotateCcw size={15} /> Cancel Dispute (Resume Trade)
              </button>
            </div>
          </div>

          {/* Escrow & Counterparties Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '14px',
              marginBottom: '16px',
            }}
          >
            {/* Locked Escrow Box */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '6px' }}>
                <Lock size={14} /> Locked Escrow & Fiat Value
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {p2pMatch.quantity} {(p2pMatch.asset || '').toUpperCase()}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--accent-blue)', marginTop: '4px', fontWeight: 600 }}>
                Fiat: {p2pMatch.fiat_amount} {(p2pMatch.fiat_currency || '').toUpperCase()} (@ {p2pMatch.fixed_price}{' '}
                {(p2pMatch.fiat_currency || '').toUpperCase()})
              </div>
              {p2pMatch.disputed_by_role && (
                <div style={{ fontSize: '12px', color: 'var(--danger-text)', marginTop: '6px' }}>
                  Raised by: <strong>{p2pMatch.disputed_by_role}</strong> ({p2pMatch.disputed_by_user_id})
                </div>
              )}
            </div>

            {/* Buyer & Seller Box */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '6px' }}>
                <User size={14} /> Trade Counterparties
              </div>
              <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                      <span style={{ color: 'var(--success-text)', fontWeight: 700 }}>BUYER:</span>{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p2pMatch.buyer_name || 'User'}</span>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-tertiary)' }}>{p2pMatch.buyer_id}</div>
              </div>
              <div style={{ fontSize: '13px' }}>
                <span style={{ color: 'var(--warning-text)', fontWeight: 700 }}>SELLER (Escrow Depositor):</span>{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p2pMatch.seller_name || 'User'}</span>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-tertiary)' }}>{p2pMatch.seller_id}</div>
              </div>
            </div>

            {/* Payment Method Box */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '6px' }}>
                <CreditCard size={14} /> Payment Method Details
              </div>
              {p2pMatch.payment_method ? (
                <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {p2pMatch.payment_method.method}
                  </div>
                  {p2pMatch.payment_method.data &&
                    Object.entries(p2pMatch.payment_method.data).map(([k, v]) => (
                      <div key={k} style={{ color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        <span style={{ textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}:</span>{' '}
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{String(v)}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Payment Method ID: {p2pMatch.payment_method_id || 'N/A'}
                </div>
              )}
            </div>
          </div>

          {p2pMatch.dispute_resolution_notes && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid var(--success-border)',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '13px',
                color: 'var(--success-text)',
              }}
            >
              <strong>Admin Resolution Notes ({p2pMatch.dispute_resolved_by || 'Admin'}):</strong>{' '}
              {p2pMatch.dispute_resolution_notes}
            </div>
          )}
        </div>
      )}

      {/* Dual-Column Workspace when P2P Dispute is present, Single Column otherwise */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isP2PDispute && p2pMatch ? '1fr 1fr' : '1fr',
          gap: '20px',
        }}
      >
        {/* Column 1 (when P2P Dispute): Live P2P Order Chat (Buyer <-> Seller <-> Admin) */}
        {isP2PDispute && p2pMatch && (
          <div
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-light)',
                paddingBottom: '14px',
                marginBottom: '14px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={18} style={{ color: "var(--warning-text)" }} /> P2P Order Trade Chat (Buyer & Seller)
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  Messages sent here appear directly inside the Buyer and Seller&apos;s P2P trade chat.
                </div>
              </div>
              <button
                type="button"
                onClick={() => fetchP2PDisputeDetails(p2pMatch.id)}
                disabled={p2pLoading}
                style={{
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-primary)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {p2pLoading ? 'Syncing…' : 'Sync Chat'}
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '14px',
                background: 'var(--bg-surface)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                minHeight: '300px',
                maxHeight: '420px',
              }}
            >
              {p2pChatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                  No P2P trade chat messages exchanged yet. Send a message below to intervene in the trade chat.
                </div>
              ) : (
                p2pChatMessages.map((msg) => {
                  const isAdminMsg =
                    (msg.sender_id || '').startsWith('ADMIN:') ||
                    msg.sender_id === 'SYSTEM' ||
                    msg.sender_name === 'Limiance Support';
                  const isBuyer = msg.sender_id === p2pMatch.buyer_id;
                  const roleTag = isAdminMsg ? 'LIMIANCE SUPPORT' : isBuyer ? 'BUYER' : 'SELLER';
                  const bubbleBg = isAdminMsg
                    ? 'rgba(37, 99, 235, 0.28)'
                    : isBuyer
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'var(--bg-surface-2)';
                  const borderCol = isAdminMsg
                    ? 'rgba(59, 130, 246, 0.5)'
                    : isBuyer
                      ? 'rgba(16, 185, 129, 0.4)'
                      : 'var(--border-medium)';

                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isAdminMsg ? 'flex-end' : 'flex-start',
                        maxWidth: '88%',
                        background: bubbleBg,
                        border: `1px solid ${borderCol}`,
                        padding: '10px 14px',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '11px',
                          marginBottom: '4px',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            color: isAdminMsg ? 'var(--accent-blue)' : isBuyer ? 'var(--success-text)' : 'var(--warning-text)',
                          }}
                        >
                          [{roleTag}]
                        </span>
                        <span>{msg.sender_name || msg.sender_id}</span>
                        <span style={{ opacity: 0.7 }}>
                          · {msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: '13.5px', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendP2PChatMessage} style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={p2pChatInput}
                onChange={(e) => setP2pChatInput(e.target.value)}
                placeholder="Send message to Buyer & Seller in P2P trade chat..."
                required
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-primary)',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              />
              <button
                type="submit"
                disabled={sendingP2pChat}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  background: 'var(--warning-solid)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <Send size={14} /> {sendingP2pChat ? 'Sending…' : 'Send to P2P Chat'}
              </button>
            </form>
          </div>
        )}

        {/* Column 2: Support Ticket Thread */}
        <div
          style={{
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-light)',
            borderRadius: '12px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px',
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '14px',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{selectedTicket.subject}</h2>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                User ID: {selectedTicket.user_id} · Ticket: {selectedTicket.id}
              </div>
            </div>
          </div>

          {/* Status Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Ticket Status:</span>
            <select
              value={selectedTicket.status}
              onChange={(e) => handleUpdateStatus(e.target.value)}
              style={{
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-primary)',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            >
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>

          {/* Messages Thread Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px',
              background: 'var(--bg-surface)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minHeight: '300px',
              maxHeight: '420px',
            }}
          >
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>No messages in thread yet.</div>
            ) : (
              messages.map((m) => {
                const isAgent = m.sender_type === 'agent' || m.sender_type === 'admin';
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: isAgent ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      background: isAgent ? 'var(--primary-solid)' : 'var(--bg-surface-2)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      color: isAgent ? '#fff' : 'var(--text-primary)',
                    }}
                  >
                    <div style={{ fontSize: '11px', opacity: 0.85, marginBottom: '4px' }}>
                      {isAgent ? `Support Agent (${m.sender_id || 'Admin'})` : `Customer (${m.sender_id || 'User'})`} ·{' '}
                      {m.created_at ? new Date(m.created_at).toLocaleString() : ''}
                    </div>
                    <div style={{ fontSize: '13.5px', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>{m.body}</div>
                  </div>
                );
              })
            )}
          </div>

          {/* Reply Input Form */}
          <form onSubmit={handleSendReply} style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your official reply on the support ticket..."
              required
              style={{
                flex: 1,
                padding: '10px 14px',
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-primary)',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            />
            <button
              type="submit"
              disabled={replying}
              style={{
                padding: '10px 18px',
                background: 'var(--primary-solid)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {replying ? 'Sending...' : 'Reply Ticket'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
