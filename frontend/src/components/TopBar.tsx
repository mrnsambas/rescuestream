import React from 'react';

export function TopBar({ onSearch }: { onSearch: (v: string) => void }): JSX.Element {
  return (
    <div className="topbar card">
      <div style={{fontWeight:700}}>Live Streams</div>
      <div style={{display:'flex',gap:10,alignItems:'center'}}>
        <input className="input" placeholder="Search Testnet" onChange={(e)=>onSearch(e.target.value)} />
        <button className="btn">Connect Wallet</button>
      </div>
    </div>
  );
}


