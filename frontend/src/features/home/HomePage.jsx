import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Star,
  Users,
  Search,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

export function HomePage() {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 text-center lg:text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>Khảo sát nhu cầu thông minh 28 tiêu chí</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Kết nối <span className="text-brand-600">Gia sư chất lượng</span>, học tập chuẩn mục tiêu
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              Nền tảng kết nối thông minh kết hợp hệ thống đánh giá 28 tiêu chí năng lực, quản lý lịch rảnh tự động và đồng bộ trực tiếp với Google Calendar.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Link to="/register" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" iconRight={ArrowRight} className="w-full">
                  Bắt đầu ngay hôm nay
                </Button>
              </Link>
              <Link to="/tutors" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" iconLeft={Search} className="w-full">
                  Khám phá gia sư
                </Button>
              </Link>
            </div>

            {/* Quick trust metrics */}
            <div className="pt-6 border-t border-slate-200/80 flex items-center justify-center lg:justify-start gap-8 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Gia sư xác thực hồ sơ</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-600" />
                <span>Đặt lịch slot tức thì</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                <span>Đánh giá minh bạch</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md bg-white rounded-3xl p-6 shadow-2xl shadow-brand-500/10 border border-slate-100">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-lg">
                    GS
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">ThS. Nguyễn Văn A</h3>
                    <p className="text-xs text-slate-500">Toán cao cấp & Ôn thi Đại học</p>
                  </div>
                </div>
                <Badge color="emerald" dot>
                  Đã duyệt
                </Badge>
              </div>

              <div className="py-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Mức độ phù hợp khảo sát:</span>
                  <span className="font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
                    96% Match
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-brand-600 h-2 rounded-full w-[96%]" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-slate-400 text-[10px]">Học phí/buổi</p>
                    <p className="font-bold text-slate-800">250.000 ₫</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-slate-400 text-[10px]">Đánh giá</p>
                    <p className="font-bold text-slate-800">⭐ 4.9 (48 đánh giá)</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <Link to="/tutors">
                  <Button variant="primary" size="sm" className="w-full">
                    Xem lịch trống & Đặt buổi học
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Steps Process */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge color="brand" className="mb-2">
            Quy trình chuẩn hóa
          </Badge>
          <h2 className="text-3xl font-extrabold text-slate-900">
            Học tập hiệu quả chỉ với 3 bước
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Quy trình được đồng bộ chặt chẽ từ khảo sát, tìm kiếm, đặt lịch cho đến phản hồi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 font-bold flex items-center justify-center mb-4">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">
              Bộ câu hỏi nhu cầu 28 mục
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Xác định mục tiêu, trình độ, phương pháp, phong cách và khung giờ rảnh để nhận đề xuất chuẩn xác nhất.
            </p>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center mb-4">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">
              Khung giờ rảnh theo thời gian thực
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Xem trực tiếp AvailabilitySlot của gia sư, lựa chọn slot phù hợp và gửi yêu cầu booking chỉ trong vài thao tác.
            </p>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center mb-4">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">
              Đồng bộ Google Calendar & Đánh giá
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tự động thêm buổi học vào lịch cá nhân, nhận thông báo kịp thời và đánh giá chất lượng sau khi hoàn thành.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
