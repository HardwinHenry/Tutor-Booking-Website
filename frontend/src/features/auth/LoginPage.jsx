import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, UserCheck } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from '../../components/feedback/ToastProvider';
import { ROLES } from '../../constants';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, setSession } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  const getRedirectPath = (role) => {
    if (from && from !== '/login') return from;
    if (role === ROLES.ADMIN) return '/admin/dashboard';
    if (role === ROLES.TUTOR) return '/tutor/dashboard';
    return '/learner/dashboard';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setIsLoading(true);
    try {
      const data = await login({ email, password });
      toast.success('Đăng nhập thành công!');
      navigate(getRedirectPath(data.user?.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Email hoặc mật khẩu không chính xác');
    } finally {
      setIsLoading(false);
    }
  };

  // Mock switch for development and local testing
  const handleQuickLogin = (role) => {
    const mockUser = {
      _id: 'mock-user-id-' + role,
      name:
        role === ROLES.ADMIN
          ? 'Quản trị viên Demo'
          : role === ROLES.TUTOR
          ? 'Gia sư Trần Nam'
          : 'Học viên Mai Anh',
      email: `${role}@tutorconnect.vn`,
      role,
      phone: '0901234567',
    };

    setSession({
      user: mockUser,
      accessToken: 'mock-access-token-' + role,
      refreshToken: 'mock-refresh-token-' + role,
    });

    toast.success(`Đã đăng nhập dưới vai trò ${role.toUpperCase()}`);
    navigate(getRedirectPath(role), { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Đăng nhập tài khoản</h2>
        <p className="text-xs text-slate-500 mt-1">
          Truy cập hệ thống kết nối gia sư và quản lý lịch học
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Địa chỉ Email"
          type="email"
          placeholder="learner@example.com"
          prefixIcon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Mật khẩu"
          type="password"
          placeholder="••••••••"
          prefixIcon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center space-x-2 cursor-pointer text-slate-600">
            <input type="checkbox" className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            <span>Ghi nhớ phiên</span>
          </label>
          <a href="#forgot" className="font-semibold text-brand-600 hover:text-brand-700">
            Quên mật khẩu?
          </a>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          size="md"
          isLoading={isLoading}
          iconRight={ArrowRight}
        >
          Đăng nhập
        </Button>
      </form>

      {/* Development Quick Role Switcher */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1.5 justify-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          <UserCheck className="w-3.5 h-3.5" />
          <span>Chế độ kiểm thử nhanh vai trò</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickLogin(ROLES.LEARNER)}
            className="text-[11px] py-1"
          >
            Learner
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickLogin(ROLES.TUTOR)}
            className="text-[11px] py-1"
          >
            Tutor
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickLogin(ROLES.ADMIN)}
            className="text-[11px] py-1"
          >
            Admin
          </Button>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}

export default LoginPage;
