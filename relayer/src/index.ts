import 'dotenv/config';
import { ethers } from 'ethers';
import pino from 'pino';
import { computeHealth } from './computeHealth';
import { writePosition } from './positionWriter';
import express from 'express';
import { needEnv } from './util/env';

// Placeholder type until ABI wired
const LENDING_ABI = [
  'event PositionUpdated(bytes32 indexed positionId, address indexed owner, uint256 collateral, uint256 debt, uint256 timestamp)'
];

async function main() {
  const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
  const rpc = needEnv('SOMNIA_RPC_URL');
  const ws = process.env.SOMNIA_WS_URL as string | undefined;
  const provider = ws ? new ethers.WebSocketProvider(ws) : new ethers.JsonRpcProvider(rpc);
  const lendingAddr = needEnv('LENDING_ADDR');
  const lending = new ethers.Contract(lendingAddr, LENDING_ABI, provider);

  // metrics state
  let writeCount = 0;
  let failureCount = 0;
  let lastErrorTs: number | null = null;
  let startTs = Math.floor(Date.now() / 1000);
  let wsConnected = Boolean(ws);
  let lastEventBlock: number | null = null;

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const onEvent = async (positionId: string, owner: string, collateral: bigint, debt: bigint) => {
    const t0 = Date.now();
    const { healthFactor, status, collateralValueUSD, debtValueUSD } = computeHealth(collateral, debt);
    const payload = {
      positionId,
      owner,
      collateralAmount: collateral.toString(),
      debtAmount: debt.toString(),
      collateralValueUSD: (collateralValueUSD ?? 0n).toString(),
      debtValueUSD: (debtValueUSD ?? 0n).toString(),
      healthFactor: healthFactor.toString(),
      lastUpdatedAt: Math.floor(Date.now() / 1000),
      status,
    };
    try {
      await writePosition(payload);
      const latency = Date.now() - t0;
      logger.info({ positionId, owner, healthFactor: payload.healthFactor, status, latencyMs: latency }, 'wrote position');
    } catch (e) {
      logger.error({ err: (e as Error).message }, 'streams write failed');
    }
  };

  if (ws) {
    lending.on('PositionUpdated', async (positionId: string, owner: string, collateral: bigint, debt: bigint, _ts: bigint, ev: any) => {
      try {
        await onEvent(positionId, owner, collateral, debt);
        writeCount += 1;
        if (ev?.blockNumber) lastEventBlock = Number(ev.blockNumber);
      } catch (e) {
        failureCount += 1;
        lastErrorTs = Math.floor(Date.now() / 1000);
      }
    });
    logger.info('Relayer listening via WebSocket provider');
  } else {
    // HTTP fallback: poll logs
    const iface = new ethers.Interface(LENDING_ABI);
    const topic = iface.getEvent('PositionUpdated')!.topicHash;
    let fromBlock: number | bigint = (await provider.getBlockNumber()) - 2n;
    setInterval(async () => {
      try {
        const toBlock = await provider.getBlockNumber();
        const logs = await provider.getLogs({ address: lendingAddr, fromBlock, toBlock, topics: [topic] });
        for (const log of logs) {
          const decoded = iface.decodeEventLog('PositionUpdated', log.data, log.topics);
          try {
            await onEvent(decoded.positionId as string, decoded.owner as string, decoded.collateral as bigint, decoded.debt as bigint);
            writeCount += 1;
          } catch (e) {
            failureCount += 1;
            lastErrorTs = Math.floor(Date.now() / 1000);
          }
        }
        fromBlock = toBlock + 1n;
        lastEventBlock = Number(toBlock);
      } catch (e) {
        logger.warn({ err: (e as Error).message }, 'polling logs failed');
      }
    }, 3000);
    logger.info('Relayer polling HTTP provider for events');
  }

  logger.info('Relayer initialized');
  // health and metrics endpoints
  const app = express();
  app.get('/healthz', (_req, res) => res.status(200).send('ok'));
  app.get('/metrics', (_req, res) => res.json({ writeCount, failureCount, lastErrorTs, startTs, wsConnected, lastEventBlock }));
  const port = process.env.PORT || 8080;
  app.listen(port, () => logger.info({ port }, 'health server started'));
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


