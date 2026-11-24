import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export function SearchBar({
  value,
  onChange,
  onSearch,
  onClear,
  placeholder = 'Tìm kiếm gia sư, môn học, kỹ năng...',
  className,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.(value);
  };

  return (
    <form onSubmit={handleSubmit} className={cn('relative w-full', className)}>
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-sm transition-all"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange?.('');
              onClear?.();
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </form>
  );
}

export default SearchBar;
