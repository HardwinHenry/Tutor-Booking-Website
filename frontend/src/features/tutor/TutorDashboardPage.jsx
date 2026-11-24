import React from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  BookOpen,
  Calendar,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuthStore } from '../../store/useAuthStore';

export function TutorDashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Tutor Profile Status Notification */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-900">Trạng thái hồ sơ:</span>
            <StatusBadge type="tutorProfile" status="pending" />
          </div>
          <p className="text-amber-800 mt-1 leading-relaxed">
            Hồ sơ gia sư của bạn đang trong trạng thái chờ Quản trị viên duyệt. Sau khi được duyệt, khung giờ rảnh của bạn sẽ được hiển thị công khai tới học viên.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Bàn làm việc Gia sư 🎓
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý năng lực giảng dạy, khung giờ rảnh và xử lý yêu cầu đặt lịch học
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/tutor/availability">
            <Button variant="primary" size="sm" iconLeft={Clock}>
              Tạo khung giờ rảnh
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Bộ câu hỏi 28 mục</p>
              <p className="text-sm font-bold text-slate-800">Chờ duyệt</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Khung giờ rảnh mở</p>
              <p className="text-sm font-bold text-slate-800">0 slot</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Yêu cầu booking mới</p>
              <p className="text-sm font-bold text-slate-800">0 yêu cầu</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Google Calendar</p>
              <StatusBadge type="calendarSync" status="skipped" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Yêu cầu đặt lịch chờ phản hồi"
            subtitle="Xác nhận hoặc từ chối booking từ học viên theo chính sách"
          >
            <div className="py-8 text-center text-slate-400 text-xs">
              Chưa có yêu cầu đặt lịch nào đang chờ xác nhận.
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Hồ sơ năng lực giảng dạy">
            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Hãy hoàn thành đầy đủ 28 câu hỏi năng lực (môn học, phương pháp, học phí và bằng cấp) để Admin xét duyệt.
              </p>
              <Link to="/tutor/questionnaire" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full" iconRight={ArrowRight}>
                  Cập nhật hồ sơ 28 câu
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TutorDashboardPage;
