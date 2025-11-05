import React from 'react';
import { Sparkline } from './Sparkline';

export function DetailsPanel({ positionId, owner, onRescue }:{ positionId?:string; owner?:string; onRescue:()=>void }): JSX.Element {
  if(!positionId) return (
    <aside className="card" style={{padding:14}}>
      <div style={{color:'var(--sub)'}}>Select a position to view details</div>
    </aside>
  );
  return (
    <aside className="card" style={{padding:14,display:'flex',flexDirection:'column',gap:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontWeight:700}}>{positionId.slice(0,10)}…</div>
          <div style={{fontSize:12,color:'var(--sub)'}}>Owner {owner?.slice(0,10)}…</div>
        </div>
        <button className="btn" onClick={onRescue}>Rescue</button>
      </div>
      <Sparkline seed={positionId} />
    </aside>
  );
}


