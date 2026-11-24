import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export function LoadingSpinner({ size = 'md', className }) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <Loader2
      className={cn(
        'animate-spin text-brand-600',
        sizeMap[size] || sizeMap.md,
        className
      )}
    />
  );
}

export function LoadingState({
  message = 'Đang tải dữ liệu...',
  description,
  fullPage = false,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        fullPage ? 'min-h-[60vh]' : 'py-12',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
        <LoadingSpinner size="md" />
      </div>
      <p className="text-sm font-semibold text-slate-800">{message}</p>
      {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
    </div>
  );
}

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200/80', className)}
      {...props}
    />
  );
}

export default LoadingState;
