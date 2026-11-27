import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  Tag,
  CalendarDays,
  Eye,
  ArrowRight,
  Star,
  Calendar,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import StatusBadge from '../../components/common/StatusBadge';
import Table from '../../components/common/Table';
import LoadingState from '../../components/feedback/LoadingState';
import ErrorState from '../../components/feedback/ErrorState';
import { adminService } from '../../services/admin.service';
import { taxonomyService } from '../../services/taxonomy.service';
import { formatDateTime } from '../../utils/formatters';

export function AdminDashboardPage() {
  const [pendingTutors, setPendingTutors] = useState([]);
  const [stats, setStats] = useState({
    pendingTutors: 0,
    totalUsers: 0,
    totalTaxonomies: 0,
    totalBookings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tutorsRes, usersRes, taxonomiesList, bookingsRes] = await Promise.all([
        adminService.getTutors({ approvalStatus: 'pending', limit: 5 }),
        adminService.getUsers({ limit: 1 }),
        taxonomyService.getTaxonomies(),
        adminService.getBookings({ limit: 1 }),
      ]);

      setPendingTutors(tutorsRes?.items || []);
      setStats({
        pendingTutors: tutorsRes?.pagination?.total || 0,
        totalUsers: usersRes?.summary?.totalUsers ?? usersRes?.pagination?.total ?? 0,
        totalTaxonomies: Array.isArray(taxonomiesList) ? taxonomiesList.length : 0,
        totalBookings: bookingsRes?.pagination?.total || 0,
      });
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu tổng quan quản trị');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const columns = [
    {
      key: 'userId',
      header: 'Gia sư',
      render: (u) => (
        <div>
          <p className="font-semibold text-slate-900">{u?.name || 'Gia sư'}</p>
          <p className="text-[11px] text-slate-500">{u?.email}</p>
        </div>
      ),
    },
    {
      key: 'expertise',
      header: 'Môn đăng ký',
      render: (exp) => {
        const subjects = exp?.subjectIds || [];
        return (
          <div className="flex flex-wrap gap-1">
            {subjects.slice(0, 3).map((s) => (
              <Badge key={s._id} color="slate" size="sm">
                {s.name}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: 'submittedAt',
      header: 'Ngày nộp',
      render: (val, row) => (
        <span className="text-xs text-slate-500">{formatDateTime(val || row.updatedAt)}</span>
      ),
    },
    {
      key: 'approvalStatus',
      header: 'Trạng thái',
      render: (val) => <StatusBadge type="tutorProfile" status={val} />,
    },
    {
      key: 'actions',
      header: 'Hành động',
      align: 'right',
      render: () => (
        <Link to="/admin/tutor-approvals">
          <Button variant="secondary" size="sm" iconLeft={Eye}>
            Xem & Duyệt
          </Button>
        </Link>
      ),
    },
  ];

  if (isLoading) return <LoadingState message="Đang tải dữ liệu quản trị..." />;
  if (error) return <ErrorState message={error} onRetry={loadDashboard} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Dashboard Quản trị Hệ thống</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Quản lý tài khoản, xét duyệt hồ sơ gia sư, cấu hình danh mục Taxonomy và giám sát vận hành
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/tutor-approvals">
          <Card className="p-4 hover:border-brand-300 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500">Hồ sơ Tutor chờ duyệt</p>
                <p className="text-lg font-bold text-slate-800">{stats.pendingTutors} hồ sơ</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/users">
          <Card className="p-4 hover:border-brand-300 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500">Tổng người dùng</p>
                <p className="text-lg font-bold text-slate-800">{stats.totalUsers}</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/taxonomies">
          <Card className="p-4 hover:border-brand-300 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500">Taxonomies & Tags</p>
                <p className="text-lg font-bold text-slate-800">{stats.totalTaxonomies} mục</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/bookings">
          <Card className="p-4 hover:border-brand-300 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500">Tổng lượt Booking</p>
                <p className="text-lg font-bold text-slate-800">{stats.totalBookings}</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Pending Tutors Table */}
      <Card
        title="Hồ sơ Gia sư chờ xét duyệt"
        subtitle="Danh sách hồ sơ mới nộp gần nhất đang chờ phê duyệt"
        action={
          <Link to="/admin/tutor-approvals">
            <Button variant="outline" size="sm" iconRight={ArrowRight}>
              Quản lý tất cả
            </Button>
          </Link>
        }
        bodyClassName="p-0"
      >
        <Table
          columns={columns}
          data={pendingTutors}
          emptyMessage="Hiện không có hồ sơ gia sư nào đang chờ duyệt."
          className="border-none rounded-none"
        />
      </Card>

      {/* Quick Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Kiểm duyệt Đánh giá</p>
              <p className="text-xs text-slate-500">Ẩn/hiện đánh giá vi phạm quy chuẩn</p>
            </div>
          </div>
          <Link to="/admin/reviews">
            <Button variant="secondary" size="sm" iconRight={ArrowRight}>
              Mở
            </Button>
          </Link>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Giám sát Google Calendar Sync</p>
              <p className="text-xs text-slate-500">Theo dõi nhật ký đồng bộ lịch hệ thống</p>
            </div>
          </div>
          <Link to="/admin/calendar-sync">
            <Button variant="secondary" size="sm" iconRight={ArrowRight}>
              Mở
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
