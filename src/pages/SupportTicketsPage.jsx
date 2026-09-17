import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function SupportTicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTickets = async (page = 1) => {
    setLoading(true);
    try {
      const statusParam = statusFilter === 'ALL' ? '' : `&status=${statusFilter}`;
      const res = await api(`/api/support/tickets?page=${page}&limit=20${statusParam}`);
      setTickets(res.tickets || []);
      setTotalRecords(res.total || 0);
      setCurrentPage(res.page || page);
    } catch (err) {
      console.error('Failed to load tickets', err);
      showToast(err.message || 'Failed to load tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(currentPage);
  }, [statusFilter, currentPage]);

  const openTicketThread = async (ticket) => {
    setSelectedTicket(ticket);
    setMessages([]);
    setReplyText('');
    setThreadLoading(true);

    try {
      const res = await api(`/api/support/tickets/${ticket.id}`);
      setSelectedTicket(res.ticket || ticket);
      setMessages(res.messages || []);
    } catch (err) {
      showToast(err.message || 'Failed to load message thread', 'error');
    } finally {
      setThreadLoading(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setReplying(true);
    try {
      await api(`/api/support/tickets/${selectedTicket.id}/replies`, {
        method: 'POST',
        body: JSON.stringify({ body: replyText.trim() }),
      });
      showToast('Agent reply sent successfully.');
      setReplyText('');
      // Refresh thread
      const res = await api(`/api/support/tickets/${selectedTicket.id}`);
      setSelectedTicket(res.ticket || selectedTicket);
      setMessages(res.messages || []);
      fetchTickets(currentPage);
    } catch (err) {
      showToast(err.message || 'Failed to send reply', 'error');
    } finally {
      setReplying(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTicket) return;

    try {
      await api(`/api/support/tickets/${selectedTicket.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      showToast(`Ticket status updated to ${newStatus}.`);
      setSelectedTicket({ ...selectedTicket, status: newStatus });
      fetchTickets(currentPage);
    } catch (err) {
      showToast(err.message || 'Failed to update ticket status', 'error');
    }
  };

  const statusColor = (st) => {
    switch (st) {
      case 'OPEN':
        return '#ef4444';
      case 'IN_PROGRESS':
        return '#f59e0b';
      case 'RESOLVED':
        return '#10b981';
      case 'CLOSED':
        return '#6b7280';
      default:
        return '#3b82f6';
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
            background: toast.type === 'error' ? '#EF4444' : '#10B981',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>Support Tickets & Inquiries</h1>
          <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: '0.875rem' }}>
            Respond to user requests, resolve inquiries, and update lifecycle statuses.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
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
                background: statusFilter === st ? '#3b82f6' : '#1f2937',
                color: '#fff',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket List Table */}
      <div style={{ background: '#111827', borderRadius: '8px', overflow: 'hidden', border: '1px solid #1f2937' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #374151', color: '#9ca3af', background: '#161e2e' }}>
              <th style={{ padding: '12px 16px' }}>Ticket ID</th>
              <th style={{ padding: '12px 16px' }}>User ID</th>
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
              <tr>
                <td colSpan="8" style={{ padding: '2.5rem', textAlign: 'center', color: '#9ca3af' }}>
                  Loading support tickets...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '2.5rem', textAlign: 'center', color: '#9ca3af' }}>
                  No support tickets found.
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #1f2937' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#9ca3af', fontSize: '12px' }}>
                    {t.id}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#9ca3af', fontSize: '12px' }}>
                    {t.user_id}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#fff' }}>{t.subject}</td>
                  <td style={{ padding: '12px 16px', color: '#d1d5db' }}>{t.category || 'General'}</td>
                  <td style={{ padding: '12px 16px', color: '#d1d5db' }}>{t.priority || 'Normal'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        color: statusColor(t.status),
                        background: statusColor(t.status) + '22',
                        border: `1px solid ${statusColor(t.status)}55`,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '12px' }}>
                    {t.created_at ? new Date(t.created_at).toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => navigate(`/support-tickets/${t.id}`)}
                      style={{
                        padding: '5px 12px',
                        background: '#374151',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Reply & Manage
                    </button>
                  </td>
                </tr>
              ))
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
          <span style={{ alignSelf: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
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
