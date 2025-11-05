import { describe, it, expect, jest } from '@jest/globals';
import { computeHealth, computeHealthSync } from '../src/computeHealth';

// Mock price oracle to return predictable values
jest.mock('../src/priceOracle', () => ({
  getPrices: jest.fn().mockResolvedValue({
    collateralPrice: 2n * 10n ** 18n, // $2
    debtPrice: 15n * 10n ** 17n, // $1.5
  }),
  getTokenPrice: jest.fn().mockResolvedValue(2n * 10n ** 18n),
}));

describe('computeHealth', () => {
  it('should calculate health factor correctly for healthy position', async () => {
    // Collateral: 100 tokens, Debt: 50 tokens
    // With default prices: collateral = $2, debt = $1.5
    // Collateral USD = 100 * 2 = $200
    // Debt USD = 50 * 1.5 = $75
    // Health = 200 / 75 = 2.67
    const collateral = 100n * 10n ** 18n;
    const debt = 50n * 10n ** 18n;
    
    const result = await computeHealth(collateral, debt);
    
    expect(result.healthFactor).toBeGreaterThan(2n * 10n ** 18n);
    expect(result.status).toBe('healthy');
    expect(result.collateralValueUSD).toBeDefined();
    expect(result.debtValueUSD).toBeDefined();
  });

  it('should identify at-risk position', async () => {
    // High debt relative to collateral
    const collateral = 50n * 10n ** 18n;
    const debt = 100n * 10n ** 18n;
    
    const result = await computeHealth(collateral, debt);
    
    expect(result.healthFactor).toBeLessThan(10n ** 18n); // Less than 1.0
    expect(result.status).toBe('at_risk');
  });

  it('should calculate liquidation price', async () => {
    const collateral = 100n * 10n ** 18n;
    const debt = 50n * 10n ** 18n;
    
    const result = await computeHealth(collateral, debt);
    
    expect(result.liquidationPrice).toBeDefined();
    expect(result.liquidationThreshold).toBeDefined();
    if (result.liquidationPrice) {
      expect(result.liquidationPrice).toBeGreaterThan(0n);
    }
  });

  it('should handle zero debt gracefully', async () => {
    const collateral = 100n * 10n ** 18n;
    const debt = 0n;
    
    const result = await computeHealth(collateral, debt);
    
    expect(result.healthFactor).toBeGreaterThan(10n ** 18n * 10n);
    expect(result.status).toBe('healthy');
  });
});

describe('computeHealthSync', () => {
  it('should calculate health factor synchronously', () => {
    const collateral = 100n * 10n ** 18n;
    const debt = 50n * 10n ** 18n;
    
    const result = computeHealthSync(collateral, debt);
    
    expect(result.healthFactor).toBeGreaterThan(0n);
    expect(result.status).toBeDefined();
    expect(['healthy', 'watch', 'at_risk']).toContain(result.status);
  });

  it('should include liquidation price in sync version', () => {
    const collateral = 100n * 10n ** 18n;
    const debt = 50n * 10n ** 18n;
    
    const result = computeHealthSync(collateral, debt);
    
    expect(result.liquidationPrice).toBeDefined();
    expect(result.liquidationThreshold).toBeDefined();
  });
});

