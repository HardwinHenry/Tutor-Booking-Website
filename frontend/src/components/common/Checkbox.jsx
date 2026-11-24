import React from 'react';
import { cn } from '../../utils/cn';

export const Checkbox = React.forwardRef(
  (
    {
      label,
      description,
      error,
      className,
      id,
      name,
      checked,
      onChange,
      disabled,
      ...props
    },
    ref
  ) => {
    const checkboxId = id || name;

    return (
      <div className="flex items-start space-x-3">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            id={checkboxId}
            name={name}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className={cn(
              'h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500',
              'disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
              error && 'border-rose-400 text-rose-600 focus:ring-rose-500',
              className
            )}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="text-sm">
            {label && (
              <label
                htmlFor={checkboxId}
                className={cn(
                  'font-medium text-slate-800 cursor-pointer select-none',
                  disabled && 'cursor-not-allowed opacity-60'
                )}
              >
                {label}
              </label>
            )}
            {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
            {error && <p className="text-xs text-rose-600 font-medium mt-1">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
export default Checkbox;
