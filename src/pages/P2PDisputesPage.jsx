import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { ShimmerTableRows } from '../components/Shimmer';
import { ShieldAlert, RefreshCw, ArrowLeft, ExternalLink } from 'lucide-react';

export default function P2PDisputesPage() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchDisputes = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api(`/api/p2p/disputes?page=${page}&limit=20`);
      setMatches(res.matches || []);
      setTotalRecords(res.total_records || 0);
      setCurrentPage(res.current_page || page);
    } catch (err) {
      showToast(err.message || 'Failed to load disputed P2P orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes(currentPage);
  }, [currentPage]);

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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={22} style={{ color: "var(--danger-text)" }} />
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>P2P Escrow Disputes Queue</h1>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            All P2P order matches currently in DISPUTED status requiring escrow release, seller refund, or dispute dismissal.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate('/support-tickets?category=P2P_DISPUTE')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-surface-2)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={14} /> View All P2P Dispute Tickets
          </button>
          <button
            onClick={() => fetchDisputes(currentPage)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
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

      <div style={{ background: 'var(--bg-surface-2)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-medium)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-tertiary)', background: 'var(--bg-surface)' }}>
              <th style={{ padding: '12px 16px' }}>Match ID</th>
              <th style={{ padding: '12px 16px' }}>Escrow Locked</th>
              <th style={{ padding: '12px 16px' }}>Fiat Value</th>
              <th style={{ padding: '12px 16px' }}>Buyer</th>
              <th style={{ padding: '12px 16px' }}>Seller</th>
              <th style={{ padding: '12px 16px' }}>Raised By</th>
              <th style={{ padding: '12px 16px' }}>Created</th>
              <th style={{ padding: '12px 16px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <ShimmerTableRows rows={5} cols={8} colWidths={['14%', '14%', '14%', '14%', '14%', '10%', '10%', '10%']} />
            ) : matches.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  No active P2P disputes found.
                </td>
              </tr>
            ) : (
              matches.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--border-medium)', background: 'rgba(239, 68, 68, 0.04)' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: 'var(--text-primary)', fontSize: '12px' }}>
                    <div>{m.id.slice(0, 12)}…</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Order: {m.order_id?.slice(0, 8)}…</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {m.quantity} {(m.asset || '').toUpperCase()}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--accent-blue)', fontWeight: 600 }}>
                    {m.fiat_amount} {(m.fiat_currency || '').toUpperCase()}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px' }}>
                    <div style={{ color: 'var(--success-text)', fontWeight: 600 }}>{m.buyer_name || 'Buyer'}</div>
                    <div style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: '11px' }}>{m.buyer_id?.slice(0, 10)}…</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px' }}>
                    <div style={{ color: 'var(--warning-text)', fontWeight: 600 }}>{m.seller_name || 'Seller'}</div>
                    <div style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: '11px' }}>{m.seller_id?.slice(0, 10)}…</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        background: 'rgba(239, 68, 68, 0.16)',
                        color: 'var(--danger-text)',
                        border: '1px solid var(--danger-border)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      {m.disputed_by_role || 'DISPUTED'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                    {m.created_at ? new Date(m.created_at).toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {m.support_ticket_id ? (
                      <button
                        onClick={() => navigate(`/support-tickets/${m.support_ticket_id}`)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: 'var(--danger-solid)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        Remediate & Chat <ExternalLink size={12} />
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/support-tickets?category=P2P_DISPUTE`)}
                        style={{
                          padding: '6px 12px',
                          background: '#374151',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Open Ticket
                      </button>
                    )}
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
