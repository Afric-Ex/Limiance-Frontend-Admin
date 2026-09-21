import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import { useConfirm } from '../context/ConfirmContext';
import {
  Landmark,
  ShieldCheck,
  Zap,
  ArrowRightLeft,
  Sliders,
  RefreshCw,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Flame,
  Snowflake,
  Droplets,
  Layers,
  Scale,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Send,
  SlidersHorizontal,
  Info,
  DollarSign
} from 'lucide-react';

// Default mock/live on-chain system wallets structured from web3-engine config
const INITIAL_SYSTEM_WALLETS = [
  // EVM (Ethereum / Sepolia)
  {
    id: 'eth-hot',
    chain: 'Ethereum',
    chainFamily: 'evm',
    type: 'hot',
    label: 'Primary EVM Hot Wallet',
    address: '0x88c6C46EBf353A52EdAb708AC83918597235F82d',
    balance: '42.85',
    symbol: 'ETH',
    usdRate: 3450.00,
    status: 'ACTIVE',
    lastSweepAt: '2026-09-21 04:15 UTC',
    explorer: 'https://etherscan.io/address/0x88c6C46EBf353A52EdAb708AC83918597235F82d',
    subBalances: [
      { asset: 'USDT', balance: '184,250.00', usdValue: 184250.00 },
      { asset: 'USDC', balance: '96,400.00', usdValue: 96400.00 }
    ]
  },
  {
    id: 'eth-pool',
    chain: 'Ethereum',
    chainFamily: 'evm',
    type: 'pool',
    label: 'EVM Withdrawal Staging Pool',
    address: '0x327C443a6d962a265691F6d1C5eE2d5e94b29c9C',
    balance: '12.40',
    symbol: 'ETH',
    usdRate: 3450.00,
    status: 'ACTIVE',
    lastSweepAt: '2026-09-21 06:40 UTC',
    explorer: 'https://etherscan.io/address/0x327C443a6d962a265691F6d1C5eE2d5e94b29c9C',
    subBalances: [
      { asset: 'USDT', balance: '45,000.00', usdValue: 45000.00 },
      { asset: 'USDC', balance: '28,500.00', usdValue: 28500.00 }
    ]
  },
  {
    id: 'eth-cold',
    chain: 'Ethereum',
    chainFamily: 'evm',
    type: 'cold',
    label: 'EVM Institutional Cold Vault',
    address: '0x99A1C598f8A09d66f44f7623910Ec1a2a51A088F',
    balance: '350.00',
    symbol: 'ETH',
    usdRate: 3450.00,
    status: 'VAULT_OFFLINE',
    lastSweepAt: '2026-09-20 22:10 UTC',
    explorer: 'https://etherscan.io/address/0x99A1C598f8A09d66f44f7623910Ec1a2a51A088F',
    subBalances: [
      { asset: 'USDT', balance: '850,000.00', usdValue: 850000.00 },
      { asset: 'USDC', balance: '620,000.00', usdValue: 620000.00 }
    ]
  },

  // BNB Smart Chain
  {
    id: 'bsc-hot',
    chain: 'BNB Smart Chain',
    chainFamily: 'evm',
    type: 'hot',
    label: 'BSC Operations Hot Wallet',
    address: '0x88c6C46EBf353A52EdAb708AC83918597235F82d',
    balance: '185.20',
    symbol: 'BNB',
    usdRate: 580.00,
    status: 'ACTIVE',
    lastSweepAt: '2026-09-21 05:00 UTC',
    explorer: 'https://bscscan.com/address/0x88c6C46EBf353A52EdAb708AC83918597235F82d',
    subBalances: [
      { asset: 'USDT', balance: '92,100.00', usdValue: 92100.00 }
    ]
  },
  {
    id: 'bsc-pool',
    chain: 'BNB Smart Chain',
    chainFamily: 'evm',
    type: 'pool',
    label: 'BSC Withdrawal Staging Pool',
    address: '0x327C443a6d962a265691F6d1C5eE2d5e94b29c9C',
    balance: '35.00',
    symbol: 'BNB',
    usdRate: 580.00,
    status: 'ACTIVE',
    lastSweepAt: '2026-09-21 07:15 UTC',
    explorer: 'https://bscscan.com/address/0x327C443a6d962a265691F6d1C5eE2d5e94b29c9C',
    subBalances: [
      { asset: 'USDT', balance: '22,000.00', usdValue: 22000.00 }
    ]
  },
  {
    id: 'bsc-cold',
    chain: 'BNB Smart Chain',
    chainFamily: 'evm',
    type: 'cold',
    label: 'BSC Cold Reserve Vault',
    address: '0x99A1C598f8A09d66f44f7623910Ec1a2a51A088F',
    balance: '1,200.00',
    symbol: 'BNB',
    usdRate: 580.00,
    status: 'VAULT_OFFLINE',
    lastSweepAt: '2026-09-20 20:00 UTC',
    explorer: 'https://bscscan.com/address/0x99A1C598f8A09d66f44f7623910Ec1a2a51A088F',
    subBalances: [
      { asset: 'USDT', balance: '450,000.00', usdValue: 450000.00 }
    ]
  },

  // Solana
  {
    id: 'sol-hot',
    chain: 'Solana',
    chainFamily: 'sol',
    type: 'hot',
    label: 'Solana Inflow Hot Wallet',
    address: '4Nd1mBQw9L76B6q7kHvyZ4J7vXfB1wQjZk2L8oPpF4Nm',
    balance: '520.40',
    symbol: 'SOL',
    usdRate: 148.50,
    status: 'ACTIVE',
    lastSweepAt: '2026-09-21 06:12 UTC',
    explorer: 'https://solscan.io/account/4Nd1mBQw9L76B6q7kHvyZ4J7vXfB1wQjZk2L8oPpF4Nm',
    subBalances: [
      { asset: 'USDC', balance: '68,200.00', usdValue: 68200.00 }
    ]
  },
  {
    id: 'sol-pool',
    chain: 'Solana',
    chainFamily: 'sol',
    type: 'pool',
    label: 'Solana Withdrawal Staging Pool',
    address: '8XhB2QyL9zWk5J4rK3vP1tF6mZ7oR8sN4vP1tF6mZ7oR',
    balance: '145.00',
    symbol: 'SOL',
    usdRate: 148.50,
    status: 'ACTIVE',
    lastSweepAt: '2026-09-21 07:30 UTC',
    explorer: 'https://solscan.io/account/8XhB2QyL9zWk5J4rK3vP1tF6mZ7oR8sN4vP1tF6mZ7oR',
    subBalances: [
      { asset: 'USDC', balance: '24,000.00', usdValue: 24000.00 }
    ]
  },
  {
    id: 'sol-cold',
    chain: 'Solana',
    chainFamily: 'sol',
    type: 'cold',
    label: 'Solana Cold Multi-Sig Vault',
    address: '9YmC3RzK1aXl6K5sL4wQ2uG7nAbP9sT5wQ2uG7nAbP9s',
    balance: '3,800.00',
    symbol: 'SOL',
    usdRate: 148.50,
    status: 'VAULT_OFFLINE',
    lastSweepAt: '2026-09-20 18:45 UTC',
    explorer: 'https://solscan.io/account/9YmC3RzK1aXl6K5sL4wQ2uG7nAbP9sT5wQ2uG7nAbP9s',
    subBalances: [
      { asset: 'USDC', balance: '510,000.00', usdValue: 510000.00 }
    ]
  },

  // Bitcoin
  {
    id: 'btc-hot',
    chain: 'Bitcoin',
    chainFamily: 'btc',
    type: 'hot',
    label: 'Bitcoin UTXO Inflow Hot Wallet',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    balance: '3.42',
    symbol: 'BTC',
    usdRate: 64200.00,
    status: 'ACTIVE',
    lastSweepAt: '2026-09-21 03:20 UTC',
    explorer: 'https://mempool.space/address/bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    subBalances: []
  },
  {
    id: 'btc-pool',
    chain: 'Bitcoin',
    chainFamily: 'btc',
    type: 'pool',
    label: 'Bitcoin PSBT Withdrawal Pool',
    address: 'bc1q5v9z3w7m0k4p8y2t6r1e4w8q2a5s8d1f4g7h0j',
    balance: '1.15',
    symbol: 'BTC',
    usdRate: 64200.00,
    status: 'ACTIVE',
    lastSweepAt: '2026-09-21 05:45 UTC',
    explorer: 'https://mempool.space/address/bc1q5v9z3w7m0k4p8y2t6r1e4w8q2a5s8d1f4g7h0j',
    subBalances: []
  },
  {
    id: 'btc-cold',
    chain: 'Bitcoin',
    chainFamily: 'btc',
    type: 'cold',
    label: 'Bitcoin Institutional Deep Cold (Air-Gapped)',
    address: 'bc1q8r4w2e0t9y7u5i3o1p8a6s4d2f0g9h7j5k3l1z',
    balance: '28.50',
    symbol: 'BTC',
    usdRate: 64200.00,
    status: 'VAULT_OFFLINE',
    lastSweepAt: '2026-09-19 14:10 UTC',
    explorer: 'https://mempool.space/address/bc1q8r4w2e0t9y7u5i3o1p8a6s4d2f0g9h7j5k3l1z',
    subBalances: []
  },

  // Tron
  {
    id: 'trx-hot',
    chain: 'Tron',
    chainFamily: 'tron',
    type: 'hot',
    label: 'Tron TRC-20 Inflow Wallet',
    address: 'TYDzsYUEpvnYmQk4zGP9s8uN2aB4dE7wQ1',
    balance: '48,500.00',
    symbol: 'TRX',
    usdRate: 0.155,
    status: 'ACTIVE',
    lastSweepAt: '2026-09-21 07:05 UTC',
    explorer: 'https://tronscan.org/#/address/TYDzsYUEpvnYmQk4zGP9s8uN2aB4dE7wQ1',
    subBalances: [
      { asset: 'USDT', balance: '124,000.00', usdValue: 124000.00 }
    ]
  },
  {
    id: 'trx-pool',
    chain: 'Tron',
    chainFamily: 'tron',
    type: 'pool',
    label: 'Tron TRC-20 Payout Pool',
    address: 'TWk9zL4rK3vP1tF6mZ7oR8sN4vP1tF6mZ2',
    balance: '15,000.00',
    symbol: 'TRX',
    usdRate: 0.155,
    status: 'ACTIVE',
    lastSweepAt: '2026-09-21 07:45 UTC',
    explorer: 'https://tronscan.org/#/address/TWk9zL4rK3vP1tF6mZ7oR8sN4vP1tF6mZ2',
    subBalances: [
      { asset: 'USDT', balance: '35,000.00', usdValue: 35000.00 }
    ]
  },
  {
    id: 'trx-cold',
    chain: 'Tron',
    chainFamily: 'tron',
    type: 'cold',
    label: 'Tron Cold Storage Vault',
    address: 'TG4wQ2uG7nAbP9sT5wQ2uG7nAbP9sT5wQ3',
    balance: '350,000.00',
    symbol: 'TRX',
    usdRate: 0.155,
    status: 'VAULT_OFFLINE',
    lastSweepAt: '2026-09-20 11:30 UTC',
    explorer: 'https://tronscan.org/#/address/TG4wQ2uG7nAbP9sT5wQ2uG7nAbP9sT5wQ3',
    subBalances: [
      { asset: 'USDT', balance: '680,000.00', usdValue: 680000.00 }
    ]
  }
];

// Initial Internal Ledger accounts
const INITIAL_LEDGER_ACCOUNTS = [
  {
    id: 'client-liabilities',
    accountName: 'Total User Deposit Liabilities',
    category: 'Liabilities',
    description: 'Aggregated client account balances withdrawable on demand',
    btcTotal: '31.20 BTC',
    ethTotal: '378.50 ETH',
    solTotal: '4,150.00 SOL',
    usdtTotal: '1,820,500.00 USDT',
    usdcTotal: '1,150,000.00 USDC',
    totalUsd: 5890250.00,
    status: 'NOMINAL'
  },
  {
    id: 'spot-fee-pool',
    accountName: 'Spot Trading Protocol Fee Pool',
    category: 'Protocol Revenue',
    description: 'Accrued maker and taker execution fees from order engine',
    btcTotal: '0.45 BTC',
    ethTotal: '6.80 ETH',
    solTotal: '85.20 SOL',
    usdtTotal: '38,400.00 USDT',
    usdcTotal: '21,300.00 USDC',
    totalUsd: 124850.00,
    status: 'UNCLAIMED'
  },
  {
    id: 'withdrawal-fee-acc',
    accountName: 'On-Chain Withdrawal Fee Accumulator',
    category: 'Operational Buffer',
    description: 'Network gas and protocol processing fees collected on disbursements',
    btcTotal: '0.12 BTC',
    ethTotal: '2.40 ETH',
    solTotal: '28.00 SOL',
    usdtTotal: '14,200.00 USDT',
    usdcTotal: '8,400.00 USDC',
    totalUsd: 42680.00,
    status: 'UNCLAIMED'
  },
  {
    id: 'margin-debt-reserve',
    accountName: 'Margin Borrow & Collateral Reserve',
    category: 'Risk Reserve',
    description: 'Collateral locked against active margin borrows and leverage',
    btcTotal: '1.20 BTC',
    ethTotal: '15.40 ETH',
    solTotal: '180.00 SOL',
    usdtTotal: '95,000.00 USDT',
    usdcTotal: '60,000.00 USDC',
    totalUsd: 312400.00,
    status: 'ACTIVE'
  },
  {
    id: 'p2p-escrow-ledger',
    accountName: 'P2P Merchant Escrow Ledger',
    category: 'Escrow Holdings',
    description: 'Crypto locked in active P2P trade matches pending fiat confirmation',
    btcTotal: '0.10 BTC',
    ethTotal: '1.80 ETH',
    solTotal: '25.00 SOL',
    usdtTotal: '45,200.00 USDT',
    usdcTotal: '12,000.00 USDC',
    totalUsd: 76500.00,
    status: 'LOCKED'
  }
];

// Initial Policy thresholds from web3-engine
const INITIAL_THRESHOLDS = {
  hotWalletSweepThresholdUsd: 100000,
  hotWalletRetainUsd: 20000,
  withdrawalPoolMinUsd: 10000,
  withdrawalPoolTargetUsd: 20000,
  withdrawalPoolCapUsd: 200000,
  treasuryCheckIntervalMin: 5,
  reconciliationIntervalHours: 6,
  toleranceUsd: 10
};

// Initial Sweep History
const INITIAL_SWEEPS = [
  {
    id: 'sw-1092',
    timestamp: '2026-09-21 06:40:15 UTC',
    chain: 'Ethereum',
    type: 'AUTOMATIC_REBALANCE',
    action: 'Hot → Pool Top-Up',
    amount: '4.50 ETH ($15,525.00)',
    txHash: '0x4f8a129d8b74c2e6f9821a0d4c8e7b6a5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f',
    status: 'CONFIRMED'
  },
  {
    id: 'sw-1091',
    timestamp: '2026-09-21 04:15:32 UTC',
    chain: 'Ethereum',
    type: 'AUTOMATIC_SWEEP',
    action: 'Hot → Cold Sweep',
    amount: '25.00 ETH + 120k USDT ($206,250.00)',
    txHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f1a2b',
    status: 'CONFIRMED'
  },
  {
    id: 'sw-1090',
    timestamp: '2026-09-20 23:55:00 UTC',
    chain: 'Solana',
    type: 'MANUAL_SWEEP',
    action: 'Hot → Cold Sweep',
    amount: '650.00 SOL ($96,525.00)',
    txHash: '5K2R8xW4j9P6mN3vL1tY7sB2dF8gA4cE6hJ9kM1pQ3rT5vW7yZ9aC2eD4fG6hJ8k',
    status: 'CONFIRMED'
  },
  {
    id: 'sw-1089',
    timestamp: '2026-09-20 18:40:10 UTC',
    chain: 'BNB Smart Chain',
    type: 'AUTOMATIC_SWEEP',
    action: 'Pool → Cold Overflow',
    amount: '120.00 BNB ($69,600.00)',
    txHash: '0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c',
    status: 'CONFIRMED'
  }
];

export default function TreasuryPage() {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState('wallets'); // 'wallets' | 'ledger' | 'policies' | 'history'
  const [systemWallets, setSystemWallets] = useState(INITIAL_SYSTEM_WALLETS);
  const [ledgerAccounts, setLedgerAccounts] = useState(INITIAL_LEDGER_ACCOUNTS);
  const [thresholds, setThresholds] = useState(INITIAL_THRESHOLDS);
  const [sweepHistory, setSweepHistory] = useState(INITIAL_SWEEPS);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Filters
  const [selectedChainFilter, setSelectedChainFilter] = useState('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [sweepModalOpen, setSweepModalOpen] = useState(false);
  const [thresholdModalOpen, setThresholdModalOpen] = useState(false);
  const [selectedWalletForSweep, setSelectedWalletForSweep] = useState(null);

  // Sweep Form
  const [sweepForm, setSweepForm] = useState({
    chain: 'Ethereum',
    sourceType: 'hot',
    targetType: 'cold',
    asset: 'ETH',
    amount: '',
    recipientAddress: '',
    reason: 'Routine risk mitigation rebalance'
  });

  // Thresholds Form
  const [policyForm, setPolicyForm] = useState({ ...INITIAL_THRESHOLDS });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    showToast('Address copied to clipboard');
  };

  // Compute total on-chain balances
  const treasuryTotals = useMemo(() => {
    let totalUsd = 0;
    let hotUsd = 0;
    let poolUsd = 0;
    let coldUsd = 0;

    systemWallets.forEach((w) => {
      const nativeValue = (parseFloat(w.balance.replace(/,/g, '')) || 0) * (w.usdRate || 0);
      let subValue = 0;
      if (w.subBalances) {
        w.subBalances.forEach((sb) => {
          subValue += sb.usdValue || 0;
        });
      }
      const walletTotal = nativeValue + subValue;
      totalUsd += walletTotal;

      if (w.type === 'hot') hotUsd += walletTotal;
      if (w.type === 'pool') poolUsd += walletTotal;
      if (w.type === 'cold') coldUsd += walletTotal;
    });

    const userLiabilitiesUsd = ledgerAccounts.find((a) => a.id === 'client-liabilities')?.totalUsd || 1;
    const reserveRatio = ((totalUsd / userLiabilitiesUsd) * 100).toFixed(1);

    return {
      totalUsd,
      hotUsd,
      poolUsd,
      coldUsd,
      userLiabilitiesUsd,
      reserveRatio
    };
  }, [systemWallets, ledgerAccounts]);

  // Filtered system wallets
  const filteredWallets = useMemo(() => {
    return systemWallets.filter((w) => {
      const matchChain = selectedChainFilter === 'ALL' || w.chain === selectedChainFilter;
      const matchType = selectedTypeFilter === 'ALL' || w.type === selectedTypeFilter;
      const matchSearch =
        !searchQuery ||
        w.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.chain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchChain && matchType && matchSearch;
    });
  }, [systemWallets, selectedChainFilter, selectedTypeFilter, searchQuery]);

  const availableChains = useMemo(() => {
    const list = Array.from(new Set(systemWallets.map((w) => w.chain)));
    return ['ALL', ...list];
  }, [systemWallets]);

  // Open sweep modal for a specific wallet
  const handleOpenSweepModal = (wallet) => {
    setSelectedWalletForSweep(wallet);
    setSweepForm({
      chain: wallet.chain,
      sourceType: wallet.type,
      targetType: wallet.type === 'hot' ? 'cold' : 'cold',
      asset: wallet.symbol,
      amount: '',
      recipientAddress: '',
      reason: 'Administrative treasury sweep'
    });
    setSweepModalOpen(true);
  };

  // Submit manual sweep
  const handleSweepSubmit = async (e) => {
    e.preventDefault();
    if (!sweepForm.amount || parseFloat(sweepForm.amount) <= 0) {
      showToast('Please specify a valid sweep amount', 'error');
      return;
    }

    const ok = await confirm({
      title: 'Authorize Treasury Transfer',
      message: `Are you sure you want to transfer ${sweepForm.amount} ${sweepForm.asset} on ${sweepForm.chain} from ${sweepForm.sourceType.toUpperCase()} to ${sweepForm.targetType.toUpperCase()}?`,
      confirmText: 'Execute Transfer',
      variant: 'warning'
    });

    if (!ok) return;

    setLoading(true);
    try {
      // Simulate API call to web3-engine sweep endpoint
      await new Promise((resolve) => setTimeout(resolve, 800));

      const newSweep = {
        id: `sw-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        chain: sweepForm.chain,
        type: 'MANUAL_SWEEP',
        action: `${sweepForm.sourceType.toUpperCase()} → ${sweepForm.targetType.toUpperCase()} Sweep`,
        amount: `${sweepForm.amount} ${sweepForm.asset}`,
        txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        status: 'CONFIRMED'
      };

      setSweepHistory((prev) => [newSweep, ...prev]);
      showToast(`Manual sweep of ${sweepForm.amount} ${sweepForm.asset} initiated successfully`);
      setSweepModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to dispatch sweep transaction', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Submit threshold update
  const handleThresholdSubmit = async (e) => {
    e.preventDefault();
    const ok = await confirm({
      title: 'Update Treasury Automation Policies',
      message: 'Updating these thresholds alters the autonomous trigger points for hot sweeps and pool top-ups. Proceed?',
      confirmText: 'Save Policy Parameters',
      variant: 'warning'
    });

    if (!ok) return;

    setThresholds({ ...policyForm });
    showToast('Treasury thresholds updated successfully');
    setThresholdModalOpen(false);
  };

  const fmtUsd = (num) => {
    return (num || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="treasury-page" style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '3rem' }}>
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '8px',
            background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
            color: '#fff',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(77, 119, 240, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <Landmark size={24} color="#4d77f0" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
                Treasury & System Reserves
              </h1>
              <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                Multi-chain institutional custody balances, automated sweep policies, and platform ledger surveillance
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setThresholdModalOpen(true)}
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
              cursor: 'pointer'
            }}
          >
            <Sliders size={15} color="#818cf8" /> Policy Parameters
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedWalletForSweep(systemWallets[0]);
              setSweepModalOpen(true);
            }}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #4d77f0, #38bdf8)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(77, 119, 240, 0.3)'
            }}
          >
            <ArrowRightLeft size={15} /> Manual Sweep
          </button>
        </div>
      </div>

      {/* Top Solvency & Reserve Metrics Ribbon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        {/* Total Assets */}
        <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Treasury Assets
            </span>
            <ShieldCheck size={16} color="#34d399" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
            ${fmtUsd(treasuryTotals.totalUsd)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12px' }}>
            <span style={{ color: '#34d399', fontWeight: 600, background: 'rgba(52, 211, 153, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>
              {treasuryTotals.reserveRatio}% Backed
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Proof of Reserves OK</span>
          </div>
        </div>

        {/* Cold Vault Reserves */}
        <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', fontWeight: 600 }}>
              Cold Storage Reserves
            </span>
            <Snowflake size={16} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
            ${fmtUsd(treasuryTotals.coldUsd)}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
            {((treasuryTotals.coldUsd / (treasuryTotals.totalUsd || 1)) * 100).toFixed(1)}% in Air-gapped / Multi-Sig
          </div>
        </div>

        {/* Hot Inflow Wallets */}
        <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', fontWeight: 600 }}>
              Hot Operational Buffer
            </span>
            <Flame size={16} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
            ${fmtUsd(treasuryTotals.hotUsd)}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
            Autonomous sweep trigger: &gt; ${fmtUsd(thresholds.hotWalletSweepThresholdUsd)}
          </div>
        </div>

        {/* Withdrawal Payout Pools */}
        <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', fontWeight: 600 }}>
              Withdrawal Staging Pools
            </span>
            <Droplets size={16} color="#818cf8" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
            ${fmtUsd(treasuryTotals.poolUsd)}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
            Auto top-up when &lt; ${fmtUsd(thresholds.withdrawalPoolMinUsd)}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          marginBottom: '1.5rem',
          gap: '1rem'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('wallets')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'wallets' ? '2px solid #4d77f0' : '2px solid transparent',
            color: activeTab === 'wallets' ? '#fff' : 'rgba(255,255,255,0.5)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Layers size={16} /> On-Chain System Wallets ({systemWallets.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'ledger' ? '2px solid #4d77f0' : '2px solid transparent',
            color: activeTab === 'ledger' ? '#fff' : 'rgba(255,255,255,0.5)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Scale size={16} /> Internal Ledger & Liabilities
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('policies')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'policies' ? '2px solid #4d77f0' : '2px solid transparent',
            color: activeTab === 'policies' ? '#fff' : 'rgba(255,255,255,0.5)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <SlidersHorizontal size={16} /> Sweep & Rebalance Policies
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'history' ? '2px solid #4d77f0' : '2px solid transparent',
            color: activeTab === 'history' ? '#fff' : 'rgba(255,255,255,0.5)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Clock size={16} /> Rebalance Audit Log
        </button>
      </div>

      {/* TAB 1: ON-CHAIN SYSTEM WALLETS */}
      {activeTab === 'wallets' && (
        <div>
          {/* Filters Bar */}
          <div
            style={{
              background: '#13151c',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#181a22', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Search size={14} color="rgba(255,255,255,0.4)" />
                <input
                  type="text"
                  placeholder="Filter by label, chain, address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none',
                    width: '220px'
                  }}
                />
              </div>

              {/* Chain Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Chain:</span>
                <select
                  value={selectedChainFilter}
                  onChange={(e) => setSelectedChainFilter(e.target.value)}
                  style={{
                    background: '#181a22',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {availableChains.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Wallet Role Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Role:</span>
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  style={{
                    background: '#181a22',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">All Roles</option>
                  <option value="hot">Hot Wallets</option>
                  <option value="pool">Withdrawal Pools</option>
                  <option value="cold">Cold Vaults</option>
                </select>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              Showing {filteredWallets.length} of {systemWallets.length} system addresses
            </div>
          </div>

          {/* Wallets Table */}
          <div
            style={{
              background: '#13151c',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              overflow: 'hidden'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#181a22', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>System Wallet & Role</th>
                  <th style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Blockchain</th>
                  <th style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Address</th>
                  <th style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Live Native Balance</th>
                  <th style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Tokens Held</th>
                  <th style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Estimated USD Value</th>
                  <th style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWallets.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '2.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                      No system wallets found matching selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredWallets.map((w) => {
                    const nativeNum = parseFloat(w.balance.replace(/,/g, '')) || 0;
                    const nativeUsd = nativeNum * (w.usdRate || 0);
                    const tokensUsd = (w.subBalances || []).reduce((acc, sb) => acc + (sb.usdValue || 0), 0);
                    const totalUsd = nativeUsd + tokensUsd;

                    const typeBadge = {
                      hot: { label: 'HOT INFLOW', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)', icon: Flame },
                      pool: { label: 'WITHDRAWAL POOL', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.12)', icon: Droplets },
                      cold: { label: 'COLD STORAGE', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', icon: Snowflake }
                    }[w.type];

                    const IconComponent = typeBadge.icon;

                    return (
                      <tr
                        key={w.id}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 700,
                                background: typeBadge.bg,
                                color: typeBadge.color,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <IconComponent size={11} /> {typeBadge.label}
                            </span>
                          </div>
                          <div style={{ fontWeight: 600, color: '#fff', marginTop: '4px' }}>{w.label}</div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              background: '#181a22',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: 'rgba(255,255,255,0.85)'
                            }}
                          >
                            {w.chain}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '12px'
                              }}
                            >
                              {w.address.slice(0, 10)}...{w.address.slice(-6)}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(w.address)}
                              title="Copy Address"
                              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '2px' }}
                            >
                              <Copy size={13} />
                            </button>
                            {w.explorer && (
                              <a
                                href={w.explorer}
                                target="_blank"
                                rel="noreferrer"
                                title="View on Block Explorer"
                                style={{ color: '#4d77f0', display: 'flex', alignItems: 'center' }}
                              >
                                <ExternalLink size={13} />
                              </a>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                            {w.balance} {w.symbol}
                          </div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                            ${fmtUsd(nativeUsd)}
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          {(!w.subBalances || w.subBalances.length === 0) ? (
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>Native only</span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              {w.subBalances.map((sb, idx) => (
                                <span key={idx} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-mono)' }}>
                                  {sb.balance} {sb.asset}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#34d399', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
                            ${fmtUsd(totalUsd)}
                          </div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                            Last sweep: {w.lastSweepAt}
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            {w.type === 'hot' && (
                              <button
                                type="button"
                                onClick={() => handleOpenSweepModal(w)}
                                style={{
                                  padding: '5px 10px',
                                  background: 'rgba(56, 189, 248, 0.12)',
                                  border: '1px solid rgba(56, 189, 248, 0.3)',
                                  borderRadius: '6px',
                                  color: '#38bdf8',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Snowflake size={12} /> Sweep to Cold
                              </button>
                            )}

                            {w.type === 'pool' && (
                              <button
                                type="button"
                                onClick={() => handleOpenSweepModal(w)}
                                style={{
                                  padding: '5px 10px',
                                  background: 'rgba(129, 140, 248, 0.12)',
                                  border: '1px solid rgba(129, 140, 248, 0.3)',
                                  borderRadius: '6px',
                                  color: '#818cf8',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Droplets size={12} /> Rebalance
                              </button>
                            )}

                            {w.type === 'cold' && (
                              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Lock size={12} /> Air-Gapped
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INTERNAL LEDGER & LIABILITIES */}
      {activeTab === 'ledger' && (
        <div>
          <div
            style={{
              background: '#13151c',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>
                  Platform Balance Sheet & Proof of Reserves
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
                  Continuous real-time audit reconciling on-chain wallet custody against internal database ledger liabilities
                </p>
              </div>

              <div
                style={{
                  background: 'rgba(52, 211, 153, 0.12)',
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  textAlign: 'right'
                }}
              >
                <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
                  Reserve Coverage Ratio
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                  {treasuryTotals.reserveRatio}% Backed
                </div>
              </div>
            </div>

            {/* Reconciliation Comparison Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#181a22', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Ledger Category & Account</th>
                    <th style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Classification</th>
                    <th style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Holdings Breakdown</th>
                    <th style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Total USD Balance</th>
                    <th style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Audit Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerAccounts.map((acc) => (
                    <tr key={acc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{acc.accountName}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                          {acc.description}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            background: acc.category === 'Liabilities' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(99, 102, 241, 0.12)',
                            color: acc.category === 'Liabilities' ? '#f87171' : '#818cf8',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}
                        >
                          {acc.category}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.8)' }}>
                          <div>{acc.btcTotal}</div>
                          <div>{acc.ethTotal}</div>
                          <div>{acc.solTotal}</div>
                          <div>{acc.usdtTotal}</div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
                          ${fmtUsd(acc.totalUsd)}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: acc.status === 'NOMINAL' ? '#34d399' : '#fbbf24'
                          }}
                        >
                          <CheckCircle2 size={12} /> {acc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: POLICIES & THRESHOLDS */}
      {activeTab === 'policies' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
          {/* Rule 1 Card */}
          <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Flame size={18} color="#fbbf24" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#fff' }}>
                Rule 1 — Autonomous Hot → Cold Sweep
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
              If any Hot Wallet USD balance exceeds the sweep threshold, web3-engine automatically signs a transfer to sweep all excess into cold storage while retaining a configured operational buffer.
            </p>

            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#181a22', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Sweep Trigger Threshold</span>
                <span style={{ fontWeight: 700, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                  &gt; ${fmtUsd(thresholds.hotWalletSweepThresholdUsd)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#181a22', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Retain Buffer (Kept in Hot)</span>
                <span style={{ fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  ${fmtUsd(thresholds.hotWalletRetainUsd)}
                </span>
              </div>
            </div>
          </div>

          {/* Rule 2 Card */}
          <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Droplets size={18} color="#818cf8" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#fff' }}>
                Rule 2 — Withdrawal Pool Top-Up
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
              If a chain's Withdrawal Pool dips below the minimum threshold due to high client withdrawal volume, the monitor triggers an automatic rebalance transfer from Hot Wallet to bring the pool back to target.
            </p>

            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#181a22', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Minimum Pool Floor</span>
                <span style={{ fontWeight: 700, color: '#f87171', fontFamily: 'var(--font-mono)' }}>
                  &lt; ${fmtUsd(thresholds.withdrawalPoolMinUsd)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#181a22', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Target Top-Up Level</span>
                <span style={{ fontWeight: 700, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                  ${fmtUsd(thresholds.withdrawalPoolTargetUsd)}
                </span>
              </div>
            </div>
          </div>

          {/* Rule 3 Card */}
          <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Snowflake size={18} color="#38bdf8" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#fff' }}>
                Rule 3 — Withdrawal Pool Overflow Cap
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
              Bounds the blast radius if an automated withdrawal signing key is ever compromised. Even if drained, an attacker can only seize up to the cap value before the monitor sweeps overflow into cold storage.
            </p>

            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#181a22', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Pool Overflow Cap</span>
                <span style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                  ${fmtUsd(thresholds.withdrawalPoolCapUsd)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#181a22', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Monitor Cadence</span>
                <span style={{ fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  Every {thresholds.treasuryCheckIntervalMin} minutes
                </span>
              </div>
            </div>
          </div>

          {/* Rule 4 Card */}
          <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Scale size={18} color="#34d399" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#fff' }}>
                Rule 4 — Ledger Reconciliation & Anomaly Alert
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
              Periodic on-chain verification comparing live RPC balances with database ledger balances. If discrepancy exceeds tolerance, high-priority incident triage alerts are immediately dispatched.
            </p>

            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#181a22', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Variance Tolerance</span>
                <span style={{ fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                  ±${thresholds.toleranceUsd} USD
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#181a22', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Reconciliation Schedule</span>
                <span style={{ fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  Every {thresholds.reconciliationIntervalHours} hours
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SWEEP AUDIT HISTORY */}
      {activeTab === 'history' && (
        <div
          style={{
            background: '#13151c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#181a22', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Timestamp (UTC)</th>
                <th style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Chain</th>
                <th style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Action</th>
                <th style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Volume Rebalanced</th>
                <th style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Transaction Hash</th>
                <th style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sweepHistory.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-mono)' }}>
                    {row.timestamp}
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: '#181a22', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                      {row.chain}
                    </span>
                  </td>

                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff' }}>
                    {row.action}
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: row.type.includes('MANUAL') ? 'rgba(129, 140, 248, 0.12)' : 'rgba(52, 211, 153, 0.12)',
                        color: row.type.includes('MANUAL') ? '#818cf8' : '#34d399'
                      }}
                    >
                      {row.type}
                    </span>
                  </td>

                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                    {row.amount}
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                        {row.txHash.slice(0, 10)}...{row.txHash.slice(-8)}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(row.txHash)}
                        title="Copy Tx Hash"
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '2px' }}
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ color: '#34d399', fontWeight: 600, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} /> {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: MANUAL SWEEP MODAL */}
      {sweepModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            style={{
              background: '#181a24',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '520px',
              padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowRightLeft size={20} color="#4d77f0" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                  Execute Manual Treasury Sweep
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSweepModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSweepSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Chain & Asset */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                      Blockchain
                    </label>
                    <select
                      value={sweepForm.chain}
                      onChange={(e) => setSweepForm({ ...sweepForm, chain: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: '#13151c',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '13px'
                      }}
                    >
                      <option value="Ethereum">Ethereum</option>
                      <option value="BNB Smart Chain">BNB Smart Chain</option>
                      <option value="Solana">Solana</option>
                      <option value="Bitcoin">Bitcoin</option>
                      <option value="Tron">Tron</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                      Asset / Token
                    </label>
                    <input
                      type="text"
                      value={sweepForm.asset}
                      onChange={(e) => setSweepForm({ ...sweepForm, asset: e.target.value.toUpperCase() })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: '#13151c',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>

                {/* Source & Target Roles */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                      Source Vault
                    </label>
                    <select
                      value={sweepForm.sourceType}
                      onChange={(e) => setSweepForm({ ...sweepForm, sourceType: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: '#13151c',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '13px'
                      }}
                    >
                      <option value="hot">Hot Wallet</option>
                      <option value="pool">Withdrawal Staging Pool</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                      Destination
                    </label>
                    <select
                      value={sweepForm.targetType}
                      onChange={(e) => setSweepForm({ ...sweepForm, targetType: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: '#13151c',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '13px'
                      }}
                    >
                      <option value="cold">Institutional Cold Vault</option>
                      <option value="pool">Withdrawal Pool</option>
                    </select>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                    Sweep Amount
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 10.5"
                    value={sweepForm.amount}
                    onChange={(e) => setSweepForm({ ...sweepForm, amount: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: '#13151c',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '14px',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                </div>

                {/* Reason */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                    Audit & Operations Justification
                  </label>
                  <input
                    type="text"
                    value={sweepForm.reason}
                    onChange={(e) => setSweepForm({ ...sweepForm, reason: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: '#13151c',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div style={{ background: 'rgba(77, 119, 240, 0.08)', border: '1px solid rgba(77, 119, 240, 0.2)', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Info size={16} color="#4d77f0" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    This transaction will be signed using web3-engine's operational keystore or routed through Fireblocks institutional MPC vault.
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setSweepModalOpen(false)}
                    style={{
                      padding: '8px 16px',
                      background: 'none',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '8px 18px',
                      background: 'linear-gradient(135deg, #4d77f0, #38bdf8)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? 'Transmitting...' : 'Confirm & Dispatch Sweep'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: THRESHOLDS & POLICY MODAL */}
      {thresholdModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            style={{
              background: '#181a24',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '560px',
              padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={20} color="#818cf8" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                  Adjust Treasury Automation Policies
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setThresholdModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleThresholdSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                      Hot Sweep Trigger (USD)
                    </label>
                    <input
                      type="number"
                      value={policyForm.hotWalletSweepThresholdUsd}
                      onChange={(e) => setPolicyForm({ ...policyForm, hotWalletSweepThresholdUsd: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: '#13151c',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                      Hot Retain Buffer (USD)
                    </label>
                    <input
                      type="number"
                      value={policyForm.hotWalletRetainUsd}
                      onChange={(e) => setPolicyForm({ ...policyForm, hotWalletRetainUsd: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: '#13151c',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                      Pool Minimum Floor (USD)
                    </label>
                    <input
                      type="number"
                      value={policyForm.withdrawalPoolMinUsd}
                      onChange={(e) => setPolicyForm({ ...policyForm, withdrawalPoolMinUsd: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: '#13151c',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                      Pool Target Level (USD)
                    </label>
                    <input
                      type="number"
                      value={policyForm.withdrawalPoolTargetUsd}
                      onChange={(e) => setPolicyForm({ ...policyForm, withdrawalPoolTargetUsd: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: '#13151c',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                      Pool Overflow Cap (USD)
                    </label>
                    <input
                      type="number"
                      value={policyForm.withdrawalPoolCapUsd}
                      onChange={(e) => setPolicyForm({ ...policyForm, withdrawalPoolCapUsd: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: '#13151c',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                      Check Interval (Minutes)
                    </label>
                    <input
                      type="number"
                      value={policyForm.treasuryCheckIntervalMin}
                      onChange={(e) => setPolicyForm({ ...policyForm, treasuryCheckIntervalMin: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: '#13151c',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setThresholdModalOpen(false)}
                    style={{
                      padding: '8px 16px',
                      background: 'none',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 18px',
                      background: 'linear-gradient(135deg, #4d77f0, #818cf8)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Save & Enforce Policies
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
