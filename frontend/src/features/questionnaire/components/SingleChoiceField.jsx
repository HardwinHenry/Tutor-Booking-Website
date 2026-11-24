import React from 'react';
import { Check } from 'lucide-react';

/**
 * Single Choice Option Selector
 * Renders options as clickable radio chips / cards
 */
export function SingleChoiceField({
  options = [],
  value = null,
  onChange,
  disabled = false,
  columns = 2,
}) {
  const gridColsClass =
    columns === 1
      ? 'grid-cols-1'
      : columns === 3
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      : columns === 4
      ? 'grid-cols-2 sm:grid-cols-4'
      : 'grid-cols-1 sm:grid-cols-2';

  return (
    <div className={`grid gap-2.5 ${gridColsClass}`}>
      {options.map((option) => {
        const optionId = option.id ?? option._id ?? option.value;
        const optionLabel = option.name ?? option.label ?? option.title;
        const optionDesc = option.description ?? option.sublabel;
        const isSelected = String(value) === String(optionId);

        return (
          <button
            key={String(optionId)}
            type="button"
            disabled={disabled}
            onClick={() => onChange(optionId)}
            className={`flex items-start text-left p-3 rounded-xl border transition-all text-xs select-none ${
              isSelected
                ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20 text-brand-950 font-semibold shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div
              className={`w-4 h-4 rounded-full mt-0.5 mr-2.5 flex items-center justify-center shrink-0 border transition-all ${
                isSelected
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300 bg-white'
              }`}
            >
              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>

            <div className="flex-1 min-w-0">
              <span className="block leading-snug break-words">{optionLabel}</span>
              {optionDesc && (
                <span className="block text-[11px] font-normal text-slate-500 mt-0.5 leading-tight">
                  {optionDesc}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default SingleChoiceField;
