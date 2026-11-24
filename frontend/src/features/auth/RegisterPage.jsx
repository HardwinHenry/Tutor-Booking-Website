import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import RadioGroup from '../../components/common/RadioGroup';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from '../../components/feedback/ToastProvider';
import { ROLES } from '../../constants';

export function RegisterPage() {
  const [role, setRole] = useState(ROLES.LEARNER);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải chứa ít nhất 6 ký tự');
      return;
    }

    setIsLoading(true);
    try {
      const data = await register({ name, email, phone, password, role });
      if (role === ROLES.TUTOR) {
        toast.success('Đăng ký tài khoản Gia sư thành công!');
        navigate('/tutor/dashboard', { replace: true });
      } else {
        toast.success(
          'Đăng ký tài khoản thành công! Vui lòng hoàn thành bộ khảo sát 28 câu hỏi để kích hoạt tài khoản.'
        );
        navigate('/learner/questionnaire', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Đăng ký tài khoản thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tạo tài khoản mới</h2>
        <p className="text-xs text-slate-500 mt-1">
          Chọn vai trò và điền thông tin để bắt đầu trải nghiệm
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role selection */}
        <RadioGroup
          label="Bạn tham gia với tư cách"
          name="role"
          orientation="horizontal"
          value={role}
          onChange={setRole}
          options={[
            { value: ROLES.LEARNER, label: 'Học viên (Learner)' },
            { value: ROLES.TUTOR, label: 'Gia sư (Tutor)' },
          ]}
        />

        <Input
          label="Họ và tên"
          type="text"
          placeholder="Nguyễn Văn A"
          prefixIcon={User}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Địa chỉ Email"
          type="email"
          placeholder="example@tutorconnect.vn"
          prefixIcon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Số điện thoại"
          type="tel"
          placeholder="0912 345 678"
          prefixIcon={Phone}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />

        <Input
          label="Mật khẩu"
          type="password"
          placeholder="Tối thiểu 6 ký tự"
          prefixIcon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Input
          label="Xác nhận mật khẩu"
          type="password"
          placeholder="Nhập lại mật khẩu"
          prefixIcon={Lock}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          size="md"
          isLoading={isLoading}
          iconRight={ArrowRight}
        >
          Hoàn tất đăng ký
        </Button>
      </form>

      <p className="text-center text-xs text-slate-500">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700">
          Đăng nhập ngay
        </Link>
      </p>
    </div>
  );
}

export default RegisterPage;
