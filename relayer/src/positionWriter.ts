import 'dotenv/config';
import { SDK, SchemaEncoder } from '@somnia-chain/streams';
import { createPublicClient, createWalletClient, http, toHex, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { needEnv } from './util/env';

const POSITION_SCHEMA = 'string positionId, address owner, string protocol, address collateralToken, address debtToken, uint256 collateralAmount, uint256 debtAmount, uint256 collateralValueUSD, uint256 debtValueUSD, uint256 healthFactor, uint256 liquidationPrice, uint256 liquidationThreshold, uint256 lastUpdatedAt, string status';

const rpcUrl = needEnv('SOMNIA_RPC_URL');
const privateKey = needEnv('PRIVATE_KEY') as `0x${string}`;

const publicClient = createPublicClient({ transport: http(rpcUrl) });
const walletClient = createWalletClient({ account: privateKeyToAccount(privateKey), transport: http(rpcUrl) });
const sdk = new SDK({ public: publicClient, wallet: walletClient });
const encoder = new SchemaEncoder(POSITION_SCHEMA);

let cachedSchemaId: Hex | null = null;

async function getSchemaId(): Promise<Hex> {
  if (cachedSchemaId) return cachedSchemaId;
  const id = await sdk.streams.computeSchemaId(POSITION_SCHEMA);
  if (!id) throw new Error('Failed to compute Position schema id');
  cachedSchemaId = id as Hex;
  return cachedSchemaId;
}

export type PositionPayload = {
  positionId: string;
  owner: string;
  protocol?: string;
  collateralToken?: string;
  debtToken?: string;
  collateralAmount: string;
  debtAmount: string;
  collateralValueUSD?: string;
  debtValueUSD?: string;
  healthFactor: string; // 1e18
  liquidationPrice?: string;
  liquidationThreshold?: string;
  lastUpdatedAt: number;
  status?: string;
};

export async function writePosition(entry: PositionPayload): Promise<Hex> {
  const schemaId = await getSchemaId();
  const data = encoder.encodeData([
    { name: 'positionId', value: entry.positionId, type: 'string' },
    { name: 'owner', value: entry.owner, type: 'address' },
    { name: 'protocol', value: entry.protocol ?? '', type: 'string' },
    { name: 'collateralToken', value: entry.collateralToken ?? '0x0000000000000000000000000000000000000000', type: 'address' },
    { name: 'debtToken', value: entry.debtToken ?? '0x0000000000000000000000000000000000000000', type: 'address' },
    { name: 'collateralAmount', value: entry.collateralAmount, type: 'uint256' },
    { name: 'debtAmount', value: entry.debtAmount, type: 'uint256' },
    { name: 'collateralValueUSD', value: entry.collateralValueUSD ?? '0', type: 'uint256' },
    { name: 'debtValueUSD', value: entry.debtValueUSD ?? '0', type: 'uint256' },
    { name: 'healthFactor', value: entry.healthFactor, type: 'uint256' },
    { name: 'liquidationPrice', value: entry.liquidationPrice ?? '0', type: 'uint256' },
    { name: 'liquidationThreshold', value: entry.liquidationThreshold ?? '0', type: 'uint256' },
    { name: 'lastUpdatedAt', value: String(entry.lastUpdatedAt), type: 'uint256' },
    { name: 'status', value: entry.status ?? '', type: 'string' },
  ]);

  const dataId = toHex(entry.positionId, { size: 32 });
  let delay = 250;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const tx = await sdk.streams.set([{ id: dataId, schemaId, data }]);
      if (!tx) throw new Error('Streams set() returned null');
      return tx as Hex;
    } catch (e) {
      if (attempt === 4) throw e;
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 2, 5000);
    }
  }
  throw new Error('unreachable');
}


