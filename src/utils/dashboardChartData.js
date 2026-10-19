/**
 * Pure data formatting utilities mapping live infrastructure metrics and
 * historical database queries into chart presentation structures.
 *
 * ZERO synthetic multipliers or fake fallback values. All data is sourced
 * strictly from Postgres, Redis, and backend API responses.
 */

/**
 * Maps live /api/dashboard/history response points to GroupedBarChart format
 */
export function formatTreasuryHistory(points = []) {
  if (!points || points.length === 0) return [];
  return points.map((p) => ({
    label: p.label,
    timestamp: p.timestamp,
    deposit: parseFloat(p.deposit) || 0,
    withdrawal: parseFloat(p.withdrawal) || 0,
  }));
}

/**
 * Maps live /api/dashboard/history response points to AreaSplineChart format
 */
export function formatTradingVolumeHistory(points = []) {
  if (!points || points.length === 0) return [];
  return points.map((p) => ({
    label: p.label,
    timestamp: p.timestamp,
    spot: parseFloat(p.spotVolume) || 0,
    futures: parseFloat(p.futuresVolume) || 0,
    p2p: parseFloat(p.p2pVolume) || 0,
  }));
}

/**
 * Maps live /api/dashboard/history response points to User Growth format
 */
export function formatUserGrowthHistory(points = [], currentTotalActive = 0) {
  if (!points || points.length === 0) return [];
  let running = 0;
  return points.map((p) => {
    const signups = parseInt(p.newSignups, 10) || 0;
    running += signups;
    return {
      label: p.label,
      timestamp: p.timestamp,
      newUsers: signups,
      totalUsers: running,
    };
  });
}

/**
 * Formats live fee revenue streams from metrics.revenue
 */
export function formatRevenueBreakdownData(metrics) {
  const spotFees = parseFloat(metrics?.revenue?.spotFees24h ?? metrics?.revenue?.spot_fees_24h ?? 0) || 0;
  const wdFees = parseFloat(metrics?.revenue?.withdrawalFees24h ?? metrics?.revenue?.withdrawal_fees_24h ?? 0) || 0;
  const marginInterest = parseFloat(metrics?.revenue?.marginInterest24h ?? metrics?.revenue?.margin_interest_24h ?? 0) || 0;

  return [
    { label: 'Spot Trading Fees', value: spotFees, color: 'var(--info-text)' },
    { label: 'Withdrawal Fees', value: wdFees, color: 'var(--accent-sky)' },
    { label: 'Margin Borrow Interest', value: marginInterest, color: 'var(--warning-text)' },
  ];
}

/**
 * Formats real user KYC tier breakdown from metrics.users.kycTierBreakdown
 */
export function formatKycTierData(metrics) {
  const breakdown = metrics?.users?.kycTierBreakdown || {};
  return [
    { label: 'Tier 0 - Unverified', value: parseInt(breakdown[0] ?? breakdown['0'] ?? 0, 10) || 0, color: '#6B7280' },
    { label: 'Tier 1 - Basic', value: parseInt(breakdown[1] ?? breakdown['1'] ?? 0, 10) || 0, color: '#D97706' },
    { label: 'Tier 2 - Verified ID', value: parseInt(breakdown[2] ?? breakdown['2'] ?? 0, 10) || 0, color: '#059669' },
    { label: 'Tier 3 - Enhanced/VIP', value: parseInt(breakdown[3] ?? breakdown['3'] ?? 0, 10) || 0, color: '#2563EB' },
  ];
}

/**
 * Formats real wallet counts by chain from metrics.treasury.walletsByChain
 */
export function formatChainDistributionData(metrics) {
  const walletsMap = metrics?.treasury?.walletsByChain || {};
  const chainColors = {
    ethereum: '#4F46E5',
    eth: '#4F46E5',
    bitcoin: '#C2410C',
    btc: '#C2410C',
    solana: '#047857',
    sol: '#047857',
    bsc: '#B45309',
    binance: '#B45309',
    polygon: '#7E22CE',
    arbitrum: '#0369A1',
    tron: '#B91C1C',
  };

  const entries = Object.entries(walletsMap);
  if (entries.length === 0) {
    return [];
  }

  return entries.map(([chain, count]) => {
    const key = chain.toLowerCase();
    return {
      label: chain.toUpperCase(),
      value: parseInt(count, 10) || 0,
      color: chainColors[key] || '#4F46E5',
    };
  });
}

/**
 * Formats real support ticket counts by priority from metrics.support.byPriority
 */
export function formatSupportPriorityData(metrics) {
  const byPriority = metrics?.support?.byPriority || {};
  return [
    { label: 'Urgent', value: parseInt(byPriority.URGENT ?? byPriority.urgent ?? 0, 10) || 0, color: 'var(--danger-text)' },
    { label: 'High', value: parseInt(byPriority.HIGH ?? byPriority.high ?? 0, 10) || 0, color: 'var(--warning-text)' },
    { label: 'Medium', value: parseInt(byPriority.MEDIUM ?? byPriority.medium ?? 0, 10) || 0, color: 'var(--accent-sky)' },
    { label: 'Low', value: parseInt(byPriority.LOW ?? byPriority.low ?? 0, 10) || 0, color: 'var(--text-tertiary)' },
  ];
}
