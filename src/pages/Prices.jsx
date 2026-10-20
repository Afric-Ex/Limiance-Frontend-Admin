import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  RefreshCw,
  Edit,
  Search,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
} from 'lucide-react';
import { api } from '../api/client';
import { useConfirm } from '../context/ConfirmContext';
import { ShimmerTableRows } from '../components/Shimmer';

const DEFAULT_COIN_LOGOS = {
  BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  BNB: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  USDC: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  LIM: '/logo.png',
  ADA: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  DOGE: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  MATIC: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png',
  DOT: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
  LTC: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png',
  AVAX: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  LINK: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
};

function FormattedPriceCell({
  value,
  currency = 'USD',
  isPrice = true,
  decimals = 6,
  color,
}) {
  if (value === null || value === undefined || value === '') {
    return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return <span>{String(value)}</span>;
  }

  // Exact 6-decimal representation with thousands separators
  const fullAmount = number.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const fullDisplay = isPrice
    ? currency === 'USD'
      ? `US$${fullAmount}`
      : `${currency} ${fullAmount}`
    : fullAmount;

  // Compact representation for large numbers (e.g. 201M or 201K)
  let compactText = '';
  let isAbbreviated = false;
  const abs = Math.abs(number);

  if (abs >= 1_000_000_000) {
    compactText = `${(number / 1e9).toFixed(2)}B`;
    isAbbreviated = true;
  } else if (abs >= 1_000_000) {
    compactText = `${(number / 1e6).toFixed(2)}M`;
    isAbbreviated = true;
  } else if (abs >= 100_000) {
    compactText = `${(number / 1e3).toFixed(2)}K`;
    isAbbreviated = true;
  } else {
    compactText = fullAmount;
    isAbbreviated = false;
  }

  const renderedDisplay = isPrice
    ? currency === 'USD'
      ? `US$${compactText}`
      : `${currency} ${compactText}`
    : compactText;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        position: 'relative',
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        fontWeight: 600,
        color: color || 'var(--text-primary)',
        whiteSpace: 'nowrap',
      }}
      title={`Full Amount: ${fullDisplay}`}
    >
      <span>{renderedDisplay}</span>
      {isAbbreviated && (
        <span
          title={`Full Amount: ${fullDisplay}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '15px',
            height: '15px',
            borderRadius: '50%',
            background: 'rgba(56, 189, 248, 0.2)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: '#38bdf8',
            fontSize: '10px',
            fontWeight: 800,
            cursor: 'help',
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          !
        </span>
      )}
    </div>
  );
}

export default function PricesPage() {
  const confirm = useConfirm();
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [updatedAfter, setUpdatedAfter] = useState('');
  const [updatedBefore, setUpdatedBefore] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [viewingPrice, setViewingPrice] = useState(null);
  const [toast, setToast] = useState(null);
  const [availableTokens, setAvailableTokens] = useState([]);
  const [sseConnected, setSseConnected] = useState(false);
  const [flashingPrices, setFlashingPrices] = useState({});
  const [formData, setFormData] = useState({
    coin: '',
    currency: 'USD',
    image: '',
    unifier: '',
    price: '',
    twenty_four_hour_change: '',
    twenty_four_hour_volume: '',
  });
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };
  const getTokenLogo = (coin, customImage) => {
    if (customImage && typeof customImage === 'string' && customImage.trim() !== '') {
      return customImage;
    }
    const clean = coin?.toUpperCase()?.trim();
    if (availableTokens && availableTokens.length > 0) {
      const match = availableTokens.find((t) => t.symbol?.toUpperCase() === clean);
      if (match?.image) return match.image;
      if (match?.logo_url) return match.logo_url;
    }
    return DEFAULT_COIN_LOGOS[clean] || '';
  };

  const formatNumber = (value, maximumFractionDigits = 6) => {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return String(value);
    }
    return number.toLocaleString(undefined, {
      minimumFractionDigits: maximumFractionDigits,
      maximumFractionDigits: maximumFractionDigits,
    });
  };

  const formatPrice = (value, currency = 'USD') => {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return String(value);
    }
    const formatted = number.toLocaleString(undefined, {
      minimumFractionDigits: 6,
      maximumFractionDigits: 6,
    });
    return currency === 'USD' ? `US$${formatted}` : `${currency} ${formatted}`;
  };
  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  };
  const getChangeValue = (price) => {
    const value = Number(price?.twenty_four_hour_change);
    return Number.isFinite(value) ? value : 0;
  };
  const fetchPrices = async (
    page = currentPage,
    limit = pageSize,
    search = searchQuery,
    currency = currencyFilter,
    min = minPrice,
    max = maxPrice,
    after = updatedAfter,
    before = updatedBefore
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', limit);
      if (search?.trim()) {
        params.set('query', search.trim());
      }
      if (currency?.trim()) {
        params.set('currency', currency.trim().toUpperCase());
      }
      if (min?.trim()) {
        params.set('min_price', min.trim());
      }
      if (max?.trim()) {
        params.set('max_price', max.trim());
      }
      if (after) {
        params.set(
          'updated_after',
          new Date(after).toISOString()
        );
      }
      if (before) {
        params.set(
          'updated_before',
          new Date(before).toISOString()
        );
      }
      const res = await api(`/api/prices?${params.toString()}`);
      const list =
        res.prices ||
        res.data ||
        (Array.isArray(res) ? res : []);
      setPrices(Array.isArray(list) ? list : []);
      setTotalPages(
        res.total_pages ||
        res.totalPages ||
        1
      );
      setTotalRecords(
        res.total_records ||
        res.totalRecords ||
        (Array.isArray(list) ? list.length : 0)
      );
      setCurrentPage(
        res.current_page ||
        res.currentPage ||
        page
      );
    } catch (err) {
      console.error('Failed to load prices', err);
      showToast(
        err.message || 'Failed to load prices',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };
  const fetchAvailableTokens = async () => {
    console.log('fetchAvailableTokens: firing');
    try {
      const res = await api('/api/tokens?limit=500');
      console.log('fetchAvailableTokens: response', res);
      const list = res.tokens || res.data || (Array.isArray(res) ? res : []);
      setAvailableTokens(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load supported tokens', err);
    }
  }; useEffect(() => {
    fetchAvailableTokens();
  }, []);
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPrices(
        currentPage,
        pageSize,
        searchQuery,
        currencyFilter,
        minPrice,
        maxPrice,
        updatedAfter,
        updatedBefore
      );
    }, 250);
    return () => clearTimeout(handler);
  }, [
    currentPage,
    pageSize,
    searchQuery,
    currencyFilter,
    minPrice,
    maxPrice,
    updatedAfter,
    updatedBefore,
  ]);

  useEffect(() => {
    let es = null;
    let reconnectTimeout = null;

    const connectSSE = () => {
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || '';
        const token = localStorage.getItem('admin_token') || '';
        const sseUrl = `${baseURL}/api/prices/stream?token=${encodeURIComponent(token)}`;
        es = new EventSource(sseUrl);

        es.onopen = () => {
          setSseConnected(true);
        };

        es.onmessage = (event) => {
          try {
            const liveData = JSON.parse(event.data);
            if (!Array.isArray(liveData)) return;

            setPrices((prevPrices) => {
              const liveMap = new Map();
              liveData.forEach((item) => {
                liveMap.set(`${item.coin?.toUpperCase()}-${(item.currency || 'USD')?.toUpperCase()}`, item);
              });

              const flashes = {};
              const updated = prevPrices.map((p) => {
                const key = `${p.coin?.toUpperCase()}-${(p.currency || 'USD')?.toUpperCase()}`;
                const live = liveMap.get(key);
                if (!live) return p;

                const oldPrice = Number(p.price);
                const newPrice = Number(live.price);
                if (Number.isFinite(oldPrice) && Number.isFinite(newPrice) && oldPrice !== newPrice) {
                  flashes[p.coin] = newPrice > oldPrice ? 'up' : 'down';
                }

                return {
                  ...p,
                  ...live,
                  index_price: live.index_price ?? p.index_price,
                  mark_price: live.mark_price ?? p.mark_price,
                  index_status: live.index_status ?? p.index_status,
                  sources_count: live.sources_count ?? p.sources_count,
                  is_internal: live.is_internal ?? p.is_internal,
                };
              });

              if (Object.keys(flashes).length > 0) {
                setFlashingPrices((prev) => ({ ...prev, ...flashes }));
                setTimeout(() => {
                  setFlashingPrices((prev) => {
                    const next = { ...prev };
                    Object.keys(flashes).forEach((k) => delete next[k]);
                    return next;
                  });
                }, 800);
              }

              return updated;
            });
          } catch (e) {
            console.error('SSE parse error:', e);
          }
        };

        es.onerror = () => {
          setSseConnected(false);
          if (es) {
            es.close();
          }
          reconnectTimeout = setTimeout(connectSSE, 3000);
        };
      } catch (err) {
        setSseConnected(false);
        reconnectTimeout = setTimeout(connectSSE, 5000);
      }
    };

    connectSSE();

    return () => {
      if (es) es.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };
  const handleCurrencyChange = (e) => {
    setCurrencyFilter(e.target.value.toUpperCase());
    setCurrentPage(1);
  };
  const clearFilters = () => {
    setSearchQuery('');
    setCurrencyFilter('');
    setMinPrice('');
    setMaxPrice('');
    setUpdatedAfter('');
    setUpdatedBefore('');
    setCurrentPage(1);
  };

  const hasFilters = useMemo(
    () =>
      Boolean(
        searchQuery ||
        currencyFilter ||
        minPrice ||
        maxPrice ||
        updatedAfter ||
        updatedBefore
      ),
    [
      searchQuery,
      currencyFilter,
      minPrice,
      maxPrice,
      updatedAfter,
      updatedBefore,
    ]
  );
  const handlePageChange = (newPage) => {
    if (
      newPage < 1 ||
      newPage > totalPages ||
      newPage === currentPage
    ) {
      return;
    }
    setCurrentPage(newPage);
  };
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };
  const handleCoinSelect = (symbol) => {
    const token = availableTokens.find((t) => t.symbol === symbol);
    setFormData((prev) => ({
      ...prev,
      coin: symbol,
      unifier: token?.unifier || '',
      image: token?.image || prev.image,
    }));
  };
  const openCreateModal = () => {
    setEditingPrice(null);
    setFormData({
      coin: '',
      currency: 'USD', // was: currencyFilter || 'USD'
      price: '',
      image: '',
      unifier: '',
      twenty_four_hour_change: '',
      twenty_four_hour_volume: '',
    });
    setModalOpen(true);
  };
  const openEditModal = (price) => {
    setEditingPrice(price);
    setFormData({
      coin: price.coin || '',
      currency: 'USD', // was: price.currency || 'USD'
      image: price?.image || '',
      unifier: price?.unifier || '',
      price:
        price.price !== undefined && price.price !== null
          ? String(price.price)
          : '',
      twenty_four_hour_change:
        price.twenty_four_hour_change !== undefined &&
          price.twenty_four_hour_change !== null
          ? String(price.twenty_four_hour_change)
          : '',
      twenty_four_hour_volume:
        price.twenty_four_hour_volume !== undefined &&
          price.twenty_four_hour_volume !== null
          ? String(price.twenty_four_hour_volume)
          : '',
    });
    setModalOpen(true);
  };
  const openViewModal = async (price) => {
    setViewingPrice({ ...price });
    setViewModalOpen(true);
    try {
      const currency = price.currency || 'USD';
      const res = await api(
        `/api/prices/${encodeURIComponent(
          price.coin
        )}?currency=${encodeURIComponent(currency)}`
      );
      if (res && !res.error) {
        setViewingPrice((prev) => ({
          ...prev,
          ...(res.price || res.data || res),
        }));
      }
    } catch {
      // Keep viewingPrice as initialized from table row
    }
  };
  const validateForm = () => {
    if (!formData.coin.trim()) {
      showToast('Coin is required', 'error');
      return false;
    }
    if (!formData.currency.trim()) {
      showToast('Currency is required', 'error');
      return false;
    }
    if (!editingPrice && !formData.unifier.trim()) {
      showToast('Unifier is required', 'error');
      return false;
    }
    if (formData.price === '') {
      showToast('Price is required', 'error');
      return false;
    }
    if (Number(formData.price) <= 0) {
      showToast('Price must be greater than zero', 'error');
      return false;
    }
    if (
      formData.twenty_four_hour_volume !== '' &&
      Number(formData.twenty_four_hour_volume) < 0
    ) {
      showToast('24h volume must not be negative', 'error');
      return false;
    }
    if (
      formData.twenty_four_hour_change !== '' &&
      !Number.isFinite(Number(formData.twenty_four_hour_change))
    ) {
      showToast('24h change must be a valid number', 'error');
      return false;
    }
    return true;
  };
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setSaving(true);
    try {
      if (editingPrice) {
        /*
         * PATCH only sends fields that are actually being
         * edited. This matches UpdatePrice's partial-update
         * semantics.
         */
        const updates = {
          price: formData.price,
          image: formData.image,
          twenty_four_hour_change:
            formData.twenty_four_hour_change,
          twenty_four_hour_volume:
            formData.twenty_four_hour_volume,
        };
        await api(
          `/api/prices/${encodeURIComponent(
            editingPrice.coin
          )}?currency=${encodeURIComponent(
            editingPrice.currency || 'USD'
          )}`,
          {
            method: 'PATCH',
            body: JSON.stringify(updates),
          }
        );
        showToast(
          `${editingPrice.coin}/${editingPrice.currency || 'USD'} price updated.`
        );
      } else {
        /*
         * POST accepts a single object or an array.
         * This page uses the single-object form.
         */
        await api('/api/prices', {
          method: 'POST',
          body: JSON.stringify({
            coin: formData.coin
              .trim()
              .toUpperCase(),
            currency: 'USD', // was: formData.currency.trim().toUpperCase()
            price: formData.price,
            unifier: formData.unifier,
            twenty_four_hour_change:
              formData.twenty_four_hour_change || '0',
            twenty_four_hour_volume:
              formData.twenty_four_hour_volume || '0',
          }),
        });
        showToast(
          `${formData.coin.toUpperCase()}/${formData.currency.toUpperCase()} price saved.`
        );
      }
      setModalOpen(false);
      await fetchPrices(
        currentPage,
        pageSize,
        searchQuery,
        currencyFilter,
        minPrice,
        maxPrice,
        updatedAfter,
        updatedBefore
      );
    } catch (err) {
      showToast(
        err.message || 'Failed to save price',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <div
      className="prices-page"
      style={{
        maxWidth: '1440px',
        margin: '0 auto',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '14px 22px',
            borderRadius: '10px',
            background:
              toast.type === 'error'
                ? 'var(--danger-solid)'
                : 'var(--success-solid)',
            color: '#fff',
            boxShadow:
              'var(--shadow-lg)',
            backdropFilter: 'blur(10px)',
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle size={16} />
          {toast.msg}
        </div>
      )}
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1
              style={{
                margin: 0,
                fontSize: '1.5rem',
                color: 'var(--text-primary)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              Market Prices
            </h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
                background: sseConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: sseConnected ? '#34d399' : '#fbbf24',
                border: sseConnected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: sseConnected ? '#10b981' : '#f59e0b',
                  boxShadow: sseConnected ? '0 0 8px #10b981' : 'none',
                }}
              />
              {sseConnected ? 'Live SSE Active' : 'Connecting Feed...'}
            </span>
          </div>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            Manage asset prices, live external index & mark prices, and 24h market statistics.
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '10px',
          }}
        >
          <button
            onClick={() =>
              fetchPrices(
                currentPage,
                pageSize,
                searchQuery,
                currencyFilter,
                minPrice,
                maxPrice,
                updatedAfter,
                updatedBefore
              )
            }
            disabled={loading}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              cursor: loading
                ? 'not-allowed'
                : 'pointer',
            }}
          >
            <RefreshCw
              size={14}
              className={
                loading ? 'animate-spin' : ''
              }
            />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              background: 'var(--primary-solid)',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow:
                '0 4px 14px var(--primary-glow)',
            }}
          >
            <Plus size={15} />
            Add Price
          </button>
        </div>
      </div>
      {/* Filters */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(220px, 2fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(120px, 1fr)',
            gap: '10px',
            alignItems: 'end',
          }}
        >
          {/* Search */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginBottom: '5px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Search Coin
            </label>
            <div
              style={{
                position: 'relative',
              }}
            >
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform:
                    'translateY(-50%)',
                  color:
                    'var(--text-faint)',
                }}
              />
              <input
                type="text"
                placeholder="BTC, ETH, USDT..."
                value={searchQuery}
                onChange={handleSearchChange}
                style={{
                  width: '100%',
                  padding:
                    '9px 12px 9px 36px',
                  borderRadius: '8px',
                  background:
                    'var(--bg-surface)',
                  border:
                    '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>
          </div>
          {/* Currency */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginBottom: '5px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Currency
            </label>
            <input
              type="text"
              placeholder="USD"
              value={currencyFilter}
              onChange={handleCurrencyChange}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                background:
                  'var(--bg-surface)',
                border:
                  '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
          {/* Min */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginBottom: '5px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Min Price
            </label>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                background:
                  'var(--bg-surface)',
                border:
                  '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
          {/* Max */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginBottom: '5px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Max Price
            </label>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="No limit"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                background:
                  'var(--bg-surface)',
                border:
                  '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
        </div>
        {/* Date filters */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(180px, 1fr) minmax(180px, 1fr) auto',
            gap: '10px',
            marginTop: '12px',
            alignItems: 'end',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginBottom: '5px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Updated After
            </label>
            <input
              type="datetime-local"
              value={updatedAfter}
              onChange={(e) => {
                setUpdatedAfter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                background:
                  'var(--bg-surface)',
                border:
                  '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginBottom: '5px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Updated Before
            </label>
            <input
              type="datetime-local"
              value={updatedBefore}
              onChange={(e) => {
                setUpdatedBefore(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                background:
                  'var(--bg-surface)',
                border:
                  '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
          <button
            onClick={clearFilters}
            disabled={!hasFilters}
            style={{
              height: '37px',
              padding: '0 14px',
              borderRadius: '8px',
              background: hasFilters
                ? 'rgba(239,68,68,0.1)'
                : 'var(--overlay-1)',
              border:
                '1px solid var(--danger-border)',
              color: hasFilters
                ? 'var(--danger-text)'
                : 'var(--text-muted)',
              cursor: hasFilters
                ? 'pointer'
                : 'not-allowed',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>
      {/* Price Table */}
      <div
        className="glass-card"
        style={{
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          boxShadow: 'var(--shadow-md)',
          borderRadius: '12px',
        }}
      >
        <table
          style={{
            width: '100%',
            minWidth: 'max-content',
            borderCollapse: 'collapse',
            textAlign: 'left',
            whiteSpace: 'nowrap',
          }}
        >
          <thead>
            <tr
              style={{
                background:
                  'var(--bg-surface)',
                borderBottom:
                  '1px solid var(--border)',
              }}
            >
              {[
                'Asset',
                'Base Price',
                'Index Price',
                'Mark Price',
                'Oracle Health',
                '24h Change',
                '24h Volume',
                'Last Updated',
                'Actions',
              ].map((heading, index) => (
                <th
                  key={heading}
                  style={{
                    padding: '13px 18px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    textAlign: index === 8 ? 'right' : 'left',
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <ShimmerTableRows rows={8} cols={9} colWidths={['200px', '140px', '140px', '140px', '150px', '120px', '130px', '160px', '100px']} />
            ) : prices.length === 0 ? (
              <tr>
                <td
                  colSpan="9"
                  style={{
                    padding: '60px 0',
                    textAlign: 'center',
                    color:
                      'var(--text-muted)',
                  }}
                >
                  No prices match the current
                  filters.
                </td>
              </tr>
            ) : (
              prices.map((price, idx) => {
                const change = getChangeValue(price);
                const isPositive = change > 0;
                const isNegative = change < 0;
                const logoSrc = getTokenLogo(price.coin, price.image);
                return (
                  <tr
                    key={`${price.coin}-${price.currency}-${idx}`}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    {/* Asset */}
                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {logoSrc ? (
                          <img
                            src={logoSrc}
                            alt={price.coin}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              objectFit: 'contain',
                              border: '1px solid rgba(77,119,240,0.25)',
                              background: 'rgba(77,119,240,0.15)',
                              padding: '2px',
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextSibling) {
                                e.currentTarget.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          style={{
                            display: logoSrc ? 'none' : 'flex',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(77,119,240,0.15)',
                            border: '1px solid rgba(77,119,240,0.25)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--info-text)',
                            fontWeight: 700,
                            fontSize: '11px',
                          }}
                        >
                          {(price.coin || '?').slice(0, 3).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
                            {price.coin}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {price.currency || 'USD'} market price
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Base Price with Live Flash */}
                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                      <div
                        style={{
                          display: 'inline-block',
                          padding: '3px 7px',
                          borderRadius: '4px',
                          transition: 'background-color 0.4s ease, color 0.4s ease',
                          backgroundColor:
                            flashingPrices[price.coin] === 'up'
                              ? 'rgba(16, 185, 129, 0.3)'
                              : flashingPrices[price.coin] === 'down'
                              ? 'rgba(239, 68, 68, 0.3)'
                              : 'transparent',
                        }}
                      >
                        <FormattedPriceCell
                          value={price.price}
                          currency={price.currency || 'USD'}
                          color={
                            flashingPrices[price.coin] === 'up'
                              ? '#34d399'
                              : flashingPrices[price.coin] === 'down'
                              ? '#f87171'
                              : 'var(--text-primary)'
                          }
                        />
                      </div>
                    </td>
                    {/* Index Price */}
                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                      <FormattedPriceCell
                        value={price.index_price}
                        currency={price.currency || 'USD'}
                        color="#e2e8f0"
                      />
                    </td>
                    {/* Mark Price */}
                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                      <FormattedPriceCell
                        value={price.mark_price}
                        currency={price.currency || 'USD'}
                        color="#38bdf8"
                      />
                    </td>
                    {/* Oracle Health */}
                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                      {price.is_internal || price.coin?.toUpperCase() === 'LIM' ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '5px',
                            background: 'rgba(168, 85, 247, 0.15)',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            color: '#c084fc',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c084fc' }} />
                          LIVE (Internal)
                        </span>
                      ) : price.index_status === 'LIVE' || price.index_status === 'OK' ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '5px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#34d399',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                          LIVE ({price.sources_count || 1} {price.sources_count === 1 ? 'src' : 'srcs'})
                        </span>
                      ) : price.index_status === 'DEGRADED' ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '5px',
                            background: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            color: '#fbbf24',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
                          DEGRADED ({price.sources_count || 1} {price.sources_count === 1 ? 'src' : 'srcs'})
                        </span>
                      ) : price.index_status === 'STALE' ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '5px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                          STALE
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>—</span>
                      )}
                    </td>
                    {/* 24h Change */}
                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          background: isPositive
                            ? 'rgba(16,185,129,0.1)'
                            : isNegative
                            ? 'rgba(239,68,68,0.1)'
                            : 'var(--overlay-2)',
                          color: isPositive
                            ? 'var(--success-text)'
                            : isNegative
                            ? 'var(--danger-text)'
                            : 'var(--text-secondary)',
                          fontSize: '11px',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isPositive ? (
                          <TrendingUp size={12} />
                        ) : isNegative ? (
                          <TrendingDown size={12} />
                        ) : (
                          <Activity size={12} />
                        )}
                        {change > 0 ? '+' : ''}
                        {Number(change).toFixed(4)}%
                      </div>
                    </td>
                    {/* Volume */}
                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                      <FormattedPriceCell
                        value={price.twenty_four_hour_volume}
                        isPrice={false}
                        decimals={4}
                        color="var(--text-primary)"
                      />
                    </td>
                    {/* Updated */}
                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '11px' }}>
                      {formatDate(
                        price.updated_at ||
                        price.updatedAt
                      )}
                    </td>
                    {/* Actions */}
                    <td
                      style={{
                        padding: '14px 18px',
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div
                        style={{
                          display:
                            'flex',
                          justifyContent:
                            'flex-end',
                          gap: '6px',
                        }}
                      >
                        <button
                          onClick={() =>
                            openViewModal(
                              price
                            )
                          }
                          style={{
                            padding:
                              '6px 9px',
                            background:
                              'var(--bg-surface)',
                            border:
                              '1px solid var(--border)',
                            borderRadius:
                              '6px',
                            color:
                              'var(--text-tertiary)',
                            cursor:
                              'pointer',
                          }}
                          title="View Price"
                        >
                          <Eye
                            size={13}
                          />
                        </button>
                        <button
                          onClick={() =>
                            openEditModal(
                              price
                            )
                          }
                          style={{
                            padding:
                              '6px 10px',
                            background:
                              'var(--bg-surface)',
                            border:
                              '1px solid var(--border)',
                            borderRadius:
                              '6px',
                            color:
                              'var(--info-text)',
                            cursor:
                              'pointer',
                          }}
                          title="Edit Price"
                        >
                          <Edit
                            size={13}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {/* Pagination */}
        <div
          style={{
            padding:
              '14px 20px',
            borderTop:
              '1px solid var(--border)',
            display:
              'flex',
            justifyContent:
              'space-between',
            alignItems:
              'center',
            background:
              'var(--bg-surface)',
            flexWrap:
              'wrap',
            gap: '12px',
          }}
        >
          <div
            style={{
              display:
                'flex',
              alignItems:
                'center',
              gap: '14px',
            }}
          >
            <span
              style={{
                fontSize:
                  '13px',
                color:
                  'var(--text-secondary)',
              }}
            >
              Showing{' '}
              {totalRecords === 0
                ? 0
                : (currentPage -
                  1) *
                pageSize +
                1}
              –
              {Math.min(
                currentPage *
                pageSize,
                totalRecords
              )}{' '}
              of{' '}
              {totalRecords.toLocaleString()}{' '}
              prices
            </span>
            <div
              style={{
                display:
                  'flex',
                alignItems:
                  'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  fontSize:
                    '12px',
                  color:
                    'var(--text-muted)',
                }}
              >
                Per page:
              </span>
              <select
                value={pageSize}
                onChange={(e) =>
                  handlePageSizeChange(
                    Number(
                      e.target.value
                    )
                  )
                }
                style={{
                  padding:
                    '4px 8px',
                  borderRadius:
                    '6px',
                  background:
                    'var(--bg-surface)',
                  border:
                    '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize:
                    '12px',
                  outline:
                    'none',
                  cursor:
                    'pointer',
                }}
              >
                <option value={10}>
                  10
                </option>
                <option value={20}>
                  20
                </option>
                <option value={50}>
                  50
                </option>
                <option value={100}>
                  100
                </option>
              </select>
            </div>
          </div>
          <div
            style={{
              display:
                'flex',
              alignItems:
                'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                fontSize:
                  '13px',
                color:
                  'var(--text-secondary)',
                marginRight:
                  '4px',
              }}
            >
              Page{' '}
              {currentPage} of{' '}
              {totalPages}
            </span>
            <button
              disabled={
                currentPage <= 1 ||
                loading
              }
              onClick={() =>
                handlePageChange(
                  currentPage - 1
                )
              }
              style={{
                padding:
                  '6px 12px',
                borderRadius:
                  '6px',
                background:
                  currentPage <= 1
                    ? 'var(--overlay-1)'
                    : 'var(--bg-surface)',
                border:
                  '1px solid var(--border)',
                color:
                  currentPage <= 1
                    ? 'var(--text-muted)'
                    : 'var(--text-primary)',
                cursor:
                  currentPage <= 1
                    ? 'not-allowed'
                    : 'pointer',
                display:
                  'flex',
                alignItems:
                  'center',
                gap: '4px',
                fontSize:
                  '12px',
                fontWeight: 600,
              }}
            >
              <ChevronLeft
                size={14}
              />
              Previous
            </button>
            <button
              disabled={
                currentPage >=
                totalPages ||
                loading
              }
              onClick={() =>
                handlePageChange(
                  currentPage + 1
                )
              }
              style={{
                padding:
                  '6px 12px',
                borderRadius:
                  '6px',
                background:
                  currentPage >=
                    totalPages
                    ? 'var(--overlay-1)'
                    : 'var(--bg-surface)',
                border:
                  '1px solid var(--border)',
                color:
                  currentPage >=
                    totalPages
                    ? 'var(--text-muted)'
                    : 'var(--text-primary)',
                cursor:
                  currentPage >=
                    totalPages
                    ? 'not-allowed'
                    : 'pointer',
                display:
                  'flex',
                alignItems:
                  'center',
                gap: '4px',
                fontSize:
                  '12px',
                fontWeight: 600,
              }}
            >
              Next
              <ChevronRight
                size={14}
              />
            </button>
          </div>
        </div>
      </div>
      {/* Create/Edit Modal */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(0,0,0,0.8)',
            backdropFilter:
              'blur(10px)',
            display: 'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight:
                '90vh',
              overflowY:
                'auto',
              padding:
                '24px 28px',
              boxShadow:
                'var(--shadow-lg)',
            }}
          >
            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'center',
                marginBottom:
                  '18px',
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize:
                      '1.25rem',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                  }}
                >
                  {editingPrice
                    ? `Edit ${editingPrice.coin} Price`
                    : 'Add Market Price'}
                </h2>
                <p
                  style={{
                    margin:
                      '5px 0 0',
                    fontSize:
                      '11px',
                    color:
                      'var(--text-muted)',
                  }}
                >
                  {editingPrice
                    ? 'Only supplied fields are patched.'
                    : 'Create a price record and sync it to the live price cache.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setModalOpen(false)
                }
                style={{
                  background:
                    'none',
                  border:
                    'none',
                  color:
                    'var(--text-secondary)',
                  cursor:
                    'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={
                handleFormSubmit
              }
              style={{
                display:
                  'flex',
                flexDirection:
                  'column',
                gap: '14px',
              }}
            >
              <div
                style={{
                  display:
                    'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: '12px',
                }}
              >
                <div>
                  <label
                    style={{
                      display:
                        'block',
                      fontSize:
                        '12px',
                      color:
                        'var(--text-secondary)',
                      marginBottom:
                        '4px',
                      fontWeight: 600,
                    }}
                  >
                    Coin
                  </label>
                  <select
                    required
                    disabled={!!editingPrice}
                    value={formData.coin}

                    onChange={(e) => handleCoinSelect(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      opacity: editingPrice ? 0.6 : 1,
                      cursor: editingPrice ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <option value="" disabled>
                      Select a token
                    </option>
                    {editingPrice && !availableTokens.some((t) => t.symbol === editingPrice.coin) && (
                      <option value={editingPrice.coin}>{editingPrice.coin}</option>
                    )}
                    {availableTokens.map((t) => (
                      <option key={t.symbol} value={t.symbol}>
                        {t.symbol}
                        {t.name ? ` — ${t.name}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display:
                        'block',
                      fontSize:
                        '12px',
                      color:
                        'var(--text-secondary)',
                      marginBottom:
                        '4px',
                      fontWeight: 600,
                    }}
                  >
                    Currency
                  </label>
                  <input

                    type="text"
                    disabled
                    value="USD"
                    readOnly
                    style={{
                      width:
                        '100%',
                      padding:
                        '9px 12px',
                      background:
                        'var(--bg-surface)',
                      border:
                        '1px solid var(--border)',
                      borderRadius:
                        '6px',
                      color: 'var(--text-primary)',
                      fontSize:
                        '13px',
                      opacity:
                        editingPrice
                          ? 0.6
                          : 1,
                    }}
                  />
                </div>
              </div>
              <div>
                <label
                  style={{
                    display:
                      'block',
                    fontSize:
                      '12px',
                    color:
                      'var(--text-secondary)',
                    marginBottom:
                      '4px',
                    fontWeight: 600,
                  }}
                >
                  Price
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={
                    formData.price
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price:
                        e.target.value,
                    })
                  }
                  style={{
                    width:
                      '100%',
                    padding:
                      '10px 12px',
                    background:
                      'var(--bg-surface)',
                    border:
                      '1px solid var(--primary-solid)',
                    borderRadius:
                      '6px',
                    color: 'var(--text-primary)',
                    fontSize:
                      '14px',
                    fontFamily:
                      'var(--font-mono)',
                  }}
                />
              </div>
              <div
                style={{
                  display:
                    'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: '12px',
                }}
              >
                <div>
                  <label
                    style={{
                      display:
                        'block',
                      fontSize:
                        '12px',
                      color:
                        'var(--text-secondary)',
                      marginBottom:
                        '4px',
                      fontWeight: 600,
                    }}
                  >
                    24h Change (%)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={
                      formData.twenty_four_hour_change
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        twenty_four_hour_change:
                          e.target.value,
                      })
                    }
                    style={{
                      width:
                        '100%',
                      padding:
                        '9px 12px',
                      background:
                        'var(--bg-surface)',
                      border:
                        '1px solid var(--border)',
                      borderRadius:
                        '6px',
                      color: 'var(--text-primary)',
                      fontSize:
                        '13px',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display:
                        'block',
                      fontSize:
                        '12px',
                      color:
                        'var(--text-secondary)',
                      marginBottom:
                        '4px',
                      fontWeight: 600,
                    }}
                  >
                    24h Volume
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={
                      formData.twenty_four_hour_volume
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        twenty_four_hour_volume:
                          e.target.value,
                      })
                    }
                    style={{
                      width:
                        '100%',
                      padding:
                        '9px 12px',
                      background:
                        'var(--bg-surface)',
                      border:
                        '1px solid var(--border)',
                      borderRadius:
                        '6px',
                      color: 'var(--text-primary)',
                      fontSize:
                        '13px',
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  padding:
                    '10px 12px',
                  borderRadius:
                    '7px',
                  background:
                    'rgba(99,102,241,0.08)',
                  border:
                    '1px solid rgba(99,102,241,0.18)',
                  fontSize:
                    '11px',
                  color:
                    'var(--text-secondary)',
                }}
              >
                <strong
                  style={{
                    color:
                      'var(--info-text)',
                  }}
                >
                  Redis sync:
                </strong>{' '}
                After a successful
                Postgres write, the
                handler mirrors the
                current price into
                Redis
                <span
                  style={{
                    fontFamily:
                      'var(--font-mono)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {' '}
                  token_price:&lt;coin&gt;
                </span>
                .
              </div>
              <div
                style={{
                  display:
                    'flex',
                  justifyContent:
                    'flex-end',
                  gap: '10px',
                  marginTop:
                    '8px',
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setModalOpen(false)
                  }
                  disabled={saving}
                  style={{
                    padding:
                      '9px 18px',
                    background:
                      'var(--bg-surface)',
                    border:
                      '1px solid var(--border)',
                    borderRadius:
                      '6px',
                    color:
                      'var(--text-secondary)',
                    cursor:
                      'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding:
                      '9px 22px',
                    background:
                      'var(--primary-solid)',
                    border: 'none',
                    borderRadius:
                      '6px',
                    color: '#fff',
                    fontWeight: 600,
                    cursor:
                      saving
                        ? 'not-allowed'
                        : 'pointer',
                    opacity:
                      saving ? 0.7 : 1,
                  }}
                >
                  {saving
                    ? 'Saving...'
                    : editingPrice
                      ? 'Save Changes'
                      : 'Create Price'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* View Price Modal */}
      {viewModalOpen && viewingPrice && (
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
              maxWidth: '540px',
              padding: '24px 28px',
              boxShadow: 'var(--shadow-lg)',
              borderRadius: '14px',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {(() => {
                  const logoSrc = getTokenLogo(viewingPrice.coin, viewingPrice.image);
                  return logoSrc ? (
                    <img
                      src={logoSrc}
                      alt={viewingPrice.coin}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        objectFit: 'contain',
                        border: '1px solid rgba(77,119,240,0.25)',
                        background: 'rgba(77,119,240,0.15)',
                        padding: '3px',
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null;
                })()}
                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                    }}
                  >
                    Token Price Details
                  </div>
                  <h2
                    style={{
                      margin: '2px 0 0',
                      color: 'var(--text-primary)',
                      fontSize: '1.4rem',
                      fontWeight: 800,
                    }}
                  >
                    {viewingPrice.coin}
                    <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>
                      {' '}/ {viewingPrice.currency || 'USD'}
                    </span>
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Price Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              {/* Base Price */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'rgba(77,119,240,0.08)',
                  border: '1px solid rgba(77,119,240,0.22)',
                }}
              >
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                  Base Price
                </div>
                <FormattedPriceCell
                  value={viewingPrice.price}
                  currency={viewingPrice.currency || 'USD'}
                />
              </div>

              {/* Index Price */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                  Index Price
                </div>
                <FormattedPriceCell
                  value={viewingPrice.index_price || viewingPrice.price}
                  currency={viewingPrice.currency || 'USD'}
                  color="#e2e8f0"
                />
              </div>

              {/* Mark Price */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'rgba(56,189,248,0.06)',
                  border: '1px solid rgba(56,189,248,0.2)',
                }}
              >
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                  Mark Price
                </div>
                <FormattedPriceCell
                  value={viewingPrice.mark_price || viewingPrice.price}
                  currency={viewingPrice.currency || 'USD'}
                  color="#38bdf8"
                />
              </div>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              {/* 24h Change */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', fontWeight: 700 }}>
                  24h Change
                </div>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: getChangeValue(viewingPrice) > 0
                      ? 'var(--success-text)'
                      : getChangeValue(viewingPrice) < 0
                      ? 'var(--danger-text)'
                      : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  {getChangeValue(viewingPrice) > 0 ? (
                    <TrendingUp size={14} />
                  ) : getChangeValue(viewingPrice) < 0 ? (
                    <TrendingDown size={14} />
                  ) : (
                    <Activity size={14} />
                  )}
                  {getChangeValue(viewingPrice) > 0 ? '+' : ''}
                  {Number(getChangeValue(viewingPrice)).toFixed(4)}%
                </div>
              </div>

              {/* 24h Volume */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', fontWeight: 700 }}>
                  24h Volume
                </div>
                <FormattedPriceCell
                  value={viewingPrice.twenty_four_hour_volume}
                  isPrice={false}
                  decimals={4}
                  color="var(--text-primary)"
                />
              </div>
            </div>

            {/* Metadata breakdown */}
            <div
              style={{
                padding: '14px',
                borderRadius: '8px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                fontSize: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Oracle Health</span>
                <div>
                  {viewingPrice.is_internal || viewingPrice.coin?.toUpperCase() === 'LIM' ? (
                    <span style={{ color: '#c084fc', fontWeight: 700, fontSize: '11px' }}>LIVE (Internal)</span>
                  ) : viewingPrice.index_status === 'LIVE' || viewingPrice.index_status === 'OK' ? (
                    <span style={{ color: '#34d399', fontWeight: 700, fontSize: '11px' }}>
                      LIVE ({viewingPrice.sources_count || 1} {viewingPrice.sources_count === 1 ? 'src' : 'srcs'})
                    </span>
                  ) : viewingPrice.index_status === 'DEGRADED' ? (
                    <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '11px' }}>
                      DEGRADED ({viewingPrice.sources_count || 1} {viewingPrice.sources_count === 1 ? 'src' : 'srcs'})
                    </span>
                  ) : (
                    <span style={{ color: '#f87171', fontWeight: 700, fontSize: '11px' }}>STALE</span>
                  )}
                </div>
              </div>
              {viewingPrice.unifier && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Unifier ID</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-primary)' }}>
                    {viewingPrice.unifier}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Last Updated</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {formatDate(viewingPrice.updated_at || viewingPrice.updatedAt)}
                </span>
              </div>
            </div>

            {/* Actions Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '18px',
                gap: '8px',
              }}
            >
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                style={{
                  padding: '8px 15px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  openEditModal(viewingPrice);
                }}
                style={{
                  padding: '8px 15px',
                  background: 'var(--primary-solid)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Edit size={14} />
                Edit Price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}