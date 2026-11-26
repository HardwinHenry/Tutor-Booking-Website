import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  ClipboardList,
  Sparkles,
  Search,
  Calendar,
  Clock,
  BookOpen,
  CalendarDays,
  Star,
  Users,
  ShieldCheck,
  Tag,
  LogOut,
  X,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { ROLES } from '../../constants';
import { cn } from '../../utils/cn';
import { toast } from '../feedback/ToastProvider';

export function Sidebar({ isOpen, onClose }) {
  const { user, logout, isLearner, isTutor, isAdmin, surveyStatus } = useAuthStore();
  const navigate = useNavigate();

  const isSurveyPending = isLearner() && surveyStatus !== 'completed';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Build role-based navigation menu
  const getNavSections = () => {
    if (isAdmin()) {
      return [
        {
          title: 'Tổng quan Quản trị',
          items: [
            { to: '/admin/dashboard', label: 'Dashboard Quản trị', icon: LayoutDashboard },
          ],
        },
        {
          title: 'Kiểm duyệt & Quản lý',
          items: [
            { to: '/admin/tutor-approvals', label: 'Duyệt hồ sơ Gia sư', icon: ShieldCheck },
            { to: '/admin/users', label: 'Quản lý người dùng', icon: Users },
            { to: '/admin/taxonomies', label: 'Quản lý Taxonomy & Tag', icon: Tag },
            { to: '/admin/bookings', label: 'Tra cứu Booking', icon: CalendarDays },
            { to: '/admin/reviews', label: 'Kiểm duyệt Đánh giá', icon: Star },
            { to: '/admin/calendar-sync', label: 'Giám sát Calendar Sync', icon: Calendar },
          ],
        },
      ];
    }

    if (isTutor()) {
      return [
        {
          title: 'Khu vực Gia sư',
          items: [
            { to: '/tutor/dashboard', label: 'Bàn làm việc Gia sư', icon: LayoutDashboard },
            { to: '/tutor/profile', label: 'Hồ sơ giảng dạy', icon: ShieldCheck },
            { to: '/tutor/questionnaire', label: 'Khảo sát năng lực (28 mục)', icon: ClipboardList },
          ],
        },
        {
          title: 'Lịch & Giảng dạy',
          items: [
            { to: '/tutor/availability', label: 'Quản lý khung giờ rảnh', icon: Clock },
            { to: '/tutor/bookings', label: 'Yêu cầu đặt lịch', icon: BookOpen },
            { to: '/tutor/calendar', label: 'Lịch Google & Đồng bộ', icon: Calendar },
            { to: '/tutor/reviews', label: 'Đánh giá nhận được', icon: Star },
          ],
        },
      ];
    }

    // Default to Learner
    return [
      {
        title: 'Khu vực Học viên',
        items: [
          {
            to: '/learner/dashboard',
            label: 'Dashboard Học viên',
            icon: LayoutDashboard,
            locked: isSurveyPending,
          },
          {
            to: '/learner/questionnaire',
            label: 'Nhu cầu học tập (28 mục)',
            icon: ClipboardList,
            badge: isSurveyPending ? 'Bắt buộc' : null,
          },
          {
            to: '/learner/recommendations',
            label: 'Gia sư gợi ý phù hợp',
            icon: Sparkles,
            locked: isSurveyPending,
          },
        ],
      },
      {
        title: 'Khám phá & Đặt lịch',
        items: [
          {
            to: '/tutors',
            label: 'Tìm kiếm gia sư',
            icon: Search,
            locked: isSurveyPending,
          },
          {
            to: '/learner/bookings',
            label: 'Buổi học của tôi',
            icon: CalendarDays,
            locked: isSurveyPending,
          },
          {
            to: '/learner/calendar',
            label: 'Kết nối Google Calendar',
            icon: Calendar,
            locked: isSurveyPending,
          },
        ],
      },
    ];
  };

  const navSections = getNavSections();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
          <NavLink
            to={isSurveyPending ? '/learner/questionnaire' : '/'}
            className="flex items-center space-x-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-base text-slate-900">
              Tutor<span className="text-brand-600">Connect</span>
            </span>
          </NavLink>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card Mini */}
        <div className="p-4 mx-3 my-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Người dùng'}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              {user?.role || ROLES.LEARNER}
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-2 space-y-6 overflow-y-auto">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {section.title}
              </p>
              <div className="mt-1 space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isLocked = item.locked;

                  return (
                    <NavLink
                      key={item.to}
                      to={isLocked ? '#' : item.to}
                      onClick={(e) => {
                        if (isLocked) {
                          e.preventDefault();
                          toast.warning('Vui lòng hoàn thành 28 câu hỏi khảo sát để mở khóa chức năng này.');
                          return;
                        }
                        onClose();
                      }}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors group select-none',
                          isLocked
                            ? 'text-slate-400 hover:bg-slate-50/50 cursor-not-allowed opacity-75'
                            : isActive
                            ? 'bg-brand-50 text-brand-700'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        )
                      }
                    >
                      <div className="flex items-center min-w-0">
                        <Icon
                          className={cn(
                            'w-4 h-4 mr-2.5 shrink-0 transition-colors',
                            isLocked
                              ? 'text-slate-400'
                              : 'group-hover:text-brand-600'
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {isLocked && (
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
                      )}

                      {item.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 animate-pulse shrink-0 ml-1.5">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom signout action */}
        <div className="p-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
