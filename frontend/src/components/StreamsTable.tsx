import React, { useState } from 'react';
import { FixedSizeList } from 'react-window';
import { MetricBar } from './MetricBar';

export type StreamRow = {
  positionId: string;
  owner: string;
  collateralUsd?: string;
  debtUsd?: string;
  healthFactor: string;
  tokens?: string[];
  status?: string;
};

type SortField = 'positionId' | 'owner' | 'collateralUsd' | 'debtUsd' | 'healthFactor' | 'status';
type SortDirection = 'asc' | 'desc';

export function StreamsTable({ rows, onSelect, onRescue }: { rows: StreamRow[]; onSelect: (id: string) => void; onRescue: (id: string) => void }) {
  const [sortField, setSortField] = React.useState('healthFactor' as SortField);
  const [sortDirection, setSortDirection] = React.useState('asc' as SortDirection);
  const [statusFilter, setStatusFilter] = React.useState('all');

  const toPct = (hf: string) => {
    const n = Number(hf)/1e18; // 1e18 scale
    return Math.max(0, Math.min(100, Math.round((n/2)*100))); // normalize up to 2.0
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredRows = React.useMemo(() => {
    let filtered = rows;
    if (statusFilter !== 'all') {
      filtered = rows.filter(r => r.status === statusFilter);
    }

    return [...filtered].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      switch (sortField) {
        case 'collateralUsd':
          aVal = Number(a.collateralUsd || '0');
          bVal = Number(b.collateralUsd || '0');
          break;
        case 'debtUsd':
          aVal = Number(a.debtUsd || '0');
          bVal = Number(b.debtUsd || '0');
          break;
        case 'healthFactor':
          aVal = Number(a.healthFactor) / 1e18;
          bVal = Number(b.healthFactor) / 1e18;
          break;
        case 'positionId':
          aVal = a.positionId;
          bVal = b.positionId;
          break;
        case 'owner':
          aVal = a.owner;
          bVal = b.owner;
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        default:
          aVal = '';
          bVal = '';
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [rows, sortField, sortDirection, statusFilter]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span style={{opacity:0.3}}>↕</span>;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="card" style={{padding:12}}>
      <div style={{display:'flex',gap:12,marginBottom:12,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{fontSize:12,color:'var(--sub)'}}>Filter:</div>
        {['all','healthy','watch','at_risk'].map(s => (
          <button
            key={s}
            className={statusFilter === s ? 'btn' : 'btn muted'}
            style={{fontSize:12,padding:'4px 12px'}}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? 'All' : s === 'at_risk' ? 'At Risk' : s}
          </button>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1.2fr 1.2fr 1.2fr 1.2fr 1fr auto',gap:10,padding:'8px 6px',color:'var(--sub)',fontSize:12,fontWeight:500}}>
        <div style={{cursor:'pointer',display:'flex',gap:4,alignItems:'center'}} onClick={() => handleSort('owner')}>
          Owner <SortIcon field="owner" />
        </div>
        <div style={{cursor:'pointer',display:'flex',gap:4,alignItems:'center'}} onClick={() => handleSort('collateralUsd')}>
          Collateral USD <SortIcon field="collateralUsd" />
        </div>
        <div style={{cursor:'pointer',display:'flex',gap:4,alignItems:'center'}} onClick={() => handleSort('debtUsd')}>
          Debt USD <SortIcon field="debtUsd" />
        </div>
        <div style={{cursor:'pointer',display:'flex',gap:4,alignItems:'center'}} onClick={() => handleSort('healthFactor')}>
          Health Factor <SortIcon field="healthFactor" />
        </div>
        <div>Action</div>
      </div>
      {sortedAndFilteredRows.length > 50 ? (
        // Use virtualization for large lists
        <div style={{ height: 600 }}>
          <FixedSizeList
            height={600}
            itemCount={sortedAndFilteredRows.length}
            itemSize={60}
            width="100%"
          >
            {({ index, style }) => {
              const r = sortedAndFilteredRows[index];
              const risk = r.status === 'at_risk';
              const hfValue = Number(r.healthFactor) / 1e18;
              const rowStyle: React.CSSProperties = risk ? { background: 'rgba(255,107,107,0.09)', borderRadius: 10 } : {};
              return (
                <div key={r.positionId} style={{ ...style, display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1.2fr 1.2fr 1fr auto', gap: 10, alignItems: 'center', padding: '10px 6px', cursor: 'pointer', ...rowStyle }} onClick={() => onSelect(r.positionId)}>
                  <div style={{ fontFamily: 'monospace', fontSize: 13 }}>{r.owner.slice(0, 6)}...{r.owner.slice(-4)}</div>
                  <div>${Number(r.collateralUsd || '0').toLocaleString()}</div>
                  <div>${Number(r.debtUsd || '0').toLocaleString()}</div>
                  <div>
                    {hfValue > 0 ? (
                      <>
                        <div style={{ fontSize: 12, color: hfValue < 1.0 ? '#10b981' : hfValue < 1.5 ? '#f59e0b' : 'var(--sub)' }}>
                          {hfValue.toFixed(2)} {risk && <span style={{ color: '#10b981', fontWeight: 500 }}>(at risk)</span>}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--sub)' }}>—</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, justifySelf: 'end' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <button className="btn muted" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => onSelect(r.positionId)}>
                      Watch
                    </button>
                    <button className={risk ? 'btn' : 'btn muted'} style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => onRescue(r.positionId)}>
                      Liquidate
                    </button>
                  </div>
                </div>
              );
            }}
          </FixedSizeList>
        </div>
      ) : (
        // Render normally for small lists
        sortedAndFilteredRows.map((r: StreamRow) => {
          const risk = r.status === 'at_risk';
          const hfValue = Number(r.healthFactor) / 1e18;
          const rowStyle: React.CSSProperties = risk ? { background: 'rgba(255,107,107,0.09)', borderRadius: 10 } : {};
          return (
            <div key={r.positionId} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1.2fr 1.2fr 1fr auto', gap: 10, alignItems: 'center', padding: '10px 6px', cursor: 'pointer', ...rowStyle }} onClick={() => onSelect(r.positionId)}>
              <div style={{ fontFamily: 'monospace', fontSize: 13 }}>{r.owner.slice(0, 6)}...{r.owner.slice(-4)}</div>
              <div>${Number(r.collateralUsd || '0').toLocaleString()}</div>
              <div>${Number(r.debtUsd || '0').toLocaleString()}</div>
              <div>
                {hfValue > 0 ? (
                  <>
                    <div style={{ fontSize: 12, color: hfValue < 1.0 ? '#10b981' : hfValue < 1.5 ? '#f59e0b' : 'var(--sub)' }}>
                      {hfValue.toFixed(2)} {risk && <span style={{ color: '#10b981', fontWeight: 500 }}>(at risk)</span>}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--sub)' }}>—</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, justifySelf: 'end' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <button className="btn muted" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => onSelect(r.positionId)}>
                  Watch
                </button>
                <button className={risk ? 'btn' : 'btn muted'} style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => onRescue(r.positionId)}>
                  Liquidate
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}


