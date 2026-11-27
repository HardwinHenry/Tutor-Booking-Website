import React, { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import RatingStars from '../../components/common/RatingStars';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ErrorState from '../../components/feedback/ErrorState';
import { toast } from '../../components/feedback/ToastProvider';
import { adminService } from '../../services/admin.service';
import { formatDateTime } from '../../utils/formatters';

export function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [ratingFilter, setRatingFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [page, setPage] = useState(1);

  const [toggleTarget, setToggleTarget] = useState(null);
  const [isToggling, setIsToggling] = useState(false);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.getReviews({
        rating: ratingFilter || undefined,
        isPublic: visibilityFilter !== '' ? visibilityFilter : undefined,
        page,
        limit: 10,
      });
      setReviews(data?.reviews || []);
      setPagination(data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách đánh giá');
    } finally {
      setIsLoading(false);
    }
  }, [ratingFilter, visibilityFilter, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    setIsToggling(true);
    try {
      const nextVisible = !toggleTarget.isPublic;
      await adminService.updateReviewVisibility(toggleTarget._id, nextVisible);
      toast.success(nextVisible ? 'Đã hiển thị lại đánh giá' : 'Đã ẩn đánh giá');
      setToggleTarget(null);
      fetchReviews();
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật trạng thái hiển thị');
    } finally {
      setIsToggling(false);
    }
  };

  const columns = [
    {
      key: 'learnerId',
      header: 'Học viên → Gia sư',
      render: (_, row) => (
        <div className="text-xs">
          <p className="font-bold text-slate-900">
            {row.learnerId?.name || 'Học viên'} → {row.tutorId?.name || 'Gia sư'}
          </p>
          <p className="text-slate-500">{formatDateTime(row.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Số sao',
      render: (val) => <RatingStars value={val} size="xs" />,
    },
    {
      key: 'comment',
      header: 'Nội dung nhận xét',
      render: (val) => (
        <p className="text-xs text-slate-700 max-w-md whitespace-normal line-clamp-2">
          {val || <span className="text-slate-400 italic">Không có nhận xét</span>}
        </p>
      ),
    },
    {
      key: 'isPublic',
      header: 'Hiển thị',
      render: (val) =>
        val ? (
          <Badge color="emerald" dot>
            Công khai
          </Badge>
        ) : (
          <Badge color="rose">Đã ẩn</Badge>
        ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'right',
      render: (_, row) => (
        <Button
          variant={row.isPublic ? 'danger' : 'success'}
          size="sm"
          onClick={() => setToggleTarget(row)}
          className="px-2.5"
        >
          {row.isPublic ? (
            <>
              <EyeOff className="w-3.5 h-3.5 mr-1" /> Ẩn
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 mr-1" /> Hiện
            </>
          )}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Kiểm duyệt Đánh giá</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tra cứu nhận xét của học viên và ẩn/hiện các đánh giá vi phạm tiêu chuẩn cộng đồng
        </p>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <Select
            label="Số sao"
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Tất cả mức sao"
            options={[
              { value: '5', label: '5 sao' },
              { value: '4', label: '4 sao' },
              { value: '3', label: '3 sao' },
              { value: '2', label: '2 sao' },
              { value: '1', label: '1 sao' },
            ]}
          />
          <Select
            label="Trạng thái hiển thị"
            value={visibilityFilter}
            onChange={(e) => {
              setVisibilityFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Tất cả"
            options={[
              { value: 'true', label: 'Đang công khai' },
              { value: 'false', label: 'Đã ẩn' },
            ]}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setRatingFilter('');
              setVisibilityFilter('');
              setPage(1);
            }}
          >
            Đặt lại
          </Button>
        </div>
      </Card>

      {error ? (
        <ErrorState message={error} onRetry={fetchReviews} />
      ) : (
        <Card bodyClassName="p-0">
          <Table
            columns={columns}
            data={reviews}
            isLoading={isLoading}
            emptyMessage="Không có đánh giá nào."
            className="border-none rounded-none"
          />
          <div className="border-t border-slate-100 px-4">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              onPageChange={setPage}
            />
          </div>
        </Card>
      )}

      <ConfirmDialog
        isOpen={Boolean(toggleTarget)}
        onClose={() => !isToggling && setToggleTarget(null)}
        onConfirm={handleConfirmToggle}
        isLoading={isToggling}
        variant={toggleTarget?.isPublic ? 'danger' : 'info'}
        title={toggleTarget?.isPublic ? 'Ẩn đánh giá này?' : 'Hiển thị lại đánh giá?'}
        message="Khi thay đổi trạng thái hiển thị, điểm đánh giá trung bình của gia sư sẽ được Backend tự động tính toán lại."
        confirmText={toggleTarget?.isPublic ? 'Ẩn đánh giá' : 'Hiển thị lại'}
      />
    </div>
  );
}

export default AdminReviewsPage;

