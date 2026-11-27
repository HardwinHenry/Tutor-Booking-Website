import React, { useState, useEffect, useCallback } from 'react';
import { Star } from 'lucide-react';
import Card from '../../../components/common/Card';
import Pagination from '../../../components/common/Pagination';
import RatingStars from '../../../components/common/RatingStars';
import ReviewCard from '../../../components/common/ReviewCard';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import EmptyState from '../../../components/feedback/EmptyState';
import { reviewService } from '../../../services/review.service';

export function TutorReviewList({ tutorId }) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [ratingFilter, setRatingFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReviews = useCallback(async () => {
    if (!tutorId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await reviewService.getTutorReviews(tutorId, {
        rating: ratingFilter || undefined,
        page,
        limit: 5,
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

  const totalReviews = summary?.reviewCount || 0;
  const avgRating = summary?.averageRating;

  return (
    <Card
      id="reviews-section"
      title="Đánh giá từ học viên"
      subtitle={
        totalReviews > 0
          ? `${Number(avgRating).toFixed(1)}/5 sao từ ${totalReviews} lượt đánh giá thực tế`
          : 'Chưa có đánh giá công khai'
      }
    >
      <div className="space-y-5">
        {totalReviews > 0 && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-4 text-center space-y-1">
              <p className="text-3xl font-black text-slate-900">
                {Number(avgRating).toFixed(1)}
              </p>
              <RatingStars value={avgRating} size="sm" />
              <p className="text-[11px] text-slate-500">{totalReviews} đánh giá</p>
            </div>

            <div className="sm:col-span-8 space-y-1.5">
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
                    className={`w-full flex items-center gap-2 text-xs px-2 py-0.5 rounded-md transition-colors ${
                      ratingFilter === String(star) ? 'bg-brand-50' : 'hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-8 text-left font-semibold text-slate-700 inline-flex items-center gap-0.5">
                      {star} <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    </span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-slate-500">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isLoading ? (
          <LoadingState message="Đang tải đánh giá..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchReviews} />
        ) : reviews.length === 0 ? (
          <EmptyState
            title="Chưa có đánh giá nào"
            description={
              ratingFilter
                ? 'Không có đánh giá nào ở mức sao đang chọn.'
                : 'Gia sư chưa nhận được đánh giá nào sau các buổi học hoàn thành.'
            }
          />
        ) : (
          <div className="space-y-3">
            {reviews.map((rev) => (
              <ReviewCard key={rev._id} review={rev} />
            ))}
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

export default TutorReviewList;

