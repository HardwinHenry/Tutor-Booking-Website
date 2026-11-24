import React from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * Question Card wrapper
 */
export function QuestionCard({
  questionId,
  title,
  subtitle,
  required = false,
  error = null,
  children,
  className = '',
}) {
  return (
    <div
      id={`question-${questionId}`}
      className={`bg-white rounded-2xl border p-5 transition-all shadow-xs space-y-3.5 ${
        error
          ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/10'
          : 'border-slate-200/90 hover:border-slate-300'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-black rounded-md bg-brand-50 text-brand-700 border border-brand-200/60 uppercase">
              {questionId}
            </span>
            <h3 className="text-sm font-bold text-slate-900 leading-snug">
              {title}
              {required && <span className="text-rose-500 ml-1 font-black">*</span>}
            </h3>
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 pl-0.5 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Question content / input */}
      <div className="pt-1">{children}</div>

      {/* Validation error message */}
      {error && (
        <p className="text-xs font-medium text-rose-600 flex items-center space-x-1 pt-1">
          <span>•</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export default QuestionCard;
