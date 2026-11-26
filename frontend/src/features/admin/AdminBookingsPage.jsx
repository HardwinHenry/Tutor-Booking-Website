import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Calendar } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import StatusBadge from '../../components/common/StatusBadge';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import ErrorState from '../../components/feedback/ErrorState';
import { adminService } from '../../services/admin.service';
import { bookingService } from '../../services/booking.service';
import { calendarService } from '../../services/calendar.service';
import { BOOKING_STATUS } from '../../constants';
import { formatCurrency, formatDate, formatTime, formatDateTime, formatDuration } from '../../utils/formatters';

export function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  const [detailBooking, setDetailBooking] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        status: statusFilter,
        page,
        limit: 12,
        sortBy: 'createdAt',
        order: 'desc',
      };
      if (fromDate) params.from = new Date(`${fromDate}T00:00:00`).toISOString();
      if (toDate) params.to = new Date(`${toDate}T23:59:59`).toISOString();

      const data = await adminService.getBookings(params);
      setBookings(data?.items || []);
      setPagination(data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách booking');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, fromDate, toDate, page]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleOpenDetail = async (row) => {
    setDetailBooking(row);
    setSyncLogs([]);
    try {
      const [fresh, logs] = await Promise.all([
        bookingService.getBookingById(row._id),
        calendarService.getBookingSyncLogs(row._id).catch(() => []),
      ]);
      if (fresh) setDetailBooking(fresh);
      setSyncLogs(Array.isArray(logs) ? logs : []);
    } catch {
      // Keep snapshot
    }
  };

  const columns = [
    {
      key: 'learnerId',
      header: 'Học viên',
      render: (l) => (
        <div>
          <p className="font-semibold text-slate-900">{l?.name || '—'}</p>
          <p className="text-[11px] text-slate-500">{l?.email}</p>
        </div>
      ),
    },
    {
      key: 'tutorId',
      header: 'Gia sư',
      render: (t) => (
        <div>
          <p className="font-semibold text-slate-900">{t?.name || '—'}</p>
          <p className="text-[11px] text-slate-500">{t?.email}</p>
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
      render: (val) => <span className="font-bold text-slate-800 text-xs">{formatCurrency(val)}</span>,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (val) => <StatusBadge type="booking" status={val} />,
    },
    {
      key: 'actions',
      header: 'Chi tiết',
      align: 'right',
      render: (_, row) => (
        <Button variant="secondary" size="sm" onClick={() => handleOpenDetail(row)} className="px-2.5">
          <Eye className="w-3.5 h-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Tra cứu & Giám sát Booking</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Theo dõi toàn bộ lịch đặt học trên hệ thống, lịch sử trạng thái và đồng bộ Calendar
        </p>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <Select
            label="Trạng thái Booking"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            placeholder=""
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: BOOKING_STATUS.PENDING, label: 'Chờ xử lý (pending)' },
              { value: BOOKING_STATUS.CONFIRMED, label: 'Đã xác nhận (confirmed)' },
              { value: BOOKING_STATUS.COMPLETED, label: 'Hoàn thành (completed)' },
              { value: BOOKING_STATUS.REJECTED, label: 'Bị từ chối (rejected)' },
              { value: BOOKING_STATUS.CANCELLED, label: 'Đã hủy (cancelled)' },
            ]}
          />
          <Input
            label="Từ ngày học"
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
          />
          <Input
            label="Đến ngày học"
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setStatusFilter('all');
              setFromDate('');
              setToDate('');
              setPage(1);
            }}
          >
            Đặt lại bộ lọc
          </Button>
        </div>
      </Card>

      {error ? (
        <ErrorState message={error} onRetry={fetchBookings} />
      ) : (
        <Card bodyClassName="p-0">
          <Table
            columns={columns}
            data={bookings}
            isLoading={isLoading}
            emptyMessage="Không có booking nào khớp với điều kiện lọc."
            className="border-none rounded-none"
          />
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

      <Modal
        isOpen={Boolean(detailBooking)}
        onClose={() => setDetailBooking(null)}
        title="Chi tiết Booking (Admin)"
        size="md"
      >
        {detailBooking && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div>
                <p className="text-slate-500">Môn: {detailBooking.subjectName || 'Buổi học'}</p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {detailBooking.learnerId?.name} → {detailBooking.tutorId?.name}
                </p>
              </div>
              <StatusBadge type="booking" status={detailBooking.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-slate-200">
              <div>
                <p className="text-slate-400">Thời gian</p>
                <p className="font-semibold text-slate-800 inline-flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" />
                  {formatDate(detailBooking.startAt)}
                </p>
                <p className="text-slate-600">
                  {formatTime(detailBooking.startAt)} – {formatTime(detailBooking.endAt)}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Học phí snapshot</p>
                <p className="font-bold text-brand-700 text-sm mt-0.5">
                  {formatCurrency(detailBooking.price)}
                </p>
              </div>
            </div>

            {(detailBooking.rejectionReason || detailBooking.cancelReason) && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                <strong>Lý do từ chối / hủy:</strong>{' '}
                {detailBooking.rejectionReason || detailBooking.cancelReason}
              </div>
            )}

            {syncLogs.length > 0 && (
              <div className="space-y-2">
                <p className="font-bold text-slate-700">Trạng thái đồng bộ Google Calendar</p>
                {syncLogs.map((log) => (
                  <div
                    key={log._id}
                    className="p-2.5 rounded-lg border border-slate-200 flex items-center justify-between"
                  >
                    <span className="capitalize font-medium text-slate-700">
                      {log.userRole} ({log.userId?.email || log.userId?._id})
                    </span>
                    <StatusBadge type="calendarSync" status={log.syncStatus} />
                  </div>
                ))}
              </div>
            )}

            <p className="text-[11px] text-slate-400">
              Tạo lúc: {formatDateTime(detailBooking.createdAt)}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AdminBookingsPage;

