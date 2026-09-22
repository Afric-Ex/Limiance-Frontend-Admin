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
  const formatNumber = (value, maximumFractionDigits = 8) => {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return String(value);
    }
    return number.toLocaleString(undefined, {
      maximumFractionDigits,
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
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: number >= 1 ? 2 : 8,
      }).format(number);
    } catch {
      return `${currency} ${formatNumber(number)}`;
    }
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
    try {
      const res = await api('/api/tokens?limit=500');
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
  const openCreateModal = () => {
    setEditingPrice(null);
    setFormData({
      coin: '',
      currency: 'USD', // was: currencyFilter || 'USD'
      price: '',
      image: price?.image || '',
unifier: price?.unifier || '',
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
    /*
     * Use the dedicated GET /prices/:coin endpoint so the
     * UI exercises the full API surface.
     */
    try {
      const currency = price.currency || 'USD';
      const res = await api(
        `/api/prices/${encodeURIComponent(
          price.coin
        )}?currency=${encodeURIComponent(currency)}`
      );
      setViewingPrice(res.price || res.data || res);
      setViewModalOpen(true);
    } catch (err) {
      showToast(
        err.message || 'Failed to load price details',
        'error'
      );
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
    if (formData.price === '') {
      showToast('Price is required', 'error');
      return false;
    }
    if (Number(formData.price) < 0) {
      showToast('Price must not be negative', 'error');
      return false;
    }
    if (
      formData.twenty_four_hour_volume !== '' &&
      Number(formData.twenty_four_hour_volume) < 0
    ) {
      showToast(
        '24h volume must not be negative',
        'error'
      );
      return false;
    }
    if (!formData.unifier.trim()) {
  showToast('Unifier is required', 'error');
  return false;
}
    if (
      formData.twenty_four_hour_change !== '' &&
      !Number.isFinite(
        Number(formData.twenty_four_hour_change)
      )
    ) {
      showToast(
        '24h change must be a valid number',
        'error'
      );
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
                ? 'rgba(239, 68, 68, 0.95)'
                : 'rgba(16, 185, 129, 0.95)',
            color: '#fff',
            boxShadow:
              '0 12px 35px rgba(0,0,0,0.5)',
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
          <h1
            style={{
              margin: 0,
              fontSize: '1.5rem',
              color: '#fff',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            Market Prices
          </h1>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            Manage asset prices, 24h market statistics and
            currency-specific pricing.
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
              color: '#fff',
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
              background: '#4d77f0',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow:
                '0 4px 14px rgba(77, 119, 240, 0.35)',
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
                    'rgba(255,255,255,0.35)',
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
                  color: '#fff',
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
                color: '#fff',
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
                color: '#fff',
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
                color: '#fff',
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
                color: '#fff',
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
                color: '#fff',
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
                : 'rgba(255,255,255,0.02)',
              border:
                '1px solid rgba(239,68,68,0.2)',
              color: hasFilters
                ? '#f87171'
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
          boxShadow:
            '0 4px 25px rgba(0,0,0,0.3)',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
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
                'Price',
                '24h Change',
                '24h Volume',
                'Currency',
                'Last Updated',
                'Actions',
              ].map((heading, index) => (
                <th
                  key={heading}
                  style={{
                    padding:
                      '13px 18px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform:
                      'uppercase',
                    color:
                      'var(--text-muted)',
                    textAlign:
                      index === 6
                        ? 'right'
                        : 'left',
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    padding: '60px 0',
                    textAlign: 'center',
                    color:
                      'var(--text-muted)',
                  }}
                >
                  Loading prices...
                </td>
              </tr>
            ) : prices.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
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
                const change =
                  getChangeValue(price);
                const isPositive =
                  change > 0;
                const isNegative =
                  change < 0;
                return (
                  <tr
                    key={`${price.coin}-${price.currency}-${idx}`}
                    style={{
                      borderBottom:
                        '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    {/* Asset */}
                    <td
                      style={{
                        padding:
                          '14px 18px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems:
                            'center',
                          gap: '10px',
                        }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius:
                              '50%',
                            background:
                              'rgba(77,119,240,0.15)',
                            border:
                              '1px solid rgba(77,119,240,0.25)',
                            display:
                              'flex',
                            alignItems:
                              'center',
                            justifyContent:
                              'center',
                            color:
                              '#818cf8',
                            fontWeight: 700,
                            fontSize:
                              '11px',
                          }}
                        >
                          {(price.coin ||
                            '?')
                            .slice(0, 3)
                            .toUpperCase()}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              color: '#fff',
                              fontSize:
                                '13px',
                            }}
                          >
                            {price.coin}
                          </div>
                          <div
                            style={{
                              fontSize:
                                '11px',
                              color:
                                'var(--text-secondary)',
                            }}
                          >
                            {price.currency ||
                              'USD'}{' '}
                            market price
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Price */}
                    <td
                      style={{
                        padding:
                          '14px 18px',
                      }}
                    >
                      <span
                        style={{
                          fontFamily:
                            'var(--font-mono)',
                          fontSize:
                            '13px',
                          fontWeight: 700,
                          color: '#fff',
                        }}
                      >
                        {formatPrice(
                          price.price,
                          price.currency ||
                          'USD'
                        )}
                      </span>
                    </td>
                    {/* 24h Change */}
                    <td
                      style={{
                        padding:
                          '14px 18px',
                      }}
                    >
                      <div
                        style={{
                          display:
                            'inline-flex',
                          alignItems:
                            'center',
                          gap: '5px',
                          padding:
                            '4px 8px',
                          borderRadius:
                            '6px',
                          background:
                            isPositive
                              ? 'rgba(16,185,129,0.1)'
                              : isNegative
                                ? 'rgba(239,68,68,0.1)'
                                : 'rgba(255,255,255,0.05)',
                          color:
                            isPositive
                              ? '#34d399'
                              : isNegative
                                ? '#f87171'
                                : 'var(--text-secondary)',
                          fontSize:
                            '11px',
                          fontWeight: 700,
                        }}
                      >
                        {isPositive ? (
                          <TrendingUp
                            size={12}
                          />
                        ) : isNegative ? (
                          <TrendingDown
                            size={12}
                          />
                        ) : (
                          <Activity
                            size={12}
                          />
                        )}
                        {change > 0
                          ? '+'
                          : ''}
                        {formatNumber(
                          change,
                          4
                        )}
                        %
                      </div>
                    </td>
                    {/* Volume */}
                    <td
                      style={{
                        padding:
                          '14px 18px',
                        color:
                          '#cbd5e1',
                        fontSize:
                          '12px',
                        fontFamily:
                          'var(--font-mono)',
                      }}
                    >
                      {formatNumber(
                        price.twenty_four_hour_volume
                      )}
                    </td>
                    {/* Currency */}
                    <td
                      style={{
                        padding:
                          '14px 18px',
                      }}
                    >
                      <span
                        style={{
                          padding:
                            '3px 8px',
                          borderRadius:
                            '5px',
                          background:
                            'rgba(99,102,241,0.1)',
                          border:
                            '1px solid rgba(99,102,241,0.2)',
                          color:
                            '#a5b4fc',
                          fontSize:
                            '11px',
                          fontWeight: 700,
                        }}
                      >
                        {price.currency ||
                          'USD'}
                      </span>
                    </td>
                    {/* Updated */}
                    <td
                      style={{
                        padding:
                          '14px 18px',
                        color:
                          'var(--text-secondary)',
                        fontSize:
                          '11px',
                      }}
                    >
                      {formatDate(
                        price.updated_at ||
                        price.updatedAt
                      )}
                    </td>
                    {/* Actions */}
                    <td
                      style={{
                        padding:
                          '14px 18px',
                        textAlign:
                          'right',
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
                              '#94a3b8',
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
                              '#818cf8',
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
                  color: '#fff',
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
                    ? 'rgba(255,255,255,0.02)'
                    : 'var(--bg-surface)',
                border:
                  '1px solid var(--border)',
                color:
                  currentPage <= 1
                    ? 'var(--text-muted)'
                    : '#fff',
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
                    ? 'rgba(255,255,255,0.02)'
                    : 'var(--bg-surface)',
                border:
                  '1px solid var(--border)',
                color:
                  currentPage >=
                    totalPages
                    ? 'var(--text-muted)'
                    : '#fff',
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
                '0 24px 70px rgba(0,0,0,0.9)',
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
                    color: '#fff',
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        coin: e.target.value,
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: '#fff',
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
                      color: '#fff',
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
                      '1px solid #4d77f0',
                    borderRadius:
                      '6px',
                    color: '#fff',
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
                      color: '#fff',
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
                      color: '#fff',
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
                      '#a5b4fc',
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
                    color: '#fff',
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
                      '#4d77f0',
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
      {viewModalOpen &&
        viewingPrice && (
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
                maxWidth:
                  '500px',
                padding:
                  '24px 28px',
                boxShadow:
                  '0 24px 70px rgba(0,0,0,0.9)',
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
                    '20px',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize:
                        '11px',
                      color:
                        'var(--text-muted)',
                      textTransform:
                        'uppercase',
                      fontWeight:
                        700,
                    }}
                  >
                    Price Details
                  </div>
                  <h2
                    style={{
                      margin:
                        '4px 0 0',
                      color:
                        '#fff',
                      fontSize:
                        '1.35rem',
                    }}
                  >
                    {viewingPrice.coin}
                    /
                    {viewingPrice.currency ||
                      'USD'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setViewModalOpen(
                      false
                    )
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
              <div
                style={{
                  padding:
                    '18px',
                  borderRadius:
                    '10px',
                  background:
                    'rgba(77,119,240,0.08)',
                  border:
                    '1px solid rgba(77,119,240,0.18)',
                  marginBottom:
                    '14px',
                }}
              >
                <div
                  style={{
                    fontSize:
                      '11px',
                    color:
                      'var(--text-muted)',
                    marginBottom:
                      '5px',
                  }}
                >
                  Current Price
                </div>
                <div
                  style={{
                    fontSize:
                      '25px',
                    fontWeight:
                      700,
                    color:
                      '#fff',
                    fontFamily:
                      'var(--font-mono)',
                  }}
                >
                  {formatPrice(
                    viewingPrice.price,
                    viewingPrice.currency ||
                    'USD'
                  )}
                </div>
              </div>
              <div
                style={{
                  display:
                    'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    padding:
                      '12px',
                    borderRadius:
                      '8px',
                    background:
                      'var(--bg-surface)',
                    border:
                      '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        '10px',
                      color:
                        'var(--text-muted)',
                      marginBottom:
                        '5px',
                      textTransform:
                        'uppercase',
                    }}
                  >
                    24h Change
                  </div>
                  <div
                    style={{
                      fontSize:
                        '15px',
                      fontWeight:
                        700,
                      color:
                        getChangeValue(
                          viewingPrice
                        ) >= 0
                          ? '#34d399'
                          : '#f87171',
                    }}
                  >
                    {getChangeValue(
                      viewingPrice
                    ) > 0
                      ? '+'
                      : ''}
                    {formatNumber(
                      getChangeValue(
                        viewingPrice
                      ),
                      4
                    )}
                    %
                  </div>
                </div>
                <div
                  style={{
                    padding:
                      '12px',
                    borderRadius:
                      '8px',
                    background:
                      'var(--bg-surface)',
                    border:
                      '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        '10px',
                      color:
                        'var(--text-muted)',
                      marginBottom:
                        '5px',
                      textTransform:
                        'uppercase',
                    }}
                  >
                    24h Volume
                  </div>
                  <div
                    style={{
                      fontSize:
                        '15px',
                      fontWeight:
                        700,
                      color:
                        '#fff',
                    }}
                  >
                    {formatNumber(
                      viewingPrice.twenty_four_hour_volume
                    )}
                  </div>
                </div>
              </div>
              <div
                style={{
                  marginTop:
                    '14px',
                  padding:
                    '12px',
                  borderRadius:
                    '8px',
                  background:
                    'var(--bg-surface)',
                  border:
                    '1px solid var(--border)',
                  fontSize:
                    '11px',
                  color:
                    'var(--text-secondary)',
                }}
              >
                <div
                  style={{
                    display:
                      'flex',
                    justifyContent:
                      'space-between',
                    gap: '10px',
                  }}
                >
                  <span>
                    Updated
                  </span>
                  <strong
                    style={{
                      color:
                        '#fff',
                    }}
                  >
                    {formatDate(
                      viewingPrice.updated_at ||
                      viewingPrice.updatedAt
                    )}
                  </strong>
                </div>
              </div>
              <div
                style={{
                  display:
                    'flex',
                  justifyContent:
                    'flex-end',
                  marginTop:
                    '18px',
                  gap: '8px',
                }}
              >
                <button
                  onClick={() => {
                    setViewModalOpen(
                      false
                    );
                    openEditModal(
                      viewingPrice
                    );
                  }}
                  style={{
                    padding:
                      '8px 15px',
                    background:
                      '#4d77f0',
                    border: 'none',
                    borderRadius:
                      '6px',
                    color: '#fff',
                    fontWeight:
                      600,
                    cursor:
                      'pointer',
                    display:
                      'flex',
                    alignItems:
                      'center',
                    gap: '6px',
                  }}
                >
                  <Edit
                    size={13}
                  />
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}