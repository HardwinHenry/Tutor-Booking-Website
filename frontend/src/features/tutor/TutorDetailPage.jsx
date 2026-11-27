import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingState from '../../components/feedback/LoadingState';
import ErrorState from '../../components/feedback/ErrorState';
import TutorAvailabilityPicker from '../availability/components/TutorAvailabilityPicker';
import BookingConfirmModal from '../booking/components/BookingConfirmModal';
import TutorReviewList from '../review/components/TutorReviewList';
import { tutorService } from '../../services/tutor.service';
import { formatCurrency } from '../../utils/formatters';

export function TutorDetailPage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availabilityRefreshKey, setAvailabilityRefreshKey] = useState(0);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await tutorService.getPublicProfile(id);
      setProfile(data);
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin hồ sơ gia sư');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (isLoading) return <LoadingState fullPage message="Đang tải hồ sơ gia sư..." />;
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorState message={error} onRetry={fetchProfile} />
      </div>
    );
  }
  if (!profile) return null;

  const user = profile.userId || {};
  const name = user.name || 'Gia sư';
  const category = profile.expertise?.categoryId?.name;
  const subjects = profile.expertise?.subjectIds || [];
  const topics = profile.expertise?.topicIds || [];
  const purposes = profile.teachingCapabilities?.supportedPurposes || [];
  const teachableLevels = profile.teachingCapabilities?.teachableLevels || [];
  const methods = profile.teachingCapabilities?.methods || [];
  const styles = profile.teachingCapabilities?.styles || [];
  const modes = profile.teachingConditions?.modes || [];
  const serviceAreas = profile.teachingConditions?.serviceAreas || [];
  const qualifications = profile.qualifications || [];
  const priceMin = profile.teachingConditions?.priceMin;
  const priceMax = profile.teachingConditions?.priceMax;
  const isNegotiable = profile.teachingConditions?.isNegotiable;
  const avgRating = profile.ratingSummary?.averageRating;
  const reviewCount = profile.ratingSummary?.reviewCount || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <Link
          to="/tutors"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách gia sư
        </Link>
      </div>

      {/* Hero Summary Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={name}
                className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-brand-100 text-brand-700 font-black flex items-center justify-center text-2xl shrink-0">
                {name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900">{name}</h1>
                <Badge color="emerald" dot>
                  Hồ sơ đã duyệt
                </Badge>
              </div>

              <div className="flex items-center flex-wrap gap-3 text-xs text-slate-600">
                {category && (
                  <span className="font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md">
                    {category}
                  </span>
                )}
                {profile.experienceYears > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {profile.experienceYears} năm kinh nghiệm
                  </span>
                )}
                {reviewCount > 0 && avgRating ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    {Number(avgRating).toFixed(1)} ({reviewCount} đánh giá)
                  </span>
                ) : (
                  <span className="text-slate-400">Chưa có đánh giá</span>
                )}
              </div>

              <div className="flex items-center flex-wrap gap-2">
                {modes.map((m) => (
                  <Badge key={m._id} color="sky" size="sm">
                    {m.name}
                  </Badge>
                ))}
                {serviceAreas.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {serviceAreas.join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 min-w-[220px] space-y-2 text-center md:text-right">
            <p className="text-[11px] text-slate-500 uppercase font-semibold">
              Học phí tham khảo / 60 phút
            </p>
            <p className="text-xl font-black text-brand-700">
              {isNegotiable && (!priceMin || priceMin === 0)
                ? 'Thương lượng'
                : priceMin && priceMax && priceMax > priceMin
                  ? `${formatCurrency(priceMin)} – ${formatCurrency(priceMax)}`
                  : priceMin > 0
                    ? formatCurrency(priceMin)
                    : 'Liên hệ'}
            </p>
            <a href="#availability-section" className="block pt-1">
              <Button variant="primary" size="sm" iconLeft={Calendar} className="w-full">
                Xem lịch trống & Đặt lịch
              </Button>
            </a>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Bio, Capabilities, Qualifications */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Giới thiệu & Định hướng giảng dạy">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {profile.introduction || 'Gia sư chưa cập nhật mô tả chi tiết.'}
            </p>
          </Card>

          <Card title="Môn học, Chuyên môn & Phương pháp">
            <div className="space-y-4 text-xs">
              {subjects.length > 0 && (
                <div className="space-y-1.5">
                  <p className="font-bold text-slate-700 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-brand-600" /> Môn học đảm nhận
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {subjects.map((s) => (
                      <Badge key={s._id} color="brand" size="sm">
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {topics.length > 0 && (
                <div className="space-y-1.5">
                  <p className="font-bold text-slate-700">Chuyên môn sâu</p>
                  <div className="flex flex-wrap gap-1.5">
                    {topics.map((t) => (
                      <Badge key={t._id} color="slate" size="sm">
                        {t.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {teachableLevels.length > 0 && (
                <div className="space-y-1.5">
                  <p className="font-bold text-slate-700">Trình độ nhận dạy</p>
                  <div className="flex flex-wrap gap-1.5">
                    {teachableLevels.map((l) => (
                      <Badge key={l._id} color="emerald" size="sm">
                        {l.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {(methods.length > 0 || styles.length > 0 || purposes.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  {methods.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="font-bold text-slate-700 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-brand-600" /> Phương pháp giảng dạy
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {methods.map((m) => (
                          <Badge key={m._id} color="slate" size="sm">
                            {m.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {styles.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="font-bold text-slate-700">Phong cách gia sư</p>
                      <div className="flex flex-wrap gap-1">
                        {styles.map((st) => (
                          <Badge key={st._id} color="slate" size="sm">
                            {st.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card title="Bằng cấp & Chứng chỉ">
            {qualifications.length === 0 ? (
              <p className="text-xs text-slate-400">Chưa có bằng cấp được công khai.</p>
            ) : (
              <div className="space-y-3">
                {qualifications.map((q, idx) => (
                  <div
                    key={q._id || idx}
                    className="p-3.5 rounded-xl border border-slate-200/80 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <Award className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{q.title}</p>
                        <p className="text-xs text-slate-500">
                          {q.issuer || 'Đơn vị cấp'} {q.year ? `• Năm ${q.year}` : ''}
                        </p>
                      </div>
                    </div>
                    {q.verified && (
                      <Badge color="emerald" size="sm">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Đã xác minh
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Reviews section */}
          <TutorReviewList tutorId={user._id || profile._id} />
        </div>

        {/* Right: Availability Slot Picker */}
        <div id="availability-section" className="space-y-6 lg:sticky lg:top-20">
          <TutorAvailabilityPicker
            tutorUserId={user._id}
            onSelectSlot={(slot) => setSelectedSlot(slot)}
            refreshKey={availabilityRefreshKey}
          />
        </div>
      </div>

      {/* Booking Confirm Modal */}
      <BookingConfirmModal
        isOpen={Boolean(selectedSlot)}
        onClose={() => setSelectedSlot(null)}
        slot={selectedSlot}
        tutorProfile={profile}
        onSuccessOrConflict={() => {
          setAvailabilityRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
}

export default TutorDetailPage;
