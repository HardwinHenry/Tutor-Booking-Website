import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, MapPin, ShieldCheck, Star, ArrowRight } from 'lucide-react';
import Badge from './Badge';
import Button from './Button';
import { formatCurrency } from '../../utils/formatters';

/**
 * Reusable Tutor Card for Search, Home, and Recommendations
 */
export function TutorCard({ tutor, extraTop, extraBody, ctaLabel = 'Xem hồ sơ & Đặt lịch' }) {
  if (!tutor) return null;

  const user = tutor.userId || {};
  const tutorRouteId = user._id || tutor._id || tutor.id;
  const name = user.name || tutor.name || 'Gia sư';
  const avatar = user.avatar;
  const category = tutor.expertise?.categoryId?.name;
  const subjects = tutor.expertise?.subjectIds || [];
  const modes = tutor.teachingConditions?.modes || [];
  const serviceAreas = tutor.teachingConditions?.serviceAreas || [];
  const priceMin = tutor.teachingConditions?.priceMin;
  const priceMax = tutor.teachingConditions?.priceMax;
  const isNegotiable = tutor.teachingConditions?.isNegotiable;
  const experienceYears = tutor.experienceYears;

  const avgRating = tutor.ratingSummary?.averageRating;
  const reviewCount = tutor.ratingSummary?.reviewCount || 0;
  const hasVerifiedQual = (tutor.qualifications || []).some((q) => q.verified);

  const renderPrice = () => {
    if (isNegotiable && (!priceMin || priceMin === 0)) return 'Thương lượng';
    if (priceMin && priceMax && priceMax > priceMin) {
      return `${formatCurrency(priceMin)} – ${formatCurrency(priceMax)}`;
    }
    if (priceMin > 0) return formatCurrency(priceMin);
    return 'Liên hệ';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-brand-200 transition-all flex flex-col overflow-hidden">
      {extraTop && (
        <div className="px-5 pt-4 pb-2 bg-slate-50/70 border-b border-slate-100">{extraTop}</div>
      )}

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start gap-3">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-base shrink-0">
                {name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link
                  to={`/tutors/${tutorRouteId}`}
                  className="font-bold text-slate-900 hover:text-brand-600 transition-colors truncate text-base"
                >
                  {name}
                </Link>
                {hasVerifiedQual && (
                  <ShieldCheck
                    className="w-4 h-4 text-emerald-600 shrink-0"
                    title="Có chứng chỉ đã xác minh"
                  />
                )}
              </div>

              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
                {category && (
                  <span className="font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                    {category}
                  </span>
                )}
                {experienceYears > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {experienceYears} năm KN
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {tutor.introduction && (
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {tutor.introduction}
            </p>
          )}

          {/* Subjects */}
          {subjects.length > 0 && (
            <div className="flex items-center flex-wrap gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {subjects.slice(0, 3).map((sub) => (
                <Badge key={sub._id || sub.id || sub} color="slate" size="sm">
                  {sub.name || sub}
                </Badge>
              ))}
              {subjects.length > 3 && (
                <span className="text-[11px] text-slate-400 font-medium">
                  +{subjects.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Modes & Area */}
          <div className="flex items-center flex-wrap gap-2 text-xs text-slate-600">
            {modes.map((m) => (
              <Badge key={m._id || m.id || m} color="sky" size="sm">
                {m.name || m}
              </Badge>
            ))}
            {serviceAreas.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                <MapPin className="w-3 h-3 text-slate-400" />
                {serviceAreas[0]}
              </span>
            )}
          </div>

          {extraBody}
        </div>

        {/* Footer: Rating + Price + CTA */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div>
              {reviewCount > 0 && avgRating !== null && avgRating !== undefined ? (
                <div className="flex items-center gap-1 font-semibold text-slate-800">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{Number(avgRating).toFixed(1)}</span>
                  <span className="text-slate-400 font-normal">({reviewCount} đánh giá)</span>
                </div>
              ) : (
                <span className="text-slate-400">Chưa có đánh giá</span>
              )}
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Học phí / 60 phút</span>
              <span className="font-bold text-slate-900 text-sm">{renderPrice()}</span>
            </div>
          </div>

          <Link to={`/tutors/${tutorRouteId}`} className="block">
            <Button variant="primary" size="sm" iconRight={ArrowRight} className="w-full">
              {ctaLabel}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TutorCard;

