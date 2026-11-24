import React from 'react';
import { Check } from 'lucide-react';

/**
 * Multiple Choice Option Selector with Max Selections Support
 */
export function MultipleChoiceField({
  options = [],
  value = [],
  onChange,
  maxSelections = null,
  disabled = false,
  columns = 2,
}) {
  const currentValues = Array.isArray(value) ? value.map(String) : [];

  const handleToggle = (optionId) => {
    const stringId = String(optionId);
    const exists = currentValues.includes(stringId);

    if (exists) {
      onChange(value.filter((v) => String(v) !== stringId));
    } else {
      if (maxSelections && currentValues.length >= maxSelections) {
        return; // Max reached
      }
      onChange([...value, optionId]);
    }
  };

  const gridColsClass =
    columns === 1
      ? 'grid-cols-1'
      : columns === 3
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      : columns === 4
      ? 'grid-cols-2 sm:grid-cols-4'
      : 'grid-cols-1 sm:grid-cols-2';

  const reachedMax = maxSelections && currentValues.length >= maxSelections;

  return (
    <div className="space-y-2">
      {maxSelections && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-0.5">
          <span>
            Chọn tối đa <strong className="text-brand-600">{maxSelections}</strong> lựa chọn
          </span>
          <span
            className={`font-bold ${
              reachedMax ? 'text-amber-600' : 'text-slate-600'
            }`}
          >
            Đã chọn {currentValues.length}/{maxSelections}
          </span>
        </div>
      )}

      <div className={`grid gap-2.5 ${gridColsClass}`}>
        {options.map((option) => {
          const optionId = option.id ?? option._id ?? option.value;
          const optionLabel = option.name ?? option.label ?? option.title;
          const optionDesc = option.description ?? option.sublabel;
          const isSelected = currentValues.includes(String(optionId));
          const isOptionDisabled = disabled || (!isSelected && reachedMax);

          return (
            <button
              key={String(optionId)}
              type="button"
              disabled={isOptionDisabled}
              onClick={() => handleToggle(optionId)}
              className={`flex items-start text-left p-3 rounded-xl border transition-all text-xs select-none ${
                isSelected
                  ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20 text-brand-950 font-semibold shadow-xs'
                  : isOptionDisabled
                  ? 'border-slate-100 bg-slate-50/80 text-slate-400 cursor-not-allowed'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50/50 cursor-pointer'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-md mt-0.5 mr-2.5 flex items-center justify-center shrink-0 border transition-all ${
                  isSelected
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : isOptionDisabled
                    ? 'border-slate-200 bg-slate-100'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
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
    </div>
  );
}

export default MultipleChoiceField;
