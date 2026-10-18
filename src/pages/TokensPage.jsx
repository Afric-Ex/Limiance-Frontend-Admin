import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useConfirm } from '../context/ConfirmContext';
import {
  Coins,
  Plus,
  RefreshCw,
  Trash2,
  Edit,
  Search,
  CheckCircle,
  Database,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { ShimmerTableRows } from '../components/Shimmer';

export default function TokensPage() {
  const confirm = useConfirm();
  const [tokens, setTokens] = useState([]);
  const [availableNetworks, setAvailableNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChainFilter, setSelectedChainFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingToken, setEditingToken] = useState(null);
  const [toast, setToast] = useState(null);
  const [copiedAddress, setCopiedAddress] = useState(null);
  const [expandedTokens, setExpandedTokens] = useState(new Set());

  const toggleExpand = (key) => {
    setExpandedTokens((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Form State
  const initialForm = {
    symbol: '',
    name: '',
    unifier: '',
    blockchain: '',
    contract_address: '',
    decimals: 18,
    min_deposit: '0',
    min_withdrawal: '0',
    is_active: true,
    is_tradable: true,
    is_stablecoin: false,
    is_fiat_pairable: false,
    image: '',
    website: '',
    whitepaper_url: '',
    explorer_url: '',
    description: '',
  };

  const [formData, setFormData] = useState(initialForm);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  const copyToClipboard = (text) => {
    if (!text || text === 'N/A') return;
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const fetchTokens = async (page = currentPage, limit = pageSize, search = searchQuery, chain = selectedChainFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', limit);
      if (search && search.trim()) params.set('query', search.trim());
      if (chain && chain.trim()) params.set('blockchain', chain.trim());

      const res = await api(`/api/tokens?${params.toString()}`);
      const list = res.tokens || res.data || (Array.isArray(res) ? res : []);
      setTokens(Array.isArray(list) ? list : []);
      setTotalPages(res.total_pages || res.totalPages || 1);
      setTotalRecords(res.total_records || res.totalRecords || (Array.isArray(list) ? list.length : 0));
      setCurrentPage(res.current_page || res.currentPage || page);
    } catch (err) {
      console.error('Failed to load tokens', err);
      showToast(err.message || 'Failed to load tokens', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchNetworks = async () => {
    try {
      const res = await api('/api/networks');
      const list = Array.isArray(res) ? res : res.networks || res.data || [];
      setAvailableNetworks(list);
    } catch (err) {
      console.error('Failed to load networks', err);
    }
  };

  useEffect(() => {
    fetchNetworks();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchTokens(currentPage, pageSize, searchQuery, selectedChainFilter);
    }, 250);
    return () => clearTimeout(handler);
  }, [currentPage, pageSize, searchQuery, selectedChainFilter]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleChainFilterChange = (e) => {
    setSelectedChainFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // Force clean redis flush & re-populate canonical token configs
  const handleSyncContracts = async () => {
    setSyncing(true);
    try {
      const res = await api('/api/tokens/contracts/sync', { method: 'POST' });
      showToast(`Watcher sync complete: ${res.total_synced ?? res.count ?? 0} active token contracts published to Redis.`);
    } catch (err) {
      showToast(err.message || 'Failed to sync contracts to Redis', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteToken = async (token) => {
    const symbol = token.symbol;
    const blockchain = token.blockchain || (token.chains && token.chains[0]) || '';
    const ok = await confirm({
      title: 'Delist Token',
      message: `Are you sure you want to delist ${symbol} on ${blockchain || 'all chains'}? This removes it from the database and purges its Redis watcher keys.`,
      confirmText: 'Delist Token',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      const query = blockchain ? `?blockchain=${encodeURIComponent(blockchain)}` : '';
      await api(`/api/tokens/${symbol}${query}`, { method: 'DELETE' });
      showToast(`Token ${symbol} (${blockchain}) deleted.`);
      fetchTokens();
    } catch (err) {
      showToast(err.message || 'Failed to delete token', 'error');
    }
  };

  const handleDeleteChain = async (token, blockchain) => {
    const ok = await confirm({
      title: 'Remove Chain Deployment',
      message: `Remove ${token.symbol} from ${blockchain}? This deletes the on-chain record and purges its Redis watcher key.`,
      confirmText: 'Remove Chain',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await api(`/api/tokens/${token.symbol}?blockchain=${encodeURIComponent(blockchain)}`, { method: 'DELETE' });
      showToast(`${token.symbol} removed from ${blockchain}.`);
      fetchTokens();
    } catch (err) {
      showToast(err.message || 'Failed to remove chain deployment', 'error');
    }
  };

  const handleGeneratePairsBySymbol = async (token) => {
    const symbol = token.symbol;
    const ok = await confirm({
      title: 'Generate Pairs for Token',
      message: `Generate standard trading pairs for ${symbol} across default quote assets (USDT, BTC, ETH, CNGN)?`,
      confirmText: 'Generate Pairs',
      variant: 'primary',
    });
    if (!ok) return;

    try {
      await api(`/api/tokens/${symbol}/pairs/generate`, { method: 'POST' });
      showToast(`Trading pairs for ${symbol} generated successfully`);
    } catch (err) {
      showToast(err.message || 'Failed to generate token pairs', 'error');
    }
  };

  const openAddModal = () => {
    setEditingToken(null);
    setFormData({
      ...initialForm,
      blockchain: availableNetworks[0]?.name || availableNetworks[0]?.blockchain || 'Ethereum',
    });
    setModalOpen(true);
  };

  const openEditModal = (tok, specificBlockchain = null) => {
    setEditingToken(tok);
    const targetDeployment = specificBlockchain && tok.deployments
      ? tok.deployments.find((d) => d.blockchain === specificBlockchain)
      : null;

    setFormData({
      symbol: tok.symbol || '',
      name: tok.name || '',
      unifier: tok.unifier || tok.symbol?.toLowerCase() || '',
      blockchain: targetDeployment?.blockchain || tok.blockchain || (tok.chains && tok.chains[0]) || '',
      contract_address: targetDeployment?.contract_address || tok.contract_address || '',
      decimals: targetDeployment?.decimals ?? tok.decimals ?? 18,
      min_deposit: targetDeployment?.min_deposit || tok.min_deposit || '0',
      min_withdrawal: targetDeployment?.min_withdrawal || tok.min_withdrawal || '0',
      is_active: tok.is_active !== false,
      is_tradable: tok.is_tradable !== false,
      is_stablecoin: !!tok.is_stablecoin,
      is_fiat_pairable: !!tok.is_fiat_pairable,
      image: tok.image || tok.logo_url || '',
      website: tok.website || '',
      whitepaper_url: tok.whitepaper_url || '',
      explorer_url: tok.explorer_url || '',
      description: tok.description || '',
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingToken) {
        const blockchainParam = encodeURIComponent(formData.blockchain || editingToken.blockchain);
        await api(`/api/tokens/${editingToken.symbol}?blockchain=${blockchainParam}`, {
          method: 'PATCH',
          body: JSON.stringify({
            contract_address: formData.contract_address.trim() || 'N/A',
            decimals: parseInt(formData.decimals, 10),
            min_deposit: formData.min_deposit,
            min_withdrawal: formData.min_withdrawal,
            is_tradable: formData.is_tradable,
            is_stablecoin: formData.is_stablecoin,
            is_fiat_pairable: formData.is_fiat_pairable,
            image: formData.image,
          }),
        });
        showToast(`Token ${editingToken.symbol} (${formData.blockchain}) updated.`);
      } else {
        await api('/api/tokens', {
          method: 'POST',
          body: JSON.stringify({
            symbol: formData.symbol.toUpperCase().trim(),
            name: formData.name.trim(),
            unifier: formData.unifier?.trim() || formData.symbol.toLowerCase().trim(),
            blockchain: formData.blockchain.trim(),
            contract_address: formData.contract_address.trim() || 'N/A',
            decimals: parseInt(formData.decimals, 10),
            min_deposit: formData.min_deposit,
            min_withdrawal: formData.min_withdrawal,
            is_tradable: formData.is_tradable,
            is_stablecoin: formData.is_stablecoin,
            is_fiat_pairable: formData.is_fiat_pairable,
            image: formData.image,
            website: formData.website,
            whitepaper_url: formData.whitepaper_url,
            explorer_url: formData.explorer_url,
            description: formData.description,
          }),
        });
        showToast(`Token ${formData.symbol.toUpperCase()} listed & published to watcher cache.`);
      }
      setModalOpen(false);
      fetchTokens();
    } catch (err) {
      showToast(err.message || 'Failed to save token', 'error');
    }
  };



  return (
    <div className="tokens-page" style={{ maxWidth: '1440px', margin: '0 auto', fontFamily: 'var(--font-sans)' }}>
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '14px 22px',
            borderRadius: '10px',
            background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
            color: '#fff',
            boxShadow: '0 12px 35px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle size={16} /> {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#fff', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Listed Tokens & Smart Contracts
          </h1>
         
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSyncContracts}
            disabled={syncing}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#818cf8',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: syncing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Database size={15} /> {syncing ? 'Purging & Syncing...' : 'Resync Redis Watcher Cache'}
          </button>
          <button
            onClick={openAddModal}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              background: '#4d77f0',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(77, 119, 240, 0.35)',
            }}
          >
            <Plus size={15} /> List New Token
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Chain Filter */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '650px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }} />
            <input
              type="text"
              placeholder="Search by ticker, token name, or contract address..."
              value={searchQuery}
              onChange={handleSearchChange}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          <select
            value={selectedChainFilter}
            onChange={handleChainFilterChange}
            style={{
              padding: '9px 14px',
              borderRadius: '8px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '160px',
            }}
          >
            <option value="">All Blockchains</option>
            {availableNetworks.map((net, nIdx) => (
              <option key={nIdx} value={net.name || net.blockchain || net.symbol}>
                {net.name || net.blockchain || net.symbol}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchTokens}
          style={{
            padding: '9px 16px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh List
        </button>
      </div>

      {/* Tokens Table */}
      <div className="glass-card" style={{ overflowX: 'auto', boxShadow: '0 4px 25px rgba(0,0,0,0.3)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '13px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Asset</th>
              <th style={{ padding: '13px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Network</th>
              <th style={{ padding: '13px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Contract Address</th>
              <th style={{ padding: '13px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Decimals</th>
              <th style={{ padding: '13px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Limits (Dep / Wd)</th>
              <th style={{ padding: '13px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Type</th>
              <th style={{ padding: '13px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
              <th style={{ padding: '13px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <ShimmerTableRows rows={7} cols={8} colWidths={['30%', '25%', '40%', '15%', '25%', '20%', '20%', '15%']} />
            ) : tokens.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No tokens matching the current search or chain filter.
                </td>
              </tr>
            ) : (
              tokens.map((t, idx) => {
                const rowKey = `${t.unifier || t.symbol}-${idx}`;
                const isExpanded = expandedTokens.has(rowKey);
                const chainName = t.blockchain || (t.chains && t.chains[0]) || '—';
                const hasDeployments = t.deployments && t.deployments.length > 1;
                const primaryDeployment = (t.deployments && t.deployments[0]) || t;
                const displayContract = primaryDeployment.contract_address || t.contract_address;
                const hasContract = displayContract && displayContract !== 'N/A' && displayContract !== '';

                return (
                  <React.Fragment key={rowKey}>
                    <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {t.image ? (
                            <img
                              src={t.image}
                              alt={t.symbol}
                              style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'contain' }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(77,119,240,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontWeight: 700, fontSize: '10px' }}>
                              {t.symbol.slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '13px', letterSpacing: '0.01em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{t.symbol}</span>
                              {t.unifier && t.unifier !== t.symbol.toLowerCase() && (
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 400 }}>
                                  ({t.unifier})
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              {t.name || t.symbol}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Multi-Chain Badges in Network Column */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', maxWidth: '240px' }}>
                          {t.chains && t.chains.length > 0 ? (
                            t.chains.map((chain, cIdx) => (
                              <span
                                key={cIdx}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  background: 'rgba(99, 102, 241, 0.12)',
                                  border: '1px solid rgba(99, 102, 241, 0.25)',
                                  color: '#a5b4fc',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  letterSpacing: '0.02em',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {chain}
                              </span>
                            ))
                          ) : (
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: 'rgba(99, 102, 241, 0.12)',
                                border: '1px solid rgba(99, 102, 241, 0.25)',
                                color: '#a5b4fc',
                                fontSize: '11px',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {chainName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Contract Address with Multi-Chain Pill */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {hasContract ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                className="mono"
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: 'rgba(255,255,255,0.06)',
                                  color: '#cbd5e1',
                                }}
                                title={displayContract}
                              >
                                {displayContract.length > 16
                                  ? `${displayContract.slice(0, 8)}...${displayContract.slice(-6)}`
                                  : displayContract}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(displayContract)}
                                style={{ background: 'none', border: 'none', color: copiedAddress === displayContract ? '#34d399' : 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '2px' }}
                                title="Copy Contract Address"
                              >
                                {copiedAddress === displayContract ? <Check size={12} /> : <Copy size={12} />}
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Native / Non-contract</span>
                          )}

                          {hasDeployments && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(rowKey)}
                              style={{
                                background: isExpanded ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.12)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                borderRadius: '5px',
                                color: '#818cf8',
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '2px 7px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                              title="Toggle per-chain contract addresses"
                            >
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              {t.deployments.length} chains
                            </button>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px', color: '#94a3b8', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                        {primaryDeployment.decimals ?? t.decimals ?? 18}
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span>Min Dep: <strong style={{ color: '#fff' }}>{primaryDeployment.min_deposit || t.min_deposit || '0'}</strong></span>
                          <span>Min Wd: <strong style={{ color: '#fff' }}>{primaryDeployment.min_withdrawal || t.min_withdrawal || '0'}</strong></span>
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {t.is_stablecoin && (
                            <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                              STABLE
                            </span>
                          )}
                          {t.is_tradable ? (
                            <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                              TRADE
                            </span>
                          ) : (
                            <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                              OFF
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ padding: '3px 9px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, background: t.is_active !== false ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: t.is_active !== false ? '#34d399' : '#f87171' }}>
                          {t.is_active !== false ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => handleGeneratePairsBySymbol(t)}
                            style={{ padding: '6px 10px', background: 'rgba(77,119,240,0.12)', border: '1px solid rgba(77,119,240,0.25)', borderRadius: '6px', color: '#818cf8', cursor: 'pointer' }}
                            title="Generate Trading Pairs for Token"
                          >
                            <Sparkles size={13} />
                          </button>
                          <button
                            onClick={() => openEditModal(t)}
                            style={{ padding: '6px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', color: '#818cf8', cursor: 'pointer' }}
                            title="Edit Token Details"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteToken(t)}
                            style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', color: '#f87171', cursor: 'pointer' }}
                            title="Delist Token"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Per-Chain Deployments Sub-Panel */}
                    {isExpanded && t.deployments && t.deployments.length > 0 && (
                      <tr style={{ background: 'rgba(99, 102, 241, 0.03)', borderBottom: '1px solid var(--border)' }}>
                        <td colSpan="8" style={{ padding: '12px 20px 16px 20px' }}>
                          <div style={{ background: 'rgba(15, 17, 23, 0.85)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '10px', padding: '14px 18px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#a5b4fc', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Coins size={14} />
                              <span>Chain Deployments for {t.name || t.symbol} ({t.unifier || t.symbol.toLowerCase()})</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '10px' }}>
                              {t.deployments.map((d, dIdx) => (
                                <div key={dIdx} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{d.blockchain}</span>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                      <button
                                        type="button"
                                        onClick={() => openEditModal(t, d.blockchain)}
                                        style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '4px', color: '#818cf8', cursor: 'pointer', fontSize: '11px', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                      >
                                        <Edit size={11} /> Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteChain(t, d.blockchain)}
                                        style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '4px', color: '#f87171', cursor: 'pointer', fontSize: '11px', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                      >
                                        <Trash2 size={11} /> Delete
                                      </button>
                                    </div>
                                  </div>
                                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                    <span>{d.contract_address && d.contract_address !== 'N/A' ? `${d.contract_address.slice(0, 10)}...${d.contract_address.slice(-6)}` : 'Native'}</span>
                                    {d.contract_address && d.contract_address !== 'N/A' && (
                                      <button type="button" onClick={() => copyToClipboard(d.contract_address)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedAddress === d.contract_address ? '#34d399' : 'rgba(255,255,255,0.4)', padding: 0 }}>
                                        {copiedAddress === d.contract_address ? <Check size={11} /> : <Copy size={11} />}
                                      </button>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                                    <span>Decimals: <strong style={{ color: '#fff' }}>{d.decimals}</strong></span>
                                    <span>Min Dep: <strong style={{ color: '#fff' }}>{d.min_deposit || '0'}</strong></span>
                                    <span>Min Wd: <strong style={{ color: '#fff' }}>{d.min_withdrawal || '0'}</strong></span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-surface)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Showing {totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalRecords)} of {totalRecords.toLocaleString()} listed contracts
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  color: '#fff',
                  fontSize: '12px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginRight: '4px' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage <= 1 || loading}
              onClick={() => handlePageChange(currentPage - 1)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: currentPage <= 1 ? 'rgba(255,255,255,0.02)' : 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: currentPage <= 1 ? 'var(--text-muted)' : '#fff',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              disabled={currentPage >= totalPages || loading}
              onClick={() => handlePageChange(currentPage + 1)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: currentPage >= totalPages ? 'rgba(255,255,255,0.02)' : 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: currentPage >= totalPages ? 'var(--text-muted)' : '#fff',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Add/Edit Token */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px 28px',
              boxShadow: '0 24px 70px rgba(0,0,0,0.9)',
            }}
          >
            <h2 style={{ margin: '0 0 14px', fontSize: '1.25rem', color: '#fff', fontWeight: 700 }}>
              {editingToken ? `Edit Token ${editingToken.symbol}` : 'List New Token'}
            </h2>

            {editingToken && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  color: '#a5b4fc',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '14px',
                }}
              >
                <ShieldAlert size={16} />
                <span>
                  Select the blockchain from the dropdown to switch which chain deployment you are editing. All fields are editable.
                </span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    Token Symbol (Ticker)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. USDT, BTC"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    Token Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tether USD"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                  Unifier (Multi-Chain Group Slug)
                </label>
                <input
                  type="text"
                  placeholder="e.g. tether, usd-coin, bitcoin (defaults to ticker)"
                  value={formData.unifier}
                  onChange={(e) => setFormData({ ...formData, unifier: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '13px',
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                  Tokens sharing the same unifier are grouped together under one asset across all blockchains.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    {editingToken ? 'Select Blockchain to Edit' : 'Blockchain Network'}
                  </label>
                  <select
                    value={formData.blockchain}
                    onChange={(e) => {
                      const chosenChain = e.target.value;
                      if (editingToken) {
                        const targetDep = editingToken.deployments?.find(
                          (d) => d.blockchain.toLowerCase() === chosenChain.toLowerCase()
                        );
                        setFormData((prev) => ({
                          ...prev,
                          blockchain: chosenChain,
                          contract_address: targetDep?.contract_address || (chosenChain === editingToken.blockchain ? editingToken.contract_address : ''),
                          decimals: targetDep?.decimals ?? (chosenChain === editingToken.blockchain ? editingToken.decimals : 18),
                        }));
                      } else {
                        setFormData({ ...formData, blockchain: chosenChain });
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    {editingToken ? (
                      (editingToken.deployments && editingToken.deployments.length > 0
                        ? editingToken.deployments.map((d) => d.blockchain)
                        : (editingToken.chains && editingToken.chains.length > 0 ? editingToken.chains : [editingToken.blockchain || 'Ethereum'])
                      ).map((chain, cIdx) => (
                        <option key={cIdx} value={chain}>
                          {chain}
                        </option>
                      ))
                    ) : (
                      availableNetworks.map((net, nIdx) => {
                        const val = net.name || net.blockchain || net.symbol;
                        return (
                          <option key={nIdx} value={val}>
                            {val}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    Decimals
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="18"
                    value={formData.decimals}
                    onChange={(e) => setFormData({ ...formData, decimals: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-surface)', border: '1px solid #4d77f0', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                  Smart Contract Address <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(leave N/A for native coins)</span>
                </label>
                <input
                  type="text"
                  placeholder="0x... or mint address or N/A"
                  value={formData.contract_address}
                  onChange={(e) => setFormData({ ...formData, contract_address: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-surface)', border: '1px solid #4d77f0', borderRadius: '6px', color: '#fff', fontSize: '13px', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    Minimum Deposit Limit
                  </label>
                  <input
                    type="text"
                    placeholder="0"
                    value={formData.min_deposit}
                    onChange={(e) => setFormData({ ...formData, min_deposit: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    Minimum Withdrawal Limit
                  </label>
                  <input
                    type="text"
                    placeholder="0"
                    value={formData.min_withdrawal}
                    onChange={(e) => setFormData({ ...formData, min_withdrawal: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                  Logo Icon URL
                </label>
                <input
                  type="url"
                  placeholder="https://coin-images.coingecko.com/..."
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_tradable}
                    onChange={(e) => setFormData({ ...formData, is_tradable: e.target.checked })}
                  />
                  Tradable on Exchange
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_stablecoin}
                    onChange={(e) => setFormData({ ...formData, is_stablecoin: e.target.checked })}
                  />
                  Is Stablecoin (USD Pegged)
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_fiat_pairable}
                    onChange={(e) => setFormData({ ...formData, is_fiat_pairable: e.target.checked })}
                  />
                  Fiat Pairable (NGN, etc.)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: '9px 18px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 22px', background: '#4d77f0', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {editingToken ? 'Save Changes' : 'List Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

