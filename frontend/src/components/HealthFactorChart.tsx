import React, { useState, useEffect } from 'react';

type HealthFactorChartProps = {
  positionId: string;
  currentHealthFactor: number;
};

export function HealthFactorChart({ positionId, currentHealthFactor }: HealthFactorChartProps) {
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    // Load history from localStorage or generate sample data
    const key = `healthFactor_history_${positionId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Add current value to history
    if (currentHealthFactor > 0) {
      const newHistory = [...history, currentHealthFactor].slice(-30); // Keep last 30 points
      setHistory(newHistory);
      localStorage.setItem(key, JSON.stringify(newHistory));
    }
  }, [positionId, currentHealthFactor]);

  if (history.length === 0) {
    return (
      <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sub)', fontSize: 12 }}>
        No history available
      </div>
    );
  }

  const max = Math.max(...history, 2.0);
  const min = Math.min(...history, 0);
  const range = max - min || 1;

  const width = 280;
  const height = 80;
  const padding = 8;

  const points = history.map((value, index) => {
    const x = padding + (index / (history.length - 1 || 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return { x, y, value };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 11, color: 'var(--sub)', marginBottom: 4 }}>Health Factor Over Time</div>
      <svg width={width} height={height} style={{ display: 'block' }}>
        {/* Grid lines */}
        {[0, 0.5, 1.0, 1.5, 2.0].map((mark) => {
          const y = height - padding - ((mark - min) / range) * (height - padding * 2);
          return (
            <g key={mark}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="var(--border)"
                strokeWidth={0.5}
                strokeDasharray="2,2"
              />
              <text x={0} y={y + 3} fontSize={9} fill="var(--sub)">
                {mark.toFixed(1)}
              </text>
            </g>
          );
        })}
        {/* Area under curve */}
        <path
          d={`${pathData} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`}
          fill="url(#healthGradient)"
          opacity={0.2}
        />
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="var(--teal)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 ? 3 : 2}
            fill={p.value < 1.0 ? '#ef4444' : p.value < 1.5 ? '#f59e0b' : '#10b981'}
            stroke="var(--bg)"
            strokeWidth={1}
          />
        ))}
        <defs>
          <linearGradient id="healthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--teal)" />
            <stop offset="100%" stopColor="var(--teal)" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

