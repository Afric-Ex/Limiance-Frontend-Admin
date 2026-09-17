import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  ListFilter,
  Search,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  Sliders,
} from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [symbolFilter, setSymbolFilter] = useState('');
  const [sideFilter, setSideFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', '20');
      if (symbolFilter) params.append('symbol', symbolFilter);
      if (sideFilter) params.append('side', sideFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (userIdFilter) params.append('userId', userIdFilter);

      const res = await api(`/api/orders?${params.toString()}`);
      if (res.data) {
        setOrders(res.data);
        setTotalRecords(res.totalRecords || 0);
        setTotalPages(Math.ceil((res.totalRecords || 0) / 20) || 1);
      } else if (Array.isArray(res)) {
        setOrders(res);
        setTotalRecords(res.length);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, sideFilter, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const resetFilters = () => {
    setSymbolFilter('');
    setSideFilter('');
    setStatusFilter('');
    setUserIdFilter('');
    setPage(1);
  };

  const getStatusBadge = (st) => {
    const status = (st || 'FILLED').toUpperCase();
    if (status === 'FILLED' || status === 'COMPLETED') {
      return {
        bg: 'rgba(16, 185, 129, 0.12)',
        color: '#34d399',
        border: 'rgba(16, 185, 129, 0.25)',
        icon: <CheckCircle size={12} />,
      };
    }
    if (status === 'OPEN' || status === 'PENDING' || status === 'PARTIALLY_FILLED') {
      return {
        bg: 'rgba(59, 130, 246, 0.12)',
        color: '#60a5fa',
        border: 'rgba(59, 130, 246, 0.25)',
        icon: <Clock size={12} />,
      };
    }
    return {
      bg: 'rgba(239, 68, 68, 0.12)',
      color: '#f87171',
      border: 'rgba(239, 68, 68, 0.25)',
      icon: <XCircle size={12} />,
    };
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#fff' }}>
            Exchange Orders & Trades Explorer
          </h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>
            Inspect platform-wide order execution, matching engine fills, sides, fee collections, and user counterparties.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          style={{
            padding: '8px 14px',
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
          <RefreshCw size={14} /> Refresh Fills
        </button>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          background: '#13151c',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
          padding: '18px 20px',
          marginBottom: '20px',
        }}
      >
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            <input
              type="text"
              placeholder="Market (e.g. BTC/USDT)..."
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value.toUpperCase())}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '8px',
                background: '#181a22',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            <input
              type="text"
              placeholder="Filter by User UUID..."
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '8px',
                background: '#181a22',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          <select
            value={sideFilter}
            onChange={(e) => {
              setSideFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: '#181a22',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="">All Sides</option>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: '#181a22',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="">All Statuses</option>
            <option value="FILLED">FILLED</option>
            <option value="OPEN">OPEN</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          <button
            type="submit"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: '#4d77f0',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Apply Filter
          </button>

          {(symbolFilter || sideFilter || statusFilter || userIdFilter) && (
            <button
              type="button"
              onClick={resetFilters}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>
            Showing {orders.length} of {totalRecords} orders
          </div>
        </form>
      </div>

      {/* Orders Table */}
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
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Order ID / User</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Market Pair</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Side</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Price</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Quantity</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Quote Total</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Fee</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Status</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                  Loading order stream...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                  No orders match the current filter criteria.
                </td>
              </tr>
            ) : (
              orders.map((ord) => {
                const badge = getStatusBadge(ord.status);
                const isBuy = (ord.side || '').toUpperCase() === 'BUY';
                return (
                  <tr key={ord.id || ord.order_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                        {(ord.id || ord.order_id || 'ORD').slice(0, 10)}...
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                        User: {(ord.user_id || 'N/A').slice(0, 8)}...
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                      {ord.symbol || `${ord.base}/${ord.quote}`}
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
                          fontWeight: 700,
                          background: isBuy ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: isBuy ? '#34d399' : '#f87171',
                          border: `1px solid ${isBuy ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                        }}
                      >
                        {isBuy ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                        {ord.side}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      ${Number(ord.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-mono)' }}>
                      {ord.quantity || ord.amount || 0}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#818cf8', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      ${Number(ord.quote_amount || ord.total || (Number(ord.price || 0) * Number(ord.quantity || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#fbbf24', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                      {ord.fee || ord.fee_paid || '0'} {ord.fee_asset || ''}
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
                        {ord.status || 'FILLED'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                      {ord.created_at ? new Date(ord.created_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div
          style={{
            padding: '14px 20px',
            background: '#181a22',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            Page {page} of {totalPages}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                background: page <= 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: page <= 1 ? 'rgba(255,255,255,0.2)' : '#fff',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '12px',
              }}
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                background: page >= totalPages ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: page >= totalPages ? 'rgba(255,255,255,0.2)' : '#fff',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
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
