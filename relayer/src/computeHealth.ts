import { getPrices, getTokenPrice } from './priceOracle';

export type HealthResult = {
  healthFactor: bigint; // scaled by 1e18
  status: 'healthy' | 'watch' | 'at_risk';
  collateralValueUSD?: bigint;
  debtValueUSD?: bigint;
  liquidationPrice?: bigint; // Price at which position would be liquidated (1e18 scaled)
  liquidationThreshold?: number; // Health factor threshold for liquidation (typically 1.0)
};

const ONE = 10n ** 18n;

// Default token addresses (can be overridden via config)
const DEFAULT_COLLATERAL_TOKEN = '0x0000000000000000000000000000000000000000';
const DEFAULT_DEBT_TOKEN = '0x0000000000000000000000000000000000000000';

/**
 * Compute health factor using real price feeds
 * @param collateral - Collateral amount (raw token units)
 * @param debt - Debt amount (raw token units)
 * @param collateralToken - Token address for collateral (optional, uses default if not provided)
 * @param debtToken - Token address for debt (optional, uses default if not provided)
 */
export async function computeHealth(
  collateral: bigint,
  debt: bigint,
  collateralToken: string = DEFAULT_COLLATERAL_TOKEN,
  debtToken: string = DEFAULT_DEBT_TOKEN
): Promise<HealthResult> {
  // Get prices for both tokens
  const { collateralPrice, debtPrice } = await getPrices(collateralToken, debtToken);

  // Calculate USD values
  const collateralUsd = (collateral * collateralPrice) / ONE;
  const debtUsd = (debt * debtPrice) / ONE;

  // Calculate health factor: collateralValueUSD / debtValueUSD
  // Add small epsilon to avoid division by zero
  const health = debtUsd > 0n 
    ? (collateralUsd * ONE) / debtUsd
    : ONE * 100n; // Very healthy if no debt

  let status: HealthResult['status'] = 'healthy';
  if (health < ONE) {
    status = 'at_risk'; // Below 1.0 = liquidation risk
  } else if (health < 15n * (ONE / 10n)) {
    status = 'watch'; // Below 1.5 = watch mode
  }

  // Calculate liquidation price
  // Liquidation occurs when healthFactor = 1.0
  // liquidationPrice = (debtValueUSD * collateralPrice) / (collateralAmount * liquidationThreshold)
  // For simplicity, assuming liquidation threshold is 1.0 (healthFactor = 1.0)
  const LIQUIDATION_THRESHOLD = ONE; // 1.0 in 1e18 scale
  let liquidationPrice: bigint | undefined;
  
  if (collateral > 0n && debtUsd > 0n) {
    // liquidationPrice = (debtValueUSD * collateralPrice) / collateralAmount
    // This gives the price at which the collateral value equals the debt value
    liquidationPrice = (debtUsd * collateralPrice) / collateral;
  }

  return {
    healthFactor: health,
    status,
    collateralValueUSD: collateralUsd,
    debtValueUSD: debtUsd,
    liquidationPrice,
    liquidationThreshold: Number(LIQUIDATION_THRESHOLD) / Number(ONE),
  };
}

/**
 * Synchronous version with fallback prices (for backward compatibility)
 */
export function computeHealthSync(collateral: bigint, debt: bigint): HealthResult {
  // Use fallback prices for synchronous calculation
  const PRICE_COLLATERAL_USD_1e18 = 2n * (10n ** 18n);
  const PRICE_DEBT_USD_1e18 = 15n * (10n ** 17n); // 1.5 * 1e18

  const collateralUsd = (collateral * PRICE_COLLATERAL_USD_1e18) / ONE;
  const debtUsd = (debt * PRICE_DEBT_USD_1e18) / ONE;

  const health = debtUsd > 0n 
    ? (collateralUsd * ONE) / debtUsd
    : ONE * 100n;

  let status: HealthResult['status'] = 'healthy';
  if (health < ONE) status = 'at_risk';
  else if (health < 15n * (ONE / 10n)) status = 'watch';

  // Calculate liquidation price for sync version
  const LIQUIDATION_THRESHOLD = ONE;
  let liquidationPrice: bigint | undefined;
  
  if (collateral > 0n && debtUsd > 0n) {
    liquidationPrice = (debtUsd * PRICE_COLLATERAL_USD_1e18) / collateral;
  }

  return { 
    healthFactor: health, 
    status, 
    collateralValueUSD: collateralUsd, 
    debtValueUSD: debtUsd,
    liquidationPrice,
    liquidationThreshold: Number(LIQUIDATION_THRESHOLD) / Number(ONE),
  };
}


