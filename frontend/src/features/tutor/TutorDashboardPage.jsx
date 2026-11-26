import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  BookOpen,
  Calendar,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Award,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuthStore } from '../../store/useAuthStore';
import { tutorService } from '../../services/tutor.service';
import { availabilityService } from '../../services/availability.service';
import { bookingService } from '../../services/booking.service';
import { calendarService } from '../../services/calendar.service';
import { formatDate, formatTime } from '../../utils/formatters';
import { calculateTutorProgress, mapBackendToTutorForm } from '../questionnaire/utils/tutorFormMapper';

export function TutorDashboardPage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [availableSlotsCount, setAvailableSlotsCount] = useState(0);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      tutorService.getMyProfile(true),
      availabilityService.getMySlots({ status: 'available', limit: 1 }).catch(() => null),
      bookingService.getMyBookings({ status: 'pending', limit: 5, sortBy: 'startAt', order: 'asc' }).catch(() => null),
      calendarService.getStatus().catch(() => null),
    ])
      .then(([profData, availRes, pendingRes, calRes]) => {
        if (!isMounted) return;
        setProfile(profData);
        setAvailableSlotsCount(availRes?.pagination?.total || 0);
        setPendingBookings(pendingRes?.items || []);
        setPendingCount(pendingRes?.pagination?.total || 0);
        setCalendarConnected(Boolean(calRes?.connected));
      })
      .catch((err) => {
        console.error('Không thể tải thông tin gia sư:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const formState = profile ? mapBackendToTutorForm(profile) : null;
  const progress = formState ? calculateTutorProgress(formState) : { answered: 0, total: 28, percentage: 0 };
  const approvalStatus = profile?.approvalStatus || 'draft';
  const completionStatus = profile?.completionStatus || 'not_started';
  const rejectionReason = profile?.rejectionReason;

  const categoryName = profile?.expertise?.categoryId?.name;
  const subjects = profile?.expertise?.subjectIds || [];
  const qualificationsCount = profile?.qualifications?.length || 0;

  return (
    <div className="space-y-6">
      {/* Dynamic Status Banners based on Approval Status */}
      {approvalStatus === 'draft' && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start space-x-3 text-xs">
          <ClipboardList className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Trạng thái hồ sơ:</span>
              <StatusBadge type="tutorProfile" status="draft" />
            </div>
            <p className="text-slate-600 mt-1 leading-relaxed">
              Bạn đang ở bản nháp hồ sơ ({progress.answered}/28 câu). Vui lòng hoàn thành và nộp hồ sơ để Quản trị viên xét duyệt.
            </p>
          </div>
          <Link to="/tutor/questionnaire">
            <Button variant="primary" size="sm" iconRight={ArrowRight}>
              Tiếp tục khai báo
            </Button>
          </Link>
        </div>
      )}

      {approvalStatus === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3 text-xs">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-900">Trạng thái hồ sơ:</span>
              <StatusBadge type="tutorProfile" status="pending" />
            </div>
            <p className="text-amber-800 mt-1 leading-relaxed">
              Hồ sơ gia sư của bạn đang trong trạng thái chờ Quản trị viên duyệt. Sau khi được duyệt, khung giờ rảnh của bạn sẽ được hiển thị công khai tới học viên.
            </p>
          </div>
        </div>
      )}

      {approvalStatus === 'rejected' && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start space-x-3 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-rose-900">Hồ sơ chưa được duyệt:</span>
              <StatusBadge type="tutorProfile" status="rejected" />
            </div>
            {rejectionReason && (
              <p className="text-rose-700 mt-1">
                Lý do: <strong>{rejectionReason}</strong>
              </p>
            )}
            <p className="text-rose-600 mt-0.5">
              Vui lòng cập nhật lại thông tin theo yêu cầu và nộp lại hồ sơ.
            </p>
          </div>
          <Link to="/tutor/questionnaire">
            <Button variant="danger" size="sm" iconRight={ArrowRight}>
              Chỉnh sửa hồ sơ
            </Button>
          </Link>
        </div>
      )}

      {approvalStatus === 'approved' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start space-x-3 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-900">Trạng thái hồ sơ:</span>
              <StatusBadge type="tutorProfile" status="approved" />
            </div>
            <p className="text-emerald-800 mt-1 leading-relaxed">
              Hồ sơ của bạn đã được phê duyệt công khai. Hãy mở các khung giờ rảnh để học viên có thể đặt lịch học!
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Bàn làm việc Gia sư 🎓
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý năng lực giảng dạy, khung giờ rảnh và xử lý yêu cầu đặt lịch học
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/tutor/availability">
            <Button variant="primary" size="sm" iconLeft={Clock}>
              Tạo khung giờ rảnh
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Bộ câu hỏi 28 mục</p>
              <p className="text-sm font-bold text-slate-800">
                {approvalStatus === 'approved'
                  ? 'Đã duyệt'
                  : approvalStatus === 'pending'
                  ? 'Chờ duyệt'
                  : approvalStatus === 'rejected'
                  ? 'Bị từ chối'
                  : `Bản nháp (${progress.percentage}%)`}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Khung giờ rảnh mở</p>
              <p className="text-sm font-bold text-slate-800">{availableSlotsCount} slot</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Yêu cầu booking mới</p>
              <p className="text-sm font-bold text-slate-800">{pendingCount} yêu cầu</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Google Calendar</p>
              <StatusBadge
                type="calendarSync"
                status={calendarConnected ? 'synced' : 'not_connected'}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Main sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Yêu cầu đặt lịch chờ phản hồi"
            subtitle="Xác nhận hoặc từ chối booking từ học viên theo chính sách"
            action={
              <Link to="/tutor/bookings">
                <Button variant="outline" size="sm" iconRight={ArrowRight}>
                  Xử lý ngay
                </Button>
              </Link>
            }
          >
            {pendingBookings.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Chưa có yêu cầu đặt lịch nào đang chờ xác nhận.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingBookings.map((b) => (
                  <div key={b._id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-bold text-slate-800">
                        {b.learnerId?.name || 'Học viên'} — {b.subjectName || 'Buổi học'}
                      </p>
                      <p className="text-slate-500 mt-0.5">
                        {formatDate(b.startAt)} • {formatTime(b.startAt)} – {formatTime(b.endAt)}
                      </p>
                    </div>
                    <StatusBadge type="booking" status={b.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Profile overview if data exists */}
          {categoryName && (
            <Card title="Tóm tắt năng lực giảng dạy" subtitle="Thông tin khai báo trong bộ câu hỏi 28 mục">
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 min-w-[120px]">Lĩnh vực chính:</span>
                  <Badge variant="primary">{categoryName}</Badge>
                </div>
                {subjects.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-700 min-w-[120px]">Môn giảng dạy:</span>
                    {subjects.map((sub) => (
                      <span
                        key={sub._id || sub.id}
                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-medium"
                      >
                        {sub.name}
                      </span>
                    ))}
                  </div>
                )}
                {qualificationsCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 min-w-[120px]">Bằng cấp / Chứng chỉ:</span>
                    <span className="flex items-center gap-1 font-bold text-brand-600">
                      <Award className="w-3.5 h-3.5" />
                      {qualificationsCount} văn bằng đã khai báo
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Hồ sơ năng lực giảng dạy">
            <div className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Hãy hoàn thành đầy đủ 28 câu hỏi năng lực (môn học, phương pháp, học phí và bằng cấp) để Admin xét duyệt.
              </p>
              <Link to="/tutor/questionnaire" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full" iconRight={ArrowRight}>
                  {approvalStatus === 'approved' ? 'Xem & Chỉnh sửa hồ sơ 28 câu' : 'Cập nhật hồ sơ 28 câu'}
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TutorDashboardPage;
