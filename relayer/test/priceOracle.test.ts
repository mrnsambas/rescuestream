import { describe, it, expect, beforeEach } from '@jest/globals';
import { getTokenPrice, getPrices, clearPriceCache, getCacheStats, getPriceSource, refreshTokenPrice } from '../src/priceOracle';

describe('priceOracle', () => {
  beforeEach(() => {
    clearPriceCache();
  });

  it('should return fallback price when no oracle configured', async () => {
    const price = await getTokenPrice('0x0000000000000000000000000000000000000000', 'collateral');
    
    expect(price).toBeGreaterThan(0n);
    expect(price).toBe(2n * 10n ** 18n); // Default collateral fallback
  });

  it('should cache prices', async () => {
    const tokenAddress = '0x1111111111111111111111111111111111111111';
    
    await getTokenPrice(tokenAddress, 'collateral');
    const stats = getCacheStats();
    
    expect(stats.size).toBeGreaterThan(0);
    expect(stats.entries.some(e => e.token === tokenAddress)).toBe(true);
  });

  it('should return prices for both tokens', async () => {
    const collateralToken = '0x2222222222222222222222222222222222222222';
    const debtToken = '0x3333333333333333333333333333333333333333';
    
    const { collateralPrice, debtPrice } = await getPrices(collateralToken, debtToken);
    
    expect(collateralPrice).toBeGreaterThan(0n);
    expect(debtPrice).toBeGreaterThan(0n);
  });

  it('should provide price source information', async () => {
    const tokenAddress = '0x4444444444444444444444444444444444444444';
    
    await getTokenPrice(tokenAddress, 'collateral');
    const source = getPriceSource(tokenAddress);
    
    expect(source).toBeDefined();
    expect(source?.source).toBeDefined();
    expect(['oracle', 'dex', 'fallback']).toContain(source?.source);
  });

  it('should refresh prices on demand', async () => {
    const tokenAddress = '0x5555555555555555555555555555555555555555';
    
    await getTokenPrice(tokenAddress, 'collateral');
    const price1 = getPriceSource(tokenAddress);
    
    await refreshTokenPrice(tokenAddress, 'collateral');
    const price2 = getPriceSource(tokenAddress);
    
    expect(price1).toBeDefined();
    expect(price2).toBeDefined();
    // Timestamp should be newer (or at least same)
    if (price1 && price2) {
      expect(price2.timestamp).toBeGreaterThanOrEqual(price1.timestamp);
    }
  });
});

