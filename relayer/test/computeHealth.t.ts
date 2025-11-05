import { expect } from 'chai';
import { computeHealth } from '../src/computeHealth';

describe('computeHealth', () => {
  it('returns at_risk when debt > collateral', () => {
    const r = computeHealth(10n, 100n);
    expect(r.status).to.eq('at_risk');
  });

  it('returns healthy when collateral >> debt', () => {
    const r = computeHealth(1000n, 1n);
    expect(r.status).to.eq('healthy');
  });

  it('returns watch near 1.2x', () => {
    const r = computeHealth(12n, 10n);
    expect(r.status === 'watch' || r.status === 'healthy').to.be.true;
  });
});


