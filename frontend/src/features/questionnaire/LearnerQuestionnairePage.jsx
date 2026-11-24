import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { questionnaireService } from '../../services/questionnaire.service';
import { learnerService } from '../../services/learner.service';
import { taxonomyService } from '../../services/taxonomy.service';
import {
  getInitialLearnerFormState,
  mapBackendToLearnerForm,
  calculateLearnerProgress,
} from './utils/learnerFormMapper';
import QuestionStepper from './components/QuestionStepper';
import QuestionCard from './components/QuestionCard';
import SingleChoiceField from './components/SingleChoiceField';
import MultipleChoiceField from './components/MultipleChoiceField';
import CascadingTaxonomySelector from './components/CascadingTaxonomySelector';
import QuestionnaireActions from './components/QuestionnaireActions';
import QuestionnaireReviewSummary from './components/QuestionnaireReviewSummary';
import LoadingState from '../../components/feedback/LoadingState';
import Textarea from '../../components/common/Textarea';
import Input from '../../components/common/Input';
import { toast } from '../../components/feedback/ToastProvider';
import { useAuthStore } from '../../store/useAuthStore';
import { storage } from '../../utils/storage';

export function LearnerQuestionnairePage() {
  const navigate = useNavigate();
  const { user, setSurveyStatus } = useAuthStore();

  const draftKey = `tc_learner_draft_${user?._id || user?.id || 'learner'}`;

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [form, setForm] = useState(getInitialLearnerFormState());
  const [errors, setErrors] = useState({});
  const [completionStatus, setCompletionStatus] = useState('not_started');

  // Metadata & Options fetched from Backend
  const [rawQuestions, setRawQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [purposes, setPurposes] = useState([]);
  const [levels, setLevels] = useState([]);
  const [teachingMethods, setTeachingMethods] = useState([]);
  const [teachingStyles, setTeachingStyles] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [interactionLevels, setInteractionLevels] = useState([]);
  const [timeBands, setTimeBands] = useState([]);
  const [modes, setModes] = useState([]);
  const [offlineLocations, setOfflineLocations] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [difficulties, setDifficulties] = useState([]);
  const [supportTypes, setSupportTypes] = useState([]);
  const [progressTracking, setProgressTracking] = useState([]);

  // Save local draft to prevent data loss on reload / disconnection
  const saveLocalDraft = useCallback(
    (formData) => {
      try {
        storage.set(draftKey, {
          form: formData,
          savedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Lỗi khi lưu nháp localStorage:', err);
      }
    },
    [draftKey]
  );

  // Fetch questionnaire schema and user's saved preference
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const [qRes, pref, allTaxonomies] = await Promise.all([
          questionnaireService.getQuestionnaire('learner'),
          learnerService.getMyPreference(true).catch(() => null),
          taxonomyService.getTaxonomies({ active: true }).catch(() => []),
        ]);

        if (!isMounted) return;

        setRawQuestions(qRes?.questions || []);

        // Filter root taxonomies
        setCategories(allTaxonomies.filter((t) => t.type === 'category' && !t.parentId));
        setPurposes(allTaxonomies.filter((t) => t.type === 'learning_purpose'));
        setLevels(allTaxonomies.filter((t) => t.type === 'level').sort((a, b) => a.sortOrder - b.sortOrder));
        setTeachingMethods(allTaxonomies.filter((t) => t.type === 'teaching_method'));
        setTeachingStyles(allTaxonomies.filter((t) => t.type === 'teaching_style'));
        setMaterials(allTaxonomies.filter((t) => t.type === 'learning_material'));
        setInteractionLevels(allTaxonomies.filter((t) => t.type === 'interaction_level'));
        setTimeBands(allTaxonomies.filter((t) => t.type === 'time_band'));
        setModes(allTaxonomies.filter((t) => t.type === 'learning_mode'));
        setOfflineLocations(allTaxonomies.filter((t) => t.type === 'offline_location'));
        setPriorities(allTaxonomies.filter((t) => t.type === 'selection_priority'));
        setDifficulties(allTaxonomies.filter((t) => t.type === 'learning_difficulty'));
        setSupportTypes(allTaxonomies.filter((t) => t.type === 'support_type'));
        setProgressTracking(allTaxonomies.filter((t) => t.type === 'progress_tracking'));

        // Load existing preference or restore from local draft
        const localDraft = storage.get(draftKey, null);
        const backendStatus = pref?.completionStatus || 'not_started';
        setCompletionStatus(backendStatus);

        if (backendStatus === 'completed') {
          // Already completed: use backend data
          if (pref) {
            setForm(mapBackendToLearnerForm(pref));
            if (pref.updatedAt) setLastSavedAt(new Date(pref.updatedAt));
          }
        } else {
          // Uncompleted: check if local draft has more answers
          const backendForm = pref ? mapBackendToLearnerForm(pref) : getInitialLearnerFormState();
          const localForm = localDraft?.form;

          if (localForm) {
            const localProgress = calculateLearnerProgress(localForm);
            const backendProgress = calculateLearnerProgress(backendForm);

            if (localProgress.answered >= backendProgress.answered && localProgress.answered > 0) {
              setForm(localForm);
              if (localDraft.savedAt) setLastSavedAt(new Date(localDraft.savedAt));
              toast.info('Đã tự động khôi phục câu trả lời bạn đã lưu tạm trước đó.');
            } else {
              setForm(backendForm);
              if (pref?.updatedAt) setLastSavedAt(new Date(pref.updatedAt));
            }
          } else {
            setForm(backendForm);
            if (pref?.updatedAt) setLastSavedAt(new Date(pref.updatedAt));
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải bảng câu hỏi:', err);
        toast.error('Không thể tải bộ câu hỏi khảo sát. Vui lòng thử lại sau.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [draftKey]);

  // Determine if offline questions are required based on selected modes
  const isOfflineSelected = useMemo(() => {
    if (!form.constraints.modes || form.constraints.modes.length === 0) return false;
    const selectedModeObjs = modes.filter((m) =>
      form.constraints.modes.includes(m._id || m.id)
    );
    return selectedModeObjs.some(
      (m) => m.slug === 'offline' || m.slug === 'hybrid'
    );
  }, [form.constraints.modes, modes]);

  // Calculate answered count and progress percentage
  const { answered, total, percentage } = useMemo(() => {
    return calculateLearnerProgress(form, isOfflineSelected);
  }, [form, isOfflineSelected]);

  // Field updater with auto local saving and error clearing
  const updateField = (section, field, value) => {
    setForm((prev) => {
      const next = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      };
      saveLocalDraft(next);
      return next;
    });

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const updateAdditionalNote = (text) => {
    setForm((prev) => {
      const next = { ...prev, additionalNote: text };
      saveLocalDraft(next);
      return next;
    });
  };

  // Fixed question options
  const targetDurationOptions = [
    { id: 'under_1_month', label: 'Dưới 1 tháng' },
    { id: '1_3_months', label: '1–3 tháng' },
    { id: '3_6_months', label: '3–6 tháng' },
    { id: '6_12_months', label: '6–12 tháng' },
    { id: 'over_1_year', label: 'Trên 1 năm' },
    { id: 'no_deadline', label: 'Không có thời hạn cụ thể' },
  ];

  const paceOptions = [
    { id: 'slow_detailed', label: 'Chậm, giải thích kỹ', description: 'Đi sâu vào bản chất từng khái niệm' },
    { id: 'moderate', label: 'Vừa phải', description: 'Cân bằng giữa lý thuyết và thực hành' },
    { id: 'fast', label: 'Nhanh', description: 'Tập trung vào trọng tâm và luyện đề' },
    { id: 'flexible', label: 'Linh hoạt', description: 'Tùy biến theo năng lực tiếp thu từng buổi' },
  ];

  const classFormatOptions = [
    { id: 'one_to_one', label: '1–1 (Kèm riêng)', description: 'Tối đa tương tác và lộ trình chuyên biệt' },
    { id: 'small_group', label: 'Nhóm nhỏ (2–5 bạn)', description: 'Học hỏi và thảo luận cùng bạn học' },
    { id: 'large_group', label: 'Nhóm lớn', description: 'Tiết kiệm chi phí, theo lớp đông' },
    { id: 'any', label: 'Không quan trọng', description: 'Phù hợp với mọi quy mô lớp' },
  ];

  const weekdayOptions = [
    { id: 1, label: 'Thứ 2' },
    { id: 2, label: 'Thứ 3' },
    { id: 3, label: 'Thứ 4' },
    { id: 4, label: 'Thứ 5' },
    { id: 5, label: 'Thứ 6' },
    { id: 6, label: 'Thứ 7' },
    { id: 0, label: 'Chủ nhật' },
  ];

  const sessionsPerWeekOptions = [
    { id: 1, label: '1 buổi / tuần' },
    { id: 2, label: '2 buổi / tuần' },
    { id: 3, label: '3 buổi / tuần' },
    { id: 4, label: '4 buổi / tuần' },
    { id: 5, label: '5+ buổi / tuần' },
  ];

  const durationMinutesOptions = [
    { id: 30, label: '30 phút' },
    { id: 60, label: '60 phút (1 tiếng)' },
    { id: 90, label: '90 phút (1.5 tiếng)' },
    { id: 120, label: '120 phút (2 tiếng)' },
    { id: 'flexible', label: 'Linh hoạt theo buổi' },
  ];

  const budgetRangeOptions = [
    { id: 'under_50k', label: 'Dưới 50.000đ / buổi', description: 'Ngân sách tiết kiệm' },
    { id: '50k_100k', label: '50.000đ – 100.000đ / buổi', description: 'Phổ thông cơ bản' },
    { id: '100k_200k', label: '100.000đ – 200.000đ / buổi', description: 'Phổ biến tiêu chuẩn' },
    { id: '200k_300k', label: '200.000đ – 300.000đ / buổi', description: 'Chất lượng nâng cao' },
    { id: 'over_300k', label: 'Trên 300.000đ / buổi', description: 'Gia sư chuyên gia / Luyện thi cấp tốc' },
  ];

  const experienceRangeOptions = [
    { id: 'no_preference', label: 'Không quan trọng' },
    { id: 'beginner', label: 'Người mới đi dạy (Nhiệt huyết, học phí tốt)' },
    { id: '1_2_years', label: '1–2 năm kinh nghiệm' },
    { id: '3_5_years', label: '3–5 năm kinh nghiệm' },
    { id: 'over_5_years', label: 'Trên 5 năm kinh nghiệm (Dày dạn, uy tín)' },
  ];

  const certificateRequirementOptions = [
    { id: 'not_required', label: 'Không yêu cầu' },
    { id: 'nice_to_have', label: 'Có thì tốt' },
    { id: 'preferred', label: 'Ưu tiên có chứng chỉ liên quan' },
    { id: 'required', label: 'Bắt buộc phải có bằng cấp / chứng chỉ chuyên môn' },
  ];

  // Sections configuration including Step 6: Confirmation Review
  const sections = useMemo(
    () => [
      {
        id: 'domain_needs',
        title: 'Lĩnh vực & Mục tiêu',
        range: 'Q1 – Q8',
        isCompleted:
          !!form.learning.categoryId &&
          form.learning.subjectIds.length > 0 &&
          form.learning.topicIds.length > 0 &&
          form.learning.purposes.length > 0 &&
          !!form.learning.currentLevel &&
          !!form.learning.targetLevel &&
          !!form.learning.targetDuration,
      },
      {
        id: 'learning_style',
        title: 'Phương pháp & Phong cách',
        range: 'Q9 – Q14',
        isCompleted:
          form.learningStyle.methods.length > 0 &&
          !!form.learningStyle.pace &&
          !!form.learningStyle.classFormat &&
          form.learningStyle.preferredTutorStyles.length > 0 &&
          form.learningStyle.materials.length > 0 &&
          !!form.learningStyle.interactionLevel,
      },
      {
        id: 'schedule',
        title: 'Thời gian học tập',
        range: 'Q15 – Q18',
        isCompleted:
          form.schedulePreferences.timeBands.length > 0 &&
          form.schedulePreferences.weekdays.length > 0 &&
          !!form.schedulePreferences.sessionsPerWeek &&
          form.schedulePreferences.durationMinutes.length > 0,
      },
      {
        id: 'conditions_tutor',
        title: 'Hình thức & Tiêu chuẩn',
        range: 'Q19 – Q24',
        isCompleted:
          form.constraints.modes.length > 0 &&
          (!isOfflineSelected || form.constraints.offlineLocations.length > 0) &&
          !!form.constraints.budgetRangeId &&
          form.tutorRequirements.selectionPriorities.length > 0 &&
          !!form.tutorRequirements.experienceRange &&
          !!form.tutorRequirements.certificateRequirement,
      },
      {
        id: 'support_notes',
        title: 'Hỗ trợ & Cá nhân hóa',
        range: 'Q25 – Q28',
        isCompleted:
          form.supportNeeds.difficulties.length > 0 &&
          form.supportNeeds.desiredSupport.length > 0 &&
          !!form.supportNeeds.progressTracking,
      },
      {
        id: 'review_confirm',
        title: 'Xác nhận & Hoàn tất',
        range: 'Kiểm tra',
        badge: 'Xác nhận',
        isCompleted:
          !!form.learning.categoryId &&
          form.learning.subjectIds.length > 0 &&
          form.learning.topicIds.length > 0 &&
          form.learning.purposes.length > 0 &&
          !!form.learning.currentLevel &&
          !!form.learning.targetLevel &&
          !!form.learning.targetDuration &&
          form.learningStyle.methods.length > 0 &&
          !!form.learningStyle.pace &&
          !!form.learningStyle.classFormat &&
          form.learningStyle.preferredTutorStyles.length > 0 &&
          form.learningStyle.materials.length > 0 &&
          !!form.learningStyle.interactionLevel &&
          form.schedulePreferences.timeBands.length > 0 &&
          form.schedulePreferences.weekdays.length > 0 &&
          !!form.schedulePreferences.sessionsPerWeek &&
          form.schedulePreferences.durationMinutes.length > 0 &&
          form.constraints.modes.length > 0 &&
          (!isOfflineSelected || form.constraints.offlineLocations.length > 0) &&
          !!form.constraints.budgetRangeId &&
          form.tutorRequirements.selectionPriorities.length > 0 &&
          !!form.tutorRequirements.experienceRange &&
          !!form.tutorRequirements.certificateRequirement &&
          form.supportNeeds.difficulties.length > 0 &&
          form.supportNeeds.desiredSupport.length > 0 &&
          !!form.supportNeeds.progressTracking,
      },
    ],
    [form, isOfflineSelected]
  );

  // Per-section validation
  const validateSection = (sectionIndex) => {
    const errs = {};

    if (sectionIndex === 0) {
      if (!form.learning.categoryId) errs.categoryId = 'Vui lòng chọn 1 lĩnh vực chính';
      if (!form.learning.subjectIds.length) errs.subjectIds = 'Vui lòng chọn ít nhất 1 môn học';
      if (!form.learning.topicIds.length) errs.topicIds = 'Vui lòng chọn ít nhất 1 chuyên môn sâu';
      if (!form.learning.purposes.length) errs.purposes = 'Vui lòng chọn mục đích học tập';
      if (!form.learning.currentLevel) errs.currentLevel = 'Vui lòng chọn trình độ hiện tại của bạn';
      if (!form.learning.targetLevel) errs.targetLevel = 'Vui lòng chọn trình độ mục tiêu';
      if (!form.learning.targetDuration) errs.targetDuration = 'Vui lòng chọn thời gian kỳ vọng đạt mục tiêu';
    } else if (sectionIndex === 1) {
      if (!form.learningStyle.methods.length) errs.methods = 'Vui lòng chọn phương pháp học yêu thích';
      if (!form.learningStyle.pace) errs.pace = 'Vui lòng chọn tốc độ học phù hợp';
      if (!form.learningStyle.classFormat) errs.classFormat = 'Vui lòng chọn hình thức lớp học';
      if (!form.learningStyle.preferredTutorStyles.length) errs.preferredTutorStyles = 'Vui lòng chọn phong cách gia sư kỳ vọng';
      if (!form.learningStyle.materials.length) errs.materials = 'Vui lòng chọn tài liệu học tập yêu thích';
      if (!form.learningStyle.interactionLevel) errs.interactionLevel = 'Vui lòng chọn mức độ tương tác mong muốn';
    } else if (sectionIndex === 2) {
      if (!form.schedulePreferences.timeBands.length) errs.timeBands = 'Vui lòng chọn khung giờ bạn có thể học';
      if (!form.schedulePreferences.weekdays.length) errs.weekdays = 'Vui lòng chọn các ngày trong tuần';
      if (!form.schedulePreferences.sessionsPerWeek) errs.sessionsPerWeek = 'Vui lòng chọn số buổi học mỗi tuần';
      if (!form.schedulePreferences.durationMinutes.length) errs.durationMinutes = 'Vui lòng chọn thời lượng mỗi buổi';
    } else if (sectionIndex === 3) {
      if (!form.constraints.modes.length) errs.modes = 'Vui lòng chọn hình thức học';
      if (isOfflineSelected && !form.constraints.offlineLocations.length) {
        errs.offlineLocations = 'Vì bạn chọn hình thức Offline/Kết hợp, vui lòng chọn địa điểm học Offline';
      }
      if (!form.constraints.budgetRangeId) errs.budgetRangeId = 'Vui lòng chọn mức ngân sách dự kiến';
      if (!form.tutorRequirements.selectionPriorities.length) errs.selectionPriorities = 'Vui lòng chọn yếu tố ưu tiên khi chọn gia sư';
      if (!form.tutorRequirements.experienceRange) errs.experienceRange = 'Vui lòng chọn yêu cầu số năm kinh nghiệm';
      if (!form.tutorRequirements.certificateRequirement) errs.certificateRequirement = 'Vui lòng chọn yêu cầu chứng chỉ';
    } else if (sectionIndex === 4) {
      if (!form.supportNeeds.difficulties.length) errs.difficulties = 'Vui lòng chọn khó khăn bạn gặp phải';
      if (!form.supportNeeds.desiredSupport.length) errs.desiredSupport = 'Vui lòng chọn hoạt động bạn cần gia sư hỗ trợ';
      if (!form.supportNeeds.progressTracking) errs.progressTracking = 'Vui lòng chọn cách theo dõi tiến độ';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Find all missing required questions across all sections
  const getMissingRequiredQuestions = () => {
    const missing = [];
    if (!form.learning.categoryId) missing.push({ id: 'Q1', title: 'Lĩnh vực chính', sectionIndex: 0 });
    if (!form.learning.subjectIds.length) missing.push({ id: 'Q2', title: 'Môn học', sectionIndex: 0 });
    if (!form.learning.topicIds.length) missing.push({ id: 'Q3', title: 'Chuyên môn sâu', sectionIndex: 0 });
    if (!form.learning.purposes.length) missing.push({ id: 'Q4', title: 'Mục đích học tập', sectionIndex: 0 });
    if (!form.learning.currentLevel) missing.push({ id: 'Q5', title: 'Trình độ hiện tại', sectionIndex: 0 });
    if (!form.learning.targetLevel) missing.push({ id: 'Q6', title: 'Trình độ mong muốn', sectionIndex: 0 });
    if (!form.learning.targetDuration) missing.push({ id: 'Q8', title: 'Thời gian kỳ vọng', sectionIndex: 0 });

    if (!form.learningStyle.methods.length) missing.push({ id: 'Q9', title: 'Phương pháp học tập', sectionIndex: 1 });
    if (!form.learningStyle.pace) missing.push({ id: 'Q10', title: 'Tốc độ học tập', sectionIndex: 1 });
    if (!form.learningStyle.classFormat) missing.push({ id: 'Q11', title: 'Hình thức lớp học', sectionIndex: 1 });
    if (!form.learningStyle.preferredTutorStyles.length) missing.push({ id: 'Q12', title: 'Phong cách gia sư', sectionIndex: 1 });
    if (!form.learningStyle.materials.length) missing.push({ id: 'Q13', title: 'Tài liệu học tập', sectionIndex: 1 });
    if (!form.learningStyle.interactionLevel) missing.push({ id: 'Q14', title: 'Mức độ tương tác', sectionIndex: 1 });

    if (!form.schedulePreferences.timeBands.length) missing.push({ id: 'Q15', title: 'Khung giờ rảnh', sectionIndex: 2 });
    if (!form.schedulePreferences.weekdays.length) missing.push({ id: 'Q16', title: 'Các ngày trong tuần', sectionIndex: 2 });
    if (!form.schedulePreferences.sessionsPerWeek) missing.push({ id: 'Q17', title: 'Số buổi mỗi tuần', sectionIndex: 2 });
    if (!form.schedulePreferences.durationMinutes.length) missing.push({ id: 'Q18', title: 'Thời lượng mỗi buổi', sectionIndex: 2 });

    if (!form.constraints.modes.length) missing.push({ id: 'Q19', title: 'Hình thức học', sectionIndex: 3 });
    if (isOfflineSelected && !form.constraints.offlineLocations.length) {
      missing.push({ id: 'Q20', title: 'Địa điểm học Offline', sectionIndex: 3 });
    }
    if (!form.constraints.budgetRangeId) missing.push({ id: 'Q21', title: 'Mức ngân sách dự kiến', sectionIndex: 3 });
    if (!form.tutorRequirements.selectionPriorities.length) missing.push({ id: 'Q22', title: 'Tiêu chuẩn ưu tiên', sectionIndex: 3 });
    if (!form.tutorRequirements.experienceRange) missing.push({ id: 'Q23', title: 'Kinh nghiệm gia sư', sectionIndex: 3 });
    if (!form.tutorRequirements.certificateRequirement) missing.push({ id: 'Q24', title: 'Yêu cầu chứng chỉ', sectionIndex: 3 });

    if (!form.supportNeeds.difficulties.length) missing.push({ id: 'Q25', title: 'Khó khăn khi học', sectionIndex: 4 });
    if (!form.supportNeeds.desiredSupport.length) missing.push({ id: 'Q26', title: 'Hoạt động cần hỗ trợ', sectionIndex: 4 });
    if (!form.supportNeeds.progressTracking) missing.push({ id: 'Q27', title: 'Cách theo dõi tiến độ', sectionIndex: 4 });

    return missing;
  };

  const missingQuestions = getMissingRequiredQuestions();
  const isAllValid = missingQuestions.length === 0;

  // Handle "Tiếp theo" with validation
  const handleNext = async () => {
    if (currentSectionIndex < 5) {
      const isValid = validateSection(currentSectionIndex);
      if (!isValid) {
        toast.warning('Vui lòng trả lời các câu hỏi bắt buộc trước khi chuyển sang phần tiếp theo');
        window.scrollTo({ top: 180, behavior: 'smooth' });
        return;
      }

      // Save draft on section change
      saveLocalDraft(form);
      learnerService.updateMyPreference(form).catch(() => {});

      setCurrentSectionIndex((prev) => Math.min(sections.length - 1, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle "Câu trước"
  const handlePrevious = () => {
    setCurrentSectionIndex((prev) => Math.max(0, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save Draft manually
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    saveLocalDraft(form);
    try {
      const updated = await learnerService.updateMyPreference(form);
      setLastSavedAt(new Date());
      setCompletionStatus(updated?.completionStatus || 'in_progress');
      toast.success('Đã lưu tạm câu trả lời thành công!');
    } catch (err) {
      toast.warning('Đã lưu tạm trên thiết bị. Hệ thống sẽ đồng bộ khi có kết nối mạng ổn định.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Submit complete questionnaire
  const handleSubmit = async () => {
    const missing = getMissingRequiredQuestions();
    if (missing.length > 0) {
      toast.error(`Còn ${missing.length} câu hỏi bắt buộc chưa hoàn thành. Vui lòng kiểm tra lại.`);
      setCurrentSectionIndex(missing[0].sectionIndex);
      validateSection(missing[0].sectionIndex);
      window.scrollTo({ top: 180, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      await learnerService.completeMyPreference(form);
      storage.remove(draftKey);
      setCompletionStatus('completed');
      setSurveyStatus('completed');

      toast.success('Chúc mừng! Bạn đã hoàn tất khảo sát hồ sơ học tập 28 câu 🎉');
      navigate('/learner/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Không thể hoàn tất khảo sát. Vui lòng kiểm tra lại kết nối.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState fullPage message="Đang tải dữ liệu bộ câu hỏi khảo sát 28 mục..." />;
  }

  const isSurveyPending = completionStatus !== 'completed';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header Info */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-brand-600 uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Khảo sát đầu vào dành cho học viên</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Khám phá hồ sơ học tập của bạn
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl">
          Bộ khảo sát chuẩn hóa 28 câu hỏi giúp hệ thống phân tích năng lực, mục tiêu và phong cách học tập của bạn, từ đó đề xuất những gia sư phù hợp nhất.
        </p>
      </div>

      {/* Mandatory Notification Banner if Survey Not Completed */}
      {isSurveyPending ? (
        <div className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-start space-x-3 text-xs text-amber-900 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-950 text-sm">
              Khảo sát bắt buộc sau khi đăng ký tài khoản
            </p>
            <p className="text-amber-800 leading-relaxed">
              Bạn cần hoàn thành đầy đủ 28 câu hỏi khảo sát dưới đây để hệ thống kích hoạt hồ sơ học tập và mở khóa quyền truy cập vào trang chủ cùng các tính năng bên trong. Dữ liệu này đảm bảo thuật toán gợi ý gia sư chính xác và hiệu quả nhất cho bạn.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-3 text-xs text-emerald-800 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-emerald-900 text-sm">Hồ sơ khảo sát của bạn đã hoàn tất!</p>
            <p className="mt-0.5 text-emerald-700">
              Bạn có thể cập nhật lại các tiêu chí bất cứ lúc nào. Các thay đổi sẽ được tự động đồng bộ hóa với hệ thống gợi ý gia sư.
            </p>
          </div>
        </div>
      )}

      {/* Stepper Progress Bar */}
      <QuestionStepper
        sections={sections}
        currentSectionIndex={currentSectionIndex}
        onSelectSection={(targetIdx) => {
          if (targetIdx <= currentSectionIndex || validateSection(currentSectionIndex)) {
            setCurrentSectionIndex(targetIdx);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            toast.warning('Vui lòng hoàn thành các câu hỏi bắt buộc ở phần hiện tại trước khi chuyển bước');
          }
        }}
        progressPercentage={percentage}
        answeredCount={answered}
        totalQuestions={total}
        lastSavedAt={lastSavedAt}
        isSaving={isSavingDraft}
      />

      {/* Form Content by Section */}
      <div className="space-y-6">
        {/* ================= SECTION 1: Lĩnh vực & Mục tiêu (Q1 - Q8) ================= */}
        {currentSectionIndex === 0 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 bg-brand-50/40 border border-brand-100 rounded-2xl">
              <h2 className="text-sm font-bold text-brand-900">
                Phần 1: Lĩnh vực, môn học & Mục tiêu học tập (Q1 – Q8)
              </h2>
              <p className="text-xs text-brand-700/80 mt-0.5">
                Xác định môn học bạn cần trau dồi và mục tiêu cụ thể bạn hướng tới.
              </p>
            </div>

            {/* Q1, Q2, Q3 Cascading Selector */}
            <CascadingTaxonomySelector
              categories={categories}
              selectedCategoryId={form.learning.categoryId}
              selectedSubjectIds={form.learning.subjectIds}
              selectedTopicIds={form.learning.topicIds}
              onCategoryChange={(catId) => updateField('learning', 'categoryId', catId)}
              onSubjectsChange={(subIds) => updateField('learning', 'subjectIds', subIds)}
              onTopicsChange={(topIds) => updateField('learning', 'topicIds', topIds)}
              errors={errors}
              q1Meta={{
                questionId: 'Q1',
                title: 'Bạn muốn học lĩnh vực nào?',
                subtitle: 'Chọn 1 lĩnh vực chính bạn quan tâm nhất',
              }}
              q2Meta={{
                questionId: 'Q2',
                title: 'Bạn muốn học nội dung / môn học nào trong lĩnh vực này?',
                subtitle: 'Chọn một hoặc nhiều môn học (thay đổi theo lĩnh vực ở Q1)',
              }}
              q3Meta={{
                questionId: 'Q3',
                title: 'Bạn muốn học chuyên sâu về nội dung nào?',
                subtitle: 'Chuyên môn chi tiết thay đổi theo môn học ở Q2',
              }}
            />

            {/* Q4: Purposes */}
            <QuestionCard
              questionId="Q4"
              title="Mục đích chính bạn muốn học nội dung này là gì?"
              subtitle="Chọn một hoặc nhiều mục đích bạn hướng tới"
              required
              error={errors.purposes}
            >
              <MultipleChoiceField
                options={purposes}
                value={form.learning.purposes}
                onChange={(val) => updateField('learning', 'purposes', val)}
              />
            </QuestionCard>

            {/* Q5: Current Level */}
            <QuestionCard
              questionId="Q5"
              title="Trình độ hiện tại của bạn?"
              subtitle="Chọn mức độ phản ánh đúng năng lực hiện tại của bạn"
              required
              error={errors.currentLevel}
            >
              <SingleChoiceField
                options={levels}
                value={form.learning.currentLevel}
                onChange={(val) => updateField('learning', 'currentLevel', val)}
                columns={2}
              />
            </QuestionCard>

            {/* Q6: Target Level */}
            <QuestionCard
              questionId="Q6"
              title="Bạn muốn đạt trình độ nào?"
              subtitle="Mục tiêu trình độ bạn mong muốn sau khóa học"
              required
              error={errors.targetLevel}
            >
              <SingleChoiceField
                options={levels}
                value={form.learning.targetLevel}
                onChange={(val) => updateField('learning', 'targetLevel', val)}
                columns={2}
              />
            </QuestionCard>

            {/* Q7: Goal text (Optional) */}
            <QuestionCard
              questionId="Q7"
              title="Mục tiêu cụ thể bạn muốn đạt được là gì?"
              subtitle="Ví dụ: Đạt IELTS 7.0, Làm được website bán hàng bằng React, Đạt điểm 9 môn Toán thi đại học... (Không bắt buộc)"
            >
              <Input
                placeholder="Nhập mục tiêu cụ thể của bạn (tối đa 500 ký tự)..."
                value={form.learning.goalText}
                onChange={(e) => updateField('learning', 'goalText', e.target.value)}
                maxLength={500}
              />
            </QuestionCard>

            {/* Q8: Target Duration */}
            <QuestionCard
              questionId="Q8"
              title="Bạn muốn đạt mục tiêu trong bao lâu?"
              subtitle="Ước lượng thời gian kỳ vọng hoàn thành mục tiêu học tập"
              required
              error={errors.targetDuration}
            >
              <SingleChoiceField
                options={targetDurationOptions}
                value={form.learning.targetDuration}
                onChange={(val) => updateField('learning', 'targetDuration', val)}
                columns={3}
              />
            </QuestionCard>
          </div>
        )}

        {/* ================= SECTION 2: Phong cách & Phương pháp (Q9 - Q14) ================= */}
        {currentSectionIndex === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 bg-brand-50/40 border border-brand-100 rounded-2xl">
              <h2 className="text-sm font-bold text-brand-900">
                Phần 2: Phương pháp & Phong cách học tập (Q9 – Q14)
              </h2>
              <p className="text-xs text-brand-700/80 mt-0.5">
                Giúp gia sư cá nhân hóa giáo trình và phương thức truyền đạt phù hợp nhất.
              </p>
            </div>

            {/* Q9: Teaching methods */}
            <QuestionCard
              questionId="Q9"
              title="Bạn thích học theo phương pháp nào?"
              subtitle="Chọn các phương pháp bạn thấy tiếp thu hiệu quả nhất"
              required
              error={errors.methods}
            >
              <MultipleChoiceField
                options={teachingMethods}
                value={form.learningStyle.methods}
                onChange={(val) => updateField('learningStyle', 'methods', val)}
              />
            </QuestionCard>

            {/* Q10: Pace */}
            <QuestionCard
              questionId="Q10"
              title="Bạn thích tốc độ học như thế nào?"
              subtitle="Nhịp độ tiếp thu bài giảng phù hợp với bạn"
              required
              error={errors.pace}
            >
              <SingleChoiceField
                options={paceOptions}
                value={form.learningStyle.pace}
                onChange={(val) => updateField('learningStyle', 'pace', val)}
                columns={2}
              />
            </QuestionCard>

            {/* Q11: Class format */}
            <QuestionCard
              questionId="Q11"
              title="Bạn thích hình thức lớp học nào?"
              subtitle="Quy mô lớp học bạn mong muốn tham gia"
              required
              error={errors.classFormat}
            >
              <SingleChoiceField
                options={classFormatOptions}
                value={form.learningStyle.classFormat}
                onChange={(val) => updateField('learningStyle', 'classFormat', val)}
                columns={2}
              />
            </QuestionCard>

            {/* Q12: Preferred Tutor Styles (Max 3) */}
            <QuestionCard
              questionId="Q12"
              title="Bạn mong muốn Tutor có phong cách như thế nào?"
              subtitle="Chọn tối đa 3 phong cách bạn kỳ vọng nhất ở người hướng dẫn"
              required
              error={errors.preferredTutorStyles}
            >
              <MultipleChoiceField
                options={teachingStyles}
                value={form.learningStyle.preferredTutorStyles}
                maxSelections={3}
                onChange={(val) => updateField('learningStyle', 'preferredTutorStyles', val)}
                columns={2}
              />
            </QuestionCard>

            {/* Q13: Materials */}
            <QuestionCard
              questionId="Q13"
              title="Bạn thích sử dụng tài liệu học tập nào?"
              subtitle="Loại tài liệu bạn cảm thấy hứng thú và tiếp thu tốt nhất"
              required
              error={errors.materials}
            >
              <MultipleChoiceField
                options={materials}
                value={form.learningStyle.materials}
                onChange={(val) => updateField('learningStyle', 'materials', val)}
                columns={2}
              />
            </QuestionCard>

            {/* Q14: Interaction Level */}
            <QuestionCard
              questionId="Q14"
              title="Bạn muốn mức độ tương tác trong buổi học như thế nào?"
              subtitle="Mức độ trao đổi và hỏi đáp giữa học viên và gia sư"
              required
              error={errors.interactionLevel}
            >
              <SingleChoiceField
                options={interactionLevels}
                value={form.learningStyle.interactionLevel}
                onChange={(val) => updateField('learningStyle', 'interactionLevel', val)}
                columns={2}
              />
            </QuestionCard>
          </div>
        )}

        {/* ================= SECTION 3: Thời gian học (Q15 - Q18) ================= */}
        {currentSectionIndex === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 bg-brand-50/40 border border-brand-100 rounded-2xl">
              <h2 className="text-sm font-bold text-brand-900">
                Phần 3: Thời gian học tập (Q15 – Q18)
              </h2>
              <p className="text-xs text-brand-700/80 mt-0.5">
                Khung giờ và thời lượng học tập mong muốn (lưu ý: chỉ là preference, lịch học chính thức sẽ chọn theo slot rảnh của gia sư).
              </p>
            </div>

            {/* Q15: Time Bands */}
            <QuestionCard
              questionId="Q15"
              title="Bạn thường có thể học vào thời gian nào?"
              subtitle="Chọn các buổi / khung thời gian bạn rảnh trong ngày"
              required
              error={errors.timeBands}
            >
              <MultipleChoiceField
                options={timeBands}
                value={form.schedulePreferences.timeBands}
                onChange={(val) => updateField('schedulePreferences', 'timeBands', val)}
                columns={2}
              />
            </QuestionCard>

            {/* Q16: Weekdays */}
            <QuestionCard
              questionId="Q16"
              title="Bạn có thể học vào những ngày nào trong tuần?"
              subtitle="Chọn một hoặc nhiều ngày bạn có thể sắp xếp học"
              required
              error={errors.weekdays}
            >
              <MultipleChoiceField
                options={weekdayOptions}
                value={form.schedulePreferences.weekdays}
                onChange={(val) => updateField('schedulePreferences', 'weekdays', val)}
                columns={4}
              />
            </QuestionCard>

            {/* Q17: Sessions per week */}
            <QuestionCard
              questionId="Q17"
              title="Bạn muốn học bao nhiêu buổi mỗi tuần?"
              subtitle="Tần suất buổi học mong muốn để đảm bảo tiến độ"
              required
              error={errors.sessionsPerWeek}
            >
              <SingleChoiceField
                options={sessionsPerWeekOptions}
                value={form.schedulePreferences.sessionsPerWeek}
                onChange={(val) => updateField('schedulePreferences', 'sessionsPerWeek', val)}
                columns={3}
              />
            </QuestionCard>

            {/* Q18: Duration per session */}
            <QuestionCard
              questionId="Q18"
              title="Bạn muốn mỗi buổi học kéo dài bao lâu?"
              subtitle="Thời lượng phù hợp với khả năng tập trung và quỹ thời gian của bạn"
              required
              error={errors.durationMinutes}
            >
              <MultipleChoiceField
                options={durationMinutesOptions}
                value={form.schedulePreferences.durationMinutes}
                onChange={(val) => updateField('schedulePreferences', 'durationMinutes', val)}
                columns={3}
              />
            </QuestionCard>
          </div>
        )}

        {/* ================= SECTION 4: Hình thức, ngân sách & Tiêu chuẩn Tutor (Q19 - Q24) ================= */}
        {currentSectionIndex === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 bg-brand-50/40 border border-brand-100 rounded-2xl">
              <h2 className="text-sm font-bold text-brand-900">
                Phần 4: Hình thức, địa điểm, ngân sách & Tiêu chuẩn Tutor (Q19 – Q24)
              </h2>
              <p className="text-xs text-brand-700/80 mt-0.5">
                Thiết lập kỳ vọng học phí, hình thức gặp mặt và các tiêu chí chuyên môn của gia sư.
              </p>
            </div>

            {/* Q19: Learning Modes */}
            <QuestionCard
              questionId="Q19"
              title="Bạn muốn học theo hình thức nào?"
              subtitle="Học trực tuyến qua Google Meet/Zoom hay gặp mặt trực tiếp"
              required
              error={errors.modes}
            >
              <MultipleChoiceField
                options={modes}
                value={form.constraints.modes}
                onChange={(val) => updateField('constraints', 'modes', val)}
                columns={2}
              />
            </QuestionCard>

            {/* Q20: Offline locations (Conditional on Q19) */}
            {isOfflineSelected ? (
              <QuestionCard
                questionId="Q20"
                title="Nếu học Offline, bạn muốn học ở đâu?"
                subtitle="Chỉ áp dụng vì bạn đã chọn hình thức Offline hoặc Kết hợp ở câu 19"
                required
                error={errors.offlineLocations}
              >
                <MultipleChoiceField
                  options={offlineLocations}
                  value={form.constraints.offlineLocations}
                  onChange={(val) => updateField('constraints', 'offlineLocations', val)}
                  columns={2}
                />
              </QuestionCard>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center space-x-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong>Câu Q20 (Địa điểm Offline):</strong> Đã được ẩn vì bạn không chọn hình thức học Offline hoặc Kết hợp ở câu 19.
                </span>
              </div>
            )}

            {/* Q21: Budget Range */}
            <QuestionCard
              questionId="Q21"
              title="Ngân sách của bạn cho một buổi học là bao nhiêu?"
              subtitle="Mức học phí dự kiến cho mỗi buổi dạy 1–1 hoặc theo nhóm"
              required
              error={errors.budgetRangeId}
            >
              <SingleChoiceField
                options={budgetRangeOptions}
                value={form.constraints.budgetRangeId}
                onChange={(val) => updateField('constraints', 'budgetRangeId', val)}
                columns={2}
              />
            </QuestionCard>

            {/* Q22: Selection Priorities (Max 3) */}
            <QuestionCard
              questionId="Q22"
              title="Bạn ưu tiên điều gì nhất khi chọn Tutor?"
              subtitle="Chọn tối đa 3 yếu tố quan trọng nhất đối với bạn"
              required
              error={errors.selectionPriorities}
            >
              <MultipleChoiceField
                options={priorities}
                value={form.tutorRequirements.selectionPriorities}
                maxSelections={3}
                onChange={(val) => updateField('tutorRequirements', 'selectionPriorities', val)}
                columns={2}
              />
            </QuestionCard>

            {/* Q23: Tutor Experience */}
            <QuestionCard
              questionId="Q23"
              title="Bạn mong muốn Tutor có số năm kinh nghiệm như thế nào?"
              subtitle="Kinh nghiệm giảng dạy thực tế của gia sư"
              required
              error={errors.experienceRange}
            >
              <SingleChoiceField
                options={experienceRangeOptions}
                value={form.tutorRequirements.experienceRange}
                onChange={(val) => updateField('tutorRequirements', 'experienceRange', val)}
                columns={2}
              />
            </QuestionCard>

            {/* Q24: Certificate Requirement */}
            <QuestionCard
              questionId="Q24"
              title="Bạn có yêu cầu về chứng chỉ hoặc bằng cấp của Tutor không?"
              subtitle="Mức độ bắt buộc về chứng chỉ năng lực chuyên môn"
              required
              error={errors.certificateRequirement}
            >
              <SingleChoiceField
                options={certificateRequirementOptions}
                value={form.tutorRequirements.certificateRequirement}
                onChange={(val) => updateField('tutorRequirements', 'certificateRequirement', val)}
                columns={2}
              />
            </QuestionCard>
          </div>
        )}

        {/* ================= SECTION 5: Khó khăn, hỗ trợ & Ghi chú (Q25 - Q28) ================= */}
        {currentSectionIndex === 4 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 bg-brand-50/40 border border-brand-100 rounded-2xl">
              <h2 className="text-sm font-bold text-brand-900">
                Phần 5: Khó khăn, hỗ trợ & Cá nhân hóa (Q25 – Q28)
              </h2>
              <p className="text-xs text-brand-700/80 mt-0.5">
                Chia sẻ những khúc mắc và sự hỗ trợ bạn cần nhất để gia sư chuẩn bị tốt nhất.
              </p>
            </div>

            {/* Q25: Difficulties */}
            <QuestionCard
              questionId="Q25"
              title="Khó khăn lớn nhất của bạn khi học là gì?"
              subtitle="Giúp gia sư thấu hiểu và chuẩn bị phương án đồng hành tốt nhất"
              required
              error={errors.difficulties}
            >
              <MultipleChoiceField
                options={difficulties}
                value={form.supportNeeds.difficulties}
                onChange={(val) => updateField('supportNeeds', 'difficulties', val)}
                columns={2}
              />
            </QuestionCard>

            {/* Q26: Desired Support */}
            <QuestionCard
              questionId="Q26"
              title="Bạn mong Tutor hỗ trợ nhiều nhất ở hoạt động nào?"
              subtitle="Các hoạt động bạn cần gia sư đồng hành sát sao ngoài giờ học"
              required
              error={errors.desiredSupport}
            >
              <MultipleChoiceField
                options={supportTypes}
                value={form.supportNeeds.desiredSupport}
                onChange={(val) => updateField('supportNeeds', 'desiredSupport', val)}
                columns={2}
              />
            </QuestionCard>

            {/* Q27: Progress Tracking */}
            <QuestionCard
              questionId="Q27"
              title="Bạn mong muốn Tutor theo dõi và đánh giá tiến độ như thế nào?"
              subtitle="Tần suất và cách thức phản hồi tiến trình học tập"
              required
              error={errors.progressTracking}
            >
              <SingleChoiceField
                options={progressTracking}
                value={form.supportNeeds.progressTracking}
                onChange={(val) => updateField('supportNeeds', 'progressTracking', val)}
                columns={2}
              />
            </QuestionCard>

            {/* Q28: Additional Note */}
            <QuestionCard
              questionId="Q28"
              title="Hãy chia sẻ thêm điều bạn mong muốn ở Tutor (nếu có)"
              subtitle="Ghi chú văn bản tự do giúp gia sư thấu hiểu mong đợi và thói quen học tập của bạn hơn (Không bắt buộc)"
            >
              <Textarea
                placeholder="Ví dụ: Mình khá nhút nhát nên mong gia sư kiên nhẫn; Mình cần học nhanh để kịp thi chứng chỉ vào tháng sau..."
                rows={4}
                value={form.additionalNote}
                onChange={(e) => updateAdditionalNote(e.target.value)}
                maxLength={1000}
              />
            </QuestionCard>
          </div>
        )}

        {/* ================= SECTION 6: Xác nhận & Kiểm tra thông tin (Review Step) ================= */}
        {currentSectionIndex === 5 && (
          <QuestionnaireReviewSummary
            form={form}
            optionsData={{
              categories,
              purposes,
              levels,
              targetDurationOptions,
              teachingMethods,
              paceOptions,
              classFormatOptions,
              teachingStyles,
              materials,
              interactionLevels,
              timeBands,
              weekdayOptions,
              sessionsPerWeekOptions,
              durationMinutesOptions,
              modes,
              offlineLocations,
              budgetRangeOptions,
              priorities,
              experienceRangeOptions,
              certificateRequirementOptions,
              difficulties,
              supportTypes,
              progressTracking,
            }}
            isOfflineSelected={isOfflineSelected}
            onEditSection={(idx) => {
              setCurrentSectionIndex(idx);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            missingQuestions={missingQuestions}
            isAllValid={isAllValid}
          />
        )}
      </div>

      {/* Bottom Sticky Action Bar */}
      <QuestionnaireActions
        currentSectionIndex={currentSectionIndex}
        totalSections={sections.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        isSavingDraft={isSavingDraft}
        isSubmitting={isSubmitting}
        submitLabel="Hoàn thành khảo sát"
        nextLabel="Tiếp theo"
        prevLabel="Câu trước"
      />
    </div>
  );
}

export default LearnerQuestionnairePage;
