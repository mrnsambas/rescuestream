import React, { useState, useEffect } from 'react';
import { usePositionStream } from '../hooks/useSomniaStreams';
import { Position } from './PositionList';
import { HealthFactorChart } from './HealthFactorChart';
import { MetricBar } from './MetricBar';

export function DetailsPanel({ positionId, owner, onRescue }: { positionId?: string; owner?: string; onRescue: () => void }): React.JSX.Element {
  const [position, setPosition] = useState<Position | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  const onUpdate = React.useCallback((entry: Position) => {
    if (entry.positionId === positionId) {
      setPosition(entry);
      setLastUpdated(Date.now());
    }
  }, [positionId]);

  usePositionStream(onUpdate);

  useEffect(() => {
    // Update last updated time every second
    const interval = setInterval(() => {
      setLastUpdated((prev) => prev);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!positionId) {
    return (
      <aside className="card" style={{ padding: 16 }}>
        <div style={{ color: 'var(--sub)', textAlign: 'center', padding: '40px 20px' }}>
          Select a position to view details
        </div>
      </aside>
    );
  }

  const hfValue = position ? Number(position.healthFactor) / 1e18 : 0;
  const isAtRisk = hfValue < 1.0;
  const isWatch = hfValue >= 1.0 && hfValue < 1.5;
  const timeAgo = Math.floor((Date.now() - lastUpdated) / 1000);

  const toPct = (hf: number) => {
    return Math.max(0, Math.min(100, Math.round((hf / 2) * 100)));
  };

  return (
    <aside className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Position Analytics</div>
          <div style={{ fontSize: 11, color: 'var(--sub)' }}>Last Updated: {timeAgo < 60 ? `${timeAgo}s ago` : `${Math.floor(timeAgo / 60)}m ago`}</div>
        </div>
      </div>

      {position && (
        <>
          <div>
            <div style={{ fontSize: 11, color: 'var(--sub)', marginBottom: 8 }}>Health Factor</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: isAtRisk ? '#ef4444' : isWatch ? '#f59e0b' : '#10b981' }}>
                {hfValue.toFixed(2)}
              </div>
              {isAtRisk && (
                <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 500 }}>(at risk)</span>
              )}
              {isWatch && (
                <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 500 }}>(watch)</span>
              )}
            </div>
            <MetricBar value={toPct(hfValue)} />
          </div>

          <HealthFactorChart positionId={positionId} currentHealthFactor={hfValue} />

          <div>
            <div style={{ fontSize: 11, color: 'var(--sub)', marginBottom: 4 }}>Liquidation Price:</div>
            <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
              {position.liquidationPrice && Number(position.liquidationPrice) > 0
                ? `$${(Number(position.liquidationPrice) / 1e18).toFixed(4)}`
                : isAtRisk 
                  ? 'Immediate risk' 
                  : 'Calculating...'}
            </div>
            {position.liquidationPrice && Number(position.liquidationPrice) > 0 && (
              <div style={{ fontSize: 10, color: 'var(--sub)', marginTop: 2 }}>
                Threshold: {position.liquidationThreshold || '1.0'}
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: 11, color: 'var(--sub)', marginBottom: 4 }}>Collateral Asset:</div>
            <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>ETH</div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn" style={{ flex: 1 }} onClick={onRescue}>
              Rescue Position
            </button>
          </div>
        </>
      )}

      {!position && (
        <div style={{ color: 'var(--sub)', fontSize: 12, textAlign: 'center', padding: 20 }}>
          Loading position data...
        </div>
      )}
    </aside>
  );
}


