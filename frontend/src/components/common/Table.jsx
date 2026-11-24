import React from 'react';
import { cn } from '../../utils/cn';

export function Table({
  columns = [],
  data = [],
  renderRow,
  emptyMessage = 'Không có dữ liệu',
  isLoading = false,
  className,
}) {
  return (
    <div className={cn('w-full overflow-x-auto rounded-xl border border-slate-200 bg-white', className)}>
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                scope="col"
                className={cn(
                  'px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-600',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải dữ liệu...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : renderRow ? (
            data.map((item, index) => renderRow(item, index))
          ) : (
            data.map((row, rIdx) => (
              <tr key={row._id || row.id || rIdx} className="hover:bg-slate-50/70 transition-colors">
                {columns.map((col, cIdx) => (
                  <td
                    key={col.key || cIdx}
                    className={cn(
                      'px-4 py-3 text-slate-700 whitespace-nowrap',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center'
                    )}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
