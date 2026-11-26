import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Save,
  Send,
  ClipboardList,
  Award,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Star,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Badge from '../../components/common/Badge';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingState from '../../components/feedback/LoadingState';
import ErrorState from '../../components/feedback/ErrorState';
import { toast } from '../../components/feedback/ToastProvider';
import { tutorService } from '../../services/tutor.service';
import { useAuthStore } from '../../store/useAuthStore';
import { formatCurrency } from '../../utils/formatters';

export function TutorProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [introduction, setIntroduction] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(0);
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [serviceAreasText, setServiceAreasText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await tutorService.getMyProfile(true);
      setProfile(data);
      setIntroduction(data?.introduction || '');
      setExperienceYears(data?.experienceYears ?? 0);
      setPriceMin(data?.teachingConditions?.priceMin ?? 0);
      setPriceMax(data?.teachingConditions?.priceMax ?? 0);
      setIsNegotiable(Boolean(data?.teachingConditions?.isNegotiable));
      setServiceAreasText((data?.teachingConditions?.serviceAreas || []).join(', '));
    } catch (err) {
      setError(err.message || 'Không thể tải hồ sơ gia sư');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveQuickInfo = async (e) => {
    e.preventDefault();
    if (!isNegotiable && Number(priceMax) > 0 && Number(priceMin) > Number(priceMax)) {
      toast.error('Học phí tối thiểu không được lớn hơn học phí tối đa');
      return;
    }

    setIsSaving(true);
    try {
      const areas = serviceAreasText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const updated = await tutorService.updateMyProfile({
        introduction: introduction.trim(),
        experienceYears: Number(experienceYears) || 0,
        teachingConditions: {
          priceMin: isNegotiable ? 0 : Number(priceMin) || 0,
          priceMax: isNegotiable ? 0 : Number(priceMax) || 0,
          isNegotiable,
          serviceAreas: areas,
        },
      });
      setProfile(updated);
      toast.success('Đã cập nhật thông tin hồ sơ giảng dạy');
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    setIsSubmitting(true);
    try {
      const submitted = await tutorService.submitMyProfile({});
      setProfile(submitted);
      toast.success('Đã gửi hồ sơ lên Quản trị viên xét duyệt');
    } catch (err) {
      toast.error(
        err.message || 'Hồ sơ chưa đủ thông tin bắt buộc. Vui lòng hoàn tất bộ câu hỏi 28 mục.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingState message="Đang tải hồ sơ gia sư..." />;
  if (error) return <ErrorState message={error} onRetry={loadProfile} />;

  const approvalStatus = profile?.approvalStatus || 'draft';
  const subjects = profile?.expertise?.subjectIds || [];
  const qualifications = profile?.qualifications || [];
  const avgRating = profile?.ratingSummary?.averageRating;
  const reviewCount = profile?.ratingSummary?.reviewCount || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Hồ sơ giảng dạy của tôi</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cập nhật phần giới thiệu công khai, học phí và theo dõi trạng thái kiểm duyệt từ Admin
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/tutor/questionnaire">
            <Button variant="secondary" size="sm" iconLeft={ClipboardList}>
              Sửa bộ 28 câu hỏi
            </Button>
          </Link>
          {(approvalStatus === 'draft' || approvalStatus === 'rejected') && (
            <Button
              variant="primary"
              size="sm"
              iconLeft={Send}
              isLoading={isSubmitting}
              onClick={handleSubmitForApproval}
            >
              Gửi duyệt hồ sơ
            </Button>
          )}
        </div>
      </div>

      {/* Approval Banner */}
      <div
        className={`rounded-2xl p-4 border flex items-start gap-3 text-xs ${
          approvalStatus === 'approved'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : approvalStatus === 'rejected'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : approvalStatus === 'pending'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}
      >
        {approvalStatus === 'approved' ? (
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
        ) : approvalStatus === 'rejected' ? (
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        ) : (
          <Clock className="w-5 h-5 shrink-0 mt-0.5" />
        )}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold">Trạng thái duyệt hồ sơ:</span>
            <StatusBadge type="tutorProfile" status={approvalStatus} />
          </div>
          {approvalStatus === 'rejected' && profile?.rejectionReason && (
            <p>
              <strong>Lý do từ chối:</strong> {profile.rejectionReason}
            </p>
          )}
          {approvalStatus !== 'approved' && (
            <p>
              Hồ sơ chưa được duyệt sẽ không hiển thị trong kết quả tìm kiếm hoặc gợi ý gia sư công khai.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit form */}
        <div className="lg:col-span-2">
          <Card
            title="Thông tin giới thiệu & Điều kiện dạy"
            subtitle="Chỉnh sửa nhanh thông tin hiển thị cho học viên"
          >
            <form onSubmit={handleSaveQuickInfo} className="space-y-4">
              <Textarea
                label="Giới thiệu bản thân & phương pháp giảng dạy"
                rows={5}
                value={introduction}
                onChange={(e) => setIntroduction(e.target.value)}
                placeholder="Chia sẻ kinh nghiệm, thành tích, đối tượng học viên bạn thường hướng dẫn..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Số năm kinh nghiệm"
                  type="number"
                  min={0}
                  max={60}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                />
                <Input
                  label="Khu vực dạy Offline (cách nhau dấu phẩy)"
                  value={serviceAreasText}
                  onChange={(e) => setServiceAreasText(e.target.value)}
                  placeholder="Ví dụ: Quận 1, Quận 3, Cầu Giấy"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Học phí dự kiến (VNĐ / 60 phút)
                  </span>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isNegotiable}
                      onChange={(e) => setIsNegotiable(e.target.checked)}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    Có thể thương lượng
                  </label>
                </div>

                {!isNegotiable && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Học phí tối thiểu (VNĐ)"
                      type="number"
                      min={0}
                      step={10000}
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                    />
                    <Input
                      label="Học phí tối đa (VNĐ)"
                      type="number"
                      min={0}
                      step={10000}
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" iconLeft={Save} isLoading={isSaving}>
                  Lưu cập nhật
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Public Preview & Qualifications */}
        <div className="space-y-6">
          <Card title="Xem trước hiển thị công khai">
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-lg">
                  {(user?.name || 'G').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">{user?.name}</p>
                  <p className="text-slate-500">
                    {profile?.expertise?.categoryId?.name || 'Chưa chọn lĩnh vực'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-500">Đánh giá:</span>
                {reviewCount > 0 && avgRating ? (
                  <span className="font-bold text-slate-800 inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    {Number(avgRating).toFixed(1)} ({reviewCount})
                  </span>
                ) : (
                  <span className="text-slate-400">Chưa có đánh giá</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Học phí / 60p:</span>
                <span className="font-bold text-brand-700">
                  {isNegotiable ? 'Thương lượng' : formatCurrency(priceMin)}
                </span>
              </div>

              {subjects.length > 0 && (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {subjects.map((s) => (
                    <Badge key={s._id} color="slate" size="sm">
                      {s.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card title="Bằng cấp & Chứng chỉ" subtitle="Quản lý chi tiết trong bộ 28 câu hỏi">
            {qualifications.length === 0 ? (
              <p className="text-xs text-slate-400">Chưa khai báo bằng cấp hoặc chứng chỉ.</p>
            ) : (
              <div className="space-y-2.5 text-xs">
                {qualifications.map((q, idx) => (
                  <div
                    key={q._id || idx}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-start justify-between gap-2"
                  >
                    <div className="flex items-start gap-2">
                      <Award className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-800">{q.title}</p>
                        <p className="text-slate-500">{q.issuer}</p>
                      </div>
                    </div>
                    {q.verified && (
                      <Badge color="emerald" size="sm">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Đã xác minh
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TutorProfilePage;

