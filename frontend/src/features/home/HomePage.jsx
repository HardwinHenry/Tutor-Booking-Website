import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Star,
  Search,
  BookOpen,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import TutorCard from '../../components/common/TutorCard';
import { tutorService } from '../../services/tutor.service';
import { useAuthStore } from '../../store/useAuthStore';
import { formatCurrency } from '../../utils/formatters';

export function HomePage() {
  const { isAuthenticated, isAdmin, isTutor, isLearner, surveyStatus } = useAuthStore();
  const [featuredTutors, setFeaturedTutors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getStartLink = () => {
    if (!isAuthenticated) return '/login';
    if (isAdmin()) return '/admin/dashboard';
    if (isTutor()) return '/tutor/dashboard';
    if (isLearner() && surveyStatus !== 'completed') return '/learner/questionnaire';
    return '/learner/dashboard';
  };

  useEffect(() => {
    let isMounted = true;
    tutorService
      .searchTutors({ limit: 3, sort: 'rating:desc' })
      .then((data) => {
        if (isMounted) setFeaturedTutors(data?.items || []);
      })
      .catch(() => {
        if (isMounted) setFeaturedTutors([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const spotlightTutor = featuredTutors[0] || null;
  const spotlightName = spotlightTutor?.userId?.name || '';
  const spotlightCategory = spotlightTutor?.expertise?.categoryId?.name || 'Gia sư đã duyệt';
  const spotlightSubjects = (spotlightTutor?.expertise?.subjectIds || []).map((s) => s.name).join(', ');
  const spotlightPrice = spotlightTutor?.teachingConditions?.isNegotiable
    ? 'Thương lượng'
    : spotlightTutor?.teachingConditions?.priceMin > 0
      ? formatCurrency(spotlightTutor.teachingConditions.priceMin)
      : 'Liên hệ';
  const spotlightRating = spotlightTutor?.ratingSummary?.averageRating;
  const spotlightReviews = spotlightTutor?.ratingSummary?.reviewCount || 0;

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 text-center lg:text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>Khảo sát nhu cầu thông minh 28 tiêu chí</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Kết nối <span className="text-brand-600">Gia sư chất lượng</span>, học tập chuẩn mục tiêu
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              Nền tảng kết nối thông minh kết hợp hệ thống đánh giá 28 tiêu chí năng lực, quản lý lịch rảnh tự động và đồng bộ trực tiếp với Google Calendar.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Link to={getStartLink()} className="w-full sm:w-auto">
                <Button variant="primary" size="lg" iconRight={ArrowRight} className="w-full">
                  Bắt đầu ngay hôm nay
                </Button>
              </Link>
              <Link to="/tutors" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" iconLeft={Search} className="w-full">
                  Khám phá gia sư
                </Button>
              </Link>
            </div>

            {/* Quick trust metrics */}
            <div className="pt-6 border-t border-slate-200/80 flex items-center justify-center lg:justify-start gap-8 text-xs text-slate-500 font-medium flex-wrap">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Gia sư xác thực hồ sơ</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-600" />
                <span>Đặt lịch slot tức thì</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                <span>Đánh giá minh bạch</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Card (Live Backend Data or Onboarding Prompt) */}
          <div className="lg:col-span-5">
            {isLoading ? (
              <div className="mx-auto max-w-md bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                    <div className="h-3 bg-slate-100 rounded w-3/4" />
                  </div>
                </div>
                <div className="h-20 bg-slate-100 rounded-xl" />
                <div className="h-9 bg-slate-200 rounded-xl" />
              </div>
            ) : spotlightTutor ? (
              <div className="relative mx-auto max-w-md bg-white rounded-3xl p-6 shadow-2xl shadow-brand-500/10 border border-slate-100 text-left">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-lg shrink-0">
                      {spotlightName.charAt(0).toUpperCase() || 'G'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{spotlightName}</h3>
                      <p className="text-xs text-slate-500 truncate">
                        {spotlightSubjects || spotlightCategory}
                      </p>
                    </div>
                  </div>
                  <Badge color="emerald" dot>
                    Đã duyệt
                  </Badge>
                </div>

                <div className="py-4 space-y-3">
                  {spotlightTutor.introduction && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {spotlightTutor.introduction}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-slate-400 text-[10px]">Học phí / 60 phút</p>
                      <p className="font-bold text-slate-800">{spotlightPrice}</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-slate-400 text-[10px]">Đánh giá</p>
                      <p className="font-bold text-slate-800">
                        {spotlightReviews > 0 && spotlightRating
                          ? `⭐ ${Number(spotlightRating).toFixed(1)} (${spotlightReviews})`
                          : 'Chưa có đánh giá'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <Link to={`/tutors/${spotlightTutor.userId?._id || spotlightTutor._id}`}>
                    <Button variant="primary" size="sm" className="w-full">
                      Xem lịch trống & Đặt buổi học
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="relative mx-auto max-w-md bg-white rounded-3xl p-6 shadow-2xl shadow-brand-500/10 border border-slate-100 text-left space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-900 text-base">
                    Tìm gia sư phù hợp với bạn
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hoàn thành bộ 28 câu hỏi nhu cầu học tập để hệ thống Content-based Filtering gợi ý gia sư sát với trình độ và ngân sách của bạn.
                  </p>
                </div>
                <Link to="/tutors" className="block">
                  <Button variant="primary" size="sm" className="w-full" iconRight={ArrowRight}>
                    Khám phá danh sách gia sư
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Approved Tutors from Backend */}
      {featuredTutors.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <Badge color="brand" className="mb-2">
                Gia sư đã xác thực
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Gia sư nổi bật trên hệ thống
              </h2>
            </div>
            <Link to="/tutors">
              <Button variant="outline" size="sm" iconRight={ArrowRight}>
                Xem tất cả gia sư
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredTutors.map((tutor) => (
              <TutorCard key={tutor._id} tutor={tutor} />
            ))}
          </div>
        </section>
      )}

      {/* 3 Steps Process */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge color="brand" className="mb-2">
            Quy trình chuẩn hóa
          </Badge>
          <h2 className="text-3xl font-extrabold text-slate-900">
            Học tập hiệu quả chỉ với 3 bước
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Quy trình được đồng bộ chặt chẽ từ khảo sát, tìm kiếm, đặt lịch cho đến phản hồi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 font-bold flex items-center justify-center mb-4">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">
              Bộ câu hỏi nhu cầu 28 mục
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Xác định mục tiêu, trình độ, phương pháp, phong cách và khung giờ rảnh để nhận đề xuất chuẩn xác nhất.
            </p>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center mb-4">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">
              Khung giờ rảnh theo thời gian thực
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Xem trực tiếp AvailabilitySlot của gia sư, lựa chọn slot phù hợp và gửi yêu cầu booking chỉ trong vài thao tác.
            </p>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center mb-4">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">
              Đồng bộ Google Calendar & Đánh giá
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tự động thêm buổi học vào lịch cá nhân, nhận thông báo kịp thời và đánh giá chất lượng sau khi hoàn thành.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
