import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Coins,
  BarChart3,
  RefreshCw,
  Search,
  PieChart,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { api } from '../api/client';
import ChartCard from '../components/charts/ChartCard';
import AreaSplineChart from '../components/charts/AreaSplineChart';
import DonutChart from '../components/charts/DonutChart';
import { Shimmer, ShimmerTableRows } from '../components/Shimmer';
import './MarketOverviewPage.css';

const DONUT_COLORS = [
  'var(--info)',
  'var(--success)',
  'var(--warning)',
  '#ec4899',
  '#06b6d4',
  '#8b5cf6',
  '#14b8a6',
  'var(--text-muted)',
];

export default function MarketOverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('24h');
  const [selectedMarket, setSelectedMarket] = useState('all'); // 'all', 'spot', 'margin', 'futures'
  const [activeTab, setActiveTab] = useState('pairs');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('volume');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchOverview = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api(`/api/markets/overview?timeframe=${timeframe}`);
      setData(res);
    } catch (err) {
      console.error('Failed to fetch market overview:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [timeframe]);

  const summary = data?.summary || {};
  const timeline = data?.timeline || [];
  const pairs = data?.pairs || [];
  const tokens = data?.tokens || [];

  // Filter & sort pairs
  const filteredPairs = useMemo(() => {
    return pairs
      .filter((p) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
          p.symbol?.toLowerCase().includes(q) ||
          p.base?.toLowerCase().includes(q) ||
          p.quote?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (sortBy === 'volume') {
          valA = parseFloat(a.quote_volume) || 0;
          valB = parseFloat(b.quote_volume) || 0;
        } else if (sortBy === 'change') {
          valA = a.price_change_pct || 0;
          valB = b.price_change_pct || 0;
        } else if (sortBy === 'trades') {
          valA = a.trades_count || 0;
          valB = b.trades_count || 0;
        } else if (sortBy === 'price') {
          valA = parseFloat(a.last_price) || 0;
          valB = parseFloat(b.last_price) || 0;
        } else {
          return sortOrder === 'asc'
            ? a.symbol.localeCompare(b.symbol)
            : b.symbol.localeCompare(a.symbol);
        }
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      });
  }, [pairs, searchQuery, sortBy, sortOrder]);

  // Filter & sort tokens
  const filteredTokens = useMemo(() => {
    return tokens
      .filter((t) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
          t.symbol?.toLowerCase().includes(q) ||
          t.name?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (sortBy === 'volume') {
          valA = parseFloat(a.total_volume) || 0;
          valB = parseFloat(b.total_volume) || 0;
        } else if (sortBy === 'trades') {
          valA = a.trades_count || 0;
          valB = b.trades_count || 0;
        } else if (sortBy === 'share') {
          valA = a.market_share_pct || 0;
          valB = b.market_share_pct || 0;
        } else {
          return sortOrder === 'asc'
            ? a.symbol.localeCompare(b.symbol)
            : b.symbol.localeCompare(a.symbol);
        }
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      });
  }, [tokens, searchQuery, sortBy, sortOrder]);

  // Prepare Donut Chart slices for Top Tokens
  const donutData = useMemo(() => {
    if (!tokens || tokens.length === 0) return [];
    const sorted = [...tokens].sort(
      (a, b) => (parseFloat(b.total_volume) || 0) - (parseFloat(a.total_volume) || 0)
    );
    const topTokens = sorted.slice(0, 6);
    const otherTokens = sorted.slice(6);
    const othersVol = otherTokens.reduce(
      (acc, t) => acc + (parseFloat(t.total_volume) || 0),
      0
    );

    const slices = topTokens.map((t, idx) => ({
      name: t.symbol,
      value: parseFloat(t.total_volume) || 0,
      color: DONUT_COLORS[idx % DONUT_COLORS.length],
    }));

    if (othersVol > 0) {
      slices.push({
        name: 'Others',
        value: othersVol,
        color: DONUT_COLORS[7],
      });
    }

    return slices;
  }, [tokens]);

  const formatCurrency = (v) => {
    const n = parseFloat(v) || 0;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}k`;
    return `$${n.toFixed(2)}`;
  };

  const formatPrice = (v) => {
    const n = parseFloat(v) || 0;
    if (n === 0) return '$0.00';
    if (n < 0.0001) return `$${n.toFixed(8)}`;
    if (n < 1) return `$${n.toFixed(4)}`;
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  };

  return (
    <div className="market-overview-page">
      {/* Page Header */}
      <div className="mo-header">
        <div className="mo-title-group">
          <h1>
            <Coins size={26} style={{ color: "var(--info-text)" }} /> Market Performance Overview
          </h1>
          <p>
            Real-time trade performance, volume timelines, pair price movements, and token turnover.
          </p>
        </div>

        <div className="mo-header-actions">
          <div className="mo-timeframe-selector">
            {['24h', '7d', '30d', 'all'].map((tf) => (
              <button
                key={tf}
                type="button"
                className={`mo-tf-btn ${timeframe === tf ? 'active' : ''}`}
                onClick={() => setTimeframe(tf)}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="mo-refresh-btn"
            onClick={() => fetchOverview(true)}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="mo-metrics-grid">
        <div className="mo-metric-card">
          <div className="mo-metric-top">
            <span className="mo-metric-label">Total Volume ({timeframe.toUpperCase()})</span>
            <div className="mo-metric-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--info-text)' }}>
              <BarChart3 size={20} />
            </div>
          </div>
          <div className="mo-metric-value">
            {loading ? <Shimmer width="120px" height="26px" /> : formatCurrency(summary.total_volume_quote)}
          </div>
          <div className="mo-metric-sub">
            <span>Trading turnover across all spot markets</span>
          </div>
        </div>

        <div className="mo-metric-card">
          <div className="mo-metric-top">
            <span className="mo-metric-label">Total Trades</span>
            <div className="mo-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success-text)' }}>
              <Activity size={20} />
            </div>
          </div>
          <div className="mo-metric-value">
            {loading ? <Shimmer width="90px" height="26px" /> : Number(summary.total_trades || 0).toLocaleString()}
          </div>
          <div className="mo-metric-sub">
            <span>Filled orders in selected window</span>
          </div>
        </div>

        <div className="mo-metric-card">
          <div className="mo-metric-top">
            <span className="mo-metric-label">Active Pairs</span>
            <div className="mo-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning-text)' }}>
              <Layers size={20} />
            </div>
          </div>
          <div className="mo-metric-value">
            {loading ? (
              <Shimmer width="80px" height="26px" />
            ) : (
              <>
                {summary.active_pairs_count || 0}
                <span style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', fontWeight: 500, marginLeft: '6px' }}>
                  / {pairs.length} Listed
                </span>
              </>
            )}
          </div>
          <div className="mo-metric-sub">
            <span>
              {pairs.length > 0
                ? `${Math.round(((summary.active_pairs_count || 0) / pairs.length) * 100)}% market activity`
                : '0% market activity'}
            </span>
          </div>
        </div>

        <div className="mo-metric-card">
          <div className="mo-metric-top">
            <span className="mo-metric-label">Top Gainer ({timeframe.toUpperCase()})</span>
            <div className="mo-metric-icon" style={{ background: 'rgba(52, 211, 153, 0.15)', color: 'var(--success-text)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mo-metric-value">
            {loading ? <Shimmer width="100px" height="26px" /> : (summary.top_gainer_pair || 'N/A')}
          </div>
          <div className="mo-metric-sub" style={{ color: (Number(summary.top_gainer_pct) || 0) >= 0 ? 'var(--success-text)' : 'var(--danger-text)', fontWeight: 600 }}>
            {summary.top_gainer_pct !== undefined ? `${Number(summary.top_gainer_pct) >= 0 ? '+' : ''}${Number(summary.top_gainer_pct || 0).toFixed(2)}%` : '0.00%'}
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="mo-charts-grid">
        {/* Chart 1: Volume & Trading Activity Timeline */}
        <ChartCard
          title="Market Volume Timeline"
          subtitle={`Trading volume breakdown over the last ${timeframe.toUpperCase()}`}
          icon={BarChart3}
          badge={
            selectedMarket === 'all'
              ? formatCurrency(summary.total_volume_quote)
              : selectedMarket === 'spot'
              ? formatCurrency(summary.total_spot_volume || summary.total_volume_quote)
              : selectedMarket === 'margin'
              ? formatCurrency(summary.total_margin_volume || 0)
              : formatCurrency(summary.total_futures_volume || 0)
          }
          badgeColor="var(--info-text)"
        >
          {/* Market Type Selector Controls */}
          <div className="mo-chart-tabs-bar">
            {[
              { id: 'all', label: 'All Markets' },
              { id: 'spot', label: 'Spot' },
              { id: 'margin', label: 'Margin' },
              { id: 'futures', label: 'Futures' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                className={`mo-chart-tab-btn ${selectedMarket === m.id ? 'active' : ''}`}
                onClick={() => setSelectedMarket(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>

          <AreaSplineChart
            data={timeline.map((p) => ({
              label: p.label,
              volume: parseFloat(p.volume) || 0,
              spot: parseFloat(p.spot_volume || (selectedMarket === 'spot' ? p.volume : 0)) || 0,
              margin: parseFloat(p.margin_volume || 0) || 0,
              futures: parseFloat(p.futures_volume || 0) || 0,
              trades: p.trades_count || 0,
            }))}
            series={
              selectedMarket === 'all'
                ? [
                    { key: 'spot', name: 'Spot Volume', color: 'var(--info-text)' },
                    { key: 'margin', name: 'Margin Volume', color: 'var(--warning-text)' },
                    { key: 'futures', name: 'Futures Volume', color: 'var(--success)' },
                  ]
                : selectedMarket === 'spot'
                ? [{ key: 'spot', name: 'Spot Volume', color: 'var(--info-text)' }]
                : selectedMarket === 'margin'
                ? [{ key: 'margin', name: 'Margin Volume', color: 'var(--warning-text)' }]
                : [{ key: 'futures', name: 'Futures Volume', color: 'var(--success)' }]
            }
            height={280}
            valueFormatter={(v) => formatCurrency(v)}
            showLegend={true}
            legendToggleable={selectedMarket === 'all'}
          />
        </ChartCard>

        {/* Chart 2: Token Volume Distribution (Market Share) */}
        <ChartCard
          title="Token Volume Share"
          subtitle="Top assets by traded volume dominance"
          icon={PieChart}
          badge={`${tokens.length} Assets`}
          badgeColor="var(--success-text)"
        >
          <DonutChart
            data={donutData}
            size={190}
            strokeWidth={24}
            centerTitle={formatCurrency(summary.total_volume_quote)}
            centerSubtitle="Turnover"
            valueFormatter={(v) => formatCurrency(v)}
          />
        </ChartCard>
      </div>

      {/* Interactive Tabs and Performance Tables */}
      <div className="mo-table-section">
        <div className="mo-table-header">
          <div className="mo-tabs">
            <button
              type="button"
              className={`mo-tab-btn ${activeTab === 'pairs' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('pairs');
                setSortBy('volume');
              }}
            >
              <Coins size={16} /> Trading Pairs Performance
              <span className="mo-badge-count">{pairs.length}</span>
            </button>
            <button
              type="button"
              className={`mo-tab-btn ${activeTab === 'tokens' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('tokens');
                setSortBy('volume');
              }}
            >
              <Layers size={16} /> Token Turnover & Dominance
              <span className="mo-badge-count">{tokens.length}</span>
            </button>
          </div>

          <div className="mo-table-controls">
            <div className="mo-search-box">
              <Search size={16} className="mo-search-icon" />
              <input
                type="text"
                placeholder={activeTab === 'pairs' ? 'Search pairs (e.g. BTC)...' : 'Search tokens...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mo-search-input"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Sort by:</span>
              <select
                className="mo-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {activeTab === 'pairs' ? (
                  <>
                    <option value="volume">Quote Volume</option>
                    <option value="change">Price Change %</option>
                    <option value="trades">Trade Count</option>
                    <option value="price">Last Price</option>
                    <option value="symbol">Symbol</option>
                  </>
                ) : (
                  <>
                    <option value="volume">Total Volume</option>
                    <option value="share">Market Share %</option>
                    <option value="trades">Trade Count</option>
                    <option value="symbol">Symbol</option>
                  </>
                )}
              </select>

              <button
                type="button"
                className="mo-refresh-btn"
                style={{ padding: '8px' }}
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                title={`Sort ${sortOrder === 'desc' ? 'Ascending' : 'Descending'}`}
              >
                <ArrowUpDown size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Pairs Table */}
        {activeTab === 'pairs' && (
          <div className="mo-table-wrapper">
            <table className="mo-table">
              <thead>
                <tr>
                  <th>Trading Pair</th>
                  <th>Last Price</th>
                  <th>Change ({timeframe.toUpperCase()})</th>
                  <th>24h High / Low</th>
                  <th>Quote Volume</th>
                  <th>Base Volume</th>
                  <th>Trades</th>
                  <th>Order Flow (Buy / Sell)</th>
                </tr>
              </thead>
              <tbody>
                {filteredPairs.length > 0 ? (
                  filteredPairs.map((p) => {
                    const chg = Number(p.price_change_pct) || 0;
                    const isPos = chg > 0;
                    const isNeg = chg < 0;
                    const buyPct = Math.round(p.buy_ratio || 50);
                    const sellPct = 100 - buyPct;

                    return (
                      <tr key={p.symbol}>
                        <td>
                          <div className="mo-pair-cell">
                            <div className="mo-pair-icon">
                              {p.base ? p.base.charAt(0) : 'P'}
                            </div>
                            <div>
                              <div className="mo-pair-symbol">{p.symbol}</div>
                              <div className="mo-pair-meta">
                                {p.base} / {p.quote}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {formatPrice(p.last_price)}
                          </span>
                        </td>
                        <td>
                          <span className={`mo-change-badge ${isPos ? 'pos' : isNeg ? 'neg' : 'neutral'}`}>
                            {isPos && <TrendingUp size={12} />}
                            {isNeg && <TrendingDown size={12} />}
                            {isPos ? '+' : ''}{chg.toFixed(2)}%
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.82rem' }}>
                            <span style={{ color: 'var(--success-text)' }}>H: {formatPrice(p.high_price)}</span>
                            <br />
                            <span style={{ color: 'var(--danger-text)' }}>L: {formatPrice(p.low_price)}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {formatCurrency(p.quote_volume)}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-tertiary)' }}>
                            {parseFloat(p.base_volume || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })} {p.base}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                            {Number(p.trades_count || 0).toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <div className="mo-ratio-bar-wrap">
                            <div className="mo-ratio-bar-fill" style={{ width: `${buyPct}%` }} />
                          </div>
                          <div className="mo-ratio-text">
                            <span style={{ color: 'var(--success-text)' }}>{buyPct}% Buy</span>
                            <span style={{ color: 'var(--danger-text)' }}>{sellPct}% Sell</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : loading ? (
                  <ShimmerTableRows rows={6} cols={8} colWidths={['25%', '20%', '15%', '15%', '20%', '20%', '15%', '15%']} />
                ) : (
                  <tr>
                    <td colSpan="8" className="mo-empty">
                      No trading pairs match your search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Tokens Table */}
        {activeTab === 'tokens' && (
          <div className="mo-table-wrapper">
            <table className="mo-table">
              <thead>
                <tr>
                  <th>Asset / Token</th>
                  <th>Turnover Volume</th>
                  <th>Market Dominance</th>
                  <th>Trades Executed</th>
                  <th>Trading Pairs</th>
                  <th>Supported Chains</th>
                </tr>
              </thead>
              <tbody>
                {filteredTokens.length > 0 ? (
                  filteredTokens.map((t) => {
                    const share = Number(t.market_share_pct) || 0;
                    return (
                      <tr key={t.symbol}>
                        <td>
                          <div className="mo-pair-cell">
                            <div className="mo-pair-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success-text)' }}>
                              {t.symbol.charAt(0)}
                            </div>
                            <div>
                              <div className="mo-pair-symbol">{t.symbol}</div>
                              <div className="mo-pair-meta">{t.name || t.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {formatCurrency(t.total_volume)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '80px', height: '6px', background: 'var(--overlay-3)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.min(100, share)}%`, background: 'var(--info)' }} />
                            </div>
                            <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--info-text)' }}>
                              {share.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                            {Number(t.trades_count || 0).toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-tertiary)' }}>
                            {t.pairs_count || 0} pairs
                          </span>
                        </td>
                        <td>
                          <div className="mo-chain-pills">
                            {t.chains && t.chains.length > 0 ? (
                              t.chains.map((c) => (
                                <span key={c} className="mo-chain-pill">
                                  {c}
                                </span>
                              ))
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Native</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : loading ? (
                  <ShimmerTableRows rows={6} cols={6} colWidths={['25%', '25%', '20%', '15%', '15%', '15%']} />
                ) : (
                  <tr>
                    <td colSpan="6" className="mo-empty">
                      No tokens match your search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
