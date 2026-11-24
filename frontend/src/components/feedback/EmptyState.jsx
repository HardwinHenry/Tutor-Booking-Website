import React from 'react';
import { Inbox } from 'lucide-react';
import Button from '../common/Button';
import { cn } from '../../utils/cn';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'Không có dữ liệu',
  description = 'Hiện tại chưa có bản ghi hoặc thông tin nào để hiển thị.',
  actionText,
  onAction,
  actionIcon,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto my-6',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4 shadow-sm">
        <Icon className="w-7 h-7" />
      </div>

      <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 mb-6 leading-relaxed">{description}</p>

      {actionText && onAction && (
        <Button
          variant="primary"
          size="sm"
          iconLeft={actionIcon}
          onClick={onAction}
        >
          {actionText}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
