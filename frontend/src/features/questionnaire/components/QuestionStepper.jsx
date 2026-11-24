import React from 'react';
import { Check, CheckCircle2 } from 'lucide-react';

/**
 * Question Stepper and Progress Bar
 */
export function QuestionStepper({
  sections = [],
  currentSectionIndex = 0,
  onSelectSection,
  progressPercentage = 0,
  answeredCount = 0,
  totalQuestions = 28,
  lastSavedAt = null,
  isSaving = false,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      {/* Top row: Stats and Draft Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div>
          <span className="font-bold text-slate-800 text-sm">Tiến độ hoàn thành: </span>
          <span className="font-extrabold text-brand-600 text-sm">{progressPercentage}%</span>
          <span className="text-slate-400 ml-1.5 font-medium">
            ({answeredCount}/{totalQuestions} câu hỏi đã trả lời)
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[11px] text-slate-500">
          {isSaving ? (
            <span className="inline-flex items-center text-brand-600 font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-brand-500 mr-1.5"></span>
              Đang lưu nháp...
            </span>
          ) : lastSavedAt ? (
            <span className="inline-flex items-center text-slate-400">
              <Check className="w-3.5 h-3.5 text-emerald-500 mr-1" />
              Đã lưu nháp lúc {lastSavedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : (
            <span className="text-slate-400">Hỗ trợ tự động lưu bản nháp</span>
          )}
        </div>
      </div>

      {/* Progress track */}
      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Horizontal Stepper Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-100">
        {sections.map((section, idx) => {
          const isActive = idx === currentSectionIndex;
          const isCompleted = section.isCompleted;

          return (
            <button
              key={section.id || idx}
              type="button"
              onClick={() => onSelectSection?.(idx)}
              className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                isActive
                  ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20 shadow-xs'
                  : isCompleted
                  ? 'border-emerald-200 bg-emerald-50/30 text-slate-700 hover:border-emerald-300'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-brand-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Phần {idx + 1}
                </span>
                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <p
                className={`text-xs font-semibold line-clamp-1 ${
                  isActive ? 'text-brand-900' : 'text-slate-700'
                }`}
                title={section.title}
              >
                {section.title}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {section.range}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default QuestionStepper;
