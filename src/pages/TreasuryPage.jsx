import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useConfirm } from '../context/ConfirmContext';
import { api } from '../api/client';
import {
  Landmark, ArrowRightLeft, Sliders, RefreshCw, Copy, ExternalLink,
  CheckCircle2, AlertTriangle, Flame, Snowflake, Droplets, Layers,
  Scale, SlidersHorizontal, Clock, Info, ChevronRight,
  TrendingUp, Send, Shield, KeyRound, Cpu
} from 'lucide-react';
import { Shimmer, ShimmerTableRows } from '../components/Shimmer';

// ─── Token brand colours ───────────────────────────────────────────────────────
const TOKEN_COLOR = {
  ETH:  '#627EEA', BTC: '#F7931A', SOL: '#9945FF', TRX: '#FF2D55',
  BNB:  '#F3BA2F', USDT: '#26A17B', USDC: '#2775CA', POL: '#8247E5',
  ARB:  '#28A0F0', OP: '#FF0420', AVAX: '#E84142', LINK: '#375BD2',
  CNGN: '#00BA77', NEAR: '#00C1A0', XTZ: '#A8E6CF', ADA: '#0033AD',
  DOT: '#E6007A',
};
const tokenColor = (sym) => TOKEN_COLOR[sym?.toUpperCase()] ?? '#6b7280';

// ─── SVG Donut Chart ──────────────────────────────────────────────────────────
function DonutChart({ segments = [], size = 108, label, sublabel }) {
  const r = 36;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + (Number(seg.value) || 0), 0);

  let offset = 0;
  const arcs = segments.map((seg, i) => {
    const val = Number(seg.value) || 0;
    const pct = total > 0 ? val / total : 0;
    const len = circ * pct;
    const gap = circ - len;
    const dash = `${len} ${gap}`;
    const thisOffset = offset;
    offset += len;
    return (
      <circle
        key={i}
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth={14}
        strokeDasharray={dash}
        strokeDashoffset={-thisOffset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dasharray 0.4s ease' }}
      />
    );
  });

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1c1e2e" strokeWidth={14} />
      {total === 0 ? (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={14} />
      ) : arcs}
      <text x={cx} y={cy - 5} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="9.5" fontWeight="700" fontFamily="inherit">
        {label}
      </text>
      {sublabel && (
        <text x={cx} y={cy + 7} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="inherit">
          {sublabel}
        </text>
      )}
    </svg>
  );
}

// ─── Wallet type config ───────────────────────────────────────────────────────
const WALLET_TYPE = {
  hot:  { label: 'HOT WALLET',      color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)', Icon: Flame },
  pool: { label: 'WITHDRAWAL POOL', color: '#818cf8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.25)', Icon: Droplets },
  cold: { label: 'COLD VAULT',      color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.25)', Icon: Snowflake },
};

// ─── Signer label helper ──────────────────────────────────────────────────────
function SignerBadge({ type, signerType }) {
  if (type === 'cold') {
    if (signerType === 'squads_multisig') {
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#9945FF', background: 'rgba(153,69,255,0.12)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}><Shield size={10} /> Squads Multisig PDA</span>;
    }
    if (signerType === 'safe_multisig') {
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#38bdf8', background: 'rgba(56,189,248,0.12)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}><Shield size={10} /> Safe Multisig (Gnosis)</span>;
    }
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#38bdf8', background: 'rgba(56,189,248,0.12)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}><Shield size={10} /> Air-gapped Cold Vault</span>;
  }
  if (signerType === 'fireblocks_mpc') {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#34d399', background: 'rgba(52,211,153,0.12)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}><Cpu size={10} /> Fireblocks MPC Vault</span>;
  }
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#fbbf24', background: 'rgba(251,191,36,0.12)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}><KeyRound size={10} /> Dev EOA Keystore</span>;
}

// ─── Asset rows helper ────────────────────────────────────────────────────────
function AssetRows({ assets = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
      {assets.map((a, i) => {
        const bal = Number(a.balance) || 0;
        const usd = Number(a.usd_value ?? a.usdValue) || 0;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: '5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: tokenColor(a.symbol), flexShrink: 0 }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-mono)' }}>{a.symbol}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                {bal.toLocaleString(undefined, { maximumFractionDigits: 6 })}
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                ${usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Individual Wallet Card ───────────────────────────────────────────────────
function WalletCard({ type, wallet, chainName, chainId, onSweep }) {
  if (!wallet) return null;
  const cfg = WALLET_TYPE[type] || WALLET_TYPE.hot;
  const { Icon } = cfg;
  const assets = wallet.assets || [];
  const totalUsd = Number(wallet.total_usd ?? wallet.totalUsd) || assets.reduce((s, a) => s + (Number(a.usd_value ?? a.usdValue) || 0), 0);
  const segments = assets.map((a) => ({ value: Number(a.usd_value ?? a.usdValue) || 0, color: tokenColor(a.symbol) }));

  return (
    <div style={{
      background: '#13151c',
      border: `1px solid ${cfg.border}`,
      borderRadius: '12px',
      padding: '1.1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      flex: 1,
      minWidth: 0,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: cfg.bg, color: cfg.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Icon size={10} /> {cfg.label}
        </span>
        <span style={{ fontWeight: 800, color: '#fff', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
          ${totalUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
      </div>

      {/* Address & Signer badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
            {wallet.address ? `${wallet.address.slice(0, 8)}...${wallet.address.slice(-6)}` : 'Configured on chain'}
          </span>
          {wallet.address && (
            <button type="button" onClick={() => navigator.clipboard.writeText(wallet.address)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <Copy size={11} />
            </button>
          )}
        </div>
        <SignerBadge type={type} signerType={wallet.signer_type} />
      </div>

      {/* Donut + Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <DonutChart
          segments={segments}
          size={100}
          label={`$${totalUsd >= 1e6 ? (totalUsd / 1e6).toFixed(1) + 'M' : totalUsd >= 1e3 ? (totalUsd / 1e3).toFixed(0) + 'K' : totalUsd.toFixed(0)}`}
          sublabel={`${assets.length} asset${assets.length !== 1 ? 's' : ''}`}
        />
        {/* Token legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
          {assets.map((a, i) => {
            const usd = Number(a.usd_value ?? a.usdValue) || 0;
            const pct = totalUsd > 0 ? ((usd / totalUsd) * 100).toFixed(1) : '0';
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: tokenColor(a.symbol), flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-mono)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.symbol}
                </span>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Asset detail rows */}
      <AssetRows assets={assets} />

      {/* Actions */}
      {type !== 'cold' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {assets.map((a, i) => {
            const usd = Number(a.usd_value ?? a.usdValue) || 0;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSweep({ chainId, chainName, type, asset: a, address: wallet.address })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.75)',
                  fontSize: '11px',
                  fontWeight: 600,
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(77,119,240,0.12)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Send size={11} color="#4d77f0" />
                  Sweep {a.symbol} → {type === 'hot' ? 'Cold / Pool' : 'Cold'}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#34d399', fontSize: '10px' }}>
                  ${usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {type === 'cold' && (
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
          <Shield size={12} color="#38bdf8" /> Air-gapped / Institutional Multi-Sig Protection
        </div>
      )}
    </div>
  );
}

// ─── All-Chains Overview Row ──────────────────────────────────────────────────
function ChainSummaryRow({ chain, onSelect }) {
  const hotAssets  = chain.hot?.assets || [];
  const poolAssets = chain.pool?.assets || [];
  const coldAssets = chain.cold?.assets || [];

  const hotUsd  = Number(chain.hot?.total_usd ?? chain.hot?.totalUsd) || hotAssets.reduce((s, a) => s + (Number(a.usd_value ?? a.usdValue) || 0), 0);
  const poolUsd = Number(chain.pool?.total_usd ?? chain.pool?.totalUsd) || poolAssets.reduce((s, a) => s + (Number(a.usd_value ?? a.usdValue) || 0), 0);
  const coldUsd = Number(chain.cold?.total_usd ?? chain.cold?.totalUsd) || coldAssets.reduce((s, a) => s + (Number(a.usd_value ?? a.usdValue) || 0), 0);
  const totalUsd = Number(chain.total_usd ?? chain.totalUsd) || (hotUsd + poolUsd + coldUsd);

  const barW = (v) => totalUsd > 0 ? `${(v / totalUsd * 100).toFixed(1)}%` : '0%';
  const fmt  = (v) => v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}K` : `$${v.toFixed(0)}`;

  const chainSegments = [
    { value: coldUsd, color: '#38bdf8' },
    { value: hotUsd,  color: '#fbbf24' },
    { value: poolUsd, color: '#818cf8' },
  ];

  return (
    <div
      onClick={() => onSelect(chain.id)}
      style={{
        display: 'grid',
        gridTemplateColumns: '200px 100px 140px 140px 140px 1fr 36px',
        alignItems: 'center',
        gap: '8px',
        padding: '14px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {/* Chain name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: chain.color, flexShrink: 0 }} />
        <span style={{ fontWeight: 600, color: '#fff', fontSize: '13px' }}>{chain.name}</span>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', background: '#181a22', padding: '1px 5px', borderRadius: '3px' }}>
          {chain.native_symbol ?? chain.nativeSymbol}
        </span>
      </div>

      {/* Mini donut */}
      <DonutChart segments={chainSegments} size={48} label={totalUsd >= 1e6 ? `${(totalUsd / 1e6).toFixed(1)}M` : `${(totalUsd / 1e3).toFixed(0)}K`} />

      {/* Hot */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>{fmt(hotUsd)}</div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>{hotAssets.length} asset{hotAssets.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Pool */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>{fmt(poolUsd)}</div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>{poolAssets.length} asset{poolAssets.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Cold */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{fmt(coldUsd)}</div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>{coldAssets.length} asset{coldAssets.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Stacked bar */}
      <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
        <div style={{ width: barW(coldUsd), background: '#38bdf8', transition: 'width 0.4s' }} />
        <div style={{ width: barW(hotUsd),  background: '#fbbf24', transition: 'width 0.4s' }} />
        <div style={{ width: barW(poolUsd), background: '#818cf8', transition: 'width 0.4s' }} />
      </div>

      {/* Arrow */}
      <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
    </div>
  );
}

// ─── Default fallback policy values ───────────────────────────────────────────
const DEFAULT_POLICIES = {
  hot_wallet_sweep_threshold_usd: 100000,
  hot_wallet_retain_usd: 20000,
  withdrawal_pool_min_usd: 10000,
  withdrawal_pool_target_usd: 20000,
  withdrawal_pool_cap_usd: 200000,
  treasury_check_interval_min: 5,
  reconciliation_interval_hours: 6,
  tolerance_usd: 10,
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TreasuryPage() {
  const confirm = useConfirm();
  const [activeTab, setActiveTab]         = useState('wallets');
  const [selectedChain, setSelectedChain] = useState(null); // null = overview
  const [sweepTarget, setSweepTarget]     = useState(null); // { chainId, chainName, type, asset, address }
  const [sweepRequestID, setSweepRequestID] = useState(null);
  const [thresholdOpen, setThresholdOpen] = useState(false);

  // Live Data States
  const [overview, setOverview]         = useState(null);
  const [chains, setChains]             = useState([]);
  const [ledgerAccounts, setLedgerAccounts] = useState([]);
  const [thresholds, setThresholds]     = useState(DEFAULT_POLICIES);
  const [policyForm, setPolicyForm]     = useState(DEFAULT_POLICIES);
  const [sweepHistory, setSweepHistory] = useState([]);

  // UI state
  const [sweepAmount, setSweepAmount]   = useState('');
  const [sweepDest, setSweepDest]       = useState('cold');
  const [sweepNote, setSweepNote]       = useState('');
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast]               = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4200);
  };

  // ─── Live API Data Fetcher ──────────────────────────────────────────────────
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [ovRes, sweepRes] = await Promise.all([
        api('/api/treasury/overview'),
        api('/api/treasury/sweeps?limit=50'),
      ]);

      if (ovRes) {
        setOverview(ovRes);
        setChains(ovRes.chains || []);
        setLedgerAccounts(ovRes.ledger || []);
        if (ovRes.policies) {
          setThresholds(ovRes.policies);
          setPolicyForm(ovRes.policies);
        }
      }

      if (sweepRes?.sweeps) {
        setSweepHistory(sweepRes.sweeps);
      }
    } catch (err) {
      console.error('Failed to fetch treasury live data:', err);
      showToast(err.message || 'Failed to connect to treasury API', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Totals calculated from live API
  const totals = useMemo(() => {
    if (!overview) {
      return { total: 0, hot: 0, pool: 0, cold: 0, liabilities: 1, ratio: '100.0' };
    }
    const total = Number(overview.total_usd) || 0;
    const hot   = Number(overview.hot_usd) || 0;
    const pool  = Number(overview.pool_usd) || 0;
    const cold  = Number(overview.cold_usd) || 0;
    const liabilities = Number(overview.liabilities_usd) || 1;
    const ratio = overview.reserve_ratio ? String(overview.reserve_ratio) : ((total / liabilities) * 100).toFixed(1);

    return { total, hot, pool, cold, liabilities, ratio };
  }, [overview]);

  const fmt = (v) =>
    v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}K` : `$${(Number(v) || 0).toFixed(0)}`;
  const fmtFull = (v) =>
    `$${(Number(v) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const chainObj = selectedChain ? chains.find((c) => c.id === selectedChain) : null;

  // Cross-chain summary donut
  const globalSegments = [
    { value: totals.cold, color: '#38bdf8' },
    { value: totals.hot,  color: '#fbbf24' },
    { value: totals.pool, color: '#818cf8' },
  ];

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleSweepConfirm = async (e) => {
    e.preventDefault();
    const amountText = sweepAmount.trim();
    const amt = Number(amountText);
    if (!Number.isFinite(amt) || amt <= 0) { showToast('Enter a valid transfer amount', 'error'); return; }

    const ok = await confirm({
      title: 'Authorise On-Chain Treasury Sweep',
      message: `Execute transfer of ${amt} ${sweepTarget.asset.symbol} from ${sweepTarget.chainName} (${sweepTarget.type.toUpperCase()}) to ${sweepDest.toUpperCase()}? This will sign and dispatch through operational keystores.`,
      confirmText: 'Dispatch Transfer',
      variant: 'warning',
    });
    if (!ok) return;

    setActionLoading(true);
    try {
      const requestID = sweepRequestID || crypto.randomUUID();
      if (!sweepRequestID) setSweepRequestID(requestID);
      const res = await api('/api/treasury/sweep', {
        method: 'POST',
        headers: { 'Idempotency-Key': requestID },
        body: {
          chain_id: sweepTarget.chainId,
          chain_name: sweepTarget.chainName,
          source_type: sweepTarget.type,
          dest_type: sweepDest,
          asset_symbol: sweepTarget.asset.symbol,
          amount: amountText,
          note: sweepNote || 'Manual rebalance via Admin Panel',
        },
      });

      showToast(res.message || `Sweep of ${amt} ${sweepTarget.asset.symbol} dispatched successfully`);
      setSweepTarget(null);
      setSweepRequestID(null);
      setSweepAmount('');
      setSweepDest('cold');
      setSweepNote('');
      await fetchData(true);
    } catch (err) {
      showToast(err.message || 'Failed to dispatch treasury sweep', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleThresholdSave = async (e) => {
    e.preventDefault();
    const ok = await confirm({
      title: 'Enforce Automation Policies',
      message: 'These thresholds will take immediate effect and govern the next web3-engine treasury monitor cycle.',
      confirmText: 'Save & Enforce',
      variant: 'warning',
    });
    if (!ok) return;

    setActionLoading(true);
    try {
      const res = await api('/api/treasury/policies', {
        method: 'PUT',
        body: policyForm,
      });

      if (res.policies) {
        setThresholds(res.policies);
        setPolicyForm(res.policies);
      }
      showToast('Treasury automation policies updated successfully');
      setThresholdOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to update policies', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const tabs = [
    { id: 'wallets',  label: 'System Wallets',             Icon: Layers },
    { id: 'ledger',   label: 'Ledger & Proof of Reserves', Icon: Scale },
    { id: 'policies', label: 'Automation Policies',        Icon: SlidersHorizontal },
    { id: 'history',  label: 'Rebalance Audit Log',        Icon: Clock },
  ];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '3rem' }}>

      {/* Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '11px 18px', borderRadius: '8px', background: toast.type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(16,185,129,0.95)', color: '#fff', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.4)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'rgba(77,119,240,0.15)', padding: '8px', borderRadius: '10px' }}>
            <Landmark size={22} color="#4d77f0" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 700, color: '#fff' }}>Treasury & System Reserves</h1>
              {overview?.signing_mode && (
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: overview.signing_mode === 'fireblocks_mpc' ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)', color: overview.signing_mode === 'fireblocks_mpc' ? '#34d399' : '#fbbf24', border: `1px solid ${overview.signing_mode === 'fireblocks_mpc' ? 'rgba(52,211,153,0.3)' : 'rgba(251,191,36,0.3)'}` }}>
                  {overview.signing_mode === 'fireblocks_mpc' ? 'FIREBLOCKS MPC' : 'DEV EOA KEYSTORE'}
                </span>
              )}
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
              Live API connected · Per-chain per-asset balances · Proof of Reserves liabilities · Dynamic sweep triggers
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing || loading}
            style={{
              padding: '8px 12px',
              background: '#1c1e28',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: refreshing || loading ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          <button
            type="button"
            onClick={() => setThresholdOpen(true)}
            style={{
              padding: '8px 14px',
              background: '#1c1e28',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Sliders size={14} color="#818cf8" /> Automation Policies
          </button>
        </div>
      </div>

      {/* ── Metrics Ribbon ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr repeat(3, 1fr) 1fr', gap: '1rem', marginBottom: '2rem' }}>
        {/* Grand total + global donut */}
        <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.15rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <DonutChart segments={globalSegments} size={70} label={totals.total >= 1e6 ? `${(totals.total / 1e6).toFixed(1)}M` : `${(totals.total / 1e3).toFixed(0)}K`} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Total Treasury Assets</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
              {loading && !overview ? <Shimmer width="130px" height="24px" /> : fmtFull(totals.total)}
            </div>
            <div style={{ marginTop: '5px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { label: 'Cold', color: '#38bdf8', v: totals.cold },
                { label: 'Hot', color: '#fbbf24', v: totals.hot },
                { label: 'Pool', color: '#818cf8', v: totals.pool }
              ].map((x) => (
                <span key={x.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: x.color }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '2px', background: x.color }} />
                  {x.label}: {loading && !overview ? '…' : fmt(x.v)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {[
          { label: 'Cold Vault Reserves', val: totals.cold,   color: '#38bdf8', icon: Snowflake, sub: `${totals.total > 0 ? ((totals.cold / totals.total) * 100).toFixed(0) : 0}% in air-gapped / multisig` },
          { label: 'Hot Operational Buffer', val: totals.hot, color: '#fbbf24', icon: Flame, sub: `Sweep trigger: >${fmt(thresholds.hot_wallet_sweep_threshold_usd)}` },
          { label: 'Withdrawal Staging Pools', val: totals.pool, color: '#818cf8', icon: Droplets, sub: `Auto top-up floor: ${fmt(thresholds.withdrawal_pool_min_usd)}` },
        ].map(({ label, val, color, icon: Icon, sub }) => (
          <div key={label} style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.15rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>{label}</span>
              <Icon size={15} color={color} />
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>
              {loading && !overview ? <Shimmer width="100px" height="22px" /> : fmtFull(val)}
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '5px' }}>{sub}</div>
          </div>
        ))}

        {/* Solvency */}
        <div style={{ background: '#13151c', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '12px', padding: '1.15rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>Reserve Coverage</span>
            <TrendingUp size={15} color="#34d399" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
            {loading && !overview ? <Shimmer width="70px" height="24px" /> : `${totals.ratio}%`}
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '5px' }}>vs {fmtFull(totals.liabilities)} user liabilities</div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem', gap: '1.25rem' }}>
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => { setActiveTab(id); setSelectedChain(null); }}
            style={{
              padding: '10px 4px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === id ? '2px solid #4d77f0' : '2px solid transparent',
              color: activeTab === id ? '#fff' : 'rgba(255,255,255,0.45)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Loading state indicator */}
      {loading && !overview && (
        <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden', padding: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <ShimmerTableRows rows={5} cols={5} colWidths={['25%', '35%', '20%', '20%', '15%']} />
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1 — SYSTEM WALLETS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'wallets' && !loading && (
        <div>
          {/* Chain filter chips */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={() => setSelectedChain(null)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: !selectedChain ? '1px solid rgba(77,119,240,0.6)' : '1px solid rgba(255,255,255,0.1)',
                background: !selectedChain ? 'rgba(77,119,240,0.15)' : 'transparent',
                color: !selectedChain ? '#4d77f0' : 'rgba(255,255,255,0.55)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              All Chains ({chains.length})
            </button>
            {chains.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedChain(c.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: selectedChain === c.id ? `1px solid ${c.color}` : '1px solid rgba(255,255,255,0.1)',
                  background: selectedChain === c.id ? `${c.color}22` : 'transparent',
                  color: selectedChain === c.id ? c.color : 'rgba(255,255,255,0.55)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: c.color }} />
                {c.name}
              </button>
            ))}
          </div>

          {/* ALL CHAINS OVERVIEW */}
          {!selectedChain && (
            <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 100px 140px 140px 140px 1fr 36px', gap: '8px', padding: '10px 16px', background: '#181a22', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Blockchain', 'Mix', 'Hot Wallet', 'Pool Wallet', 'Cold Vault', 'Allocation', ''].map((h) => (
                  <span key={h} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>
              {chains.map((c) => (
                <ChainSummaryRow key={c.id} chain={c} onSelect={setSelectedChain} />
              ))}
              <div style={{ display: 'flex', gap: '16px', padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0e1017' }}>
                {[
                  { label: 'Cold (Air-gapped / Multisig)', color: '#38bdf8' },
                  { label: 'Hot (Operational)', color: '#fbbf24' },
                  { label: 'Pool (Withdrawal Staging)', color: '#818cf8' },
                ].map((x) => (
                  <span key={x.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
                    <div style={{ width: '10px', height: '5px', borderRadius: '2px', background: x.color }} />
                    {x.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SINGLE CHAIN DETAIL */}
          {selectedChain && chainObj && (
            <div>
              {/* Chain header */}
              <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: chainObj.color }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>{chainObj.name}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                      Family: <b style={{ color: 'rgba(255,255,255,0.7)' }}>{chainObj.family.toUpperCase()}</b> · Native: <b style={{ color: 'rgba(255,255,255,0.7)' }}>{chainObj.native_symbol ?? chainObj.nativeSymbol}</b>
                      {chainObj.family === 'evm' && (
                        <span style={{ marginLeft: '8px', background: 'rgba(77,119,240,0.12)', color: '#4d77f0', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                          Shared EVM Address (BIP44 coin type 60)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                  {fmtFull(chainObj.total_usd ?? chainObj.totalUsd)} total
                </div>
              </div>

              {/* 3-column wallet cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', alignItems: 'start' }}>
                {['hot', 'pool', 'cold'].map((type) => (
                  <WalletCard
                    key={type}
                    type={type}
                    wallet={chainObj[type]}
                    chainId={chainObj.id}
                    chainName={chainObj.name}
                    onSweep={(t) => { setSweepTarget(t); setSweepRequestID(crypto.randomUUID()); setSweepAmount(''); setSweepDest('cold'); setSweepNote(''); }}
                  />
                ))}
              </div>

              {/* Cross-chain EVM notice */}
              {chainObj.family === 'evm' && (
                <div style={{ marginTop: '1rem', padding: '10px 14px', background: 'rgba(77,119,240,0.06)', border: '1px solid rgba(77,119,240,0.18)', borderRadius: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.55)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Info size={14} color="#4d77f0" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>The Hot Wallet and Withdrawal Pool addresses above are shared across all EVM chains (Ethereum, BSC, Polygon, Arbitrum, Base, Optimism, Avalanche, Celo, Scroll). Each chain's native coin and ERC-20 token balances are tracked and swept <strong>independently per chain and per asset</strong>.</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2 — LEDGER & PROOF OF RESERVES
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ledger' && !loading && (
        <div>
          {/* Reserve summary bar */}
          <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Platform Proof of Reserves</div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>On-chain institutional custody vs real aggregate user liabilities</div>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>On-chain Custody</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>{fmtFull(totals.total)}</div>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '20px' }}>vs</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>User Liabilities (Portfolios)</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#f87171', fontFamily: 'var(--font-mono)' }}>{fmtFull(totals.liabilities)}</div>
              </div>
              <div style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', padding: '8px 16px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>Reserve Ratio</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>{totals.ratio}%</div>
              </div>
            </div>
          </div>

          <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#181a22', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Account', 'Category', 'Asset Breakdown', 'Total USD', 'Status'].map((h) => (
                    <th key={h} style={{ padding: '11px 16px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ledgerAccounts.map((acc) => (
                  <tr key={acc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{acc.name}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: acc.category === 'Liabilities' ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)', color: acc.category === 'Liabilities' ? '#f87171' : '#818cf8', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                        {acc.category}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {(acc.assets || []).map((a, i) => (
                          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#181a22', padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.8)' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '1px', background: tokenColor(a.symbol) }} />
                            {Number(a.balance).toLocaleString()} {a.symbol}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                      {fmtFull(acc.total_usd ?? acc.totalUsd)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ color: acc.status === 'NOMINAL' ? '#34d399' : '#fbbf24', fontWeight: 600, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={11} /> {acc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3 — AUTOMATION POLICIES
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'policies' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem' }}>
          {[
            {
              title: 'Rule 1 — Hot → Cold Sweep',
              icon: Flame,
              color: '#fbbf24',
              desc: 'When any hot wallet USD balance exceeds the sweep trigger, web3-engine automatically signs a transfer to sweep all excess to cold vaults, retaining the operational buffer.',
              rows: [
                ['Sweep Trigger', `> ${fmtFull(thresholds.hot_wallet_sweep_threshold_usd)}`, '#fbbf24'],
                ['Retain Operational Buffer', fmtFull(thresholds.hot_wallet_retain_usd), '#fff']
              ]
            },
            {
              title: 'Rule 2 — Pool Top-Up',
              icon: Droplets,
              color: '#818cf8',
              desc: 'If a withdrawal pool drops below the minimum floor, the monitor transfers from hot wallet to bring it back to the target liquidity level.',
              rows: [
                ['Minimum Floor', `< ${fmtFull(thresholds.withdrawal_pool_min_usd)}`, '#f87171'],
                ['Target Liquidity Level', fmtFull(thresholds.withdrawal_pool_target_usd), '#818cf8']
              ]
            },
            {
              title: 'Rule 3 — Pool Overflow Cap',
              icon: Snowflake,
              color: '#38bdf8',
              desc: 'Bounds blast radius: even if a pool key is compromised, the attacker can only drain up to the cap before the next sweep cycle moves excess to cold vaults.',
              rows: [
                ['Pool Cap', fmtFull(thresholds.withdrawal_pool_cap_usd), '#38bdf8'],
                ['Monitor Frequency', `Every ${thresholds.treasury_check_interval_min} minutes`, '#fff']
              ]
            },
            {
              title: 'Rule 4 — Ledger Reconciliation',
              icon: Scale,
              color: '#34d399',
              desc: 'Continuous on-chain balance verification against database portfolios. Any variance above tolerance triggers an immediate automated alert.',
              rows: [
                ['Variance Tolerance', `±$${thresholds.tolerance_usd}`, '#34d399'],
                ['Reconciliation Interval', `Every ${thresholds.reconciliation_interval_hours} hours`, '#fff']
              ]
            },
          ].map(({ title, icon: Icon, color, desc, rows }) => (
            <div key={title} style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Icon size={16} color={color} />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{title}</h3>
              </div>
              <p style={{ margin: '0 0 1rem', fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{desc}</p>
              {rows.map(([k, v, vc]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', background: '#181a22', padding: '9px 12px', borderRadius: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>{k}</span>
                  <span style={{ fontWeight: 700, color: vc, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4 — AUDIT LOG
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#181a22', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Timestamp', 'Chain', 'Action', 'Type', 'Volume', 'Tx Hash', 'Operator / Note', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '11px 16px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sweepHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                    No sweep transactions recorded yet.
                  </td>
                </tr>
              ) : (
                sweepHistory.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '13px 16px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                      {new Date(row.timestamp ?? row.ts).toLocaleString()}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ background: '#181a22', padding: '3px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, color: '#fff' }}>
                        {row.chain}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', fontWeight: 600, color: '#fff', fontSize: '12px' }}>{row.action}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: row.type === 'MANUAL' ? 'rgba(129,140,248,0.12)' : 'rgba(52,211,153,0.12)', color: row.type === 'MANUAL' ? '#818cf8' : '#34d399' }}>
                        {row.type}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#fff', fontWeight: 600 }}>{row.amount}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
                          {row.tx_hash ? `${row.tx_hash.slice(0, 10)}...${row.tx_hash.slice(-6)}` : row.hash}
                        </span>
                        <button type="button" onClick={() => navigator.clipboard.writeText(row.tx_hash ?? row.hash)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 0, display: 'flex' }}><Copy size={11} /></button>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                      <div>{row.operator_email || 'system@limiance.internal'}</div>
                      {row.note && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>{row.note}</div>}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#34d399' }}><CheckCircle2 size={11} /> {row.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: TARGETED SWEEP (Chain + Asset aware)
      ══════════════════════════════════════════════════════════════════════ */}
      {sweepTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#181a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', width: '100%', maxWidth: '500px', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.55)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowRightLeft size={18} color="#4d77f0" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>Authorise Treasury Transfer</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>{sweepTarget.chainName} · {sweepTarget.type.toUpperCase()} → {sweepDest.toUpperCase()}</div>
                </div>
              </div>
              <button type="button" onClick={() => { setSweepTarget(null); setSweepRequestID(null); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Asset summary */}
            <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 14px', marginBottom: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: tokenColor(sweepTarget.asset.symbol) }} />
                <span style={{ fontWeight: 700, color: '#fff', fontSize: '14px' }}>{sweepTarget.asset.symbol}</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>on {sweepTarget.chainName}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff' }}>
                  {Number(sweepTarget.asset.balance).toLocaleString()} {sweepTarget.asset.symbol}
                </div>
                <div style={{ fontSize: '11px', color: '#34d399' }}>
                  {fmtFull(sweepTarget.asset.usd_value ?? sweepTarget.asset.usdValue)} available
                </div>
              </div>
            </div>

            <form onSubmit={handleSweepConfirm}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Destination */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginBottom: '5px', fontWeight: 600, textTransform: 'uppercase' }}>Destination</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(sweepTarget.type === 'hot' ? ['cold', 'pool'] : ['cold']).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSweepDest(d)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '6px',
                          border: sweepDest === d ? `1px solid ${WALLET_TYPE[d].color}` : '1px solid rgba(255,255,255,0.1)',
                          background: sweepDest === d ? WALLET_TYPE[d].bg : 'transparent',
                          color: sweepDest === d ? WALLET_TYPE[d].color : 'rgba(255,255,255,0.5)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                        }}
                      >
                        {d === 'cold' ? <Snowflake size={12} /> : <Droplets size={12} />}
                        {WALLET_TYPE[d].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginBottom: '5px', fontWeight: 600, textTransform: 'uppercase' }}>Amount ({sweepTarget.asset.symbol})</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={sweepAmount}
                      onChange={(e) => setSweepAmount(e.target.value)}
                      placeholder={`e.g. ${(Number(sweepTarget.asset.balance) / 2).toFixed(4)}`}
                      style={{ flex: 1, padding: '8px 10px', background: '#13151c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '13px', fontFamily: 'var(--font-mono)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setSweepAmount(String(sweepTarget.asset.balance))}
                      style={{ padding: '8px 12px', background: 'rgba(77,119,240,0.12)', border: '1px solid rgba(77,119,240,0.25)', borderRadius: '6px', color: '#4d77f0', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      MAX
                    </button>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginBottom: '5px', fontWeight: 600, textTransform: 'uppercase' }}>Operational Justification</label>
                  <input
                    type="text"
                    value={sweepNote}
                    onChange={(e) => setSweepNote(e.target.value)}
                    placeholder="Routine risk mitigation / liquidity replenishment / compliance rebalance..."
                    style={{ width: '100%', padding: '8px 10px', background: '#13151c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                  />
                </div>

                {/* Info callout */}
                <div style={{ background: 'rgba(77,119,240,0.07)', border: '1px solid rgba(77,119,240,0.18)', padding: '9px 12px', borderRadius: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.6)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Info size={14} color="#4d77f0" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div>Signed via web3-engine operational keystore for <strong>{sweepTarget.chainName}</strong>. If Fireblocks is active, routed through institutional MPC approval. Action is logged immutably.</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                  <button type="button" onClick={() => { setSweepTarget(null); setSweepRequestID(null); }} style={{ padding: '8px 16px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={actionLoading} style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #4d77f0, #38bdf8)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: actionLoading ? 'not-allowed' : 'pointer' }}>
                    {actionLoading ? 'Dispatching...' : 'Confirm & Dispatch'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: AUTOMATION POLICIES (Live API Wired)
      ══════════════════════════════════════════════════════════════════════ */}
      {thresholdOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#181a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', width: '100%', maxWidth: '540px', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.55)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={18} color="#818cf8" />
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>Automation Policy Parameters</span>
              </div>
              <button type="button" onClick={() => setThresholdOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleThresholdSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  ['Hot Sweep Trigger (USD)', 'hot_wallet_sweep_threshold_usd'],
                  ['Hot Retain Buffer (USD)',  'hot_wallet_retain_usd'],
                  ['Pool Minimum Floor (USD)', 'withdrawal_pool_min_usd'],
                  ['Pool Target Level (USD)',  'withdrawal_pool_target_usd'],
                  ['Pool Overflow Cap (USD)',  'withdrawal_pool_cap_usd'],
                  ['Monitor Interval (min)',   'treasury_check_interval_min'],
                  ['Reconcile Cadence (hrs)',  'reconciliation_interval_hours'],
                  ['Reconcile Tolerance ($)',  'tolerance_usd'],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>{label}</label>
                    <input
                      type="number"
                      step="any"
                      value={policyForm[key] ?? ''}
                      onChange={(e) => setPolicyForm({ ...policyForm, [key]: Number(e.target.value) })}
                      style={{ width: '100%', padding: '8px 10px', background: '#13151c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setThresholdOpen(false)} style={{ padding: '8px 16px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #4d77f0, #818cf8)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: actionLoading ? 'not-allowed' : 'pointer' }}>
                  {actionLoading ? 'Saving...' : 'Save & Enforce'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
