// Bot configuration and types

export type BotConfig = {
  enabled: boolean;
  autoRescue: boolean;
  minHealthFactor: string; // Threshold below which to trigger rescue (e.g., "1.0")
  maxTopUpAmount: string; // Max amount to top up per rescue (in ETH/wei)
  rateLimit: {
    maxRescuesPerHour: number;
    minDelayBetweenRescues: number; // seconds
  };
  monitoredPositions?: string[]; // If empty, monitor all positions
  privateKey?: string; // Private key for bot wallet (must be owner of RescueHelper)
};

export const DEFAULT_BOT_CONFIG: BotConfig = {
  enabled: false,
  autoRescue: false,
  minHealthFactor: '1.0',
  maxTopUpAmount: '100000000000000000', // 0.1 ETH in wei
  rateLimit: {
    maxRescuesPerHour: 10,
    minDelayBetweenRescues: 300, // 5 minutes
  },
  monitoredPositions: [],
};

export function loadBotConfig(): BotConfig {
  // Load from environment variables or config file
  const config: BotConfig = {
    enabled: process.env.BOT_ENABLED === 'true',
    autoRescue: process.env.BOT_AUTO_RESCUE === 'true',
    minHealthFactor: process.env.BOT_MIN_HEALTH_FACTOR || DEFAULT_BOT_CONFIG.minHealthFactor,
    maxTopUpAmount: process.env.BOT_MAX_TOP_UP || DEFAULT_BOT_CONFIG.maxTopUpAmount,
    rateLimit: {
      maxRescuesPerHour: parseInt(process.env.BOT_MAX_RESCUES_PER_HOUR || '10', 10),
      minDelayBetweenRescues: parseInt(process.env.BOT_MIN_DELAY || '300', 10),
    },
    monitoredPositions: process.env.BOT_MONITORED_POSITIONS
      ? process.env.BOT_MONITORED_POSITIONS.split(',').map((p) => p.trim())
      : [],
    privateKey: process.env.BOT_PRIVATE_KEY,
  };

  return config;
}

