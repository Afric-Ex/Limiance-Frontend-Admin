import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Layers,
  Activity,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Wifi,
  WifiOff,
  BarChart2,
  PieChart,
} from 'lucide-react';
import { api } from '../api/client';
import './OrderbookPage.css';

const DEFAULT_PAIRS = [
  'BTC/USDT',
  'ETH/USDT',
  'SOL/USDT',
  'BNB/USDT',
  'XRP/USDT',
  'ADA/USDT',
  'DOGE/USDT',
  'AVAX/USDT',
];

export default function OrderbookPage() {
  const [pairs, setPairs] = useState(DEFAULT_PAIRS);
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
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
  const [lastUpdateTs, setLastUpdateTs] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // 1. Load pairs from API
  useEffect(() => {
    async function loadPairs() {
      try {
        const res = await api('/api/pairs');
        if (res && Array.isArray(res.pairs) && res.pairs.length > 0) {
          const formatted = res.pairs.map(
            (p) => `${p.base.toUpperCase()}/${p.quote.toUpperCase()}`
          );
          setPairs(formatted);
          if (!formatted.includes(selectedPair)) {
            setSelectedPair(formatted[0]);
          }
        }
      } catch (err) {
        console.warn('Could not load pairs from API, using defaults:', err);
      }
    }
    loadPairs();
  }, []);

  // 2. WebSocket Connection and Stream Management
  useEffect(() => {
    let isMounted = true;

    function connectWs() {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }

      setWsStatus('connecting');

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const token = localStorage.getItem('admin_token') || '';

      // Determine WS URL:
      // In dev with Vite proxy: /ws -> ws://localhost:3000/api/ws
      let wsUrl = import.meta.env.VITE_WS_URL;
      if (!wsUrl) {
        wsUrl = `${protocol}//${window.location.host}/ws`;
      }
      if (token) {
        wsUrl += (wsUrl.includes('?') ? '&' : '?') + `auth-token=${encodeURIComponent(token)}`;
      }

      let socket;
      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;
      } catch (err) {
        console.error('Failed to construct WebSocket:', err);
        setWsStatus('disconnected');
        return;
      }

      socket.onopen = () => {
        if (!isMounted) return;
        setWsStatus('connected');
        sendSubscription(socket);
      };

      socket.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const msg = JSON.parse(event.data);
          handleIncomingMessage(msg);
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      socket.onerror = (err) => {
        console.warn('WebSocket error:', err);
      };

      socket.onclose = (event) => {
        if (!isMounted) return;
        setWsStatus('disconnected');
        // Reconnect after 3 seconds if unmounted
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMounted) connectWs();
        }, 3000);
      };
    }

    connectWs();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // When selectedPair or marketType changes, send new subscription on existing WS
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      sendSubscription(wsRef.current);
    }
  }, [selectedPair, marketType]);

  const sendSubscription = (socket) => {
    const rawSymbol = selectedPair.replace('/', '');
    let payload;

    if (marketType === 'futures') {
      payload = {
        type: 'get_futures_order_books',
        data: { pair: selectedPair },
      };
    } else if (marketType === 'margin') {
      payload = {
        type: 'get_margin_order_books',
        data: { pair: rawSymbol },
      };
    } else {
      payload = {
        type: 'get_spot_order_books',
        data: { pair: rawSymbol },
      };
    }

    try {
      socket.send(JSON.stringify(payload));
    } catch (err) {
      console.warn('Failed to send WS subscription:', err);
    }
  };

  const handleIncomingMessage = (msg) => {
    setLastUpdateTs(Date.now());

    if (msg.type === 'order_book_update') {
      const book = msg.data?.orderBook || msg.data;
      if (!book) return;

      const rawBuys = Array.isArray(book.buyOrders) ? book.buyOrders : [];
      const rawSells = Array.isArray(book.sellOrders) ? book.sellOrders : [];

      processOrders(rawBuys, rawSells);

      if (msg.data?.lastPrice || book.realLastPrice || book.lastTradedPrice) {
        const p = parseFloat(msg.data?.lastPrice || book.realLastPrice || book.lastTradedPrice);
        if (p > 0) {
          setPrevPrice((prev) => (prev !== p ? lastPrice : prev));
          setLastPrice(p);
        }
      }

      setBuyVol(book.totalBuyVolume || 0);
      setSellVol(book.totalSellVolume || 0);
      if (book.buyPercentage !== undefined && book.sellPercentage !== undefined) {
        setBuyPct(Math.round(book.buyPercentage));
        setSellPct(Math.round(book.sellPercentage));
      }
    } else if (msg.type === 'futures_order_book_update') {
      const data = msg.data || {};
      const rawBuys = Array.isArray(data.buy) ? data.buy : [];
      const rawSells = Array.isArray(data.sell) ? data.sell : [];

      processOrders(rawBuys, rawSells);

      if (data.markPrice) {
        const mp = parseFloat(data.markPrice);
        setMarkPrice(mp);
        if (!lastPrice) {
          setLastPrice(mp);
        }
      }
    }
  };

  const processOrders = (rawBuys, rawSells) => {
    // Process Bids (Sorted descending: highest buy price first)
    const sortedBids = [...rawBuys]
      .map((o) => ({
        price: parseFloat(o.price || 0),
        quantity: parseFloat(o.quantity || 0),
      }))
      .filter((o) => o.price > 0 && o.quantity > 0)
      .sort((a, b) => b.price - a.price);

    let cumBidTotal = 0;
    const processedBids = sortedBids.map((b) => {
      cumBidTotal += b.price * b.quantity;
      return {
        ...b,
        total: cumBidTotal,
      };
    });

    // Process Asks (Sorted ascending: lowest sell price first)
    const sortedAsks = [...rawSells]
      .map((o) => ({
        price: parseFloat(o.price || 0),
        quantity: parseFloat(o.quantity || 0),
      }))
      .filter((o) => o.price > 0 && o.quantity > 0)
      .sort((a, b) => a.price - b.price);

    let cumAskTotal = 0;
    const processedAsks = sortedAsks.map((a) => {
      cumAskTotal += a.price * a.quantity;
      return {
        ...a,
        total: cumAskTotal,
      };
    });

    // Compute max depth for proportional visual bars
    const maxTotal = Math.max(
      cumBidTotal || 1,
      cumAskTotal || 1
    );

    setBids(
      processedBids.map((b) => ({
        ...b,
        depthPct: Math.min(100, Math.round((b.total / maxTotal) * 100)),
      }))
    );

    setAsks(
      processedAsks.map((a) => ({
        ...a,
        depthPct: Math.min(100, Math.round((a.total / maxTotal) * 100)),
      }))
    );

    if (cumBidTotal > 0 || cumAskTotal > 0) {
      const tot = cumBidTotal + cumAskTotal;
      setBuyPct(Math.round((cumBidTotal / tot) * 100));
      setSellPct(100 - Math.round((cumBidTotal / tot) * 100));
      setBuyVol(cumBidTotal);
      setSellVol(cumAskTotal);
    }
  };

  // Sliced for display
  const displayAsks = useMemo(() => {
    // Sells are displayed reversed so highest ask is at top and lowest ask is just above the spread
    const slice = asks.slice(0, depthLimit);
    return slice.reverse();
  }, [asks, depthLimit]);

  const displayBids = useMemo(() => {
    return bids.slice(0, depthLimit);
  }, [bids, depthLimit]);

  // Spread calculation
  const bestBid = bids[0]?.price || null;
  const bestAsk = asks[0]?.price || null;
  const spread = bestAsk && bestBid ? bestAsk - bestBid : 0;
  const spreadPct = bestAsk && spread > 0 ? (spread / bestAsk) * 100 : 0;
  const midPrice = bestAsk && bestBid ? (bestAsk + bestBid) / 2 : lastPrice || 0;

  const priceDirection = lastPrice && prevPrice ? (lastPrice >= prevPrice ? 'up' : 'down') : 'neutral';

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
          >
            {pairs.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* WS Status Badge */}
          <div className={`ob-ws-status ${wsStatus}`}>
            <span className="ob-ws-dot" />
            <span>{wsStatus === 'connected' ? 'Live WebSocket' : wsStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* Top Ticker Stats Bar */}
      <div className="ob-ticker-bar">
        <div className="ob-ticker-main">
          <div className="ob-ticker-symbol">{selectedPair}</div>
          <div className={`ob-ticker-price ${priceDirection}`}>
            {formatPrice(lastPrice || midPrice)}
          </div>
        </div>

        <div className="ob-ticker-stats">
          <div className="ob-stat-item">
            <span className="ob-stat-label">Market Mode</span>
            <span className="ob-stat-value" style={{ textTransform: 'uppercase', color: marketType === 'futures' ? '#f59e0b' : marketType === 'margin' ? '#a78bfa' : '#818cf8' }}>
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
              {/* View Mode */}
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
                  displayAsks.map((ask, idx) => (
                    <div key={`ask-${idx}`} className="ob-row ask">
                      <div
                        className="ob-row-depth-bar"
                        style={{ width: `${ask.depthPct}%` }}
                      />
                      <div className="ob-col price ask">{formatPrice(ask.price)}</div>
                      <div className="ob-col qty">{formatQuantity(ask.quantity)}</div>
                      <div className="ob-col total">{formatTotal(ask.total)}</div>
                    </div>
                  ))
                ) : (
                  <div className="ob-empty-state">
                    No active asks in {marketType} order book
                  </div>
                )}
              </div>
            )}

            {/* SPREAD BANNER */}
            <div className="ob-spread-banner">
              <div className="ob-spread-price" style={{ color: priceDirection === 'up' ? '#34d399' : priceDirection === 'down' ? '#f87171' : '#f8fafc' }}>
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
                  displayBids.map((bid, idx) => (
                    <div key={`bid-${idx}`} className="ob-row bid">
                      <div
                        className="ob-row-depth-bar"
                        style={{ width: `${bid.depthPct}%` }}
                      />
                      <div className="ob-col price bid">{formatPrice(bid.price)}</div>
                      <div className="ob-col qty">{formatQuantity(bid.quantity)}</div>
                      <div className="ob-col total">{formatTotal(bid.total)}</div>
                    </div>
                  ))
                ) : (
                  <div className="ob-empty-state">
                    No active bids in {marketType} order book
                  </div>
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
          {/* Depth Liquidity Visualization */}
          <div className="ob-depth-card">
            <div className="ob-card-header">
              <div className="ob-card-title">
                <BarChart2 size={16} color="#818cf8" /> Market Depth Liquidity
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Cumulative Curves</span>
            </div>

            {/* SVG Cumulative Depth Chart */}
            <div style={{ width: '100%', height: '220px', position: 'relative' }}>
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

                {/* Left Bid Liquidity Curve (Green) */}
                <path
                  d="M 20 200 L 20 80 Q 110 90 200 195 L 200 200 Z"
                  fill="url(#bidGradient)"
                />
                <path
                  d="M 20 80 Q 110 90 200 195"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                />

                {/* Right Ask Liquidity Curve (Red) */}
                <path
                  d="M 200 200 L 200 195 Q 290 90 380 60 L 380 200 Z"
                  fill="url(#askGradient)"
                />
                <path
                  d="M 200 195 Q 290 90 380 60"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                />

                {/* Center Mid Price Tag */}
                <circle cx="200" cy="195" r="4" fill="#818cf8" />
                <text x="200" y="215" fill="#94a3b8" fontSize="10" textAnchor="middle">
                  Mid: {formatPrice(midPrice)}
                </text>
              </svg>
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
                <div className="ob-stat-box-value" style={{ textTransform: 'capitalize', color: wsStatus === 'connected' ? '#34d399' : '#fbbf24' }}>
                  {wsStatus}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Simulation Help Card (for staging/testing) */}
          <div className="ob-depth-card" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
            <div className="ob-card-title" style={{ fontSize: '0.88rem', marginBottom: '8px' }}>
              <SlidersHorizontal size={14} color="#818cf8" /> Operator Insights
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
              The order book continuously streams from the matching engine via WebSocket. You can switch between <strong>Spot</strong>, <strong>Margin</strong>, and <strong>Futures</strong> order engines in real time without refreshing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
