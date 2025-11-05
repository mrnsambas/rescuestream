// Automated rescue bot
// Monitors positions and executes rescues when health factor drops below threshold

import { ethers } from 'ethers';
import pino from 'pino';
import { BotConfig, loadBotConfig, DEFAULT_BOT_CONFIG } from './botConfig';
import { computeHealth, computeHealthSync } from './computeHealth';

export type PositionUpdate = {
  positionId: string;
  owner: string;
  collateral: bigint;
  debt: bigint;
  healthFactor: bigint;
  status: 'healthy' | 'watch' | 'at_risk';
};

export type BotStatus = {
  enabled: boolean;
  lastCheck: number | null;
  rescuesExecuted: number;
  lastRescueTime: number | null;
  errors: number;
  lastError: string | null;
};

export class RescueBot {
  private config: BotConfig;
  private logger: pino.Logger;
  private provider: ethers.Provider;
  private wallet: ethers.Wallet | null = null;
  private rescueHelper: ethers.Contract | null = null;
  private status: BotStatus;
  private rescueHistory: Array<{ positionId: string; timestamp: number; txHash?: string }> = [];

  constructor(config: BotConfig, provider: ethers.Provider, logger: pino.Logger) {
    this.config = config;
    this.logger = logger;
    this.provider = provider;
    this.status = {
      enabled: config.enabled,
      lastCheck: null,
      rescuesExecuted: 0,
      lastRescueTime: null,
      errors: 0,
      lastError: null,
    };

    if (config.enabled && config.privateKey) {
      this.wallet = new ethers.Wallet(config.privateKey, provider);
      this.logger.info({ address: this.wallet.address }, 'Bot wallet initialized');
    }
  }

  /**
   * Initialize bot with contract addresses
   */
  async initialize(rescueHelperAddress: string): Promise<void> {
    if (!this.wallet) {
      throw new Error('Bot wallet not configured');
    }

    const RESCUE_HELPER_ABI = [
      'function rescueTopUp(bytes32 positionId, address owner, uint256 newCollateral, uint256 debt) external',
      'function owner() external view returns (address)',
    ];

    this.rescueHelper = new ethers.Contract(rescueHelperAddress, RESCUE_HELPER_ABI, this.wallet);

    // Verify bot wallet is owner of RescueHelper
    try {
      const owner = await this.rescueHelper.owner();
      if (owner.toLowerCase() !== this.wallet.address.toLowerCase()) {
        throw new Error(`Bot wallet ${this.wallet.address} is not owner of RescueHelper (owner: ${owner})`);
      }
      this.logger.info('Bot initialized and verified as owner');
    } catch (e) {
      this.logger.error({ err: (e as Error).message }, 'Failed to verify bot ownership');
      throw e;
    }
  }

  /**
   * Check if a position needs rescue
   */
  async checkPosition(update: PositionUpdate): Promise<boolean> {
    if (!this.config.enabled || !this.config.autoRescue) {
      return false;
    }

    // Check if position is monitored
    if (this.config.monitoredPositions && this.config.monitoredPositions.length > 0) {
      if (!this.config.monitoredPositions.includes(update.positionId)) {
        return false;
      }
    }

    // Check health factor threshold
    const minHealthFactor = BigInt(Math.floor(parseFloat(this.config.minHealthFactor) * 1e18));
    if (update.healthFactor >= minHealthFactor) {
      return false;
    }

    // Check rate limiting
    if (!this.canExecuteRescue()) {
      this.logger.warn('Rescue rate limit reached, skipping');
      return false;
    }

    return true;
  }

  /**
   * Execute rescue for a position
   */
  async executeRescue(update: PositionUpdate): Promise<string | null> {
    if (!this.rescueHelper || !this.wallet) {
      throw new Error('Bot not initialized');
    }

    try {
      // Calculate new collateral (top up by maxTopUpAmount)
      const maxTopUp = BigInt(this.config.maxTopUpAmount);
      const newCollateral = update.collateral + maxTopUp;

      // Convert positionId to bytes32
      const positionIdBytes = ethers.zeroPadValue(update.positionId.startsWith('0x') 
        ? update.positionId 
        : '0x' + update.positionId, 32);

      this.logger.info({
        positionId: update.positionId,
        currentCollateral: update.collateral.toString(),
        newCollateral: newCollateral.toString(),
        healthFactor: update.healthFactor.toString(),
      }, 'Executing rescue');

      // Execute rescue transaction
      const tx = await this.rescueHelper.rescueTopUp(
        positionIdBytes,
        update.owner,
        newCollateral,
        update.debt
      );

      const receipt = await tx.wait();
      this.logger.info({ txHash: receipt.hash, positionId: update.positionId }, 'Rescue executed');

      // Update status
      this.status.rescuesExecuted += 1;
      this.status.lastRescueTime = Date.now();
      this.rescueHistory.push({
        positionId: update.positionId,
        timestamp: Date.now(),
        txHash: receipt.hash,
      });

      // Keep only last 100 rescues
      if (this.rescueHistory.length > 100) {
        this.rescueHistory.shift();
      }

      return receipt.hash;
    } catch (e) {
      this.status.errors += 1;
      this.status.lastError = (e as Error).message;
      this.logger.error({ err: (e as Error).message, positionId: update.positionId }, 'Rescue failed');
      throw e;
    }
  }

  /**
   * Check rate limiting
   */
  private canExecuteRescue(): boolean {
    const { maxRescuesPerHour, minDelayBetweenRescues } = this.config.rateLimit;

    // Check delay since last rescue
    if (this.status.lastRescueTime) {
      const timeSinceLastRescue = (Date.now() - this.status.lastRescueTime) / 1000;
      if (timeSinceLastRescue < minDelayBetweenRescues) {
        return false;
      }
    }

    // Check hourly limit (count rescues in last hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentRescues = this.rescueHistory.filter((r) => r.timestamp > oneHourAgo);
    if (recentRescues.length >= maxRescuesPerHour) {
      return false;
    }

    return true;
  }

  /**
   * Process a position update
   */
  async processUpdate(update: PositionUpdate): Promise<void> {
    this.status.lastCheck = Date.now();

    if (!(await this.checkPosition(update))) {
      return;
    }

    try {
      await this.executeRescue(update);
    } catch (e) {
      // Error already logged in executeRescue
      this.logger.error({ positionId: update.positionId }, 'Failed to process position update');
    }
  }

  /**
   * Get bot status
   */
  getStatus(): BotStatus {
    return { ...this.status };
  }

  /**
   * Get rescue history
   */
  getHistory(): Array<{ positionId: string; timestamp: number; txHash?: string }> {
    return [...this.rescueHistory];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<BotConfig>): void {
    this.config = { ...this.config, ...config };
    this.status.enabled = this.config.enabled;
    this.logger.info({ config: this.config }, 'Bot configuration updated');
  }
}

