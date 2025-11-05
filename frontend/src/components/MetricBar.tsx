import React from 'react';

export function MetricBar({ value }: { value: number }): JSX.Element {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="metric-bar"><div style={{ width: `${pct}%` }} /></div>
  );
}


