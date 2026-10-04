import * as React from 'react';
import { cn } from './utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  glow?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass = true, glow = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border border-zinc-800/80 p-6 transition-all duration-300',
          glass ? 'bg-zinc-950/70 backdrop-blur-xl shadow-2xl' : 'bg-zinc-900',
          glow && 'relative overflow-hidden before:absolute before:-inset-px before:bg-gradient-to-r before:from-purple-500/20 before:via-pink-500/20 before:to-amber-500/20 before:-z-10 before:rounded-2xl',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';
