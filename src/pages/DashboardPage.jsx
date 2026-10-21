import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ShieldAlert,
  ArrowRightLeft,
  Landmark,
  MessageSquare,
  UserCheck,
  TrendingUp,
  Activity,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Wallet,
  Coins,
  ShieldCheck,
  CheckCircle2,
  PieChart as PieChartIcon,
  BarChart3,
  Sliders,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  Zap,
  Clock,
  Lock,
  Scale,
} from 'lucide-react';
import ChartCard from '../components/charts/ChartCard';
import GroupedBarChart from '../components/charts/GroupedBarChart';
import AreaSplineChart from '../components/charts/AreaSplineChart';
import DonutChart from '../components/charts/DonutChart';
import { Shimmer, ShimmerMetricCard } from '../components/Shimmer';
import {
  formatTreasuryHistory,
  formatTradingVolumeHistory,
  formatUserGrowthHistory,
  formatKycTierData,
  formatChainDistributionData,
  formatRevenueBreakdownData,
  formatSupportPriorityData,
} from '../utils/dashboardChartData';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Interactive chart controls state
  const [treasuryTf, setTreasuryTf] = useState('12M');
  const [tradingTf, setTradingTf] = useState('12M');
  const [userGrowthTf, setUserGrowthTf] = useState('12M');
  const [distributionTab, setDistributionTab] = useState('kyc');

  const fetchMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api('/api/dashboard/metrics');
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
      setError(err.message || 'Failed to load metrics from Admin API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const timer = setInterval(fetchMetrics, 30000);
    return () => clearInterval(timer);
  }, []);

  // Normalize camelCase / snake_case responses & ensure numeric types
  const kycPending = Number(metrics?.kyc?.pending ?? metrics?.kyc?.pending_count ?? 0) || 0;
  const kycApproved = Number(metrics?.kyc?.approved ?? metrics?.kyc?.approved_count ?? 0) || 0;
  const kycRejected = Number(metrics?.kyc?.rejected ?? metrics?.kyc?.rejected_count ?? 0) || 0;

  const pendingWd = Number(metrics?.treasury?.pendingWithdrawals ?? metrics?.treasury?.pending_withdrawals ?? 0) || 0;
  const depCount24h = Number(metrics?.treasury?.depositCount24h ?? metrics?.treasury?.deposit_count_24h ?? 0) || 0;
  const depVol24h = metrics?.treasury?.depositVolume24h ?? metrics?.treasury?.deposit_volume_24h ?? '0';
  const wdVol24h = metrics?.treasury?.withdrawalVolume24h ?? metrics?.treasury?.withdrawal_volume_24h ?? '0';

  const openTickets = Number(metrics?.support?.openTickets ?? metrics?.support?.open_tickets ?? 0) || 0;
  const activeUsers = Number(metrics?.users?.totalActive ?? metrics?.users?.total_active ?? 0) || 0;
  const signupsToday = Number(metrics?.users?.signupsToday ?? metrics?.users?.signups_today ?? 0) || 0;
  const signups7d = Number(metrics?.users?.signups7d ?? metrics?.users?.signups_7d ?? 0) || 0;
  const frozenUsers = Number(metrics?.users?.frozenAccounts ?? metrics?.users?.frozen_accounts ?? 0) || 0;
  const failedLogins = Number(metrics?.users?.failedLogins24h ?? metrics?.users?.failed_logins_24h ?? 0) || 0;
  const totalLogins = Number(metrics?.users?.totalLogins24h ?? metrics?.users?.total_logins_24h ?? 0) || 0;

  const spotVol24h = metrics?.spot?.volume24h ?? metrics?.spot?.volume_24h ?? '0';
  const spotTrades24h = Number(metrics?.spot?.tradeCount24h ?? metrics?.spot?.trade_count_24h ?? 0) || 0;
  const topPairs = metrics?.spot?.topPairs24h ?? metrics?.spot?.top_pairs_24h ?? [];

  const futuresOpenPos = Number(metrics?.futures?.openPositions ?? metrics?.futures?.open_positions ?? 0) || 0;
  const futuresExposure = metrics?.futures?.notionalExposure ?? metrics?.futures?.notional_exposure ?? '0';
  const futuresLiquidations = Number(metrics?.futures?.liquidations24h ?? metrics?.futures?.liquidations_24h ?? 0) || 0;
  const futuresRealizedPnl = metrics?.futures?.realizedPnl24h ?? metrics?.futures?.realized_pnl_24h ?? '0';

  const marginDebt = metrics?.margin?.totalDebt ?? metrics?.margin?.total_debt ?? '0';
  const marginNearLiq = Number(metrics?.margin?.accountsNearLiquidation ?? metrics?.margin?.accounts_near_liquidation ?? 0) || 0;
  const marginLiquidations = Number(metrics?.margin?.liquidations24h ?? metrics?.margin?.liquidations_24h ?? 0) || 0;
  const marginInterest24h = metrics?.revenue?.marginInterest24h ?? metrics?.revenue?.margin_interest_24h ?? '0';

  const p2pActiveListings = Number(metrics?.p2p?.activeListings ?? metrics?.p2p?.active_listings ?? 0) || 0;
  const p2pDisputes = Number(metrics?.p2p?.activeDisputes ?? metrics?.p2p?.active_disputes ?? 0) || 0;
  const p2pVol24h = metrics?.p2p?.volume24h ?? metrics?.p2p?.volume_24h ?? '0';
  const p2pCompleted24h = Number(metrics?.p2p?.completedCount24h ?? metrics?.p2p?.completed_count_24h ?? 0) || 0;
  const p2pAvgResHrs = Number(metrics?.p2p?.avgDisputeResolutionHrs ?? metrics?.p2p?.avg_dispute_resolution_hrs ?? 0) || 0;

  const rev24h = metrics?.revenue?.total24h ?? metrics?.revenue?.total_24h ?? '0';

  const failedTxs = Number(metrics?.treasury?.failedTransactions24h ?? metrics?.treasury?.failed_transactions_24h ?? 0) || 0;
  const totalTxs = Number(metrics?.treasury?.totalTransactions24h ?? metrics?.treasury?.total_transactions_24h ?? 0) || 0;
  const supportAvgResHrs = Number(metrics?.support?.avgResolutionHrs ?? metrics?.support?.avg_resolution_hrs ?? 0) || 0;

  // Historical time-series data state keyed by range ('24h', '7d', '30d', '12m')
  const [historyCache, setHistoryCache] = useState({});

  const fetchHistoryForRange = async (rangeStr) => {
    const r = rangeStr.toLowerCase();
    if (historyCache[r]) return; // already cached locally
    try {
      const data = await api(`/api/dashboard/history?range=${r}`);
      setHistoryCache((prev) => ({ ...prev, [r]: data?.points || [] }));
    } catch (err) {
      console.error(`Failed to load history for range ${r}:`, err);
    }
  };

  useEffect(() => {
    fetchHistoryForRange(treasuryTf);
  }, [treasuryTf]);

  useEffect(() => {
    fetchHistoryForRange(tradingTf);
  }, [tradingTf]);

  useEffect(() => {
    fetchHistoryForRange(userGrowthTf);
  }, [userGrowthTf]);

  // Rate calculations
  const txSuccessRate = totalTxs > 0 ? (((totalTxs - failedTxs) / totalTxs) * 100).toFixed(1) : '100.0';
  const authSuccessRate = totalLogins > 0 ? (((totalLogins - failedLogins) / totalLogins) * 100).toFixed(1) : '100.0';

  // Format currency helpers
  const fmtUsd = (val) => {
    const num = parseFloat(val) || 0;
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Derived Chart Datasets from live infrastructure metrics & real database history
  const treasuryChartData = useMemo(() => {
    const points = historyCache[treasuryTf.toLowerCase()] || [];
    return formatTreasuryHistory(points);
  }, [historyCache, treasuryTf]);

  const tradingVolumeData = useMemo(() => {
    const points = historyCache[tradingTf.toLowerCase()] || [];
    return formatTradingVolumeHistory(points);
  }, [historyCache, tradingTf]);

  const userGrowthData = useMemo(() => {
    const points = historyCache[userGrowthTf.toLowerCase()] || [];
    return formatUserGrowthHistory(points, activeUsers);
  }, [historyCache, userGrowthTf, activeUsers]);

  const kycTierData = useMemo(() => formatKycTierData(metrics), [metrics]);
  const chainDistData = useMemo(() => formatChainDistributionData(metrics), [metrics]);
  const revenueBreakdownData = useMemo(() => formatRevenueBreakdownData(metrics), [metrics]);
  const supportPriorityData = useMemo(() => formatSupportPriorityData(metrics), [metrics]);

  // Aggregate stats for badges
  const totalDepInView = treasuryChartData.reduce((acc, d) => acc + (d.deposit || 0), 0);
  const totalWdInView = treasuryChartData.reduce((acc, d) => acc + (d.withdrawal || 0), 0);
  const netFlowInView = totalDepInView - totalWdInView;

  const totalVolInView = tradingVolumeData.reduce((acc, d) => acc + (d.spot || 0) + (d.futures || 0) + (d.p2p || 0), 0);
  const totalSignupsInView = userGrowthData.reduce((acc, d) => acc + (d.newUsers || 0), 0);

  // Streamlined Operator Action Ribbon items
  const operatorItems = [
    {
      id: 'kyc',
      label: 'KYC Queue',
      sub: kycPending > 0 ? 'Review pending' : 'Queue cleared',
      count: kycPending,
      icon: UserCheck,
      color: 'orange',
      urgent: kycPending > 0,
      route: '/kyc-queue',
    },
    {
      id: 'withdrawals',
      label: 'Dual-Signoff',
      sub: pendingWd > 0 ? 'Signoff required' : 'Threshold normal',
      count: pendingWd,
      icon: ArrowRightLeft,
      color: 'yellow',
      urgent: pendingWd > 0,
      route: '/withdrawals-queue',
    },
    {
      id: 'deposits',
      label: 'On-Chain Ledger',
      sub: `${depCount24h} txs today`,
      count: depCount24h,
      icon: Landmark,
      color: 'blue',
      urgent: false,
      route: '/deposits-queue',
    },
    {
      id: 'support',
      label: 'Support Tickets',
      sub: openTickets > 0 ? 'Active backlog' : 'Inbox clear',
      count: openTickets,
      icon: MessageSquare,
      color: 'red',
      urgent: openTickets > 0,
      route: '/support-tickets',
    },
    {
      id: 'users',
      label: 'User Accounts',
      sub: `+${signupsToday} new today`,
      count: activeUsers,
      icon: Users,
      color: 'blue',
      urgent: false,
      route: '/users',
    },
    {
      id: 'risk',
      label: 'Risk Switches',
      sub: frozenUsers > 0 ? `${frozenUsers} restricted` : 'All systems nominal',
      count: frozenUsers > 0 ? frozenUsers : 'Nominal',
      icon: ShieldAlert,
      color: frozenUsers > 0 ? 'yellow' : 'green',
      urgent: frozenUsers > 0,
      route: '/policies',
    },
  ];

  return (
    <div className="dashboard" style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div className="welcome-banner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h2>Limiance Operations & Risk Overview</h2>
            <p>
              Signed in as <strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong> Â· Real-time operational intelligence across spot, futures, treasury, and compliance.
            </p>
            <div className="role-chips">
              {roles.map((role) => (
                <span key={role} className="role-chip">
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={fetchMetrics}
              className="btn btn-primary"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Live Metrics
            </button>
          </div>
        </div>

        {/* Top Highlight Statistics Pills */}
        <div className="stat-pills-container">
          <div className="stat-pill">
            <div className="stat-pill-label">24h Spot Turnover</div>
            <div className="stat-pill-value" style={{ color: 'var(--info-text)' }}>
              {loading && !metrics ? <Shimmer width="90px" height="22px" style={{ display: 'inline-block' }} /> : `$${fmtUsd(spotVol24h)}`}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {loading && !metrics ? <Shimmer width="110px" height="11px" style={{ display: 'inline-block' }} /> : `${spotTrades24h.toLocaleString()} trades executed`}
            </div>
          </div>

          <div className="stat-pill">
            <div className="stat-pill-label">24h Treasury Flow</div>
            <div className="stat-pill-value" style={{ color: 'var(--success-text)' }}>
              {loading && !metrics ? <Shimmer width="90px" height="22px" style={{ display: 'inline-block' }} /> : `$${fmtUsd(depVol24h)}`}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {loading && !metrics ? <Shimmer width="100px" height="11px" style={{ display: 'inline-block' }} /> : `${depCount24h} on-chain deposits`}
            </div>
          </div>

          <div className="stat-pill">
            <div className="stat-pill-label">Futures Open Interest</div>
            <div className="stat-pill-value" style={{ color: 'var(--accent-blue)' }}>
              {loading && !metrics ? <Shimmer width="90px" height="22px" style={{ display: 'inline-block' }} /> : `$${fmtUsd(futuresExposure)}`}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {loading && !metrics ? <Shimmer width="110px" height="11px" style={{ display: 'inline-block' }} /> : `${futuresOpenPos} open contracts`}
            </div>
          </div>

          <div className="stat-pill">
            <div className="stat-pill-label">24h Net Revenue</div>
            <div className="stat-pill-value" style={{ color: 'var(--warning-text)' }}>
              {loading && !metrics ? <Shimmer width="90px" height="22px" style={{ display: 'inline-block' }} /> : `$${fmtUsd(rev24h)}`}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Trading & withdrawal fees
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--danger-border)', color: 'var(--danger-text)', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Streamlined Operator Action Ribbon */}
      <div className="operator-ribbon-container">
        <div className="operator-ribbon-header">
          <div className="operator-ribbon-title">
            <Zap size={14} style={{ color: "var(--info-text)" }} />
            Quick Operator Dispatch & Queues
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            One-click jump to pending approvals, queues & risk policies
          </span>
        </div>
        <div className="operator-ribbon-grid">
          {operatorItems.map((item) => {
            const IconComp = item.icon;
            return (
              <div
                key={item.id}
                className={`operator-pill-btn ${item.urgent ? 'urgent' : ''}`}
                onClick={() => navigate(item.route)}
                title={`Open ${item.label}`}
              >
                <div className="operator-pill-left">
                  <div className={`operator-pill-icon ${item.color}`}>
                    <IconComp size={16} />
                  </div>
                  <div className="operator-pill-meta">
                    <span className="operator-pill-name">{item.label}</span>
                    <span className="operator-pill-sub">{item.sub}</span>
                  </div>
                </div>
                <div className="operator-pill-right">
                  {item.urgent && <span className="pulsing-dot" />}
                  <span
                    className={`operator-pill-badge ${
                      item.urgent ? 'urgent' : item.count === 'Nominal' ? 'nominal' : ''
                    }`}
                  >
                    {loading && !metrics ? 'â€¦' : item.count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Core Operational Telemetry Pulse */}
      <div className="telemetry-grid">
        {/* On-Chain Settlement Health */}
        <div className="telemetry-card">
          <div className="telemetry-card-top">
            <span className="telemetry-label">Settlement Success (24h)</span>
            <span className={`telemetry-icon ${failedTxs > 0 ? 'warning' : 'success'}`}>
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div className="telemetry-value" style={{ color: failedTxs > 0 ? 'var(--warning-text)' : 'var(--success-text)' }}>
            {loading && !metrics ? <Shimmer width="80px" height="26px" /> : `${txSuccessRate}%`}
          </div>
          <div className="telemetry-footer">
            {loading && !metrics ? (
              <Shimmer width="120px" height="12px" />
            ) : (
              <>
                <span>{totalTxs.toLocaleString()} total txs</span>
                <span>Â·</span>
                <span style={{ color: failedTxs > 0 ? 'var(--danger-text)' : 'inherit' }}>
                  {failedTxs} failed
                </span>
              </>
            )}
          </div>
        </div>

        {/* P2P Escrow & OTC Liquidity */}
        <div className="telemetry-card">
          <div className="telemetry-card-top">
            <span className="telemetry-label">P2P Escrow Flow (24h)</span>
            <span className="telemetry-icon success">
              <ArrowRightLeft size={16} />
            </span>
          </div>
          <div className="telemetry-value" style={{ color: 'var(--success-text)' }}>
            {loading && !metrics ? <Shimmer width="80px" height="26px" /> : `$${fmtUsd(p2pVol24h)}`}
          </div>
          <div className="telemetry-footer">
            {loading && !metrics ? (
              <Shimmer width="140px" height="12px" />
            ) : (
              <>
                <span>{p2pCompleted24h} trades completed</span>
                <span>Â·</span>
                <span>{p2pDisputes} disputes</span>
              </>
            )}
          </div>
        </div>

        {/* Identity & Auth Security Sentinel */}
        <div className="telemetry-card">
          <div className="telemetry-card-top">
            <span className="telemetry-label">Auth Security Index (24h)</span>
            <span className={`telemetry-icon ${failedLogins > 5 ? 'danger' : 'info'}`}>
              <ShieldAlert size={16} />
            </span>
          </div>
          <div className="telemetry-value" style={{ color: failedLogins > 5 ? 'var(--danger-text)' : 'var(--text-primary)' }}>
            {loading && !metrics ? <Shimmer width="80px" height="26px" /> : `${authSuccessRate}% Pass`}
          </div>
          <div className="telemetry-footer">
            {loading && !metrics ? (
              <Shimmer width="130px" height="12px" />
            ) : (
              <>
                <span>{failedLogins} rejected attempts</span>
                <span>Â·</span>
                <span>{frozenUsers} frozen</span>
              </>
            )}
          </div>
        </div>

        {/* Customer Support Velocity */}
        <div className="telemetry-card">
          <div className="telemetry-card-top">
            <span className="telemetry-label">Support Response Health</span>
            <span className={`telemetry-icon ${openTickets > 0 ? 'warning' : 'info'}`}>
              <MessageSquare size={16} />
            </span>
          </div>
          <div className="telemetry-value" style={{ color: openTickets > 0 ? 'var(--warning-text)' : 'var(--text-primary)' }}>
            {loading && !metrics ? <Shimmer width="80px" height="26px" /> : `${openTickets} Open`}
          </div>
          <div className="telemetry-footer">
            {loading && !metrics ? (
              <Shimmer width="110px" height="12px" />
            ) : (
              <>
                <span>{Number(supportAvgResHrs) > 0 ? `${Number(supportAvgResHrs).toFixed(1)}h` : '< 2h'} turnaround</span>
                <span>·</span>
                <span>Triage queue active</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Visual Analytics & Surveillance Charts */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 className="analytics-section-title">
              Platform Analytics & Flow Dynamics
            </h3>
            <p className="analytics-section-sub">
              Live graphical telemetry across cash flows, liquidity, trading volumes, and onboarding
            </p>
          </div>
          <div className="analytics-stream-badge">
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-text)', boxShadow: '0 0 8px var(--success-text)' }} />
            Streaming Live Metrics
          </div>
        </div>

        {/* Row 1: Treasury Inflow/Outflow vs Trading Volume Trends */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(540px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Deposits vs Withdrawals Grouped Bar Chart */}
          <ChartCard
            title="Treasury Inflow & Outflow (Deposits vs Withdrawals)"
            subtitle="Side-by-side transaction volume comparison and net platform treasury changes"
            icon={Landmark}
            badge={
              netFlowInView >= 0
                ? `+$${(netFlowInView / 1000).toFixed(1)}k Net Inflow`
                : `-$${(Math.abs(netFlowInView) / 1000).toFixed(1)}k Net Outflow`
            }
            badgeColor={netFlowInView >= 0 ? 'var(--success-text)' : 'var(--danger-text)'}
            timeframe={treasuryTf}
            onTimeframeChange={setTreasuryTf}
            timeframes={['24H', '7D', '30D', '12M']}
            actionLabel="Treasury Queue â†’"
            onAction={() => navigate('/withdrawals-queue')}
          >
            <GroupedBarChart
              data={treasuryChartData}
              series={[
                { key: 'deposit', name: 'Deposits', color: 'var(--success)' },
                { key: 'withdrawal', name: 'Withdrawals', color: 'var(--warning-text)' },
              ]}
              height={260}
              valueFormatter={(v) => `$${Number(v).toLocaleString()}`}
            />
          </ChartCard>

          {/* Trading Volume & Exposure Radar (Spot, Futures, P2P) */}
          <ChartCard
            title="Market Volume & Exposure Radar"
            subtitle="Comparative liquidity velocity across Spot markets, Futures open exposure, and P2P"
            icon={TrendingUp}
            badge={`$${(totalVolInView / 1000000).toFixed(2)}M Flow`}
            badgeColor="var(--info-text)"
            timeframe={tradingTf}
            onTimeframeChange={setTradingTf}
            timeframes={['24H', '7D', '30D', '12M']}
            actionLabel="Orders Explorer â†’"
            onAction={() => navigate('/orders')}
          >
            <AreaSplineChart
              data={tradingVolumeData}
              series={[
                { key: 'spot', name: 'Spot Trading', color: 'var(--info-text)' },
                { key: 'futures', name: 'Futures Notional', color: 'var(--accent-sky)' },
                { key: 'p2p', name: 'P2P Settlement', color: 'var(--success-text)' },
              ]}
              height={260}
              valueFormatter={(v) => `$${Number(v).toLocaleString()}`}
              showLegend={true}
              legendToggleable={true}
            />
          </ChartCard>
        </div>

        {/* Row 2: Exchange Monetization & Derivatives Surveillance Radar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(540px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Revenue Breakdown Donut Chart */}
          <ChartCard
            title="Platform Revenue Streams & Fee Composition"
            subtitle="24h protocol monetization split across Spot fees, Withdrawal gas fees, and Margin interest"
            icon={DollarSign}
            badge={`Est. ARR: $${fmtUsd((parseFloat(rev24h) || 0) * 365)}`}
            badgeColor="var(--warning-text)"
            actionLabel="Fee Schedules â†’"
            onAction={() => navigate('/fee-tiers')}
          >
            <div style={{ padding: '0.5rem 0' }}>
              <DonutChart
                data={revenueBreakdownData}
                size={190}
                strokeWidth={24}
                centerTitle={`$${fmtUsd(rev24h)}`}
                centerSubtitle="24h Revenue"
                valueFormatter={(v) => `$${Number(v).toLocaleString()}`}
              />
            </div>
          </ChartCard>

          {/* Derivatives & Margin Risk Surveillance Matrix */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '1.5rem',
              boxShadow: 'var(--card-shadow)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={18} style={{ color: "var(--danger-text)" }} />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Derivatives & Margin Risk Matrix
                  </h3>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  Forced closeouts, outstanding credit risk, and real-time liquidation monitoring
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/derivatives')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-strong)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 6px',
                }}
              >
                Risk Specs â†’
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flex: 1, alignItems: 'center' }}>
              <div style={{ background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Futures Liquidations (24h)
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: futuresLiquidations > 0 ? 'var(--danger-text)' : 'var(--success-text)', fontFamily: 'var(--font-mono)' }}>
                  {futuresLiquidations} events
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {futuresOpenPos} active contracts
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Realized Futures PnL (24h)
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: parseFloat(futuresRealizedPnl) >= 0 ? 'var(--success-text)' : 'var(--danger-text)', fontFamily: 'var(--font-mono)' }}>
                  {parseFloat(futuresRealizedPnl) >= 0 ? '+' : ''}${fmtUsd(futuresRealizedPnl)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Net closed contract delta
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Margin Borrow Debt
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--warning-text)', fontFamily: 'var(--font-mono)' }}>
                  ${fmtUsd(marginDebt)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  +${fmtUsd(marginInterest24h)} interest (24h)
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Margin Warning Band
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: marginNearLiq > 0 ? 'var(--warning-text)' : 'var(--success-text)', fontFamily: 'var(--font-mono)' }}>
                  {marginNearLiq} accounts
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Accounts within 1.3x margin call
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: User Growth Trajectory & KYC/Chain Distribution */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(540px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* User Growth & Onboarding Chart */}
          <ChartCard
            title="Client Accounts & Growth Trajectory"
            subtitle="Cumulative active user accounts and periodic onboarding velocity"
            icon={Users}
            badge={`+${totalSignupsInView.toLocaleString()} Signups`}
            badgeColor="var(--accent-sky)"
            timeframe={userGrowthTf}
            onTimeframeChange={setUserGrowthTf}
            timeframes={['7D', '30D', '12M']}
            actionLabel="User Management â†’"
            onAction={() => navigate('/users')}
          >
            <AreaSplineChart
              data={userGrowthData}
              series={[
                { key: 'totalUsers', name: 'Total Accounts', color: 'var(--info-text)' },
                { key: 'newUsers', name: 'New Signups', color: 'var(--success-text)' },
              ]}
              height={250}
              valueFormatter={(v) => `${Number(v).toLocaleString()} users`}
              showLegend={true}
              legendToggleable={true}
            />
          </ChartCard>

          {/* KYC Tier & Chain Custody Distribution Card */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '1.5rem',
              boxShadow: 'var(--card-shadow)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} style={{ color: "var(--info-text)" }} />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {distributionTab === 'kyc' ? 'KYC Compliance Distribution' : 'Custody Wallets by Chain'}
                  </h3>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  {distributionTab === 'kyc'
                    ? 'Breakdown of client base across identity verification tiers'
                    : 'Active multi-chain custody wallets managed by Limiance'}
                </p>
              </div>

              {/* Toggle Tab between KYC & Chains */}
              <div style={{ display: 'flex', background: 'var(--bg-deep)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setDistributionTab('kyc')}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: distributionTab === 'kyc' ? 'var(--primary)' : 'transparent',
                    color: distributionTab === 'kyc' ? '#fff' : 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  KYC Tiers
                </button>
                <button
                  type="button"
                  onClick={() => setDistributionTab('chains')}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: distributionTab === 'chains' ? 'var(--primary)' : 'transparent',
                    color: distributionTab === 'chains' ? '#fff' : 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Blockchains
                </button>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {distributionTab === 'kyc' ? (
                <DonutChart
                  data={kycTierData}
                  size={190}
                  strokeWidth={24}
                  centerTitle={`${activeUsers}`}
                  centerSubtitle="Active Users"
                  valueFormatter={(v) => `${Number(v).toLocaleString()}`}
                />
              ) : chainDistData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <Wallet size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <div>No multi-chain custody wallets registered.</div>
                </div>
              ) : (
                <DonutChart
                  data={chainDistData}
                  size={190}
                  strokeWidth={24}
                  centerTitle={`${chainDistData.reduce((acc, c) => acc + c.value, 0)}`}
                  centerSubtitle="Total Wallets"
                  valueFormatter={(v) => `${Number(v).toLocaleString()}`}
                />
              )}
            </div>
          </div>
        </div>

        {/* Row 4: Spot Order Book Top Pairs & Support Priority Radar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(540px, 1fr))', gap: '1.5rem' }}>
          {/* Spot Markets & Top Pairs Visualizer */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '1.5rem',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} style={{ color: "var(--info-text)" }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Top Trading Pairs by Volume (24h)
                </h3>
              </div>
              <button
                onClick={() => navigate('/orders')}
                style={{ background: 'none', border: 'none', color: 'var(--primary-strong)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Order Book Explorer â†’
              </button>
            </div>

            {topPairs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                <Activity size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <div>No spot trades recorded in the last 24 hours.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topPairs.map((p, idx) => {
                  const volNum = parseFloat(p.volume) || 0;
                  const totalVolNum = parseFloat(spotVol24h) || 1;
                  const pct = Math.min(100, Math.max(8, (volNum / totalVolNum) * 100));
                  return (
                    <div key={idx} style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                          {p.symbol}
                        </span>
                        <span style={{ color: 'var(--info-text)', fontWeight: 600, fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                          ${fmtUsd(p.volume)}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--overlay-2)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent-sky))', borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Support Priority & Incident Triage Radar */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '1.5rem',
              boxShadow: 'var(--card-shadow)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} style={{ color: "var(--warning-text)" }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Customer Support Priority Triage
                </h3>
              </div>
              <button
                onClick={() => navigate('/support-tickets')}
                style={{ background: 'none', border: 'none', color: 'var(--primary-strong)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Tickets Console â†’
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '1.25rem' }}>
              {supportPriorityData.map((pri) => (
                <div key={pri.label} style={{ background: 'var(--bg-surface)', padding: '12px 10px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {pri.label}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: pri.color, fontFamily: 'var(--font-mono)' }}>
                    {pri.value}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: '8px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} style={{ color: "var(--info-text)" }} />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Average Ticket Resolution</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--success-text)', fontSize: '13px' }}>
                {Number(supportAvgResHrs) > 0 ? `${Number(supportAvgResHrs).toFixed(1)} hrs` : '< 2.5 hrs'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
