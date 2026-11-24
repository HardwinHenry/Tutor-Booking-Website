import React from 'react';
import { cn } from '../../utils/cn';

export function RadioGroup({
  label,
  name,
  options = [],
  value,
  onChange,
  error,
  helperText,
  disabled,
  orientation = 'vertical',
}) {
  return (
    <fieldset className="w-full space-y-2">
      {label && (
        <legend className="text-xs font-semibold uppercase tracking-wider text-slate-700">
          {label}
        </legend>
      )}

      <div
        className={cn(
          'gap-3',
          orientation === 'horizontal' ? 'flex flex-wrap' : 'flex flex-col'
        )}
      >
        {options.map((opt) => {
          const optVal = typeof opt === 'object' ? opt.value : opt;
          const optLabel = typeof opt === 'object' ? opt.label : opt;
          const optDesc = typeof opt === 'object' ? opt.description : null;
          const isChecked = value === optVal;
          const inputId = `${name}-${optVal}`;

          return (
            <label
              key={optVal}
              htmlFor={inputId}
              className={cn(
                'flex items-start p-3 border rounded-xl cursor-pointer transition-all duration-150',
                isChecked
                  ? 'border-brand-500 bg-brand-50/40 text-brand-900 ring-1 ring-brand-500'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <input
                type="radio"
                id={inputId}
                name={name}
                value={optVal}
                checked={isChecked}
                onChange={() => onChange && onChange(optVal)}
                disabled={disabled}
                className="h-4 w-4 mt-0.5 text-brand-600 border-slate-300 focus:ring-brand-500 shrink-0"
              />
              <div className="ml-3 text-sm">
                <span className="font-medium">{optLabel}</span>
                {optDesc && <p className="text-xs text-slate-500 mt-0.5">{optDesc}</p>}
              </div>
            </label>
          );
        })}
      </div>

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-500">{helperText}</p>}
    </fieldset>
  );
}

export default RadioGroup;
