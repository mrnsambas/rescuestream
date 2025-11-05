// Price oracle with caching and fallback support
// Supports multiple token pairs and price sources

import { ethers } from 'ethers';

export type TokenAddress = string;
export type PriceData = {
  priceUSD: bigint; // 1e18 scaled
  timestamp: number;
  source: 'oracle' | 'dex' | 'fallback';
  staleness?: number; // seconds since last update
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_STALENESS_SEC = 3600; // 1 hour - reject prices older than this
const PRICE_VALIDATION_THRESHOLD = 50n; // 50% price change threshold for validation
const priceCache = new Map<TokenAddress, PriceData>();

// Chainlink Aggregator ABI (minimal)
const CHAINLINK_ABI = [
  'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
  'function decimals() external view returns (uint8)',
];

// Uniswap V2 Pair ABI (for DEX price)
const UNISWAP_V2_PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
];

// Uniswap V3 Pool ABI (for DEX price)
const UNISWAP_V3_POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function liquidity() external view returns (uint128)',
];

// Fallback prices (used when oracle fails)
const FALLBACK_PRICES: Record<string, bigint> = {
  // Default collateral token: $2 per token
  default_collateral: 2n * (10n ** 18n),
  // Default debt token: $1.5 per token
  default_debt: 15n * (10n ** 17n), // 1.5 * 1e18
};

// Get provider from environment or create new one
function getProvider(): ethers.Provider {
  const rpcUrl = process.env.SOMNIA_RPC_URL || process.env.RPC_URL || 'http://127.0.0.1:8545';
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Get Chainlink aggregator address for a token from environment
 * Format: CHAINLINK_<TOKEN_ADDRESS>_AGGREGATOR
 */
function getChainlinkAddress(tokenAddress: TokenAddress): string | null {
  const key = `CHAINLINK_${tokenAddress.toUpperCase()}_AGGREGATOR`;
  return process.env[key] || null;
}

/**
 * Get Uniswap V2 pair address for a token from environment
 */
function getUniswapV2Pair(tokenAddress: TokenAddress, quoteToken: string = 'USDC'): string | null {
  const key = `UNISWAP_V2_${tokenAddress.toUpperCase()}_${quoteToken}_PAIR`;
  return process.env[key] || null;
}

/**
 * Get Uniswap V3 pool address for a token from environment
 */
function getUniswapV3Pool(tokenAddress: TokenAddress, quoteToken: string = 'USDC', fee: number = 3000): string | null {
  const key = `UNISWAP_V3_${tokenAddress.toUpperCase()}_${quoteToken}_POOL_${fee}`;
  return process.env[key] || null;
}

/**
 * Validate price for reasonableness (check for outliers)
 */
function validatePrice(price: bigint, previousPrice: bigint | null): boolean {
  if (!previousPrice) return true; // No previous price to compare
  
  // Check if price change is too large (possible oracle manipulation or error)
  const diff = price > previousPrice ? price - previousPrice : previousPrice - price;
  const percentChange = (diff * 100n) / previousPrice;
  
  return percentChange < PRICE_VALIDATION_THRESHOLD;
}

/**
 * Fetch price from Chainlink price feed
 */
async function fetchChainlinkPrice(tokenAddress: TokenAddress): Promise<bigint | null> {
  const aggregatorAddress = getChainlinkAddress(tokenAddress);
  if (!aggregatorAddress) {
    return null;
  }

  try {
    const provider = getProvider();
    const aggregator = new ethers.Contract(aggregatorAddress, CHAINLINK_ABI, provider);
    
    // Get latest round data
    const roundData = await aggregator.latestRoundData();
    const answer = roundData[1]; // int256 answer
    const updatedAt = roundData[3]; // uint256 updatedAt
    
    // Check staleness
    const now = BigInt(Math.floor(Date.now() / 1000));
    const staleness = Number(now - updatedAt);
    
    if (staleness > MAX_STALENESS_SEC) {
      console.warn(`Chainlink price for ${tokenAddress} is stale: ${staleness}s old`);
      return null;
    }
    
    // Chainlink returns 8 decimals, scale to 18
    const decimals = await aggregator.decimals().catch(() => 8);
    const scaleFactor = 10n ** (18n - BigInt(decimals));
    
    // Convert to positive bigint and scale
    const price = (answer < 0 ? -answer : answer) * scaleFactor;
    
    // Basic validation
    if (price === 0n || price > 10n ** 30n) {
      return null; // Invalid price
    }
    
    return price;
  } catch (e) {
    console.warn(`Chainlink price fetch failed for ${tokenAddress}:`, (e as Error).message);
    return null;
  }
}

/**
 * Fetch price from Uniswap V2 pair reserves
 */
async function fetchUniswapV2Price(tokenAddress: TokenAddress, quoteToken: string = 'USDC'): Promise<bigint | null> {
  const pairAddress = getUniswapV2Pair(tokenAddress, quoteToken);
  if (!pairAddress) {
    return null;
  }

  try {
    const provider = getProvider();
    const pair = new ethers.Contract(pairAddress, UNISWAP_V2_PAIR_ABI, provider);
    
    const [token0, token1, reserves] = await Promise.all([
      pair.token0(),
      pair.token1(),
      pair.getReserves(),
    ]);
    
    const reserve0 = reserves[0];
    const reserve1 = reserves[1];
    
    // Determine which reserve is our token
    const tokenIs0 = token0.toLowerCase() === tokenAddress.toLowerCase();
    const tokenReserve = tokenIs0 ? reserve0 : reserve1;
    const quoteReserve = tokenIs0 ? reserve1 : reserve0;
    
    if (tokenReserve === 0n || quoteReserve === 0n) {
      return null; // Invalid reserves
    }
    
    // Price = quoteReserve / tokenReserve (scaled to 1e18)
    // Assuming quote token (USDC) has 6 decimals and token has 18 decimals
    const price = (quoteReserve * 10n ** 18n) / tokenReserve;
    
    return price;
  } catch (e) {
    console.warn(`Uniswap V2 price fetch failed for ${tokenAddress}:`, (e as Error).message);
    return null;
  }
}

/**
 * Fetch price from Uniswap V3 pool
 */
async function fetchUniswapV3Price(tokenAddress: TokenAddress, quoteToken: string = 'USDC'): Promise<bigint | null> {
  const poolAddress = getUniswapV3Pool(tokenAddress, quoteToken);
  if (!poolAddress) {
    return null;
  }

  try {
    const provider = getProvider();
    const pool = new ethers.Contract(poolAddress, UNISWAP_V3_POOL_ABI, provider);
    
    const [slot0, token0, token1] = await Promise.all([
      pool.slot0(),
      pool.token0(),
      pool.token1(),
    ]);
    
    const sqrtPriceX96 = slot0[0];
    const tokenIs0 = token0.toLowerCase() === tokenAddress.toLowerCase();
    
    // Price = (sqrtPriceX96 / 2^96)^2
    // For token0/token1: price = (sqrtPriceX96 / 2^96)^2
    // For token1/token0: price = 1 / ((sqrtPriceX96 / 2^96)^2)
    const Q96 = 2n ** 96n;
    const priceRatio = (sqrtPriceX96 * sqrtPriceX96) / (Q96 * Q96);
    
    // Scale to 1e18 (assuming 18 decimals for both tokens)
    let price: bigint;
    if (tokenIs0) {
      price = (10n ** 18n * Q96 * Q96) / (sqrtPriceX96 * sqrtPriceX96);
    } else {
      price = (sqrtPriceX96 * sqrtPriceX96 * 10n ** 18n) / (Q96 * Q96);
    }
    
    return price;
  } catch (e) {
    console.warn(`Uniswap V3 price fetch failed for ${tokenAddress}:`, (e as Error).message);
    return null;
  }
}

/**
 * Fetch price from DEX aggregator (Uniswap V3 or V2)
 */
async function fetchDexPrice(tokenAddress: TokenAddress): Promise<bigint | null> {
  // Try Uniswap V3 first (more accurate)
  let price = await fetchUniswapV3Price(tokenAddress);
  if (price) return price;
  
  // Fallback to Uniswap V2
  price = await fetchUniswapV2Price(tokenAddress);
  if (price) return price;
  
  return null;
}

/**
 * Get price for a token with caching and fallback
 */
export async function getTokenPrice(tokenAddress: TokenAddress, tokenType: 'collateral' | 'debt'): Promise<bigint> {
  const cached = priceCache.get(tokenAddress);
  const now = Date.now();

  // Return cached price if still valid
  if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
    return cached.priceUSD;
  }

  // Try to fetch from oracle
  let price: bigint | null = null;
  let source: PriceData['source'] = 'fallback';
  let staleness: number | undefined;

  try {
    price = await fetchChainlinkPrice(tokenAddress);
    if (price) {
      // Validate price against cached value
      if (validatePrice(price, cached?.priceUSD || null)) {
        source = 'oracle';
      } else {
        console.warn(`Chainlink price validation failed for ${tokenAddress}, trying DEX...`);
        price = null;
      }
    }
  } catch (e) {
    console.warn(`Chainlink price fetch failed for ${tokenAddress}:`, (e as Error).message);
  }

  // Fallback to DEX price
  if (!price) {
    try {
      const dexPrice = await fetchDexPrice(tokenAddress);
      if (dexPrice && validatePrice(dexPrice, cached?.priceUSD || null)) {
        price = dexPrice;
        source = 'dex';
      } else if (dexPrice) {
        console.warn(`DEX price validation failed for ${tokenAddress}, using fallback`);
      }
    } catch (e) {
      console.warn(`DEX price fetch failed for ${tokenAddress}:`, (e as Error).message);
    }
  }

  // Use fallback price if all sources fail
  if (!price) {
    const fallbackKey = tokenType === 'collateral' ? 'default_collateral' : 'default_debt';
    price = FALLBACK_PRICES[fallbackKey] || FALLBACK_PRICES.default_collateral;
    source = 'fallback';
    console.warn(`Using fallback price for ${tokenAddress} (${source})`);
  }

  // Cache the result
  priceCache.set(tokenAddress, {
    priceUSD: price,
    timestamp: now,
    source,
    staleness,
  });

  return price;
}

/**
 * Get prices for both collateral and debt tokens
 */
export async function getPrices(
  collateralToken: TokenAddress,
  debtToken: TokenAddress
): Promise<{ collateralPrice: bigint; debtPrice: bigint }> {
  const [collateralPrice, debtPrice] = await Promise.all([
    getTokenPrice(collateralToken, 'collateral'),
    getTokenPrice(debtToken, 'debt'),
  ]);

  return { collateralPrice, debtPrice };
}

/**
 * Clear price cache (useful for testing or forced refresh)
 */
export function clearPriceCache(): void {
  priceCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; entries: Array<{ token: string; age: number; source: string; staleness?: number }> } {
  const now = Date.now();
  const entries = Array.from(priceCache.entries()).map(([token, data]) => ({
    token,
    age: now - data.timestamp,
    source: data.source,
    staleness: data.staleness,
  }));

  return { size: priceCache.size, entries };
}

/**
 * Get price source information for a token
 */
export function getPriceSource(tokenAddress: TokenAddress): PriceData | null {
  return priceCache.get(tokenAddress) || null;
}

/**
 * Force refresh price for a token (bypass cache)
 */
export async function refreshTokenPrice(tokenAddress: TokenAddress, tokenType: 'collateral' | 'debt'): Promise<bigint> {
  priceCache.delete(tokenAddress);
  return getTokenPrice(tokenAddress, tokenType);
}

