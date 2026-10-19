import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Search,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { ShimmerTableRows } from '../components/Shimmer';

const PAGE_SIZE = 20;

// If /api/orders expects "BTCUSDT" instead of "BTC/USDT" for `symbol`,
// change this to: (pair) => pair.replace('/', '')
const toApiSymbol = (pair) => pair;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const KNOWN_QUOTES = ['USDT', 'USDC', 'BUSD', 'USD', 'NGN', 'EUR', 'BTC', 'ETH', 'BNB', 'SOL'];

// Accepts "BTC/USDT", "BTC-USDT", "BTCUSDT" or { base, quote } style objects
// and always returns "BASE/QUOTE" (or null if it can't be understood).
function normalizePair(raw) {
  if (!raw) return null;

  if (typeof raw === 'string') {
    const s = raw.trim().toUpperCase();
    if (/[/\-_:]/.test(s)) {
      const [b, q] = s.split(/[/\-_:]/);
      return b && q ? `${b}/${q}` : null;
    }
    const quote = KNOWN_QUOTES.find((q) => s.endsWith(q) && s.length > q.length);
    return quote ? `${s.slice(0, -quote.length)}/${quote}` : null;
  }

  if (typeof raw !== 'object') return null;

  const base =
    raw.base ?? raw.base_asset ?? raw.baseAsset ?? raw.base_currency ?? raw.baseCurrency ?? raw.baseSymbol;
  const quote =
    raw.quote ?? raw.quote_asset ?? raw.quoteAsset ?? raw.quote_currency ?? raw.quoteCurrency ?? raw.quoteSymbol;

  if (base && quote) return `${String(base).toUpperCase()}/${String(quote).toUpperCase()}`;

  const combined = raw.symbol ?? raw.pair ?? raw.name ?? raw.ticker;
  return typeof combined === 'string' ? normalizePair(combined) : null;
}

// Some API clients return a fetch Response, others return parsed JSON.
async function unwrapResponse(res) {
  if (res && typeof res.json === 'function' && typeof res.ok === 'boolean') {
    if (!res.ok) throw new Error(`Request failed (HTTP ${res.status})`);
    return res.json();
  }
  return res;
}

// Finds the array of pairs whether the API returns [..], {pairs:[..]},
// {data:[..]}, {data:{pairs:[..]}}, {result:[..]}, etc.
function extractPairList(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  for (const key of ['pairs', 'data', 'result', 'results', 'items', 'markets', 'symbols']) {
    const v = payload[key];
    if (Array.isArray(v)) return v;
    if (v && typeof v === 'object') {
      const nested = extractPairList(v);
      if (nested.length) return nested;
    }
  }
  return [];
}

const LIST_KEYS = ['data', 'orders', 'items', 'results', 'rows', 'trades'];
const TOTAL_KEYS = ['totalRecords', 'total_records', 'total', 'totalCount', 'total_count'];

function findArray(obj) {
  if (!obj || typeof obj !== 'object') return null;
  for (const k of LIST_KEYS) {
    if (Array.isArray(obj[k])) return obj[k];
  }
  return null;
}

function findTotal(obj) {
  if (!obj || typeof obj !== 'object') return null;
  for (const k of TOTAL_KEYS) {
    if (obj[k] != null && Number.isFinite(Number(obj[k]))) return Number(obj[k]);
  }
  return null;
}

// Returns { list, total } where total is null when the API doesn't report one.
function parseOrdersResponse(payload) {
  if (Array.isArray(payload)) return { list: payload, total: null };

  const inner =
    payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data) ? payload.data : null;

  return {
    list: findArray(payload) ?? findArray(inner),
    total:
      findTotal(payload) ??
      findTotal(payload?.pagination) ??
      findTotal(payload?.meta) ??
      findTotal(inner) ??
      findTotal(inner?.pagination),
  };
}

const pick = (o, ...keys) => {
  for (const k of keys) {
    if (o?.[k] != null && o[k] !== '') return o[k];
  }
  return undefined;
};

// Accepts both snake_case and camelCase payloads and never throws on missing fields.
function normalizeOrder(o) {
  const base = pick(o, 'base', 'base_asset', 'baseAsset');
  const quote = pick(o, 'quote', 'quote_asset', 'quoteAsset');
  const symbol = pick(o, 'symbol', 'pair', 'market') ?? (base && quote ? `${base}/${quote}` : '—');

  const price = Number(pick(o, 'price', 'avg_price', 'avgPrice')) || 0;
  const quantity = Number(pick(o, 'quantity', 'amount', 'qty')) || 0;
  const explicitTotal = pick(o, 'quote_amount', 'quoteAmount', 'total', 'quoteTotal');

  return {
    id: String(pick(o, 'id', 'order_id', 'orderId') ?? ''),
    userId: String(pick(o, 'user_id', 'userId') ?? ''),
    symbol: String(symbol),
    side: String(pick(o, 'side') ?? '').toUpperCase(),
    price,
    quantity,
    total: explicitTotal != null ? Number(explicitTotal) || 0 : price * quantity,
    fee: pick(o, 'fee', 'fee_paid', 'feePaid') ?? 0,
    feeAsset: pick(o, 'fee_asset', 'feeAsset') ?? '',
    status: String(pick(o, 'status') ?? 'FILLED'),
    createdAt: pick(o, 'created_at', 'createdAt', 'timestamp', 'time'),
  };
}

function formatTime(v) {
  if (v == null) return '—';
  const asNumber = Number(v);
  const d =
    typeof v === 'number' || /^\d+$/.test(String(v))
      ? new Date(asNumber < 1e12 ? asNumber * 1000 : asNumber) // seconds vs ms
      : new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

const shorten = (s, n) => (s ? `${s.slice(0, n)}...` : 'N/A');

/* -------------------------------------------------------------------------- */
/*  Styles                                                                    */
/* -------------------------------------------------------------------------- */

const inputBase = {
  borderRadius: '8px',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-medium)',
  color: 'var(--text-primary)',
  fontSize: '13px',
  outline: 'none',
};

const thStyle = {
  padding: '12px 18px',
  fontSize: '11px',
  fontWeight: 700,
  color: 'var(--text-muted)',
};

const alertStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  padding: '10px 14px',
  marginBottom: '16px',
  borderRadius: '10px',
  background: 'rgba(239, 68, 68, 0.12)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  color: 'var(--danger-text)',
  fontSize: '13px',
};

const alertButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  background: 'var(--overlay-2)',
  border: '1px solid var(--border-medium)',
  color: 'var(--text-primary)',
  borderRadius: '8px',
  padding: '5px 10px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

const COLUMNS = [
  'Order ID / User',
  'Market Pair',
  'Side',
  'Price',
  'Quantity',
  'Quote Total',
  'Fee',
  'Status',
  'Time',
];

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);

  const [pairs, setPairs] = useState([]);
  const [pairsLoading, setPairsLoading] = useState(true);
  const [pairsError, setPairsError] = useState(null);
  const [pairsReload, setPairsReload] = useState(0);

  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(null); // null = API didn't report a total
  const [hasMore, setHasMore] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [symbolFilter, setSymbolFilter] = useState('');
  const [sideFilter, setSideFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userIdInput, setUserIdInput] = useState(''); // what the user is typing
  const [userIdFilter, setUserIdFilter] = useState(''); // what has been applied

  /* ---------------------------- Load trading pairs ---------------------------- */
  useEffect(() => {
    let cancelled = false;

    async function loadPairs() {
      setPairsLoading(true);
      setPairsError(null);
      try {
        const raw = await api('/api/pairs');
        const payload = await unwrapResponse(raw);
        const formatted = [...new Set(extractPairList(payload).map(normalizePair).filter(Boolean))];

        if (cancelled) return;

        if (formatted.length === 0) {
          console.warn('[orders] /api/pairs returned no usable pairs. Raw response:', payload);
          setPairsError('No trading pairs were found in the response.');
        }
        setPairs(formatted);
      } catch (err) {
        console.error('[orders] failed to load trading pairs:', err);
        if (!cancelled) setPairsError(err?.message || 'Failed to load trading pairs');
      } finally {
        if (!cancelled) setPairsLoading(false);
      }
    }

    loadPairs();
    return () => {
      cancelled = true;
    };
  }, [pairsReload]);

  /* ------------------------------- Load orders -------------------------------- */
  // Re-runs whenever a filter, the page, or refreshKey changes. The `cancelled`
  // flag drops responses from superseded requests, so a slow old response can
  // never overwrite a newer one.
  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      setLoading(true);
      setOrdersError(null);
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (symbolFilter) params.append('symbol', toApiSymbol(symbolFilter));
        if (sideFilter) params.append('side', sideFilter);
        if (statusFilter) params.append('status', statusFilter);
        if (userIdFilter) params.append('userId', userIdFilter);

        const raw = await api(`/api/orders?${params.toString()}`);
        const payload = await unwrapResponse(raw);
        const { list, total } = parseOrdersResponse(payload);

        if (cancelled) return;

        if (!list) {
          console.warn('[orders] unexpected /api/orders response:', payload);
          throw new Error('Unexpected response format from /api/orders.');
        }

        setOrders(list.map(normalizeOrder));
        setTotalRecords(total);
        setHasMore(list.length === PAGE_SIZE);
      } catch (err) {
        console.error('[orders] failed to load orders:', err);
        if (!cancelled) {
          setOrders([]);
          setOrdersError(err?.message || 'Failed to load orders');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, [page, symbolFilter, sideFilter, statusFilter, userIdFilter, refreshKey]);

  /* -------------------------------- Handlers ---------------------------------- */
  const handleSearch = (e) => {
    e.preventDefault();
    setUserIdFilter(userIdInput.trim());
    setPage(1);
    setRefreshKey((k) => k + 1); // refetch even if nothing else changed
  };

  const resetFilters = () => {
    setSymbolFilter('');
    setSideFilter('');
    setStatusFilter('');
    setUserIdInput('');
    setUserIdFilter('');
    setPage(1);
    setRefreshKey((k) => k + 1);
  };

  const refresh = () => setRefreshKey((k) => k + 1);

  const getStatusBadge = (st) => {
    const status = (st || 'FILLED').toUpperCase();
    if (status === 'FILLED' || status === 'COMPLETED') {
      return {
        bg: 'rgba(16, 185, 129, 0.12)',
        color: 'var(--success-text)',
        border: 'rgba(16, 185, 129, 0.25)',
        icon: <CheckCircle size={12} />,
      };
    }
    if (status === 'OPEN' || status === 'PENDING' || status === 'PARTIALLY_FILLED') {
      return {
        bg: 'rgba(59, 130, 246, 0.12)',
        color: 'var(--accent-blue)',
        border: 'rgba(59, 130, 246, 0.25)',
        icon: <Clock size={12} />,
      };
    }
    return {
      bg: 'rgba(239, 68, 68, 0.12)',
      color: 'var(--danger-text)',
      border: 'rgba(239, 68, 68, 0.25)',
      icon: <XCircle size={12} />,
    };
  };

  /* ------------------------------ Derived values ------------------------------ */
  const totalKnown = totalRecords !== null;
  const totalPages = totalKnown ? Math.max(1, Math.ceil(totalRecords / PAGE_SIZE)) : null;
  const canGoNext = totalKnown ? page < totalPages : hasMore;
  const anyFilter = symbolFilter || sideFilter || statusFilter || userIdInput || userIdFilter;

  /* ---------------------------------- Render ---------------------------------- */
  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Exchange Orders & Trades Explorer
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-tertiary)', fontSize: '13px' }}>
            Inspect platform-wide order execution, matching engine fills, sides, fee collections, and user counterparties.
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          style={{
            padding: '8px 14px',
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
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

      {/* Errors */}
      {pairsError && (
        <div style={alertStyle} role="alert">
          <span>Couldn't load markets: {pairsError}</span>
          <button type="button" style={alertButtonStyle} onClick={() => setPairsReload((n) => n + 1)}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}
      {ordersError && (
        <div style={alertStyle} role="alert">
          <span>Couldn't load orders: {ordersError}</span>
          <button type="button" style={alertButtonStyle} onClick={refresh}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '18px 20px',
          marginBottom: '20px',
        }}
      >
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={symbolFilter}
            onChange={(e) => {
              setSymbolFilter(e.target.value);
              setPage(1);
            }}
            disabled={pairsLoading}
            style={{ ...inputBase, width: '220px', padding: '8px 12px' }}
          >
            <option value="">{pairsLoading ? 'Loading markets…' : 'All Markets'}</option>
            {pairs.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <div style={{ position: 'relative', width: '260px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Filter by User UUID..."
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              style={{ ...inputBase, width: '100%', padding: '8px 12px 8px 34px' }}
            />
          </div>

          <select
            value={sideFilter}
            onChange={(e) => {
              setSideFilter(e.target.value);
              setPage(1);
            }}
            style={{ ...inputBase, padding: '8px 14px' }}
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
            style={{ ...inputBase, padding: '8px 14px' }}
          >
            <option value="">All Statuses</option>
            <option value="FILLED">FILLED</option>
            <option value="OPEN">OPEN</option>
            <option value="PARTIALLY_FILLED">PARTIALLY_FILLED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          <button
            type="submit"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'var(--primary-solid)',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Apply Filter
          </button>

          {anyFilter && (
            <button
              type="button"
              onClick={resetFilters}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid var(--border-light)',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          )}

          <div
            style={{
              marginLeft: 'auto',
              fontSize: '12px',
              color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Showing {orders.length}
            {totalKnown ? ` of ${totalRecords}` : ''} orders
          </div>
        </form>
      </div>

      {/* Orders Table */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          overflowX: 'auto',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
              {COLUMNS.map((col, i) => (
                <th key={col} style={{ ...thStyle, textAlign: i === COLUMNS.length - 1 ? 'right' : 'left' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <ShimmerTableRows rows={7} cols={COLUMNS.length} colWidths={['25%', '35%', '20%', '20%', '25%', '20%', '25%', '15%']} />
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {ordersError ? 'Orders could not be loaded.' : 'No orders match the current filter criteria.'}
                </td>
              </tr>
            ) : (
              orders.map((ord, idx) => {
                const badge = getStatusBadge(ord.status);
                const isBuy = ord.side === 'BUY';
                const isSell = ord.side === 'SELL';
                const sideColors = isBuy
                  ? { bg: 'rgba(16, 185, 129, 0.12)', color: 'var(--success-text)', border: 'rgba(16, 185, 129, 0.25)' }
                  : isSell
                  ? { bg: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger-text)', border: 'rgba(239, 68, 68, 0.25)' }
                  : { bg: 'var(--overlay-2)', color: 'var(--text-secondary)', border: 'var(--border-medium)' };

                return (
                  <tr key={ord.id || `row-${idx}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {ord.id ? shorten(ord.id, 10) : 'ORD...'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        User: {shorten(ord.userId, 8)}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {ord.symbol}
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
                          background: sideColors.bg,
                          color: sideColors.color,
                          border: `1px solid ${sideColors.border}`,
                        }}
                      >
                        {isBuy && <ArrowDownRight size={12} />}
                        {isSell && <ArrowUpRight size={12} />}
                        {ord.side || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      ${ord.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {ord.quantity}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--info-text)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      ${ord.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--warning-text)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                      {ord.fee} {ord.feeAsset}
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
                        {ord.status}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '14px 18px',
                        textAlign: 'right',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {formatTime(ord.createdAt)}
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
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            Page {page}
            {totalKnown ? ` of ${totalPages}` : ''}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                background: page <= 1 ? 'var(--overlay-1)' : 'var(--overlay-2)',
                border: '1px solid var(--border-medium)',
                color: page <= 1 ? 'var(--text-faint)' : 'var(--text-primary)',
                cursor: page <= 1 || loading ? 'not-allowed' : 'pointer',
                fontSize: '12px',
              }}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!canGoNext || loading}
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                background: !canGoNext ? 'var(--overlay-1)' : 'var(--overlay-2)',
                border: '1px solid var(--border-medium)',
                color: !canGoNext ? 'var(--text-faint)' : 'var(--text-primary)',
                cursor: !canGoNext || loading ? 'not-allowed' : 'pointer',
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