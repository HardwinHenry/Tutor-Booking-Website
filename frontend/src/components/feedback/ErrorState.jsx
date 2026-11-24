import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import Button from '../common/Button';
import { cn } from '../../utils/cn';

export function ErrorState({
  title = 'Đã có lỗi xảy ra',
  message = 'Không thể tải được dữ liệu hoặc có lỗi phát sinh trong quá trình xử lý.',
  onRetry,
  retryText = 'Thử lại',
  statusCode,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-6',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 shadow-sm ring-8 ring-rose-50/50">
        <AlertCircle className="w-7 h-7" />
      </div>

      {statusCode && (
        <span className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-1">
          Lỗi {statusCode}
        </span>
      )}

      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 mb-6">{message}</p>

      {onRetry && (
        <Button
          variant="secondary"
          size="md"
          iconLeft={RotateCcw}
          onClick={onRetry}
        >
          {retryText}
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
