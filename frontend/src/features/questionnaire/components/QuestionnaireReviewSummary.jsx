import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Edit3,
  BookOpen,
  Sparkles,
  Calendar,
  DollarSign,
  HeartHandshake,
  Check,
} from 'lucide-react';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';

/**
 * Helper to get readable label from ID or object list
 */
function getLabel(val, list = []) {
  if (!val) return 'Chưa chọn';
  const item = list.find((opt) => String(opt.id ?? opt._id ?? opt.value) === String(val));
  return item ? item.name || item.label || item.title : String(val);
}

function getLabels(values = [], list = []) {
  if (!Array.isArray(values) || values.length === 0) return [];
  return values.map((v) => getLabel(v, list)).filter(Boolean);
}

/**
 * Step 6: Confirmation & Review Screen before final submission
 */
export function QuestionnaireReviewSummary({
  form,
  optionsData = {},
  isOfflineSelected = false,
  onEditSection,
  missingQuestions = [],
  isAllValid = false,
}) {
  const {
    categories = [],
    subjects = [],
    topics = [],
    purposes = [],
    levels = [],
    targetDurationOptions = [],
    teachingMethods = [],
    paceOptions = [],
    classFormatOptions = [],
    teachingStyles = [],
    materials = [],
    interactionLevels = [],
    timeBands = [],
    weekdayOptions = [],
    sessionsPerWeekOptions = [],
    durationMinutesOptions = [],
    modes = [],
    offlineLocations = [],
    budgetRangeOptions = [],
    priorities = [],
    experienceRangeOptions = [],
    certificateRequirementOptions = [],
    difficulties = [],
    supportTypes = [],
    progressTracking = [],
  } = optionsData;

  const reviewSections = [
    {
      index: 0,
      title: '1. Lĩnh vực, Môn học & Mục tiêu',
      range: 'Q1 – Q8',
      icon: BookOpen,
      items: [
        { q: 'Q1. Lĩnh vực chính', value: getLabel(form.learning?.categoryId, categories) },
        { q: 'Q2. Môn học / Ngôn ngữ', values: getLabels(form.learning?.subjectIds, subjects) },
        { q: 'Q3. Chuyên môn sâu', values: getLabels(form.learning?.topicIds, topics) },
        { q: 'Q4. Mục đích học tập', values: getLabels(form.learning?.purposes, purposes) },
        { q: 'Q5. Trình độ hiện tại', value: getLabel(form.learning?.currentLevel, levels) },
        { q: 'Q6. Trình độ mong muốn', value: getLabel(form.learning?.targetLevel, levels) },
        {
          q: 'Q7. Mục tiêu cụ thể',
          value: form.learning?.goalText?.trim() || '(Không điền - Không bắt buộc)',
        },
        {
          q: 'Q8. Thời gian kỳ vọng',
          value: getLabel(form.learning?.targetDuration, targetDurationOptions),
        },
      ],
    },
    {
      index: 1,
      title: '2. Phương pháp & Phong cách học',
      range: 'Q9 – Q14',
      icon: Sparkles,
      items: [
        { q: 'Q9. Phương pháp yêu thích', values: getLabels(form.learningStyle?.methods, teachingMethods) },
        { q: 'Q10. Tốc độ học tập', value: getLabel(form.learningStyle?.pace, paceOptions) },
        { q: 'Q11. Hình thức lớp học', value: getLabel(form.learningStyle?.classFormat, classFormatOptions) },
        {
          q: 'Q12. Phong cách gia sư kỳ vọng',
          values: getLabels(form.learningStyle?.preferredTutorStyles, teachingStyles),
        },
        { q: 'Q13. Tài liệu học tập', values: getLabels(form.learningStyle?.materials, materials) },
        {
          q: 'Q14. Mức độ tương tác',
          value: getLabel(form.learningStyle?.interactionLevel, interactionLevels),
        },
      ],
    },
    {
      index: 2,
      title: '3. Thời gian & Lịch học mong muốn',
      range: 'Q15 – Q18',
      icon: Calendar,
      items: [
        { q: 'Q15. Khung giờ rảnh trong ngày', values: getLabels(form.schedulePreferences?.timeBands, timeBands) },
        {
          q: 'Q16. Các ngày trong tuần',
          values: getLabels(form.schedulePreferences?.weekdays, weekdayOptions),
        },
        {
          q: 'Q17. Số buổi mỗi tuần',
          value: getLabel(form.schedulePreferences?.sessionsPerWeek, sessionsPerWeekOptions),
        },
        {
          q: 'Q18. Thời lượng mỗi buổi',
          values: getLabels(form.schedulePreferences?.durationMinutes, durationMinutesOptions),
        },
      ],
    },
    {
      index: 3,
      title: '4. Hình thức, Ngân sách & Tiêu chuẩn Tutor',
      range: 'Q19 – Q24',
      icon: DollarSign,
      items: [
        { q: 'Q19. Hình thức học', values: getLabels(form.constraints?.modes, modes) },
        ...(isOfflineSelected
          ? [
              {
                q: 'Q20. Địa điểm học Offline',
                values: getLabels(form.constraints?.offlineLocations, offlineLocations),
              },
            ]
          : [
              {
                q: 'Q20. Địa điểm học Offline',
                value: 'Không áp dụng (Không chọn học Offline)',
              },
            ]),
        {
          q: 'Q21. Mức học phí dự kiến',
          value: getLabel(form.constraints?.budgetRangeId, budgetRangeOptions),
        },
        {
          q: 'Q22. Tiêu chí chọn gia sư ưu tiên',
          values: getLabels(form.tutorRequirements?.selectionPriorities, priorities),
        },
        {
          q: 'Q23. Kinh nghiệm gia sư',
          value: getLabel(form.tutorRequirements?.experienceRange, experienceRangeOptions),
        },
        {
          q: 'Q24. Yêu cầu bằng cấp / chứng chỉ',
          value: getLabel(
            form.tutorRequirements?.certificateRequirement,
            certificateRequirementOptions
          ),
        },
      ],
    },
    {
      index: 4,
      title: '5. Cá nhân hóa & Nhu cầu hỗ trợ',
      range: 'Q25 – Q28',
      icon: HeartHandshake,
      items: [
        {
          q: 'Q25. Khó khăn lớn nhất khi học',
          values: getLabels(form.supportNeeds?.difficulties, difficulties),
        },
        {
          q: 'Q26. Hoạt động cần gia sư hỗ trợ',
          values: getLabels(form.supportNeeds?.desiredSupport, supportTypes),
        },
        {
          q: 'Q27. Cách theo dõi tiến độ',
          value: getLabel(form.supportNeeds?.progressTracking, progressTracking),
        },
        {
          q: 'Q28. Ghi chú thêm cho gia sư',
          value: form.additionalNote?.trim() || '(Không có ghi chú thêm - Không bắt buộc)',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner top */}
      {isAllValid ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-3 text-xs text-emerald-900 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-emerald-950">
              Tuyệt vời! Bạn đã hoàn thành đầy đủ câu hỏi khảo sát 🎉
            </p>
            <p className="mt-1 text-emerald-700 leading-relaxed">
              Vui lòng kiểm tra lại các thông tin tổng kết bên dưới. Khi đã hài lòng, bạn hãy nhấn nút{' '}
              <strong>"Hoàn thành khảo sát"</strong> ở thanh thao tác cuối trang để hệ thống kích hoạt hồ sơ học tập và mở quyền truy cập hệ thống.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3 text-xs text-amber-900 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-sm text-amber-950">
              Còn một số câu hỏi bắt buộc chưa hoàn thành
            </p>
            <p className="mt-1 text-amber-700">
              Vui lòng bổ sung câu trả lời cho các câu hỏi sau trước khi có thể nộp khảo sát:
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {missingQuestions.map((mq, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onEditSection?.(mq.sectionIndex)}
                  className="px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-semibold text-[11px] flex items-center space-x-1 transition-colors"
                >
                  <span>{mq.id}: {mq.title}</span>
                  <Edit3 className="w-3 h-3 ml-1 text-amber-800" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Structured Review Cards */}
      <div className="space-y-4">
        {reviewSections.map((sec) => {
          const Icon = sec.icon;
          return (
            <div
              key={sec.index}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{sec.title}</h3>
                    <span className="text-[11px] text-slate-400 font-medium">{sec.range}</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditSection?.(sec.index)}
                  iconLeft={Edit3}
                  className="text-brand-600 hover:text-brand-700 hover:bg-brand-50 text-xs"
                >
                  Chỉnh sửa
                </Button>
              </div>

              {/* Items grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                {sec.items.map((item, iIdx) => (
                  <div
                    key={iIdx}
                    className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex flex-col justify-between"
                  >
                    <span className="text-[11px] font-semibold text-slate-500 mb-1">
                      {item.q}
                    </span>

                    {item.values ? (
                      item.values.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                          {item.values.map((v, vIdx) => (
                            <span
                              key={vIdx}
                              className="inline-flex items-center px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200/60 font-semibold text-[11px]"
                            >
                              <Check className="w-3 h-3 mr-1 text-brand-600" />
                              {v}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-rose-600 font-semibold italic text-[11px]">
                          Chưa trả lời (Bắt buộc)
                        </span>
                      )
                    ) : (
                      <span
                        className={`font-semibold text-xs mt-0.5 ${
                          item.value === 'Chưa chọn'
                            ? 'text-rose-600 italic'
                            : 'text-slate-800'
                        }`}
                      >
                        {item.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default QuestionnaireReviewSummary;
