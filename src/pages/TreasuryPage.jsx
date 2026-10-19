import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useConfirm } from '../context/ConfirmContext';
import { api } from '../api/client';
import {
  Landmark, ArrowRightLeft, Sliders, RefreshCw, Copy, ExternalLink,
  CheckCircle2, AlertTriangle, Flame, Snowflake, Droplets, Layers,
  Scale, SlidersHorizontal, Clock, Info, ChevronRight,
  TrendingUp, Send, Shield, KeyRound, Cpu,
  Plus, X, Search
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
        strokeWidth={14}
        strokeDasharray={dash}
        strokeDashoffset={-thisOffset}
        style={{ stroke: seg.color, transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dasharray 0.4s ease' }}
      />
    );
  });

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={14} style={{ stroke: 'var(--bg-surface-2)' }} />
      {total === 0 ? (
        <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={14} style={{ stroke: 'var(--border)' }} />
      ) : arcs}
      <text x={cx} y={cy - 5} textAnchor="middle" style={{ fill: 'var(--text-primary)' }} fontSize="9.5" fontWeight="700" fontFamily="inherit">
        {label}
      </text>
      {sublabel && (
        <text x={cx} y={cy + 7} textAnchor="middle" style={{ fill: 'var(--text-tertiary)' }} fontSize="8" fontFamily="inherit">
          {sublabel}
        </text>
      )}
    </svg>
  );
}

// ─── Wallet type config ───────────────────────────────────────────────────────
const WALLET_TYPE = {
  hot:  { label: 'HOT WALLET',      color: 'var(--warning-text)', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)', Icon: Flame },
  pool: { label: 'WITHDRAWAL POOL', color: 'var(--info-text)', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.25)', Icon: Droplets },
  cold: { label: 'COLD VAULT',      color: 'var(--accent-sky)', bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.25)', Icon: Snowflake },
};

// ─── Signer label helper ──────────────────────────────────────────────────────
function SignerBadge({ type, signerType }) {
  if (type === 'cold') {
    if (signerType === 'squads_multisig') {
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#9945FF', background: 'rgba(153,69,255,0.12)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}><Shield size={10} /> Squads Multisig PDA</span>;
    }
    if (signerType === 'safe_multisig') {
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: 'var(--accent-sky)', background: 'rgba(56,189,248,0.12)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}><Shield size={10} /> Safe Multisig (Gnosis)</span>;
    }
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: 'var(--accent-sky)', background: 'rgba(56,189,248,0.12)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}><Shield size={10} /> Air-gapped Cold Vault</span>;
  }
  if (signerType === 'fireblocks_mpc') {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: 'var(--success-text)', background: 'rgba(52,211,153,0.12)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}><Cpu size={10} /> Fireblocks MPC Vault</span>;
  }
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: 'var(--warning-text)', background: 'rgba(251,191,36,0.12)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}><KeyRound size={10} /> Dev EOA Keystore</span>;
}

// ─── Asset rows helper ────────────────────────────────────────────────────────
function AssetRows({ assets = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
      {assets.map((a, i) => {
        const bal = Number(a.balance) || 0;
        const usd = Number(a.usd_value ?? a.usdValue) || 0;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', background: 'var(--overlay-1)', borderRadius: '5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: tokenColor(a.symbol), flexShrink: 0 }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{a.symbol}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {bal.toLocaleString(undefined, { maximumFractionDigits: 6 })}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
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
      background: 'var(--bg-card)',
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
        <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
          ${totalUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
      </div>

      {/* Address & Signer badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-tertiary)' }}>
            {wallet.address ? `${wallet.address.slice(0, 8)}...${wallet.address.slice(-6)}` : 'Configured on chain'}
          </span>
          {wallet.address && (
            <button type="button" onClick={() => navigator.clipboard.writeText(wallet.address)} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 0, display: 'flex' }}>
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
                <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.symbol}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Asset detail rows */}
      <AssetRows assets={assets} />

      {/* Actions */}
      {type !== 'cold' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
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
                  background: 'var(--overlay-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(77,119,240,0.12)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--overlay-2)'}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Send size={11} style={{ color: "var(--primary-strong)" }} />
                  Sweep {a.symbol} → {type === 'hot' ? 'Cold / Pool' : 'Cold'}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--success-text)', fontSize: '10px' }}>
                  ${usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {type === 'cold' && (
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-faint)', fontSize: '11px' }}>
          <Shield size={12} style={{ color: "var(--accent-sky)" }} /> Air-gapped / Institutional Multi-Sig Protection
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
    { value: coldUsd, color: 'var(--accent-sky)' },
    { value: hotUsd,  color: 'var(--warning-text)' },
    { value: poolUsd, color: 'var(--info-text)' },
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
        borderBottom: '1px solid var(--border-subtle)',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--overlay-1)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {/* Chain name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: chain.color, flexShrink: 0 }} />
        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>{chain.name}</span>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '1px 5px', borderRadius: '3px' }}>
          {chain.native_symbol ?? chain.nativeSymbol}
        </span>
      </div>

      {/* Mini donut */}
      <DonutChart segments={chainSegments} size={48} label={totalUsd >= 1e6 ? `${(totalUsd / 1e6).toFixed(1)}M` : `${(totalUsd / 1e3).toFixed(0)}K`} />

      {/* Hot */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--warning-text)', fontFamily: 'var(--font-mono)' }}>{fmt(hotUsd)}</div>
        <div style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{hotAssets.length} asset{hotAssets.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Pool */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--info-text)', fontFamily: 'var(--font-mono)' }}>{fmt(poolUsd)}</div>
        <div style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{poolAssets.length} asset{poolAssets.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Cold */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-sky)', fontFamily: 'var(--font-mono)' }}>{fmt(coldUsd)}</div>
        <div style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{coldAssets.length} asset{coldAssets.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Stacked bar */}
      <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', background: 'var(--overlay-2)' }}>
        <div style={{ width: barW(coldUsd), background: 'var(--accent-sky)', transition: 'width 0.4s' }} />
        <div style={{ width: barW(hotUsd),  background: 'var(--warning-text)', transition: 'width 0.4s' }} />
        <div style={{ width: barW(poolUsd), background: 'var(--info-text)', transition: 'width 0.4s' }} />
      </div>

      {/* Arrow */}
      <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
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

  // Fee Collection Accounts State
  const [collectionAccounts, setCollectionAccounts] = useState([]);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [createCollectionModalOpen, setCreateCollectionModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionType, setNewCollectionType] = useState('spot');
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [selectedCollectionAcc, setSelectedCollectionAcc] = useState(null);
  const [collectionTransactions, setCollectionTransactions] = useState([]);
  const [collectionTxsLoading, setCollectionTxsLoading] = useState(false);
  const [collectionTxSymbol, setCollectionTxSymbol] = useState('');

  const fetchCollectionAccounts = async () => {
    setCollectionLoading(true);
    try {
      const res = await api('/api/collection-accounts');
      setCollectionAccounts(res.collection_accounts || []);
    } catch (err) {
      console.error('Failed to load collection accounts:', err);
      showToast(err.message || 'Failed to load fee collection accounts', 'error');
    } finally {
      setCollectionLoading(false);
    }
  };

  const handleCreateCollectionAccount = async (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    setCreatingCollection(true);
    try {
      await api('/api/collection-accounts', {
        method: 'POST',
        body: { name: newCollectionName.trim(), type: newCollectionType },
      });
      showToast(`Fee collection account "${newCollectionName}" created successfully`);
      setCreateCollectionModalOpen(false);
      setNewCollectionName('');
      fetchCollectionAccounts();
    } catch (err) {
      showToast(err.message || 'Failed to create collection account', 'error');
    } finally {
      setCreatingCollection(false);
    }
  };

  const openCollectionTransactions = async (acc, symbol = '') => {
    setSelectedCollectionAcc(acc);
    setCollectionTxSymbol(symbol);
    setCollectionTxsLoading(true);
    try {
      const query = symbol ? `?symbol=${symbol}&page=1&page_size=50` : '?page=1&page_size=50';
      const res = await api(`/api/collection-accounts/${acc.id}/transactions${query}`);
      setCollectionTransactions(res.transactions || []);
    } catch (err) {
      showToast(err.message || 'Failed to load account transactions', 'error');
    } finally {
      setCollectionTxsLoading(false);
    }
  };

  const refreshAccountBalance = async (accId, symbol) => {
    try {
      const res = await api(`/api/collection-accounts/${accId}/balance?symbol=${symbol}`);
      showToast(`Live ${symbol} balance: ${res.balance || '0'}`);
      fetchCollectionAccounts();
    } catch (err) {
      showToast(err.message || 'Failed to refresh balance', 'error');
    }
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
    fetchCollectionAccounts();
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
    { value: totals.cold, color: 'var(--accent-sky)' },
    { value: totals.hot,  color: 'var(--warning-text)' },
    { value: totals.pool, color: 'var(--info-text)' },
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
    { id: 'wallets',    label: 'System Wallets',             Icon: Layers },
    { id: 'ledger',     label: 'Ledger & Proof of Reserves', Icon: Scale },
    { id: 'policies',   label: 'Automation Policies',        Icon: SlidersHorizontal },
    { id: 'history',    label: 'Rebalance Audit Log',        Icon: Clock },
    { id: 'collection', label: 'Fee Collection Accounts',   Icon: ArrowRightLeft },
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
            <Landmark size={22} style={{ color: "var(--primary-strong)" }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)' }}>Treasury & System Reserves</h1>
              {overview?.signing_mode && (
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: overview.signing_mode === 'fireblocks_mpc' ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)', color: overview.signing_mode === 'fireblocks_mpc' ? 'var(--success-text)' : 'var(--warning-text)', border: `1px solid ${overview.signing_mode === 'fireblocks_mpc' ? 'rgba(52,211,153,0.3)' : 'rgba(251,191,36,0.3)'}` }}>
                  {overview.signing_mode === 'fireblocks_mpc' ? 'FIREBLOCKS MPC' : 'DEV EOA KEYSTORE'}
                </span>
              )}
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
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
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-medium)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
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
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-medium)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Sliders size={14} style={{ color: "var(--info-text)" }} /> Automation Policies
          </button>
        </div>
      </div>

      {/* ── Metrics Ribbon ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr repeat(3, 1fr) 1fr', gap: '1rem', marginBottom: '2rem' }}>
        {/* Grand total + global donut */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.15rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <DonutChart segments={globalSegments} size={70} label={totals.total >= 1e6 ? `${(totals.total / 1e6).toFixed(1)}M` : `${(totals.total / 1e3).toFixed(0)}K`} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Total Treasury Assets</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {loading && !overview ? <Shimmer width="130px" height="24px" /> : fmtFull(totals.total)}
            </div>
            <div style={{ marginTop: '5px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { label: 'Cold', color: 'var(--accent-sky)', v: totals.cold },
                { label: 'Hot', color: 'var(--warning-text)', v: totals.hot },
                { label: 'Pool', color: 'var(--info-text)', v: totals.pool }
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
          { label: 'Cold Vault Reserves', val: totals.cold,   color: 'var(--accent-sky)', icon: Snowflake, sub: `${totals.total > 0 ? ((totals.cold / totals.total) * 100).toFixed(0) : 0}% in air-gapped / multisig` },
          { label: 'Hot Operational Buffer', val: totals.hot, color: 'var(--warning-text)', icon: Flame, sub: `Sweep trigger: >${fmt(thresholds.hot_wallet_sweep_threshold_usd)}` },
          { label: 'Withdrawal Staging Pools', val: totals.pool, color: 'var(--info-text)', icon: Droplets, sub: `Auto top-up floor: ${fmt(thresholds.withdrawal_pool_min_usd)}` },
        ].map(({ label, val, color, icon: Icon, sub }) => (
          <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.15rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{label}</span>
              <Icon size={15} style={{ color }} />
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>
              {loading && !overview ? <Shimmer width="100px" height="22px" /> : fmtFull(val)}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '5px' }}>{sub}</div>
          </div>
        ))}

        {/* Solvency */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '12px', padding: '1.15rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Reserve Coverage</span>
            <TrendingUp size={15} style={{ color: "var(--success-text)" }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--success-text)', fontFamily: 'var(--font-mono)' }}>
            {loading && !overview ? <Shimmer width="70px" height="24px" /> : `${totals.ratio}%`}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '5px' }}>vs {fmtFull(totals.liabilities)} user liabilities</div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', gap: '1.25rem' }}>
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => { setActiveTab(id); setSelectedChain(null); }}
            style={{
              padding: '10px 4px',
              background: 'none',
              border: 'none',
                borderBottom: activeTab === id ? '2px solid var(--primary-strong)' : '2px solid transparent',
              color: activeTab === id ? 'var(--text-primary)' : 'var(--text-tertiary)',
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
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', padding: '16px' }}>
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
                border: !selectedChain ? '1px solid rgba(77,119,240,0.6)' : '1px solid var(--border-medium)',
                background: !selectedChain ? 'rgba(77,119,240,0.15)' : 'transparent',
                color: !selectedChain ? 'var(--primary-strong)' : 'var(--text-tertiary)',
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
                  border: selectedChain === c.id ? `1px solid ${c.color}` : '1px solid var(--border-medium)',
                  background: selectedChain === c.id ? `${c.color}22` : 'transparent',
                  color: selectedChain === c.id ? c.color : 'var(--text-tertiary)',
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
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 100px 140px 140px 140px 1fr 36px', gap: '8px', padding: '10px 16px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                {['Blockchain', 'Mix', 'Hot Wallet', 'Pool Wallet', 'Cold Vault', 'Allocation', ''].map((h) => (
                  <span key={h} style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>
              {chains.map((c) => (
                <ChainSummaryRow key={c.id} chain={c} onSelect={setSelectedChain} />
              ))}
              <div style={{ display: 'flex', gap: '16px', padding: '10px 16px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-deep)' }}>
                {[
                  { label: 'Cold (Air-gapped / Multisig)', color: 'var(--accent-sky)' },
                  { label: 'Hot (Operational)', color: 'var(--warning-text)' },
                  { label: 'Pool (Withdrawal Staging)', color: 'var(--info-text)' },
                ].map((x) => (
                  <span key={x.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
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
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: chainObj.color }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{chainObj.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Family: <b style={{ color: 'var(--text-secondary)' }}>{chainObj.family.toUpperCase()}</b> · Native: <b style={{ color: 'var(--text-secondary)' }}>{chainObj.native_symbol ?? chainObj.nativeSymbol}</b>
                      {chainObj.family === 'evm' && (
                        <span style={{ marginLeft: '8px', background: 'rgba(77,119,240,0.12)', color: 'var(--primary-strong)', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                          Shared EVM Address (BIP44 coin type 60)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--success-text)', fontFamily: 'var(--font-mono)' }}>
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
                <div style={{ marginTop: '1rem', padding: '10px 14px', background: 'rgba(77,119,240,0.06)', border: '1px solid rgba(77,119,240,0.18)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Info size={14}  style={{ color: "var(--primary-strong)", flexShrink: 0, marginTop: '1px' }} />
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
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Platform Proof of Reserves</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>On-chain institutional custody vs real aggregate user liabilities</div>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>On-chain Custody</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--success-text)', fontFamily: 'var(--font-mono)' }}>{fmtFull(totals.total)}</div>
              </div>
              <div style={{ color: 'var(--text-faint)', fontSize: '20px' }}>vs</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>User Liabilities (Portfolios)</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--danger-text)', fontFamily: 'var(--font-mono)' }}>{fmtFull(totals.liabilities)}</div>
              </div>
              <div style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', padding: '8px 16px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--success-text)', fontWeight: 700, textTransform: 'uppercase' }}>Reserve Ratio</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success-text)', fontFamily: 'var(--font-mono)' }}>{totals.ratio}%</div>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                  {['Account', 'Category', 'Asset Breakdown', 'Total USD', 'Status'].map((h) => (
                    <th key={h} style={{ padding: '11px 16px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ledgerAccounts.map((acc) => (
                  <tr key={acc.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{acc.name}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: acc.category === 'Liabilities' ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)', color: acc.category === 'Liabilities' ? 'var(--danger-text)' : 'var(--info-text)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                        {acc.category}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {(acc.assets || []).map((a, i) => (
                          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-surface)', padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '1px', background: tokenColor(a.symbol) }} />
                            {Number(a.balance).toLocaleString()} {a.symbol}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {fmtFull(acc.total_usd ?? acc.totalUsd)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ color: acc.status === 'NOMINAL' ? 'var(--success-text)' : 'var(--warning-text)', fontWeight: 600, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
              color: 'var(--warning-text)',
              desc: 'When any hot wallet USD balance exceeds the sweep trigger, web3-engine automatically signs a transfer to sweep all excess to cold vaults, retaining the operational buffer.',
              rows: [
                ['Sweep Trigger', `> ${fmtFull(thresholds.hot_wallet_sweep_threshold_usd)}`, 'var(--warning-text)'],
                ['Retain Operational Buffer', fmtFull(thresholds.hot_wallet_retain_usd), 'var(--text-primary)']
              ]
            },
            {
              title: 'Rule 2 — Pool Top-Up',
              icon: Droplets,
              color: 'var(--info-text)',
              desc: 'If a withdrawal pool drops below the minimum floor, the monitor transfers from hot wallet to bring it back to the target liquidity level.',
              rows: [
                ['Minimum Floor', `< ${fmtFull(thresholds.withdrawal_pool_min_usd)}`, 'var(--danger-text)'],
                ['Target Liquidity Level', fmtFull(thresholds.withdrawal_pool_target_usd), 'var(--info-text)']
              ]
            },
            {
              title: 'Rule 3 — Pool Overflow Cap',
              icon: Snowflake,
              color: 'var(--accent-sky)',
              desc: 'Bounds blast radius: even if a pool key is compromised, the attacker can only drain up to the cap before the next sweep cycle moves excess to cold vaults.',
              rows: [
                ['Pool Cap', fmtFull(thresholds.withdrawal_pool_cap_usd), 'var(--accent-sky)'],
                ['Monitor Frequency', `Every ${thresholds.treasury_check_interval_min} minutes`, 'var(--text-primary)']
              ]
            },
            {
              title: 'Rule 4 — Ledger Reconciliation',
              icon: Scale,
              color: 'var(--success-text)',
              desc: 'Continuous on-chain balance verification against database portfolios. Any variance above tolerance triggers an immediate automated alert.',
              rows: [
                ['Variance Tolerance', `±$${thresholds.tolerance_usd}`, 'var(--success-text)'],
                ['Reconciliation Interval', `Every ${thresholds.reconciliation_interval_hours} hours`, 'var(--text-primary)']
              ]
            },
          ].map(({ title, icon: Icon, color, desc, rows }) => (
            <div key={title} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Icon size={16} style={{ color }} />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
              </div>
              <p style={{ margin: '0 0 1rem', fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>{desc}</p>
              {rows.map(([k, v, vc]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-surface)', padding: '9px 12px', borderRadius: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{k}</span>
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
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                {['Timestamp', 'Chain', 'Action', 'Type', 'Volume', 'Tx Hash', 'Operator / Note', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '11px 16px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sweepHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No sweep transactions recorded yet.
                  </td>
                </tr>
              ) : (
                sweepHistory.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '13px 16px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {new Date(row.timestamp ?? row.ts).toLocaleString()}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ background: 'var(--bg-surface)', padding: '3px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {row.chain}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '12px' }}>{row.action}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: row.type === 'MANUAL' ? 'rgba(129,140,248,0.12)' : 'rgba(52,211,153,0.12)', color: row.type === 'MANUAL' ? 'var(--info-text)' : 'var(--success-text)' }}>
                        {row.type}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-primary)', fontWeight: 600 }}>{row.amount}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                          {row.tx_hash ? `${row.tx_hash.slice(0, 10)}...${row.tx_hash.slice(-6)}` : row.hash}
                        </span>
                        <button type="button" onClick={() => navigator.clipboard.writeText(row.tx_hash ?? row.hash)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 0, display: 'flex' }}><Copy size={11} /></button>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <div>{row.operator_email || 'system@limiance.internal'}</div>
                      {row.note && <div style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{row.note}</div>}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: 'var(--success-text)' }}><CheckCircle2 size={11} /> {row.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 5 — FEE COLLECTION ACCOUNTS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'collection' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header toolbar */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Exchange Fee Collection Accounts
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                Dedicated segregation vaults accumulating trade commissions, funding payments, and on-chain withdrawal gas surcharges.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={fetchCollectionAccounts}
                disabled={collectionLoading}
                style={{
                  padding: '8px 14px',
                  background: 'var(--overlay-2)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: collectionLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RefreshCw size={13} className={collectionLoading ? 'spin' : ''} /> Refresh
              </button>

              <button
                type="button"
                onClick={() => setCreateCollectionModalOpen(true)}
                style={{
                  padding: '8px 16px',
                  background: '#4d77f0',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={14} /> Register Collection Account
              </button>
            </div>
          </div>

          {/* Accounts Grid */}
          {collectionLoading && collectionAccounts.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <ShimmerTableRows rows={4} cols={4} colWidths={['25%', '25%', '25%', '25%']} />
                </tbody>
              </table>
            </div>
          ) : collectionAccounts.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Landmark size={36} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.3 }} />
              No collection accounts registered yet. Click "Register Collection Account" above to create one.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
              {collectionAccounts.map((acc) => {
                const balances = acc.balances || {};
                const balanceEntries = Object.entries(balances);

                return (
                  <div
                    key={acc.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      {/* Top Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{acc.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                              ID: {acc.id ? `${acc.id.slice(0, 12)}...` : '—'}
                            </span>
                            <button
                              type="button"
                              onClick={() => { navigator.clipboard.writeText(acc.id); showToast('Account ID copied'); }}
                              style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 0 }}
                              title="Copy ID"
                            >
                              <Copy size={11} />
                            </button>
                          </div>
                        </div>

                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: 'rgba(77,119,240,0.12)',
                            color: 'var(--info-text)',
                            border: '1px solid rgba(77,119,240,0.25)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {acc.type || 'FEE'}
                        </span>
                      </div>

                      {/* Balances List */}
                      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                          Current Accumulated Balances
                        </div>

                        {balanceEntries.length === 0 ? (
                          <div style={{ fontSize: '12px', color: 'var(--text-faint)', fontStyle: 'italic', padding: '6px 0' }}>
                            No fee collections posted to this account yet.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                            {balanceEntries.map(([sym, bal]) => (
                              <div
                                key={sym}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  background: 'var(--bg-surface)',
                                  border: '1px solid var(--border-subtle)',
                                  borderRadius: '6px',
                                  padding: '6px 10px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tokenColor(sym) }} />
                                  <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>{sym}</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--success-text)', fontWeight: 600 }}>
                                    {bal}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => refreshAccountBalance(acc.id, sym)}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                                    title={`Verify live on-ledger balance for ${sym}`}
                                  >
                                    <RefreshCw size={11} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => openCollectionTransactions(acc)}
                        style={{
                          padding: '6px 12px',
                          background: 'var(--overlay-2)',
                          border: '1px solid var(--border-medium)',
                          borderRadius: '6px',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Clock size={12} /> Inspect Transactions
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Register Collection Account ── */}
      {createCollectionModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: '14px', width: '100%', maxWidth: '460px', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.55)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Landmark size={18} style={{ color: "var(--primary-strong)" }} />
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Register Collection Account</span>
              </div>
              <button type="button" onClick={() => setCreateCollectionModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateCollectionAccount}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>Account Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Primary Spot Trading Fee Vault"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>Account Business Type</label>
                  <select
                    value={newCollectionType}
                    onChange={(e) => setNewCollectionType(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px' }}
                  >
                    <option value="spot">Spot Trading Fees</option>
                    <option value="margin">Margin Borrow & Trading Fees</option>
                    <option value="futures">Futures Funding & Trading Fees</option>
                    <option value="p2p">P2P Escrow Mediation Fees</option>
                    <option value="deposit">Deposit Gateway Fees</option>
                    <option value="withdrawal">Withdrawal Surcharges</option>
                    <option value="convert">Token Conversion Spread Fees</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setCreateCollectionModalOpen(false)} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border-medium)', borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={creatingCollection || !newCollectionName.trim()} style={{ padding: '8px 20px', background: '#4d77f0', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: creatingCollection ? 'not-allowed' : 'pointer' }}>
                    {creatingCollection ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Collection Account Transactions ── */}
      {selectedCollectionAcc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: '14px', width: '100%', maxWidth: '780px', padding: '1.75rem', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.55)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  {selectedCollectionAcc.name} — Ledger Transactions
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Type: {selectedCollectionAcc.type} · Account ID: {selectedCollectionAcc.id}
                </div>
              </div>
              <button type="button" onClick={() => setSelectedCollectionAcc(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Filter toolbar */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Filter by Symbol (e.g. USDT, BTC)"
                value={collectionTxSymbol}
                onChange={(e) => setCollectionTxSymbol(e.target.value.toUpperCase())}
                style={{ padding: '6px 10px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px' }}
              />
              <button
                type="button"
                onClick={() => openCollectionTransactions(selectedCollectionAcc, collectionTxSymbol)}
                style={{ padding: '6px 12px', background: '#4d77f0', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Filter
              </button>
            </div>

            {/* Transactions table */}
            <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
              {collectionTxsLoading ? (
                <div style={{ padding: '20px' }}>
                  <ShimmerTableRows rows={4} cols={5} colWidths={['20%', '20%', '20%', '20%', '20%']} />
                </div>
              ) : collectionTransactions.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No fee transactions recorded for this account.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Time</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Symbol</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Amount Credited</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Balance After</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Reference / Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collectionTransactions.map((tx, idx) => (
                      <tr key={tx.id || idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          {tx.created_at ? new Date(tx.created_at).toLocaleString() : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {tx.symbol}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: 'var(--success-text)', fontWeight: 600 }}>
                          +{tx.amount}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                          {tx.balance_after || '—'}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: '11px' }}>
                          {tx.reference_id || tx.order_id || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setSelectedCollectionAcc(null)}
                style={{ padding: '8px 18px', background: '#4d77f0', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: TARGETED SWEEP (Chain + Asset aware)
      ══════════════════════════════════════════════════════════════════════ */}
      {sweepTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: '14px', width: '100%', maxWidth: '500px', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.55)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowRightLeft size={18} style={{ color: "var(--primary-strong)" }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Authorise Treasury Transfer</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{sweepTarget.chainName} · {sweepTarget.type.toUpperCase()} → {sweepDest.toUpperCase()}</div>
                </div>
              </div>
              <button type="button" onClick={() => { setSweepTarget(null); setSweepRequestID(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Asset summary */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', marginBottom: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: tokenColor(sweepTarget.asset.symbol) }} />
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>{sweepTarget.asset.symbol}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>on {sweepTarget.chainName}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {Number(sweepTarget.asset.balance).toLocaleString()} {sweepTarget.asset.symbol}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--success-text)' }}>
                  {fmtFull(sweepTarget.asset.usd_value ?? sweepTarget.asset.usdValue)} available
                </div>
              </div>
            </div>

            <form onSubmit={handleSweepConfirm}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Destination */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '5px', fontWeight: 600, textTransform: 'uppercase' }}>Destination</label>
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
                          border: sweepDest === d ? `1px solid ${WALLET_TYPE[d].color}` : '1px solid var(--border-medium)',
                          background: sweepDest === d ? WALLET_TYPE[d].bg : 'transparent',
                          color: sweepDest === d ? WALLET_TYPE[d].color : 'var(--text-tertiary)',
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
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '5px', fontWeight: 600, textTransform: 'uppercase' }}>Amount ({sweepTarget.asset.symbol})</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={sweepAmount}
                      onChange={(e) => setSweepAmount(e.target.value)}
                      placeholder={`e.g. ${(Number(sweepTarget.asset.balance) / 2).toFixed(4)}`}
                      style={{ flex: 1, padding: '8px 10px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setSweepAmount(String(sweepTarget.asset.balance))}
                      style={{ padding: '8px 12px', background: 'rgba(77,119,240,0.12)', border: '1px solid rgba(77,119,240,0.25)', borderRadius: '6px', color: 'var(--primary-strong)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      MAX
                    </button>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '5px', fontWeight: 600, textTransform: 'uppercase' }}>Operational Justification</label>
                  <input
                    type="text"
                    value={sweepNote}
                    onChange={(e) => setSweepNote(e.target.value)}
                    placeholder="Routine risk mitigation / liquidity replenishment / compliance rebalance..."
                    style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>

                {/* Info callout */}
                <div style={{ background: 'rgba(77,119,240,0.07)', border: '1px solid rgba(77,119,240,0.18)', padding: '9px 12px', borderRadius: '6px', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Info size={14}  style={{ color: "var(--primary-strong)", flexShrink: 0, marginTop: '1px' }} />
                  <div>Signed via web3-engine operational keystore for <strong>{sweepTarget.chainName}</strong>. If Fireblocks is active, routed through institutional MPC approval. Action is logged immutably.</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                  <button type="button" onClick={() => { setSweepTarget(null); setSweepRequestID(null); }} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border-medium)', borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
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
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: '14px', width: '100%', maxWidth: '540px', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.55)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={18} style={{ color: "var(--info-text)" }} />
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Automation Policy Parameters</span>
              </div>
              <button type="button" onClick={() => setThresholdOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
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
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>{label}</label>
                    <input
                      type="number"
                      step="any"
                      value={policyForm[key] ?? ''}
                      onChange={(e) => setPolicyForm({ ...policyForm, [key]: Number(e.target.value) })}
                      style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setThresholdOpen(false)} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border-medium)', borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
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
