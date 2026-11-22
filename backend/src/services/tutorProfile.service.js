const TutorProfile = require('../models/tutorProfile.model');
const User = require('../models/user.model');
const Taxonomy = require('../models/taxonomy.model');
const { ROLES } = require('../constants/roles');
const { USER_STATUS } = require('../constants/userStatus');
const {
  COMPLETION_STATUS,
  APPROVAL_STATUS,
  TUTOR_PRICE_RANGES,
} = require('../constants/profileStatus');
const ApiError = require('../utils/apiError');

/**
 * Standard populate path definition for TutorProfile (Public / General)
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
 * Admin populate path definition with full details
 */
const ADMIN_TUTOR_POPULATE_FIELDS = [
  { path: 'userId', select: 'name email avatar phone status role createdAt' },
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
  { path: 'approvedBy', select: 'name email role' },
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

  // Non-admins can only see approved profiles of active users in public context
  if (viewerRole !== ROLES.ADMIN) {
    if (
      profile.approvalStatus !== APPROVAL_STATUS.APPROVED ||
      profile.completionStatus !== COMPLETION_STATUS.COMPLETED ||
      !profile.userId ||
      profile.userId.status !== USER_STATUS.ACTIVE
    ) {
      throw ApiError.notFound(
        'Hồ sơ gia sư hiện chưa được phê duyệt công khai hoặc không khả dụng'
      );
    }

    // Sanitize for public response
    const publicData = profile.toJSON();
    if (publicData.userId) {
      delete publicData.userId.phone; // Strip private phone number
    }
    delete publicData.rejectionReason;
    delete publicData.approvedBy;

    return publicData;
  }

  // Admins see full details including phone and administrative data
  return profile;
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

/**
 * Search Tutors with filtering, sorting, and pagination (Phase 5)
 */
const searchTutors = async (queryParams = {}, viewerRole = null) => {
  const {
    category,
    subject,
    topic,
    mode,
    level,
    targetLevel,
    priceMin,
    priceMax,
    priceRangeId,
    area,
    experienceYearsMin,
    ratingMin,
    q,
    search,
    sort = 'rating:desc',
    page = 1,
    limit = 10,
    approvalStatus,
  } = queryParams;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const isAdmin = viewerRole === ROLES.ADMIN;
  const query = {};
  const andConditions = [];

  if (!isAdmin) {
    // Hard filtering for public users: active tutor account, approved profile, completed questionnaire
    const activeTutors = await User.find({
      role: ROLES.TUTOR,
      status: USER_STATUS.ACTIVE,
    }).distinct('_id');

    if (activeTutors.length === 0) {
      return {
        items: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    query.userId = { $in: activeTutors };
    query.approvalStatus = APPROVAL_STATUS.APPROVED;
    query.completionStatus = COMPLETION_STATUS.COMPLETED;
  } else {
    // Admin caller can optionally filter by approval status
    if (approvalStatus && approvalStatus !== 'all') {
      query.approvalStatus = approvalStatus;
    }
  }

  // 1. Category (Q1)
  if (category) {
    query['expertise.categoryId'] = category;
  }

  // 2. Subject (Q2)
  if (subject) {
    const subjectList = Array.isArray(subject)
      ? subject
      : typeof subject === 'string' && subject.includes(',')
        ? subject.split(',').map((s) => s.trim())
        : [subject];
    query['expertise.subjectIds'] = { $in: subjectList };
  }

  // 3. Topic (Q3)
  if (topic) {
    const topicList = Array.isArray(topic)
      ? topic
      : typeof topic === 'string' && topic.includes(',')
        ? topic.split(',').map((t) => t.trim())
        : [topic];
    query['expertise.topicIds'] = { $in: topicList };
  }

  // 4. Learning Mode (Q19)
  if (mode) {
    const modeList = Array.isArray(mode)
      ? mode
      : typeof mode === 'string' && mode.includes(',')
        ? mode.split(',').map((m) => m.trim())
        : [mode];
    query['teachingConditions.modes'] = { $in: modeList };
  }

  // 5. Teachable Level (Q5)
  if (level) {
    const levelList = Array.isArray(level)
      ? level
      : typeof level === 'string' && level.includes(',')
        ? level.split(',').map((l) => l.trim())
        : [level];
    query['teachingCapabilities.teachableLevels'] = { $in: levelList };
  }

  // 6. Supported Target Level (Q6)
  if (targetLevel) {
    const targetLevelList = Array.isArray(targetLevel)
      ? targetLevel
      : typeof targetLevel === 'string' && targetLevel.includes(',')
        ? targetLevel.split(',').map((tl) => tl.trim())
        : [targetLevel];
    query['teachingCapabilities.supportedTargetLevels'] = { $in: targetLevelList };
  }

  // 7. Price filters (Q22)
  if (priceRangeId && TUTOR_PRICE_RANGES[priceRangeId]) {
    query['teachingConditions.priceRangeId'] = priceRangeId;
  }

  if (priceMin !== undefined && priceMin !== null && priceMin !== '') {
    const minVal = Number(priceMin);
    andConditions.push({
      $or: [
        { 'teachingConditions.priceMax': { $gte: minVal } },
        { 'teachingConditions.isNegotiable': true },
      ],
    });
  }

  if (priceMax !== undefined && priceMax !== null && priceMax !== '') {
    const maxVal = Number(priceMax);
    andConditions.push({
      $or: [
        { 'teachingConditions.priceMin': { $lte: maxVal } },
        { 'teachingConditions.isNegotiable': true },
      ],
    });
  }

  // 8. Service Area filter (Q21)
  if (area && typeof area === 'string' && area.trim()) {
    query['teachingConditions.serviceAreas'] = {
      $regex: area.trim(),
      $options: 'i',
    };
  }

  // 9. Experience Years (Q23)
  if (
    experienceYearsMin !== undefined &&
    experienceYearsMin !== null &&
    experienceYearsMin !== ''
  ) {
    query.experienceYears = { $gte: Number(experienceYearsMin) };
  }

  // 10. Rating filter
  if (ratingMin !== undefined && ratingMin !== null && ratingMin !== '') {
    query['ratingSummary.averageRating'] = { $gte: Number(ratingMin) };
  }

  // 11. Search keyword
  const searchKeyword = (search || q || '').trim();
  if (searchKeyword) {
    const searchRegex = new RegExp(searchKeyword, 'i');

    const [matchedUserIds, matchedTaxonomyIds] = await Promise.all([
      User.find({
        role: ROLES.TUTOR,
        name: searchRegex,
      }).distinct('_id'),
      Taxonomy.find({
        name: searchRegex,
        active: true,
      }).distinct('_id'),
    ]);

    andConditions.push({
      $or: [
        { userId: { $in: matchedUserIds } },
        { introduction: searchRegex },
        { 'expertise.categoryId': { $in: matchedTaxonomyIds } },
        { 'expertise.subjectIds': { $in: matchedTaxonomyIds } },
        { 'expertise.topicIds': { $in: matchedTaxonomyIds } },
      ],
    });
  }

  if (andConditions.length > 0) {
    query.$and = andConditions;
  }

  // 12. Sorting
  let sortCriteria = { 'ratingSummary.averageRating': -1, createdAt: -1 };
  switch (sort) {
    case 'rating:desc':
    case '-rating':
    case 'rating':
      sortCriteria = {
        'ratingSummary.averageRating': -1,
        'ratingSummary.reviewCount': -1,
        createdAt: -1,
      };
      break;
    case 'rating:asc':
      sortCriteria = { 'ratingSummary.averageRating': 1, createdAt: -1 };
      break;
    case 'price:asc':
    case 'price':
      sortCriteria = { 'teachingConditions.priceMin': 1, createdAt: -1 };
      break;
    case 'price:desc':
    case '-price':
      sortCriteria = { 'teachingConditions.priceMax': -1, createdAt: -1 };
      break;
    case 'experience:desc':
    case '-experience':
      sortCriteria = { experienceYears: -1, createdAt: -1 };
      break;
    case 'newest':
    case '-createdAt':
      sortCriteria = { createdAt: -1 };
      break;
    case 'oldest':
    case 'createdAt':
      sortCriteria = { createdAt: 1 };
      break;
    default:
      sortCriteria = { 'ratingSummary.averageRating': -1, createdAt: -1 };
  }

  const populateFields = isAdmin ? ADMIN_TUTOR_POPULATE_FIELDS : TUTOR_POPULATE_FIELDS;

  const [profiles, total] = await Promise.all([
    TutorProfile.find(query).sort(sortCriteria).skip(skip).limit(limitNum).populate(populateFields),
    TutorProfile.countDocuments(query),
  ]);

  // Sanitize for public output
  const items = profiles.map((p) => {
    if (isAdmin) {
      return p;
    }
    const data = p.toJSON();
    if (data.userId) {
      delete data.userId.phone;
    }
    delete data.rejectionReason;
    delete data.approvedBy;
    return data;
  });

  const totalPages = Math.ceil(total / limitNum) || (total === 0 ? 0 : 1);

  return {
    items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1,
    },
  };
};

/**
 * Admin: Get list of tutors with filtering, search, and pagination (Phase 5)
 */
const getAdminTutors = async (queryParams = {}) => {
  const {
    approvalStatus,
    search,
    page = 1,
    limit = 10,
    sortBy = 'submittedAt',
    order = 'desc',
  } = queryParams;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const query = {};

  if (approvalStatus && approvalStatus !== 'all') {
    query.approvalStatus = approvalStatus;
  }

  if (search && typeof search === 'string' && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    const matchedUsers = await User.find({
      role: ROLES.TUTOR,
      $or: [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }],
    }).distinct('_id');

    query.$or = [{ userId: { $in: matchedUsers } }, { introduction: searchRegex }];
  }

  const sortOrder = order === 'asc' ? 1 : -1;
  const sortCriteria = { [sortBy]: sortOrder, createdAt: -1 };

  const [items, total] = await Promise.all([
    TutorProfile.find(query)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limitNum)
      .populate(ADMIN_TUTOR_POPULATE_FIELDS),
    TutorProfile.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limitNum) || (total === 0 ? 0 : 1);

  return {
    items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1,
    },
  };
};

/**
 * Admin: Get full tutor detail by Profile ID or User ID (Phase 5)
 */
const getAdminTutorDetail = async (identifier) => {
  const query = identifier.match(/^[0-9a-fA-F]{24}$/)
    ? { $or: [{ _id: identifier }, { userId: identifier }] }
    : { _id: null };

  const profile = await TutorProfile.findOne(query).populate(ADMIN_TUTOR_POPULATE_FIELDS);

  if (!profile) {
    throw ApiError.notFound('Không tìm thấy thông tin gia sư');
  }

  return profile;
};

/**
 * Admin: Approve or Reject a Tutor Profile (Phase 5)
 */
const updateTutorApproval = async (identifier, adminUserId, approvalData = {}) => {
  const query = identifier.match(/^[0-9a-fA-F]{24}$/)
    ? { $or: [{ _id: identifier }, { userId: identifier }] }
    : { _id: null };

  const profile = await TutorProfile.findOne(query);

  if (!profile) {
    throw ApiError.notFound('Không tìm thấy hồ sơ gia sư để phê duyệt');
  }

  const { approvalStatus, rejectionReason, verifiedQualifications } = approvalData;

  if (approvalStatus === APPROVAL_STATUS.APPROVED) {
    profile.approvalStatus = APPROVAL_STATUS.APPROVED;
    profile.approvedAt = new Date();
    profile.approvedBy = adminUserId;
    profile.rejectionReason = null;
  } else if (approvalStatus === APPROVAL_STATUS.REJECTED) {
    profile.approvalStatus = APPROVAL_STATUS.REJECTED;
    profile.rejectionReason = rejectionReason || 'Hồ sơ không đáp ứng tiêu chuẩn nền tảng';
    profile.approvedAt = null;
    profile.approvedBy = null;
  }

  // Update verified status for qualifications if array is provided
  if (Array.isArray(verifiedQualifications) && profile.qualifications) {
    const verifiedSet = new Set(verifiedQualifications.map((id) => id.toString()));
    profile.qualifications.forEach((q) => {
      if (q && q._id) {
        q.verified = verifiedSet.has(q._id.toString());
      }
    });
  }

  await profile.save();

  return TutorProfile.findById(profile._id).populate(ADMIN_TUTOR_POPULATE_FIELDS);
};

module.exports = {
  TUTOR_POPULATE_FIELDS,
  ADMIN_TUTOR_POPULATE_FIELDS,
  getProfileByUserId,
  getPublicProfile,
  updateProfile,
  submitProfile,
  searchTutors,
  getAdminTutors,
  getAdminTutorDetail,
  updateTutorApproval,
};
