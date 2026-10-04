import * as React from 'react';
import { Button } from './Button';
import { cn } from './utils';

export interface LockedMediaProps {
  priceCents: number;
  currency?: string;
  previewUrl?: string | null;
  onUnlock?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const LockedMedia: React.FC<LockedMediaProps> = ({
  priceCents,
  currency = 'USD',
  previewUrl,
  onUnlock,
  isLoading = false,
  className,
}) => {
  const formattedPrice = currency === 'USD' ? `$${(priceCents / 100).toFixed(2)}` : `${(priceCents / 100).toFixed(2)} ${currency}`;

  return (
    <div
      className={cn(
        'relative aspect-video w-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center group',
        className
      )}
    >
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="Locked Content Preview"
          className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-40 transition-transform duration-700 group-hover:scale-125"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-zinc-900/60 to-pink-950/40" />
      )}

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* Center Unlock Card */}
      <div className="relative z-10 flex flex-col items-center gap-3 p-6 text-center max-w-sm rounded-2xl bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <div>
          <h4 className="text-base font-semibold text-white">Exclusive Content</h4>
          <p className="text-xs text-zinc-400 mt-1">Unlock this post to view high-resolution media</p>
        </div>

        <Button
          variant="gradient"
          size="md"
          className="w-full mt-1"
          isLoading={isLoading}
          onClick={onUnlock}
        >
          Unlock for {formattedPrice}
        </Button>
      </div>
    </div>
  );
};
