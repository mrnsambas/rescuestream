import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export function Sidebar(): JSX.Element {
  const [latency, setLatency] = useState<string>('—');
  const [lastTs, setLastTs] = useState<string>('—');
  const location = useLocation();

  useEffect(() => {
    let id: any;
    const tick = async () => {
      try {
        const relayerUrl = (import.meta as any).env?.VITE_RELAYER_URL;
        if (!relayerUrl) {
          setLatency('—');
          setLastTs('—');
          id = setTimeout(tick, 5000);
          return;
        }
        const t0 = performance.now();
        const res = await fetch(`${relayerUrl}/metrics`).catch(() => null);
        const t1 = performance.now();
        if (res) {
          setLatency(`${Math.max(1, Math.round(t1 - t0))}ms`);
          const j = await res.json();
          setLastTs(j.lastEventBlock ? `#${j.lastEventBlock}` : '—');
        } else {
          setLatency('—');
          setLastTs('—');
        }
      } catch {}
      id = setTimeout(tick, 5000);
    };
    tick();
    return () => clearTimeout(id);
  }, []);

  const item = (label: string, to: string) => {
    const isActive = location.pathname === to || (to === '/' && location.pathname === '/dashboard');
    return (
      <Link to={to} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{
          display:'flex',alignItems:'center',gap:10,padding:'10px 12px',
          borderRadius:10,background: isActive ? 'rgba(0,212,199,0.12)' : 'transparent',
          color: isActive ? 'var(--teal)' : 'var(--text)', cursor: 'pointer'
        }}>{label}</div>
      </Link>
    );
  };

  return (
    <aside className="sidebar">
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
        <div style={{width:28,height:28,borderRadius:8,background:'linear-gradient(180deg,#00D4C7,#00b8ae)'}} />
        <strong>RescueStream</strong>
      </div>
      <div className="card" style={{padding:8}}>
        {item('Dashboard', '/dashboard')}
        {item('Streams', '/streams')}
        {item('Alerts', '/alerts')}
        {item('Bot', '/bot')}
        {item('History', '/history')}
        {item('Settings', '/settings')}
      </div>
      <div style={{flex:1}} />
      <div className="card" style={{padding:12,display:'flex',flexDirection:'column',gap:6}}>
        <div style={{fontSize:12,color:'var(--sub)'}}>Live updates / s</div>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <span>Latency</span><span>{latency}</span>
        </div>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <span>Last Block</span><span>{lastTs}</span>
        </div>
      </div>
    </aside>
  );
}


