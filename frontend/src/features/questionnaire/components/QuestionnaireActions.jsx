import React from 'react';
import { ArrowLeft, ArrowRight, Save, CheckCircle2 } from 'lucide-react';
import Button from '../../../components/common/Button';

/**
 * Bottom Action Bar for Stepper
 */
export function QuestionnaireActions({
  currentSectionIndex = 0,
  totalSections = 6,
  onPrevious,
  onNext,
  onSaveDraft,
  onSubmit,
  isSavingDraft = false,
  isSubmitting = false,
  submitLabel = 'Hoàn thành khảo sát',
  nextLabel = 'Tiếp theo',
  prevLabel = 'Câu trước',
}) {
  const isFirstStep = currentSectionIndex === 0;
  const isLastStep = currentSectionIndex === totalSections - 1;

  return (
    <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Left button: Previous step */}
      <div className="w-full sm:w-auto">
        <Button
          type="button"
          variant="outline"
          size="md"
          disabled={isFirstStep || isSavingDraft || isSubmitting}
          onClick={onPrevious}
          iconLeft={ArrowLeft}
          className="w-full sm:w-auto"
        >
          {prevLabel}
        </Button>
      </div>

      {/* Center button: Save draft */}
      <div className="w-full sm:w-auto order-last sm:order-none">
        <Button
          type="button"
          variant="secondary"
          size="md"
          isLoading={isSavingDraft}
          disabled={isSubmitting}
          onClick={onSaveDraft}
          iconLeft={Save}
          className="w-full sm:w-auto"
        >
          Lưu tạm câu trả lời
        </Button>
      </div>

      {/* Right button: Next step or Submit */}
      <div className="w-full sm:w-auto">
        {isLastStep ? (
          <Button
            type="button"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            disabled={isSavingDraft}
            onClick={onSubmit}
            iconRight={CheckCircle2}
            className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20"
          >
            {submitLabel}
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={isSavingDraft || isSubmitting}
            onClick={onNext}
            iconRight={ArrowRight}
            className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white"
          >
            {nextLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export default QuestionnaireActions;
