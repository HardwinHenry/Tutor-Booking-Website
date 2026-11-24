import React from 'react';
import { cn } from '../../utils/cn';

const colorStyles = {
  brand: 'bg-brand-50 text-brand-700 border-brand-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
};

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5 rounded-md font-medium',
  md: 'text-xs px-2.5 py-1 rounded-full font-medium',
  lg: 'text-sm px-3 py-1 rounded-full font-semibold',
};

export function Badge({
  children,
  color = 'brand',
  size = 'md',
  dot = false,
  className,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center border border-transparent select-none whitespace-nowrap',
        colorStyles[color] || colorStyles.brand,
        sizeStyles[size] || sizeStyles.md,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full mr-1.5 shrink-0',
            color === 'emerald' && 'bg-emerald-500',
            color === 'rose' && 'bg-rose-500',
            color === 'amber' && 'bg-amber-500',
            color === 'sky' && 'bg-sky-500',
            color === 'brand' && 'bg-brand-500',
            color === 'slate' && 'bg-slate-400'
          )}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
