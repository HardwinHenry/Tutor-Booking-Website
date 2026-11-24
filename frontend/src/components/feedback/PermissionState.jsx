import React from 'react';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import { cn } from '../../utils/cn';

export function PermissionState({
  title = 'Không có quyền truy cập',
  message = 'Tài khoản của bạn không có thẩm quyền truy cập vào chức năng hoặc khu vực này.',
  className,
}) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center min-h-[60vh] max-w-md mx-auto',
        className
      )}
    >
      <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5 ring-8 ring-amber-50/60">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
        Mã lỗi: 403 Forbidden
      </span>
      <h2 className="text-2xl font-extrabold text-slate-900 mb-2">{title}</h2>
      <p className="text-sm text-slate-600 mb-8">{message}</p>

      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="md"
          iconLeft={ArrowLeft}
          onClick={() => navigate(-1)}
        >
          Quay lại
        </Button>
        <Link to="/">
          <Button variant="primary" size="md" iconLeft={Home}>
            Trang chủ
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default PermissionState;
