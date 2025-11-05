import { useEffect } from 'react';
import { SDK } from '@somnia-chain/streams';
import { createPublicClient, http } from 'viem';

type Entry = {
  positionId: string;
  owner: string;
  collateralAmount: string;
  debtAmount: string;
  collateralValueUSD?: string;
  debtValueUSD?: string;
  healthFactor: string;
  liquidationPrice?: string;
  liquidationThreshold?: string;
  lastUpdatedAt: number;
  status?: string;
};

export function usePositionStream(onUpdate: (e: Entry) => void, _filters?: { owner?: string }): void {
  useEffect(() => {
    const rpc = import.meta.env.VITE_SOMNIA_RPC_URL as string | undefined;
    const schemaId = import.meta.env.VITE_POSITION_SCHEMA_ID as `0x${string}` | undefined;
    const publisher = import.meta.env.VITE_POSITION_PUBLISHER as `0x${string}` | undefined;
    if (!rpc || !schemaId || !publisher) return;
    const publicClient = createPublicClient({ transport: http(rpc) });
    const sdk = new SDK({ public: publicClient });
    let stopped = false;
    const seen = new Set<string>();
    const tick = async () => {
      try {
        // @ts-ignore SDK returns decoded rows for public schemas
        const rows: any[][] = (await sdk.streams.getAllPublisherDataForSchema(schemaId, publisher)) || [];
        for (const r of rows) {
          const key = String(r[0]?.value ?? r[0]);
          if (seen.has(key)) continue;
          const entry: Entry = {
            positionId: String(r[0]?.value ?? r[0]),
            owner: String(r[1]?.value ?? r[1]),
            collateralAmount: String(r[5]?.value ?? r[5] ?? '0'),
            debtAmount: String(r[6]?.value ?? r[6] ?? '0'),
            collateralValueUSD: String(r[7]?.value ?? r[7] ?? '0'),
            debtValueUSD: String(r[8]?.value ?? r[8] ?? '0'),
            healthFactor: String(r[9]?.value ?? r[9] ?? '0'),
            liquidationPrice: String(r[10]?.value ?? r[10] ?? '0'),
            liquidationThreshold: String(r[11]?.value ?? r[11] ?? '1.0'),
            lastUpdatedAt: Number(r[12]?.value ?? r[12] ?? 0),
            status: String(r[13]?.value ?? r[13] ?? ''),
          };
          onUpdate(entry);
          seen.add(key);
        }
      } catch {}
      if (!stopped) setTimeout(tick, 3000);
    };
    tick();
    return () => { stopped = true; };
  }, [onUpdate]);
}


