import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquareReply, Star } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import RatingStars from '../../components/common/RatingStars';
import ReviewCard from '../../components/common/ReviewCard';
import Modal from '../../components/common/Modal';
import Textarea from '../../components/common/Textarea';
import LoadingState from '../../components/feedback/LoadingState';
import ErrorState from '../../components/feedback/ErrorState';
import EmptyState from '../../components/feedback/EmptyState';
import { toast } from '../../components/feedback/ToastProvider';
import { useAuthStore } from '../../store/useAuthStore';
import { reviewService } from '../../services/review.service';

export function TutorReviewsPage() {
  const { user } = useAuthStore();
  const tutorId = user?._id || user?.id;

  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [ratingFilter, setRatingFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tutor response modal
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!tutorId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await reviewService.getTutorReviews(tutorId, {
        rating: ratingFilter || undefined,
        page,
        limit: 10,
      });
      setReviews(data?.reviews || []);
      setSummary(data?.ratingSummary || null);
      setPagination(data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách đánh giá');
    } finally {
      setIsLoading(false);
    }
  }, [tutorId, ratingFilter, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyTarget) return;
    if (!replyText.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi');
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewService.respondToReview(replyTarget._id, replyText.trim());
      toast.success('Đã gửi phản hồi đánh giá');
      setReplyTarget(null);
      setReplyText('');
      fetchReviews();
    } catch (err) {
      toast.error(err.message || 'Không thể gửi phản hồi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalReviews = summary?.reviewCount || 0;
  const avgRating = summary?.averageRating;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Đánh giá nhận được</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Theo dõi điểm đánh giá, nhận xét từ học viên và gửi phản hồi công khai
        </p>
      </div>

      {/* Summary card */}
      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
          <div className="sm:col-span-4 text-center sm:border-r sm:border-slate-100 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Điểm trung bình
            </p>
            <p className="text-4xl font-black text-slate-900">
              {totalReviews > 0 && avgRating ? Number(avgRating).toFixed(1) : '—'}
            </p>
            {totalReviews > 0 && <RatingStars value={avgRating} size="md" />}
            <p className="text-xs text-slate-500">{totalReviews} đánh giá hợp lệ</p>
          </div>

          <div className="sm:col-span-8 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary?.breakdown?.[star] || 0;
              const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    setRatingFilter(ratingFilter === String(star) ? '' : String(star));
                    setPage(1);
                  }}
                  className={`w-full flex items-center gap-3 text-xs px-2.5 py-1 rounded-lg transition-colors ${
                    ratingFilter === String(star) ? 'bg-brand-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="w-10 text-left font-bold text-slate-700 inline-flex items-center gap-1">
                    {star} <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  </span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-12 text-right text-slate-500">{count} lượt</span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Reviews list */}
      {isLoading ? (
        <LoadingState message="Đang tải danh sách đánh giá..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchReviews} />
      ) : reviews.length === 0 ? (
        <EmptyState
          title="Chưa có đánh giá nào"
          description={
            ratingFilter
              ? 'Không có đánh giá nào khớp với mức sao đang lọc.'
              : 'Học viên có thể gửi đánh giá sau khi hoàn thành buổi học với bạn.'
          }
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <ReviewCard
              key={rev._id}
              review={rev}
              actionSlot={
                !rev.tutorResponse?.comment && (
                  <Button
                    variant="secondary"
                    size="sm"
                    iconLeft={MessageSquareReply}
                    onClick={() => {
                      setReplyTarget(rev);
                      setReplyText('');
                    }}
                  >
                    Phản hồi đánh giá
                  </Button>
                )
              }
            />
          ))}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Reply Modal */}
      <Modal
        isOpen={Boolean(replyTarget)}
        onClose={() => !isSubmitting && setReplyTarget(null)}
        title="Phản hồi đánh giá học viên"
        description={`Học viên: ${replyTarget?.learnerId?.name || 'Học viên'}`}
        size="sm"
      >
        <form onSubmit={handleReplySubmit} className="space-y-4">
          <Textarea
            label="Nội dung phản hồi công khai"
            required
            rows={4}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Cảm ơn học viên hoặc chia sẻ thêm về quá trình học tập..."
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setReplyTarget(null)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Gửi phản hồi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default TutorReviewsPage;

