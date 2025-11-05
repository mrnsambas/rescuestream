import React from 'react';
import { usePositionStream } from '../hooks/useSomniaStreams';
import { Position } from '../components/PositionList';

export function AlertsPage() {
  const [positions, setPositions] = React.useState<Position[]>([]);
  const [alerts, setAlerts] = React.useState<Position[]>([]);

  const onUpdate = React.useCallback((entry: Position) => {
    setPositions((prev) => [entry, ...prev].slice(0, 100));
  }, []);

  usePositionStream(onUpdate);

  React.useEffect(() => {
    const atRisk = positions.filter((p) => p.status === 'at_risk');
    setAlerts(atRisk);
  }, [positions]);

  const cardStyle: React.CSSProperties = {
    padding: 16,
    borderRadius: 12,
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    marginBottom: 12,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Alerts</h1>
        <div style={{ padding: '8px 16px', borderRadius: 8, background: alerts.length > 0 ? '#fee2e2' : '#dcfce7', color: alerts.length > 0 ? '#b91c1c' : '#166534', fontWeight: 500 }}>
          {alerts.length} Active Alert{alerts.length !== 1 ? 's' : ''}
        </div>
      </div>
      {alerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--sub)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <div>No active alerts. All positions are healthy.</div>
        </div>
      ) : (
        alerts.map((p) => (
          <div key={p.positionId} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Position {p.positionId.slice(0, 10)}...</div>
                <div style={{ fontSize: 12, color: 'var(--sub)' }}>Owner: {p.owner}</div>
              </div>
              <div style={{ padding: '4px 12px', borderRadius: 6, background: '#fee2e2', color: '#b91c1c', fontSize: 12, fontWeight: 500 }}>
                AT RISK
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 14 }}>
              <div>
                <div style={{ color: 'var(--sub)', marginBottom: 4 }}>Collateral</div>
                <div style={{ fontWeight: 500 }}>${Number(p.collateralValueUSD || p.collateralAmount || '0').toLocaleString()}</div>
              </div>
              <div>
                <div style={{ color: 'var(--sub)', marginBottom: 4 }}>Debt</div>
                <div style={{ fontWeight: 500 }}>${Number(p.debtValueUSD || p.debtAmount || '0').toLocaleString()}</div>
              </div>
              <div>
                <div style={{ color: 'var(--sub)', marginBottom: 4 }}>Health Factor</div>
                <div style={{ fontWeight: 500, color: '#b91c1c' }}>{(Number(p.healthFactor) / 1e18).toFixed(2)}</div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

