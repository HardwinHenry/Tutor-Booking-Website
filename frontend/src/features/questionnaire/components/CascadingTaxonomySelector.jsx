import React, { useState, useEffect } from 'react';
import { taxonomyService } from '../../../services/taxonomy.service';
import QuestionCard from './QuestionCard';
import SingleChoiceField from './SingleChoiceField';
import MultipleChoiceField from './MultipleChoiceField';
import LoadingState from '../../../components/feedback/LoadingState';

/**
 * Cascading Taxonomy Selector: Q1 (Category) -> Q2 (Subjects) -> Q3 (Topics)
 * Automatically fetches children and clears downstream selections on parent change.
 */
export function CascadingTaxonomySelector({
  categories = [],
  selectedCategoryId = null,
  selectedSubjectIds = [],
  selectedTopicIds = [],
  onCategoryChange,
  onSubjectsChange,
  onTopicsChange,
  errors = {},
  q1Meta = { questionId: 'Q1', title: 'Lĩnh vực', subtitle: 'Chọn 1 lĩnh vực chính' },
  q2Meta = { questionId: 'Q2', title: 'Môn học / Ngôn ngữ', subtitle: 'Chọn một hoặc nhiều môn học' },
  q3Meta = { questionId: 'Q3', title: 'Chuyên môn sâu', subtitle: 'Chọn nội dung chuyên môn cụ thể' },
}) {
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  // When selectedCategoryId changes: fetch subjects
  useEffect(() => {
    if (!selectedCategoryId) {
      setSubjects([]);
      return;
    }

    let isMounted = true;
    setIsLoadingSubjects(true);

    taxonomyService
      .getChildren(selectedCategoryId)
      .then((data) => {
        if (isMounted) {
          setSubjects(data);
        }
      })
      .catch((err) => {
        console.error('Lỗi tải danh sách môn học:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingSubjects(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCategoryId]);

  // When selectedSubjectIds change: fetch topics for all selected subjects
  useEffect(() => {
    if (!selectedSubjectIds || selectedSubjectIds.length === 0) {
      setTopics([]);
      return;
    }

    let isMounted = true;
    setIsLoadingTopics(true);

    Promise.all(selectedSubjectIds.map((subId) => taxonomyService.getChildren(subId)))
      .then((results) => {
        if (isMounted) {
          const allTopics = results.flat();
          // Deduplicate by ID
          const uniqueTopics = [];
          const seenIds = new Set();
          for (const item of allTopics) {
            const id = item._id || item.id;
            if (!seenIds.has(id)) {
              seenIds.add(id);
              uniqueTopics.push(item);
            }
          }
          setTopics(uniqueTopics);
        }
      })
      .catch((err) => {
        console.error('Lỗi tải danh sách chuyên môn sâu:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingTopics(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSubjectIds]);

  // Handler for category change
  const handleCategorySelect = (newCatId) => {
    if (String(newCatId) !== String(selectedCategoryId)) {
      onCategoryChange(newCatId);
      // Reset dependent selections
      onSubjectsChange([]);
      onTopicsChange([]);
    }
  };

  // Handler for subjects change
  const handleSubjectsSelect = (newSubIds) => {
    onSubjectsChange(newSubIds);
    // Filter out topics that no longer belong to selected subjects
    const validSubIdsSet = new Set(newSubIds.map(String));
    const validTopics = topics.filter((t) => validSubIdsSet.has(String(t.parentId)));
    const validTopicIds = validTopics.map((t) => t._id || t.id);
    const updatedSelectedTopics = selectedTopicIds.filter((tId) =>
      validTopicIds.includes(tId)
    );
    if (updatedSelectedTopics.length !== selectedTopicIds.length) {
      onTopicsChange(updatedSelectedTopics);
    }
  };

  return (
    <div className="space-y-5">
      {/* Q1: Category Selection */}
      <QuestionCard
        questionId={q1Meta.questionId}
        title={q1Meta.title}
        subtitle={q1Meta.subtitle}
        required
        error={errors.categoryId}
      >
        <SingleChoiceField
          options={categories}
          value={selectedCategoryId}
          onChange={handleCategorySelect}
          columns={2}
        />
      </QuestionCard>

      {/* Q2: Subjects Selection (Dependent on Q1) */}
      <QuestionCard
        questionId={q2Meta.questionId}
        title={q2Meta.title}
        subtitle={
          selectedCategoryId
            ? q2Meta.subtitle
            : 'Vui lòng chọn lĩnh vực ở câu 1 trước để xem các môn học tương ứng'
        }
        required
        error={errors.subjectIds}
      >
        {!selectedCategoryId ? (
          <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
            Chưa chọn lĩnh vực ở {q1Meta.questionId}
          </div>
        ) : isLoadingSubjects ? (
          <div className="py-4">
            <LoadingState message="Đang tải danh sách môn học..." />
          </div>
        ) : subjects.length === 0 ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
            Chưa có môn học nào thuộc lĩnh vực này
          </div>
        ) : (
          <MultipleChoiceField
            options={subjects}
            value={selectedSubjectIds}
            onChange={handleSubjectsSelect}
            columns={2}
          />
        )}
      </QuestionCard>

      {/* Q3: Topics Selection (Dependent on Q2) */}
      <QuestionCard
        questionId={q3Meta.questionId}
        title={q3Meta.title}
        subtitle={
          selectedSubjectIds.length > 0
            ? q3Meta.subtitle
            : 'Vui lòng chọn ít nhất 1 môn học ở câu 2 trước để xem các chuyên môn sâu'
        }
        required
        error={errors.topicIds}
      >
        {selectedSubjectIds.length === 0 ? (
          <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
            Chưa chọn môn học ở {q2Meta.questionId}
          </div>
        ) : isLoadingTopics ? (
          <div className="py-4">
            <LoadingState message="Đang tải danh sách chuyên môn sâu..." />
          </div>
        ) : topics.length === 0 ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
            Chưa có chuyên môn sâu nào được khai báo cho các môn đã chọn
          </div>
        ) : (
          <MultipleChoiceField
            options={topics}
            value={selectedTopicIds}
            onChange={onTopicsChange}
            columns={2}
          />
        )}
      </QuestionCard>
    </div>
  );
}

export default CascadingTaxonomySelector;
