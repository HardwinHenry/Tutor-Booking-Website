import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-3">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-base text-slate-900">
                Tutor<span className="text-brand-600">Connect</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed">
              Hệ thống kết nối Gia sư và Học viên cá nhân hóa dựa trên 28 tiêu chí học tập, lịch trống thông minh và tích hợp Google Calendar.
            </p>
          </div>

          {/* For Learners */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Dành cho Học viên
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link to="/tutors" className="hover:text-brand-600 transition-colors">
                  Tìm kiếm gia sư
                </Link>
              </li>
              <li>
                <Link to="/learner/questionnaire" className="hover:text-brand-600 transition-colors">
                  Bộ câu hỏi nhu cầu 28 câu
                </Link>
              </li>
              <li>
                <Link to="/learner/recommendations" className="hover:text-brand-600 transition-colors">
                  Gia sư phù hợp nhất
                </Link>
              </li>
              <li>
                <Link to="/learner/bookings" className="hover:text-brand-600 transition-colors">
                  Lịch học đã đặt
                </Link>
              </li>
            </ul>
          </div>

          {/* For Tutors */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Dành cho Gia sư
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link to="/register" className="hover:text-brand-600 transition-colors">
                  Đăng ký trở thành gia sư
                </Link>
              </li>
              <li>
                <Link to="/tutor/questionnaire" className="hover:text-brand-600 transition-colors">
                  Khai báo hồ sơ năng lực 28 câu
                </Link>
              </li>
              <li>
                <Link to="/tutor/availability" className="hover:text-brand-600 transition-colors">
                  Quản lý lịch rảnh
                </Link>
              </li>
              <li>
                <Link to="/tutor/bookings" className="hover:text-brand-600 transition-colors">
                  Quản lý yêu cầu học
                </Link>
              </li>
            </ul>
          </div>

          {/* Admin & Platform */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Hệ thống & Tài nguyên
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link to="/admin/dashboard" className="hover:text-brand-600 transition-colors">
                  Khu vực Quản trị (Admin)
                </Link>
              </li>
              <li>
                <span className="text-slate-400">Phiên bản: 2.0 (Backend & Frontend Sync)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} TutorConnect Platform. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Xây dựng với <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> và React + Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
