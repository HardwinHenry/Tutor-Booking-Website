const TutorProfile = require('../models/tutorProfile.model');
const {
  COMPLETION_STATUS,
  APPROVAL_STATUS,
  TUTOR_PRICE_RANGES,
} = require('../constants/profileStatus');
const ApiError = require('../utils/apiError');

/**
 * Standard populate path definition for TutorProfile
 */
const TUTOR_POPULATE_FIELDS = [
  { path: 'userId', select: 'name email avatar phone' },
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
 * Get or create TutorProfile for a user
 */
const getProfileByUserId = async (userId, { populate = true } = {}) => {
  let profile = await TutorProfile.findOne({ userId });

  if (!profile) {
    profile = await TutorProfile.create({
      userId,
      completionStatus: COMPLETION_STATUS.NOT_STARTED,
      approvalStatus: APPROVAL_STATUS.PENDING,
    });
  }

  if (populate) {
    profile = await TutorProfile.findById(profile._id).populate(TUTOR_POPULATE_FIELDS);
  }

  return profile;
};

/**
 * Get public profile of a Tutor by User ID or Profile ID
 * Strips private contact and administrative details.
 */
const getPublicProfile = async (identifier, viewerRole = null) => {
  const query = identifier.match(/^[0-9a-fA-F]{24}$/)
    ? { $or: [{ _id: identifier }, { userId: identifier }] }
    : { _id: null };

  const profile = await TutorProfile.findOne(query).populate(TUTOR_POPULATE_FIELDS);

  if (!profile) {
    throw ApiError.notFound('Không tìm thấy thông tin gia sư');
  }

  // Non-admins can only see approved profiles in public context
  if (viewerRole !== 'admin' && profile.approvalStatus !== APPROVAL_STATUS.APPROVED) {
    throw ApiError.notFound('Hồ sơ gia sư hiện chưa được phê duyệt công khai');
  }

  // Sanitize for public response
  const publicData = profile.toJSON();
  if (publicData.userId) {
    delete publicData.userId.phone; // Strip private phone number
  }
  delete publicData.rejectionReason;
  delete publicData.approvedBy;

  return publicData;
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
 * Update / Save draft for TutorProfile
 */
const updateProfile = async (userId, data = {}) => {
  let profile = await TutorProfile.findOne({ userId });

  if (!profile) {
    profile = new TutorProfile({
      userId,
      completionStatus: COMPLETION_STATUS.IN_PROGRESS,
    });
  } else if (profile.completionStatus === COMPLETION_STATUS.NOT_STARTED) {
    profile.completionStatus = COMPLETION_STATUS.IN_PROGRESS;
  }

  if (data.expertise) {
    profile.expertise = mergeSection(profile.expertise || {}, data.expertise);
  }

  if (data.teachingCapabilities) {
    profile.teachingCapabilities = mergeSection(
      profile.teachingCapabilities || {},
      data.teachingCapabilities
    );
  }

  if (data.schedulePreferences) {
    profile.schedulePreferences = mergeSection(
      profile.schedulePreferences || {},
      data.schedulePreferences
    );
  }

  if (data.teachingConditions) {
    if (
      data.teachingConditions.priceRangeId &&
      TUTOR_PRICE_RANGES[data.teachingConditions.priceRangeId]
    ) {
      const preset = TUTOR_PRICE_RANGES[data.teachingConditions.priceRangeId];
      data.teachingConditions.priceMin = preset.min;
      data.teachingConditions.priceMax = preset.max;
      data.teachingConditions.isNegotiable = preset.isNegotiable;
    }
    profile.teachingConditions = mergeSection(
      profile.teachingConditions || {},
      data.teachingConditions
    );
  }

  if (data.experienceRange !== undefined) profile.experienceRange = data.experienceRange;
  if (data.experienceYears !== undefined) profile.experienceYears = data.experienceYears;
  if (data.qualifications !== undefined) profile.qualifications = data.qualifications;
  if (data.supportApproaches !== undefined) profile.supportApproaches = data.supportApproaches;
  if (data.availableSupport !== undefined) profile.availableSupport = data.availableSupport;
  if (data.assessmentMethods !== undefined) profile.assessmentMethods = data.assessmentMethods;
  if (data.introduction !== undefined) profile.introduction = data.introduction;

  await profile.save();

  return TutorProfile.findById(profile._id).populate(TUTOR_POPULATE_FIELDS);
};

/**
 * Submit Tutor Profile for Verification & Approval
 */
const submitProfile = async (userId, data = {}) => {
  let profile = await TutorProfile.findOne({ userId });

  if (!profile) {
    profile = new TutorProfile({ userId });
  }

  if (data.expertise) {
    profile.expertise = mergeSection(profile.expertise || {}, data.expertise);
  }
  if (data.teachingCapabilities) {
    profile.teachingCapabilities = mergeSection(
      profile.teachingCapabilities || {},
      data.teachingCapabilities
    );
  }
  if (data.schedulePreferences) {
    profile.schedulePreferences = mergeSection(
      profile.schedulePreferences || {},
      data.schedulePreferences
    );
  }
  if (data.teachingConditions) {
    if (
      data.teachingConditions.priceRangeId &&
      TUTOR_PRICE_RANGES[data.teachingConditions.priceRangeId]
    ) {
      const preset = TUTOR_PRICE_RANGES[data.teachingConditions.priceRangeId];
      data.teachingConditions.priceMin = preset.min;
      data.teachingConditions.priceMax = preset.max;
      data.teachingConditions.isNegotiable = preset.isNegotiable;
    }
    profile.teachingConditions = mergeSection(
      profile.teachingConditions || {},
      data.teachingConditions
    );
  }

  if (data.experienceRange !== undefined) profile.experienceRange = data.experienceRange;
  if (data.experienceYears !== undefined) profile.experienceYears = data.experienceYears;
  if (data.qualifications !== undefined) profile.qualifications = data.qualifications;
  if (data.supportApproaches !== undefined) profile.supportApproaches = data.supportApproaches;
  if (data.availableSupport !== undefined) profile.availableSupport = data.availableSupport;
  if (data.assessmentMethods !== undefined) profile.assessmentMethods = data.assessmentMethods;
  if (data.introduction !== undefined) profile.introduction = data.introduction;

  profile.completionStatus = COMPLETION_STATUS.COMPLETED;
  profile.approvalStatus = APPROVAL_STATUS.PENDING;
  profile.submittedAt = new Date();
  profile.completedAt = new Date();

  await profile.save();

  return TutorProfile.findById(profile._id).populate(TUTOR_POPULATE_FIELDS);
};

module.exports = {
  TUTOR_POPULATE_FIELDS,
  getProfileByUserId,
  getPublicProfile,
  updateProfile,
  submitProfile,
};
