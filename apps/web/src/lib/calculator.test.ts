import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateEarnings } from './calculator.js';

describe('calculateEarnings', () => {
  it('calculates 80% split accurately for 100 fans at $10.00/mo', () => {
    const result = calculateEarnings(100, 10);
    // 100 * 1000 cents = 100,000 cents gross ($1,000.00)
    assert.strictEqual(result.grossCents, 100000);
    assert.strictEqual(result.creatorTakeHomeCents, 80000); // $800.00
    assert.strictEqual(result.lumoraFeeCents, 20000); // $200.00
    assert.strictEqual(result.creatorTakeHomeFormatted, '$800.00');
  });

  it('handles fractional pricing with integer cent precision ($9.99)', () => {
    const result = calculateEarnings(250, 9.99);
    // 250 * 999 cents = 249,750 cents gross ($2,497.50)
    assert.strictEqual(result.grossCents, 249750);
    // 80% of 249750 = 199,800 cents ($1,998.00)
    assert.strictEqual(result.creatorTakeHomeCents, 199800);
    assert.strictEqual(result.lumoraFeeCents, 49950);
    assert.strictEqual(result.creatorTakeHomeFormatted, '$1,998.00');
  });

  it('handles edge case of 0 fans', () => {
    const result = calculateEarnings(0, 15);
    assert.strictEqual(result.grossCents, 0);
    assert.strictEqual(result.creatorTakeHomeCents, 0);
    assert.strictEqual(result.lumoraFeeCents, 0);
  });
});
