import * as React from 'react';
import { cn } from './utils';

export interface PriceInputProps {
  cents: number;
  onChangeCents: (cents: number) => void;
  currency?: string;
  label?: string;
  minCents?: number;
  maxCents?: number;
  error?: string;
}

export const PriceInput: React.FC<PriceInputProps> = ({
  cents,
  onChangeCents,
  currency = 'USD',
  label = 'Price',
  minCents = 300,
  maxCents = 50000,
  error,
}) => {
  const [displayValue, setDisplayValue] = React.useState<string>((cents / 100).toFixed(2));

  React.useEffect(() => {
    setDisplayValue((cents / 100).toFixed(2));
  }, [cents]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDisplayValue(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      const calculatedCents = Math.round(parsed * 100);
      onChangeCents(calculatedCents);
    }
  };

  return (
    <div className="w-full space-y-1.5">
      {label && <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">{label}</label>}
      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-zinc-400 font-medium">$</span>
        <input
          type="number"
          step="0.01"
          min={minCents / 100}
          max={maxCents / 100}
          value={displayValue}
          onChange={handleChange}
          className={cn(
            'w-full bg-zinc-900/90 text-zinc-100 font-mono text-lg rounded-xl border border-zinc-800 pl-8 pr-16 py-2.5 outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20',
            error && 'border-rose-500'
          )}
        />
        <span className="absolute right-3.5 text-xs font-semibold text-zinc-500">{currency}</span>
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
};
