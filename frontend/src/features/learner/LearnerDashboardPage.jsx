import React from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Sparkles,
  Calendar,
  Clock,
  ArrowRight,
  Search,
  BookOpen,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuthStore } from '../../store/useAuthStore';

export function LearnerDashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-brand-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-brand-500/15">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-brand-200 uppercase tracking-wider">
              Khu vực học tập cá nhân
            </span>
            <h1 className="text-2xl font-black mt-1">
              Xin chào, {user?.name || 'Học viên'}! 👋
            </h1>
            <p className="text-xs text-brand-100 mt-1 max-w-xl">
              Hệ thống đã sẵn sàng giúp bạn tìm kiếm gia sư phù hợp nhất dựa trên bộ khảo sát 28 câu hỏi.
            </p>
          </div>
          <Link to="/learner/questionnaire">
            <Button
              variant="secondary"
              size="sm"
              iconRight={ArrowRight}
              className="bg-white text-brand-700 border-none hover:bg-brand-50"
            >
              Làm khảo sát nhu cầu (28 mục)
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Khảo sát nhu cầu</p>
              <p className="text-sm font-bold text-slate-800">Chưa hoàn tất (0/28)</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Buổi học sắp tới</p>
              <p className="text-sm font-bold text-slate-800">0 buổi</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Yêu cầu chờ duyệt</p>
              <p className="text-sm font-bold text-slate-800">0 yêu cầu</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Gợi ý gia sư</p>
              <p className="text-sm font-bold text-slate-800">Sẵn sàng</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Onboarding Alert Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Khảo sát nhu cầu học tập 28 câu"
            subtitle="Giai đoạn 2 sẽ hỗ trợ lưu nháp và tải lại tiến độ tự động"
            action={
              <Link to="/learner/questionnaire">
                <Button variant="outline" size="sm" iconRight={ArrowRight}>
                  Tiếp tục trả lời
                </Button>
              </Link>
            }
          >
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Để thuật toán Content-based Filtering có thể tính toán MatchScore và đề xuất những gia sư tối ưu nhất, hãy hoàn thành 28 câu hỏi thuộc các nhóm: Mục tiêu học tập, Phong cách giảng dạy, Thời gian học, Học phí và Hình thức hỗ trợ.
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Tiến độ khảo sát:</span>
                <span className="text-brand-600 font-bold">0% (Đang ở bản nháp)</span>
              </div>
            </div>
          </Card>

          {/* Bookings placeholder */}
          <Card title="Buổi học gần đây" subtitle="Quản lý lịch học và trạng thái booking">
            <div className="py-8 text-center text-slate-400 text-xs">
              Chưa có lịch học nào. Sau khi hoàn thành khảo sát, bạn có thể tìm kiếm và chọn khung giờ rảnh của gia sư.
            </div>
          </Card>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          <Card title="Lối tắt nhanh">
            <div className="space-y-2">
              <Link to="/tutors" className="block">
                <Button variant="secondary" size="sm" className="w-full justify-start" iconLeft={Search}>
                  Tìm kiếm gia sư theo bộ lọc
                </Button>
              </Link>
              <Link to="/learner/recommendations" className="block">
                <Button variant="secondary" size="sm" className="w-full justify-start" iconLeft={Sparkles}>
                  Xem gợi ý phù hợp (MatchScore)
                </Button>
              </Link>
              <Link to="/learner/calendar" className="block">
                <Button variant="secondary" size="sm" className="w-full justify-start" iconLeft={Calendar}>
                  Kết nối Google Calendar
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default LearnerDashboardPage;
