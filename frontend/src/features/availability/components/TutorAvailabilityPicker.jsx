import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, RefreshCw } from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import EmptyState from '../../../components/feedback/EmptyState';
import { availabilityService } from '../../../services/availability.service';
import { AVAILABILITY_STATUS } from '../../../constants';
import { formatDate, formatTime, formatDuration } from '../../../utils/formatters';

/**
 * Embedded availability slot selector on TutorDetailPage.
 * Displays only backend-confirmed AVAILABLE future slots.
 */
export function TutorAvailabilityPicker({ tutorUserId, onSelectSlot, refreshKey = 0 }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getRange = (offset) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() + offset * 7);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { from: start, to: end };
  };

  const fetchSlots = useCallback(async () => {
    if (!tutorUserId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { from, to } = getRange(weekOffset);
      const data = await availabilityService.getTutorAvailability(tutorUserId, {
        from: from.toISOString(),
        to: to.toISOString(),
        limit: 50,
      });
      // Guard: only allow available future slots
      const validSlots = (data?.items || []).filter(
        (s) => s.status === AVAILABILITY_STATUS.AVAILABLE && new Date(s.startAt) > new Date()
      );
      setSlots(validSlots);
    } catch (err) {
      setError(err.message || 'Không thể tải lịch trống của gia sư');
    } finally {
      setIsLoading(false);
    }
  }, [tutorUserId, weekOffset]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots, refreshKey]);

  const { from, to } = getRange(weekOffset);

  // Group slots by date string
  const grouped = slots.reduce((acc, slot) => {
    const key = formatDate(slot.startAt);
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});

  return (
    <Card
      title="Lịch trống có thể đặt"
      subtitle="Chọn một khung giờ còn trống (available) để gửi yêu cầu booking"
      action={
        <button
          type="button"
          onClick={fetchSlots}
          title="Làm mới lịch trống"
          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      }
    >
      <div className="space-y-4">
        {/* Week navigator */}
        <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2 border border-slate-200/80 text-xs">
          <Button
            variant="secondary"
            size="sm"
            disabled={weekOffset <= 0}
            onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
            className="px-2 py-1"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-semibold text-slate-700 inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand-600" />
            {formatDate(from)} – {formatDate(to)}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setWeekOffset((w) => w + 1)}
            className="px-2 py-1"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Slots list */}
        {isLoading ? (
          <LoadingState message="Đang tải khung giờ..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchSlots} />
        ) : slots.length === 0 ? (
          <EmptyState
            title="Chưa có lịch trống trong tuần này"
            description="Thử chuyển sang tuần tiếp theo để xem các khung giờ khả dụng khác của gia sư."
            action={
              <Button variant="secondary" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>
                Xem tuần kế tiếp
              </Button>
            }
          />
        ) : (
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {Object.entries(grouped).map(([dateStr, daySlots]) => (
              <div key={dateStr} className="space-y-2">
                <p className="text-xs font-bold text-slate-600 sticky top-0 bg-white py-1">
                  {dateStr}
                </p>
                <div className="space-y-2">
                  {daySlots.map((slot) => {
                    const mins = Math.round(
                      (new Date(slot.endAt).getTime() - new Date(slot.startAt).getTime()) / 60000
                    );
                    return (
                      <button
                        key={slot._id}
                        type="button"
                        onClick={() => onSelectSlot?.(slot)}
                        className="w-full text-left p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-400 transition-all group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 text-xs inline-flex items-center gap-1.5 group-hover:text-brand-700">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            {formatTime(slot.startAt)} – {formatTime(slot.endAt)}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                            Chọn đặt
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {formatDuration(mins)} • {slot.timezone || 'Asia/Ho_Chi_Minh'}
                        </p>
                        {slot.note && (
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">
                            {slot.note}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export default TutorAvailabilityPicker;

