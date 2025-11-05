import React from 'react';

export function Sparkline({ seed }: { seed: string }): JSX.Element {
  // Generate pseudo-random small path from seed
  let x = 0, y = 50; const pts: string[] = ['M0,50'];
  for (let i = 0; i < 30; i++) {
    x += 8;
    const n = (seed.charCodeAt((i % seed.length)) % 20) - 10;
    y = Math.max(10, Math.min(90, y + n * 0.3));
    pts.push(`L${x},${y}`);
  }
  return (
    <svg width={260} height={100} viewBox="0 0 260 100" style={{opacity:0.8}}>
      <path d={pts.join(' ')} stroke="var(--teal)" fill="none" strokeWidth={2} />
    </svg>
  );
}


