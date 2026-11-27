import React, { useState, useEffect, useCallback } from 'react';
import { Eye, UserCog } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import StatusBadge from '../../components/common/StatusBadge';
import Table from '../../components/common/Table';
import SearchBar from '../../components/common/SearchBar';
import Select from '../../components/common/Select';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Textarea from '../../components/common/Textarea';
import LoadingState from '../../components/feedback/LoadingState';
import ErrorState from '../../components/feedback/ErrorState';
import { toast } from '../../components/feedback/ToastProvider';
import { adminService } from '../../services/admin.service';
import { useAuthStore } from '../../store/useAuthStore';
import { ROLES, USER_STATUS } from '../../constants';
import { formatDateTime } from '../../utils/formatters';

export function AdminUsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Detail modal
  const [userDetail, setUserDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Status update modal
  const [statusTarget, setStatusTarget] = useState(null);
  const [nextStatus, setNextStatus] = useState(USER_STATUS.ACTIVE);
  const [statusReason, setStatusReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.getUsers({
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: 10,
      });
      setUsers(data?.users || []);
      setSummary(data?.summary || null);
      setPagination(data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleOpenDetail = async (row) => {
    setUserDetail({ user: row });
    setIsDetailLoading(true);
    try {
      const detail = await adminService.getUserDetail(row._id);
      setUserDetail(detail);
    } catch (err) {
      toast.error(err.message || 'Không thể tải chi tiết người dùng');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleOpenStatusModal = (row) => {
    setStatusTarget(row);
    setNextStatus(row.status || USER_STATUS.ACTIVE);
    setStatusReason('');
  };

  const handleConfirmStatusUpdate = async (e) => {
    e.preventDefault();
    if (!statusTarget) return;
    setIsUpdatingStatus(true);
    try {
      await adminService.updateUserStatus(statusTarget._id, {
        status: nextStatus,
        reason: statusReason.trim() || undefined,
      });
      toast.success('Đã cập nhật trạng thái tài khoản');
      setStatusTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật trạng thái tài khoản');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const currentUserId = currentUser?._id || currentUser?.id;

  const columns = [
    {
      key: 'name',
      header: 'Người dùng',
      render: (name, row) => (
        <div>
          <p className="font-bold text-slate-900">{name}</p>
          <p className="text-[11px] text-slate-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Vai trò',
      render: (role) => (
        <Badge
          color={role === ROLES.ADMIN ? 'purple' : role === ROLES.TUTOR ? 'brand' : 'sky'}
          size="sm"
          className="capitalize"
        >
          {role}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Ngày tham gia',
      render: (val) => <span className="text-xs text-slate-500">{formatDateTime(val)}</span>,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (val) => <StatusBadge type="user" status={val} />,
    },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'right',
      render: (_, row) => {
        const isSelf = row._id === currentUserId;
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
            <Button
              variant="secondary"
              size="sm"
              disabled={isSelf}
              onClick={() => handleOpenStatusModal(row)}
              title={isSelf ? 'Không thể tự đổi trạng thái tài khoản của mình' : 'Đổi trạng thái'}
              className="px-2.5"
            >
              <UserCog className="w-3.5 h-3.5 mr-1" /> Trạng thái
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Quản lý tài khoản người dùng</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tra cứu tài khoản Học viên, Gia sư, Quản trị viên và kiểm soát trạng thái hoạt động
        </p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-[11px] text-slate-500">Tổng tài khoản</p>
            <p className="text-xl font-black text-slate-900 mt-1">{summary.totalUsers}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] text-emerald-600">Đang hoạt động</p>
            <p className="text-xl font-black text-emerald-700 mt-1">{summary.totalActive}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] text-amber-600">Đang tạm khóa</p>
            <p className="text-xl font-black text-amber-700 mt-1">{summary.totalLocked}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] text-rose-600">Vô hiệu hóa</p>
            <p className="text-xl font-black text-rose-700 mt-1">{summary.totalDisabled}</p>
          </Card>
        </div>
      )}

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-6">
            <SearchBar
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              onClear={() => setSearch('')}
              placeholder="Tìm theo tên, email hoặc số điện thoại..."
            />
          </div>
          <div className="md:col-span-3">
            <Select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Tất cả vai trò"
              options={[
                { value: ROLES.LEARNER, label: 'Learner (Học viên)' },
                { value: ROLES.TUTOR, label: 'Tutor (Gia sư)' },
                { value: ROLES.ADMIN, label: 'Admin (Quản trị)' },
              ]}
            />
          </div>
          <div className="md:col-span-3">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Tất cả trạng thái"
              options={[
                { value: USER_STATUS.ACTIVE, label: 'Hoạt động (Active)' },
                { value: USER_STATUS.LOCKED, label: 'Tạm khóa (Locked)' },
                { value: USER_STATUS.DISABLED, label: 'Vô hiệu hóa (Disabled)' },
              ]}
            />
          </div>
        </div>
      </Card>

      {error ? (
        <ErrorState message={error} onRetry={fetchUsers} />
      ) : (
        <Card bodyClassName="p-0">
          <Table
            columns={columns}
            data={users}
            isLoading={isLoading}
            emptyMessage="Không tìm thấy người dùng nào."
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

      {/* Detail Modal */}
      <Modal
        isOpen={Boolean(userDetail)}
        onClose={() => setUserDetail(null)}
        title={`Thông tin tài khoản: ${userDetail?.user?.name || ''}`}
        size="md"
      >
        {isDetailLoading ? (
          <LoadingState message="Đang tải thông tin chi tiết..." />
        ) : (
          userDetail?.user && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <strong className="text-slate-900">{userDetail.user.email}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vai trò:</span>
                  <strong className="capitalize">{userDetail.user.role}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Trạng thái:</span>
                  <StatusBadge type="user" status={userDetail.user.status} />
                </div>
                {userDetail.user.phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số điện thoại:</span>
                    <strong>{userDetail.user.phone}</strong>
                  </div>
                )}
              </div>

              {userDetail.bookingStats && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-xl border border-slate-200">
                    <p className="text-slate-400">Tổng booking</p>
                    <p className="text-base font-black text-slate-900">
                      {userDetail.bookingStats.total}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200">
                    <p className="text-slate-400">Hoàn thành</p>
                    <p className="text-base font-black text-emerald-600">
                      {userDetail.bookingStats.completed}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200">
                    <p className="text-slate-400">Đã hủy</p>
                    <p className="text-base font-black text-rose-600">
                      {userDetail.bookingStats.cancelled}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </Modal>

      {/* Status Update Modal */}
      <Modal
        isOpen={Boolean(statusTarget)}
        onClose={() => !isUpdatingStatus && setStatusTarget(null)}
        title="Cập nhật trạng thái tài khoản"
        description={`Tài khoản: ${statusTarget?.name} (${statusTarget?.email})`}
        size="sm"
      >
        <form onSubmit={handleConfirmStatusUpdate} className="space-y-4">
          <Select
            label="Trạng thái mới"
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value)}
            placeholder=""
            options={[
              { value: USER_STATUS.ACTIVE, label: 'Hoạt động (Active)' },
              { value: USER_STATUS.LOCKED, label: 'Tạm khóa (Locked)' },
              { value: USER_STATUS.DISABLED, label: 'Vô hiệu hóa (Disabled)' },
            ]}
          />

          <Textarea
            label="Lý do thay đổi (tùy chọn)"
            rows={3}
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
            placeholder="Ghi chú lý do khóa/mở khóa tài khoản..."
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStatusTarget(null)}
              disabled={isUpdatingStatus}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant={nextStatus === USER_STATUS.ACTIVE ? 'primary' : 'danger'}
              isLoading={isUpdatingStatus}
            >
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminUsersPage;

