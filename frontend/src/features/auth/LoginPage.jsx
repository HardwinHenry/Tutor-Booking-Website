import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
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

  const { login, checkSurveyStatus } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  const getRedirectPath = (role, currentSurveyStatus) => {
    if (role === ROLES.ADMIN) return '/admin/dashboard';
    if (role === ROLES.TUTOR) return '/tutor/dashboard';

    // Learner: Check survey status
    if (currentSurveyStatus === 'completed') {
      if (from && from !== '/login' && from !== '/learner/questionnaire') return from;
      return '/learner/dashboard';
    }

    return '/learner/questionnaire';
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

      const role = data.user?.role;
      let status = 'completed';

      if (role === ROLES.LEARNER) {
        status = await checkSurveyStatus();
        if (status !== 'completed') {
          toast.info('Vui lòng hoàn thành bộ khảo sát 28 câu hỏi để sử dụng hệ thống.');
        }
      }

      navigate(getRedirectPath(role, status), { replace: true });
    } catch (err) {
      setError(err.message || 'Email hoặc mật khẩu không chính xác');
    } finally {
      setIsLoading(false);
    }
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
