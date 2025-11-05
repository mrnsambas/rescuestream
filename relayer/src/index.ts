import 'dotenv/config';
import { ethers } from 'ethers';
import pino from 'pino';
import { computeHealth, computeHealthSync } from './computeHealth';
import { writePosition } from './positionWriter';
import express from 'express';
import { needEnv } from './util/env';
import { RescueBot } from './bot';
import { loadBotConfig } from './botConfig';

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

  // Initialize bot if enabled
  const botConfig = loadBotConfig();
  let bot: RescueBot | null = null;
  if (botConfig.enabled && botConfig.privateKey) {
    bot = new RescueBot(botConfig, provider, logger);
    const rescueHelperAddr = process.env.RESCUE_HELPER_ADDR;
    if (rescueHelperAddr) {
      try {
        await bot.initialize(rescueHelperAddr);
        logger.info('Rescue bot initialized and ready');
      } catch (e) {
        logger.error({ err: (e as Error).message }, 'Failed to initialize bot');
        bot = null;
      }
    } else {
      logger.warn('Bot enabled but RESCUE_HELPER_ADDR not set, bot disabled');
      bot = null;
    }
  }

  // metrics state
  let writeCount = 0;
  let failureCount = 0;
  let lastErrorTs: number | null = null;
  let startTs = Math.floor(Date.now() / 1000);
  let wsConnected = Boolean(ws);
  let lastEventBlock: number | null = null;

  // Retry configuration for failed operations
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 1000;

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const retryOperation = async <T,>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = MAX_RETRIES
  ): Promise<T | null> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (e) {
        logger.warn({ 
          err: (e as Error).message, 
          operation: operationName, 
          attempt, 
          maxRetries 
        }, `Operation failed, retrying...`);
        
        if (attempt < maxRetries) {
          await sleep(RETRY_DELAY_MS * attempt); // Exponential backoff
        } else {
          logger.error({ err: (e as Error).message, operation: operationName }, 'Operation failed after all retries');
          return null;
        }
      }
    }
    return null;
  };

  // Circuit breaker for price oracle failures
  let priceOracleFailures = 0;
  const MAX_PRICE_ORACLE_FAILURES = 5;
  let priceOracleCircuitOpen = false;
  const CIRCUIT_RESET_TIME_MS = 5 * 60 * 1000; // 5 minutes

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const onEvent = async (positionId: string, owner: string, collateral: bigint, debt: bigint) => {
    const t0 = Date.now();
    
    // Check circuit breaker for price oracle
    if (priceOracleCircuitOpen) {
      logger.warn('Price oracle circuit breaker is open, using sync fallback');
      const { healthFactor, status, collateralValueUSD, debtValueUSD, liquidationPrice, liquidationThreshold } = computeHealthSync(collateral, debt);
      const payload = {
        positionId,
        owner,
        collateralAmount: collateral.toString(),
        debtAmount: debt.toString(),
        collateralValueUSD: (collateralValueUSD ?? 0n).toString(),
        debtValueUSD: (debtValueUSD ?? 0n).toString(),
        healthFactor: healthFactor.toString(),
        liquidationPrice: liquidationPrice?.toString() ?? '0',
        liquidationThreshold: liquidationThreshold?.toString() ?? '1.0',
        lastUpdatedAt: Math.floor(Date.now() / 1000),
        status,
      };
      
      const result = await retryOperation(
        () => writePosition(payload),
        'writePosition'
      );
      
      if (result !== null) {
        const latency = Date.now() - t0;
        logger.info({ positionId, owner, healthFactor: payload.healthFactor, status, latencyMs: latency, source: 'sync' }, 'wrote position');
      } else {
        failureCount += 1;
        lastErrorTs = Math.floor(Date.now() / 1000);
      }
      return;
    }

    // Use async computeHealth with price oracle (fallback to sync if needed)
    let healthResult;
    try {
      healthResult = await computeHealth(collateral, debt);
      priceOracleFailures = 0; // Reset failure count on success
    } catch (e) {
      priceOracleFailures++;
      logger.warn({ err: (e as Error).message, failures: priceOracleFailures }, 'Async health computation failed');
      
      if (priceOracleFailures >= MAX_PRICE_ORACLE_FAILURES) {
        priceOracleCircuitOpen = true;
        logger.error('Price oracle circuit breaker opened due to repeated failures');
        // Reset circuit breaker after timeout
        setTimeout(() => {
          priceOracleCircuitOpen = false;
          priceOracleFailures = 0;
          logger.info('Price oracle circuit breaker reset');
        }, CIRCUIT_RESET_TIME_MS);
      }
      
      // Fallback to sync version
      logger.warn('Using sync fallback for health computation');
      healthResult = computeHealthSync(collateral, debt);
    }

    const { healthFactor, status, collateralValueUSD, debtValueUSD, liquidationPrice, liquidationThreshold } = healthResult;
    const payload = {
      positionId,
      owner,
      collateralAmount: collateral.toString(),
      debtAmount: debt.toString(),
      collateralValueUSD: (collateralValueUSD ?? 0n).toString(),
      debtValueUSD: (debtValueUSD ?? 0n).toString(),
      healthFactor: healthFactor.toString(),
      liquidationPrice: liquidationPrice?.toString() ?? '0',
      liquidationThreshold: liquidationThreshold?.toString() ?? '1.0',
      lastUpdatedAt: Math.floor(Date.now() / 1000),
      status,
    };
    
    const result = await retryOperation(
      () => writePosition(payload),
      'writePosition'
    );

    if (result !== null) {
      const latency = Date.now() - t0;
      logger.info({ positionId, owner, healthFactor: payload.healthFactor, status, latencyMs: latency }, 'wrote position');

      // Process bot check if enabled
      if (bot && status === 'at_risk') {
        try {
          await bot.processUpdate({
            positionId,
            owner,
            collateral,
            debt,
            healthFactor: BigInt(payload.healthFactor),
            status,
          });
        } catch (e) {
          logger.error({ err: (e as Error).message, positionId }, 'Bot processing failed');
        }
      }
    } else {
      failureCount += 1;
      lastErrorTs = Math.floor(Date.now() / 1000);
      logger.error({ positionId }, 'Failed to write position after retries');
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
  app.use(express.json()); // Parse JSON bodies
  
  app.get('/healthz', (_req, res) => res.status(200).send('ok'));
  app.get('/metrics', (_req, res) => res.json({ writeCount, failureCount, lastErrorTs, startTs, wsConnected, lastEventBlock }));
  
  // Price oracle endpoints
  app.get('/oracle/stats', (_req, res) => {
    const { getCacheStats } = require('./priceOracle');
    res.json(getCacheStats());
  });
  
  app.get('/oracle/price/:tokenAddress', async (_req, res) => {
    try {
      const { getTokenPrice, getPriceSource } = require('./priceOracle');
      const tokenAddress = _req.params.tokenAddress;
      const tokenType = (_req.query.type as string) || 'collateral';
      const price = await getTokenPrice(tokenAddress, tokenType as 'collateral' | 'debt');
      const source = getPriceSource(tokenAddress);
      res.json({ tokenAddress, price: price.toString(), source });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });
  
  app.post('/oracle/refresh/:tokenAddress', async (_req, res) => {
    try {
      const { refreshTokenPrice } = require('./priceOracle');
      const tokenAddress = _req.params.tokenAddress;
      const tokenType = (_req.body?.type || 'collateral') as 'collateral' | 'debt';
      const price = await refreshTokenPrice(tokenAddress, tokenType);
      res.json({ tokenAddress, price: price.toString(), refreshed: true });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });
  
  app.get('/bot/status', (_req, res) => {
    if (!bot) {
      return res.json({ enabled: false, message: 'Bot not initialized' });
    }
    res.json(bot.getStatus());
  });
  app.get('/bot/history', (_req, res) => {
    if (!bot) {
      return res.json({ history: [] });
    }
    res.json({ history: bot.getHistory() });
  });
  
  app.post('/bot/config', async (req, res) => {
    if (!bot) {
      return res.status(400).json({ error: 'Bot not initialized' });
    }
    
    try {
      const config = req.body;
      // Validate config
      if (config.enabled !== undefined && typeof config.enabled !== 'boolean') {
        return res.status(400).json({ error: 'Invalid enabled value' });
      }
      if (config.autoRescue !== undefined && typeof config.autoRescue !== 'boolean') {
        return res.status(400).json({ error: 'Invalid autoRescue value' });
      }
      if (config.minHealthFactor !== undefined) {
        const hf = parseFloat(config.minHealthFactor);
        if (isNaN(hf) || hf < 0) {
          return res.status(400).json({ error: 'Invalid minHealthFactor' });
        }
      }
      if (config.maxTopUpAmount !== undefined) {
        const amount = BigInt(config.maxTopUpAmount);
        if (amount < 0n) {
          return res.status(400).json({ error: 'Invalid maxTopUpAmount' });
        }
      }
      
      bot.updateConfig(config);
      logger.info({ config }, 'Bot configuration updated');
      res.json({ success: true, config: bot.getStatus() });
    } catch (e) {
      logger.error({ err: (e as Error).message }, 'Failed to update bot config');
      res.status(500).json({ error: (e as Error).message });
    }
  });
  
  const port = process.env.PORT || 8080;
  app.listen(port, () => logger.info({ port }, 'health server started'));
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


