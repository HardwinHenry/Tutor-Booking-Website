import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import StatusBadge from '../../components/common/StatusBadge';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import ErrorState from '../../components/feedback/ErrorState';
import { adminService } from '../../services/admin.service';
import { CALENDAR_SYNC_STATUS } from '../../constants';
import { formatDateTime } from '../../utils/formatters';

export function AdminCalendarSyncPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [syncStatusFilter, setSyncStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.getCalendarSync({
        syncStatus: syncStatusFilter || undefined,
        page,
        limit: 15,
      });
      setLogs(data?.items || []);
      setPagination(data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message || 'Không thể tải nhật ký đồng bộ Calendar');
    } finally {
      setIsLoading(false);
    }
  }, [syncStatusFilter, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const columns = [
    {
      key: 'userId',
      header: 'Người dùng',
      render: (u, row) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-900">{u?.fullName || u?.name || u?.email || '—'}</p>
          <p className="text-slate-500 capitalize">Vai trò: {row.userRole || u?.role || '—'}</p>
        </div>
      ),
    },
    {
      key: 'bookingId',
      header: 'Booking liên quan',
      render: (b) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-800">{b?.subjectName || 'Buổi học'}</p>
          <p className="text-slate-500">{b?.startAt ? formatDateTime(b.startAt) : '—'}</p>
        </div>
      ),
    },
    {
      key: 'syncStatus',
      header: 'Trạng thái đồng bộ',
      render: (val) => <StatusBadge type="calendarSync" status={val} />,
    },
    {
      key: 'retryCount',
      header: 'Số lần thử',
      align: 'center',
      render: (val) => <span className="text-xs font-medium text-slate-600">{val ?? 0}</span>,
    },
    {
      key: 'lastError',
      header: 'Ghi chú / Lỗi',
      render: (val) => (
        <span className="text-xs text-rose-600 max-w-xs block truncate">
          {val || <span className="text-slate-400">—</span>}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Cập nhật lúc',
      render: (val) => <span className="text-xs text-slate-500">{formatDateTime(val)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Giám sát Google Calendar Sync</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi nhật ký đồng bộ sự kiện giữa Booking và Google Calendar của học viên & gia sư
          </p>
        </div>
        <Button variant="secondary" size="sm" iconLeft={RefreshCw} onClick={fetchLogs}>
          Làm mới
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <Select
            label="Lọc theo trạng thái đồng bộ"
            value={syncStatusFilter}
            onChange={(e) => {
              setSyncStatusFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Tất cả trạng thái"
            options={[
              { value: CALENDAR_SYNC_STATUS.SYNCED, label: 'Đã đồng bộ (synced)' },
              { value: CALENDAR_SYNC_STATUS.FAILED, label: 'Đồng bộ thất bại (failed)' },
              { value: CALENDAR_SYNC_STATUS.PENDING, label: 'Đang chờ (pending)' },
              { value: CALENDAR_SYNC_STATUS.CANCELLED, label: 'Đã hủy (cancelled)' },
              { value: CALENDAR_SYNC_STATUS.NOT_CONNECTED, label: 'Chưa kết nối (not_connected)' },
            ]}
          />
        </div>
      </Card>

      {error ? (
        <ErrorState message={error} onRetry={fetchLogs} />
      ) : (
        <Card bodyClassName="p-0">
          <Table
            columns={columns}
            data={logs}
            isLoading={isLoading}
            emptyMessage="Chưa có log đồng bộ Google Calendar nào."
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
    </div>
  );
}

export default AdminCalendarSyncPage;

