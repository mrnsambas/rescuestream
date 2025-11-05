import React, { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRescueHelper } from '../hooks/useRescueHelper';
import { saveTransactionToHistory } from '../pages/History';

export function RescueModal({ open, onClose, positionId, owner, newCollateral, debt }:{open:boolean;onClose:()=>void;positionId:string;owner:string;newCollateral:bigint;debt:bigint;}): JSX.Element | null {
  const { isConnected } = useAccount();
  const address = ((import.meta as any).env?.VITE_RESCUE_HELPER_ADDRESS as string | undefined) || '';
  const { rescueTopUp, hash, isPending, isConfirming, isConfirmed, error, reset } = useRescueHelper(address);

  const relayerUrl = React.useMemo(() => {
    return (import.meta as any).env?.VITE_RELAYER_URL;
  }, []);

  useEffect(() => {
    if (hash) {
      // Save to transaction history (both local and backend)
      saveTransactionToHistory(hash, positionId, owner, 'pending');
      
      // Also save to backend
      fetch(`${relayerUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: hash,
          positionId,
          owner,
          status: 'pending',
        }),
      }).catch((e) => console.error('Failed to save transaction to backend:', e));
    }
  }, [hash, positionId, owner, relayerUrl]);

  useEffect(() => {
    if (isConfirmed && hash) {
      // Update transaction status to confirmed
      saveTransactionToHistory(hash, positionId, owner, 'confirmed');
      
      // Update backend
      if (relayerUrl) {
        fetch(`${relayerUrl}/transactions/${hash}/update`, {
          method: 'POST',
        }).catch((e) => console.error('Failed to update transaction status:', e));
      }
      
      // Auto-close after successful confirmation (optional delay)
      const timer = setTimeout(() => {
        onClose();
        reset();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmed, hash, positionId, owner, onClose, reset, relayerUrl]);

  if(!open) return null;

  const doConfirm = async () => {
    if (!isConnected) {
      return;
    }
    try {
      await rescueTopUp(positionId, owner, newCollateral, debt);
    } catch (e: any) {
      // Error is handled by the hook
      console.error('Rescue error:', e);
    }
  };

  const loading = isPending || isConfirming;
  const err = error?.message;

  return (
    <div style={{position:'fixed',inset:0,backdropFilter:'blur(8px)',background:'rgba(0,0,0,0.35)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50}}>
      <div className="card" style={{width:520,padding:20}}>
        <h3 style={{marginTop:0}}>Confirm Rescue Transaction</h3>
        <div style={{fontSize:13,color:'var(--sub)',marginBottom:10}}>Owner: {owner.slice(0,10)}… • Est. Gas shown in wallet</div>
        {!isConnected && (
          <div className="badge red" style={{marginBottom:10}}>Please connect your wallet first</div>
        )}
        {hash && <div className="badge green">tx: {hash.slice(0,10)}…{hash.slice(-8)}</div>}
        {isConfirmed && <div className="badge green">Transaction confirmed!</div>}
        {err && <div className="badge red">{err}</div>}
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:16}}>
          <button className="btn muted" onClick={() => { onClose(); reset(); }}>Reject</button>
          <button className="btn" disabled={loading || !positionId || !owner || !isConnected} onClick={doConfirm}>
            {loading ? (isConfirming ? 'Confirming…' : 'Preparing…') : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}


