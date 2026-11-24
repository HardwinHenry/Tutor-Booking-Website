import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const variants = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm focus-visible:ring-brand-500 disabled:bg-brand-300',
  secondary:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 active:bg-slate-100 shadow-sm focus-visible:ring-brand-500 disabled:bg-slate-100 disabled:text-slate-400',
  outline:
    'bg-transparent border border-brand-600 text-brand-600 hover:bg-brand-50 active:bg-brand-100 focus-visible:ring-brand-500 disabled:border-slate-300 disabled:text-slate-400',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-slate-400 disabled:text-slate-300',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm focus-visible:ring-rose-500 disabled:bg-rose-300',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm focus-visible:ring-emerald-500 disabled:bg-emerald-300',
};

const sizes = {
  sm: 'text-xs px-2.5 py-1.5 gap-1.5 rounded-md font-medium',
  md: 'text-sm px-4 py-2 gap-2 rounded-lg font-medium',
  lg: 'text-base px-5 py-2.5 gap-2.5 rounded-xl font-semibold',
};

export const Button = React.forwardRef(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      iconLeft: IconLeft,
      iconRight: IconRight,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-150 select-none cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-70',
          variants[variant] || variants.primary,
          sizes[size] || sizes.md,
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {!isLoading && IconLeft && <IconLeft className="w-4 h-4 shrink-0" />}
        <span>{children}</span>
        {!isLoading && IconRight && <IconRight className="w-4 h-4 shrink-0" />}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
