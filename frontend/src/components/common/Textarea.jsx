import React from 'react';
import { cn } from '../../utils/cn';

export const Textarea = React.forwardRef(
  (
    {
      label,
      helperText,
      error,
      rows = 4,
      className,
      id,
      name,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const textareaId = id || name;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          name={name}
          rows={rows}
          disabled={disabled}
          className={cn(
            'block w-full rounded-lg border text-sm transition-all duration-150',
            'py-2 px-3 bg-white text-slate-900 placeholder:text-slate-400 resize-y',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            'disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed',
            error
              ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500 text-rose-900 placeholder:text-rose-300'
              : 'border-slate-300',
            className
          )}
          {...props}
        />

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
