import React, { useState, useRef, useEffect, useMemo } from 'react';
import './Charts.css';

export default function GroupedBarChart({
  data = [],
  series = [
    { key: 'deposit', name: 'Deposits', color: '#10b981' },
    { key: 'withdrawal', name: 'Withdrawals', color: '#f59e0b' },
  ],
  height = 260,
  valueFormatter = (v) => `$${Number(v).toLocaleString()}`,
  yAxisFormatter,
  showLegend = true,
}) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(600);
  const [hoverIndex, setHoverIndex] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setWidth(Math.max(300, entries[0].contentRect.width));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const margins = { top: 20, right: 24, bottom: 32, left: 60 };
  const plotWidth = Math.max(10, width - margins.left - margins.right);
  const plotHeight = Math.max(10, height - margins.top - margins.bottom);

  // Compute scale boundaries
  const { maxVal, yTicks } = useMemo(() => {
    let max = 0;
    data.forEach((d) => {
      series.forEach((s) => {
        const v = Number(d[s.key]) || 0;
        if (v > max) max = v;
      });
    });

    if (max === 0) max = 100;
    max = max * 1.15; // 15% headroom

    const ticks = [];
    const step = max / 4;
    for (let i = 0; i <= 4; i++) {
      ticks.push(step * i);
    }
    return { maxVal: max, yTicks: ticks };
  }, [data, series]);

  const getY = (val) => {
    const ratio = Math.max(0, val) / maxVal;
    return margins.top + plotHeight - ratio * plotHeight;
  };

  const groupWidth = data.length > 0 ? plotWidth / data.length : 0;
  const barWidth = Math.min(22, Math.max(4, (groupWidth * 0.7) / series.length));
  const groupPadding = (groupWidth - barWidth * series.length) / 2;

  const hoveredData = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : null;

  return (
    <div className="svg-chart-container" ref={containerRef}>
      <svg
        width={width}
        height={height}
        onMouseLeave={() => setHoverIndex(null)}
        style={{ overflow: 'visible', display: 'block' }}
      >
        {/* Horizontal grid lines & Y ticks */}
        {yTicks.map((tickVal, i) => {
          const y = getY(tickVal);
          const formatted = yAxisFormatter
            ? yAxisFormatter(tickVal)
            : tickVal >= 1000000
            ? `$${(tickVal / 1000000).toFixed(1)}M`
            : tickVal >= 1000
            ? `$${(tickVal / 1000).toFixed(0)}k`
            : `$${Math.round(tickVal)}`;

          return (
            <g key={`ytick-${i}`}>
              <line
                x1={margins.left}
                y1={y}
                x2={width - margins.right}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3 3"
              />
              <text
                x={margins.left - 10}
                y={y + 4}
                fill="rgba(255,255,255,0.4)"
                fontSize="11"
                fontFamily="var(--font-mono, monospace)"
                textAnchor="end"
              >
                {formatted}
              </text>
            </g>
          );
        })}

        {/* Groups of Bars */}
        {data.map((d, groupIdx) => {
          const groupX = margins.left + groupIdx * groupWidth;
          const isHovered = hoverIndex === groupIdx;

          return (
            <g
              key={`group-${groupIdx}`}
              onMouseEnter={() => setHoverIndex(groupIdx)}
              style={{ cursor: 'pointer' }}
            >
              {/* Background hover column tint */}
              {isHovered && (
                <rect
                  x={groupX}
                  y={margins.top}
                  width={groupWidth}
                  height={plotHeight}
                  fill="rgba(255, 255, 255, 0.03)"
                  rx={4}
                />
              )}

              {/* Each series bar */}
              {series.map((s, sIdx) => {
                const val = Number(d[s.key]) || 0;
                const barY = getY(val);
                const barH = margins.top + plotHeight - barY;
                const barX = groupX + groupPadding + sIdx * barWidth;

                return (
                  <rect
                    key={`bar-${s.key}-${groupIdx}`}
                    x={barX}
                    y={barY}
                    width={barWidth - 2}
                    height={Math.max(1, barH)}
                    fill={s.color}
                    opacity={isHovered ? 1 : 0.82}
                    rx={3}
                    style={{
                      transition: 'opacity 0.15s ease, y 0.2s ease, height 0.2s ease',
                      filter: isHovered ? `drop-shadow(0 0 8px ${s.color}80)` : 'none',
                    }}
                  />
                );
              })}

              {/* X-axis label */}
              {(data.length <= 12 || groupIdx % Math.ceil(data.length / 8) === 0) && (
                <text
                  x={groupX + groupWidth / 2}
                  y={height - 10}
                  fill={isHovered ? '#ffffff' : 'rgba(255,255,255,0.45)'}
                  fontSize="11"
                  fontWeight={isHovered ? 600 : 400}
                  fontFamily="var(--font-mono, monospace)"
                  textAnchor="middle"
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoveredData && hoverIndex !== null && (
        <div
          className="chart-floating-tooltip"
          style={{
            left: `${margins.left + hoverIndex * groupWidth + groupWidth / 2}px`,
            top: `${margins.top + 40}px`,
          }}
        >
          <div className="tooltip-date">{hoveredData.label}</div>
          {series.map((s) => {
            const val = Number(hoveredData[s.key]) || 0;
            return (
              <div key={`tip-${s.key}`} className="tooltip-row">
                <span className="tooltip-series-name">
                  <span className="chart-legend-bar-sample" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="tooltip-val" style={{ color: s.color }}>
                  {valueFormatter(val)}
                </span>
              </div>
            );
          })}

          {/* If deposit and withdrawal are both present, calculate net flow */}
          {hoveredData.deposit !== undefined && hoveredData.withdrawal !== undefined && (
            <div
              className="tooltip-row"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.08)',
                paddingTop: '4px',
                marginTop: '4px',
              }}
            >
              <span className="tooltip-series-name" style={{ color: '#94a3b8' }}>
                Net Treasury
              </span>
              {(() => {
                const net = Number(hoveredData.deposit) - Number(hoveredData.withdrawal);
                const isPos = net >= 0;
                return (
                  <span
                    className="tooltip-val"
                    style={{ color: isPos ? '#34d399' : '#f87171' }}
                  >
                    {isPos ? '+' : ''}
                    {valueFormatter(net)}
                  </span>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="chart-legend">
          {series.map((s) => (
            <div key={`legend-${s.key}`} className="chart-legend-item">
              <span className="chart-legend-bar-sample" style={{ background: s.color }} />
              <span>{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
