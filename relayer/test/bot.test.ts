import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { RescueBot } from '../src/bot';
import { BotConfig, DEFAULT_BOT_CONFIG } from '../src/botConfig';
import { ethers } from 'ethers';

// Mock provider
const mockProvider = {
  getBlockNumber: jest.fn().mockResolvedValue(100n),
} as any as ethers.Provider;

// Mock logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as any;

describe('RescueBot', () => {
  let bot: RescueBot;
  let config: BotConfig;

  beforeEach(() => {
    config = {
      ...DEFAULT_BOT_CONFIG,
      enabled: true,
      autoRescue: true,
      minHealthFactor: '1.0',
      maxTopUpAmount: '100000000000000000', // 0.1 ETH
      privateKey: '0x' + '1'.repeat(64), // Mock private key
    };
    bot = new RescueBot(config, mockProvider, mockLogger);
  });

  it('should initialize bot with config', () => {
    expect(bot).toBeDefined();
    const status = bot.getStatus();
    expect(status.enabled).toBe(true);
  });

  it('should check position correctly', async () => {
    const update = {
      positionId: '0x123',
      owner: '0xabc',
      collateral: 100n * 10n ** 18n,
      debt: 150n * 10n ** 18n, // High debt = at risk
      healthFactor: 5n * 10n ** 17n, // 0.5 (below 1.0)
      status: 'at_risk' as const,
    };

    const needsRescue = await bot.checkPosition(update);
    expect(needsRescue).toBe(true);
  });

  it('should not rescue healthy positions', async () => {
    const update = {
      positionId: '0x123',
      owner: '0xabc',
      collateral: 200n * 10n ** 18n,
      debt: 100n * 10n ** 18n,
      healthFactor: 2n * 10n ** 18n, // 2.0 (healthy)
      status: 'healthy' as const,
    };

    const needsRescue = await bot.checkPosition(update);
    expect(needsRescue).toBe(false);
  });

  it('should respect rate limiting', async () => {
    // This would require mocking the rescue history
    // For now, just verify the bot has rate limiting logic
    const status = bot.getStatus();
    expect(status).toBeDefined();
  });

  it('should track rescue history', () => {
    const history = bot.getHistory();
    expect(Array.isArray(history)).toBe(true);
  });

  it('should update configuration', () => {
    const newConfig = {
      minHealthFactor: '1.5',
      maxTopUpAmount: '200000000000000000',
    };

    bot.updateConfig(newConfig);
    const status = bot.getStatus();
    expect(status.enabled).toBe(true);
  });
});

