/**
 * Helper to extract ObjectId string whether field is populated object or string ID
 */
export const getId = (item) => {
  if (!item) return null;
  if (typeof item === 'object') {
    return item._id || item.id || null;
  }
  return String(item);
};

export const getIds = (list) => {
  if (!Array.isArray(list)) return [];
  return list.map(getId).filter(Boolean);
};

/**
 * Initial empty state for Learner 28 questions
 */
export const getInitialLearnerFormState = () => ({
  // Nhóm 1: Lĩnh vực & Nhu cầu (Q1-Q8)
  learning: {
    categoryId: null,
    subjectIds: [],
    topicIds: [],
    purposes: [],
    currentLevel: null,
    targetLevel: null,
    goalText: '',
    targetDuration: null,
  },
  // Nhóm 2: Phong cách học (Q9-Q14)
  learningStyle: {
    methods: [],
    pace: null,
    classFormat: null,
    preferredTutorStyles: [],
    materials: [],
    interactionLevel: null,
  },
  // Nhóm 3: Thời gian học (Q15-Q18)
  schedulePreferences: {
    timeBands: [],
    weekdays: [],
    sessionsPerWeek: null,
    durationMinutes: [],
  },
  // Nhóm 4: Hình thức, ngân sách & Tiêu chuẩn gia sư (Q19-Q24)
  constraints: {
    modes: [],
    offlineLocations: [],
    budgetRangeId: null,
  },
  tutorRequirements: {
    selectionPriorities: [],
    experienceRange: null,
    certificateRequirement: null,
  },
  // Nhóm 5: Cá nhân hóa & Ghi chú (Q25-Q28)
  supportNeeds: {
    difficulties: [],
    desiredSupport: [],
    progressTracking: null,
  },
  additionalNote: '',
});

/**
 * Map populated backend response into form state
 */
export const mapBackendToLearnerForm = (preference) => {
  if (!preference) return getInitialLearnerFormState();

  return {
    learning: {
      categoryId: getId(preference.learning?.categoryId),
      subjectIds: getIds(preference.learning?.subjectIds),
      topicIds: getIds(preference.learning?.topicIds),
      purposes: getIds(preference.learning?.purposes),
      currentLevel: getId(preference.learning?.currentLevel),
      targetLevel: getId(preference.learning?.targetLevel),
      goalText: preference.learning?.goalText || '',
      targetDuration: preference.learning?.targetDuration || null,
    },
    learningStyle: {
      methods: getIds(preference.learningStyle?.methods),
      pace: preference.learningStyle?.pace || null,
      classFormat: preference.learningStyle?.classFormat || null,
      preferredTutorStyles: getIds(preference.learningStyle?.preferredTutorStyles),
      materials: getIds(preference.learningStyle?.materials),
      interactionLevel: getId(preference.learningStyle?.interactionLevel),
    },
    schedulePreferences: {
      timeBands: getIds(preference.schedulePreferences?.timeBands),
      weekdays: Array.isArray(preference.schedulePreferences?.weekdays)
        ? preference.schedulePreferences.weekdays
        : [],
      sessionsPerWeek: preference.schedulePreferences?.sessionsPerWeek || null,
      durationMinutes: Array.isArray(preference.schedulePreferences?.durationMinutes)
        ? preference.schedulePreferences.durationMinutes
        : [],
    },
    constraints: {
      modes: getIds(preference.constraints?.modes),
      offlineLocations: getIds(preference.constraints?.offlineLocations),
      budgetRangeId: preference.constraints?.budgetRangeId || null,
    },
    tutorRequirements: {
      selectionPriorities: getIds(preference.tutorRequirements?.selectionPriorities),
      experienceRange: preference.tutorRequirements?.experienceRange || null,
      certificateRequirement: preference.tutorRequirements?.certificateRequirement || null,
    },
    supportNeeds: {
      difficulties: getIds(preference.supportNeeds?.difficulties),
      desiredSupport: getIds(preference.supportNeeds?.desiredSupport),
      progressTracking: getId(preference.supportNeeds?.progressTracking),
    },
    additionalNote: preference.additionalNote || '',
  };
};

/**
 * Calculate answered questions count and percentage out of 28
 */
export const calculateLearnerProgress = (form, requiresOffline = false) => {
  let answered = 0;
  const total = 28;

  // Q1
  if (form.learning.categoryId) answered++;
  // Q2
  if (form.learning.subjectIds.length > 0) answered++;
  // Q3
  if (form.learning.topicIds.length > 0) answered++;
  // Q4
  if (form.learning.purposes.length > 0) answered++;
  // Q5
  if (form.learning.currentLevel) answered++;
  // Q6
  if (form.learning.targetLevel) answered++;
  // Q7 (optional text, counted if filled)
  if (form.learning.goalText?.trim()) answered++;
  // Q8
  if (form.learning.targetDuration) answered++;

  // Q9
  if (form.learningStyle.methods.length > 0) answered++;
  // Q10
  if (form.learningStyle.pace) answered++;
  // Q11
  if (form.learningStyle.classFormat) answered++;
  // Q12
  if (form.learningStyle.preferredTutorStyles.length > 0) answered++;
  // Q13
  if (form.learningStyle.materials.length > 0) answered++;
  // Q14
  if (form.learningStyle.interactionLevel) answered++;

  // Q15
  if (form.schedulePreferences.timeBands.length > 0) answered++;
  // Q16
  if (form.schedulePreferences.weekdays.length > 0) answered++;
  // Q17
  if (form.schedulePreferences.sessionsPerWeek) answered++;
  // Q18
  if (form.schedulePreferences.durationMinutes.length > 0) answered++;

  // Q19
  if (form.constraints.modes.length > 0) answered++;
  // Q20 (conditional)
  if (!requiresOffline || form.constraints.offlineLocations.length > 0) answered++;
  // Q21
  if (form.constraints.budgetRangeId) answered++;
  // Q22
  if (form.tutorRequirements.selectionPriorities.length > 0) answered++;
  // Q23
  if (form.tutorRequirements.experienceRange) answered++;
  // Q24
  if (form.tutorRequirements.certificateRequirement) answered++;

  // Q25
  if (form.supportNeeds.difficulties.length > 0) answered++;
  // Q26
  if (form.supportNeeds.desiredSupport.length > 0) answered++;
  // Q27
  if (form.supportNeeds.progressTracking) answered++;
  // Q28 (optional text, counted if filled)
  if (form.additionalNote?.trim()) answered++;

  const percentage = Math.min(100, Math.round((answered / total) * 100));
  return { answered, total, percentage };
};
