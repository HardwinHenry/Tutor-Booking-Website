const LearnerPreference = require('../models/learnerPreference.model');
const { COMPLETION_STATUS, LEARNER_BUDGET_RANGES } = require('../constants/profileStatus');

/**
 * Standard populate path definition for LearnerPreference
 */
const POPULATE_FIELDS = [
  { path: 'learning.categoryId', select: 'name slug type' },
  { path: 'learning.subjectIds', select: 'name slug type parentId' },
  { path: 'learning.topicIds', select: 'name slug type parentId' },
  { path: 'learning.purposes', select: 'name slug type' },
  { path: 'learning.currentLevel', select: 'name slug type sortOrder' },
  { path: 'learning.targetLevel', select: 'name slug type sortOrder' },
  { path: 'learningStyle.methods', select: 'name slug type' },
  { path: 'learningStyle.preferredTutorStyles', select: 'name slug type' },
  { path: 'learningStyle.materials', select: 'name slug type' },
  { path: 'learningStyle.interactionLevel', select: 'name slug type' },
  { path: 'schedulePreferences.timeBands', select: 'name slug type' },
  { path: 'constraints.modes', select: 'name slug type' },
  { path: 'constraints.offlineLocations', select: 'name slug type' },
  { path: 'tutorRequirements.selectionPriorities', select: 'name slug type' },
  { path: 'supportNeeds.difficulties', select: 'name slug type' },
  { path: 'supportNeeds.desiredSupport', select: 'name slug type' },
  { path: 'supportNeeds.progressTracking', select: 'name slug type' },
];

/**
 * Get or create LearnerPreference for a user
 */
const getPreferenceByUserId = async (userId, { populate = true } = {}) => {
  let preference = await LearnerPreference.findOne({ userId });

  if (!preference) {
    preference = await LearnerPreference.create({
      userId,
      completionStatus: COMPLETION_STATUS.NOT_STARTED,
    });
  }

  if (populate) {
    preference = await LearnerPreference.findById(preference._id).populate(POPULATE_FIELDS);
  }

  return preference;
};

/**
 * Deep merge utility for profile updates
 */
const mergeSection = (target = {}, source = {}) => {
  if (!source) return target;
  for (const key of Object.keys(source)) {
    if (source[key] !== undefined) {
      target[key] = source[key];
    }
  }
  return target;
};

/**
 * Update / Save draft for LearnerPreference
 */
const updatePreference = async (userId, data = {}) => {
  let preference = await LearnerPreference.findOne({ userId });

  if (!preference) {
    preference = new LearnerPreference({
      userId,
      completionStatus: COMPLETION_STATUS.IN_PROGRESS,
    });
  } else if (preference.completionStatus === COMPLETION_STATUS.NOT_STARTED) {
    preference.completionStatus = COMPLETION_STATUS.IN_PROGRESS;
  }

  // Update sections
  if (data.learning) {
    preference.learning = mergeSection(preference.learning || {}, data.learning);
  }

  if (data.learningStyle) {
    preference.learningStyle = mergeSection(preference.learningStyle || {}, data.learningStyle);
  }

  if (data.schedulePreferences) {
    preference.schedulePreferences = mergeSection(
      preference.schedulePreferences || {},
      data.schedulePreferences
    );
  }

  if (data.constraints) {
    // Normalize budget if range ID provided
    if (data.constraints.budgetRangeId && LEARNER_BUDGET_RANGES[data.constraints.budgetRangeId]) {
      data.constraints.budgetMin = LEARNER_BUDGET_RANGES[data.constraints.budgetRangeId].min;
      data.constraints.budgetMax = LEARNER_BUDGET_RANGES[data.constraints.budgetRangeId].max;
    }
    preference.constraints = mergeSection(preference.constraints || {}, data.constraints);
  }

  if (data.tutorRequirements) {
    preference.tutorRequirements = mergeSection(
      preference.tutorRequirements || {},
      data.tutorRequirements
    );
  }

  if (data.supportNeeds) {
    preference.supportNeeds = mergeSection(preference.supportNeeds || {}, data.supportNeeds);
  }

  if (data.additionalNote !== undefined) {
    preference.additionalNote = data.additionalNote;
  }

  await preference.save();

  return LearnerPreference.findById(preference._id).populate(POPULATE_FIELDS);
};

/**
 * Complete Learner Onboarding
 */
const completePreference = async (userId, data = {}) => {
  let preference = await LearnerPreference.findOne({ userId });

  if (!preference) {
    preference = new LearnerPreference({ userId });
  }

  if (data.learning) {
    preference.learning = mergeSection(preference.learning || {}, data.learning);
  }
  if (data.learningStyle) {
    preference.learningStyle = mergeSection(preference.learningStyle || {}, data.learningStyle);
  }
  if (data.schedulePreferences) {
    preference.schedulePreferences = mergeSection(
      preference.schedulePreferences || {},
      data.schedulePreferences
    );
  }
  if (data.constraints) {
    if (data.constraints.budgetRangeId && LEARNER_BUDGET_RANGES[data.constraints.budgetRangeId]) {
      data.constraints.budgetMin = LEARNER_BUDGET_RANGES[data.constraints.budgetRangeId].min;
      data.constraints.budgetMax = LEARNER_BUDGET_RANGES[data.constraints.budgetRangeId].max;
    }
    preference.constraints = mergeSection(preference.constraints || {}, data.constraints);
  }
  if (data.tutorRequirements) {
    preference.tutorRequirements = mergeSection(
      preference.tutorRequirements || {},
      data.tutorRequirements
    );
  }
  if (data.supportNeeds) {
    preference.supportNeeds = mergeSection(preference.supportNeeds || {}, data.supportNeeds);
  }
  if (data.additionalNote !== undefined) {
    preference.additionalNote = data.additionalNote;
  }

  preference.completionStatus = COMPLETION_STATUS.COMPLETED;
  preference.completedAt = new Date();

  await preference.save();

  return LearnerPreference.findById(preference._id).populate(POPULATE_FIELDS);
};

module.exports = {
  POPULATE_FIELDS,
  getPreferenceByUserId,
  updatePreference,
  completePreference,
};
