import React from 'react';
import { MessageSquareReply } from 'lucide-react';
import RatingStars from './RatingStars';
import { formatDate } from '../../utils/formatters';

/**
 * Reusable Review Card displaying learner review and optional tutor response
 */
export function ReviewCard({ review, actionSlot }) {
  if (!review) return null;

  const learnerName = review.learnerId?.name || 'Học viên';
  const learnerAvatar = review.learnerId?.avatar;
  const response = review.tutorResponse;

  return (
    <div className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {learnerAvatar ? (
            <img
              src={learnerAvatar}
              alt={learnerName}
              className="w-9 h-9 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-xs">
              {learnerName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-slate-900">{learnerName}</p>
            <p className="text-[11px] text-slate-400">
              {formatDate(review.createdAt)}
              {review.bookingId?.subjectName ? ` • ${review.bookingId.subjectName}` : ''}
            </p>
          </div>
        </div>

        <RatingStars value={review.rating} size="sm" />
      </div>

      {review.comment && (
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          {review.comment}
        </p>
      )}

      {response?.comment && (
        <div className="ml-4 pl-3 border-l-2 border-brand-200 bg-slate-50/80 rounded-r-lg p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
            <MessageSquareReply className="w-3.5 h-3.5" />
            <span>Phản hồi từ gia sư</span>
            {response.respondedAt && (
              <span className="text-[11px] font-normal text-slate-400">
                • {formatDate(response.respondedAt)}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">{response.comment}</p>
        </div>
      )}

      {actionSlot && <div className="pt-1">{actionSlot}</div>}
    </div>
  );
}

export default ReviewCard;

