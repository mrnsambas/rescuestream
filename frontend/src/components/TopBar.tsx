import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';

export function TopBar({ onSearch }: { onSearch: (v: string) => void }): JSX.Element {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  return (
    <div className="topbar card">
      <div style={{fontWeight:700}}>Live Streams</div>
      <div style={{display:'flex',gap:10,alignItems:'center'}}>
        <input className="input" placeholder="Search Testnet" onChange={(e)=>onSearch(e.target.value)} />
        {isConnected && address && (
          <div style={{fontSize:12,color:'var(--sub)',padding:'4px 8px',background:'var(--bg)',borderRadius:6}}>
            {address.slice(0,6)}...{address.slice(-4)} • Chain: {chainId}
          </div>
        )}
        <ConnectButton />
      </div>
    </div>
  );
}


