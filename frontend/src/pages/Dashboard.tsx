import React from 'react';
import { usePositionStream } from '../hooks/useSomniaStreams';
import { Position } from '../components/PositionList';

export function Dashboard() {
  const [positions, setPositions] = React.useState<Position[]>([]);
  const [stats, setStats] = React.useState({ total: 0, atRisk: 0, watch: 0, healthy: 0 });

  const onUpdate = React.useCallback((entry: Position) => {
    setPositions((prev) => [entry, ...prev].slice(0, 100));
  }, []);

  usePositionStream(onUpdate);

  React.useEffect(() => {
    const atRisk = positions.filter((p) => p.status === 'at_risk').length;
    const watch = positions.filter((p) => p.status === 'watch').length;
    const healthy = positions.filter((p) => p.status === 'healthy' || !p.status).length;
    setStats({ total: positions.length, atRisk, watch, healthy });
  }, [positions]);

  const totalCollateral = React.useMemo(() => {
    return positions.reduce((sum, p) => sum + Number(p.collateralValueUSD || p.collateralAmount || '0'), 0);
  }, [positions]);

  const totalDebt = React.useMemo(() => {
    return positions.reduce((sum, p) => sum + Number(p.debtValueUSD || p.debtAmount || '0'), 0);
  }, [positions]);

  const avgHealthFactor = React.useMemo(() => {
    if (positions.length === 0) return 0;
    const sum = positions.reduce((sum, p) => sum + Number(p.healthFactor) / 1e18, 0);
    return sum / positions.length;
  }, [positions]);

  const cardStyle: React.CSSProperties = {
    padding: 20,
    borderRadius: 12,
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ margin: 0 }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 14, color: 'var(--sub)', marginBottom: 8 }}>Total Positions</div>
          <div style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.total}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 14, color: 'var(--sub)', marginBottom: 8 }}>At Risk</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#b91c1c' }}>{stats.atRisk}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 14, color: 'var(--sub)', marginBottom: 8 }}>Watch</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#92400e' }}>{stats.watch}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 14, color: 'var(--sub)', marginBottom: 8 }}>Healthy</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#166534' }}>{stats.healthy}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginTop: 16 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 14, color: 'var(--sub)', marginBottom: 8 }}>Total Value Locked</div>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>${totalCollateral.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 14, color: 'var(--sub)', marginBottom: 8 }}>Total Debt</div>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>${totalDebt.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 14, color: 'var(--sub)', marginBottom: 8 }}>Avg Health Factor</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: avgHealthFactor < 1.0 ? '#b91c1c' : avgHealthFactor < 1.5 ? '#92400e' : '#166534' }}>
            {avgHealthFactor.toFixed(2)}
          </div>
        </div>
      </div>
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Recent Activity</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {positions.slice(0, 10).map((p) => (
            <div key={p.positionId} style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 500 }}>{p.positionId.slice(0, 10)}...</div>
                <div style={{ fontSize: 12, color: 'var(--sub)' }}>{p.owner.slice(0, 10)}...</div>
              </div>
              <div style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, background: p.status === 'at_risk' ? '#fee2e2' : p.status === 'watch' ? '#fef3c7' : '#dcfce7', color: p.status === 'at_risk' ? '#b91c1c' : p.status === 'watch' ? '#92400e' : '#166534' }}>
                {p.status || 'healthy'}
              </div>
            </div>
          ))}
          {positions.length === 0 && <div style={{ color: 'var(--sub)', textAlign: 'center', padding: 20 }}>No positions yet</div>}
        </div>
      </div>
    </div>
  );
}

