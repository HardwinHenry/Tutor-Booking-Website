import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Breadcrumb({ items = [], className }) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-xs text-slate-500', className)}>
      <ol className="flex items-center space-x-1.5 flex-wrap">
        <li>
          <Link
            to="/"
            className="flex items-center text-slate-400 hover:text-slate-700 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center space-x-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              {isLast || !item.to ? (
                <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="hover:text-brand-600 transition-colors truncate max-w-[200px]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
