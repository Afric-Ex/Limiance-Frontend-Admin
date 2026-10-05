import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import {
  ArrowRightLeft,
  Search,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
  XCircle,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { getBlockchainNetwork } from '../utils/chain';
import { ShimmerTableRows } from '../components/Shimmer';

export default function TransactionsPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, deposit, withdrawal
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchId, setSearchId] = useState('');

  // Single transaction inspection drawer / modal
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // If filtering deposits specifically or ALL
      const statusParam = statusFilter === 'ALL' ? '' : `&status=${statusFilter.toLowerCase()}`;
      
      // Note: Backend has /api/deposits (which lists deposits) and /api/withdrawals/pending
      // We query /api/deposits with pagination
      const res = await api(`/api/deposits?page=${currentPage}&limit=25${statusParam}`);
      let list = res.transactions || res.data || [];
      
      if (typeFilter !== 'ALL') {
        list = list.filter((t) => (t.type || '').toLowerCase() === typeFilter.toLowerCase());
      }
      if (searchId.trim()) {
        const q = searchId.trim().toLowerCase();
        list = list.filter(
          (t) =>
            (t.id || '').toLowerCase().includes(q) ||
            (t.tx_hash || t.txHash || '').toLowerCase().includes(q) ||
            (t.user_id || '').toLowerCase().includes(q) ||
            (t.address || '').toLowerCase().includes(q)
        );
      }

      setTransactions(list);
      setTotalPages(res.total_pages || 1);
      setTotalRecords(res.total_records || list.length);
    } catch (err) {
      console.error('Failed to load transactions', err);
      showToast(err.message || 'Failed to load transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, statusFilter, typeFilter]);

  const openTransactionDetail = async (txn) => {
    setSelectedTxn(txn);
    setDetailLoading(true);
    try {
      // Fetch fresh transaction row by ID
      const res = await api(`/api/deposits/${txn.id}`);
      setSelectedTxn(res.transaction || res);
    } catch (err) {
      console.warn('Could not fetch single transaction details', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const getStatusBadge = (st) => {
    const s = (st || 'PENDING').toLowerCase();
    if (s === 'completed' || s === 'confirmed' || s === 'success') {
      return {
        label: 'COMPLETED',
        bg: 'rgba(16, 185, 129, 0.12)',
        color: '#34d399',
        border: 'rgba(16, 185, 129, 0.25)',
        icon: <CheckCircle size={12} />,
      };
    }
    if (s === 'pending' || s === 'processing') {
      return {
        label: 'PENDING',
        bg: 'rgba(245, 158, 11, 0.12)',
        color: '#fbbf24',
        border: 'rgba(245, 158, 11, 0.25)',
        icon: <Clock size={12} />,
      };
    }
    return {
      label: s.toUpperCase(),
      bg: 'rgba(239, 68, 68, 0.12)',
      color: '#f87171',
      border: 'rgba(239, 68, 68, 0.25)',
      icon: <XCircle size={12} />,
    };
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', position: 'relative' }}>
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: toast.type === 'error' ? '#ef4444' : '#10b981',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          <CheckCircle size={16} />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#fff' }}>
            Transactions & Treasury Ledger
          </h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>
            Inspect on-chain and off-chain cashflows, deposit confirmations, network hashes, and single transaction state.
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          style={{
            padding: '8px 16px',
            background: '#1c1e28',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} /> Refresh Ledger
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div
        style={{
          background: '#13151c',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
          <div style={{ position: 'relative', minWidth: '320px', flex: 1 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.4)',
              }}
            />
            <input
              type="text"
              placeholder="Search by TxID, TxHash, User UUID or Address..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                background: '#181a22',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'deposit', 'withdrawal'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTypeFilter(t);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: typeFilter === t ? '#4d77f0' : 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: typeFilter === t ? '#fff' : 'rgba(255,255,255,0.6)',
                  fontWeight: 600,
                  fontSize: '12px',
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                }}
              >
                {t === 'ALL' ? 'All Types' : t}
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: '#181a22',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>
          Showing {transactions.length} of {totalRecords} records
        </div>
      </div>

      {/* Transactions Table */}
      <div
        style={{
          background: '#13151c',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
          overflowX: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#181a22', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>TxID / Type</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>User UUID</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Asset / Network</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Amount</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Destination Address</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Status</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Date & Time</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <ShimmerTableRows rows={7} cols={8} colWidths={['15%', '25%', '25%', '20%', '35%', '20%', '25%', '15%']} />
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                  No transactions found matching your filter criteria.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const badge = getStatusBadge(tx.status);
                const isDeposit = (tx.type || '').toLowerCase() === 'deposit';
                return (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: isDeposit ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: isDeposit ? '#34d399' : '#f87171',
                            border: `1px solid ${isDeposit ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                          }}
                        >
                          {isDeposit ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                          {(tx.type || 'TXN').toUpperCase()}
                        </span>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                          {(tx.id || '').slice(0, 8)}...
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#a5b4fc' }}>
                          {(tx.user_id || 'N/A').slice(0, 10)}...
                        </span>
                        <button
                          onClick={() => copyToClipboard(tx.user_id)}
                          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 0 }}
                        >
                          <Copy size={11} />
                        </button>
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px', fontWeight: 600, color: '#fff', fontSize: '13px' }}>
                      {(() => {
                        const net = getBlockchainNetwork(tx, tx.address || tx.to_address);
                        const assetSymbol = tx.asset || tx.currency || tx.symbol || net.code;
                        return (
                          <>
                            <span style={{ padding: '2px 6px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', borderRadius: '4px', marginRight: '6px' }}>
                              {assetSymbol}
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                              {tx.network || net.name}
                            </span>
                          </>
                        );
                      })()}
                    </td>

                    <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff' }}>
                      {tx.amount || '0.00'}
                    </td>

                    <td style={{ padding: '14px 18px', maxWidth: '240px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.address || tx.to_address || '—'}
                        </span>
                        {tx.address && (
                          <button
                            onClick={() => copyToClipboard(tx.address)}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 0 }}
                          >
                            <Copy size={11} />
                          </button>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {badge.icon}
                        {badge.label}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>
                      {tx.created_at ? new Date(tx.created_at).toLocaleString() : '—'}
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button
                        onClick={() => navigate(`/transactions/${tx.id}`)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: '#1c1e28',
                          border: '1px solid rgba(255,255,255,0.12)',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Eye size={12} /> Inspect
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#181a22',
          }}
        >
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
            Showing page {currentPage} of {totalPages} ({totalRecords.toLocaleString()} transactions)
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                background: currentPage <= 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: currentPage <= 1 ? 'rgba(255,255,255,0.2)' : '#fff',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '12px',
              }}
            >
              Previous
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                background: currentPage >= totalPages ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: currentPage >= totalPages ? 'rgba(255,255,255,0.2)' : '#fff',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                fontSize: '12px',
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
