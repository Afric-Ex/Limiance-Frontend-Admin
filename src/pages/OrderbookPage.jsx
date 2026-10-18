import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Layers,
  Activity,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  SlidersHorizontal,
  BarChart2,
  TrendingUp,
  ShieldAlert,
  Search,
} from 'lucide-react';

import { api } from '../api/client';
import './OrderbookPage.css';

/* -------------------------------------------------------------------------- */
/*  Helpers (module level so they never go stale inside WebSocket callbacks)  */
/* -------------------------------------------------------------------------- */

const KNOWN_QUOTES = ['USDT', 'USDC', 'BUSD', 'USD', 'NGN', 'EUR', 'BTC', 'ETH', 'BNB', 'SOL'];

// Accepts "BTC/USDT", "BTC-USDT", "BTCUSDT" or { base, quote } style objects
// and always returns "BASE/QUOTE" (or null if it can't be understood).
function normalizePair(raw) {
  if (!raw) return null;

  if (typeof raw === 'string') {
    const s = raw.trim().toUpperCase();
    if (s.endsWith('-PERP') || s.endsWith('/PERP')) {
      const b = s.replace(/[-/]PERP$/, '');
      return `${b}-PERP`;
    }
    if (/[/\-_:]/.test(s)) {
      const [b, q] = s.split(/[/\-_:]/);
      if (q === 'PERP') return `${b}-PERP`;
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
function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  for (const key of ['pairs', 'data', 'result', 'results', 'items', 'markets', 'symbols']) {
    const v = payload[key];
    if (Array.isArray(v)) return v;
    if (v && typeof v === 'object') {
      const nested = extractList(v);
      if (nested.length) return nested;
    }
  }
  return [];
}

function parseLevel(o) {
  if (Array.isArray(o)) {
    return { price: parseFloat(o[0] || 0), quantity: parseFloat(o[1] || 0) };
  }
  return {
    price: parseFloat(o?.price ?? o?.Price ?? 0),
    quantity: parseFloat(o?.quantity ?? o?.Quantity ?? o?.amount ?? o?.Amount ?? 0),
  };
}

function buildSide(raw, sortDesc) {
  const levels = (Array.isArray(raw) ? raw : [])
    .map(parseLevel)
    .filter((o) => o.price > 0 && o.quantity > 0)
    .sort((a, b) => (sortDesc ? b.price - a.price : a.price - b.price));

  let cumulative = 0;
  const rows = levels.map((l) => {
    cumulative += l.price * l.quantity;
    return { ...l, total: cumulative };
  });
  return { rows, total: cumulative };
}

function pickSide(book, keys) {
  for (const k of keys) {
    if (Array.isArray(book[k])) return book[k];
  }
  return [];
}

const cleanPair = (s) =>
  String(s || '')
    .replace(/:(spot|margin|futures)$/i, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase();

function buildWsUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  let url = import.meta.env.VITE_WS_URL;

  if (!url) {
    url = `${protocol}//${window.location.host}/ws`;
  } else if (url.startsWith('/')) {
    url = `${protocol}//${window.location.host}${url}`;
  } else if (url.startsWith('http')) {
    url = url.replace(/^http/, 'ws'); // http -> ws, https -> wss
  }

  const token = localStorage.getItem('admin_token') || '';
  if (token) {
    url += (url.includes('?') ? '&' : '?') + `auth-token=${encodeURIComponent(token)}`;
  }
  return url;
}

function sendSubscription(socket, pair, mode) {
  if (!socket || socket.readyState !== WebSocket.OPEN || !pair) return;

  const type =
    mode === 'futures'
      ? 'get_futures_order_books'
      : mode === 'margin'
      ? 'get_margin_order_books'
      : 'get_spot_order_books';

  try {
    socket.send(JSON.stringify({ type, data: { pair } }));
  } catch (err) {
    console.warn('[orderbook] failed to send subscription:', err);
  }
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function OrderbookPage() {
  const [pairs, setPairs] = useState([]);
  const [selectedPair, setSelectedPair] = useState('');
  const [pairsLoading, setPairsLoading] = useState(true);
  const [pairsError, setPairsError] = useState(null);
  const [pairsReload, setPairsReload] = useState(0);
  const [marketType, setMarketType] = useState('spot'); // 'spot' | 'margin' | 'futures'
  const [wsStatus, setWsStatus] = useState('connecting'); // 'connected' | 'connecting' | 'disconnected'
  const [viewMode, setViewMode] = useState('both'); // 'both' | 'bids' | 'asks'
  const [depthLimit, setDepthLimit] = useState(15);
  const [precision, setPrecision] = useState(2);

  // Live orderbook state
  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);
  const [lastPrice, setLastPrice] = useState(null);
  const [prevPrice, setPrevPrice] = useState(null);
  const [markPrice, setMarkPrice] = useState(null);
  const [buyVol, setBuyVol] = useState(0);
  const [sellVol, setSellVol] = useState(0);
  const [buyPct, setBuyPct] = useState(50);
  const [sellPct, setSellPct] = useState(50);

  // Live open positions state for Futures & Margin
  const [positions, setPositions] = useState([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionsSearch, setPositionsSearch] = useState('');

  /* ------------------- Load Futures / Margin Positions -------------------- */
  useEffect(() => {
    if (marketType === 'spot') {
      setPositions([]);
      return;
    }

    let isMounted = true;
    async function loadPositions() {
      setPositionsLoading(true);
      try {
        const endpoint = marketType === 'futures' ? '/api/futures/positions' : '/api/margin/positions';
        const q = selectedPair ? `?symbol=${encodeURIComponent(selectedPair)}` : '';
        const res = await api(`${endpoint}${q}`);
        if (!isMounted) return;
        setPositions(res.positions || []);
      } catch (err) {
        console.warn(`[orderbook] failed to load ${marketType} positions:`, err);
      } finally {
        if (isMounted) setPositionsLoading(false);
      }
    }

    loadPositions();
    const interval = setInterval(loadPositions, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [marketType, selectedPair]);


  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const activePairRef = useRef('');
  const activeMarketRef = useRef(marketType);
  const lastPriceRef = useRef(null);
  const handlerRef = useRef(() => {});

  /* ---------------------------- 1. Load pairs ----------------------------- */
  useEffect(() => {
    let cancelled = false;

    async function loadPairs() {
      setPairsLoading(true);
      setPairsError(null);
      try {
        let list = [];
        if (marketType === 'futures') {
          const [pairsRaw, futRaw] = await Promise.allSettled([
            api('/api/pairs'),
            api('/api/futures-configs'),
          ]);
          if (pairsRaw.status === 'fulfilled') {
            list.push(...extractList(await unwrapResponse(pairsRaw.value)));
          }
          if (futRaw.status === 'fulfilled') {
            const fd = futRaw.value;
            const futList = Array.isArray(fd) ? fd : fd?.futures_configs || fd?.data || [];
            list.push(...futList.map((f) => f.symbol || f).filter(Boolean));
          }
        } else {
          const raw = await api('/api/pairs');
          const payload = await unwrapResponse(raw);
          list = extractList(payload);
        }

        const formatted = [...new Set(list.map(normalizePair).filter(Boolean))];

        if (cancelled) return;

        if (formatted.length === 0) {
          console.warn('[orderbook] returned no usable pairs. Raw response:', list);
          setPairs([]);
          setPairsError('The pairs endpoint responded, but no trading pairs were found in the response.');
          return;
        }

        setPairs(formatted);
        // Keep the current selection if it is still valid, otherwise pick the first pair.
        setSelectedPair((current) => (formatted.includes(current) ? current : formatted[0]));
      } catch (err) {
        console.error('[orderbook] failed to load pairs:', err);
        if (!cancelled) setPairsError(err?.message || 'Failed to load trading pairs');
      } finally {
        if (!cancelled) setPairsLoading(false);
      }
    }

    loadPairs();
    return () => {
      cancelled = true;
    };
  }, [pairsReload, marketType]);

  /* ------------- 2. Pair / market changed: reset + re-subscribe ------------ */
  useEffect(() => {
    activePairRef.current = selectedPair;
    activeMarketRef.current = marketType;

    // Clear old data immediately
    setBids([]);
    setAsks([]);
    setLastPrice(null);
    setPrevPrice(null);
    setMarkPrice(null);
    setBuyVol(0);
    setSellVol(0);
    setBuyPct(50);
    setSellPct(50);
    lastPriceRef.current = null;

    if (selectedPair) {
      sendSubscription(wsRef.current, selectedPair, marketType);
    }
  }, [selectedPair, marketType]);

  /* ------------------------ 3. WebSocket connection ------------------------ */
  // Connects once on mount. It does NOT wait for pairs; the subscription is
  // sent on open (if a pair is already selected) or by effect 2 when one is.
  useEffect(() => {
    let isMounted = true;
    let socket = null;

    function connectWs() {
      if (!isMounted) return;
      setWsStatus('connecting');

      const wsUrl = buildWsUrl();
      console.info('[orderbook] connecting to', wsUrl.replace(/(auth-token=)[^&]*/, '$1***'));

      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;
      } catch (err) {
        console.error('[orderbook] failed to construct WebSocket:', err);
        setWsStatus('disconnected');
        scheduleReconnect();
        return;
      }

      socket.onopen = () => {
        if (!isMounted) return;
        reconnectAttemptsRef.current = 0;
        setWsStatus('connected');
        sendSubscription(socket, activePairRef.current, activeMarketRef.current);
      };

      socket.onmessage = (event) => {
        if (!isMounted) return;
        try {
          handlerRef.current(JSON.parse(event.data));
        } catch (err) {
          console.error('[orderbook] error handling WS message:', err);
        }
      };

      socket.onerror = (err) => {
        console.warn('[orderbook] WebSocket error:', err);
      };

      socket.onclose = (ev) => {
        if (!isMounted) return;
        console.warn(`[orderbook] WebSocket closed (code ${ev.code}${ev.reason ? `, ${ev.reason}` : ''})`);
        setWsStatus('disconnected');
        scheduleReconnect();
      };
    }

    function scheduleReconnect() {
      const attempt = reconnectAttemptsRef.current++;
      const delay = Math.min(1000 * 2 ** attempt, 15000); // 1s, 2s, 4s ... max 15s
      reconnectTimeoutRef.current = setTimeout(connectWs, delay);
    }

    connectWs();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeoutRef.current);
      if (socket) {
        socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null;
        socket.close();
      }
      wsRef.current = null;
    };
  }, []);

  /* --------------------------- Message handling --------------------------- */
  const applyLastPrice = (p) => {
    const prev = lastPriceRef.current;
    if (prev !== null && prev !== p) setPrevPrice(prev);
    lastPriceRef.current = p;
    setLastPrice(p);
  };

  const applyBook = (rawBuys, rawSells) => {
    const buy = buildSide(rawBuys, true); // highest bid first
    const sell = buildSide(rawSells, false); // lowest ask first
    const maxTotal = Math.max(buy.total, sell.total, 1);

    const withDepth = (rows) =>
      rows.map((r) => ({ ...r, depthPct: Math.min(100, Math.round((r.total / maxTotal) * 100)) }));

    setBids(withDepth(buy.rows));
    setAsks(withDepth(sell.rows));

    const tot = buy.total + sell.total;
    if (tot > 0) {
      const bp = Math.round((buy.total / tot) * 100);
      setBuyPct(bp);
      setSellPct(100 - bp);
      setBuyVol(buy.total);
      setSellVol(sell.total);
    }
  };

  const handleIncomingMessage = (msg) => {
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'order_book_update') {
      if (activeMarketRef.current === 'futures') return;

      const book = msg.data?.orderBook || msg.data;
      if (!book) return;

      // Ignore late updates that belong to a previously selected pair
      const msgPair = book.tradingPair ?? book.pair ?? book.symbol ?? msg.data?.tradingPair ?? msg.data?.pair ?? msg.pair;
      if (typeof msgPair === 'string' && cleanPair(msgPair) !== cleanPair(activePairRef.current)) return;

      applyBook(
        pickSide(book, ['buyOrders', 'buy', 'bids']),
        pickSide(book, ['sellOrders', 'sell', 'asks'])
      );

      const rawPrice = msg.data?.lastPrice || book.realLastPrice || book.lastTradedPrice;
      if (rawPrice) {
        const p = parseFloat(rawPrice);
        if (p > 0) applyLastPrice(p);
      }

      // Only override computed volumes when the server actually sends them
      if (book.totalBuyVolume != null) setBuyVol(Number(book.totalBuyVolume) || 0);
      if (book.totalSellVolume != null) setSellVol(Number(book.totalSellVolume) || 0);
      if (book.buyPercentage != null && book.sellPercentage != null) {
        setBuyPct(Math.round(book.buyPercentage));
        setSellPct(Math.round(book.sellPercentage));
      }
    } else if (msg.type === 'futures_order_book_update') {
      if (activeMarketRef.current !== 'futures') return;

      const data = msg.data || {};

      const msgPair = data.pair ?? data.symbol;
      if (typeof msgPair === 'string' && cleanPair(msgPair) !== cleanPair(activePairRef.current)) return;

      applyBook(
        pickSide(data, ['buy', 'buyOrders', 'bids']),
        pickSide(data, ['sell', 'sellOrders', 'asks'])
      );

      if (data.markPrice) {
        const mp = parseFloat(data.markPrice);
        if (mp > 0) {
          setMarkPrice(mp);
          if (lastPriceRef.current === null) applyLastPrice(mp);
        }
      }
    }
  };

  // Always point the socket at the latest handler (no stale closures)
  handlerRef.current = handleIncomingMessage;

  /* ------------------------------ Derived data ---------------------------- */
  const displayAsks = useMemo(() => {
    // Highest ask on top, lowest ask just above the spread
    return asks.slice(0, depthLimit).reverse();
  }, [asks, depthLimit]);

  const displayBids = useMemo(() => bids.slice(0, depthLimit), [bids, depthLimit]);

  const bestBid = bids[0]?.price || null;
  const bestAsk = asks[0]?.price || null;
  const spread = bestAsk && bestBid ? bestAsk - bestBid : 0;
  const spreadPct = bestAsk && spread > 0 ? (spread / bestAsk) * 100 : 0;
  const midPrice = bestAsk && bestBid ? (bestAsk + bestBid) / 2 : lastPrice || 0;

  const priceDirection =
    lastPrice && prevPrice ? (lastPrice >= prevPrice ? 'up' : 'down') : 'neutral';

  // Cumulative depth chart. Centre (x=200) is the spread; bids extend left, asks right.
  const depthChartData = useMemo(() => {
    const empty = { bidLine: '', bidArea: '', askLine: '', askArea: '' };
    if (bids.length === 0 && asks.length === 0) return empty;

    const maxCumulative = Math.max(
      bids[bids.length - 1]?.total || 0,
      asks[asks.length - 1]?.total || 0,
      1
    );
    const yFor = (total) => 200 - Math.min(160, (total / maxCumulative) * 160);

    const build = (levels, dir) => {
      if (levels.length === 0) return { line: '', area: '' };
      const pts = levels.map((l, i) => [200 + dir * ((i + 1) / levels.length) * 180, yFor(l.total)]);
      const startY = pts[0][1];
      const endX = pts[pts.length - 1][0];
      const coords = pts.map(([x, y]) => `L ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
      return {
        line: `M 200 ${startY.toFixed(1)} ${coords}`,
        area: `M 200 200 L 200 ${startY.toFixed(1)} ${coords} L ${endX.toFixed(1)} 200 Z`,
      };
    };

    const bid = build(bids, -1);
    const ask = build(asks, 1);
    return { bidLine: bid.line, bidArea: bid.area, askLine: ask.line, askArea: ask.area };
  }, [bids, asks]);

  /* ------------------------------- Formatters ------------------------------ */
  const formatPrice = (p) => {
    if (p === null || p === undefined) return '--';
    return Number(p).toLocaleString(undefined, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });
  };

  const formatQuantity = (q) => {
    if (!q) return '0.00';
    return Number(q).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  };

  const formatTotal = (t) => {
    if (!t) return '0.00';
    return Number(t).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const emptyMessage = (side) =>
    wsStatus !== 'connected'
      ? 'Waiting for connection…'
      : !selectedPair
      ? 'Select a trading pair'
      : `No active ${side} in ${marketType} order book`;

  /* --------------------------------- Render -------------------------------- */
  return (
    <div className="orderbook-page">
      {/* Header */}
      <div className="ob-header">
        <div className="ob-title-group">
          <h1>
            <Layers size={26} color="#818cf8" /> Live Market Order Book
          </h1>
          <p>
            Real-time level-2 market depth, resting limit orders, liquidity curve, and live order book stream.
          </p>
        </div>

        <div className="ob-header-controls">
          {/* Trading Options (Spot, Margin, Futures) */}
          <div className="ob-market-tabs">
            <button
              type="button"
              className={`ob-market-tab ${marketType === 'spot' ? 'active spot' : ''}`}
              onClick={() => setMarketType('spot')}
            >
              Spot
            </button>
            <button
              type="button"
              className={`ob-market-tab ${marketType === 'margin' ? 'active margin' : ''}`}
              onClick={() => setMarketType('margin')}
            >
              Margin
            </button>
            <button
              type="button"
              className={`ob-market-tab ${marketType === 'futures' ? 'active futures' : ''}`}
              onClick={() => setMarketType('futures')}
            >
              Futures
            </button>
          </div>

          {/* Pair Selector */}
          <select
            className="ob-pair-selector"
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value)}
            disabled={pairsLoading || pairs.length === 0}
          >
            {pairsLoading ? (
              <option value="">Loading pairs…</option>
            ) : pairs.length === 0 ? (
              <option value="">No pairs available</option>
            ) : (
              pairs.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))
            )}
          </select>

          {/* WS Status Badge */}
          <div className={`ob-ws-status ${wsStatus}`}>
            <span className="ob-ws-dot" />
            <span>
              {wsStatus === 'connected'
                ? 'Live WebSocket'
                : wsStatus === 'connecting'
                ? 'Connecting...'
                : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Pairs error */}
      {pairsError && (
        <div className="ob-alert" role="alert">
          <span>Couldn't load trading pairs: {pairsError}</span>
          <button type="button" onClick={() => setPairsReload((n) => n + 1)}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Top Ticker Stats Bar */}
      <div className="ob-ticker-bar">
        <div className="ob-ticker-main">
          <div className="ob-ticker-symbol">{selectedPair || '--'}</div>
          <div className={`ob-ticker-price ${priceDirection}`}>{formatPrice(lastPrice || midPrice)}</div>
        </div>

        <div className="ob-ticker-stats">
          <div className="ob-stat-item">
            <span className="ob-stat-label">Market Mode</span>
            <span
              className="ob-stat-value"
              style={{
                textTransform: 'uppercase',
                color: marketType === 'futures' ? '#f59e0b' : marketType === 'margin' ? '#a78bfa' : '#818cf8',
              }}
            >
              {marketType}
            </span>
          </div>

          {marketType === 'futures' && (
            <div className="ob-stat-item">
              <span className="ob-stat-label">Mark Price</span>
              <span className="ob-stat-value">{formatPrice(markPrice)}</span>
            </div>
          )}

          <div className="ob-stat-item">
            <span className="ob-stat-label">Market Spread</span>
            <span className="ob-stat-value">
              {formatPrice(spread)} ({spreadPct.toFixed(3)}%)
            </span>
          </div>

          <div className="ob-stat-item">
            <span className="ob-stat-label">Best Bid / Ask</span>
            <span className="ob-stat-value">
              <span style={{ color: '#34d399' }}>{formatPrice(bestBid)}</span> /{' '}
              <span style={{ color: '#f87171' }}>{formatPrice(bestAsk)}</span>
            </span>
          </div>

          <div className="ob-stat-item">
            <span className="ob-stat-label">Order Book Levels</span>
            <span className="ob-stat-value">
              {bids.length} Bids / {asks.length} Asks
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Order Book + Liquidity Analytics */}
      <div className="ob-main-grid">
        {/* Left Column: Order Book Table */}
        <div className="ob-panel">
          <div className="ob-panel-header">
            <div className="ob-panel-title">
              <Activity size={16} color="#818cf8" /> Order Book Depth
            </div>

            <div className="ob-view-controls">
              <button
                type="button"
                className={`ob-view-btn ${viewMode === 'both' ? 'active' : ''}`}
                onClick={() => setViewMode('both')}
                title="Both Asks & Bids"
              >
                Both
              </button>
              <button
                type="button"
                className={`ob-view-btn ${viewMode === 'bids' ? 'active' : ''}`}
                onClick={() => setViewMode('bids')}
                title="Bids Only"
                style={{ color: viewMode === 'bids' ? '#34d399' : undefined }}
              >
                Bids
              </button>
              <button
                type="button"
                className={`ob-view-btn ${viewMode === 'asks' ? 'active' : ''}`}
                onClick={() => setViewMode('asks')}
                title="Asks Only"
                style={{ color: viewMode === 'asks' ? '#f87171' : undefined }}
              >
                Asks
              </button>

              {/* Precision */}
              <select
                className="ob-view-btn"
                value={precision}
                onChange={(e) => setPrecision(Number(e.target.value))}
                style={{ cursor: 'pointer' }}
              >
                <option value={1}>0.1</option>
                <option value={2}>0.01</option>
                <option value={4}>0.0001</option>
              </select>

              {/* Depth Rows */}
              <select
                className="ob-view-btn"
                value={depthLimit}
                onChange={(e) => setDepthLimit(Number(e.target.value))}
                style={{ cursor: 'pointer' }}
              >
                <option value={10}>10 rows</option>
                <option value={15}>15 rows</option>
                <option value={25}>25 rows</option>
              </select>
            </div>
          </div>

          {/* Table Header */}
          <div className="ob-table-header">
            <div>Price ({selectedPair.split('/')[1] || 'USDT'})</div>
            <div>Size ({selectedPair.split('/')[0] || 'BTC'})</div>
            <div>Total ({selectedPair.split('/')[1] || 'USDT'})</div>
          </div>

          <div className="ob-rows-container">
            {/* ASKS (SELL ORDERS) */}
            {(viewMode === 'both' || viewMode === 'asks') && (
              <div className="ob-asks-list">
                {displayAsks.length > 0 ? (
                  displayAsks.map((ask) => (
                    <div key={`ask-${ask.price}`} className="ob-row ask">
                      <div className="ob-row-depth-bar" style={{ width: `${ask.depthPct}%` }} />
                      <div className="ob-col price ask">{formatPrice(ask.price)}</div>
                      <div className="ob-col qty">{formatQuantity(ask.quantity)}</div>
                      <div className="ob-col total">{formatTotal(ask.total)}</div>
                    </div>
                  ))
                ) : (
                  <div className="ob-empty-state">{emptyMessage('asks')}</div>
                )}
              </div>
            )}

            {/* SPREAD BANNER */}
            <div className="ob-spread-banner">
              <div
                className="ob-spread-price"
                style={{
                  color:
                    priceDirection === 'up' ? '#34d399' : priceDirection === 'down' ? '#f87171' : '#f8fafc',
                }}
              >
                {formatPrice(lastPrice || midPrice)}
                {priceDirection === 'up' && <ArrowUp size={16} />}
                {priceDirection === 'down' && <ArrowDown size={16} />}
              </div>
              <div className="ob-spread-details">
                Spread: {formatPrice(spread)} ({spreadPct.toFixed(3)}%)
              </div>
            </div>

            {/* BIDS (BUY ORDERS) */}
            {(viewMode === 'both' || viewMode === 'bids') && (
              <div className="ob-bids-list">
                {displayBids.length > 0 ? (
                  displayBids.map((bid) => (
                    <div key={`bid-${bid.price}`} className="ob-row bid">
                      <div className="ob-row-depth-bar" style={{ width: `${bid.depthPct}%` }} />
                      <div className="ob-col price bid">{formatPrice(bid.price)}</div>
                      <div className="ob-col qty">{formatQuantity(bid.quantity)}</div>
                      <div className="ob-col total">{formatTotal(bid.total)}</div>
                    </div>
                  ))
                ) : (
                  <div className="ob-empty-state">{emptyMessage('bids')}</div>
                )}
              </div>
            )}
          </div>

          {/* Buy/Sell Volume Imbalance Bar */}
          <div className="ob-pressure-wrap">
            <div className="ob-pressure-labels">
              <span style={{ color: '#34d399' }}>Buy Depth: {buyPct}%</span>
              <span style={{ color: '#f87171' }}>Sell Depth: {sellPct}%</span>
            </div>
            <div className="ob-pressure-bar">
              <div className="ob-pressure-fill" style={{ width: `${buyPct}%` }} />
            </div>
          </div>
        </div>

        {/* Right Column: Visual Depth Chart & Market Analytics */}
        <div className="ob-analytics-panel">
          <div className="ob-depth-card">
            <div className="ob-card-header">
              <div className="ob-card-title">
                <BarChart2 size={16} color="#818cf8" /> Market Depth Liquidity
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Cumulative Curves</span>
            </div>

            <div style={{ width: '100%', height: '220px', position: 'relative' }}>
              {bids.length === 0 && asks.length === 0 ? (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                    fontSize: '0.85rem',
                  }}
                >
                  Awaiting order book depth to plot liquidity curve...
                </div>
              ) : (
                <svg width="100%" height="220" viewBox="0 0 400 220" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="bidGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                    </linearGradient>
                    <linearGradient id="askGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  {/* Grid lines */}
                  <line x1="0" y1="200" x2="400" y2="200" stroke="rgba(255,255,255,0.06)" />
                  <line x1="0" y1="100" x2="400" y2="100" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                  <line x1="200" y1="0" x2="200" y2="200" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />

                  {/* Bid liquidity curve (green, left of centre) */}
                  {depthChartData.bidLine && (
                    <>
                      <path d={depthChartData.bidArea} fill="url(#bidGradient)" />
                      <path d={depthChartData.bidLine} fill="none" stroke="#10b981" strokeWidth="2" />
                    </>
                  )}

                  {/* Ask liquidity curve (red, right of centre) */}
                  {depthChartData.askLine && (
                    <>
                      <path d={depthChartData.askArea} fill="url(#askGradient)" />
                      <path d={depthChartData.askLine} fill="none" stroke="#ef4444" strokeWidth="2" />
                    </>
                  )}

                  {/* Centre mid price marker */}
                  <circle cx="200" cy="195" r="4" fill="#818cf8" />
                  <text x="200" y="215" fill="#94a3b8" fontSize="10" textAnchor="middle">
                    Mid: {formatPrice(midPrice)}
                  </text>
                </svg>
              )}
            </div>

            <div className="ob-stats-grid">
              <div className="ob-stat-box">
                <div className="ob-stat-box-label">Total Bid Volume</div>
                <div className="ob-stat-box-value" style={{ color: '#34d399' }}>
                  ${Number(buyVol).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="ob-stat-box">
                <div className="ob-stat-box-label">Total Ask Volume</div>
                <div className="ob-stat-box-value" style={{ color: '#f87171' }}>
                  ${Number(sellVol).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="ob-stat-box">
                <div className="ob-stat-box-label">Order Ratio</div>
                <div className="ob-stat-box-value">
                  {buyPct}% : {sellPct}%
                </div>
              </div>
              <div className="ob-stat-box">
                <div className="ob-stat-box-label">Socket State</div>
                <div
                  className="ob-stat-box-value"
                  style={{
                    textTransform: 'capitalize',
                    color: wsStatus === 'connected' ? '#34d399' : '#fbbf24',
                  }}
                >
                  {wsStatus}
                </div>
              </div>
            </div>
          </div>

          <div className="ob-depth-card" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
            <div className="ob-card-title" style={{ fontSize: '0.88rem', marginBottom: '8px' }}>
              <SlidersHorizontal size={14} color="#818cf8" /> Operator Insights
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
              The order book continuously streams from the matching engine via WebSocket. You can switch
              between <strong>Spot</strong>, <strong>Margin</strong>, and <strong>Futures</strong> order
              engines in real time without refreshing.
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Open Positions Table (Futures & Margin) */}
      {marketType !== 'spot' && (
        <div style={{ marginTop: '24px', background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {marketType === 'futures' ? (
                <TrendingUp size={20} color="#f59e0b" />
              ) : (
                <ShieldAlert size={20} color="#a78bfa" />
              )}
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                  {marketType === 'futures' ? 'Open Futures Positions & Live PnL' : 'Active Margin Positions & Borrowing'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                  {marketType === 'futures'
                    ? 'Streaming all active leverage positions, entry prices, mark prices, and unrealized PnL'
                    : 'Active margin collateral accounts, borrowed balances, and liquidation risk exposure'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                <input
                  type="text"
                  placeholder="Filter user or symbol..."
                  value={positionsSearch}
                  onChange={(e) => setPositionsSearch(e.target.value)}
                  style={{
                    background: '#181a22',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    padding: '6px 10px 6px 30px',
                    color: '#fff',
                    fontSize: '0.8rem',
                    outline: 'none',
                  }}
                />
              </div>

              <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                {positions.length} active position{positions.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div style={{ maxHeight: '340px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#181a22', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, zIndex: 5 }}>
                  {marketType === 'futures' ? (
                    <>
                      <th style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '0.75rem' }}>Position ID</th>
                      <th style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '0.75rem' }}>User ID</th>
                      <th style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '0.75rem' }}>Symbol</th>
                      <th style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '0.75rem' }}>Side</th>
                      <th style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '0.75rem' }}>Size</th>
                      <th style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '0.75rem' }}>Entry Price</th>
                      <th style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '0.75rem' }}>Mark Price</th>
                      <th style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '0.75rem' }}>Leverage</th>
                      <th style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '0.75rem' }}>Unrealized PnL</th>
                      <th style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '0.75rem' }}>Liquidation Price</th>
                    </>
                  ) : (
                    <>
                      <th style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '0.75rem' }}>User ID</th>
                      <th style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '0.75rem' }}>Asset</th>
                      <th style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '0.75rem' }}>Borrowed Amount</th>
                      <th style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '0.75rem' }}>Spot Collateral</th>
                      <th style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '0.75rem' }}>Locked Balance</th>
                      <th style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '0.75rem' }}>Risk Status</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {positionsLoading && positions.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '30px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                      Loading active {marketType} positions...
                    </td>
                  </tr>
                ) : positions.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '30px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                      No active open {marketType} positions found for {selectedPair || 'all markets'}.
                    </td>
                  </tr>
                ) : (
                  positions
                    .filter((pos) => {
                      if (!positionsSearch) return true;
                      const term = positionsSearch.toLowerCase();
                      return (
                        (pos.id && pos.id.toLowerCase().includes(term)) ||
                        (pos.user_id && pos.user_id.toLowerCase().includes(term)) ||
                        (pos.symbol && pos.symbol.toLowerCase().includes(term))
                      );
                    })
                    .map((pos, idx) => {
                      if (marketType === 'futures') {
                        const pnl = Number(pos.unrealized_pnl ?? pos.pnl_percent ?? 0);
                        const isProfitable = pnl >= 0;
                        return (
                          <tr key={pos.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                              {pos.id ? `${pos.id.slice(0, 8)}...` : `#${idx + 1}`}
                            </td>
                            <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                              {pos.user_id ? `${pos.user_id.slice(0, 8)}...` : 'N/A'}
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: '#fff' }}>{pos.symbol}</td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: String(pos.side).toUpperCase() === 'LONG' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', color: String(pos.side).toUpperCase() === 'LONG' ? '#34d399' : '#f87171' }}>
                                {pos.side}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#fff' }}>
                              {Number(pos.size).toLocaleString()}
                            </td>
                            <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.8)' }}>
                              ${Number(pos.entry_price).toLocaleString()}
                            </td>
                            <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.8)' }}>
                              ${Number(pos.mark_price).toLocaleString()}
                            </td>
                            <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: '#f59e0b', fontWeight: 700 }}>
                              {pos.leverage}x
                            </td>
                            <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: isProfitable ? '#34d399' : '#f87171' }}>
                              {isProfitable ? '+' : ''}${pnl.toFixed(2)}
                            </td>
                            <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: '#f87171' }}>
                              ${Number(pos.liquidation_price).toLocaleString()}
                            </td>
                          </tr>
                        );
                      } else {
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                              {pos.user_id ? `${pos.user_id.slice(0, 8)}...` : 'N/A'}
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: '#fff' }}>{pos.symbol}</td>
                            <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f87171' }}>
                              {Number(pos.borrowed_amount).toLocaleString()} {pos.symbol}
                            </td>
                            <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                              {Number(pos.spot_balance).toLocaleString()} {pos.symbol}
                            </td>
                            <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.6)' }}>
                              {Number(pos.locked_balance).toLocaleString()} {pos.symbol}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(167,139,250,0.12)', color: '#a78bfa' }}>
                                BORROWED
                              </span>
                            </td>
                          </tr>
                        );
                      }
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}