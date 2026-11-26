import React, { useState } from 'react';
import { Star } from 'lucide-react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import Textarea from '../../../components/common/Textarea';
import RatingStars from '../../../components/common/RatingStars';
import { toast } from '../../../components/feedback/ToastProvider';
import { reviewService } from '../../../services/review.service';

export function ReviewFormModal({ isOpen, onClose, booking, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      toast.error('Vui lòng chọn số sao đánh giá từ 1 đến 5');
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewService.createReview({
        bookingId: booking._id,
        rating,
        comment: comment.trim(),
      });
      toast.success('Cảm ơn bạn đã gửi đánh giá buổi học!');
      setComment('');
      setRating(5);
      onClose();
      onSubmitted?.();
    } catch (err) {
      toast.error(err.message || 'Không thể gửi đánh giá');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title="Đánh giá buổi học đã hoàn thành"
      description={`Gia sư: ${booking.tutorId?.name || 'Gia sư'} • ${booking.subjectName || 'Buổi học'}`}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col items-center space-y-2">
          <span className="text-xs font-semibold text-slate-600">Mức độ hài lòng của bạn</span>
          <RatingStars value={rating} size="lg" interactive onChange={setRating} />
          <span className="text-xs font-bold text-amber-600">{rating} / 5 sao</span>
        </div>

        <Textarea
          label="Nhận xét chi tiết (tùy chọn)"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ trải nghiệm về phương pháp giảng dạy, sự nhiệt tình và hiệu quả buổi học..."
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Đóng
          </Button>
          <Button type="submit" variant="primary" iconLeft={Star} isLoading={isSubmitting}>
            Gửi đánh giá
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ReviewFormModal;

