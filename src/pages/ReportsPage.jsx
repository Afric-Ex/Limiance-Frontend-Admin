import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Calendar,
  Layers,
  ArrowUpRight,
  PieChart,
} from 'lucide-react';
import { Shimmer, ShimmerTableRows } from '../components/Shimmer';

export default function ReportsPage() {
  const [periodDays, setPeriodDays] = useState(7); // 1, 7, 30
  const [volumeData, setVolumeData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [volRes, revRes] = await Promise.allSettled([
        api(`/api/reports/volume?days=${periodDays}`),
        api(`/api/reports/revenue?days=${periodDays}`),
      ]);

      if (volRes.status === 'fulfilled') {
        const d = volRes.value;
        setVolumeData(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
      }
      if (revRes.status === 'fulfilled') {
        const d = revRes.value;
        setRevenueData(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
      }
    } catch (err) {
      console.error('Failed to load financial reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [periodDays]);

  // Aggregate totals
  const totalVolumeUsd = volumeData.reduce((acc, row) => acc + (Number(row.volume_usd) || 0), 0);
  const totalTradeCount = volumeData.reduce((acc, row) => acc + (Number(row.trade_count) || Number(row.trades) || 0), 0);
  const totalRevenueUsd = revenueData.reduce((acc, row) => acc + (Number(row.revenue_usd) || 0), 0);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#fff' }}>
            Financial Volume & Revenue Reports
          </h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>
            Cross-market turnover analytics, fee revenue generation, and trade velocity reports.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Period Selector */}
          <div style={{ display: 'flex', background: '#13151c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '3px' }}>
            {[
              { label: '24 Hours', days: 1 },
              { label: '7 Days', days: 7 },
              { label: '30 Days', days: 30 },
            ].map((p) => (
              <button
                key={p.days}
                onClick={() => setPeriodDays(p.days)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: periodDays === p.days ? '#4d77f0' : 'transparent',
                  border: 'none',
                  color: periodDays === p.days ? '#fff' : 'rgba(255,255,255,0.6)',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchReports}
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

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div
          style={{
            background: '#13151c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Turnover Volume ({periodDays}d)</span>
            <div style={{ padding: '6px', background: 'rgba(99, 102, 241, 0.12)', borderRadius: '6px', color: '#818cf8' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
            {loading ? <Shimmer width="130px" height="26px" /> : `$${totalVolumeUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
          <div style={{ fontSize: '11px', color: '#34d399', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpRight size={12} /> Live aggregate from matched trades
          </div>
        </div>

        <div
          style={{
            background: '#13151c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Fee Revenue ({periodDays}d)</span>
            <div style={{ padding: '6px', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '6px', color: '#34d399' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
            {loading ? <Shimmer width="120px" height="26px" /> : `$${totalRevenueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '6px' }}>
            Spot & perpetual execution fees collected
          </div>
        </div>

        <div
          style={{
            background: '#13151c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Matched Trades ({periodDays}d)</span>
            <div style={{ padding: '6px', background: 'rgba(245, 158, 11, 0.12)', borderRadius: '6px', color: '#fbbf24' }}>
              <BarChart3 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
            {loading ? <Shimmer width="80px" height="26px" /> : totalTradeCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '6px' }}>
            Total order book fills executed
          </div>
        </div>
      </div>

      {/* Reports Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Table 1: Volume by Market */}
        <div
          style={{
            background: '#13151c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#181a22', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#fff' }}>Volume Breakdown by Market</h3>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Last {periodDays} Days</span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#14161f', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <th style={{ padding: '10px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Market</th>
                <th style={{ padding: '10px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Volume (USD)</th>
                <th style={{ padding: '10px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>Fills</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <ShimmerTableRows rows={5} cols={3} colWidths={['35%', '35%', '25%']} />
              ) : volumeData.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ padding: '40px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    No market volume recorded in this timeframe.
                  </td>
                </tr>
              ) : (
                volumeData.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 18px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                      {row.symbol || row.pair || 'UNKNOWN'}
                    </td>
                    <td style={{ padding: '12px 18px', color: '#818cf8', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      ${Number(row.volume_usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '12px 18px', color: 'rgba(255,255,255,0.7)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {(row.trade_count || row.trades || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table 2: Revenue Breakdown */}
        <div
          style={{
            background: '#13151c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#181a22', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#fff' }}>Revenue Breakdown by Asset</h3>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Last {periodDays} Days</span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#14161f', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <th style={{ padding: '10px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Fee Asset</th>
                <th style={{ padding: '10px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Amount</th>
                <th style={{ padding: '10px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>USD Valuation</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <ShimmerTableRows rows={5} cols={3} colWidths={['35%', '35%', '25%']} />
              ) : revenueData.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ padding: '40px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    No fee revenue recorded in this timeframe.
                  </td>
                </tr>
              ) : (
                revenueData.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 18px', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                      {row.fee_asset || 'UNKNOWN'}
                    </td>
                    <td style={{ padding: '12px 18px', color: '#fff', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {Number(row.total_fee || 0).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                    </td>
                    <td style={{ padding: '12px 18px', color: '#34d399', fontWeight: 600, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      ${Number(row.revenue_usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
