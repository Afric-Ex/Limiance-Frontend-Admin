import React, { useState, useRef, useEffect, useMemo } from 'react';
import './Charts.css';

/**
 * Creates smooth SVG cubic bezier path through points
 */
function getSplinePath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function AreaSplineChart({
  data = [],
  series = [],
  height = 260,
  valueFormatter = (v) => `$${Number(v).toLocaleString()}`,
  yAxisFormatter,
  showLegend = true,
  legendToggleable = true,
}) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(600);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [activeSeries, setActiveSeries] = useState(() =>
    series.reduce((acc, s) => ({ ...acc, [s.key]: true }), {})
  );

  // Measure container width
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
  const { maxVal, minVal, yTicks } = useMemo(() => {
    let max = 0;
    let min = 0;
    const enabledSeries = series.filter((s) => activeSeries[s.key] !== false);

    data.forEach((d) => {
      enabledSeries.forEach((s) => {
        const v = Number(d[s.key]) || 0;
        if (v > max) max = v;
        if (v < min) min = v;
      });
    });

    if (max === 0) max = 100;
    // Add 10% headroom
    max = max * 1.1;

    // Generate 5 nice Y-axis ticks
    const ticks = [];
    const step = max / 4;
    for (let i = 0; i <= 4; i++) {
      ticks.push(step * i);
    }

    return { maxVal: max, minVal: min, yTicks: ticks };
  }, [data, series, activeSeries]);

  const getY = (val) => {
    if (maxVal === minVal) return margins.top + plotHeight / 2;
    const ratio = (val - minVal) / (maxVal - minVal);
    return margins.top + plotHeight - ratio * plotHeight;
  };

  const getX = (index) => {
    if (data.length <= 1) return margins.left + plotWidth / 2;
    return margins.left + (index / (data.length - 1)) * plotWidth;
  };

  // Mouse hover tracking
  const handleMouseMove = (e) => {
    if (!containerRef.current || data.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - margins.left;
    const clampedX = Math.max(0, Math.min(plotWidth, mouseX));
    const step = plotWidth / (data.length - 1);
    const closestIdx = Math.round(clampedX / step);
    setHoverIndex(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const toggleSeries = (key) => {
    if (!legendToggleable) return;
    setActiveSeries((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const hoveredData = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : null;
  const hoverX = hoverIndex !== null ? getX(hoverIndex) : 0;

  return (
    <div className="svg-chart-container" ref={containerRef}>
      <svg
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ overflow: 'visible', cursor: 'crosshair', display: 'block' }}
      >
        <defs>
          {series.map((s) => (
            <linearGradient key={`grad-${s.key}`} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: s.color }} stopOpacity={0.4} />
              <stop offset="90%" style={{ stopColor: s.color }} stopOpacity={0.02} />
              <stop offset="100%" style={{ stopColor: s.color }} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        {/* Horizontal grid lines and Y-axis labels */}
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
                style={{ stroke: 'var(--border-subtle)' }}
                strokeDasharray="3 3"
              />
              <text
                x={margins.left - 10}
                y={y + 4}
                style={{ fill: 'var(--text-muted)' }}
                fontSize="11"
                fontFamily="var(--font-mono, monospace)"
                textAnchor="end"
              >
                {formatted}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {data.map((d, i) => {
          // Show sparse labels if many points
          const showLabel =
            data.length <= 12 ||
            i === 0 ||
            i === data.length - 1 ||
            i % Math.ceil(data.length / 8) === 0;

          if (!showLabel) return null;
          const x = getX(i);
          return (
            <text
              key={`xlabel-${i}`}
              x={x}
              y={height - 10}
              style={{ fill: 'var(--text-tertiary)' }}
              fontSize="11"
              fontFamily="var(--font-mono, monospace)"
              textAnchor="middle"
            >
              {d.label}
            </text>
          );
        })}

        {/* Series area & curves */}
        {series.map((s) => {
          if (activeSeries[s.key] === false) return null;
          const points = data.map((d, i) => ({
            x: getX(i),
            y: getY(Number(d[s.key]) || 0),
          }));

          const linePath = getSplinePath(points);
          if (!linePath) return null;

          const areaPath = `${linePath} L ${points[points.length - 1].x} ${
            margins.top + plotHeight
          } L ${points[0].x} ${margins.top + plotHeight} Z`;

          return (
            <g key={`series-group-${s.key}`}>
              {/* Shaded Area */}
              <path d={areaPath} fill={`url(#grad-${s.key})`} />
              {/* Spline Line */}
              <path
                d={linePath}
                fill="none"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ stroke: s.color, filter: `drop-shadow(0 2px 8px color-mix(in srgb, ${s.color} 25%, transparent))` }}
              />
            </g>
          );
        })}

        {/* Hover Crosshair and Dot Markers */}
        {hoverIndex !== null && (
          <g>
            <line
              x1={hoverX}
              y1={margins.top}
              x2={hoverX}
              y2={margins.top + plotHeight}
              style={{ stroke: 'var(--text-faint)' }}
              strokeDasharray="4 4"
              strokeWidth={1}
            />

            {series.map((s) => {
              if (activeSeries[s.key] === false) return null;
              const val = Number(data[hoverIndex]?.[s.key]) || 0;
              const y = getY(val);

              return (
                <g key={`marker-${s.key}`}>
                  {/* Outer pulse */}
                  <circle cx={hoverX} cy={y} r={7} style={{ fill: s.color }} opacity={0.25} />
                  {/* Inner solid */}
                  <circle cx={hoverX} cy={y} r={4} style={{ fill: s.color, stroke: 'var(--bg-card)' }} strokeWidth={2} />
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {/* Floating Tooltip */}
      {hoveredData && hoverIndex !== null && (
        <div
          className="chart-floating-tooltip"
          style={{
            left: `${hoverX}px`,
            top: `${margins.top + 50}px`,
          }}
        >
          <div className="tooltip-date">{hoveredData.label}</div>
          {series.map((s) => {
            if (activeSeries[s.key] === false) return null;
            const val = Number(hoveredData[s.key]) || 0;
            return (
              <div key={`tooltip-${s.key}`} className="tooltip-row">
                <span className="tooltip-series-name">
                  <span className="chart-legend-dot" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="tooltip-val" style={{ color: s.color }}>
                  {valueFormatter(val)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Legend */}
      {showLegend && (
        <div className="chart-legend">
          {series.map((s) => {
            const isEnabled = activeSeries[s.key] !== false;
            return (
              <div
                key={`legend-${s.key}`}
                className={`chart-legend-item ${isEnabled ? '' : 'disabled'}`}
                onClick={() => toggleSeries(s.key)}
                title={legendToggleable ? 'Click to toggle visibility' : undefined}
              >
                <span className="chart-legend-dot" style={{ background: isEnabled ? s.color : 'var(--text-faint)' }} />
                <span>{s.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
