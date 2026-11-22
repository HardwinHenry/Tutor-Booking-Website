const TutorProfile = require('../models/tutorProfile.model');
const LearnerPreference = require('../models/learnerPreference.model');
const RecommendationLog = require('../models/recommendationLog.model');
const ApiError = require('../utils/apiError');
const { APPROVAL_STATUS, COMPLETION_STATUS } = require('../constants/profileStatus');
const { USER_STATUS } = require('../constants/userStatus');
const {
  ALGORITHM_VERSION,
  RECOMMENDATION_WEIGHTS,
  NEUTRAL_RATING_SCORE,
} = require('../constants/recommendation.config');

/**
 * Standard populate definition for candidate tutors
 */
const TUTOR_POPULATE_FIELDS = [
  { path: 'userId', select: 'name email avatar phone status role' },
  { path: 'expertise.categoryId', select: 'name slug type' },
  { path: 'expertise.subjectIds', select: 'name slug type parentId' },
  { path: 'expertise.topicIds', select: 'name slug type parentId' },
  { path: 'teachingCapabilities.supportedPurposes', select: 'name slug type' },
  { path: 'teachingCapabilities.teachableLevels', select: 'name slug type sortOrder' },
  { path: 'teachingCapabilities.supportedTargetLevels', select: 'name slug type sortOrder' },
  { path: 'teachingCapabilities.methods', select: 'name slug type' },
  { path: 'teachingCapabilities.styles', select: 'name slug type' },
  { path: 'teachingCapabilities.materials', select: 'name slug type' },
  { path: 'teachingCapabilities.interactionLevel', select: 'name slug type' },
  { path: 'schedulePreferences.timeBands', select: 'name slug type' },
  { path: 'teachingConditions.modes', select: 'name slug type' },
  { path: 'teachingConditions.offlineLocations', select: 'name slug type' },
  { path: 'qualifications.certificateType', select: 'name slug type' },
  { path: 'supportApproaches', select: 'name slug type' },
  { path: 'availableSupport', select: 'name slug type' },
  { path: 'assessmentMethods', select: 'name slug type' },
];

/**
 * Safely extract string ID from ObjectId, populated object, or string
 */
const extractId = (item) => {
  if (!item) return null;
  if (typeof item === 'string') return item;
  if (item._id) return item._id.toString();
  if (item.id) return item.id.toString();
  return item.toString();
};

/**
 * Extract array of string IDs
 */
const extractIds = (items = []) => {
  if (!Array.isArray(items)) return [];
  return items.map(extractId).filter(Boolean);
};

/**
 * Calculate Jaccard similarity or intersection ratio
 */
const calculateOverlapRatio = (sourceArr = [], targetArr = []) => {
  const source = extractIds(sourceArr);
  const target = new Set(extractIds(targetArr));
  if (source.length === 0) return 1.0;
  const matchCount = source.filter((id) => target.has(id)).length;
  return matchCount / source.length;
};

/**
 * 1. S - Subject & Topic Fit Score (30%)
 */
const calculateSubjectScore = (learner, tutor) => {
  const reasons = [];
  const weaknesses = [];

  const learnerCatId = extractId(learner.learning?.categoryId);
  const tutorCatId = extractId(tutor.expertise?.categoryId);
  const learnerSubjectIds = extractIds(learner.learning?.subjectIds);
  const tutorSubjectIds = new Set(extractIds(tutor.expertise?.subjectIds));
  const learnerTopicIds = extractIds(learner.learning?.topicIds);
  const tutorTopicIds = new Set(extractIds(tutor.expertise?.topicIds));

  // Category matching
  let catScore = 100;
  if (learnerCatId) {
    if (tutorCatId === learnerCatId) {
      catScore = 100;
    } else {
      catScore = 40;
    }
  }

  // Subject matching
  let subjectScore = 100;
  let matchingSubjectsCount = 0;
  if (learnerSubjectIds.length > 0) {
    matchingSubjectsCount = learnerSubjectIds.filter((id) => tutorSubjectIds.has(id)).length;
    subjectScore = (matchingSubjectsCount / learnerSubjectIds.length) * 100;
  }

  // Topic matching
  let topicScore = 100;
  let matchingTopicsCount = 0;
  const hasLearnerTopics = learnerTopicIds.length > 0;
  if (hasLearnerTopics) {
    matchingTopicsCount = learnerTopicIds.filter((id) => tutorTopicIds.has(id)).length;
    topicScore = (matchingTopicsCount / learnerTopicIds.length) * 100;
  }

  let finalScore;
  if (hasLearnerTopics) {
    finalScore = 0.25 * catScore + 0.45 * subjectScore + 0.3 * topicScore;
  } else {
    finalScore = 0.35 * catScore + 0.65 * subjectScore;
  }

  if (matchingSubjectsCount > 0) {
    reasons.push('Có dạy đúng môn học bạn đang tìm kiếm');
  }
  if (matchingTopicsCount > 0) {
    reasons.push('Chuyên môn sâu phù hợp với chủ đề chi tiết bạn muốn học');
  } else if (hasLearnerTopics && matchingTopicsCount === 0) {
    weaknesses.push('Chưa khớp hoàn toàn với một số chủ đề chuyên sâu bạn chọn');
  }

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    reasons,
    weaknesses,
  };
};

/**
 * 2. L - Level & Goal Fit Score (20%)
 */
const calculateLevelGoalScore = (learner, tutor) => {
  const reasons = [];
  const weaknesses = [];

  const learnerCurLevel = extractId(learner.learning?.currentLevel);
  const tutorTeachableLevels = new Set(extractIds(tutor.teachingCapabilities?.teachableLevels));

  const learnerTgtLevel = extractId(learner.learning?.targetLevel);
  const tutorSupportedTargetLevels = new Set(
    extractIds(tutor.teachingCapabilities?.supportedTargetLevels)
  );

  let currentLevelScore = 100;
  if (learnerCurLevel) {
    currentLevelScore = tutorTeachableLevels.has(learnerCurLevel) ? 100 : 0;
  }

  let targetLevelScore = 100;
  if (learnerTgtLevel) {
    targetLevelScore = tutorSupportedTargetLevels.has(learnerTgtLevel) ? 100 : 40;
  }

  // Purposes overlap
  const purposeRatio = calculateOverlapRatio(
    learner.learning?.purposes,
    tutor.teachingCapabilities?.supportedPurposes
  );
  const purposeScore = purposeRatio * 100;

  // Goal tags overlap
  let goalTagScore = 100;
  const learnerGoalTags = learner.learning?.goalTags || [];
  const tutorGoalTags = new Set(tutor.teachingCapabilities?.supportedGoalTags || []);
  if (learnerGoalTags.length > 0) {
    const matchedTags = learnerGoalTags.filter((t) => tutorGoalTags.has(t)).length;
    goalTagScore = (matchedTags / learnerGoalTags.length) * 100;
  }

  // Target duration
  let durationScore = 100;
  if (learner.learning?.targetDuration) {
    const tutorDurations = tutor.teachingCapabilities?.estimatedDurationRanges || [];
    if (
      tutorDurations.includes(learner.learning.targetDuration) ||
      tutorDurations.includes('flexible')
    ) {
      durationScore = 100;
    } else {
      durationScore = 50;
    }
  }

  const finalScore =
    0.3 * currentLevelScore +
    0.3 * targetLevelScore +
    0.2 * purposeScore +
    0.1 * goalTagScore +
    0.1 * durationScore;

  if (currentLevelScore === 100 && targetLevelScore >= 80) {
    reasons.push('Có thể tiếp nhận trình độ hiện tại và hỗ trợ mục tiêu đầu ra');
  }
  if (purposeScore >= 50) {
    reasons.push('Hỗ trợ mục đích học tập phù hợp với định hướng của bạn');
  }

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    reasons,
    weaknesses,
  };
};

/**
 * 3. B - Budget & Fee Fit Score (15%)
 */
const calculateBudgetScore = (learner, tutor) => {
  const reasons = [];
  const weaknesses = [];

  const budgetMax = learner.constraints?.budgetMax || 0;
  const priceMin = tutor.teachingConditions?.priceMin || 0;
  const isNegotiable = Boolean(tutor.teachingConditions?.isNegotiable);

  if (budgetMax <= 0) {
    return {
      score: 100,
      reasons: ['Học phí phù hợp (không giới hạn ngân sách)'],
      weaknesses,
    };
  }

  let score = 100;
  if (isNegotiable) {
    if (priceMin <= budgetMax) {
      score = 100;
      reasons.push('Học phí nằm trong ngân sách và có thể thương lượng linh hoạt');
    } else {
      score = 85;
      reasons.push('Học phí có thể thương lượng để phù hợp với ngân sách của bạn');
    }
  } else if (priceMin <= budgetMax) {
    score = 100;
    reasons.push('Học phí nằm hoàn toàn trong ngân sách dự kiến của bạn');
  } else {
    // Price exceeds budget
    const diff = priceMin - budgetMax;
    const excessRatio = diff / budgetMax;

    if (excessRatio <= 0.15) {
      score = 75;
      weaknesses.push('Học phí cao hơn ngân sách dự kiến một chút (<= 15%)');
    } else if (excessRatio <= 0.35) {
      score = 50;
      weaknesses.push('Học phí vượt khoảng 15-35% so với mức dự kiến');
    } else if (excessRatio <= 0.6) {
      score = 25;
      weaknesses.push('Học phí vượt khá nhiều so với ngân sách dự kiến');
    } else {
      score = 10;
      weaknesses.push('Học phí cao hơn đáng kể so với ngân sách của bạn');
    }
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    reasons,
    weaknesses,
  };
};

/**
 * 4. M - Mode & Location Fit Score (10%)
 */
const calculateModeLocationScore = (learner, tutor) => {
  const reasons = [];
  const weaknesses = [];

  const learnerModes = extractIds(learner.constraints?.modes);
  const tutorModes = new Set(extractIds(tutor.teachingConditions?.modes));
  const commonModes = learnerModes.filter((m) => tutorModes.has(m));

  if (commonModes.length === 0) {
    return { score: 0, reasons, weaknesses: ['Hình thức học không tương thích'] };
  }

  let score = 85;

  // Check populated modes or slugs if available
  const isOnlineCommon = (learner.constraints?.modes || []).some((m) => {
    const slug = m.slug || '';
    return slug.includes('online') && tutorModes.has(extractId(m));
  });

  const isOfflineCommon = (learner.constraints?.modes || []).some((m) => {
    const slug = m.slug || '';
    return slug.includes('offline') && tutorModes.has(extractId(m));
  });

  if (isOnlineCommon) {
    score = 95;
    reasons.push('Hỗ trợ hình thức học Online linh hoạt');
  }

  if (isOfflineCommon) {
    const locOverlap = calculateOverlapRatio(
      learner.constraints?.offlineLocations,
      tutor.teachingConditions?.offlineLocations
    );

    let areaMatched = false;
    if (learner.constraints?.area && tutor.teachingConditions?.serviceAreas?.length > 0) {
      const learnerArea = learner.constraints.area.toLowerCase();
      areaMatched = tutor.teachingConditions.serviceAreas.some((sa) =>
        sa.toLowerCase().includes(learnerArea)
      );
    }

    if (areaMatched || locOverlap >= 0.5) {
      score = 100;
      reasons.push('Hỗ trợ hình thức học trực tiếp tại khu vực phù hợp');
    } else if (learner.constraints?.area && !areaMatched) {
      weaknesses.push('Khu vực học trực tiếp có thể cách xa địa điểm mong muốn');
      score = Math.min(score, 75);
    }
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    reasons,
    weaknesses,
  };
};

/**
 * 5. T - Teaching Fit Score (10%)
 */
const calculateTeachingFitScore = (learner, tutor) => {
  const reasons = [];
  const weaknesses = [];

  // Methods
  const methodRatio = calculateOverlapRatio(
    learner.learningStyle?.methods,
    tutor.teachingCapabilities?.methods
  );

  // Pace
  let paceScore = 100;
  if (learner.learningStyle?.pace) {
    const tutorPace = tutor.teachingCapabilities?.pace;
    if (tutorPace === 'flexible' || tutorPace === learner.learningStyle.pace) {
      paceScore = 100;
    } else {
      paceScore = 50;
    }
  }

  // Class format
  let formatScore = 100;
  if (learner.learningStyle?.classFormat) {
    const formats = tutor.teachingCapabilities?.classFormats || [];
    if (
      formats.includes('all') ||
      formats.includes('any') ||
      formats.includes(learner.learningStyle.classFormat)
    ) {
      formatScore = 100;
    } else {
      formatScore = 50;
    }
  }

  // Styles
  const styleRatio = calculateOverlapRatio(
    learner.learningStyle?.preferredTutorStyles,
    tutor.teachingCapabilities?.styles
  );

  // Materials
  const materialRatio = calculateOverlapRatio(
    learner.learningStyle?.materials,
    tutor.teachingCapabilities?.materials
  );

  // Interaction Level
  let interactionScore = 100;
  const learnerInteract = extractId(learner.learningStyle?.interactionLevel);
  const tutorInteract = extractId(tutor.teachingCapabilities?.interactionLevel);
  if (learnerInteract && tutorInteract && learnerInteract !== tutorInteract) {
    interactionScore = 60;
  }

  // Support needs
  const supportRatio = calculateOverlapRatio(
    learner.supportNeeds?.desiredSupport,
    tutor.availableSupport
  );

  const finalScore =
    0.25 * (methodRatio * 100) +
    0.15 * paceScore +
    0.15 * formatScore +
    0.2 * (styleRatio * 100) +
    0.1 * (materialRatio * 100) +
    0.05 * interactionScore +
    0.1 * (supportRatio * 100);

  if (methodRatio >= 0.5 || styleRatio >= 0.5) {
    reasons.push('Phương pháp giảng dạy và phong cách tương tác rất phù hợp');
  }

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    reasons,
    weaknesses,
  };
};

/**
 * 6. A - Schedule Availability Score (5%)
 */
const calculateAvailabilityScore = (learner, tutor) => {
  const reasons = [];
  const weaknesses = [];

  // Timebands
  const timeBandRatio = calculateOverlapRatio(
    learner.schedulePreferences?.timeBands,
    tutor.schedulePreferences?.timeBands
  );

  // Weekdays
  const learnerDays = learner.schedulePreferences?.weekdays || [];
  const tutorDays = new Set(tutor.schedulePreferences?.weekdays || []);
  let weekdayRatio = 1.0;
  if (learnerDays.length > 0) {
    const matchDays = learnerDays.filter((d) => tutorDays.has(d)).length;
    weekdayRatio = matchDays / learnerDays.length;
  }

  // Duration
  let durationScore = 100;
  const learnerDurations = (learner.schedulePreferences?.durationMinutes || []).map(String);
  const tutorDurations = (tutor.schedulePreferences?.sessionDurationsMinutes || []).map(String);
  if (learnerDurations.length > 0 && tutorDurations.length > 0) {
    if (tutorDurations.includes('flexible')) {
      durationScore = 100;
    } else {
      const matchDur = learnerDurations.some((d) => tutorDurations.includes(d));
      durationScore = matchDur ? 100 : 60;
    }
  }

  const finalScore = 0.4 * (timeBandRatio * 100) + 0.4 * (weekdayRatio * 100) + 0.2 * durationScore;

  if (timeBandRatio >= 0.5 && weekdayRatio >= 0.5) {
    reasons.push('Khung giờ và các ngày rảnh trong tuần có độ tương thích cao');
  }

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    reasons,
    weaknesses,
  };
};

/**
 * 7. E - Experience & Qualification Score (5%)
 */
const calculateExperienceQualificationScore = (learner, tutor) => {
  const reasons = [];
  const weaknesses = [];

  const years = tutor.experienceYears || 0;
  const requestedRange = learner.tutorRequirements?.experienceRange;

  let expScore = 100;
  if (requestedRange === '3_5_years') {
    expScore = years >= 3 ? 100 : years >= 1 ? 75 : 50;
  } else if (requestedRange === 'over_5_years') {
    expScore = years >= 5 ? 100 : years >= 3 ? 80 : 50;
  } else if (requestedRange === '1_2_years') {
    expScore = years >= 1 ? 100 : 70;
  }

  const qualifications = tutor.qualifications || [];
  const verifiedCount = qualifications.filter((q) => q.verified).length;
  let qualScore = 50;
  if (verifiedCount > 0) {
    qualScore = 100;
  } else if (qualifications.length > 0) {
    qualScore = 75;
  }

  const finalScore = 0.6 * expScore + 0.4 * qualScore;

  if (years >= 3) {
    reasons.push(`Gia sư có ${years} năm kinh nghiệm thực tế`);
  }
  if (verifiedCount > 0) {
    reasons.push('Có chứng chỉ giảng dạy đã được hệ thống xác minh');
  } else if (learner.tutorRequirements?.certificateRequirement === 'preferred') {
    weaknesses.push('Chưa có chứng chỉ đã xác minh trên hệ thống');
  }

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    reasons,
    weaknesses,
  };
};

/**
 * 8. R - Rating Score (5%)
 */
const calculateRatingScore = (learner, tutor) => {
  const reasons = [];
  const weaknesses = [];

  const summary = tutor.ratingSummary || {};
  const reviewCount = summary.reviewCount || 0;
  const averageRating = summary.averageRating;

  if (reviewCount > 0 && averageRating != null) {
    const normalized = Math.min(100, Math.max(0, (averageRating / 5) * 100));
    if (averageRating >= 4.0) {
      reasons.push(`Được đánh giá cao bởi học viên (${averageRating.toFixed(1)}/5 sao)`);
    }
    return {
      score: normalized,
      reasons,
      weaknesses,
    };
  }

  // Neutral score for unrated tutors
  return {
    score: NEUTRAL_RATING_SCORE,
    reasons,
    weaknesses,
  };
};

/**
 * Check eligibility filter (Tầng A)
 */
const isEligibleCandidate = (learner, tutor, options = {}) => {
  // 1. Account status
  if (!tutor.userId || tutor.userId.status !== USER_STATUS.ACTIVE) {
    return false;
  }
  if (tutor.approvalStatus !== APPROVAL_STATUS.APPROVED) {
    return false;
  }
  if (tutor.completionStatus !== COMPLETION_STATUS.COMPLETED) {
    return false;
  }

  // 2. Category / Subject match
  const learnerCatId = extractId(learner.learning?.categoryId);
  const tutorCatId = extractId(tutor.expertise?.categoryId);
  const learnerSubjectIds = extractIds(learner.learning?.subjectIds);
  const tutorSubjectIds = new Set(extractIds(tutor.expertise?.subjectIds));

  // Optional query override filter
  if (options.categoryId && tutorCatId !== options.categoryId) {
    return false;
  }
  if (options.subjectId && !tutorSubjectIds.has(options.subjectId)) {
    return false;
  }

  // Learner profile constraints
  if (learnerSubjectIds.length > 0) {
    const hasSubjectOverlap = learnerSubjectIds.some((sId) => tutorSubjectIds.has(sId));
    const sameCategory = learnerCatId && tutorCatId === learnerCatId;
    if (!hasSubjectOverlap && !sameCategory) {
      return false;
    }
  } else if (learnerCatId && tutorCatId !== learnerCatId) {
    return false;
  }

  // 3. Current Level compatibility
  const learnerCurLevel = extractId(learner.learning?.currentLevel);
  if (learnerCurLevel) {
    const tutorLevels = new Set(extractIds(tutor.teachingCapabilities?.teachableLevels));
    if (tutorLevels.size > 0 && !tutorLevels.has(learnerCurLevel)) {
      return false;
    }
  }

  // 4. Required Certificate filter
  const isCertRequired = learner.tutorRequirements?.certificateRequirement === 'required';
  if (isCertRequired) {
    const hasVerified = (tutor.qualifications || []).some((q) => q.verified);
    if (!hasVerified) {
      return false;
    }
  }

  // 5. Mode compatibility
  const learnerModes = extractIds(learner.constraints?.modes);
  const tutorModes = new Set(extractIds(tutor.teachingConditions?.modes));
  if (learnerModes.length > 0) {
    const hasCommonMode = learnerModes.some((m) => tutorModes.has(m));
    if (!hasCommonMode) {
      return false;
    }
  }

  // 6. Strict budget filter (if requested)
  const budgetMax = learner.constraints?.budgetMax || 0;
  if ((options.strictBudget || learner.constraints?.strictBudget) && budgetMax > 0) {
    const tutorPriceMin = tutor.teachingConditions?.priceMin || 0;
    if (tutorPriceMin > budgetMax && !tutor.teachingConditions?.isNegotiable) {
      return false;
    }
  }

  return true;
};

/**
 * Sanitize tutor for public recommendation response
 */
const sanitizeTutorData = (tutor) => {
  const obj = tutor.toJSON ? tutor.toJSON() : JSON.parse(JSON.stringify(tutor));
  if (obj.userId) {
    delete obj.userId.phone;
  }
  delete obj.rejectionReason;
  delete obj.approvedBy;
  return obj;
};

/**
 * Main Recommendation Engine Service: Content-based Filtering (CBF)
 */
const getRecommendationsForLearner = async (userId, options = {}) => {
  // 1. Fetch authenticated learner preference
  const learner = await LearnerPreference.findOne({ userId });

  if (!learner || learner.completionStatus !== COMPLETION_STATUS.COMPLETED) {
    throw ApiError.badRequest(
      'Học viên cần hoàn thành khảo sát nhu cầu học tập trước khi nhận gợi ý gia sư'
    );
  }

  // Verify minimal required fields for matching
  if (
    !learner.learning?.categoryId &&
    (!learner.learning?.subjectIds || learner.learning.subjectIds.length === 0)
  ) {
    throw ApiError.badRequest('Hồ sơ học viên thiếu thông tin lĩnh vực hoặc môn học cần tìm kiếm');
  }

  // 2. Fetch approved completed candidate tutors
  const candidateTutors = await TutorProfile.find({
    approvalStatus: APPROVAL_STATUS.APPROVED,
    completionStatus: COMPLETION_STATUS.COMPLETED,
  }).populate(TUTOR_POPULATE_FIELDS);

  // 3. Tầng A: Filter eligible candidates
  const eligibleTutors = candidateTutors.filter((tutor) =>
    isEligibleCandidate(learner, tutor, options)
  );

  // 4. Tầng B: Calculate Component Scores and MatchScores
  const scoredCandidates = [];

  for (const tutor of eligibleTutors) {
    const subjectRes = calculateSubjectScore(learner, tutor);
    const levelGoalRes = calculateLevelGoalScore(learner, tutor);
    const budgetRes = calculateBudgetScore(learner, tutor);
    const modeLocRes = calculateModeLocationScore(learner, tutor);
    const teachingFitRes = calculateTeachingFitScore(learner, tutor);
    const availabilityRes = calculateAvailabilityScore(learner, tutor);
    const expQualRes = calculateExperienceQualificationScore(learner, tutor);
    const ratingRes = calculateRatingScore(learner, tutor);

    // Weighted Formula
    const matchScoreRaw =
      RECOMMENDATION_WEIGHTS.SUBJECT * subjectRes.score +
      RECOMMENDATION_WEIGHTS.LEVEL_GOAL * levelGoalRes.score +
      RECOMMENDATION_WEIGHTS.BUDGET * budgetRes.score +
      RECOMMENDATION_WEIGHTS.MODE_LOCATION * modeLocRes.score +
      RECOMMENDATION_WEIGHTS.TEACHING_FIT * teachingFitRes.score +
      RECOMMENDATION_WEIGHTS.AVAILABILITY * availabilityRes.score +
      RECOMMENDATION_WEIGHTS.EXPERIENCE_QUALIFICATION * expQualRes.score +
      RECOMMENDATION_WEIGHTS.RATING * ratingRes.score;

    const matchScore = Math.round(matchScoreRaw * 10) / 10;

    // Filter by minScore if specified
    const minScore = options.minScore !== undefined ? Number(options.minScore) : 0;
    if (matchScore < minScore) {
      continue;
    }

    // Deduplicate and aggregate reasons & weaknesses
    const matchedReasons = Array.from(
      new Set([
        ...subjectRes.reasons,
        ...levelGoalRes.reasons,
        ...budgetRes.reasons,
        ...modeLocRes.reasons,
        ...teachingFitRes.reasons,
        ...availabilityRes.reasons,
        ...expQualRes.reasons,
        ...ratingRes.reasons,
      ])
    );

    const missingOrWeakMatches = Array.from(
      new Set([
        ...subjectRes.weaknesses,
        ...levelGoalRes.weaknesses,
        ...budgetRes.weaknesses,
        ...modeLocRes.weaknesses,
        ...teachingFitRes.weaknesses,
        ...availabilityRes.weaknesses,
        ...expQualRes.weaknesses,
        ...ratingRes.weaknesses,
      ])
    );

    scoredCandidates.push({
      tutorId: tutor.userId?._id ? tutor.userId._id.toString() : tutor.userId?.toString(),
      profileId: tutor._id.toString(),
      matchScore,
      scoreBreakdown: {
        subject: Math.round(subjectRes.score * 10) / 10,
        levelGoal: Math.round(levelGoalRes.score * 10) / 10,
        budget: Math.round(budgetRes.score * 10) / 10,
        modeLocation: Math.round(modeLocRes.score * 10) / 10,
        teachingFit: Math.round(teachingFitRes.score * 10) / 10,
        availability: Math.round(availabilityRes.score * 10) / 10,
        experienceQualification: Math.round(expQualRes.score * 10) / 10,
        rating: Math.round(ratingRes.score * 10) / 10,
      },
      matchedReasons,
      missingOrWeakMatches,
      tutor: sanitizeTutorData(tutor),
    });
  }

  // 5. Tie-breaker with Learner Priorities (Q22: selectionPriorities)
  const learnerPriorities = extractIds(learner.tutorRequirements?.selectionPriorities);

  scoredCandidates.sort((a, b) => {
    const diff = b.matchScore - a.matchScore;
    if (Math.abs(diff) >= 0.5) {
      return diff;
    }

    // Tie-breaker: inspect learner priorities
    for (const priority of learnerPriorities) {
      const pStr = priority.toLowerCase();
      if (pStr.includes('expertise') || pStr.includes('subject')) {
        const subDiff = b.scoreBreakdown.subject - a.scoreBreakdown.subject;
        if (Math.abs(subDiff) >= 1) return subDiff;
      }
      if (pStr.includes('budget') || pStr.includes('price')) {
        const budDiff = b.scoreBreakdown.budget - a.scoreBreakdown.budget;
        if (Math.abs(budDiff) >= 1) return budDiff;
      }
      if (pStr.includes('experience')) {
        const expDiff =
          b.scoreBreakdown.experienceQualification - a.scoreBreakdown.experienceQualification;
        if (Math.abs(expDiff) >= 1) return expDiff;
      }
      if (pStr.includes('style') || pStr.includes('method')) {
        const teachDiff = b.scoreBreakdown.teachingFit - a.scoreBreakdown.teachingFit;
        if (Math.abs(teachDiff) >= 1) return teachDiff;
      }
      if (pStr.includes('rating')) {
        const ratDiff = b.scoreBreakdown.rating - a.scoreBreakdown.rating;
        if (Math.abs(ratDiff) >= 1) return ratDiff;
      }
    }

    // Default tie-breaker: rating then experience
    const avgA = a.tutor.ratingSummary?.averageRating || 0;
    const avgB = b.tutor.ratingSummary?.averageRating || 0;
    if (avgB !== avgA) return avgB - avgA;

    return (b.tutor.experienceYears || 0) - (a.tutor.experienceYears || 0);
  });

  // 6. Pagination
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(options.limit, 10) || 10));
  const total = scoredCandidates.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const offset = (page - 1) * limit;
  const paginatedItems = scoredCandidates.slice(offset, offset + limit);

  // 7. Optional telemetry logging
  try {
    await RecommendationLog.create({
      learnerId: userId,
      algorithmVersion: ALGORITHM_VERSION,
      filtersApplied: options,
      totalCandidatesEvaluated: eligibleTutors.length,
      topRecommendations: paginatedItems.map((item, index) => ({
        tutorId: item.tutorId,
        tutorProfileId: item.profileId,
        matchScore: item.matchScore,
        rank: offset + index + 1,
      })),
    });
  } catch {
    // Non-blocking telemetry
  }

  return {
    algorithmVersion: ALGORITHM_VERSION,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
    items: paginatedItems,
  };
};

module.exports = {
  ALGORITHM_VERSION,
  getRecommendationsForLearner,
  calculateSubjectScore,
  calculateLevelGoalScore,
  calculateBudgetScore,
  calculateModeLocationScore,
  calculateTeachingFitScore,
  calculateAvailabilityScore,
  calculateExperienceQualificationScore,
  calculateRatingScore,
  isEligibleCandidate,
};
