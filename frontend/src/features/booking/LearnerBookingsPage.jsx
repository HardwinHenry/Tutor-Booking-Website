import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Eye,
  XCircle,
  Star,
  RefreshCw,
  Search,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Textarea from '../../components/common/Textarea';
import LoadingState from '../../components/feedback/LoadingState';
import ErrorState from '../../components/feedback/ErrorState';
import EmptyState from '../../components/feedback/EmptyState';
import ReviewFormModal from '../review/components/ReviewFormModal';
import { toast } from '../../components/feedback/ToastProvider';
import { bookingService } from '../../services/booking.service';
import { calendarService } from '../../services/calendar.service';
import { reviewService } from '../../services/review.service';
import { BOOKING_STATUS } from '../../constants';
import { formatCurrency, formatDate, formatTime, formatDateTime, formatDuration } from '../../utils/formatters';

const TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: BOOKING_STATUS.PENDING, label: 'Chờ xác nhận' },
  { id: BOOKING_STATUS.CONFIRMED, label: 'Đã xác nhận' },
  { id: BOOKING_STATUS.COMPLETED, label: 'Hoàn thành' },
  { id: BOOKING_STATUS.REJECTED, label: 'Bị từ chối' },
  { id: BOOKING_STATUS.CANCELLED, label: 'Đã hủy' },
];

export function LearnerBookingsPage() {
  const [statusTab, setStatusTab] = useState('all');
  const [page, setPage] = useState(1);
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reviewed booking IDs map
  const [reviewedIds, setReviewedIds] = useState(new Set());

  // Detail modal
  const [detailBooking, setDetailBooking] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);
  const [isRetryingSync, setIsRetryingSync] = useState(false);

  // Cancel modal
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Review modal
  const [reviewTarget, setReviewTarget] = useState(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [bookingData, myReviewsData] = await Promise.all([
        bookingService.getMyBookings({
          status: statusTab,
          page,
          limit: 10,
          sortBy: 'startAt',
          order: 'desc',
        }),
        reviewService.getMyReviews({ limit: 50 }).catch(() => ({ reviews: [] })),
      ]);

      setBookings(bookingData?.items || []);
      setPagination(bookingData?.pagination || { page: 1, totalPages: 1, total: 0 });

      const revSet = new Set(
        (myReviewsData?.reviews || []).map((r) => r.bookingId?._id || r.bookingId)
      );
      setReviewedIds(revSet);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách buổi học');
    } finally {
      setIsLoading(false);
    }
  }, [statusTab, page]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleOpenDetail = async (booking) => {
    setDetailBooking(booking);
    setSyncLogs([]);
    try {
      const [fresh, logs] = await Promise.all([
        bookingService.getBookingById(booking._id),
        booking.status === BOOKING_STATUS.CONFIRMED || booking.status === BOOKING_STATUS.COMPLETED
          ? calendarService.getBookingSyncLogs(booking._id).catch(() => [])
          : Promise.resolve([]),
      ]);
      if (fresh) setDetailBooking(fresh);
      setSyncLogs(Array.isArray(logs) ? logs : []);
    } catch {
      // Keep existing snapshot
    }
  };

  const handleRetryCalendarSync = async (bookingId) => {
    setIsRetryingSync(true);
    try {
      await calendarService.retrySync(bookingId);
      toast.success('Đã thử đồng bộ lại Google Calendar');
      const logs = await calendarService.getBookingSyncLogs(bookingId).catch(() => []);
      setSyncLogs(Array.isArray(logs) ? logs : []);
      fetchBookings();
    } catch (err) {
      toast.error(err.message || 'Đồng bộ lại chưa thành công');
    } finally {
      setIsRetryingSync(false);
    }
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!cancelTarget) return;
    if (cancelReason.trim().length < 3) {
      toast.error('Vui lòng nhập lý do hủy (tối thiểu 3 ký tự)');
      return;
    }

    setIsCancelling(true);
    try {
      await bookingService.cancelBooking(cancelTarget._id, cancelReason.trim());
      toast.success('Đã hủy lịch hẹn thành công');
      setCancelTarget(null);
      setCancelReason('');
      setDetailBooking(null);
      fetchBookings();
    } catch (err) {
      toast.error(err.message || 'Không thể hủy lịch hẹn');
    } finally {
      setIsCancelling(false);
    }
  };

  const columns = [
    {
      key: 'tutorId',
      header: 'Gia sư & Môn học',
      render: (tutor, row) => (
        <div>
          <p className="font-bold text-slate-900">{tutor?.name || 'Gia sư'}</p>
          <p className="text-xs text-slate-500">
            {row.subjectName || row.subjectId?.name || 'Buổi học kèm'}
          </p>
        </div>
      ),
    },
    {
      key: 'startAt',
      header: 'Thời gian học',
      render: (_, row) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-800">{formatDate(row.startAt)}</p>
          <p className="text-slate-500">
            {formatTime(row.startAt)} – {formatTime(row.endAt)} ({formatDuration(row.durationMinutes)})
          </p>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Học phí',
      render: (val) => (
        <span className="font-bold text-slate-800 text-xs">{formatCurrency(val)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (val) => <StatusBadge type="booking" status={val} />,
    },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'right',
      render: (_, row) => {
        const canCancel =
          row.status === BOOKING_STATUS.PENDING || row.status === BOOKING_STATUS.CONFIRMED;
        const canReview =
          row.status === BOOKING_STATUS.COMPLETED && !reviewedIds.has(row._id);
        const alreadyReviewed =
          row.status === BOOKING_STATUS.COMPLETED && reviewedIds.has(row._id);

        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleOpenDetail(row)}
              className="px-2.5"
              title="Chi tiết"
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>

            {canReview && (
              <Button
                variant="primary"
                size="sm"
                iconLeft={Star}
                onClick={() => setReviewTarget(row)}
              >
                Đánh giá
              </Button>
            )}

            {alreadyReviewed && (
              <span className="text-[11px] font-semibold text-emerald-600 inline-flex items-center gap-1 px-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã đánh giá
              </span>
            )}

            {canCancel && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setCancelTarget(row);
                  setCancelReason('');
                }}
                title="Hủy lịch"
                className="px-2.5"
              >
                <XCircle className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Buổi học của tôi</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi trạng thái các yêu cầu đặt lịch, đồng bộ Google Calendar và đánh giá gia sư sau buổi học
          </p>
        </div>

        <Link to="/tutors">
          <Button variant="primary" size="sm" iconLeft={Search}>
            Đặt thêm buổi học
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setStatusTab(t.id);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusTab === t.id
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState message="Đang tải danh sách buổi học..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchBookings} />
      ) : bookings.length === 0 ? (
        <EmptyState
          title="Chưa có lịch hẹn nào"
          description="Khám phá danh sách gia sư phù hợp và chọn khung giờ trống để gửi yêu cầu học."
          action={
            <Link to="/tutors">
              <Button variant="primary" size="sm" iconLeft={Search}>
                Tìm gia sư ngay
              </Button>
            </Link>
          }
        />
      ) : (
        <Card bodyClassName="p-0">
          <Table columns={columns} data={bookings} className="border-none rounded-none" />
          <div className="border-t border-slate-100 px-4">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              onPageChange={setPage}
            />
          </div>
        </Card>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={Boolean(detailBooking)}
        onClose={() => setDetailBooking(null)}
        title="Chi tiết lịch hẹn"
        size="md"
      >
        {detailBooking && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div>
                <p className="text-slate-500">Gia sư phụ trách</p>
                <p className="text-sm font-bold text-slate-900">
                  {detailBooking.tutorId?.name || 'Gia sư'}
                </p>
              </div>
              <StatusBadge type="booking" status={detailBooking.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-slate-200/80">
              <div>
                <p className="text-slate-400">Thời gian</p>
                <p className="font-semibold text-slate-800 mt-0.5 inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" />
                  {formatDate(detailBooking.startAt)}
                </p>
                <p className="text-slate-600">
                  {formatTime(detailBooking.startAt)} – {formatTime(detailBooking.endAt)}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Hình thức & Học phí</p>
                <p className="font-semibold text-slate-800 mt-0.5 capitalize">
                  {detailBooking.learningMode || 'online'}
                </p>
                <p className="font-bold text-brand-700">{formatCurrency(detailBooking.price)}</p>
              </div>
              {detailBooking.location && (
                <div className="col-span-2 flex items-center gap-1.5 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{detailBooking.location}</span>
                </div>
              )}
            </div>

            {detailBooking.learnerNote && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <p className="font-bold text-slate-700 mb-1">Ghi chú của bạn:</p>
                <p className="text-slate-600">{detailBooking.learnerNote}</p>
              </div>
            )}

            {detailBooking.tutorNote && (
              <div className="p-3 rounded-xl bg-brand-50/70 border border-brand-200/70">
                <p className="font-bold text-brand-800 mb-1">Lời nhắn từ gia sư:</p>
                <p className="text-brand-900">{detailBooking.tutorNote}</p>
              </div>
            )}

            {(detailBooking.rejectionReason || detailBooking.cancelReason) && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                <p className="font-bold mb-0.5">
                  {detailBooking.status === BOOKING_STATUS.REJECTED ? 'Lý do từ chối:' : 'Lý do hủy:'}
                </p>
                <p>
                  {detailBooking.rejectionReason ||
                    (detailBooking.cancelReason === 'slot_already_booked'
                      ? 'Khung giờ này đã được gia sư xác nhận cho một học viên khác.'
                      : detailBooking.cancelReason)}
                </p>
              </div>
            )}

            {/* Calendar Sync Section */}
            {(detailBooking.status === BOOKING_STATUS.CONFIRMED ||
              detailBooking.status === BOOKING_STATUS.COMPLETED) && (
              <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Đồng bộ Google Calendar</span>
                  <StatusBadge
                    type="calendarSync"
                    status={syncLogs[0]?.syncStatus || 'not_connected'}
                  />
                </div>
                {syncLogs[0]?.syncStatus === 'failed' && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-rose-600">
                      Đồng bộ thất bại (booking vẫn được giữ nguyên hiệu lực).
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      iconLeft={RefreshCw}
                      isLoading={isRetryingSync}
                      onClick={() => handleRetryCalendarSync(detailBooking._id)}
                    >
                      Thử lại
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="text-[11px] text-slate-400 space-y-0.5 pt-1">
              <p>Tạo lúc: {formatDateTime(detailBooking.createdAt)}</p>
              {detailBooking.confirmedAt && (
                <p>Xác nhận lúc: {formatDateTime(detailBooking.confirmedAt)}</p>
              )}
              {detailBooking.completedAt && (
                <p>Hoàn thành lúc: {formatDateTime(detailBooking.completedAt)}</p>
              )}
              {detailBooking.cancelledAt && (
                <p>Hủy lúc: {formatDateTime(detailBooking.cancelledAt)}</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={Boolean(cancelTarget)}
        onClose={() => !isCancelling && setCancelTarget(null)}
        title="Hủy yêu cầu / buổi học"
        description="Vui lòng nhập lý do hủy rõ ràng để thông báo cho gia sư."
        size="sm"
      >
        <form onSubmit={handleConfirmCancel} className="space-y-4">
          <Textarea
            label="Lý do hủy"
            required
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Ví dụ: Có việc đột xuất, xin phép dời sang buổi khác..."
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCancelTarget(null)}
              disabled={isCancelling}
            >
              Đóng
            </Button>
            <Button type="submit" variant="danger" isLoading={isCancelling}>
              Xác nhận hủy
            </Button>
          </div>
        </form>
      </Modal>

      {/* Review Form Modal */}
      <ReviewFormModal
        isOpen={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        booking={reviewTarget}
        onSubmitted={fetchBookings}
      />
    </div>
  );
}

export default LearnerBookingsPage;

