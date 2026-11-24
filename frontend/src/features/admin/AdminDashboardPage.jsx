import React from 'react';
import {
  Users,
  ShieldCheck,
  Tag,
  CalendarDays,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import StatusBadge from '../../components/common/StatusBadge';
import Table from '../../components/common/Table';

export function AdminDashboardPage() {
  const pendingTutors = [
    {
      id: 'tutor-1',
      name: 'ThS. Lê Hoàng Long',
      email: 'long.le@example.com',
      subjects: ['Toán 12', 'Luyện thi Đại học'],
      appliedAt: '24/11/2026',
      status: 'pending',
    },
    {
      id: 'tutor-2',
      name: 'Nguyễn Thu Trang',
      email: 'trang.nguyen@example.com',
      subjects: ['IELTS 7.5+', 'Tiếng Anh Giao tiếp'],
      appliedAt: '23/11/2026',
      status: 'pending',
    },
  ];

  const columns = [
    { key: 'name', header: 'Gia sư' },
    { key: 'email', header: 'Email' },
    {
      key: 'subjects',
      header: 'Môn đăng ký',
      render: (val) => (
        <div className="flex flex-wrap gap-1">
          {val.map((s, idx) => (
            <Badge key={idx} color="slate" size="sm">
              {s}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (val) => <StatusBadge type="tutorProfile" status={val} />,
    },
    {
      key: 'actions',
      header: 'Hành động',
      align: 'right',
      render: () => (
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="secondary" size="sm" className="p-1.5" title="Xem hồ sơ">
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button variant="success" size="sm" className="p-1.5" title="Duyệt hồ sơ">
            <CheckCircle className="w-3.5 h-3.5" />
          </Button>
          <Button variant="danger" size="sm" className="p-1.5" title="Từ chối">
            <XCircle className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Dashboard Quản trị Hệ thống</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Quản lý tài khoản, xét duyệt hồ sơ gia sư và cấu hình danh mục Taxonomy
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Hồ sơ Tutor chờ duyệt</p>
              <p className="text-lg font-bold text-slate-800">2 hồ sơ</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Tổng người dùng</p>
              <p className="text-lg font-bold text-slate-800">128</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Taxonomies & Tags</p>
              <p className="text-lg font-bold text-slate-800">45 mục</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Lượt đặt lịch</p>
              <p className="text-lg font-bold text-slate-800">34</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Tutors Table */}
      <Card
        title="Danh sách Gia sư chờ xét duyệt (Admin Approval)"
        subtitle="Đối chiếu bằng cấp, năng lực và quyết định phê duyệt hoặc từ chối kèm lý do"
      >
        <Table columns={columns} data={pendingTutors} />
      </Card>
    </div>
  );
}

export default AdminDashboardPage;
