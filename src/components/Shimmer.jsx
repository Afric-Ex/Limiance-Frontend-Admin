import React from 'react';
import './Shimmer.css';

/**
 * Basic rectangular shimmer skeleton element.
 */
export function Shimmer({ width = '100%', height = '14px', borderRadius, style = {}, className = '' }) {
  return (
    <div
      className={`limiance-shimmer-base ${className}`}
      style={{
        width,
        height,
        borderRadius: borderRadius || (height === '100%' ? '8px' : undefined),
        ...style,
      }}
    />
  );
}

/**
 * High-fidelity Table Skeleton Rows.
 * Generates skeleton rows mimicking data cells for table loaders.
 */
export function ShimmerTableRows({
  rows = 5,
  cols = 5,
  colWidths = [],
}) {
  const rowArray = Array.from({ length: rows });
  const colArray = Array.from({ length: cols });

  return (
    <>
      {rowArray.map((_, rIdx) => (
        <tr key={`shimmer-row-${rIdx}`} className="limiance-shimmer-row">
          {colArray.map((_, cIdx) => {
            const width = colWidths[cIdx] || (cIdx === 0 ? '60%' : cIdx === cols - 1 ? '40%' : '75%');
            return (
              <td key={`shimmer-col-${cIdx}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shimmer width={width} height="13px" />
                </div>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

/**
 * Metric / KPI Card Skeleton for dashboards and overviews.
 */
export function ShimmerMetricCard({ height = '110px', style = {} }) {
  return (
    <div className="limiance-shimmer-card" style={{ minHeight: height, ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Shimmer width="45%" height="11px" />
        <Shimmer width="20px" height="20px" borderRadius="50%" />
      </div>
      <Shimmer width="70%" height="26px" style={{ margin: '4px 0' }} />
      <Shimmer width="55%" height="10px" />
    </div>
  );
}

/**
 * Full Page or Card Detail Skeleton for audit / detail modals / profile views.
 */
export function ShimmerDetailCard({ title = 'Loading Details...' }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '28px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '50%' }}>
          <Shimmer width="60%" height="22px" />
          <Shimmer width="85%" height="13px" />
        </div>
        <Shimmer width="120px" height="34px" borderRadius="8px" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <Shimmer width="40%" height="12px" />
            <Shimmer width="80%" height="18px" />
            <Shimmer width="60%" height="12px" />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Shimmer width="100%" height="48px" borderRadius="8px" />
        <Shimmer width="100%" height="48px" borderRadius="8px" />
        <Shimmer width="100%" height="48px" borderRadius="8px" />
      </div>
    </div>
  );
}

/**
 * Centered Loading Spinner with customizable label and size.
 */
export function PageSpinner({ message = 'Loading...', size = 32, style = {} }) {
  return (
    <div className="limiance-loader-center" style={style}>
      <div
        className="limiance-spinner"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderWidth: size > 24 ? '3px' : '2px',
        }}
      />
      {message && <span style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>{message}</span>}
    </div>
  );
}
