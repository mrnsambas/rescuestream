export type HealthResult = {
  healthFactor: bigint; // scaled by 1e18
  status: 'healthy' | 'watch' | 'at_risk';
  collateralValueUSD?: bigint;
  debtValueUSD?: bigint;
};

const ONE = 10n ** 18n;

// Simple price stub: 1 collateral = $2, 1 debt = $1.5
const PRICE_COLLATERAL_USD_1e18 = 2n * (10n ** 18n);
const PRICE_DEBT_USD_1e18 = 15n * (10n ** 17n); // 1.5 * 1e18

export function computeHealth(collateral: bigint, debt: bigint): HealthResult {
  // Simplified: health = (collateral + 1) / (debt + 1)
  const num = collateral + 1n;
  const den = debt + 1n;
  const health = (num * ONE) / den;

  let status: HealthResult['status'] = 'healthy';
  if (health < ONE) status = 'at_risk';
  else if (health < 15n * (ONE / 10n)) status = 'watch'; // < 1.5
  const collateralUsd = (collateral * PRICE_COLLATERAL_USD_1e18) / ONE;
  const debtUsd = (debt * PRICE_DEBT_USD_1e18) / ONE;
  return { healthFactor: health, status, collateralValueUSD: collateralUsd, debtValueUSD: debtUsd };
}


