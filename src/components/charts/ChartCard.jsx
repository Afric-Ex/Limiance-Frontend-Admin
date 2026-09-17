import React from 'react';
import './Charts.css';

export default function ChartCard({
  title,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = '#34d399',
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
            {Icon && <Icon size={18} color="#818cf8" />}
            <h3 className="chart-title">{title}</h3>
            {badge && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: `${badgeColor}18`,
                  color: badgeColor,
                  border: `1px solid ${badgeColor}35`,
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
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.25)', padding: '3px', borderRadius: '8px' }}>
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
                color: '#4d77f0',
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
