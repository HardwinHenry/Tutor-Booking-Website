import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Clock,
  Calendar,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  AlertCircle,
  LayoutGrid,
  List,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import StatusBadge from '../../components/common/StatusBadge';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ErrorState from '../../components/feedback/ErrorState';
import EmptyState from '../../components/feedback/EmptyState';
import LoadingState from '../../components/feedback/LoadingState';
import { toast } from '../../components/feedback/ToastProvider';
import { availabilityService } from '../../services/availability.service';
import { tutorService } from '../../services/tutor.service';
import { AVAILABILITY_STATUS } from '../../constants';
import { formatDate, formatTime, formatDuration } from '../../utils/formatters';

const TIMEZONES = [
  { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho_Chi_Minh (GMT+7)' },
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok (GMT+7)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+9)' },
  { value: 'UTC', label: 'UTC (GMT+0)' },
];

const getTodayDateStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export function TutorAvailabilityPage() {
  const [profile, setProfile] = useState(null);
  const [slots, setSlots] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & view
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'table'

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [formDate, setFormDate] = useState(getTodayDateStr());
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('20:30');
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  const [note, setNote] = useState('');
  const [repeatWeeks, setRepeatWeeks] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    tutorService
      .getMyProfile(false)
      .then((p) => setProfile(p))
      .catch(() => {});
  }, []);

  const fetchSlots = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        status: statusFilter,
        page,
        limit: 20,
      };
      if (fromDate) params.from = new Date(`${fromDate}T00:00:00`).toISOString();
      if (toDate) params.to = new Date(`${toDate}T23:59:59`).toISOString();

      const data = await availabilityService.getMySlots(params);
      setSlots(data?.items || []);
      setPagination(data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách khung giờ rảnh');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, fromDate, toDate, page]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const openCreateModal = () => {
    setEditingSlot(null);
    setFormDate(getTodayDateStr());
    setStartTime('19:00');
    setEndTime('20:30');
    setTimezone('Asia/Ho_Chi_Minh');
    setNote('');
    setRepeatWeeks('1');
    setIsModalOpen(true);
  };

  const openEditModal = (slot) => {
    const startObj = new Date(slot.startAt);
    const endObj = new Date(slot.endAt);
    const y = startObj.getFullYear();
    const m = String(startObj.getMonth() + 1).padStart(2, '0');
    const d = String(startObj.getDate()).padStart(2, '0');
    const sh = String(startObj.getHours()).padStart(2, '0');
    const sm = String(startObj.getMinutes()).padStart(2, '0');
    const eh = String(endObj.getHours()).padStart(2, '0');
    const em = String(endObj.getMinutes()).padStart(2, '0');

    setEditingSlot(slot);
    setFormDate(`${y}-${m}-${d}`);
    setStartTime(`${sh}:${sm}`);
    setEndTime(`${eh}:${em}`);
    setTimezone(slot.timezone || 'Asia/Ho_Chi_Minh');
    setNote(slot.note || '');
    setRepeatWeeks('1');
    setIsModalOpen(true);
  };

  const handleSubmitSlot = async (e) => {
    e.preventDefault();
    const startObj = new Date(`${formDate}T${startTime}:00`);
    const endObj = new Date(`${formDate}T${endTime}:00`);

    if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
      toast.error('Ngày hoặc giờ không hợp lệ');
      return;
    }
    if (startObj <= new Date()) {
      toast.error('Thời gian bắt đầu phải nằm trong tương lai');
      return;
    }
    if (startObj >= endObj) {
      toast.error('Giờ kết thúc phải lớn hơn giờ bắt đầu');
      return;
    }
    const durationMins = (endObj.getTime() - startObj.getTime()) / 60000;
    if (durationMins < 15 || durationMins > 480) {
      toast.error('Thời lượng mỗi slot phải từ 15 phút đến 8 giờ');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSlot) {
        await availabilityService.updateSlot(editingSlot._id, {
          startAt: startObj.toISOString(),
          endAt: endObj.toISOString(),
          timezone,
          note: note.trim(),
        });
        toast.success('Cập nhật khung giờ thành công');
      } else {
        const weeks = Math.max(1, Math.min(8, Number(repeatWeeks) || 1));
        if (weeks === 1) {
          await availabilityService.createSlot({
            startAt: startObj.toISOString(),
            endAt: endObj.toISOString(),
            timezone,
            note: note.trim(),
          });
          toast.success('Tạo khung giờ rảnh thành công');
        } else {
          const batchSlots = Array.from({ length: weeks }).map((_, idx) => {
            const s = new Date(startObj);
            const en = new Date(endObj);
            s.setDate(s.getDate() + idx * 7);
            en.setDate(en.getDate() + idx * 7);
            return {
              startAt: s.toISOString(),
              endAt: en.toISOString(),
              timezone,
              note: note.trim(),
            };
          });
          await availabilityService.createSlot({ slots: batchSlots });
          toast.success(`Đã tạo ${weeks} khung giờ lặp hàng tuần thành công`);
        }
      }

      setIsModalOpen(false);
      fetchSlots();
    } catch (err) {
      toast.error(err.message || 'Không thể lưu khung giờ rảnh');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleSlotStatus = async (slot) => {
    const nextStatus =
      slot.status === AVAILABILITY_STATUS.AVAILABLE
        ? AVAILABILITY_STATUS.CLOSED
        : AVAILABILITY_STATUS.AVAILABLE;
    try {
      await availabilityService.updateSlot(slot._id, { status: nextStatus });
      toast.success(
        nextStatus === AVAILABILITY_STATUS.CLOSED ? 'Đã đóng khung giờ' : 'Đã mở lại khung giờ'
      );
      fetchSlots();
    } catch (err) {
      toast.error(err.message || 'Không thể thay đổi trạng thái slot');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await availabilityService.deleteSlot(deleteTarget._id);
      toast.success('Đã xóa khung giờ');
      setDeleteTarget(null);
      fetchSlots();
    } catch (err) {
      toast.error(err.message || 'Không thể xóa khung giờ');
    } finally {
      setIsDeleting(false);
    }
  };

  const isApproved = profile?.approvalStatus === 'approved';

  // Group slots by formatted date
  const groupedSlots = slots.reduce((acc, slot) => {
    const dateKey = formatDate(slot.startAt);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {});

  const columns = [
    {
      key: 'startAt',
      header: 'Ngày học',
      render: (val) => <span className="font-semibold text-slate-900">{formatDate(val)}</span>,
    },
    {
      key: 'time',
      header: 'Khung giờ',
      render: (_, row) => {
        const mins = Math.round(
          (new Date(row.endAt).getTime() - new Date(row.startAt).getTime()) / 60000
        );
        return (
          <div>
            <p className="font-bold text-slate-800">
              {formatTime(row.startAt)} – {formatTime(row.endAt)}
            </p>
            <p className="text-[11px] text-slate-500">
              {formatDuration(mins)} • {row.timezone || 'Asia/Ho_Chi_Minh'}
            </p>
          </div>
        );
      },
    },
    {
      key: 'note',
      header: 'Ghi chú',
      render: (val) => <span className="text-xs text-slate-600">{val || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Trạng thái Slot',
      render: (val) => <StatusBadge type="availability" status={val} />,
    },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'right',
      render: (_, row) => {
        const isBooked = row.status === AVAILABILITY_STATUS.BOOKED;
        if (isBooked) {
          return (
            <Link to="/tutor/bookings" className="text-xs font-semibold text-brand-600 hover:underline">
              Xem Booking
            </Link>
          );
        }
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openEditModal(row)}
              title="Chỉnh sửa giờ"
              className="px-2"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleToggleSlotStatus(row)}
              title={row.status === AVAILABILITY_STATUS.AVAILABLE ? 'Đóng slot' : 'Mở lại slot'}
              className="px-2"
            >
              {row.status === AVAILABILITY_STATUS.AVAILABLE ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Unlock className="w-3.5 h-3.5" />
              )}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteTarget(row)}
              title="Xóa slot"
              className="px-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Quản lý khung giờ rảnh</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Khai báo các khung giờ có thể nhận dạy (AvailabilitySlot). Slot chỉ chuyển sang "Đã đặt" khi bạn xác nhận booking.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          iconLeft={Plus}
          disabled={profile && !isApproved}
          onClick={openCreateModal}
        >
          Tạo khung giờ mới
        </Button>
      </div>

      {profile && !isApproved && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Hồ sơ gia sư chưa được phê duyệt</p>
            <p className="mt-0.5">
              Theo quy tắc hệ thống, bạn cần hoàn thành hồ sơ và được Admin duyệt (<code>approved</code>) trước khi tạo và mở lịch dạy công khai.
            </p>
          </div>
          <Link to="/tutor/profile">
            <Button variant="secondary" size="sm">
              Kiểm tra hồ sơ
            </Button>
          </Link>
        </div>
      )}

      {/* Filter bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <Select
            label="Trạng thái"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            placeholder=""
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: AVAILABILITY_STATUS.AVAILABLE, label: 'Còn trống (Available)' },
              { value: AVAILABILITY_STATUS.BOOKED, label: 'Đã đặt (Booked)' },
              { value: AVAILABILITY_STATUS.CLOSED, label: 'Đã đóng (Closed)' },
            ]}
          />
          <Input
            label="Từ ngày"
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
          />
          <Input
            label="Đến ngày"
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
          />
          <div className="flex items-center gap-2 lg:col-span-2 justify-end">
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
              Đặt lại
            </Button>
            <div className="inline-flex bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                className={`p-1.5 rounded-md ${
                  viewMode === 'grouped' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500'
                }`}
                title="Xem theo ngày"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md ${
                  viewMode === 'table' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500'
                }`}
                title="Xem dạng bảng"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <LoadingState message="Đang tải khung giờ rảnh..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchSlots} />
      ) : slots.length === 0 ? (
        <EmptyState
          title="Chưa có khung giờ rảnh nào"
          description="Tạo các khung giờ trống phù hợp để học viên có thể xem lịch và gửi yêu cầu đặt buổi học."
          action={
            isApproved ? (
              <Button variant="primary" size="sm" iconLeft={Plus} onClick={openCreateModal}>
                Tạo khung giờ đầu tiên
              </Button>
            ) : null
          }
        />
      ) : viewMode === 'table' ? (
        <Card bodyClassName="p-0">
          <Table
            columns={columns}
            data={slots}
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
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedSlots).map(([dateLabel, daySlots]) => (
            <Card key={dateLabel} className="p-4">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
                <Calendar className="w-4 h-4 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-900">{dateLabel}</h3>
                <span className="text-xs text-slate-400">({daySlots.length} slot)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {daySlots.map((slot) => {
                  const mins = Math.round(
                    (new Date(slot.endAt).getTime() - new Date(slot.startAt).getTime()) / 60000
                  );
                  const isBooked = slot.status === AVAILABILITY_STATUS.BOOKED;

                  return (
                    <div
                      key={slot._id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 text-sm inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-brand-600" />
                            {formatTime(slot.startAt)} – {formatTime(slot.endAt)}
                          </span>
                          <StatusBadge type="availability" status={slot.status} />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {formatDuration(mins)} • {slot.timezone || 'Asia/Ho_Chi_Minh'}
                        </p>
                        {slot.note && (
                          <p className="text-xs text-slate-600 line-clamp-2">{slot.note}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-200/60">
                        {isBooked ? (
                          <Link
                            to="/tutor/bookings"
                            className="text-xs font-semibold text-brand-600 hover:underline"
                          >
                            Xem buổi học đã đặt →
                          </Link>
                        ) : (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openEditModal(slot)}
                              className="px-2 py-1 text-xs"
                            >
                              <Edit2 className="w-3 h-3 mr-1" /> Sửa
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleToggleSlotStatus(slot)}
                              className="px-2 py-1 text-xs"
                            >
                              {slot.status === AVAILABILITY_STATUS.AVAILABLE ? 'Đóng' : 'Mở'}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setDeleteTarget(slot)}
                              className="px-2 py-1 text-xs"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingSlot ? 'Chỉnh sửa khung giờ rảnh' : 'Tạo khung giờ rảnh mới'}
        description="Hệ thống kiểm tra trùng lịch và yêu cầu thời lượng từ 15 phút đến 8 giờ."
        size="md"
      >
        <form onSubmit={handleSubmitSlot} className="space-y-4">
          <Input
            label="Ngày dạy"
            type="date"
            required
            min={getTodayDateStr()}
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Giờ bắt đầu"
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <Input
              label="Giờ kết thúc"
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Múi giờ (Timezone)"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder=""
              options={TIMEZONES}
            />

            {!editingSlot && (
              <Select
                label="Lặp lại hàng tuần"
                value={repeatWeeks}
                onChange={(e) => setRepeatWeeks(e.target.value)}
                placeholder=""
                options={[
                  { value: '1', label: 'Chỉ tạo 1 buổi' },
                  { value: '2', label: 'Lặp 2 tuần liên tiếp' },
                  { value: '4', label: 'Lặp 4 tuần liên tiếp' },
                  { value: '8', label: 'Lặp 8 tuần liên tiếp' },
                ]}
              />
            )}
          </div>

          <Textarea
            label="Ghi chú khung giờ (tùy chọn)"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: Chỉ nhận dạy Online qua Google Meet..."
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingSlot ? 'Cập nhật slot' : 'Lưu khung giờ'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Xóa khung giờ này?"
        message="Khung giờ chưa được đặt sẽ bị xóa vĩnh viễn khỏi lịch dạy của bạn."
        confirmText="Xóa slot"
      />
    </div>
  );
}

export default TutorAvailabilityPage;

