import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useConfirm } from '../context/ConfirmContext';
import {
  Globe,
  Plus,
  RefreshCw,
  Trash2,
  Edit,
  Search,
  Server,
  DollarSign,
  CheckCircle,
  ExternalLink,
  Layers,
  Languages,
  Clock,
} from 'lucide-react';
import { ShimmerTableRows } from '../components/Shimmer';

export default function NetworksPage() {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState('networks'); // 'networks' | 'currencies' | 'rpcs'
  const [networks, setNetworks] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [rpcs, setRpcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  // Modals
  const [networkModalOpen, setNetworkModalOpen] = useState(false);
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [rpcModalOpen, setRpcModalOpen] = useState(false);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [timezoneModalOpen, setTimezoneModalOpen] = useState(false);

  const [editingItem, setEditingItem] = useState(null);

  // Languages & Timezones State
  const [languages, setLanguages] = useState([]);
  const [timezones, setTimezones] = useState([]);

  // Network Form
  const [networkForm, setNetworkForm] = useState({
    symbol: '',
    name: '',
    blockchain: '',
    decimals: 18,
    standard: '',
    description: '',
    explorer_url: '',
    website: '',
  });

  // Currency Form
  const [currencyForm, setCurrencyForm] = useState({
    symbol: '',
    name: '',
    country: '',
  });

  // RPC Form
  const [rpcForm, setRpcForm] = useState({
    canonicalName: '',
    chainId: 1,
    kind: 'evm',
    nativeSymbol: 'ETH',
    decimals: 18,
    confirmations: 12,
    isActive: true,
    endpoints: '{"http": "https://eth.llamarpc.com"}',
  });

  // Language Form
  const [languageForm, setLanguageForm] = useState({
    code: '',
    name: '',
    nativename: '',
    direction: 'ltr',
    isactive: true,
  });

  // Timezone Form
  const [timezoneForm, setTimezoneForm] = useState({
    code: '',
    name: '',
    offset: '+00:00',
    isactive: true,
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [netRes, currRes, rpcRes, langRes, tzRes] = await Promise.allSettled([
        api('/api/networks'),
        api('/api/currencies'),
        api('/api/rpcs'),
        api('/api/languages'),
        api('/api/timezones'),
      ]);

      if (netRes.status === 'fulfilled') {
        const data = netRes.value;
        setNetworks(Array.isArray(data) ? data : data?.networks || data?.data || []);
      }
      if (currRes.status === 'fulfilled') {
        const data = currRes.value;
        setCurrencies(Array.isArray(data) ? data : data?.currencies || data?.data || []);
      }
      if (rpcRes.status === 'fulfilled') {
        const data = rpcRes.value;
        setRpcs(Array.isArray(data) ? data : data?.rpcs || data?.data || []);
      }
      if (langRes.status === 'fulfilled') {
        const data = langRes.value;
        setLanguages(Array.isArray(data) ? data : data?.languages || data?.data || []);
      }
      if (tzRes.status === 'fulfilled') {
        const data = tzRes.value;
        setTimezones(Array.isArray(data) ? data : data?.timezones || data?.data || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load listing infrastructure', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // --- Network Actions ---
  const handleSaveNetwork = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api(`/api/networks/${editingItem.symbol}`, {
          method: 'PATCH',
          body: {
            name: networkForm.name,
            blockchain: networkForm.blockchain,
            decimals: Number(networkForm.decimals),
            standard: networkForm.standard,
            description: networkForm.description,
            explorer_url: networkForm.explorer_url,
            website: networkForm.website,
          },
        });
        showToast(`Updated network ${editingItem.symbol}`);
      } else {
        await api('/api/networks', {
          method: 'POST',
          body: {
            ...networkForm,
            decimals: Number(networkForm.decimals),
          },
        });
        showToast(`Listed network ${networkForm.symbol}`);
      }
      setNetworkModalOpen(false);
      fetchAll();
    } catch (err) {
      showToast(err.message || 'Failed to save network', 'error');
    }
  };

  const handleDeleteNetwork = async (symbol) => {
    const ok = await confirm({
      title: 'Delete Blockchain Network',
      message: `Are you sure you want to delete network ${symbol}? Wallets and deposit watchers associated with this network will be affected.`,
      confirmText: 'Delete Network',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/api/networks/${symbol}`, { method: 'DELETE' });
      showToast(`Deleted network ${symbol}`);
      fetchAll();
    } catch (err) {
      showToast(err.message || 'Failed to delete network', 'error');
    }
  };

  // --- Currency Actions ---
  const handleSaveCurrency = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api(`/api/currencies/${editingItem.symbol}`, {
          method: 'PATCH',
          body: {
            name: currencyForm.name,
            country: currencyForm.country,
          },
        });
        showToast(`Updated fiat currency ${editingItem.symbol}`);
      } else {
        await api('/api/currencies', {
          method: 'POST',
          body: currencyForm,
        });
        showToast(`Added fiat currency ${currencyForm.symbol}`);
      }
      setCurrencyModalOpen(false);
      fetchAll();
    } catch (err) {
      showToast(err.message || 'Failed to save currency', 'error');
    }
  };

  const handleDeleteCurrency = async (symbol) => {
    const ok = await confirm({
      title: 'Delete Fiat Currency',
      message: `Are you sure you want to delete currency ${symbol}?`,
      confirmText: 'Delete Currency',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/api/currencies/${symbol}`, { method: 'DELETE' });
      showToast(`Deleted currency ${symbol}`);
      fetchAll();
    } catch (err) {
      showToast(err.message || 'Failed to delete currency', 'error');
    }
  };

  // --- RPC Actions ---
  const handleSaveRpc = async (e) => {
    e.preventDefault();
    try {
      let parsedEndpoints = {};
      try {
        parsedEndpoints = JSON.parse(rpcForm.endpoints);
      } catch (err) {
        showToast('Endpoints must be valid JSON', 'error');
        return;
      }

      await api('/api/rpcs', {
        method: 'POST',
        body: {
          canonicalName: rpcForm.canonicalName,
          chainId: Number(rpcForm.chainId),
          kind: rpcForm.kind,
          nativeSymbol: rpcForm.nativeSymbol,
          decimals: Number(rpcForm.decimals),
          confirmations: Number(rpcForm.confirmations),
          isActive: rpcForm.isActive,
          endpoints: parsedEndpoints,
        },
      });
      showToast(`Saved RPC configuration for ${rpcForm.canonicalName}`);
      setRpcModalOpen(false);
      fetchAll();
    } catch (err) {
      showToast(err.message || 'Failed to save RPC', 'error');
    }
  };

  const handleDeleteRpc = async (canonicalName) => {
    const ok = await confirm({
      title: 'Delete RPC Node',
      message: `Are you sure you want to delete RPC node configuration ${canonicalName}?`,
      confirmText: 'Delete Node',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/api/rpcs/${canonicalName}`, { method: 'DELETE' });
      showToast(`Deleted RPC ${canonicalName}`);
      fetchAll();
    } catch (err) {
      showToast(err.message || 'Failed to delete RPC', 'error');
    }
  };

  // --- Language Actions ---
  const handleSaveLanguage = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api(`/api/languages/${editingItem.code}`, {
          method: 'PATCH',
          body: {
            name: languageForm.name,
            nativename: languageForm.nativename,
            direction: languageForm.direction,
            isactive: languageForm.isactive,
          },
        });
        showToast(`Updated language ${editingItem.code}`);
      } else {
        await api('/api/languages', {
          method: 'POST',
          body: [languageForm],
        });
        showToast(`Added language ${languageForm.code}`);
      }
      setLanguageModalOpen(false);
      fetchAll();
    } catch (err) {
      showToast(err.message || 'Failed to save language', 'error');
    }
  };

  const handleDeleteLanguage = async (code) => {
    const ok = await confirm({
      title: 'Delete Language',
      message: `Are you sure you want to remove language locale ${code}?`,
      confirmText: 'Delete Language',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await api(`/api/languages/${code}`, { method: 'DELETE' });
      showToast(`Deleted language ${code}`);
      fetchAll();
    } catch (err) {
      showToast(err.message || 'Failed to delete language', 'error');
    }
  };

  // --- Timezone Actions ---
  const handleSaveTimezone = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api(`/api/timezones/${editingItem.code}`, {
          method: 'PATCH',
          body: {
            name: timezoneForm.name,
            offset: timezoneForm.offset,
            isactive: timezoneForm.isactive,
          },
        });
        showToast(`Updated timezone ${editingItem.code}`);
      } else {
        await api('/api/timezones', {
          method: 'POST',
          body: [timezoneForm],
        });
        showToast(`Added timezone ${timezoneForm.code}`);
      }
      setTimezoneModalOpen(false);
      fetchAll();
    } catch (err) {
      showToast(err.message || 'Failed to save timezone', 'error');
    }
  };

  const handleDeleteTimezone = async (code) => {
    const ok = await confirm({
      title: 'Delete Timezone',
      message: `Are you sure you want to remove timezone ${code}?`,
      confirmText: 'Delete Timezone',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await api(`/api/timezones/${code}`, { method: 'DELETE' });
      showToast(`Deleted timezone ${code}`);
      fetchAll();
    } catch (err) {
      showToast(err.message || 'Failed to delete timezone', 'error');
    }
  };

  // Filters
  const filteredNetworks = networks.filter((n) =>
    (n.symbol || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.blockchain || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCurrencies = currencies.filter((c) =>
    (c.symbol || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.country || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRpcs = rpcs.filter((r) =>
    (r.canonicalName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.nativeSymbol || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.kind || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLanguages = languages.filter((l) =>
    (l.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.nativename || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTimezones = timezones.filter((t) =>
    (t.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.offset || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', position: 'relative' }}>
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: toast.type === 'error' ? '#ef4444' : '#10b981',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          <CheckCircle size={16} />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#fff' }}>
            Networks, Currencies & Nodes
          </h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>
            Manage blockchain networks, base fiat quote currencies, and high-availability Web3 RPC providers.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'networks' && (
            <button
              onClick={() => {
                setEditingItem(null);
                setNetworkForm({
                  symbol: '',
                  name: '',
                  blockchain: '',
                  decimals: 18,
                  standard: '',
                  description: '',
                  explorer_url: '',
                  website: '',
                });
                setNetworkModalOpen(true);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#4d77f0',
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Add Network
            </button>
          )}

          {activeTab === 'currencies' && (
            <button
              onClick={() => {
                setEditingItem(null);
                setCurrencyForm({ symbol: '', name: '', country: '' });
                setCurrencyModalOpen(true);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#4d77f0',
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Add Currency
            </button>
          )}

          {activeTab === 'rpcs' && (
            <button
              onClick={() => {
                setEditingItem(null);
                setRpcForm({
                  canonicalName: '',
                  chainId: 1,
                  kind: 'evm',
                  nativeSymbol: 'ETH',
                  decimals: 18,
                  confirmations: 12,
                  isActive: true,
                  endpoints: '{"http": "https://rpc.ankr.com/eth"}',
                });
                setRpcModalOpen(true);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#4d77f0',
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Configure RPC Node
            </button>
          )}

          {activeTab === 'languages' && (
            <button
              onClick={() => {
                setEditingItem(null);
                setLanguageForm({ code: '', name: '', nativename: '', direction: 'ltr', isactive: true });
                setLanguageModalOpen(true);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#4d77f0',
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Add Language
            </button>
          )}

          {activeTab === 'timezones' && (
            <button
              onClick={() => {
                setEditingItem(null);
                setTimezoneForm({ code: '', name: '', offset: '+00:00', isactive: true });
                setTimezoneModalOpen(true);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#4d77f0',
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Add Timezone
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search */}
      <div
        style={{
          background: '#13151c',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('networks')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: activeTab === 'networks' ? '#4d77f0' : 'rgba(255,255,255,0.05)',
              border: 'none',
              color: activeTab === 'networks' ? '#fff' : 'rgba(255,255,255,0.6)',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Globe size={14} /> Blockchain Networks ({networks.length})
          </button>
          <button
            onClick={() => setActiveTab('currencies')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: activeTab === 'currencies' ? '#4d77f0' : 'rgba(255,255,255,0.05)',
              border: 'none',
              color: activeTab === 'currencies' ? '#fff' : 'rgba(255,255,255,0.6)',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <DollarSign size={14} /> Fiat Currencies ({currencies.length})
          </button>
          <button
            onClick={() => setActiveTab('rpcs')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: activeTab === 'rpcs' ? '#4d77f0' : 'rgba(255,255,255,0.05)',
              border: 'none',
              color: activeTab === 'rpcs' ? '#fff' : 'rgba(255,255,255,0.6)',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Server size={14} /> RPC Nodes ({rpcs.length})
          </button>
          <button
            onClick={() => setActiveTab('languages')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: activeTab === 'languages' ? '#4d77f0' : 'rgba(255,255,255,0.05)',
              border: 'none',
              color: activeTab === 'languages' ? '#fff' : 'rgba(255,255,255,0.6)',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Languages size={14} /> Languages ({languages.length})
          </button>
          <button
            onClick={() => setActiveTab('timezones')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: activeTab === 'timezones' ? '#4d77f0' : 'rgba(255,255,255,0.05)',
              border: 'none',
              color: activeTab === 'timezones' ? '#fff' : 'rgba(255,255,255,0.6)',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Clock size={14} /> Timezones ({timezones.length})
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.4)',
              }}
            />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                background: '#181a22',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
          <button
            onClick={fetchAll}
            style={{
              padding: '8px 14px',
              background: '#1c1e28',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* --- Tab 1: Networks Table --- */}
      {activeTab === 'networks' && (
        <div
          style={{
            background: '#13151c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            overflowX: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#181a22', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Symbol</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Network Name</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Blockchain</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Decimals</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Standard</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Explorer</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <ShimmerTableRows rows={6} cols={7} colWidths={['15%', '25%', '20%', '15%', '15%', '25%', '15%']} />
              ) : filteredNetworks.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    No blockchain networks found.
                  </td>
                </tr>
              ) : (
                filteredNetworks.map((net) => (
                  <tr key={net.symbol} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                      {net.symbol}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#fff', fontWeight: 500 }}>
                      {net.name}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'rgba(255,255,255,0.7)' }}>
                      {net.blockchain}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)' }}>
                      {net.decimals}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: 'rgba(255,255,255,0.06)',
                          color: '#a5b4fc',
                        }}
                      >
                        {net.standard || 'Native'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {net.explorer_url ? (
                        <a
                          href={net.explorer_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#4d77f0', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
                        >
                          View <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setEditingItem(net);
                            setNetworkForm({
                              symbol: net.symbol,
                              name: net.name,
                              blockchain: net.blockchain,
                              decimals: net.decimals,
                              standard: net.standard || '',
                              description: net.description || '',
                              explorer_url: net.explorer_url || '',
                              website: net.website || '',
                            });
                            setNetworkModalOpen(true);
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteNetwork(net.symbol)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Tab 2: Currencies Table --- */}
      {activeTab === 'currencies' && (
        <div
          style={{
            background: '#13151c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            overflowX: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#181a22', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Symbol</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Currency Name</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Country Code</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <ShimmerTableRows rows={5} cols={4} colWidths={['20%', '35%', '25%', '20%']} />
              ) : filteredCurrencies.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    No fiat currencies found.
                  </td>
                </tr>
              ) : (
                filteredCurrencies.map((cur) => (
                  <tr key={cur.symbol} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                      {cur.symbol}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#fff', fontWeight: 500 }}>
                      {cur.name}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                        }}
                      >
                        {cur.country}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setEditingItem(cur);
                            setCurrencyForm({
                              symbol: cur.symbol,
                              name: cur.name,
                              country: cur.country,
                            });
                            setCurrencyModalOpen(true);
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteCurrency(cur.symbol)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Tab 3: RPC Nodes Table --- */}
      {activeTab === 'rpcs' && (
        <div
          style={{
            background: '#13151c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            overflowX: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#181a22', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Canonical Name</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Chain ID</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Kind / Native</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Confirmations</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Endpoints</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Status</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <ShimmerTableRows rows={6} cols={7} colWidths={['20%', '15%', '15%', '15%', '20%', '15%', '10%']} />
              ) : filteredRpcs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    No RPC nodes registered.
                  </td>
                </tr>
              ) : (
                filteredRpcs.map((rpc) => (
                  <tr key={rpc.canonicalName} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#a5b4fc', fontFamily: 'var(--font-mono)' }}>
                      {rpc.canonicalName}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)' }}>
                      {rpc.chainId}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#fff', fontSize: '13px' }}>
                      <span style={{ textTransform: 'uppercase', color: '#60a5fa', fontWeight: 600 }}>{rpc.kind}</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 4px' }}>•</span>
                      <span style={{ color: '#fbbf24', fontWeight: 600 }}>{rpc.nativeSymbol}</span>
                    </td>
                    <td style={{ padding: '14px 18px', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)' }}>
                      {rpc.confirmations} blocks
                    </td>
                    <td style={{ padding: '14px 18px', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <code style={{ fontSize: '11px', color: '#94a3b8', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
                        {JSON.stringify(rpc.endpoints || {})}
                      </code>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: rpc.isActive !== false ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: rpc.isActive !== false ? '#34d399' : '#f87171',
                          border: `1px solid ${rpc.isActive !== false ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                        }}
                      >
                        {rpc.isActive !== false ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleDeleteRpc(rpc.canonicalName)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Tab 4: Languages Table --- */}
      {activeTab === 'languages' && (
        <div
          style={{
            background: '#13151c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '14px 18px' }}>Locale Code</th>
                <th style={{ padding: '14px 18px' }}>Language Name</th>
                <th style={{ padding: '14px 18px' }}>Native Name</th>
                <th style={{ padding: '14px 18px' }}>Text Direction</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <ShimmerTableRows rows={6} cols={6} colWidths={['15%', '25%', '25%', '15%', '10%', '10%']} />
              ) : filteredLanguages.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    No language locales configured.
                  </td>
                </tr>
              ) : (
                filteredLanguages.map((l) => (
                  <tr key={l.code} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                      {l.code}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 600, color: '#fff' }}>
                      {l.name}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'rgba(255,255,255,0.8)' }}>
                      {l.nativename || '—'}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: l.direction === 'rtl' ? 'rgba(168, 85, 247, 0.12)' : 'rgba(77, 119, 240, 0.12)',
                          color: l.direction === 'rtl' ? '#c084fc' : '#818cf8',
                        }}
                      >
                        {(l.direction || 'ltr').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: l.isactive !== false ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: l.isactive !== false ? '#34d399' : '#f87171',
                        }}
                      >
                        {l.isactive !== false ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setEditingItem(l);
                            setLanguageForm({
                              code: l.code,
                              name: l.name,
                              nativename: l.nativename || '',
                              direction: l.direction || 'ltr',
                              isactive: l.isactive !== false,
                            });
                            setLanguageModalOpen(true);
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            cursor: 'pointer',
                          }}
                          title="Edit Language"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteLanguage(l.code)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            cursor: 'pointer',
                          }}
                          title="Delete Language"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Tab 5: Timezones Table --- */}
      {activeTab === 'timezones' && (
        <div
          style={{
            background: '#13151c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '14px 18px' }}>Identifier / Code</th>
                <th style={{ padding: '14px 18px' }}>Timezone Name</th>
                <th style={{ padding: '14px 18px' }}>UTC Offset</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <ShimmerTableRows rows={6} cols={5} colWidths={['20%', '35%', '20%', '15%', '10%']} />
              ) : filteredTimezones.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    No timezones configured.
                  </td>
                </tr>
              ) : (
                filteredTimezones.map((tz) => (
                  <tr key={tz.code} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                      {tz.code}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 600, color: '#fff' }}>
                      {tz.name}
                    </td>
                    <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', color: '#34d399', fontWeight: 600 }}>
                      UTC {tz.offset}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: tz.isactive !== false ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: tz.isactive !== false ? '#34d399' : '#f87171',
                        }}
                      >
                        {tz.isactive !== false ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setEditingItem(tz);
                            setTimezoneForm({
                              code: tz.code,
                              name: tz.name,
                              offset: tz.offset || '+00:00',
                              isactive: tz.isactive !== false,
                            });
                            setTimezoneModalOpen(true);
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            cursor: 'pointer',
                          }}
                          title="Edit Timezone"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteTimezone(tz.code)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            cursor: 'pointer',
                          }}
                          title="Delete Timezone"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Modal: Add / Edit Network --- */}
      {networkModalOpen && (
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
          }}
        >
          <div
            style={{
              background: '#13151c',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '18px' }}>
              {editingItem ? `Edit Network: ${editingItem.symbol}` : 'Add Blockchain Network'}
            </h3>
            <form onSubmit={handleSaveNetwork}>
              {!editingItem && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Network Symbol (e.g. ETH, BSC, ARB)</label>
                  <input
                    type="text"
                    required
                    value={networkForm.symbol}
                    onChange={(e) => setNetworkForm({ ...networkForm, symbol: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
              )}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Network Display Name</label>
                <input
                  type="text"
                  required
                  value={networkForm.name}
                  onChange={(e) => setNetworkForm({ ...networkForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Blockchain Family</label>
                  <input
                    type="text"
                    required
                    value={networkForm.blockchain}
                    onChange={(e) => setNetworkForm({ ...networkForm, blockchain: e.target.value })}
                    placeholder="e.g. ethereum, solana"
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Decimals</label>
                  <input
                    type="number"
                    value={networkForm.decimals}
                    onChange={(e) => setNetworkForm({ ...networkForm, decimals: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Block Explorer URL</label>
                <input
                  type="text"
                  value={networkForm.explorer_url}
                  onChange={(e) => setNetworkForm({ ...networkForm, explorer_url: e.target.value })}
                  placeholder="https://etherscan.io"
                  style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setNetworkModalOpen(false)}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', background: '#4d77f0', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Network
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Modal: Add / Edit Currency --- */}
      {currencyModalOpen && (
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
          }}
        >
          <div
            style={{
              background: '#13151c',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '440px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '18px' }}>
              {editingItem ? `Edit Currency: ${editingItem.symbol}` : 'Add Fiat Currency'}
            </h3>
            <form onSubmit={handleSaveCurrency}>
              {!editingItem && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Symbol (e.g. USD, EUR, GBP)</label>
                  <input
                    type="text"
                    required
                    value={currencyForm.symbol}
                    onChange={(e) => setCurrencyForm({ ...currencyForm, symbol: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
              )}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Currency Name</label>
                <input
                  type="text"
                  required
                  value={currencyForm.name}
                  onChange={(e) => setCurrencyForm({ ...currencyForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Country / Region Code (e.g. US, EU, GB)</label>
                <input
                  type="text"
                  required
                  value={currencyForm.country}
                  onChange={(e) => setCurrencyForm({ ...currencyForm, country: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setCurrencyModalOpen(false)}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', background: '#4d77f0', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Currency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Modal: Configure RPC Node --- */}
      {rpcModalOpen && (
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
          }}
        >
          <div
            style={{
              background: '#13151c',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '18px' }}>
              Configure Blockchain RPC Node
            </h3>
            <form onSubmit={handleSaveRpc}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Canonical Name</label>
                  <input
                    type="text"
                    required
                    value={rpcForm.canonicalName}
                    onChange={(e) => setRpcForm({ ...rpcForm, canonicalName: e.target.value })}
                    placeholder="e.g. eth-mainnet"
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Chain ID</label>
                  <input
                    type="number"
                    required
                    value={rpcForm.chainId}
                    onChange={(e) => setRpcForm({ ...rpcForm, chainId: e.target.value })}
                    placeholder="1"
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Kind</label>
                  <select
                    value={rpcForm.kind}
                    onChange={(e) => setRpcForm({ ...rpcForm, kind: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  >
                    <option value="evm">EVM</option>
                    <option value="solana">Solana</option>
                    <option value="bitcoin">Bitcoin (UTXO)</option>
                    <option value="cosmos">Cosmos</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Native Symbol</label>
                  <input
                    type="text"
                    required
                    value={rpcForm.nativeSymbol}
                    onChange={(e) => setRpcForm({ ...rpcForm, nativeSymbol: e.target.value.toUpperCase() })}
                    placeholder="ETH"
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Decimals</label>
                  <input
                    type="number"
                    value={rpcForm.decimals}
                    onChange={(e) => setRpcForm({ ...rpcForm, decimals: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Confirmation Blocks</label>
                  <input
                    type="number"
                    value={rpcForm.confirmations}
                    onChange={(e) => setRpcForm({ ...rpcForm, confirmations: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Endpoints (JSON key-value mapping)</label>
                <textarea
                  rows={3}
                  value={rpcForm.endpoints}
                  onChange={(e) => setRpcForm({ ...rpcForm, endpoints: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#818cf8', fontFamily: 'var(--font-mono)', fontSize: '12px', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <input
                  type="checkbox"
                  id="rpcActive"
                  checked={rpcForm.isActive}
                  onChange={(e) => setRpcForm({ ...rpcForm, isActive: e.target.checked })}
                />
                <label htmlFor="rpcActive" style={{ fontSize: '13px', color: '#fff' }}>Enable this RPC node for live polling</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setRpcModalOpen(false)}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', background: '#4d77f0', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save RPC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Modal: Add / Edit Language --- */}
      {languageModalOpen && (
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
          }}
        >
          <div
            style={{
              background: '#13151c',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '18px' }}>
              {editingItem ? `Edit Language: ${editingItem.code}` : 'Add Supported Language'}
            </h3>
            <form onSubmit={handleSaveLanguage}>
              {!editingItem && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Locale Code (e.g. en, es, fr, zh, ar)</label>
                  <input
                    type="text"
                    required
                    value={languageForm.code}
                    onChange={(e) => setLanguageForm({ ...languageForm, code: e.target.value.toLowerCase().trim() })}
                    placeholder="e.g. en"
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
              )}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Language English Name</label>
                <input
                  type="text"
                  required
                  value={languageForm.name}
                  onChange={(e) => setLanguageForm({ ...languageForm, name: e.target.value })}
                  placeholder="e.g. English"
                  style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Native Script Name</label>
                <input
                  type="text"
                  value={languageForm.nativename}
                  onChange={(e) => setLanguageForm({ ...languageForm, nativename: e.target.value })}
                  placeholder="e.g. Español, Français, العربية"
                  style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Text Layout Direction</label>
                <select
                  value={languageForm.direction}
                  onChange={(e) => setLanguageForm({ ...languageForm, direction: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                >
                  <option value="ltr">Left-to-Right (LTR)</option>
                  <option value="rtl">Right-to-Left (RTL)</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <input
                  type="checkbox"
                  id="langActive"
                  checked={languageForm.isactive}
                  onChange={(e) => setLanguageForm({ ...languageForm, isactive: e.target.checked })}
                />
                <label htmlFor="langActive" style={{ fontSize: '13px', color: '#fff' }}>Enable language in platform selector</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setLanguageModalOpen(false)}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', background: '#4d77f0', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Language
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Modal: Add / Edit Timezone --- */}
      {timezoneModalOpen && (
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
          }}
        >
          <div
            style={{
              background: '#13151c',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '18px' }}>
              {editingItem ? `Edit Timezone: ${editingItem.code}` : 'Add Supported Timezone'}
            </h3>
            <form onSubmit={handleSaveTimezone}>
              {!editingItem && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Timezone Identifier / Code</label>
                  <input
                    type="text"
                    required
                    value={timezoneForm.code}
                    onChange={(e) => setTimezoneForm({ ...timezoneForm, code: e.target.value.trim() })}
                    placeholder="e.g. UTC, WAT, Africa/Lagos, America/New_York"
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
              )}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Timezone Display Name</label>
                <input
                  type="text"
                  required
                  value={timezoneForm.name}
                  onChange={(e) => setTimezoneForm({ ...timezoneForm, name: e.target.value })}
                  placeholder="e.g. West Africa Time (Lagos)"
                  style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>UTC Offset Format (e.g. +01:00, -05:00)</label>
                <input
                  type="text"
                  required
                  value={timezoneForm.offset}
                  onChange={(e) => setTimezoneForm({ ...timezoneForm, offset: e.target.value.trim() })}
                  placeholder="e.g. +01:00"
                  style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontFamily: 'var(--font-mono)', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <input
                  type="checkbox"
                  id="tzActive"
                  checked={timezoneForm.isactive}
                  onChange={(e) => setTimezoneForm({ ...timezoneForm, isactive: e.target.checked })}
                />
                <label htmlFor="tzActive" style={{ fontSize: '13px', color: '#fff' }}>Enable timezone in platform preferences</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setTimezoneModalOpen(false)}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', background: '#4d77f0', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Timezone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
