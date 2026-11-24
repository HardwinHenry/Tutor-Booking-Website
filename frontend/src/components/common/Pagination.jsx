import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';
import { cn } from '../../utils/cn';

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems,
  onPageChange,
  className,
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisiblePages = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3',
        className
      )}
    >
      {totalItems !== undefined && (
        <span className="text-xs text-slate-500">
          Hiển thị trang <span className="font-semibold">{currentPage}</span> /{' '}
          <span className="font-semibold">{totalPages}</span> (Tổng cộng{' '}
          <span className="font-semibold">{totalItems}</span> bản ghi)
        </span>
      )}

      <div className="flex items-center space-x-1">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Trang trước"
          className="p-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="w-8 h-8 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              1
            </button>
            {startPage > 2 && <span className="text-slate-400 px-1 text-xs">...</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              'w-8 h-8 rounded-lg text-xs font-semibold transition-colors',
              p === currentPage
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'
            )}
          >
            {p}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="text-slate-400 px-1 text-xs">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="w-8 h-8 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              {totalPages}
            </button>
          </>
        )}

        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Trang sau"
          className="p-1.5"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default Pagination;
