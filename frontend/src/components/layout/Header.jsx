import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Search,
  BookOpen,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import Button from '../common/Button';
import Badge from '../common/Badge';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, isLearner, isTutor, isAdmin } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (isAdmin()) return '/admin/dashboard';
    if (isTutor()) return '/tutor/dashboard';
    return '/learner/dashboard';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-slate-900 leading-tight">
                Tutor<span className="text-brand-600">Connect</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Nền tảng Gia sư thông minh</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/tutors"
              className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              <span>Tìm gia sư</span>
            </Link>
            <Link
              to="/design-system"
              className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4" />
              <span>Design System</span>
            </Link>
          </nav>

          {/* Desktop Auth Controls */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link to={getDashboardLink()}>
                  <Button variant="outline" size="sm" iconLeft={LayoutDashboard}>
                    Dashboard
                  </Button>
                </Link>
                <div className="flex items-center pl-2 border-l border-slate-200 space-x-2">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-800 leading-none">
                      {user?.name || 'Người dùng'}
                    </span>
                    <span className="text-[10px] text-slate-500 capitalize">
                      {user?.role || 'Learner'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Đăng xuất"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Đăng ký ngay
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-3">
          <Link
            to="/tutors"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Tìm gia sư
          </Link>
          <Link
            to="/design-system"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Design System
          </Link>
          <div className="pt-3 border-t border-slate-100">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  to={getDashboardLink()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block"
                >
                  <Button variant="primary" size="sm" className="w-full">
                    Truy cập Dashboard
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                >
                  Đăng xuất
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Đăng ký
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
