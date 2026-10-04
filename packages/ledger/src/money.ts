import { CurrencyCode } from './types.js';

export class Money {
  readonly amountCents: bigint;
  readonly currency: CurrencyCode;

  constructor(amountCents: bigint | number, currency: CurrencyCode = 'USD') {
    if (typeof amountCents === 'number') {
      if (!Number.isInteger(amountCents)) {
        throw new TypeError(`Money amount must be an integer, received float: ${amountCents}`);
      }
      this.amountCents = BigInt(amountCents);
    } else {
      this.amountCents = amountCents;
    }
    this.currency = currency;
  }

  static fromCents(cents: number | bigint, currency: CurrencyCode = 'USD'): Money {
    return new Money(cents, currency);
  }

  static zero(currency: CurrencyCode = 'USD'): Money {
    return new Money(0n, currency);
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amountCents + other.amountCents, this.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amountCents - other.amountCents, this.currency);
  }

  multiplyBps(basisPoints: number): Money {
    if (!Number.isInteger(basisPoints)) {
      throw new TypeError(`Basis points must be an integer: ${basisPoints}`);
    }
    // basisPoints 10000 = 100%, 2000 = 20%, 500 = 5%
    const product = this.amountCents * BigInt(basisPoints);
    const result = product / 10000n;
    return new Money(result, this.currency);
  }

  percentage(pct: number): Money {
    if (!Number.isInteger(pct)) {
      throw new TypeError(`Percentage must be an integer: ${pct}`);
    }
    return this.multiplyBps(pct * 100);
  }

  isPositive(): boolean {
    return this.amountCents > 0n;
  }

  isNegative(): boolean {
    return this.amountCents < 0n;
  }

  isZero(): boolean {
    return this.amountCents === 0n;
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.amountCents === other.amountCents;
  }

  format(): string {
    const isNeg = this.amountCents < 0n;
    const absCents = isNeg ? -this.amountCents : this.amountCents;
    const dollars = absCents / 100n;
    const cents = absCents % 100n;
    const formatted = `${dollars.toString()}.${cents.toString().padStart(2, '0')}`;
    const sign = isNeg ? '-' : '';
    
    switch (this.currency) {
      case 'USD':
        return `${sign}$${formatted}`;
      case 'EUR':
        return `${sign}€${formatted}`;
      case 'GBP':
        return `${sign}£${formatted}`;
      default:
        return `${sign}${formatted} ${this.currency}`;
    }
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: cannot operate on ${this.currency} and ${other.currency}`);
    }
  }
}
