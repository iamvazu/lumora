import { Injectable, Logger } from '@nestjs/common';
import {
  TaxCalculationRequest,
  TaxCalculationResponse,
} from '@lumora/contracts';

@Injectable()
export class VatTaxService {
  private readonly logger = new Logger(VatTaxService.name);

  // Standard VAT rates table (percentage)
  private readonly vatRates: Record<string, number> = {
    DE: 19.0, // Germany
    FR: 20.0, // France
    GB: 20.0, // United Kingdom
    ES: 21.0, // Spain
    IT: 22.0, // Italy
    NL: 21.0, // Netherlands
    BE: 21.0, // Belgium
    AT: 20.0, // Austria
    SE: 25.0, // Sweden
    DK: 25.0, // Denmark
    FI: 25.5, // Finland
    IE: 23.0, // Ireland
    PT: 23.0, // Portugal
    PL: 23.0, // Poland
    CA: 5.0,  // Canada GST
    AU: 10.0, // Australia GST
    NZ: 15.0, // New Zealand GST
    US: 0.0,  // US (handled via state sales tax nexus if applicable)
  };

  /**
   * Calculates VAT/Sales Tax based on 2-factor location evidence matching (Story E19)
   * In accordance with EU VAT Directive 2006/112/EC & digital services rules.
   */
  calculateTax(req: TaxCalculationRequest): TaxCalculationResponse {
    const evidenceList: string[] = [];

    if (req.customerIpCountry && req.customerIpCountry.trim()) {
      evidenceList.push(req.customerIpCountry.trim().toUpperCase());
    }
    if (req.binCountry && req.binCountry.trim()) {
      evidenceList.push(req.binCountry.trim().toUpperCase());
    }
    if (req.billingCountry && req.billingCountry.trim()) {
      evidenceList.push(req.billingCountry.trim().toUpperCase());
    }

    // Determine consensus country
    let determinedCountry = 'US';
    let evidenceMatch = false;

    if (evidenceList.length >= 2) {
      // Check for at least two matching pieces of evidence
      const countryCounts: Record<string, number> = {};
      for (const country of evidenceList) {
        countryCounts[country] = (countryCounts[country] || 0) + 1;
        if (countryCounts[country] >= 2) {
          determinedCountry = country;
          evidenceMatch = true;
          break;
        }
      }

      if (!evidenceMatch && evidenceList.length > 0) {
        // Fallback to billing or IP country
        determinedCountry = req.billingCountry || req.customerIpCountry || 'US';
      }
    } else if (evidenceList.length === 1) {
      determinedCountry = evidenceList[0] || 'US';
      evidenceMatch = true;
    }

    const ratePercent = this.vatRates[determinedCountry] ?? 0.0;
    const isVatApplicable = ratePercent > 0;

    const taxableAmountCents = req.amountCents;
    const taxAmountCents = isVatApplicable
      ? Math.round((taxableAmountCents * ratePercent) / 100)
      : 0;
    const totalAmountCents = taxableAmountCents + taxAmountCents;

    this.logger.log(
      `Tax computed for ${determinedCountry}: net=$${(taxableAmountCents / 100).toFixed(2)}, tax=$${(taxAmountCents / 100).toFixed(2)} (${ratePercent}%), match=${evidenceMatch}`
    );

    return {
      taxableAmountCents,
      taxRatePercent: ratePercent,
      taxAmountCents,
      totalAmountCents,
      jurisdiction: determinedCountry,
      isVatApplicable,
      evidenceMatch,
      evidenceCount: evidenceList.length,
    };
  }
}
