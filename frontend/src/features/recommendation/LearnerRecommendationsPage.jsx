import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  ClipboardList,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Pagination from '../../components/common/Pagination';
import TutorCard from '../../components/common/TutorCard';
import LoadingState from '../../components/feedback/LoadingState';
import ErrorState from '../../components/feedback/ErrorState';
import EmptyState from '../../components/feedback/EmptyState';
import { recommendationService } from '../../services/recommendation.service';
import { taxonomyService } from '../../services/taxonomy.service';

const SCORE_CRITERIA = [
  { key: 'subject', label: 'Môn học & Chuyên môn', weight: '30%' },
  { key: 'levelGoal', label: 'Trình độ & Mục tiêu', weight: '20%' },
  { key: 'budget', label: 'Ngân sách & Học phí', weight: '15%' },
  { key: 'modeLocation', label: 'Hình thức & Địa điểm', weight: '10%' },
  { key: 'teachingFit', label: 'Phương pháp & Phong cách', weight: '10%' },
  { key: 'availability', label: 'Thời gian mong muốn', weight: '5%' },
  { key: 'experienceQualification', label: 'Kinh nghiệm & Chứng chỉ', weight: '5%' },
  { key: 'rating', label: 'Đánh giá học viên', weight: '5%' },
];

function ScoreBreakdownPanel({ breakdown }) {
  const [expanded, setExpanded] = useState(false);
  if (!breakdown) return null;

  return (
    <div className="pt-2 border-t border-slate-100">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between text-xs font-semibold text-brand-700 hover:text-brand-800 py-1"
      >
        <span>Chi tiết điểm phù hợp (8 nhóm tiêu chí)</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 bg-slate-50/90 rounded-xl p-3 border border-slate-200/70">
          {SCORE_CRITERIA.map((item) => {
            const val = Number(breakdown[item.key] ?? 0);
            return (
              <div key={item.key} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">
                    {item.label} <span className="text-slate-400">({item.weight})</span>
                  </span>
                  <span className="font-bold text-slate-800">{Math.round(val)}/100</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      val >= 80 ? 'bg-emerald-500' : val >= 50 ? 'bg-brand-500' : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, val))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function LearnerRecommendationsPage() {
  const [items, setItems] = useState([]);
  const [algorithmVersion, setAlgorithmVersion] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Additional filters supported by recommendation.validator.js
  const [mode, setMode] = useState('');
  const [minScore, setMinScore] = useState('30');
  const [strictBudget, setStrictBudget] = useState(false);
  const [page, setPage] = useState(1);
  const [modes, setModes] = useState([]);

  useEffect(() => {
    taxonomyService
      .getTaxonomies({ type: 'learning_mode', active: true })
      .then((list) => setModes(list || []))
      .catch(() => {});
  }, []);

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNeedsOnboarding(false);
    try {
      const data = await recommendationService.getTutorRecommendations({
        mode: mode || undefined,
        minScore: minScore !== '' ? Number(minScore) : undefined,
        strictBudget: strictBudget || undefined,
        page,
        limit: 9,
      });
      // IMPORTANT: Preserve exact Backend ranking order
      setItems(data?.items || []);
      setAlgorithmVersion(data?.algorithmVersion || '');
      setPagination(data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      if (err.statusCode === 400 || err.statusCode === 422) {
        setNeedsOnboarding(true);
      }
      setError(err.message || 'Không thể tải danh sách gợi ý gia sư');
    } finally {
      setIsLoading(false);
    }
  }, [mode, minScore, strictBudget, page]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">Gia sư Gợi ý Phù hợp</h1>
            {algorithmVersion && (
              <Badge color="brand" size="sm">
                {algorithmVersion}
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Xếp hạng Content-based Filtering dựa trên bộ nhu cầu 28 câu hỏi của bạn (thứ tự chuẩn xác từ hệ thống)
          </p>
        </div>

        <Link to="/learner/questionnaire">
          <Button variant="secondary" size="sm" iconLeft={ClipboardList}>
            Điều chỉnh nhu cầu 28 câu
          </Button>
        </Link>
      </div>

      {/* Soft Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <Select
            label="Lọc theo hình thức học"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value);
              setPage(1);
            }}
            placeholder="Theo khảo sát ban đầu"
            options={modes.map((m) => ({ value: m._id, label: m.name }))}
          />

          <Select
            label="Ngưỡng điểm tối thiểu (MatchScore)"
            value={minScore}
            onChange={(e) => {
              setMinScore(e.target.value);
              setPage(1);
            }}
            placeholder=""
            options={[
              { value: '0', label: 'Tất cả (từ 0%)' },
              { value: '30', label: 'Từ 30% trở lên (Mặc định)' },
              { value: '50', label: 'Từ 50% trở lên' },
              { value: '70', label: 'Từ 70% trở lên (Rất phù hợp)' },
            ]}
          />

          <label className="flex items-center gap-2.5 h-10 px-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={strictBudget}
              onChange={(e) => {
                setStrictBudget(e.target.checked);
                setPage(1);
              }}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span>Chỉ hiển thị trong ngân sách tối đa</span>
          </label>
        </div>
      </Card>

      {/* States & List */}
      {isLoading ? (
        <LoadingState message="Đang tính toán mức độ phù hợp từ hồ sơ gia sư..." />
      ) : needsOnboarding ? (
        <EmptyState
          title="Chưa đủ dữ liệu nhu cầu học tập"
          description={error || 'Vui lòng hoàn thành bộ 28 câu hỏi khảo sát để nhận gợi ý gia sư chính xác.'}
          action={
            <Link to="/learner/questionnaire">
              <Button variant="primary" size="sm" iconLeft={ClipboardList}>
                Hoàn thành khảo sát ngay
              </Button>
            </Link>
          }
        />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchRecommendations} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Chưa tìm thấy gia sư đạt ngưỡng phù hợp"
          description="Thử giảm ngưỡng điểm MatchScore, bỏ giới hạn ngân sách nghiêm ngặt hoặc tìm kiếm trực tiếp toàn bộ danh sách gia sư."
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                iconLeft={SlidersHorizontal}
                onClick={() => {
                  setMode('');
                  setMinScore('0');
                  setStrictBudget(false);
                  setPage(1);
                }}
              >
                Nới lỏng bộ lọc
              </Button>
              <Link to="/tutors">
                <Button variant="primary" size="sm" iconLeft={Search}>
                  Tìm kiếm thủ công
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {items.map((item, idx) => {
              const score = Math.round(item.matchScore ?? 0);
              const rank = (pagination.page - 1) * (pagination.limit || 9) + idx + 1;

              return (
                <TutorCard
                  key={item.profileId || item.tutorId}
                  tutor={item.tutor}
                  extraTop={
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Đề xuất #{rank}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black ${
                            score >= 75
                              ? 'bg-emerald-100 text-emerald-800'
                              : score >= 50
                                ? 'bg-brand-100 text-brand-800'
                                : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {score}% Phù hợp
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            score >= 75
                              ? 'bg-emerald-500'
                              : score >= 50
                                ? 'bg-brand-600'
                                : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                        />
                      </div>
                    </div>
                  }
                  extraBody={
                    <div className="space-y-2 pt-1">
                      {item.matchedReasons?.length > 0 && (
                        <div className="space-y-1">
                          {item.matchedReasons.slice(0, 3).map((reason, rIdx) => (
                            <p
                              key={rIdx}
                              className="text-[11px] text-emerald-700 flex items-start gap-1.5 leading-snug"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{reason}</span>
                            </p>
                          ))}
                        </div>
                      )}

                      {item.missingOrWeakMatches?.length > 0 && (
                        <div className="space-y-1">
                          {item.missingOrWeakMatches.slice(0, 2).map((weak, wIdx) => (
                            <p
                              key={wIdx}
                              className="text-[11px] text-amber-700 flex items-start gap-1.5 leading-snug"
                            >
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>{weak}</span>
                            </p>
                          ))}
                        </div>
                      )}

                      <ScoreBreakdownPanel breakdown={item.scoreBreakdown} />
                    </div>
                  }
                />
              );
            })}
          </div>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

export default LearnerRecommendationsPage;

