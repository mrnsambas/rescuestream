import React from 'react';
import { RescueButton } from './RescueButton';

export type Position = {
  positionId: string;
  owner: string;
  collateralAmount: string;
  debtAmount: string;
  healthFactor: string;
  status?: string;
};

export function PositionList({ items }: { items: Position[] }) {
  const fmt = (n: string) => new Intl.NumberFormat().format(Number(n));
  const badge = (status?: string) => {
    const color = status === 'at_risk' ? '#fee2e2' : status === 'watch' ? '#fef3c7' : '#dcfce7';
    const text = status === 'at_risk' ? '#b91c1c' : status === 'watch' ? '#92400e' : '#166534';
    return { backgroundColor: color, color: text, padding: '2px 6px', borderRadius: 8 } as React.CSSProperties;
  };
  return (
    <div>
      {items.map((p) => (
        <div key={p.positionId} style={{ display: 'flex', gap: 12, padding: 8, borderBottom: '1px solid #eee', alignItems: 'center' }}>
          <div style={{ width: 220 }}>{p.positionId.slice(0, 8)}</div>
          <div style={{ width: 220 }}>{p.owner.slice(0, 10)}</div>
          <div>coll: {fmt(p.collateralAmount)}</div>
          <div>debt: {fmt(p.debtAmount)}</div>
          <div>hf: {p.healthFactor}</div>
          <div style={badge(p.status)}>{p.status}</div>
          {p.status === 'at_risk' && (
            <RescueButton
              positionId={p.positionId}
              owner={p.owner}
              newCollateral={BigInt(p.collateralAmount) + 100n}
              debt={BigInt(p.debtAmount)}
            />
          )}
        </div>
      ))}
    </div>
  );
}


