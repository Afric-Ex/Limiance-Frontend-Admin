import React, { useState, useMemo } from 'react';
import { useConfirm } from '../context/ConfirmContext';
import {
  Landmark, ArrowRightLeft, Sliders, RefreshCw, Copy, ExternalLink,
  CheckCircle2, AlertTriangle, Flame, Snowflake, Droplets, Layers,
  Scale, SlidersHorizontal, Clock, Info, DollarSign, ChevronRight,
  TrendingUp, Send, Shield
} from 'lucide-react';

// ─── Token brand colours ───────────────────────────────────────────────────────
const TOKEN_COLOR = {
  ETH:  '#627EEA', BTC: '#F7931A', SOL: '#9945FF', TRX: '#FF2D55',
  BNB:  '#F3BA2F', USDT: '#26A17B', USDC: '#2775CA', POL: '#8247E5',
  ARB:  '#28A0F0', OP: '#FF0420', AVAX: '#E84142', LINK: '#375BD2',
  CNGN: '#00BA77', NEAR: '#00C1A0', XTZ: '#A8E6CF', ADA: '#0033AD',
  DOT: '#E6007A',
};
const tokenColor = (sym) => TOKEN_COLOR[sym] ?? '#6b7280';

// ─── SVG Donut Chart ──────────────────────────────────────────────────────────
function DonutChart({ segments, size = 108, label, sublabel }) {
  const r = 36;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + (seg.value || 0), 0);

  let offset = 0;
  const arcs = segments.map((seg, i) => {
    const pct = total > 0 ? (seg.value || 0) / total : 0;
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

// ─── Asset rows helper ────────────────────────────────────────────────────────
function AssetRows({ assets }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
      {assets.map((a, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: '5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: tokenColor(a.symbol), flexShrink: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-mono)' }}>{a.symbol}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
              {typeof a.balance === 'number' ? a.balance.toLocaleString(undefined, { maximumFractionDigits: 6 }) : a.balance}
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
              ${a.usdValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Individual Wallet Card ───────────────────────────────────────────────────
function WalletCard({ type, wallet, chainName, chainId, onSweep }) {
  const cfg = WALLET_TYPE[type];
  const { Icon } = cfg;
  const totalUsd = wallet.assets.reduce((s, a) => s + (a.usdValue || 0), 0);
  const segments = wallet.assets.map((a) => ({ value: a.usdValue, color: tokenColor(a.symbol) }));

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

      {/* Address */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
          {wallet.address.slice(0, 9)}...{wallet.address.slice(-5)}
        </span>
        <button type="button" onClick={() => navigator.clipboard.writeText(wallet.address)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 0, display: 'flex' }}>
          <Copy size={11} />
        </button>
      </div>

      {/* Donut + Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <DonutChart
          segments={segments}
          size={100}
          label={`$${totalUsd >= 1e6 ? (totalUsd / 1e6).toFixed(1) + 'M' : totalUsd >= 1e3 ? (totalUsd / 1e3).toFixed(0) + 'K' : totalUsd.toFixed(0)}`}
          sublabel={`${wallet.assets.length} asset${wallet.assets.length !== 1 ? 's' : ''}`}
        />
        {/* Token legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
          {wallet.assets.map((a, i) => {
            const pct = totalUsd > 0 ? ((a.usdValue / totalUsd) * 100).toFixed(1) : '0';
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
      <AssetRows assets={wallet.assets} />

      {/* Actions */}
      {type !== 'cold' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {wallet.assets.map((a, i) => (
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
                ${a.usdValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </button>
          ))}
        </div>
      )}

      {type === 'cold' && (
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
          <Shield size={12} color="#38bdf8" /> Air-gapped / Fireblocks MPC – No hot signing key loaded
        </div>
      )}
    </div>
  );
}

// ─── All-Chains Overview Row ──────────────────────────────────────────────────
function ChainSummaryRow({ chain, onSelect }) {
  const hotUsd  = chain.hot.assets.reduce((s, a) => s + a.usdValue, 0);
  const poolUsd = chain.pool.assets.reduce((s, a) => s + a.usdValue, 0);
  const coldUsd = chain.cold.assets.reduce((s, a) => s + a.usdValue, 0);
  const totalUsd = hotUsd + poolUsd + coldUsd;

  const barW = (v) => totalUsd > 0 ? `${(v / totalUsd * 100).toFixed(1)}%` : '0%';
  const fmt  = (v) => v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}K` : `$${v.toFixed(0)}`;

  // Donut segments for the chain total (by wallet type)
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
          {chain.nativeSymbol}
        </span>
      </div>

      {/* Mini donut */}
      <DonutChart segments={chainSegments} size={48} label={totalUsd >= 1e6 ? `${(totalUsd / 1e6).toFixed(1)}M` : `${(totalUsd / 1e3).toFixed(0)}K`} />

      {/* Hot */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>{fmt(hotUsd)}</div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>{chain.hot.assets.length} asset{chain.hot.assets.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Pool */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>{fmt(poolUsd)}</div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>{chain.pool.assets.length} asset{chain.pool.assets.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Cold */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{fmt(coldUsd)}</div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>{chain.cold.assets.length} asset{chain.cold.assets.length !== 1 ? 's' : ''}</div>
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

// ─── CHAIN MOCK DATA ──────────────────────────────────────────────────────────
const CHAIN_DATA = [
  {
    id: 'ethereum', name: 'Ethereum', family: 'evm', nativeSymbol: 'ETH', color: '#627EEA',
    explorer: (addr) => `https://etherscan.io/address/${addr}`,
    hot: {
      address: '0x88c6C46EBf353A52EdAb708AC83918597235F82d',
      assets: [
        { symbol: 'ETH',  balance: 42.85,     usdValue: 147832.50 },
        { symbol: 'USDT', balance: 184250.00,  usdValue: 184250.00, contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
        { symbol: 'USDC', balance: 96400.00,   usdValue: 96400.00,  contract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
        { symbol: 'LINK', balance: 1250.00,    usdValue: 17500.00,  contract: '0x514910771AF9Ca656af840dff83E8264EcF986CA' },
      ]
    },
    pool: {
      address: '0x327C443a6d962a265691F6d1C5eE2d5e94b29c9C',
      assets: [
        { symbol: 'ETH',  balance: 12.40,    usdValue: 42780.00 },
        { symbol: 'USDT', balance: 45000.00, usdValue: 45000.00 },
        { symbol: 'USDC', balance: 28500.00, usdValue: 28500.00 },
      ]
    },
    cold: {
      address: '0x99A1C598f8A09d66f44f7623910Ec1a2a51A088F',
      assets: [
        { symbol: 'ETH',  balance: 350.00,    usdValue: 1207500.00 },
        { symbol: 'USDT', balance: 850000.00, usdValue: 850000.00 },
        { symbol: 'USDC', balance: 620000.00, usdValue: 620000.00 },
      ]
    }
  },
  {
    id: 'bsc', name: 'BNB Smart Chain', family: 'evm', nativeSymbol: 'BNB', color: '#F3BA2F',
    explorer: (addr) => `https://bscscan.com/address/${addr}`,
    hot: {
      address: '0x88c6C46EBf353A52EdAb708AC83918597235F82d',
      assets: [
        { symbol: 'BNB',  balance: 185.20,   usdValue: 107416.00 },
        { symbol: 'USDT', balance: 92100.00, usdValue: 92100.00,  contract: '0x55d398326f99059fF775485246999027B3197955' },
        { symbol: 'USDC', balance: 45000.00, usdValue: 45000.00 },
      ]
    },
    pool: {
      address: '0x327C443a6d962a265691F6d1C5eE2d5e94b29c9C',
      assets: [
        { symbol: 'BNB',  balance: 35.00,    usdValue: 20300.00 },
        { symbol: 'USDT', balance: 22000.00, usdValue: 22000.00 },
      ]
    },
    cold: {
      address: '0x99A1C598f8A09d66f44f7623910Ec1a2a51A088F',
      assets: [
        { symbol: 'BNB',  balance: 1200.00,   usdValue: 696000.00 },
        { symbol: 'USDT', balance: 450000.00, usdValue: 450000.00 },
      ]
    }
  },
  {
    id: 'polygon', name: 'Polygon', family: 'evm', nativeSymbol: 'POL', color: '#8247E5',
    explorer: (addr) => `https://polygonscan.com/address/${addr}`,
    hot: {
      address: '0x88c6C46EBf353A52EdAb708AC83918597235F82d',
      assets: [
        { symbol: 'POL',  balance: 45000.00, usdValue: 27000.00 },
        { symbol: 'USDT', balance: 38500.00, usdValue: 38500.00 },
        { symbol: 'USDC', balance: 22000.00, usdValue: 22000.00 },
      ]
    },
    pool: {
      address: '0x327C443a6d962a265691F6d1C5eE2d5e94b29c9C',
      assets: [
        { symbol: 'POL',  balance: 8000.00,  usdValue: 4800.00 },
        { symbol: 'USDT', balance: 15000.00, usdValue: 15000.00 },
      ]
    },
    cold: {
      address: '0x99A1C598f8A09d66f44f7623910Ec1a2a51A088F',
      assets: [
        { symbol: 'POL',  balance: 200000.00, usdValue: 120000.00 },
        { symbol: 'USDT', balance: 180000.00, usdValue: 180000.00 },
      ]
    }
  },
  {
    id: 'arbitrum', name: 'Arbitrum One', family: 'evm', nativeSymbol: 'ETH', color: '#28A0F0',
    explorer: (addr) => `https://arbiscan.io/address/${addr}`,
    hot: {
      address: '0x88c6C46EBf353A52EdAb708AC83918597235F82d',
      assets: [
        { symbol: 'ETH',  balance: 18.50,   usdValue: 63825.00 },
        { symbol: 'USDC', balance: 72000.00, usdValue: 72000.00 },
        { symbol: 'ARB',  balance: 8500.00,  usdValue: 8500.00 },
      ]
    },
    pool: {
      address: '0x327C443a6d962a265691F6d1C5eE2d5e94b29c9C',
      assets: [
        { symbol: 'ETH',  balance: 5.00,    usdValue: 17250.00 },
        { symbol: 'USDC', balance: 25000.00, usdValue: 25000.00 },
      ]
    },
    cold: {
      address: '0x99A1C598f8A09d66f44f7623910Ec1a2a51A088F',
      assets: [
        { symbol: 'ETH',  balance: 120.00,   usdValue: 414000.00 },
        { symbol: 'USDC', balance: 320000.00, usdValue: 320000.00 },
      ]
    }
  },
  {
    id: 'base', name: 'Base', family: 'evm', nativeSymbol: 'ETH', color: '#0052FF',
    explorer: (addr) => `https://basescan.org/address/${addr}`,
    hot: {
      address: '0x88c6C46EBf353A52EdAb708AC83918597235F82d',
      assets: [
        { symbol: 'ETH',  balance: 12.20,   usdValue: 42090.00 },
        { symbol: 'USDC', balance: 48000.00, usdValue: 48000.00 },
      ]
    },
    pool: {
      address: '0x327C443a6d962a265691F6d1C5eE2d5e94b29c9C',
      assets: [
        { symbol: 'ETH',  balance: 3.80,    usdValue: 13110.00 },
        { symbol: 'USDC', balance: 18000.00, usdValue: 18000.00 },
      ]
    },
    cold: {
      address: '0x99A1C598f8A09d66f44f7623910Ec1a2a51A088F',
      assets: [
        { symbol: 'ETH',  balance: 85.00,    usdValue: 293250.00 },
        { symbol: 'USDC', balance: 210000.00, usdValue: 210000.00 },
      ]
    }
  },
  {
    id: 'solana', name: 'Solana', family: 'sol', nativeSymbol: 'SOL', color: '#9945FF',
    explorer: (addr) => `https://solscan.io/account/${addr}`,
    hot: {
      address: '4Nd1mBQw9L76B6q7kHvyZ4J7vXfB1wQjZk2L8oPpF4Nm',
      assets: [
        { symbol: 'SOL',  balance: 520.40,   usdValue: 77279.40 },
        { symbol: 'USDC', balance: 68200.00,  usdValue: 68200.00 },
        { symbol: 'USDT', balance: 42000.00,  usdValue: 42000.00 },
        { symbol: 'CNGN', balance: 8500.00,   usdValue: 8500.00 },
      ]
    },
    pool: {
      address: '8XhB2QyL9zWk5J4rK3vP1tF6mZ7oR8sN',
      assets: [
        { symbol: 'SOL',  balance: 145.00,   usdValue: 21532.50 },
        { symbol: 'USDC', balance: 24000.00, usdValue: 24000.00 },
      ]
    },
    cold: {
      address: '9YmC3RzK1aXl6K5sL4wQ2uG7nAbP9sT5',
      assets: [
        { symbol: 'SOL',  balance: 3800.00,   usdValue: 564300.00 },
        { symbol: 'USDC', balance: 510000.00, usdValue: 510000.00 },
      ]
    }
  },
  {
    id: 'bitcoin', name: 'Bitcoin', family: 'btc', nativeSymbol: 'BTC', color: '#F7931A',
    explorer: (addr) => `https://mempool.space/address/${addr}`,
    hot: {
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      assets: [{ symbol: 'BTC', balance: 3.42, usdValue: 219564.00 }]
    },
    pool: {
      address: 'bc1q5v9z3w7m0k4p8y2t6r1e4w8q2a5s8d1',
      assets: [{ symbol: 'BTC', balance: 1.15, usdValue: 73830.00 }]
    },
    cold: {
      address: 'bc1q8r4w2e0t9y7u5i3o1p8a6s4d2f0g9h7j',
      assets: [{ symbol: 'BTC', balance: 28.50, usdValue: 1829700.00 }]
    }
  },
  {
    id: 'tron', name: 'Tron', family: 'tron', nativeSymbol: 'TRX', color: '#FF2D55',
    explorer: (addr) => `https://tronscan.org/#/address/${addr}`,
    hot: {
      address: 'TYDzsYUEpvnYmQk4zGP9s8uN2aB4dE7wQ1',
      assets: [
        { symbol: 'TRX',  balance: 48500.00,  usdValue: 7517.50 },
        { symbol: 'USDT', balance: 124000.00, usdValue: 124000.00 },
        { symbol: 'USDC', balance: 38000.00,  usdValue: 38000.00 },
      ]
    },
    pool: {
      address: 'TWk9zL4rK3vP1tF6mZ7oR8sN4vP1tF6mZ2',
      assets: [
        { symbol: 'TRX',  balance: 15000.00, usdValue: 2325.00 },
        { symbol: 'USDT', balance: 35000.00, usdValue: 35000.00 },
      ]
    },
    cold: {
      address: 'TG4wQ2uG7nAbP9sT5wQ2uG7nAbP9sT5wQ3',
      assets: [
        { symbol: 'TRX',  balance: 350000.00, usdValue: 54250.00 },
        { symbol: 'USDT', balance: 680000.00, usdValue: 680000.00 },
      ]
    }
  },
];

// ─── Internal Ledger data ─────────────────────────────────────────────────────
const LEDGER_ACCOUNTS = [
  { id: 'liabilities', name: 'Total User Deposit Liabilities', category: 'Liabilities', totalUsd: 5890250, assets: [{ symbol: 'BTC', balance: '31.20' }, { symbol: 'ETH', balance: '378.50' }, { symbol: 'SOL', balance: '4,150.00' }, { symbol: 'USDT', balance: '1,820,500' }], status: 'NOMINAL' },
  { id: 'spot-fee',    name: 'Spot Protocol Fee Pool',        category: 'Revenue',     totalUsd: 124850,   assets: [{ symbol: 'ETH', balance: '6.80' }, { symbol: 'BNB', balance: '14.20' }, { symbol: 'USDT', balance: '38,400' }], status: 'UNCLAIMED' },
  { id: 'wd-fee',      name: 'Withdrawal Fee Accumulator',     category: 'Operational', totalUsd: 42680,    assets: [{ symbol: 'ETH', balance: '2.40' }, { symbol: 'SOL', balance: '28.00' }, { symbol: 'USDT', balance: '14,200' }], status: 'UNCLAIMED' },
  { id: 'margin',      name: 'Margin Borrow Reserve',          category: 'Risk Reserve',totalUsd: 312400,   assets: [{ symbol: 'ETH', balance: '15.40' }, { symbol: 'BTC', balance: '1.20' }, { symbol: 'USDT', balance: '95,000' }], status: 'ACTIVE' },
  { id: 'p2p',         name: 'P2P Merchant Escrow Ledger',     category: 'Escrow',      totalUsd: 76500,    assets: [{ symbol: 'BTC', balance: '0.10' }, { symbol: 'ETH', balance: '1.80' }, { symbol: 'USDT', balance: '45,200' }], status: 'LOCKED' },
];

// ─── Sweep History ────────────────────────────────────────────────────────────
const INITIAL_HISTORY = [
  { id: 'sw-1092', ts: '2026-09-21 06:40 UTC', chain: 'Ethereum', action: 'Hot USDT → Pool Top-Up', type: 'AUTO', amount: '45,000 USDT ($45,000)', hash: '0x4f8a129d...3c2d1e0f', status: 'CONFIRMED' },
  { id: 'sw-1091', ts: '2026-09-21 04:15 UTC', chain: 'Ethereum', action: 'Hot ETH → Cold Vault',   type: 'AUTO', amount: '25.00 ETH ($86,250)', hash: '0x9a8b7c6d...1e0f1a2b', status: 'CONFIRMED' },
  { id: 'sw-1090', ts: '2026-09-20 23:55 UTC', chain: 'Solana',   action: 'Hot SOL → Cold Vault',   type: 'MANUAL', amount: '650.00 SOL ($96,525)', hash: '5K2R8xW4...kM1pQ3rT', status: 'CONFIRMED' },
  { id: 'sw-1089', ts: '2026-09-20 18:40 UTC', chain: 'BNB Smart Chain', action: 'Pool BNB → Cold Overflow', type: 'AUTO', amount: '120.00 BNB ($69,600)', hash: '0x1b2c3d4e...9f0a1b2c', status: 'CONFIRMED' },
  { id: 'sw-1088', ts: '2026-09-20 12:10 UTC', chain: 'Tron',     action: 'Hot USDT → Pool Top-Up', type: 'AUTO', amount: '35,000 USDT ($35,000)', hash: 'abc123...def456', status: 'CONFIRMED' },
];

// ─── Threshold defaults ───────────────────────────────────────────────────────
const DEFAULT_THRESHOLDS = {
  hotWalletSweepThresholdUsd: 100000,
  hotWalletRetainUsd: 20000,
  withdrawalPoolMinUsd: 10000,
  withdrawalPoolTargetUsd: 20000,
  withdrawalPoolCapUsd: 200000,
  treasuryCheckIntervalMin: 5,
  reconciliationIntervalHours: 6,
  toleranceUsd: 10,
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TreasuryPage() {
  const confirm = useConfirm();
  const [activeTab, setActiveTab]       = useState('wallets');
  const [selectedChain, setSelectedChain] = useState(null); // null = overview
  const [sweepTarget, setSweepTarget]   = useState(null);   // { chainId, chainName, type, asset, address }
  const [thresholdOpen, setThresholdOpen] = useState(false);
  const [thresholds, setThresholds]     = useState(DEFAULT_THRESHOLDS);
  const [policyForm, setPolicyForm]     = useState(DEFAULT_THRESHOLDS);
  const [sweepHistory, setSweepHistory] = useState(INITIAL_HISTORY);
  const [sweepAmount, setSweepAmount]   = useState('');
  const [sweepDest, setSweepDest]       = useState('cold');
  const [sweepNote, setSweepNote]       = useState('');
  const [loading, setLoading]           = useState(false);
  const [toast, setToast]               = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4200);
  };

  // Grand totals
  const totals = useMemo(() => {
    let total = 0, hot = 0, pool = 0, cold = 0;
    CHAIN_DATA.forEach((c) => {
      c.hot.assets.forEach((a)  => { hot  += a.usdValue; total += a.usdValue; });
      c.pool.assets.forEach((a) => { pool += a.usdValue; total += a.usdValue; });
      c.cold.assets.forEach((a) => { cold += a.usdValue; total += a.usdValue; });
    });
    const liabilities = LEDGER_ACCOUNTS.find((a) => a.id === 'liabilities')?.totalUsd || 1;
    return { total, hot, pool, cold, liabilities, ratio: ((total / liabilities) * 100).toFixed(1) };
  }, []);

  const fmt = (v) =>
    v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}K` : `$${(v || 0).toFixed(0)}`;
  const fmtFull = (v) =>
    `$${(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const chainObj = selectedChain ? CHAIN_DATA.find((c) => c.id === selectedChain) : null;

  // Cross-chain summary donut (cold/hot/pool composition)
  const globalSegments = [
    { value: totals.cold, color: '#38bdf8' },
    { value: totals.hot,  color: '#fbbf24' },
    { value: totals.pool, color: '#818cf8' },
  ];

  const handleSweepConfirm = async (e) => {
    e.preventDefault();
    const amt = parseFloat(sweepAmount);
    if (!amt || amt <= 0) { showToast('Enter a valid amount', 'error'); return; }
    const ok = await confirm({
      title: 'Authorise Treasury Sweep',
      message: `Transfer ${amt} ${sweepTarget.asset.symbol} from ${sweepTarget.chainName} ${sweepTarget.type.toUpperCase()} wallet to ${sweepDest.toUpperCase()}?`,
      confirmText: 'Execute Transfer',
      variant: 'warning'
    });
    if (!ok) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setSweepHistory((prev) => [{
      id: `sw-${Math.floor(1000 + Math.random() * 9000)}`,
      ts: new Date().toUTCString().replace(' GMT', ' UTC'),
      chain: sweepTarget.chainName,
      action: `${sweepTarget.type.charAt(0).toUpperCase() + sweepTarget.type.slice(1)} ${sweepTarget.asset.symbol} → ${sweepDest.charAt(0).toUpperCase() + sweepDest.slice(1)}`,
      type: 'MANUAL',
      amount: `${amt} ${sweepTarget.asset.symbol}`,
      hash: '0x' + Array.from({ length: 20 }, () => Math.floor(Math.random() * 16).toString(16)).join('') + '...',
      status: 'CONFIRMED'
    }, ...prev]);
    showToast(`Sweep of ${amt} ${sweepTarget.asset.symbol} dispatched`);
    setSweepTarget(null); setSweepAmount(''); setSweepDest('cold'); setSweepNote('');
    setLoading(false);
  };

  const handleThresholdSave = async (e) => {
    e.preventDefault();
    const ok = await confirm({ title: 'Update Automation Policies', message: 'New thresholds will be enforced on the next treasury monitor cycle.', confirmText: 'Save Policies', variant: 'warning' });
    if (!ok) return;
    setThresholds({ ...policyForm });
    showToast('Treasury policies updated'); setThresholdOpen(false);
  };

  const tabs = [
    { id: 'wallets',  label: 'System Wallets',          Icon: Layers },
    { id: 'ledger',   label: 'Ledger & Proof of Reserves', Icon: Scale },
    { id: 'policies', label: 'Automation Policies',     Icon: SlidersHorizontal },
    { id: 'history',  label: 'Rebalance Audit Log',     Icon: Clock },
  ];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '3rem' }}>

      {/* Toast */}
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
            <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 700, color: '#fff' }}>Treasury & System Reserves</h1>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
              Multi-chain institutional custody · Per-chain per-asset balances · Sweep controls · Proof of Reserves
            </p>
          </div>
        </div>
        <button type="button" onClick={() => setThresholdOpen(true)} style={{ padding: '8px 14px', background: '#1c1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <Sliders size={14} color="#818cf8" /> Automation Policies
        </button>
      </div>

      {/* ── Metrics Ribbon ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr repeat(3, 1fr) 1fr', gap: '1rem', marginBottom: '2rem' }}>
        {/* Grand total + global donut */}
        <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.15rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <DonutChart segments={globalSegments} size={70} label={totals.total >= 1e6 ? `${(totals.total / 1e6).toFixed(1)}M` : `${(totals.total / 1e3).toFixed(0)}K`} />
          <div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Total Treasury Assets</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>{fmtFull(totals.total)}</div>
            <div style={{ marginTop: '5px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[{ label: 'Cold', color: '#38bdf8', v: totals.cold }, { label: 'Hot', color: '#fbbf24', v: totals.hot }, { label: 'Pool', color: '#818cf8', v: totals.pool }].map((x) => (
                <span key={x.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: x.color }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '2px', background: x.color }} />
                  {x.label}: {fmt(x.v)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {[
          { label: 'Cold Vault Reserves', val: totals.cold,   color: '#38bdf8', icon: Snowflake, sub: `${((totals.cold / totals.total) * 100).toFixed(0)}% in air-gapped storage` },
          { label: 'Hot Operational Buffer', val: totals.hot, color: '#fbbf24', icon: Flame, sub: `Sweep trigger: >${fmt(thresholds.hotWalletSweepThresholdUsd)}` },
          { label: 'Withdrawal Staging Pools', val: totals.pool, color: '#818cf8', icon: Droplets, sub: `Auto top-up floor: ${fmt(thresholds.withdrawalPoolMinUsd)}` },
        ].map(({ label, val, color, icon: Icon, sub }) => (
          <div key={label} style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.15rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>{label}</span>
              <Icon size={15} color={color} />
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>{fmtFull(val)}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '5px' }}>{sub}</div>
          </div>
        ))}

        {/* Solvency */}
        <div style={{ background: '#13151c', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '12px', padding: '1.15rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>Reserve Coverage</span>
            <TrendingUp size={15} color="#34d399" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>{totals.ratio}%</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '5px' }}>vs {fmtFull(totals.liabilities)} user liabilities</div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem', gap: '1.25rem' }}>
        {tabs.map(({ id, label, Icon }) => (
          <button key={id} type="button" onClick={() => { setActiveTab(id); setSelectedChain(null); }}
            style={{ padding: '10px 4px', background: 'none', border: 'none', borderBottom: activeTab === id ? '2px solid #4d77f0' : '2px solid transparent', color: activeTab === id ? '#fff' : 'rgba(255,255,255,0.45)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1 — SYSTEM WALLETS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'wallets' && (
        <div>
          {/* Chain chips */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <button type="button" onClick={() => setSelectedChain(null)}
              style={{ padding: '6px 12px', borderRadius: '20px', border: !selectedChain ? '1px solid rgba(77,119,240,0.6)' : '1px solid rgba(255,255,255,0.1)', background: !selectedChain ? 'rgba(77,119,240,0.15)' : 'transparent', color: !selectedChain ? '#4d77f0' : 'rgba(255,255,255,0.55)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              All Chains
            </button>
            {CHAIN_DATA.map((c) => (
              <button key={c.id} type="button" onClick={() => setSelectedChain(c.id)}
                style={{ padding: '6px 12px', borderRadius: '20px', border: selectedChain === c.id ? `1px solid ${c.color}` : '1px solid rgba(255,255,255,0.1)', background: selectedChain === c.id ? `${c.color}22` : 'transparent', color: selectedChain === c.id ? c.color : 'rgba(255,255,255,0.55)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: c.color }} />
                {c.name}
              </button>
            ))}
          </div>

          {/* ALL CHAINS OVERVIEW */}
          {!selectedChain && (
            <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '200px 100px 140px 140px 140px 1fr 36px', gap: '8px', padding: '10px 16px', background: '#181a22', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Blockchain', 'Mix', 'Hot Wallet', 'Pool Wallet', 'Cold Vault', 'Allocation', ''].map((h) => (
                  <span key={h} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>
              {CHAIN_DATA.map((c) => (
                <ChainSummaryRow key={c.id} chain={c} onSelect={setSelectedChain} />
              ))}
              {/* Legend */}
              <div style={{ display: 'flex', gap: '16px', padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0e1017' }}>
                {[{ label: 'Cold (Air-gapped)', color: '#38bdf8' }, { label: 'Hot (Operational)', color: '#fbbf24' }, { label: 'Pool (Withdrawal)', color: '#818cf8' }].map((x) => (
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
              <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: chainObj.color }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>{chainObj.name}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                      Family: <b style={{ color: 'rgba(255,255,255,0.7)' }}>{chainObj.family.toUpperCase()}</b> · Native: <b style={{ color: 'rgba(255,255,255,0.7)' }}>{chainObj.nativeSymbol}</b>
                      {chainObj.family === 'evm' && <span style={{ marginLeft: '8px', background: 'rgba(77,119,240,0.12)', color: '#4d77f0', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>Shared EVM Address (BIP44 coin type 60)</span>}
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                  {fmtFull([...chainObj.hot.assets, ...chainObj.pool.assets, ...chainObj.cold.assets].reduce((s, a) => s + a.usdValue, 0))} total
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
                    onSweep={(t) => { setSweepTarget(t); setSweepAmount(''); setSweepDest('cold'); setSweepNote(''); }}
                  />
                ))}
              </div>

              {/* Cross-chain EVM notice */}
              {chainObj.family === 'evm' && (
                <div style={{ marginTop: '1rem', padding: '10px 14px', background: 'rgba(77,119,240,0.06)', border: '1px solid rgba(77,119,240,0.18)', borderRadius: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.55)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Info size={14} color="#4d77f0" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>The Hot Wallet and Withdrawal Pool addresses above are shared across all EVM chains (Ethereum, BSC, Polygon, Arbitrum, Base, Optimism, Avalanche, Celo, Scroll). Each chain's native token and ERC-20 token balances are tracked and swept <strong>independently per chain</strong>.</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2 — LEDGER & PROOF OF RESERVES
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ledger' && (
        <div>
          {/* Reserve summary bar */}
          <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Platform Balance Sheet</div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>On-chain custody vs internal ledger liabilities</div>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>On-chain Custody</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>{fmtFull(totals.total)}</div>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '20px' }}>vs</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>User Liabilities</div>
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
                {LEDGER_ACCOUNTS.map((acc) => (
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
                        {acc.assets.map((a, i) => (
                          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#181a22', padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.8)' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '1px', background: tokenColor(a.symbol) }} />
                            {a.balance} {a.symbol}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                      {fmtFull(acc.totalUsd)}
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
            { title: 'Rule 1 — Hot → Cold Sweep', icon: Flame, color: '#fbbf24', desc: 'When any hot wallet USD value exceeds the sweep threshold, web3-engine signs a transfer to sweep all excess to cold storage, retaining the operational buffer.', rows: [['Sweep Trigger', `> ${fmtFull(thresholds.hotWalletSweepThresholdUsd)}`, '#fbbf24'], ['Retain Buffer', fmtFull(thresholds.hotWalletRetainUsd), '#fff']] },
            { title: 'Rule 2 — Pool Top-Up',       icon: Droplets, color: '#818cf8', desc: 'If a pool drops below the minimum, the monitor transfers from hot wallet to bring it back to the target level.', rows: [['Minimum Floor', `< ${fmtFull(thresholds.withdrawalPoolMinUsd)}`, '#f87171'], ['Top-Up Target', fmtFull(thresholds.withdrawalPoolTargetUsd), '#818cf8']] },
            { title: 'Rule 3 — Pool Overflow Cap', icon: Snowflake, color: '#38bdf8', desc: 'Bounds blast radius: even if a pool signing key is compromised, the attacker can only drain up to the cap before the next sweep cycle moves funds to cold.', rows: [['Pool Cap', fmtFull(thresholds.withdrawalPoolCapUsd), '#38bdf8'], ['Monitor Cadence', `Every ${thresholds.treasuryCheckIntervalMin} minutes`, '#fff']] },
            { title: 'Rule 4 — Ledger Reconciliation', icon: Scale, color: '#34d399', desc: 'Periodic on-chain balance checks against DB. Any variance above tolerance triggers an immediate ops alert.', rows: [['Variance Tolerance', `±$${thresholds.toleranceUsd}`, '#34d399'], ['Reconcile Every', `${thresholds.reconciliationIntervalHours} hours`, '#fff']] },
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
                {['Timestamp', 'Chain', 'Action', 'Type', 'Volume', 'Tx Hash', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '11px 16px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sweepHistory.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '13px 16px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{row.ts}</td>
                  <td style={{ padding: '13px 16px' }}><span style={{ background: '#181a22', padding: '3px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, color: '#fff' }}>{row.chain}</span></td>
                  <td style={{ padding: '13px 16px', fontWeight: 600, color: '#fff', fontSize: '12px' }}>{row.action}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: row.type === 'MANUAL' ? 'rgba(129,140,248,0.12)' : 'rgba(52,211,153,0.12)', color: row.type === 'MANUAL' ? '#818cf8' : '#34d399' }}>
                      {row.type}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#fff', fontWeight: 600 }}>{row.amount}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{row.hash}</span>
                      <button type="button" onClick={() => navigator.clipboard.writeText(row.hash)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 0, display: 'flex' }}><Copy size={11} /></button>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#34d399' }}><CheckCircle2 size={11} /> {row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: TARGETED SWEEP (chain + asset specific)
      ══════════════════════════════════════════════════════════════════════ */}
      {sweepTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#181a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', width: '100%', maxWidth: '500px', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.55)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowRightLeft size={18} color="#4d77f0" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>Treasury Transfer</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>{sweepTarget.chainName} · {sweepTarget.type.toUpperCase()} → {sweepDest.toUpperCase()}</div>
                </div>
              </div>
              <button type="button" onClick={() => setSweepTarget(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
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
                  {typeof sweepTarget.asset.balance === 'number' ? sweepTarget.asset.balance.toLocaleString() : sweepTarget.asset.balance} {sweepTarget.asset.symbol}
                </div>
                <div style={{ fontSize: '11px', color: '#34d399' }}>{fmtFull(sweepTarget.asset.usdValue)} available</div>
              </div>
            </div>

            <form onSubmit={handleSweepConfirm}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Destination */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginBottom: '5px', fontWeight: 600, textTransform: 'uppercase' }}>Destination</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(sweepTarget.type === 'hot' ? ['cold', 'pool'] : ['cold']).map((d) => (
                      <button key={d} type="button" onClick={() => setSweepDest(d)}
                        style={{ flex: 1, padding: '8px', borderRadius: '6px', border: sweepDest === d ? `1px solid ${WALLET_TYPE[d].color}` : '1px solid rgba(255,255,255,0.1)', background: sweepDest === d ? WALLET_TYPE[d].bg : 'transparent', color: sweepDest === d ? WALLET_TYPE[d].color : 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
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
                    <input type="number" step="any" min="0" required value={sweepAmount} onChange={(e) => setSweepAmount(e.target.value)} placeholder={`e.g. ${typeof sweepTarget.asset.balance === 'number' ? (sweepTarget.asset.balance / 2).toFixed(4) : '10'}`}
                      style={{ flex: 1, padding: '8px 10px', background: '#13151c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '13px', fontFamily: 'var(--font-mono)' }} />
                    <button type="button" onClick={() => setSweepAmount(String(typeof sweepTarget.asset.balance === 'number' ? sweepTarget.asset.balance : sweepTarget.asset.balance))}
                      style={{ padding: '8px 12px', background: 'rgba(77,119,240,0.12)', border: '1px solid rgba(77,119,240,0.25)', borderRadius: '6px', color: '#4d77f0', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                      MAX
                    </button>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginBottom: '5px', fontWeight: 600, textTransform: 'uppercase' }}>Operational Justification</label>
                  <input type="text" value={sweepNote} onChange={(e) => setSweepNote(e.target.value)} placeholder="Routine risk mitigation / incident response / compliance rebalance..."
                    style={{ width: '100%', padding: '8px 10px', background: '#13151c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '13px' }} />
                </div>

                {/* Info callout */}
                <div style={{ background: 'rgba(77,119,240,0.07)', border: '1px solid rgba(77,119,240,0.18)', padding: '9px 12px', borderRadius: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.6)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Info size={14} color="#4d77f0" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div>Signed by web3-engine operational keystore for <strong>{sweepTarget.chainName}</strong>. If Fireblocks is enabled, routed through institutional MPC vault. This action is irreversible and will be logged.</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                  <button type="button" onClick={() => setSweepTarget(null)} style={{ padding: '8px 16px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={loading} style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #4d77f0, #38bdf8)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? 'Dispatching...' : 'Confirm Sweep'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: AUTOMATION POLICIES
      ══════════════════════════════════════════════════════════════════════ */}
      {thresholdOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#181a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', width: '100%', maxWidth: '540px', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.55)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><SlidersHorizontal size={18} color="#818cf8" /><span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>Automation Policy Parameters</span></div>
              <button type="button" onClick={() => setThresholdOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleThresholdSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  ['Hot Sweep Trigger (USD)', 'hotWalletSweepThresholdUsd'],
                  ['Hot Retain Buffer (USD)',  'hotWalletRetainUsd'],
                  ['Pool Minimum Floor (USD)', 'withdrawalPoolMinUsd'],
                  ['Pool Target Level (USD)',  'withdrawalPoolTargetUsd'],
                  ['Pool Overflow Cap (USD)',  'withdrawalPoolCapUsd'],
                  ['Monitor Interval (min)',   'treasuryCheckIntervalMin'],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>{label}</label>
                    <input type="number" value={policyForm[key]} onChange={(e) => setPolicyForm({ ...policyForm, [key]: Number(e.target.value) })}
                      style={{ width: '100%', padding: '8px 10px', background: '#13151c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '13px' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setThresholdOpen(false)} style={{ padding: '8px 16px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #4d77f0, #818cf8)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Save & Enforce</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
