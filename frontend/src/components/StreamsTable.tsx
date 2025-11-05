import React from 'react';
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

export function StreamsTable({ rows, onSelect, onRescue }:{ rows: StreamRow[]; onSelect:(id:string)=>void; onRescue:(id:string)=>void }): JSX.Element {
  const toPct = (hf: string) => {
    const n = Number(hf)/1e18; // 1e18 scale
    return Math.max(0, Math.min(100, Math.round((n/2)*100))); // normalize up to 2.0
  };
  return (
    <div className="card" style={{padding:12}}>
      <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr 1fr 1fr 120px',gap:10,padding:'8px 6px',color:'var(--sub)',fontSize:12}}>
        <div>Position</div><div>Owner</div><div>Collateral USD</div><div>Debt USD</div><div>Health</div>
      </div>
      {rows.map((r)=>{
        const risk = r.status==='at_risk';
        const rowStyle: React.CSSProperties = risk ? {background:'rgba(255,107,107,0.09)',borderRadius:10} : {};
        return (
          <div key={r.positionId} style={{display:'grid',gridTemplateColumns:'1.2fr 1fr 1fr 1fr 120px',gap:10,alignItems:'center',padding:'10px 6px',cursor:'pointer',...rowStyle}} onClick={()=>onSelect(r.positionId)}>
            <div>{r.positionId.slice(0,10)}…</div>
            <div>{r.owner.slice(0,10)}…</div>
            <div>${Number(r.collateralUsd||'0').toLocaleString()}</div>
            <div>${Number(r.debtUsd||'0').toLocaleString()}</div>
            <div>
              <MetricBar value={toPct(r.healthFactor)} />
              <div style={{fontSize:12,color:'var(--sub)'}}>{(Number(r.healthFactor)/1e18).toFixed(2)}</div>
            </div>
            <div style={{justifySelf:'end'}}>
              <button className={risk? 'btn' : 'btn muted'} onClick={(e)=>{e.stopPropagation(); onRescue(r.positionId);}}>
                Rescue
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}


