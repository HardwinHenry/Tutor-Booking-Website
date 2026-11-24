import React from 'react';
import { cn } from '../../utils/cn';

export const Select = React.forwardRef(
  (
    {
      label,
      helperText,
      error,
      options = [],
      placeholder = 'Chọn một lựa chọn...',
      className,
      id,
      name,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id || name;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          name={name}
          disabled={disabled}
          className={cn(
            'block w-full rounded-lg border text-sm transition-all duration-150',
            'py-2 px-3 bg-white text-slate-900',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            'disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed',
            error
              ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500 text-rose-900'
              : 'border-slate-300',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => {
            const value = typeof opt === 'object' ? opt.value : opt;
            const text = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={value} value={value}>
                {text}
              </option>
            );
          })}
        </select>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
