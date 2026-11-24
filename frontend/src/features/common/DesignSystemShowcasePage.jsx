import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  CheckCircle,
  AlertTriangle,
  Mail,
  Lock,
  Plus,
  Trash2,
  Calendar,
  Send,
  Eye,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Checkbox from '../../components/common/Checkbox';
import RadioGroup from '../../components/common/RadioGroup';
import Badge from '../../components/common/Badge';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import LoadingState, { LoadingSpinner, Skeleton } from '../../components/feedback/LoadingState';
import ErrorState from '../../components/feedback/ErrorState';
import EmptyState from '../../components/feedback/EmptyState';
import { toast } from '../../components/feedback/ToastProvider';
import {
  AVAILABILITY_STATUS,
  BOOKING_STATUS,
  TUTOR_PROFILE_STATUS,
  CALENDAR_SYNC_STATUS,
} from '../../constants';

export function DesignSystemShowcasePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [checkboxVal, setCheckboxVal] = useState(true);
  const [radioVal, setRadioVal] = useState('online');
  const [currentPage, setCurrentPage] = useState(1);

  const sampleTableData = [
    { id: '1', name: 'Nguyễn Văn A', subject: 'Toán Cao Cấp', price: '250.000 ₫', status: 'approved' },
    { id: '2', name: 'Trần Thị B', subject: 'Tiếng Anh IELTS', price: '350.000 ₫', status: 'pending' },
    { id: '3', name: 'Lê Hoàng C', subject: 'Vật Lý 12', price: '200.000 ₫', status: 'draft' },
  ];

  const tableColumns = [
    { key: 'name', header: 'Gia sư' },
    { key: 'subject', header: 'Môn học' },
    { key: 'price', header: 'Học phí' },
    {
      key: 'status',
      header: 'Trạng thái Profile',
      render: (val) => <StatusBadge type="tutorProfile" status={val} />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Title */}
      <div className="border-b border-slate-200 pb-5">
        <Badge color="brand" className="mb-2">
          Giai đoạn 1 – Design System
        </Badge>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Design System & UI Components Showcase
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Tập hợp đầy đủ các thành phần giao diện nền tảng, trạng thái, modal, bảng dữ liệu và quy ước styling.
        </p>
      </div>

      {/* 1. Buttons */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">1. Button Components</h2>
        <Card>
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Variants</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="danger">Danger Button</Button>
                <Button variant="success">Success Button</Button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Sizes & Icons</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" iconLeft={Plus}>Size SM</Button>
                <Button size="md" iconRight={Send}>Size MD</Button>
                <Button size="lg" iconLeft={Sparkles}>Size LG</Button>
                <Button isLoading>Đang lưu...</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 2. Form Inputs */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">2. Form Fields</h2>
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Input
              label="Họ và tên"
              placeholder="Nhập họ và tên..."
              prefixIcon={Mail}
              helperText="Tên thật hiển thị trên hồ sơ học tập"
            />
            <Input
              label="Mật khẩu"
              type="password"
              placeholder="Nhập ít nhất 6 ký tự..."
              prefixIcon={Lock}
            />
            <Input
              label="Trường hợp có lỗi"
              defaultValue="invalid-email@"
              error="Định dạng email không hợp lệ"
            />
            <Select
              label="Lĩnh vực học tập"
              options={[
                { value: 'academic', label: 'Học thuật phổ thông' },
                { value: 'language', label: 'Ngoại ngữ' },
                { value: 'tech', label: 'Công nghệ thông tin' },
              ]}
              placeholder="Chọn lĩnh vực..."
            />
            <div className="md:col-span-2">
              <Textarea
                label="Mục tiêu học tập"
                placeholder="Mô tả chi tiết mục tiêu bạn muốn đạt được cùng gia sư..."
                rows={3}
              />
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Checkbox
                label="Đồng ý với điều khoản sử dụng"
                description="Tôi cam kết tuân thủ chính sách hủy buổi học và thanh toán của nền tảng."
                checked={checkboxVal}
                onChange={(e) => setCheckboxVal(e.target.checked)}
              />
            </div>
            <div>
              <RadioGroup
                label="Hình thức học ưa thích"
                name="studyMode"
                orientation="horizontal"
                value={radioVal}
                onChange={setRadioVal}
                options={[
                  { value: 'online', label: 'Online 1-1' },
                  { value: 'offline', label: 'Tại nhà (Offline)' },
                  { value: 'hybrid', label: 'Linh hoạt cả hai' },
                ]}
              />
            </div>
          </div>
        </Card>
      </section>

      {/* 3. Badges & Entity Statuses */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">3. Badges & Status Mappings</h2>
        <Card>
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                AvailabilitySlot Status
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.values(AVAILABILITY_STATUS).map((st) => (
                  <StatusBadge key={st} type="availability" status={st} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Booking State Machine
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.values(BOOKING_STATUS).map((st) => (
                  <StatusBadge key={st} type="booking" status={st} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                TutorProfile Approval Status
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.values(TUTOR_PROFILE_STATUS).map((st) => (
                  <StatusBadge key={st} type="tutorProfile" status={st} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Google Calendar Sync Status
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.values(CALENDAR_SYNC_STATUS).map((st) => (
                  <StatusBadge key={st} type="calendarSync" status={st} />
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 4. Table & Pagination */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">4. Table & Pagination</h2>
        <Card>
          <div className="mb-4 max-w-sm">
            <SearchBar
              value={searchValue}
              onChange={setSearchValue}
              placeholder="Lọc gia sư theo tên hoặc môn..."
            />
          </div>
          <Table columns={tableColumns} data={sampleTableData} />
          <Pagination
            currentPage={currentPage}
            totalPages={5}
            totalItems={15}
            onPageChange={setCurrentPage}
          />
        </Card>
      </section>

      {/* 5. Modals, Confirm Dialogs & Toasts */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">5. Feedback, Modals & Toast Alerts</h2>
        <Card>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(true)}>
              Mở Modal mẫu
            </Button>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              Mở Dialog xác nhận hủy
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.success('Thao tác thành công trên nền tảng!')}
            >
              Hiển thị Toast Thành công
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.error('Đã xảy ra lỗi khi kết nối tới máy chủ!')}
            >
              Hiển thị Toast Báo lỗi
            </Button>
          </div>
        </Card>
      </section>

      {/* 6. Feedback States */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">6. States (Loading / Error / Empty)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="Loading State">
            <LoadingState message="Đang tìm kiếm gia sư..." />
          </Card>
          <Card title="Error State">
            <ErrorState
              title="Mất kết nối mạng"
              message="Không thể kết nối tới Backend API. Vui lòng kiểm tra lại đường truyền."
              onRetry={() => toast('Đang kết nối lại...')}
            />
          </Card>
          <Card title="Empty State">
            <EmptyState
              title="Chưa có buổi học nào"
              description="Hãy bắt đầu bằng việc tìm kiếm gia sư phù hợp với nhu cầu của bạn."
              actionText="Tìm gia sư ngay"
              onAction={() => toast('Chuyển tới trang tìm kiếm')}
            />
          </Card>
        </div>
      </section>

      {/* Sample Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Thông tin chi tiết khung giờ rảnh"
        description="Chi tiết AvailabilitySlot được cung cấp bởi gia sư"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Đóng
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setModalOpen(false);
                toast.success('Đã gửi yêu cầu đặt lịch!');
              }}
            >
              Gửi yêu cầu Booking
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 leading-relaxed">
          Slot thời gian: <span className="font-semibold text-slate-800">Thứ Bảy, 14:00 - 15:30</span>. Gia sư sẽ xác nhận trong vòng 12 tiếng sau khi nhận yêu cầu.
        </p>
      </Modal>

      {/* Sample ConfirmDialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          toast.success('Đã hủy booking thành công.');
        }}
        title="Xác nhận hủy buổi học"
        message="Bạn có chắc chắn muốn hủy yêu cầu đặt lịch này? Hành động này sẽ hoàn trả slot về trạng thái available."
        confirmText="Hủy buổi học"
      />
    </div>
  );
}

export default DesignSystemShowcasePage;
