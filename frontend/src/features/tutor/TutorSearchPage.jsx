import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import SearchBar from '../../components/common/SearchBar';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import TutorCard from '../../components/common/TutorCard';
import LoadingState from '../../components/feedback/LoadingState';
import ErrorState from '../../components/feedback/ErrorState';
import EmptyState from '../../components/feedback/EmptyState';
import { tutorService } from '../../services/tutor.service';
import { taxonomyService } from '../../services/taxonomy.service';

const SORT_OPTIONS = [
  { value: 'rating:desc', label: 'Đánh giá cao nhất' },
  { value: 'price:asc', label: 'Học phí thấp đến cao' },
  { value: 'price:desc', label: 'Học phí cao đến thấp' },
  { value: 'experience:desc', label: 'Kinh nghiệm nhiều nhất' },
  { value: 'newest', label: 'Mới tham gia' },
];

export function TutorSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Filter values synced from URL
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const category = searchParams.get('category') || '';
  const subject = searchParams.get('subject') || '';
  const topic = searchParams.get('topic') || '';
  const mode = searchParams.get('mode') || '';
  const level = searchParams.get('level') || '';
  const priceMin = searchParams.get('priceMin') || '';
  const priceMax = searchParams.get('priceMax') || '';
  const ratingMin = searchParams.get('ratingMin') || '';
  const experienceYearsMin = searchParams.get('experienceYearsMin') || '';
  const sort = searchParams.get('sort') || 'rating:desc';
  const page = Number(searchParams.get('page')) || 1;

  // Taxonomy options
  const [categories, setCategories] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [modes, setModes] = useState([]);
  const [levels, setLevels] = useState([]);

  // Results
  const [tutors, setTutors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load base taxonomies once
  useEffect(() => {
    Promise.all([
      taxonomyService.getTaxonomies({ type: 'category', active: true }),
      taxonomyService.getTaxonomies({ type: 'learning_mode', active: true }),
      taxonomyService.getTaxonomies({ type: 'level', active: true }),
    ])
      .then(([cats, mds, lvls]) => {
        setCategories(cats || []);
        setModes(mds || []);
        setLevels(lvls || []);
      })
      .catch(() => {});
  }, []);

  // Load cascading subjects when category changes
  useEffect(() => {
    if (!category) {
      setSubjects([]);
      return;
    }
    taxonomyService
      .getChildren(category)
      .then((list) => setSubjects(list || []))
      .catch(() => setSubjects([]));
  }, [category]);

  // Load cascading topics when subject changes
  useEffect(() => {
    if (!subject) {
      setTopics([]);
      return;
    }
    taxonomyService
      .getChildren(subject)
      .then((list) => setTopics(list || []))
      .catch(() => setTopics([]));
  }, [subject]);

  const updateParam = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') next.delete(k);
      else next.set(k, String(v));
    });
    if (!('page' in updates)) next.set('page', '1');
    setSearchParams(next);
  };

  // Debounce keyword sync into URL
  useEffect(() => {
    const currentQ = searchParams.get('q') || '';
    if (keyword === currentQ) return;
    const timer = setTimeout(() => {
      updateParam({ q: keyword.trim() });
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  const fetchTutors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await tutorService.searchTutors({
        q: searchParams.get('q') || undefined,
        category: category || undefined,
        subject: subject || undefined,
        topic: topic || undefined,
        mode: mode || undefined,
        level: level || undefined,
        priceMin: priceMin || undefined,
        priceMax: priceMax || undefined,
        ratingMin: ratingMin || undefined,
        experienceYearsMin: experienceYearsMin || undefined,
        sort,
        page,
        limit: 9,
      });
      setTutors(data?.items || []);
      setPagination(data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách gia sư');
    } finally {
      setIsLoading(false);
    }
  }, [
    searchParams,
    category,
    subject,
    topic,
    mode,
    level,
    priceMin,
    priceMax,
    ratingMin,
    experienceYearsMin,
    sort,
    page,
  ]);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  const handleResetFilters = () => {
    setKeyword('');
    setSearchParams({});
  };

  const renderFilterControls = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-brand-600" /> Bộ lọc tìm kiếm
        </h3>
        <button
          type="button"
          onClick={handleResetFilters}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" /> Đặt lại
        </button>
      </div>

      <Select
        label="Lĩnh vực"
        value={category}
        onChange={(e) => updateParam({ category: e.target.value, subject: '', topic: '' })}
        placeholder="Tất cả lĩnh vực"
        options={categories.map((c) => ({ value: c._id, label: c.name }))}
      />

      {category && (
        <Select
          label="Môn học"
          value={subject}
          onChange={(e) => updateParam({ subject: e.target.value, topic: '' })}
          placeholder="Tất cả môn học"
          options={subjects.map((s) => ({ value: s._id, label: s.name }))}
        />
      )}

      {subject && topics.length > 0 && (
        <Select
          label="Chuyên môn sâu"
          value={topic}
          onChange={(e) => updateParam({ topic: e.target.value })}
          placeholder="Tất cả chuyên môn"
          options={topics.map((t) => ({ value: t._id, label: t.name }))}
        />
      )}

      <Select
        label="Hình thức học"
        value={mode}
        onChange={(e) => updateParam({ mode: e.target.value })}
        placeholder="Tất cả hình thức"
        options={modes.map((m) => ({ value: m._id, label: m.name }))}
      />

      <Select
        label="Trình độ học viên"
        value={level}
        onChange={(e) => updateParam({ level: e.target.value })}
        placeholder="Tất cả trình độ"
        options={levels.map((l) => ({ value: l._id, label: l.name }))}
      />

      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Giá từ (VNĐ)"
          type="number"
          min={0}
          step={50000}
          value={priceMin}
          onChange={(e) => updateParam({ priceMin: e.target.value })}
          placeholder="0"
        />
        <Input
          label="Giá tối đa"
          type="number"
          min={0}
          step={50000}
          value={priceMax}
          onChange={(e) => updateParam({ priceMax: e.target.value })}
          placeholder="500000"
        />
      </div>

      <Select
        label="Đánh giá tối thiểu"
        value={ratingMin}
        onChange={(e) => updateParam({ ratingMin: e.target.value })}
        placeholder="Mọi mức đánh giá"
        options={[
          { value: '4.5', label: 'Từ 4.5 ★ trở lên' },
          { value: '4', label: 'Từ 4.0 ★ trở lên' },
          { value: '3', label: 'Từ 3.0 ★ trở lên' },
        ]}
      />

      <Input
        label="Kinh nghiệm tối thiểu (năm)"
        type="number"
        min={0}
        value={experienceYearsMin}
        onChange={(e) => updateParam({ experienceYearsMin: e.target.value })}
        placeholder="VD: 2"
      />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner & Search */}
      <div className="space-y-3">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Tìm kiếm & Khám phá Gia sư
        </h1>
        <p className="text-sm text-slate-500">
          Chỉ hiển thị các gia sư đã được Admin phê duyệt hồ sơ năng lực và sẵn sàng nhận lớp.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="flex-1">
            <SearchBar
              value={keyword}
              onChange={setKeyword}
              onClear={() => {
                setKeyword('');
                updateParam({ q: '' });
              }}
              placeholder="Tìm theo tên gia sư, môn học, chuyên môn hoặc mô tả..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              iconLeft={SlidersHorizontal}
              onClick={() => setShowMobileFilter(true)}
              className="lg:hidden"
            >
              Bộ lọc
            </Button>

            <div className="w-52">
              <Select
                value={sort}
                onChange={(e) => updateParam({ sort: e.target.value })}
                placeholder=""
                options={SORT_OPTIONS}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Desktop Sidebar Filter */}
        <aside className="hidden lg:block lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm sticky top-20">
          {renderFilterControls()}
        </aside>

        {/* Mobile Filter Drawer */}
        {showMobileFilter && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/40"
              onClick={() => setShowMobileFilter(false)}
            />
            <div className="relative w-80 max-w-full bg-white h-full p-5 overflow-y-auto shadow-2xl z-10">
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  onClick={() => setShowMobileFilter(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderFilterControls()}
            </div>
          </div>
        )}

        {/* Tutor Results */}
        <div className="lg:col-span-9 space-y-5">
          {!isLoading && !error && (
            <p className="text-xs font-medium text-slate-500">
              Tìm thấy <strong className="text-slate-900">{pagination.total || 0}</strong> gia sư phù hợp
            </p>
          )}

          {isLoading ? (
            <LoadingState message="Đang tìm kiếm gia sư phù hợp..." />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchTutors} />
          ) : tutors.length === 0 ? (
            <EmptyState
              title="Không tìm thấy gia sư phù hợp"
              description="Hãy thử thay đổi từ khóa hoặc nới lỏng các tiêu chí lọc để xem nhiều kết quả hơn."
              action={
                <Button variant="secondary" size="sm" onClick={handleResetFilters}>
                  Xóa tất cả bộ lọc
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {tutors.map((tutor) => (
                  <TutorCard key={tutor._id} tutor={tutor} />
                ))}
              </div>

              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                onPageChange={(p) => updateParam({ page: p })}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TutorSearchPage;

