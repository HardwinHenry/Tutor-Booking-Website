import React from 'react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(
  (
    {
      label,
      helperText,
      error,
      prefixIcon: PrefixIcon,
      suffixIcon: SuffixIcon,
      className,
      id,
      name,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || name;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}

        <div className="relative rounded-lg shadow-sm">
          {PrefixIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <PrefixIcon className="w-4 h-4" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            disabled={disabled}
            className={cn(
              'block w-full rounded-lg border text-sm transition-all duration-150',
              'py-2 px-3 bg-white text-slate-900 placeholder:text-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
              'disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed',
              PrefixIcon && 'pl-9',
              SuffixIcon && 'pr-9',
              error
                ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500 text-rose-900 placeholder:text-rose-300'
                : 'border-slate-300',
              className
            )}
            {...props}
          />

          {SuffixIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <SuffixIcon className="w-4 h-4" />
            </div>
          )}
        </div>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
