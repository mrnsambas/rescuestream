import React from 'react';
import { useAccount, useBalance, useChainId, useDisconnect } from 'wagmi';
import { formatAddress } from '../lib/eth';

export function WalletStatus(): JSX.Element | null {
  const { address, isConnected, connector } = useAccount();
  const { data: balance } = useBalance({ address });
  const chainId = useChainId();
  const { disconnect } = useDisconnect();

  if (!isConnected || !address) return null;

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Wallet</h3>
        <button className="btn muted" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
          <span style={{ color: 'var(--sub)' }}>Address</span>
          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatAddress(address)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
          <span style={{ color: 'var(--sub)' }}>Network</span>
          <span>Chain ID: {chainId}</span>
        </div>
        {connector && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <span style={{ color: 'var(--sub)' }}>Wallet</span>
            <span>{connector.name}</span>
          </div>
        )}
        {balance && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <span style={{ color: 'var(--sub)' }}>Balance</span>
            <span>{parseFloat(balance.formatted).toFixed(4)} {balance.symbol}</span>
          </div>
        )}
      </div>
    </div>
  );
}

