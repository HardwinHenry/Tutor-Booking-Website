import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  AlertCircle,
  CheckCheck,
  RefreshCw,
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
import { toast } from '../../components/feedback/ToastProvider';
import { bookingService } from '../../services/booking.service';
import { calendarService } from '../../services/calendar.service';
import { BOOKING_STATUS } from '../../constants';
import { formatCurrency, formatDate, formatTime, formatDateTime, formatDuration } from '../../utils/formatters';

const TABS = [
  { id: BOOKING_STATUS.PENDING, label: 'Chờ xử lý' },
  { id: BOOKING_STATUS.CONFIRMED, label: 'Đã xác nhận' },
  { id: BOOKING_STATUS.COMPLETED, label: 'Hoàn thành' },
  { id: BOOKING_STATUS.REJECTED, label: 'Đã từ chối' },
  { id: BOOKING_STATUS.CANCELLED, label: 'Đã hủy' },
  { id: 'all', label: 'Tất cả' },
];

export function TutorBookingsPage() {
  const [statusTab, setStatusTab] = useState(BOOKING_STATUS.PENDING);
  const [page, setPage] = useState(1);
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Action Modals
  const [detailBooking, setDetailBooking] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);
  const [actionModal, setActionModal] = useState({ type: null, booking: null }); // 'confirm' | 'reject' | 'cancel' | 'complete'
  const [actionText, setActionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await bookingService.getMyBookings({
        status: statusTab,
        page,
        limit: 10,
        sortBy: 'startAt',
        order: statusTab === BOOKING_STATUS.PENDING ? 'asc' : 'desc',
      });
      setBookings(data?.items || []);
      setPagination(data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách yêu cầu đặt lịch');
    } finally {
      setIsLoading(false);
    }
  }, [statusTab, page]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const openActionModal = (type, booking) => {
    setActionModal({ type, booking });
    setActionText('');
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    const { type, booking } = actionModal;
    if (!type || !booking) return;

    if ((type === 'reject' || type === 'cancel') && actionText.trim().length < 3) {
      toast.error('Vui lòng nhập lý do tối thiểu 3 ký tự');
      return;
    }

    setIsSubmitting(true);
    try {
      if (type === 'confirm') {
        await bookingService.confirmBooking(booking._id, actionText.trim() || undefined);
        toast.success('Đã xác nhận buổi học và khóa khung giờ');
      } else if (type === 'reject') {
        await bookingService.rejectBooking(booking._id, actionText.trim());
        toast.success('Đã từ chối yêu cầu đặt lịch');
      } else if (type === 'cancel') {
        await bookingService.cancelBooking(booking._id, actionText.trim());
        toast.success('Đã hủy buổi học');
      } else if (type === 'complete') {
        await bookingService.completeBooking(booking._id, actionText.trim() || undefined);
        toast.success('Đã đánh dấu hoàn thành buổi học');
      }

      setActionModal({ type: null, booking: null });
      setDetailBooking(null);
      fetchBookings();
    } catch (err) {
      toast.error(err.message || 'Thao tác thất bại');
      // Reload in case another booking already confirmed this slot (409 conflict)
      fetchBookings();
    } finally {
      setIsSubmitting(false);
    }
  };

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
      // Keep snapshot
    }
  };

  const handleRetrySync = async (bookingId) => {
    try {
      await calendarService.retrySync(bookingId);
      toast.success('Đã đồng bộ lại Google Calendar');
      const logs = await calendarService.getBookingSyncLogs(bookingId).catch(() => []);
      setSyncLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      toast.error(err.message || 'Thử đồng bộ lại thất bại');
    }
  };

  const columns = [
    {
      key: 'learnerId',
      header: 'Học viên & Môn học',
      render: (learner, row) => (
        <div>
          <p className="font-bold text-slate-900">{learner?.name || 'Học viên'}</p>
          <p className="text-xs text-slate-500">
            {row.subjectName || row.subjectId?.name || 'Buổi học kèm'}
          </p>
        </div>
      ),
    },
    {
      key: 'startAt',
      header: 'Thời gian',
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
      render: (val) => <span className="font-bold text-slate-800 text-xs">{formatCurrency(val)}</span>,
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
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenDetail(row)}
            className="px-2"
            title="Xem chi tiết"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>

          {row.status === BOOKING_STATUS.PENDING && (
            <>
              <Button
                variant="success"
                size="sm"
                onClick={() => openActionModal('confirm', row)}
                title="Xác nhận nhận lớp"
                className="px-2.5"
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Duyệt
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => openActionModal('reject', row)}
                title="Từ chối"
                className="px-2"
              >
                <XCircle className="w-3.5 h-3.5" />
              </Button>
            </>
          )}

          {row.status === BOOKING_STATUS.CONFIRMED && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => openActionModal('complete', row)}
                title="Đánh dấu hoàn thành"
                className="px-2.5"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" /> Hoàn thành
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => openActionModal('cancel', row)}
                title="Hủy lịch"
                className="px-2"
              >
                <XCircle className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const modalTitleMap = {
    confirm: 'Xác nhận nhận buổi học',
    reject: 'Từ chối yêu cầu đặt lịch',
    cancel: 'Hủy buổi học đã xác nhận',
    complete: 'Hoàn thành buổi học',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Quản lý yêu cầu Booking</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Xem yêu cầu đặt lịch từ học viên, xác nhận hoặc từ chối theo quy tắc giữ chỗ của hệ thống
        </p>
      </div>

      <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 flex items-start gap-2.5 text-xs text-sky-900">
        <AlertCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <span>
          Một khung giờ rảnh có thể nhận nhiều yêu cầu <code>pending</code>. Khi bạn bấm <strong>Duyệt</strong> một yêu cầu, khung giờ sẽ khóa sang <code>booked</code> và các yêu cầu pending trùng slot còn lại sẽ tự động hủy.
        </span>
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
        <LoadingState message="Đang tải danh sách yêu cầu đặt lịch..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchBookings} />
      ) : bookings.length === 0 ? (
        <EmptyState
          title="Không có booking nào trong mục này"
          description="Các yêu cầu mới từ học viên sẽ xuất hiện tại đây ngay khi được gửi."
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
        title="Chi tiết yêu cầu Booking"
        size="md"
      >
        {detailBooking && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div>
                <p className="text-slate-500">Học viên</p>
                <p className="text-sm font-bold text-slate-900">
                  {detailBooking.learnerId?.name || 'Học viên'}
                </p>
              </div>
              <StatusBadge type="booking" status={detailBooking.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-slate-200/80">
              <div>
                <p className="text-slate-400">Thời gian dạy</p>
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
            </div>

            {detailBooking.learnerNote && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <p className="font-bold text-slate-700 mb-1">Ghi chú từ học viên:</p>
                <p className="text-slate-600">{detailBooking.learnerNote}</p>
              </div>
            )}

            {(detailBooking.status === BOOKING_STATUS.CONFIRMED ||
              detailBooking.status === BOOKING_STATUS.COMPLETED) && (
              <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-700">Google Calendar</p>
                  <StatusBadge
                    type="calendarSync"
                    status={syncLogs[0]?.syncStatus || 'not_connected'}
                    className="mt-1"
                  />
                </div>
                {syncLogs[0]?.syncStatus === 'failed' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    iconLeft={RefreshCw}
                    onClick={() => handleRetrySync(detailBooking._id)}
                  >
                    Thử đồng bộ lại
                  </Button>
                )}
              </div>
            )}

            <p className="text-[11px] text-slate-400">
              Tạo lúc: {formatDateTime(detailBooking.createdAt)}
            </p>
          </div>
        )}
      </Modal>

      {/* Action Modal (Confirm / Reject / Cancel / Complete) */}
      <Modal
        isOpen={Boolean(actionModal.type)}
        onClose={() => !isSubmitting && setActionModal({ type: null, booking: null })}
        title={modalTitleMap[actionModal.type] || 'Thao tác Booking'}
        size="sm"
      >
        <form onSubmit={handleActionSubmit} className="space-y-4">
          <Textarea
            label={
              actionModal.type === 'reject'
                ? 'Lý do từ chối'
                : actionModal.type === 'cancel'
                  ? 'Lý do hủy buổi học'
                  : 'Lời nhắn cho học viên (tùy chọn)'
            }
            required={actionModal.type === 'reject' || actionModal.type === 'cancel'}
            rows={3}
            value={actionText}
            onChange={(e) => setActionText(e.target.value)}
            placeholder={
              actionModal.type === 'confirm'
                ? 'Ví dụ: Gửi bạn link Google Meet hoặc dặn dò chuẩn bị bài trước buổi học...'
                : 'Nhập lý do cụ thể...'
            }
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setActionModal({ type: null, booking: null })}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant={
                actionModal.type === 'reject' || actionModal.type === 'cancel'
                  ? 'danger'
                  : 'primary'
              }
              isLoading={isSubmitting}
            >
              Xác nhận
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default TutorBookingsPage;

