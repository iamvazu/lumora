import { describe, it, expect } from 'vitest';
import { VatTaxService } from '../src/payments/vat-tax.service.js';

describe('EU & Global VAT Calculation Engine (Epic E19)', () => {
  const vatTaxService = new VatTaxService();

  it('calculates German VAT (19%) when IP and BIN match DE', () => {
    const res = vatTaxService.calculateTax({
      amountCents: 10000, // $100.00
      customerIpCountry: 'DE',
      binCountry: 'DE',
      billingCountry: 'DE',
    });

    expect(res.jurisdiction).toBe('DE');
    expect(res.isVatApplicable).toBe(true);
    expect(res.taxRatePercent).toBe(19.0);
    expect(res.taxAmountCents).toBe(1900); // $19.00
    expect(res.totalAmountCents).toBe(11900); // $119.00
    expect(res.evidenceMatch).toBe(true);
  });

  it('calculates UK VAT (20%) when at least 2 pieces of evidence match GB', () => {
    const res = vatTaxService.calculateTax({
      amountCents: 2000, // $20.00
      customerIpCountry: 'GB',
      binCountry: 'GB',
      billingCountry: 'FR', // roaming or foreign billing
    });

    expect(res.jurisdiction).toBe('GB');
    expect(res.isVatApplicable).toBe(true);
    expect(res.taxRatePercent).toBe(20.0);
    expect(res.taxAmountCents).toBe(400); // $4.00
    expect(res.totalAmountCents).toBe(2400); // $24.00
    expect(res.evidenceMatch).toBe(true);
  });

  it('applies 0% VAT for US domestic purchases', () => {
    const res = vatTaxService.calculateTax({
      amountCents: 5000, // $50.00
      customerIpCountry: 'US',
      binCountry: 'US',
      billingCountry: 'US',
    });

    expect(res.jurisdiction).toBe('US');
    expect(res.isVatApplicable).toBe(false);
    expect(res.taxRatePercent).toBe(0.0);
    expect(res.taxAmountCents).toBe(0);
    expect(res.totalAmountCents).toBe(5000);
  });
});
