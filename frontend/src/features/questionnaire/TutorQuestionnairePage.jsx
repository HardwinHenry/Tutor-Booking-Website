import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  Award,
} from 'lucide-react';
import { questionnaireService } from '../../services/questionnaire.service';
import { tutorService } from '../../services/tutor.service';
import { taxonomyService } from '../../services/taxonomy.service';
import {
  getInitialTutorFormState,
  mapBackendToTutorForm,
  calculateTutorProgress,
} from './utils/tutorFormMapper';
import QuestionStepper from './components/QuestionStepper';
import QuestionCard from './components/QuestionCard';
import SingleChoiceField from './components/SingleChoiceField';
import MultipleChoiceField from './components/MultipleChoiceField';
import CascadingTaxonomySelector from './components/CascadingTaxonomySelector';
import QualificationsField from './components/QualificationsField';
import QuestionnaireActions from './components/QuestionnaireActions';
import LoadingState from '../../components/feedback/LoadingState';
import Textarea from '../../components/common/Textarea';
import Input from '../../components/common/Input';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from '../../components/feedback/ToastProvider';

export function TutorQuestionnairePage() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [form, setForm] = useState(getInitialTutorFormState());
  const [errors, setErrors] = useState({});
  const [completionStatus, setCompletionStatus] = useState('not_started');
  const [approvalStatus, setApprovalStatus] = useState('draft');
  const [rejectionReason, setRejectionReason] = useState(null);

  // Metadata & Options from Backend
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
  const [certificateTypes, setCertificateTypes] = useState([]);
  const [supportApproaches, setSupportApproaches] = useState([]);
  const [supportTypes, setSupportTypes] = useState([]);
  const [progressTracking, setProgressTracking] = useState([]);

  // Load questionnaire and tutor profile
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const [qRes, profile, allTaxonomies] = await Promise.all([
          questionnaireService.getQuestionnaire('tutor'),
          tutorService.getMyProfile(true).catch(() => null),
          taxonomyService.getTaxonomies({ active: true }).catch(() => []),
        ]);

        if (!isMounted) return;

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
        setCertificateTypes(allTaxonomies.filter((t) => t.type === 'certificate_type'));
        setSupportApproaches(allTaxonomies.filter((t) => t.type === 'support_approach'));
        setSupportTypes(allTaxonomies.filter((t) => t.type === 'support_type'));
        setProgressTracking(allTaxonomies.filter((t) => t.type === 'progress_tracking'));

        if (profile) {
          setForm(mapBackendToTutorForm(profile));
          setCompletionStatus(profile.completionStatus || 'not_started');
          setApprovalStatus(profile.approvalStatus || 'draft');
          setRejectionReason(profile.rejectionReason || null);
          if (profile.updatedAt) {
            setLastSavedAt(new Date(profile.updatedAt));
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải bảng câu hỏi gia sư:', err);
        toast.error('Không thể tải bộ câu hỏi gia sư. Vui lòng thử lại sau.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Check if offline mode selected
  const isOfflineSelected = useMemo(() => {
    if (!form.teachingConditions.modes || form.teachingConditions.modes.length === 0) return false;
    const selectedModeObjs = modes.filter((m) =>
      form.teachingConditions.modes.includes(m._id || m.id)
    );
    return selectedModeObjs.some(
      (m) => m.slug === 'offline' || m.slug === 'hybrid'
    );
  }, [form.teachingConditions.modes, modes]);

  // Progress metrics
  const { answered, total, percentage } = useMemo(() => {
    return calculateTutorProgress(form, isOfflineSelected);
  }, [form, isOfflineSelected]);

  // Fixed options for Tutor
  const tutorGoalOptions = [
    { id: 'certificate', label: 'Đạt chứng chỉ hoặc điểm số mục tiêu' },
    { id: 'fluent_communication', label: 'Giao tiếp thành thạo' },
    { id: 'real_project', label: 'Hoàn thành dự án thực tế' },
    { id: 'expert_knowledge', label: 'Nắm vững kiến thức chuyên môn' },
    { id: 'improve_grades', label: 'Cải thiện kết quả học tập tại trường' },
    { id: 'master_tools', label: 'Thành thạo công cụ / phần mềm' },
    { id: 'personal_skills', label: 'Phát triển kỹ năng cá nhân' },
    { id: 'other', label: 'Mục tiêu khác' },
  ];

  const estimatedDurationOptions = [
    { id: 'under_1_month', label: 'Dưới 1 tháng' },
    { id: '1_3_months', label: '1–3 tháng' },
    { id: '3_6_months', label: '3–6 tháng' },
    { id: '6_12_months', label: '6–12 tháng' },
    { id: 'over_1_year', label: 'Trên 1 năm' },
    { id: 'flexible', label: 'Tùy theo năng lực học viên' },
  ];

  const paceOptions = [
    { id: 'slow_detailed', label: 'Chậm, giải thích chi tiết' },
    { id: 'moderate', label: 'Vừa phải, bám sát giáo trình' },
    { id: 'fast', label: 'Nhanh, tập trung vào trọng tâm' },
    { id: 'flexible', label: 'Linh hoạt theo năng lực người học' },
  ];

  const classFormatsOptions = [
    { id: 'one_to_one', label: 'Dạy kèm 1–1' },
    { id: 'small_group', label: 'Nhóm nhỏ (2–5 học viên)' },
    { id: 'medium_group', label: 'Nhóm vừa (6–10 học viên)' },
    { id: 'large_group', label: 'Nhóm lớn (Trên 10 học viên)' },
    { id: 'all', label: 'Tất cả các hình thức trên' },
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

  const tutorMaxSessionsOptions = [
    { id: '1_2', label: '1–2 buổi / tuần' },
    { id: '3_4', label: '3–4 buổi / tuần' },
    { id: '5_6', label: '5–6 buổi / tuần' },
    { id: '7_10', label: '7–10 buổi / tuần' },
    { id: 'over_10', label: 'Trên 10 buổi / tuần' },
    { id: 'flexible', label: 'Linh hoạt sắp xếp' },
  ];

  const sessionDurationsOptions = [
    { id: 30, label: '30 phút' },
    { id: 45, label: '45 phút' },
    { id: 60, label: '60 phút (1 tiếng)' },
    { id: 90, label: '90 phút (1.5 tiếng)' },
    { id: 120, label: '120 phút (2 tiếng)' },
    { id: 'over_120', label: 'Trên 120 phút' },
    { id: 'flexible', label: 'Linh hoạt theo nhu cầu học viên' },
  ];

  const priceRangeOptions = [
    { id: '100k_200k', label: '100.000đ – 200.000đ / buổi', description: 'Gia sư sinh viên / Kèm cơ bản' },
    { id: '200k_300k', label: '200.000đ – 300.000đ / buổi', description: 'Gia sư kinh nghiệm / Luyện thi' },
    { id: '300k_500k', label: '300.000đ – 500.000đ / buổi', description: 'Giáo viên, giảng viên, chứng chỉ quốc tế' },
    { id: 'over_500k', label: 'Trên 500.000đ / buổi', description: 'Chuyên gia đầu ngành / Luyện thi cấp tốc' },
    { id: 'negotiable', label: 'Có thể thương lượng', description: 'Trao đổi cụ thể theo từng yêu cầu' },
  ];

  const experienceRangeOptions = [
    { id: 'no_experience', label: 'Chưa có kinh nghiệm (Người mới)' },
    { id: 'under_1_year', label: 'Dưới 1 năm kinh nghiệm' },
    { id: '1_2_years', label: '1–2 năm kinh nghiệm' },
    { id: '3_5_years', label: '3–5 năm kinh nghiệm' },
    { id: 'over_5_years', label: 'Trên 5 năm kinh nghiệm' },
  ];

  // Sections configuration
  const sections = [
    {
      id: 'expertise',
      title: 'Lĩnh vực & Năng lực',
      range: 'Q1 – Q8',
      isCompleted:
        !!form.expertise.categoryId &&
        form.expertise.subjectIds.length > 0 &&
        form.expertise.topicIds.length > 0 &&
        form.teachingCapabilities.supportedPurposes.length > 0 &&
        form.teachingCapabilities.teachableLevels.length > 0 &&
        form.teachingCapabilities.supportedTargetLevels.length > 0 &&
        form.teachingCapabilities.supportedGoalTags.length > 0 &&
        form.teachingCapabilities.estimatedDurationRanges.length > 0,
    },
    {
      id: 'teaching_style',
      title: 'Phương pháp & Phong cách',
      range: 'Q9 – Q14',
      isCompleted:
        form.teachingCapabilities.methods.length > 0 &&
        !!form.teachingCapabilities.pace &&
        form.teachingCapabilities.classFormats.length > 0 &&
        form.teachingCapabilities.styles.length > 0 &&
        form.teachingCapabilities.materials.length > 0 &&
        !!form.teachingCapabilities.interactionLevel,
    },
    {
      id: 'schedule',
      title: 'Thời gian giảng dạy',
      range: 'Q15 – Q18',
      isCompleted:
        form.schedulePreferences.timeBands.length > 0 &&
        form.schedulePreferences.weekdays.length > 0 &&
        !!form.schedulePreferences.sessionsPerWeekRange &&
        form.schedulePreferences.durationMinutes.length > 0,
    },
    {
      id: 'conditions',
      title: 'Hình thức & Học phí',
      range: 'Q19 – Q22',
      isCompleted:
        form.teachingConditions.modes.length > 0 &&
        (!isOfflineSelected || form.teachingConditions.offlineLocations.length > 0) &&
        !!form.teachingConditions.priceRangeId,
    },
    {
      id: 'experience_qualifications',
      title: 'Kinh nghiệm & Bằng cấp',
      range: 'Q23 – Q24',
      isCompleted: !!form.experienceRange,
    },
    {
      id: 'support_intro',
      title: 'Hỗ trợ & Giới thiệu',
      range: 'Q25 – Q28',
      isCompleted:
        form.supportApproaches.length > 0 &&
        form.availableSupport.length > 0 &&
        form.assessmentMethods.length > 0,
    },
  ];

  // Save Draft (non-blocking)
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const updated = await tutorService.updateMyProfile(form);
      setLastSavedAt(new Date());
      setCompletionStatus(updated?.completionStatus || 'in_progress');
      setApprovalStatus(updated?.approvalStatus || 'draft');
      toast.success('Đã lưu nháp hồ sơ gia sư thành công!');
    } catch (err) {
      toast.error(err.message || 'Không thể lưu bản nháp. Vui lòng kiểm tra lại.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Client validation before submit
  const validateForSubmit = () => {
    const errs = {};

    // Section 1
    if (!form.expertise.categoryId) errs.categoryId = 'Vui lòng chọn 1 lĩnh vực giảng dạy';
    if (!form.expertise.subjectIds.length) errs.subjectIds = 'Vui lòng chọn ít nhất 1 môn học';
    if (!form.expertise.topicIds.length) errs.topicIds = 'Vui lòng chọn ít nhất 1 chuyên môn sâu';
    if (!form.teachingCapabilities.supportedPurposes.length) {
      errs.supportedPurposes = 'Vui lòng chọn mục tiêu học viên bạn có thể tiếp nhận';
    }
    if (!form.teachingCapabilities.teachableLevels.length) {
      errs.teachableLevels = 'Vui lòng chọn trình độ đầu vào bạn có thể nhận';
    }
    if (!form.teachingCapabilities.supportedTargetLevels.length) {
      errs.supportedTargetLevels = 'Vui lòng chọn trình độ đầu ra bạn có thể đào tạo';
    }
    if (!form.teachingCapabilities.supportedGoalTags.length) {
      errs.supportedGoalTags = 'Vui lòng chọn mục tiêu cụ thể bạn có thể hỗ trợ';
    }
    if (!form.teachingCapabilities.estimatedDurationRanges.length) {
      errs.estimatedDurationRanges = 'Vui lòng chọn thời gian ước lượng trung bình';
    }

    // Section 2
    if (!form.teachingCapabilities.methods.length) errs.methods = 'Vui lòng chọn phương pháp giảng dạy';
    if (!form.teachingCapabilities.pace) errs.pace = 'Vui lòng chọn cách điều chỉnh tốc độ';
    if (!form.teachingCapabilities.classFormats.length) errs.classFormats = 'Vui lòng chọn hình thức / quy mô lớp';
    if (!form.teachingCapabilities.styles.length) errs.styles = 'Vui lòng chọn phong cách giảng dạy';
    if (!form.teachingCapabilities.materials.length) errs.materials = 'Vui lòng chọn tài liệu giảng dạy';
    if (!form.teachingCapabilities.interactionLevel) errs.interactionLevel = 'Vui lòng chọn mức độ tương tác';

    // Section 3
    if (!form.schedulePreferences.timeBands.length) errs.timeBands = 'Vui lòng chọn khung giờ bạn có thể dạy';
    if (!form.schedulePreferences.weekdays.length) errs.weekdays = 'Vui lòng chọn các ngày trong tuần';
    if (!form.schedulePreferences.sessionsPerWeekRange) errs.sessionsPerWeekRange = 'Vui lòng chọn số buổi tối đa';
    if (!form.schedulePreferences.durationMinutes.length) errs.durationMinutes = 'Vui lòng chọn thời lượng buổi dạy';

    // Section 4
    if (!form.teachingConditions.modes.length) errs.modes = 'Vui lòng chọn hình thức giảng dạy';
    if (isOfflineSelected && !form.teachingConditions.offlineLocations.length) {
      errs.offlineLocations = 'Vui lòng chọn địa điểm có thể dạy Offline';
    }
    if (!form.teachingConditions.priceRangeId) errs.priceRangeId = 'Vui lòng chọn mức học phí đề xuất';

    // Section 5
    if (!form.experienceRange) errs.experienceRange = 'Vui lòng chọn số năm kinh nghiệm';

    // Section 6
    if (!form.supportApproaches.length) errs.supportApproaches = 'Vui lòng chọn cách tháo gỡ khó khăn cho học viên';
    if (!form.availableSupport.length) errs.availableSupport = 'Vui lòng chọn hoạt động hỗ trợ ngoài giờ';
    if (!form.assessmentMethods.length) errs.assessmentMethods = 'Vui lòng chọn phương thức đánh giá tiến độ';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit profile for Admin approval
  const handleSubmit = async () => {
    if (!validateForSubmit()) {
      toast.error('Vui lòng hoàn thành các trường bắt buộc trước khi nộp hồ sơ');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await tutorService.submitMyProfile(form);
      setCompletionStatus('completed');
      setApprovalStatus('pending');
      toast.success('Nộp hồ sơ gia sư thành công! Hồ sơ đang chờ Quản trị viên duyệt.');
      navigate('/tutor/dashboard');
    } catch (err) {
      toast.error(err.message || 'Không thể nộp hồ sơ. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState fullPage message="Đang tải dữ liệu hồ sơ gia sư..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Info */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-brand-600 uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Khai báo hồ sơ năng lực giảng dạy</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Hồ sơ năng lực Gia sư (28 câu)
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
          Khai báo chuyên môn sâu, phong cách giảng dạy, mức học phí và bằng cấp để Quản trị viên xét duyệt. Sau khi được duyệt, hồ sơ của bạn sẽ hiển thị công khai tới học viên.
        </p>
      </div>

      {/* Approval Status Alert Banner */}
      {approvalStatus === 'pending' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3 text-xs text-amber-800">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-900">Trạng thái hồ sơ:</span>
              <StatusBadge type="tutorProfile" status="pending" />
            </div>
            <p className="mt-1 text-amber-700">
              Hồ sơ của bạn đã được nộp và đang chờ Quản trị viên kiểm tra. Bạn vẫn có thể xem lại hoặc lưu cập nhật bổ sung bất kỳ lúc nào.
            </p>
          </div>
        </div>
      )}

      {approvalStatus === 'rejected' && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-xs text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-rose-900">Hồ sơ bị từ chối duyệt:</span>
              <StatusBadge type="tutorProfile" status="rejected" />
            </div>
            {rejectionReason && (
              <p className="mt-1 font-semibold text-rose-700">
                Lý do: <span className="font-normal text-rose-800">{rejectionReason}</span>
              </p>
            )}
            <p className="mt-1 text-rose-600">
              Vui lòng bổ sung hoặc điều chỉnh lại các thông tin theo yêu cầu và bấm &quot;Nộp hồ sơ chờ duyệt&quot; lại.
            </p>
          </div>
        </div>
      )}

      {approvalStatus === 'approved' && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-3 text-xs text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-900">Trạng thái hồ sơ:</span>
              <StatusBadge type="tutorProfile" status="approved" />
            </div>
            <p className="mt-1 text-emerald-700">
              Hồ sơ của bạn đã được phê duyệt công khai. Học viên có thể tìm kiếm và đặt lịch học dựa trên khung giờ rảnh của bạn.
            </p>
          </div>
        </div>
      )}

      {/* Stepper Progress Bar */}
      <QuestionStepper
        sections={sections}
        currentSectionIndex={currentSectionIndex}
        onSelectSection={setCurrentSectionIndex}
        progressPercentage={percentage}
        answeredCount={answered}
        totalQuestions={total}
        lastSavedAt={lastSavedAt}
        isSaving={isSavingDraft}
      />

      {/* Form Content by Section */}
      <div className="space-y-6">
        {/* ================= SECTION 1: Lĩnh vực & Năng lực (Q1 - Q8) ================= */}
        {currentSectionIndex === 0 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 bg-brand-50/40 border border-brand-100 rounded-2xl">
              <h2 className="text-sm font-bold text-brand-900">
                Phần 1: Lĩnh vực & Năng lực giảng dạy
              </h2>
              <p className="text-xs text-brand-700/80 mt-0.5">
                Khai báo môn học, chuyên môn sâu và đối tượng học viên bạn có thể đào tạo.
              </p>
            </div>

            {/* Q1, Q2, Q3 Cascading Selector */}
            <CascadingTaxonomySelector
              categories={categories}
              selectedCategoryId={form.expertise.categoryId}
              selectedSubjectIds={form.expertise.subjectIds}
              selectedTopicIds={form.expertise.topicIds}
              onCategoryChange={(catId) =>
                setForm((prev) => ({
                  ...prev,
                  expertise: { ...prev.expertise, categoryId: catId },
                }))
              }
              onSubjectsChange={(subIds) =>
                setForm((prev) => ({
                  ...prev,
                  expertise: { ...prev.expertise, subjectIds: subIds },
                }))
              }
              onTopicsChange={(topIds) =>
                setForm((prev) => ({
                  ...prev,
                  expertise: { ...prev.expertise, topicIds: topIds },
                }))
              }
              errors={errors}
              q1Meta={{
                questionId: 'Q1',
                title: 'Bạn muốn giảng dạy lĩnh vực nào?',
                subtitle: 'Chọn 1 lĩnh vực chính thế mạnh của bạn',
              }}
              q2Meta={{
                questionId: 'Q2',
                title: 'Bạn có thể giảng dạy môn học / ngôn ngữ nào?',
                subtitle: 'Môn học thuộc lĩnh vực bạn đã chọn ở câu 1',
              }}
              q3Meta={{
                questionId: 'Q3',
                title: 'Bạn có thể giảng dạy chuyên sâu những nội dung nào?',
                subtitle: 'Chuyên môn sâu thay đổi theo môn học ở câu 2',
              }}
            />

            {/* Q4: Supported Purposes */}
            <QuestionCard
              questionId="Q4"
              title="Bạn có thể hỗ trợ học viên với những mục tiêu nào?"
              subtitle="Các mục tiêu học viên bạn tự tin dẫn dắt"
              required
              error={errors.supportedPurposes}
            >
              <MultipleChoiceField
                options={purposes}
                value={form.teachingCapabilities.supportedPurposes}
                onChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    teachingCapabilities: { ...prev.teachingCapabilities, supportedPurposes: val },
                  }))
                }
              />
            </QuestionCard>

            {/* Q5: Teachable Levels */}
            <QuestionCard
              questionId="Q5"
              title="Bạn có thể giảng dạy học viên ở trình độ đầu vào nào?"
              subtitle="Các cấp độ người học bạn có thể tiếp nhận"
              required
              error={errors.teachableLevels}
            >
              <MultipleChoiceField
                options={levels}
                value={form.teachingCapabilities.teachableLevels}
                onChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    teachingCapabilities: { ...prev.teachingCapabilities, teachableLevels: val },
                  }))
                }
                columns={2}
              />
            </QuestionCard>

            {/* Q6: Supported Target Levels */}
            <QuestionCard
              questionId="Q6"
              title="Bạn có thể giúp học viên đạt đến trình độ nào?"
              subtitle="Cấp độ đầu ra bạn có thể đào tạo"
              required
              error={errors.supportedTargetLevels}
            >
              <MultipleChoiceField
                options={levels}
                value={form.teachingCapabilities.supportedTargetLevels}
                onChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    teachingCapabilities: { ...prev.teachingCapabilities, supportedTargetLevels: val },
                  }))
                }
                columns={2}
              />
            </QuestionCard>

            {/* Q7: Supported Goal Tags */}
            <QuestionCard
              questionId="Q7"
              title="Bạn có thể hỗ trợ học viên đạt những mục tiêu cụ thể nào?"
              subtitle="Chọn các mục tiêu bạn có kinh nghiệm hỗ trợ thành công"
              required
              error={errors.supportedGoalTags}
            >
              <MultipleChoiceField
                options={tutorGoalOptions}
                value={form.teachingCapabilities.supportedGoalTags}
                onChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    teachingCapabilities: { ...prev.teachingCapabilities, supportedGoalTags: val },
                  }))
                }
                columns={2}
              />
            </QuestionCard>

            {/* Q8: Estimated Duration Ranges */}
            <QuestionCard
              questionId="Q8"
              title="Theo kinh nghiệm của bạn, thời gian cần thiết để học viên đạt mục tiêu là bao lâu?"
              subtitle="Khoảng thời gian ước lượng trung bình để đào tạo hiệu quả"
              required
              error={errors.estimatedDurationRanges}
            >
              <MultipleChoiceField
                options={estimatedDurationOptions}
                value={form.teachingCapabilities.estimatedDurationRanges}
                onChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    teachingCapabilities: { ...prev.teachingCapabilities, estimatedDurationRanges: val },
                  }))
                }
                columns={3}
              />
            </QuestionCard>
          </div>
        )}

        {/* ================= SECTION 2: Phương pháp & Phong cách (Q9 - Q14) ================= */}
        {currentSectionIndex === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 bg-brand-50/40 border border-brand-100 rounded-2xl">
              <h2 className="text-sm font-bold text-brand-900">
                Phần 2: Phương pháp & Phong cách giảng dạy
              </h2>
              <p className="text-xs text-brand-700/80 mt-0.5">
                Khai báo phong cách sư phạm, phương pháp và cách điều phối buổi học.
              </p>
            </div>

            {/* Q9: Methods */}
            <QuestionCard
              questionId="Q9"
              title="Phương pháp giảng dạy chính của bạn là gì?"
              subtitle="Các phương pháp bạn thường áp dụng trong buổi dạy"
              required
              error={errors.methods}
            >
              <MultipleChoiceField
                options={teachingMethods}
                value={form.teachingCapabilities.methods}
                onChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    teachingCapabilities: { ...prev.teachingCapabilities, methods: val },
                  }))
                }
              />
            </QuestionCard>

            {/* Q10: Pace */}
            <QuestionCard
              questionId="Q10"
              title="Bạn thường điều chỉnh tốc độ giảng dạy như thế nào?"
              subtitle="Cách bạn kiểm soát nhịp điệu bài giảng"
              required
              error={errors.pace}
            >
              <SingleChoiceField
                options={paceOptions}
                value={form.teachingCapabilities.pace}
                onChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    teachingCapabilities: { ...prev.teachingCapabilities, pace: val },
                  }))
                }
                columns={2}
              />
            </QuestionCard>

            {/* Q11: Class formats */}
            <QuestionCard
              questionId="Q11"
              title="Bạn có thể tổ chức lớp học theo những hình thức / quy mô nào?"
              subtitle="Quy mô lớp bạn có khả năng đảm nhận"
              required
              error={errors.classFormats}
            >
              <MultipleChoiceField
                options={classFormatsOptions}
                value={form.teachingCapabilities.classFormats}
                onChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    teachingCapabilities: { ...prev.teachingCapabilities, classFormats: val },
                  }))
                }
                columns={2}
              />
            </QuestionCard>

            {/* Q12: Styles (Max 3) */}
            <QuestionCard
              questionId="Q12"
              title="Phong cách giảng dạy đặc trưng của bạn là gì?"
              subtitle="Chọn tối đa 3 nét phong cách nổi bật nhất"
              required
              error={errors.styles}
            >
              <MultipleChoiceField
                options={teachingStyles}
                value={form.teachingCapabilities.styles}
                maxSelections={3}
                onChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    teachingCapabilities: { ...prev.teachingCapabilities, styles: val },
                  }))
                }
                columns={2}
              />
            </QuestionCard>

            {/* Q13: Materials */}
            <QuestionCard
              questionId="Q13"
              title="Bạn thường sử dụng tài liệu hoặc công cụ nào trong giảng dạy?"
              subtitle="Hệ thống tài liệu và công nghệ hỗ trợ bài học"
              required
              error={errors.materials}
            >
              <MultipleChoiceField
                options={materials}
                value={form.teachingCapabilities.materials}
                onChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    teachingCapabilities: { ...prev.teachingCapabilities, materials: val },
                  }))
                }
                columns={2}
              />
            </QuestionCard>

            {/* Q14: Interaction Level */}
            <QuestionCard
              questionId="Q14"
              title="Bạn thường tạo mức độ tương tác như thế nào trong buổi học?"
              subtitle="Không khí trao đổi và hỏi đáp giữa thầy và trò"
              required
              error={errors.interactionLevel}
            >
              <SingleChoiceField
                options={interactionLevels}
                value={form.teachingCapabilities.interactionLevel}
                onChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    teachingCapabilities: { ...prev.teachingCapabilities, interactionLevel: val },
                  }))
                }
                columns={2}
              />
            </QuestionCard>
          </div>
        )}

        {/* ================= SECTION 3: Thời gian giảng dạy (Q15 - Q18) ================= */}
        {currentSectionIndex === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 bg-brand-50/40 border border-brand-100 rounded-2xl">
              <h2 className="text-sm font-bold text-brand-900">
                Phần 3: Thời gian giảng dạy & Khả năng nhận lớp
              </h2>
              <p className="text-xs text-brand-700/80 mt-0.5">
                Khai báo khung thời gian tổng quát bạn có thể dạy (lưu ý: khung giờ cụ thể để học viên đặt lịch sẽ tạo ở tính năng AvailabilitySlot).
              </p>
            </div>

            {/* Q15: Time Bands */}
            <QuestionCard
              questionId="Q15"
              title="Bạn có thể giảng dạy vào những khung thời gian nào?"
              subtitle="Các khoảng thời gian rảnh tổng quát trong ngày"
              required
              error={errors.timeBands}
            >
              <MultipleChoiceField
                options={timeBands}
                value={form.schedulePreferences.timeBands}
                onChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    schedulePreferences: { ...prev.schedulePreferences, timeBands: val },
                  }))
                }
                columns={2}
              />
            </QuestionCard>

            {/* Q16: Weekdays */}
            <QuestionCard
              questionId="Q16"
              title="Bạn có thể nhận lớp vào những ngày nào trong tuần?"
              subtitle="Chọn các ngày bạn có thể sắp xếp dạy"
              required
              error={errors.weekdays}
            >
              <MultipleChoiceField
                options={weekdayOptions}
                value={form.schedulePreferences.weekdays}
                onChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    schedulePreferences: { ...prev.schedulePreferences, weekdays: val },
                  }))
                }
                columns={4}
              />
            </QuestionCard>

            {/* Q17: Sessions per week range */}
            <QuestionCard
              questionId="Q17"
              title="Bạn có thể nhận tối đa bao nhiêu buổi dạy mỗi tuần?"
              subtitle="Sức chứa tối đa để đảm bảo chất lượng bài giảng"
              required
              error={errors.sessionsPerWeekRange}
            >
              <SingleChoiceField
                options={tutorMaxSessionsOptions}
                value={form.schedulePreferences.sessionsPerWeekRange}
                onChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    schedulePreferences: { ...prev.schedulePreferences, sessionsPerWeekRange: val },
                  }))
                }
                columns={3}
              />
            </QuestionCard>

            {/* Q18: Duration per session */}
            <QuestionCard
              questionId="Q18"
              title="Thời lượng mỗi buổi dạy bạn mong muốn là bao lâu?"
              subtitle="Thời lượng thiết kế bài giảng phù hợp với giáo án"
              required
              error={errors.durationMinutes}
            >
              <MultipleChoiceField
                options={sessionDurationsOptions}
                value={form.schedulePreferences.durationMinutes}
                onChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    schedulePreferences: { ...prev.schedulePreferences, durationMinutes: val },
                  }))
                }
                columns={3}
              />
            </QuestionCard>
          </div>
        )}

        {/* ================= SECTION 4: Hình thức & Học phí (Q19 - Q22) ================= */}
        {currentSectionIndex === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 bg-brand-50/40 border border-brand-100 rounded-2xl">
              <h2 className="text-sm font-bold text-brand-900">
                Phần 4: Hình thức, địa điểm & Học phí đề xuất
              </h2>
              <p className="text-xs text-brand-700/80 mt-0.5">
                Thiết lập điều kiện dạy học trực tiếp/online và mức học phí mong muốn.
              </p>
            </div>

            {/* Q19: Modes */}
            <QuestionCard
              questionId="Q19"
              title="Bạn có thể giảng dạy theo những hình thức nào?"
              subtitle="Trực tuyến qua mạng, gặp mặt trực tiếp hoặc kết hợp cả hai"
              required
              error={errors.modes}
            >
              <MultipleChoiceField
                options={modes}
                value={form.teachingConditions.modes}
                onChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    teachingConditions: { ...prev.teachingConditions, modes: val },
                  }))
                }
                columns={2}
              />
            </QuestionCard>

            {/* Q20: Offline locations (Conditional) */}
            {isOfflineSelected ? (
              <QuestionCard
                questionId="Q20"
                title="Nếu dạy Offline, bạn có thể dạy tại những địa điểm nào?"
                subtitle="Chỉ áp dụng nếu bạn nhận dạy Offline hoặc Kết hợp ở câu 19"
                required
                error={errors.offlineLocations}
              >
                <MultipleChoiceField
                  options={offlineLocations}
                  value={form.teachingConditions.offlineLocations}
                  onChange={(val) =>
                    setForm((prev) => ({
                      ...prev,
                      teachingConditions: { ...prev.teachingConditions, offlineLocations: val },
                    }))
                  }
                  columns={2}
                />
              </QuestionCard>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center space-x-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong>Câu Q20 (Địa điểm Offline):</strong> Đã được ẩn vì bạn không chọn hình thức Offline/Kết hợp ở câu 19.
                </span>
              </div>
            )}

            {/* Q21: Offline Area (Optional) */}
            {isOfflineSelected && (
              <QuestionCard
                questionId="Q21"
                title="Khu vực bạn có thể nhận dạy Offline (tùy chọn)"
                subtitle="Dùng để đối chiếu khoảng cách di chuyển khi matching gia sư Offline"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Tỉnh / Thành phố"
                    placeholder="Ví dụ: TP. Hồ Chí Minh"
                    value={form.teachingConditions.offlineArea.city}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        teachingConditions: {
                          ...prev.teachingConditions,
                          offlineArea: {
                            ...prev.teachingConditions.offlineArea,
                            city: e.target.value,
                          },
                        },
                      }))
                    }
                  />

                  <Input
                    label="Quận / Huyện"
                    placeholder="Ví dụ: Quận 1, Quận Bình Thạnh"
                    value={form.teachingConditions.offlineArea.district}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        teachingConditions: {
                          ...prev.teachingConditions,
                          offlineArea: {
                            ...prev.teachingConditions.offlineArea,
                            district: e.target.value,
                          },
                        },
                      }))
                    }
                  />

                  <Input
                    label="Bán kính di chuyển tối đa (km)"
                    type="number"
                    placeholder="Ví dụ: 10"
                    value={form.teachingConditions.offlineArea.radiusKm || ''}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        teachingConditions: {
                          ...prev.teachingConditions,
                          offlineArea: {
                            ...prev.teachingConditions.offlineArea,
                            radiusKm: e.target.value ? parseInt(e.target.value, 10) : null,
                          },
                        },
                      }))
                    }
                  />
                </div>
              </QuestionCard>
            )}

            {/* Q22: Price range */}
            <QuestionCard
              questionId="Q22"
              title="Mức học phí bạn mong muốn cho mỗi buổi dạy là bao nhiêu?"
              subtitle="Khoảng học phí đề xuất cho mỗi buổi dạy"
              required
              error={errors.priceRangeId}
            >
              <SingleChoiceField
                options={priceRangeOptions}
                value={form.teachingConditions.priceRangeId}
                onChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    teachingConditions: { ...prev.teachingConditions, priceRangeId: val },
                  }))
                }
                columns={2}
              />
            </QuestionCard>
          </div>
        )}

        {/* ================= SECTION 5: Kinh nghiệm & Bằng cấp (Q23 - Q24) ================= */}
        {currentSectionIndex === 4 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 bg-brand-50/40 border border-brand-100 rounded-2xl">
              <h2 className="text-sm font-bold text-brand-900">
                Phần 5: Kinh nghiệm giảng dạy & Bằng cấp / Chứng chỉ
              </h2>
              <p className="text-xs text-brand-700/80 mt-0.5">
                Khai báo số năm kinh nghiệm và danh sách chứng chỉ chuyên môn để Admin xác minh.
              </p>
            </div>

            {/* Q23: Experience Range */}
            <QuestionCard
              questionId="Q23"
              title="Bạn có bao nhiêu năm kinh nghiệm giảng dạy?"
              subtitle="Kinh nghiệm đứng lớp hoặc dạy kèm gia sư thực tế"
              required
              error={errors.experienceRange}
            >
              <div className="space-y-4">
                <SingleChoiceField
                  options={experienceRangeOptions}
                  value={form.experienceRange}
                  onChange={(val) =>
                    setForm((prev) => ({
                      ...prev,
                      experienceRange: val,
                    }))
                  }
                  columns={2}
                />

                <div className="pt-2 max-w-xs">
                  <Input
                    label="Số năm kinh nghiệm cụ thể (nếu có)"
                    type="number"
                    placeholder="Ví dụ: 3"
                    value={form.experienceYears || ''}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        experienceYears: e.target.value ? parseInt(e.target.value, 10) : null,
                      }))
                    }
                  />
                </div>
              </div>
            </QuestionCard>

            {/* Q24: Qualifications list */}
            <QuestionCard
              questionId="Q24"
              title="Bạn hiện có những loại bằng cấp hoặc chứng chỉ chuyên môn nào?"
              subtitle="Thêm các văn bằng, chứng chỉ để tăng độ uy tín với Quản trị viên và học viên"
            >
              <QualificationsField
                qualifications={form.qualifications}
                certificateTypes={certificateTypes}
                onChange={(newQuals) =>
                  setForm((prev) => ({
                    ...prev,
                    qualifications: newQuals,
                  }))
                }
              />
            </QuestionCard>
          </div>
        )}

        {/* ================= SECTION 6: Khả năng hỗ trợ & Giới thiệu (Q25 - Q28) ================= */}
        {currentSectionIndex === 5 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 bg-brand-50/40 border border-brand-100 rounded-2xl">
              <h2 className="text-sm font-bold text-brand-900">
                Phần 6: Khả năng hỗ trợ học viên & Giới thiệu bản thân
              </h2>
              <p className="text-xs text-brand-700/80 mt-0.5">
                Hoàn thiện các phương pháp hỗ trợ và viết lời giới thiệu truyền cảm hứng.
              </p>
            </div>

            {/* Q25: Support approaches */}
            <QuestionCard
              questionId="Q25"
              title="Khi học viên gặp khó khăn, bạn thường xử lý như thế nào?"
              subtitle="Cách bạn tháo gỡ vướng mắc và tạo động lực cho người học"
              required
              error={errors.supportApproaches}
            >
              <MultipleChoiceField
                options={supportApproaches}
                value={form.supportApproaches}
                onChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    supportApproaches: val,
                  }))
                }
                columns={2}
              />
            </QuestionCard>

            {/* Q26: Available support */}
            <QuestionCard
              questionId="Q26"
              title="Bạn có thể hỗ trợ học viên những hoạt động nào ngoài giờ học?"
              subtitle="Các hình thức đồng hành và hỗ trợ học viên sau buổi dạy"
              required
              error={errors.availableSupport}
            >
              <MultipleChoiceField
                options={supportTypes}
                value={form.availableSupport}
                onChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    availableSupport: val,
                  }))
                }
                columns={2}
              />
            </QuestionCard>

            {/* Q27: Assessment methods */}
            <QuestionCard
              questionId="Q27"
              title="Bạn thường đánh giá tiến độ học viên bằng phương thức nào?"
              subtitle="Cách bạn đo lường mức độ tiến bộ của học viên"
              required
              error={errors.assessmentMethods}
            >
              <MultipleChoiceField
                options={progressTracking}
                value={form.assessmentMethods}
                onChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    assessmentMethods: val,
                  }))
                }
                columns={2}
              />
            </QuestionCard>

            {/* Q28: Introduction */}
            <QuestionCard
              questionId="Q28"
              title="Hãy giới thiệu thêm về kinh nghiệm, thế mạnh và định hướng giảng dạy của bạn"
              subtitle="Lời giới thiệu xuất hiện trên hồ sơ công khai giúp tạo ấn tượng với học viên"
            >
              <Textarea
                placeholder="Giới thiệu phong cách giảng dạy, phương pháp bạn tâm đắc, hoặc cam kết đầu ra cho học viên..."
                rows={5}
                value={form.introduction}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    introduction: e.target.value,
                  }))
                }
                maxLength={2000}
              />
            </QuestionCard>
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Bar */}
      <QuestionnaireActions
        currentSectionIndex={currentSectionIndex}
        totalSections={sections.length}
        onPrevious={() => {
          setCurrentSectionIndex((prev) => Math.max(0, prev - 1));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNext={() => {
          setCurrentSectionIndex((prev) => Math.min(sections.length - 1, prev + 1));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        isSavingDraft={isSavingDraft}
        isSubmitting={isSubmitting}
        submitLabel={
          approvalStatus === 'approved'
            ? 'Cập nhật hồ sơ giảng dạy'
            : 'Nộp hồ sơ chờ phê duyệt'
        }
      />
    </div>
  );
}

export default TutorQuestionnairePage;
