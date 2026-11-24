import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mb-6">
        <FileQuestion className="w-10 h-10" />
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-2">
        Mã lỗi 404
      </span>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
        Trang không tìm thấy
      </h1>
      <p className="text-sm text-slate-600 max-w-md mb-8">
        Địa chỉ trang web bạn yêu cầu không tồn tại, đã được thay đổi đường dẫn hoặc đang trong quá trình bảo trì.
      </p>

      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="md"
          iconLeft={ArrowLeft}
          onClick={() => window.history.back()}
        >
          Quay lại
        </Button>
        <Link to="/">
          <Button variant="primary" size="md" iconLeft={Home}>
            Về trang chủ
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
