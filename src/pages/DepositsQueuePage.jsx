import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import './DepositsQueuePage.css';
import { ShimmerTableRows } from '../components/Shimmer';

export default function DepositsQueuePage() {
  const navigate = useNavigate();
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const statusParam = statusFilter === 'ALL' ? '' : statusFilter.toLowerCase();
      const res = await api(`/api/deposits?page=${currentPage}&limit=20&status=${statusParam}`);
      setDeposits(res.transactions || []);
      setTotalPages(res.total_pages || 1);
      setTotalRecords(res.total_records || 0);
    } catch (err) {
      console.error('Failed to fetch deposits', err);
      showToast(err.message || 'Failed to fetch deposits', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, [statusFilter, currentPage]);

  const openDetail = async (dep) => {
    setSelected(dep.id);
    setDetail(dep);
    setDetailLoading(true);
    try {
      const res = await api(`/api/deposits/${dep.id}`);
      setDetail(res);
    } catch (err) {
      console.warn('Could not refresh deposit details', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setDetail(null);
  };

  const statusBadge = (status) => {
    const s = (status || 'pending').toLowerCase();
    const bg = s === 'completed' ? 'var(--success)' : s === 'failed' ? 'var(--danger)' : 'var(--warning)';
    return (
      <span
        style={{
          background: `color-mix(in srgb, ${bg} 13%, transparent)`,
          color: bg,
          border: `1px solid color-mix(in srgb, ${bg} 33%, transparent)`,
          padding: '2px 8px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: '600',
          textTransform: 'uppercase',
        }}
      >
        {s}
      </span>
    );
  };

  return (
    <div className="dq-page">
      {toast && <div className={`dq-toast ${toast.type}`}>{toast.msg}</div>}

      <div className="dq-header">
        <div>
          <h1 className="dq-title">Deposit Ledger & Exceptions</h1>
          <p className="dq-subtitle">
            Live on-chain deposit events recorded across supported blockchain networks.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="dq-count-badge">{totalRecords} Total Records</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'COMPLETED', 'PENDING', 'FAILED'].map((st) => (
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
                  background: statusFilter === st ? '#3b82f6' : 'var(--bg-surface-2)',
                  color: statusFilter === st ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="dq-table-wrap">
        <table className="dq-table">
          <thead>
            <tr>
              <th>Tx ID</th>
              <th>User ID</th>
              <th>Asset / Chain</th>
              <th>Amount</th>
              <th>Fee</th>
              <th>Status</th>
              <th>Confirmations</th>
              <th>Timestamp</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <ShimmerTableRows rows={6} cols={9} colWidths={['20%', '25%', '20%', '25%', '15%', '15%', '20%', '25%', '15%']} />
            ) : deposits.length === 0 ? (
              <tr>
                <td colSpan="9" className="dq-empty">
                  <div className="dq-empty-icon">✓</div>
                  No deposit transactions found matching this filter.
                </td>
              </tr>
            ) : (
              deposits.map((dep) => (
                <tr key={dep.id} className="dq-row">
                  <td className="dq-mono" style={{ fontSize: '12px' }}>
                    {dep.id}
                  </td>
                  <td className="dq-mono" style={{ fontSize: '12px' }}>
                    {dep.user_id || dep.from_user_id || '—'}
                  </td>
                  <td>
                    <span className="dq-asset-badge">{dep.asset}</span>
                    <span className="dq-network">{dep.chain}</span>
                  </td>
                  <td className="dq-amount">
                    {dep.amount} {dep.asset}
                  </td>
                  <td style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>{dep.fee || '0'}</td>
                  <td>{statusBadge(dep.status)}</td>
                  <td>{dep.confirmations ?? 0}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {dep.created_at ? new Date(dep.created_at).toLocaleString() : '—'}
                  </td>
                  <td>
                    <button className="dq-btn-review" onClick={() => navigate(`/deposits-queue/${dep.id}`)}>
                      Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            style={{ padding: '6px 12px', background: '#374151', color: '#fff', borderRadius: '4px', border: 'none' }}
          >
            Previous
          </button>
          <span style={{ alignSelf: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            style={{ padding: '6px 12px', background: '#374151', color: '#fff', borderRadius: '4px', border: 'none' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
