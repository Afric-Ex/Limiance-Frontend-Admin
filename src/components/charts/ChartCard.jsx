import React from 'react';
import './Charts.css';

export default function ChartCard({
  title,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = 'var(--success-text)',
  timeframe,
  onTimeframeChange,
  timeframes = ['24H', '7D', '30D', '12M'],
  actionLabel,
  onAction,
  children,
  style,
}) {
  return (
    <div className="chart-card" style={style}>
      <div className="chart-header">
        <div className="chart-title-group">
          <div className="chart-title-row">
            {Icon && <Icon size={18} style={{ color: "var(--info-text)" }} />}
            <h3 className="chart-title">{title}</h3>
            {badge && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: `color-mix(in srgb, ${badgeColor} 12%, transparent)`,
                  color: badgeColor,
                  border: `1px solid color-mix(in srgb, ${badgeColor} 28%, transparent)`,
                  marginLeft: '4px',
                }}
              >
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="chart-subtitle">{subtitle}</p>}
        </div>

        <div className="chart-controls">
          {onTimeframeChange && timeframes && (
            <div className="chart-timeframe-group" style={{ display: 'flex', gap: '4px', padding: '3px', borderRadius: '8px' }}>
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  className={`chart-timeframe-btn ${timeframe === tf ? 'active' : ''}`}
                  onClick={() => onTimeframeChange(tf)}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}

          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-strong)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 6px',
              }}
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>

      <div style={{ width: '100%' }}>{children}</div>
    </div>
  );
}
