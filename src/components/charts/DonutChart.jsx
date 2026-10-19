import React, { useState } from 'react';
import './Charts.css';

export default function DonutChart({
  data = [],
  size = 180,
  strokeWidth = 24,
  centerTitle,
  centerSubtitle,
  valueFormatter = (v) => Number(v).toLocaleString(),
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const total = data.reduce((acc, item) => acc + (Number(item.value) || 0), 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulatedPercent = 0;

  return (
    <div className="donut-layout">
      {/* SVG Donut Visual */}
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
        >
          {/* Base empty ring if total is 0 */}
          <circle
            cx={center}
            cy={center}
            r={radius}
          fill="none"
          style={{ stroke: 'var(--border-subtle)' }}
          strokeWidth={strokeWidth}
          />

          {total > 0 &&
            data.map((item, idx) => {
              const val = Number(item.value) || 0;
              const pct = val / total;
              const strokeDasharray = `${pct * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedPercent * circumference;
              accumulatedPercent += pct;

              const isHovered = hoveredIdx === idx;

              return (
                <circle
                  key={`slice-${idx}`}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    stroke: item.color,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    filter: isHovered ? `drop-shadow(0 0 10px color-mix(in srgb, ${item.color} 60%, transparent))` : 'none',
                  }}
                />
              );
            })}
        </svg>

        {/* Center Aggregate Readout */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'none',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '18px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--text-primary)',
              lineHeight: 1.1,
            }}
          >
            {hoveredIdx !== null ? valueFormatter(data[hoveredIdx].value) : centerTitle || valueFormatter(total)}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '2px',
            }}
          >
            {hoveredIdx !== null ? data[hoveredIdx].label : centerSubtitle || 'Total'}
          </div>
        </div>
      </div>

      {/* Legend & Percentages List */}
      <div className="donut-legend-list">
        {data.map((item, idx) => {
          const val = Number(item.value) || 0;
          const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={`legend-${idx}`}
              className={`donut-legend-row ${isHovered ? 'active' : ''}`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="donut-legend-label">
                <span className="chart-legend-dot" style={{ background: item.color }} />
                <span>{item.label}</span>
              </div>
              <div className="donut-legend-stats">
                <span className="donut-legend-val">{valueFormatter(val)}</span>
                <span className="donut-legend-pct">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
