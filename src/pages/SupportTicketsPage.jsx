import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { ShimmerTableRows } from '../components/Shimmer';
import { ShieldAlert, MessageSquare, RefreshCw } from 'lucide-react';

export default function SupportTicketsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'ALL';

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [disputeCount, setDisputeCount] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTickets = async (page = 1) => {
    setLoading(true);
    try {
      const statusParam = statusFilter === 'ALL' ? '' : `&status=${statusFilter}`;
      const categoryParam = categoryFilter === 'ALL' ? '' : `&category=${categoryFilter}`;
      const [res, disputesRes] = await Promise.all([
        api(`/api/support/tickets?page=${page}&limit=20${statusParam}${categoryParam}`),
        api('/api/p2p/disputes?page=1&limit=1').catch(() => null),
      ]);
      setTickets(res.tickets || []);
      setTotalRecords(res.total || 0);
      setCurrentPage(res.page || page);
      if (disputesRes && typeof disputesRes.total_records === 'number') {
        setDisputeCount(disputesRes.total_records);
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
      showToast(err.message || 'Failed to load tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(currentPage);
  }, [statusFilter, categoryFilter, currentPage]);

  const handleCategoryChange = (cat) => {
    setCategoryFilter(cat);
    setCurrentPage(1);
    if (cat === 'ALL') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', cat);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const statusColor = (st) => {
    switch (st) {
      case 'OPEN':
        return 'var(--danger-text)';
      case 'IN_PROGRESS':
        return 'var(--warning-text)';
      case 'RESOLVED':
        return 'var(--success-text)';
      case 'CLOSED':
        return 'var(--text-muted)';
      default:
        return 'var(--accent-blue)';
    }
  };

  const priorityColor = (pr) => {
    switch ((pr || '').toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'var(--danger-text)';
      case 'medium':
      case 'normal':
        return 'var(--accent-blue)';
      default:
        return 'var(--text-tertiary)';
    }
  };

  const totalPages = Math.ceil(totalRecords / 20) || 1;

  return (
    <div style={{ padding: '1.5rem 0', maxWidth: '1400px', margin: '0 auto' }}>
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '8px',
            background: toast.type === 'error' ? 'var(--danger-solid)' : 'var(--success-solid)',
            color: '#fff',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Support Tickets & P2P Disputes</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            Respond to customer inquiries, inspect P2P trade chats, and remediate disputed P2P escrow orders.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/p2p-disputes')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              border: '1px solid var(--danger-border)',
              background: 'rgba(239, 68, 68, 0.14)',
              color: 'var(--danger-text)',
              cursor: 'pointer',
            }}
          >
            <ShieldAlert size={15} />
            Active P2P Disputes Queue ({disputeCount})
          </button>
          <button
            onClick={() => fetchTickets(currentPage)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '500',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-surface-2)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Category & Status Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '1.25rem',
          padding: '12px 16px',
          background: 'var(--bg-surface-2)',
          border: '1px solid var(--border-medium)',
          borderRadius: '8px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, marginRight: '4px' }}>Category:</span>
          {[
            { key: 'ALL', label: 'All Tickets' },
            { key: 'P2P_DISPUTE', label: 'P2P Disputes' },
            { key: 'GENERAL', label: 'General Support' },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => handleCategoryChange(cat.key)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                border: categoryFilter === cat.key
                  ? cat.key === 'P2P_DISPUTE'
                    ? '1px solid var(--danger)'
                    : '1px solid var(--accent-blue)'
                  : '1px solid var(--border-light)',
                cursor: 'pointer',
                background:
                  categoryFilter === cat.key
                    ? cat.key === 'P2P_DISPUTE'
                      ? 'rgba(239, 68, 68, 0.2)'
                      : 'var(--primary-solid)'
                    : 'var(--bg-surface-2)',
                color: categoryFilter !== cat.key
                  ? 'var(--text-secondary)'
                  : cat.key === 'P2P_DISPUTE'
                    ? 'var(--danger-text)'
                    : '#fff',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, marginRight: '4px' }}>Status:</span>
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                background: statusFilter === st ? 'var(--primary-solid)' : 'var(--bg-surface-2)',
                color: statusFilter === st ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket List Table */}
      <div style={{ background: 'var(--bg-surface-2)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-medium)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-tertiary)', background: 'var(--bg-surface)' }}>
              <th style={{ padding: '12px 16px' }}>Ticket ID</th>
              <th style={{ padding: '12px 16px' }}>User / Parties</th>
              <th style={{ padding: '12px 16px' }}>Subject</th>
              <th style={{ padding: '12px 16px' }}>Category</th>
              <th style={{ padding: '12px 16px' }}>Priority</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Created</th>
              <th style={{ padding: '12px 16px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <ShimmerTableRows rows={6} cols={8} colWidths={['14%', '16%', '26%', '14%', '10%', '10%', '14%', '14%']} />
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  No support tickets found matching current filters.
                </td>
              </tr>
            ) : (
              tickets.map((t) => {
                const isP2PDispute = t.category === 'P2P_DISPUTE' || Boolean(t.order_match_id);
                return (
                  <tr
                    key={t.id}
                    style={{
                      borderBottom: '1px solid var(--border-medium)',
                      background: isP2PDispute && t.status === 'OPEN' ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                      <div>{t.id.slice(0, 12)}…</div>
                      {t.order_match_id && (
                        <div style={{ color: 'var(--warning-text)', fontSize: '11px', marginTop: '2px' }}>
                          Match: {t.order_match_id.slice(0, 8)}…
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                      <div>User: {t.user_id ? `${t.user_id.slice(0, 10)}…` : '—'}</div>
                      {t.counterparty_id && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                          Peer: {t.counterparty_id.slice(0, 10)}…
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '500', color: 'var(--text-primary)' }}>{t.subject}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {isP2PDispute ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: 'rgba(239, 68, 68, 0.16)',
                            color: 'var(--danger-text)',
                            border: '1px solid var(--danger-border)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '700',
                          }}
                        >
                          <ShieldAlert size={12} /> P2P DISPUTE
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: 'rgba(59, 130, 246, 0.12)',
                            color: 'var(--accent-blue)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                          }}
                        >
                          <MessageSquare size={12} /> {t.category || 'GENERAL'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          color: priorityColor(t.priority),
                          fontWeight: '600',
                          fontSize: '12px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {t.priority || 'normal'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          color: statusColor(t.status),
                          background: `color-mix(in srgb, ${statusColor(t.status)} 13%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${statusColor(t.status)} 33%, transparent)`,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                        }}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                      {t.created_at ? new Date(t.created_at).toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => navigate(`/support-tickets/${t.id}`)}
                        style={{
                          padding: '6px 12px',
                          background: isP2PDispute ? 'var(--danger-solid)' : '#374151',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        {isP2PDispute ? 'Remediate Dispute' : 'Reply & Manage'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            style={{ padding: '6px 12px', background: '#374151', color: '#fff', border: 'none', borderRadius: '4px' }}
          >
            Previous
          </button>
          <span style={{ alignSelf: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            style={{ padding: '6px 12px', background: '#374151', color: '#fff', border: 'none', borderRadius: '4px' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
