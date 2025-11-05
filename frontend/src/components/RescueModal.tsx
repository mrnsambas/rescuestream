import React, { useState } from 'react';
import { getRescueHelper } from '../lib/eth';

export function RescueModal({ open, onClose, positionId, owner, newCollateral, debt }:{open:boolean;onClose:()=>void;positionId:string;owner:string;newCollateral:bigint;debt:bigint;}): JSX.Element | null {
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState<string|undefined>();
  const [hash,setHash]=useState<string|undefined>();
  if(!open) return null;
  const address = (import.meta as any).env.VITE_RESCUE_HELPER_ADDRESS as string | undefined;
  const doConfirm = async ()=>{
    setErr(undefined);setHash(undefined);setLoading(true);
    try{
      if(!address) throw new Error('RescueHelper not configured');
      const c = await getRescueHelper(address);
      const tx = await c.rescueTopUp(positionId,owner,newCollateral,debt);
      setHash(tx.hash);
    }catch(e:any){setErr(e?.message||String(e));}
    finally{setLoading(false)}
  };
  return (
    <div style={{position:'fixed',inset:0,backdropFilter:'blur(8px)',background:'rgba(0,0,0,0.35)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50}}>
      <div className="card" style={{width:520,padding:20}}>
        <h3 style={{marginTop:0}}>Confirm Rescue Transaction</h3>
        <div style={{fontSize:13,color:'var(--sub)',marginBottom:10}}>Owner: {owner.slice(0,10)}… • Est. Gas shown in wallet</div>
        {hash && <div className="badge green">tx: {hash.slice(0,10)}…</div>}
        {err && <div className="badge red">{err}</div>}
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:16}}>
          <button className="btn muted" onClick={onClose}>Reject</button>
          <button className="btn" disabled={loading || !positionId || !owner} onClick={doConfirm}>{loading?'Confirming…':'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}


