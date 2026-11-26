import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import Select from '../../../components/common/Select';
import Input from '../../../components/common/Input';
import Textarea from '../../../components/common/Textarea';
import { toast } from '../../../components/feedback/ToastProvider';
import { bookingService } from '../../../services/booking.service';
import { useAuthStore } from '../../../store/useAuthStore';
import { ROLES } from '../../../constants';
import { formatCurrency, formatDate, formatTime, formatDuration } from '../../../utils/formatters';

export function BookingConfirmModal({ isOpen, onClose, slot, tutorProfile, onSuccessOrConflict }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, surveyStatus } = useAuthStore();

  const subjects = tutorProfile?.expertise?.subjectIds || [];
  const modes = tutorProfile?.teachingConditions?.modes || [];

  const [subjectId, setSubjectId] = useState('');
  const [learningMode, setLearningMode] = useState('online');
  const [locationText, setLocationText] = useState('');
  const [learnerNote, setLearnerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && tutorProfile) {
      setSubjectId(subjects[0]?._id || '');
      const defaultMode = modes[0]?.slug || modes[0]?.name?.toLowerCase() || 'online';
      setLearningMode(defaultMode.includes('offline') ? 'offline' : 'online');
      setLocationText('');
      setLearnerNote('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, slot?._id]);

  if (!slot || !tutorProfile) return null;

  const durationMinutes = Math.round(
    (new Date(slot.endAt).getTime() - new Date(slot.startAt).getTime()) / 60000
  );
  const hourlyRate = tutorProfile.teachingConditions?.priceMin || 0;
  const estimatedPrice = tutorProfile.teachingConditions?.isNegotiable && hourlyRate === 0
    ? null
    : Math.round((hourlyRate * durationMinutes) / 60);

  const selectedSubject = subjects.find((s) => s._id === subjectId);

  const handleConfirm = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      onClose();
      navigate('/login', { state: { from: location } });
      return;
    }

    if (user?.role !== ROLES.LEARNER) {
      toast.error('Chỉ tài khoản Học viên (Learner) mới có thể gửi yêu cầu đặt lịch học.');
      return;
    }

    if (surveyStatus !== 'completed') {
      onClose();
      toast.warning('Vui lòng hoàn thành khảo sát 28 câu trước khi đặt lịch học.');
      navigate('/learner/questionnaire');
      return;
    }

    setIsSubmitting(true);
    try {
      await bookingService.createBooking({
        slotId: slot._id,
        subjectId: subjectId || undefined,
        subjectName: selectedSubject?.name || tutorProfile.expertise?.categoryId?.name || '',
        learningMode,
        location: locationText.trim() || undefined,
        learnerNote: learnerNote.trim() || undefined,
      });

      toast.success('Đã gửi yêu cầu đặt lịch! Vui lòng chờ gia sư xác nhận.');
      onClose();
      onSuccessOrConflict?.(true);
    } catch (err) {
      toast.error(err.message || 'Không thể gửi yêu cầu đặt lịch');
      // Refresh slot picker in case slot was just taken/closed (409 or 400)
      if (err.statusCode === 409 || err.statusCode === 400) {
        onSuccessOrConflict?.(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title="Xác nhận gửi yêu cầu đặt lịch"
      description="Yêu cầu sẽ ở trạng thái Chờ xác nhận (pending) cho đến khi gia sư đồng ý."
      size="md"
    >
      <form onSubmit={handleConfirm} className="space-y-4">
        {/* Booking Summary Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Gia sư:</span>
            <strong className="text-slate-900 text-sm">
              {tutorProfile.userId?.name || 'Gia sư'}
            </strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Ngày học:
            </span>
            <strong className="text-slate-800">{formatDate(slot.startAt)}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Khung giờ:
            </span>
            <strong className="text-slate-800">
              {formatTime(slot.startAt)} – {formatTime(slot.endAt)} ({formatDuration(durationMinutes)})
            </strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Múi giờ:</span>
            <span className="text-slate-700">{slot.timezone || 'Asia/Ho_Chi_Minh'}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
            <span className="text-slate-500">Học phí dự kiến:</span>
            <strong className="text-brand-700 text-sm">
              {estimatedPrice !== null ? formatCurrency(estimatedPrice) : 'Thương lượng'}
            </strong>
          </div>
        </div>

        {subjects.length > 0 && (
          <Select
            label="Môn học muốn đăng ký"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            placeholder=""
            options={subjects.map((s) => ({ value: s._id, label: s.name }))}
          />
        )}

        <Select
          label="Hình thức học"
          value={learningMode}
          onChange={(e) => setLearningMode(e.target.value)}
          placeholder=""
          options={[
            { value: 'online', label: 'Học trực tuyến (Online)' },
            { value: 'offline', label: 'Học trực tiếp (Offline)' },
          ]}
        />

        <Input
          label={learningMode === 'offline' ? 'Địa điểm học dự kiến' : 'Ghi chú nền tảng học (tùy chọn)'}
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
          placeholder={
            learningMode === 'offline'
              ? 'Ví dụ: Quận 3, TP.HCM hoặc thư viện...'
              : 'Ví dụ: Google Meet / Zoom...'
          }
        />

        <Textarea
          label="Mục tiêu / Ghi chú cho gia sư (tùy chọn)"
          rows={3}
          value={learnerNote}
          onChange={(e) => setLearnerNote(e.target.value)}
          placeholder="Chia sẻ ngắn gọn trình độ hiện tại và nội dung bạn muốn tập trung trong buổi học này..."
        />

        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-[11px] text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Lưu ý: Gửi yêu cầu <strong>chưa khóa cứng khung giờ</strong>. Lịch học chỉ được xác nhận và khóa khi gia sư bấm Xác nhận.
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" iconLeft={CheckCircle2} isLoading={isSubmitting}>
            {isAuthenticated ? 'Gửi yêu cầu đặt lịch' : 'Đăng nhập để đặt lịch'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default BookingConfirmModal;

