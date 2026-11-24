import React from 'react';
import { cn } from '../../utils/cn';

export function Card({
  title,
  subtitle,
  action,
  children,
  footer,
  className,
  headerClassName,
  bodyClassName,
  ...props
}) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all',
        className
      )}
      {...props}
    >
      {(title || subtitle || action) && (
        <div
          className={cn(
            'px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4',
            headerClassName
          )}
        >
          <div>
            {title && (
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className={cn('p-6', bodyClassName)}>{children}</div>

      {footer && (
        <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100">
          {footer}
        </div>
      )}
    </div>
  );
}

export default Card;
