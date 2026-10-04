/**
 * Calculates creator earnings based on integer cents to avoid floating-point errors.
 * Lumora creator payout is 80% of gross revenue.
 */
export interface EarningsBreakdown {
  grossCents: number;
  grossFormatted: string;
  lumoraFeeCents: number;
  lumoraFeeFormatted: string;
  creatorTakeHomeCents: number;
  creatorTakeHomeFormatted: string;
  monthlyTakeHomeFormatted: string;
  annualTakeHomeFormatted: string;
}

export function calculateEarnings(fans: number, priceDollars: number): EarningsBreakdown {
  // Convert price to integer cents
  const priceCents = Math.round(priceDollars * 100);
  const safeFans = Math.max(0, Math.floor(fans));

  const grossCents = safeFans * priceCents;
  // 80% to creator, 20% platform fee
  const creatorTakeHomeCents = Math.round((grossCents * 80) / 100);
  const lumoraFeeCents = grossCents - creatorTakeHomeCents;

  const annualTakeHomeCents = creatorTakeHomeCents * 12;

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const compactFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return {
    grossCents,
    grossFormatted: currencyFormatter.format(grossCents / 100),
    lumoraFeeCents,
    lumoraFeeFormatted: currencyFormatter.format(lumoraFeeCents / 100),
    creatorTakeHomeCents,
    creatorTakeHomeFormatted: currencyFormatter.format(creatorTakeHomeCents / 100),
    monthlyTakeHomeFormatted: compactFormatter.format(creatorTakeHomeCents / 100),
    annualTakeHomeFormatted: compactFormatter.format(annualTakeHomeCents / 100),
  };
}
