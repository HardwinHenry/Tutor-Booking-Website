import { getId, getIds } from './learnerFormMapper';

/**
 * Initial state for Tutor 28 questions
 */
export const getInitialTutorFormState = () => ({
  // Nhóm 1: Lĩnh vực & Năng lực (Q1-Q8)
  expertise: {
    categoryId: null,
    subjectIds: [],
    topicIds: [],
  },
  teachingCapabilities: {
    supportedPurposes: [],
    teachableLevels: [],
    supportedTargetLevels: [],
    supportedGoalTags: [],
    estimatedDurationRanges: [],
    methods: [],
    pace: null,
    classFormats: [],
    styles: [],
    materials: [],
    interactionLevel: null,
  },
  // Nhóm 3: Thời gian giảng dạy (Q15-Q18)
  schedulePreferences: {
    timeBands: [],
    weekdays: [],
    sessionsPerWeekRange: null,
    durationMinutes: [],
  },
  // Nhóm 4: Hình thức & Học phí (Q19-Q22)
  teachingConditions: {
    modes: [],
    offlineLocations: [],
    offlineArea: {
      city: '',
      district: '',
      radiusKm: null,
    },
    priceRangeId: null,
  },
  // Nhóm 5: Kinh nghiệm & Bằng cấp (Q23-Q24)
  experienceRange: null,
  experienceYears: null,
  qualifications: [],
  // Nhóm 6: Khả năng hỗ trợ & Giới thiệu (Q25-Q28)
  supportApproaches: [],
  availableSupport: [],
  assessmentMethods: [],
  introduction: '',
});

/**
 * Map populated backend TutorProfile into form state
 */
export const mapBackendToTutorForm = (profile) => {
  if (!profile) return getInitialTutorFormState();

  return {
    expertise: {
      categoryId: getId(profile.expertise?.categoryId),
      subjectIds: getIds(profile.expertise?.subjectIds),
      topicIds: getIds(profile.expertise?.topicIds),
    },
    teachingCapabilities: {
      supportedPurposes: getIds(profile.teachingCapabilities?.supportedPurposes),
      teachableLevels: getIds(profile.teachingCapabilities?.teachableLevels),
      supportedTargetLevels: getIds(profile.teachingCapabilities?.supportedTargetLevels),
      supportedGoalTags: Array.isArray(profile.teachingCapabilities?.supportedGoalTags)
        ? profile.teachingCapabilities.supportedGoalTags
        : [],
      estimatedDurationRanges: Array.isArray(profile.teachingCapabilities?.estimatedDurationRanges)
        ? profile.teachingCapabilities.estimatedDurationRanges
        : [],
      methods: getIds(profile.teachingCapabilities?.methods),
      pace: profile.teachingCapabilities?.pace || null,
      classFormats: Array.isArray(profile.teachingCapabilities?.classFormats)
        ? profile.teachingCapabilities.classFormats
        : [],
      styles: getIds(profile.teachingCapabilities?.styles),
      materials: getIds(profile.teachingCapabilities?.materials),
      interactionLevel: getId(profile.teachingCapabilities?.interactionLevel),
    },
    schedulePreferences: {
      timeBands: getIds(profile.schedulePreferences?.timeBands),
      weekdays: Array.isArray(profile.schedulePreferences?.weekdays)
        ? profile.schedulePreferences.weekdays
        : [],
      sessionsPerWeekRange: profile.schedulePreferences?.sessionsPerWeekRange || null,
      durationMinutes: Array.isArray(profile.schedulePreferences?.durationMinutes)
        ? profile.schedulePreferences.durationMinutes
        : [],
    },
    teachingConditions: {
      modes: getIds(profile.teachingConditions?.modes),
      offlineLocations: getIds(profile.teachingConditions?.offlineLocations),
      offlineArea: {
        city: profile.teachingConditions?.offlineArea?.city || '',
        district: profile.teachingConditions?.offlineArea?.district || '',
        radiusKm: profile.teachingConditions?.offlineArea?.radiusKm || null,
      },
      priceRangeId: profile.teachingConditions?.priceRangeId || null,
    },
    experienceRange: profile.experienceRange || null,
    experienceYears: profile.experienceYears ?? null,
    qualifications: Array.isArray(profile.qualifications)
      ? profile.qualifications.map((q) => ({
          ...q,
          certificateType: getId(q.certificateType),
        }))
      : [],
    supportApproaches: getIds(profile.supportApproaches),
    availableSupport: getIds(profile.availableSupport),
    assessmentMethods: getIds(profile.assessmentMethods),
    introduction: profile.introduction || '',
  };
};

/**
 * Calculate answered questions count and percentage out of 28 for Tutor
 */
export const calculateTutorProgress = (form, requiresOffline = false) => {
  let answered = 0;
  const total = 28;

  // Q1
  if (form.expertise.categoryId) answered++;
  // Q2
  if (form.expertise.subjectIds.length > 0) answered++;
  // Q3
  if (form.expertise.topicIds.length > 0) answered++;
  // Q4
  if (form.teachingCapabilities.supportedPurposes.length > 0) answered++;
  // Q5
  if (form.teachingCapabilities.teachableLevels.length > 0) answered++;
  // Q6
  if (form.teachingCapabilities.supportedTargetLevels.length > 0) answered++;
  // Q7
  if (form.teachingCapabilities.supportedGoalTags.length > 0) answered++;
  // Q8
  if (form.teachingCapabilities.estimatedDurationRanges.length > 0) answered++;

  // Q9
  if (form.teachingCapabilities.methods.length > 0) answered++;
  // Q10
  if (form.teachingCapabilities.pace) answered++;
  // Q11
  if (form.teachingCapabilities.classFormats.length > 0) answered++;
  // Q12
  if (form.teachingCapabilities.styles.length > 0) answered++;
  // Q13
  if (form.teachingCapabilities.materials.length > 0) answered++;
  // Q14
  if (form.teachingCapabilities.interactionLevel) answered++;

  // Q15
  if (form.schedulePreferences.timeBands.length > 0) answered++;
  // Q16
  if (form.schedulePreferences.weekdays.length > 0) answered++;
  // Q17
  if (form.schedulePreferences.sessionsPerWeekRange) answered++;
  // Q18
  if (form.schedulePreferences.durationMinutes.length > 0) answered++;

  // Q19
  if (form.teachingConditions.modes.length > 0) answered++;
  // Q20 (conditional)
  if (!requiresOffline || form.teachingConditions.offlineLocations.length > 0) answered++;
  // Q21 (conditional / optional area)
  if (!requiresOffline || form.teachingConditions.offlineArea.city) answered++;
  // Q22
  if (form.teachingConditions.priceRangeId) answered++;

  // Q23
  if (form.experienceRange) answered++;
  // Q24 (qualifications, optional, counts if added or non-empty)
  if (form.qualifications.length > 0) answered++;

  // Q25
  if (form.supportApproaches.length > 0) answered++;
  // Q26
  if (form.availableSupport.length > 0) answered++;
  // Q27
  if (form.assessmentMethods.length > 0) answered++;
  // Q28 (introduction, optional, counts if filled)
  if (form.introduction?.trim()) answered++;

  const percentage = Math.min(100, Math.round((answered / total) * 100));
  return { answered, total, percentage };
};
