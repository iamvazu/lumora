import * as React from 'react';
import { cn } from './utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'purple';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-zinc-800 text-zinc-300 border-zinc-700/60',
      purple: 'bg-purple-950/70 text-purple-300 border-purple-800/50',
      success: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/50',
      warning: 'bg-amber-950/70 text-amber-300 border-amber-800/50',
      danger: 'bg-rose-950/70 text-rose-300 border-rose-800/50',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';
