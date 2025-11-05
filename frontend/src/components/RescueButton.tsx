import React, { useState } from 'react';
import { getRescueHelper } from '../lib/eth';

export function RescueButton({
  positionId,
  owner,
  newCollateral,
  debt,
}: {
  positionId: string;
  owner: string;
  newCollateral: bigint;
  debt: bigint;
}) {
  const [loading, setLoading] = useState(false);
  const [tx, setTx] = useState(null);
  const [err, setErr] = useState(null);
  const address = (import.meta as any).env.VITE_RESCUE_HELPER_ADDRESS as string | undefined;

  const onClick = async () => {
    setErr(null);
    setTx(null);
    try {
      if (!address) throw new Error('RescueHelper address not configured');
      setLoading(true);
      // Ensure correct network (Somnia Testnet 50312)
      const ethereum = (window as any).ethereum;
      if (!ethereum) throw new Error('No wallet');
      const desiredChainId = 50312;
      const desiredChainHex = '0xC488';
      try {
        const net = await ethereum.request({ method: 'eth_chainId' });
        if (net && parseInt(net, 16) !== desiredChainId) {
          try {
            await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: desiredChainHex }] });
          } catch (switchErr: any) {
            if (switchErr?.code === 4902) {
              await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: desiredChainHex,
                  chainName: 'Somnia Testnet',
                  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
                  rpcUrls: [import.meta.env.VITE_SOMNIA_RPC_URL],
                }],
              });
              await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: desiredChainHex }] });
            } else {
              throw switchErr;
            }
          }
        }
      } catch (chainErr: any) {
        if (chainErr?.code === 4001) throw new Error('User rejected network request');
        throw chainErr;
      }

      const contract = await getRescueHelper(address);
      const hash = await contract.rescueTopUp(positionId, owner, newCollateral, debt).then((t: any) => t.hash);
      setTx(hash);
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (msg.toLowerCase().includes('user rejected')) setErr('User rejected the request');
      else setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button disabled={loading} onClick={onClick}>Rescue</button>
      {tx && <div>tx: {tx.slice(0, 10)}...</div>}
      {err && <div style={{ color: 'red' }}>{err}</div>}
    </div>
  );
}


