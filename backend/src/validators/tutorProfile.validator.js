const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');
const Taxonomy = require('../models/taxonomy.model');
const { TAXONOMY_TYPES } = require('../constants/taxonomyTypes');
const { TUTOR_PRICE_RANGES, ENUMS } = require('../constants/profileStatus');

const isValidObjectId = (id) => id && mongoose.Types.ObjectId.isValid(id);

/**
 * Check if a mode ObjectId corresponds to offline or hybrid
 */
const checkContainsOfflineOrHybrid = async (modeIds = []) => {
  if (!Array.isArray(modeIds) || modeIds.length === 0) return false;

  const validIds = modeIds.filter((id) => isValidObjectId(id));
  if (validIds.length === 0) return false;

  const modes = await Taxonomy.find({
    _id: { $in: validIds },
    type: TAXONOMY_TYPES.LEARNING_MODE,
  }).select('slug');

  return modes.some((m) => m.slug === 'offline' || m.slug === 'hybrid');
};

/**
 * Validate Taxonomy Hierarchy Q1 -> Q2 -> Q3 for Tutor Expertise
 */
const validateExpertiseHierarchy = async (categoryId, subjectIds = [], topicIds = []) => {
  const errors = [];

  if (categoryId) {
    const category = await Taxonomy.findOne({
      _id: categoryId,
      type: TAXONOMY_TYPES.CATEGORY,
      active: true,
    });
    if (!category) {
      errors.push({
        field: 'expertise.categoryId',
        message: 'Lĩnh vực giảng dạy (Category) không tồn tại hoặc đã bị vô hiệu hóa',
      });
      return errors;
    }

    if (Array.isArray(subjectIds) && subjectIds.length > 0) {
      const subjects = await Taxonomy.find({
        _id: { $in: subjectIds },
        type: TAXONOMY_TYPES.SUBJECT,
        active: true,
      });

      const invalidSubjects = subjects.filter(
        (s) => !s.parentId || s.parentId.toString() !== categoryId.toString()
      );

      if (invalidSubjects.length > 0 || subjects.length !== subjectIds.length) {
        errors.push({
          field: 'expertise.subjectIds',
          message:
            'Một hoặc nhiều môn học không thuộc lĩnh vực giảng dạy đã chọn hoặc không hợp lệ',
        });
      }
    }

    if (Array.isArray(topicIds) && topicIds.length > 0) {
      const topics = await Taxonomy.find({
        _id: { $in: topicIds },
        type: TAXONOMY_TYPES.TOPIC,
        active: true,
      });

      const subjectIdStrings = new Set((subjectIds || []).map((s) => s.toString()));
      const invalidTopics = topics.filter(
        (t) => !t.parentId || !subjectIdStrings.has(t.parentId.toString())
      );

      if (invalidTopics.length > 0 || topics.length !== topicIds.length) {
        errors.push({
          field: 'expertise.topicIds',
          message:
            'Một hoặc nhiều chuyên môn giảng dạy không thuộc các môn học đã chọn hoặc không hợp lệ',
        });
      }
    }
  }

  return errors;
};

/**
 * Cleanse client input of administrative and server-controlled fields
 */
const sanitizeTutorInput = (body) => {
  delete body.approvalStatus;
  delete body.rejectionReason;
  delete body.approvedAt;
  delete body.approvedBy;
  delete body.ratingSummary;
  delete body.submittedAt;
  delete body.completedAt;

  if (Array.isArray(body.qualifications)) {
    body.qualifications = body.qualifications.map((q) => {
      const sanitized = { ...q };
      sanitized.verified = false; // Never allow client self-verification
      return sanitized;
    });
  }
};

/**
 * Middleware: Validate Partial Update (Draft Save) for Tutor Profile
 */
const validateUpdateTutorProfile = async (req, res, next) => {
  try {
    sanitizeTutorInput(req.body);

    const {
      expertise,
      teachingCapabilities,
      schedulePreferences,
      teachingConditions,
      experienceRange,
      experienceYears,
      qualifications,
      supportApproaches,
      availableSupport,
      assessmentMethods,
      introduction,
    } = req.body;

    const errors = [];

    // 1. Expertise
    if (expertise) {
      if (expertise.categoryId !== undefined && expertise.categoryId !== null) {
        if (!isValidObjectId(expertise.categoryId)) {
          errors.push({
            field: 'expertise.categoryId',
            message: 'Category ID phải là ObjectId hợp lệ',
          });
        }
      }

      if (expertise.subjectIds !== undefined) {
        if (!Array.isArray(expertise.subjectIds)) {
          errors.push({
            field: 'expertise.subjectIds',
            message: 'subjectIds phải là một danh sách ID',
          });
        }
      }

      if (expertise.topicIds !== undefined) {
        if (!Array.isArray(expertise.topicIds)) {
          errors.push({
            field: 'expertise.topicIds',
            message: 'topicIds phải là một danh sách ID',
          });
        }
      }
    }

    // 2. Teaching capabilities
    if (teachingCapabilities) {
      if (
        teachingCapabilities.supportedPurposes !== undefined &&
        !Array.isArray(teachingCapabilities.supportedPurposes)
      ) {
        errors.push({
          field: 'teachingCapabilities.supportedPurposes',
          message: 'supportedPurposes phải là một danh sách ID',
        });
      }

      if (
        teachingCapabilities.teachableLevels !== undefined &&
        !Array.isArray(teachingCapabilities.teachableLevels)
      ) {
        errors.push({
          field: 'teachingCapabilities.teachableLevels',
          message: 'teachableLevels phải là một danh sách ID',
        });
      }

      if (
        teachingCapabilities.supportedTargetLevels !== undefined &&
        !Array.isArray(teachingCapabilities.supportedTargetLevels)
      ) {
        errors.push({
          field: 'teachingCapabilities.supportedTargetLevels',
          message: 'supportedTargetLevels phải là một danh sách ID',
        });
      }

      if (
        teachingCapabilities.supportedGoalTags !== undefined &&
        !Array.isArray(teachingCapabilities.supportedGoalTags)
      ) {
        errors.push({
          field: 'teachingCapabilities.supportedGoalTags',
          message: 'supportedGoalTags phải là một danh sách mục tiêu',
        });
      }

      if (
        teachingCapabilities.estimatedDurationRanges !== undefined &&
        !Array.isArray(teachingCapabilities.estimatedDurationRanges)
      ) {
        errors.push({
          field: 'teachingCapabilities.estimatedDurationRanges',
          message: 'estimatedDurationRanges phải là một danh sách thời lượng',
        });
      }

      if (
        teachingCapabilities.methods !== undefined &&
        !Array.isArray(teachingCapabilities.methods)
      ) {
        errors.push({
          field: 'teachingCapabilities.methods',
          message: 'methods phải là một danh sách ID',
        });
      }

      if (teachingCapabilities.pace !== undefined && teachingCapabilities.pace !== null) {
        if (!ENUMS.PACE.includes(teachingCapabilities.pace)) {
          errors.push({
            field: 'teachingCapabilities.pace',
            message: `pace không hợp lệ. Chỉ chấp nhận: [${ENUMS.PACE.join(', ')}]`,
          });
        }
      }

      if (
        teachingCapabilities.classFormats !== undefined &&
        !Array.isArray(teachingCapabilities.classFormats)
      ) {
        errors.push({
          field: 'teachingCapabilities.classFormats',
          message: 'classFormats phải là danh sách hình thức',
        });
      }

      if (teachingCapabilities.styles !== undefined) {
        if (!Array.isArray(teachingCapabilities.styles)) {
          errors.push({
            field: 'teachingCapabilities.styles',
            message: 'styles phải là một danh sách ID',
          });
        } else if (teachingCapabilities.styles.length > 3) {
          errors.push({
            field: 'teachingCapabilities.styles',
            message: 'Chỉ được chọn tối đa 3 phong cách giảng dạy',
          });
        }
      }

      if (
        teachingCapabilities.materials !== undefined &&
        !Array.isArray(teachingCapabilities.materials)
      ) {
        errors.push({
          field: 'teachingCapabilities.materials',
          message: 'materials phải là một danh sách ID',
        });
      }

      if (
        teachingCapabilities.interactionLevel !== undefined &&
        teachingCapabilities.interactionLevel !== null &&
        !isValidObjectId(teachingCapabilities.interactionLevel)
      ) {
        errors.push({
          field: 'teachingCapabilities.interactionLevel',
          message: 'interactionLevel phải là ObjectId hợp lệ',
        });
      }
    }

    // 3. Schedule preferences
    if (schedulePreferences) {
      if (
        schedulePreferences.timeBands !== undefined &&
        !Array.isArray(schedulePreferences.timeBands)
      ) {
        errors.push({
          field: 'schedulePreferences.timeBands',
          message: 'timeBands phải là một danh sách ID',
        });
      }

      if (schedulePreferences.weekdays !== undefined) {
        if (!Array.isArray(schedulePreferences.weekdays)) {
          errors.push({
            field: 'schedulePreferences.weekdays',
            message: 'weekdays phải là danh sách số từ 0 (CN) đến 6 (T7)',
          });
        }
      }

      if (
        schedulePreferences.maxSessionsPerWeek !== undefined &&
        schedulePreferences.maxSessionsPerWeek !== null
      ) {
        if (!ENUMS.TUTOR_MAX_SESSIONS.includes(schedulePreferences.maxSessionsPerWeek)) {
          errors.push({
            field: 'schedulePreferences.maxSessionsPerWeek',
            message: `maxSessionsPerWeek không hợp lệ. Chỉ chấp nhận: [${ENUMS.TUTOR_MAX_SESSIONS.join(', ')}]`,
          });
        }
      }

      if (
        schedulePreferences.sessionDurationsMinutes !== undefined &&
        !Array.isArray(schedulePreferences.sessionDurationsMinutes)
      ) {
        errors.push({
          field: 'schedulePreferences.sessionDurationsMinutes',
          message: 'sessionDurationsMinutes phải là danh sách thời lượng',
        });
      }
    }

    // 4. Teaching conditions
    if (teachingConditions) {
      if (teachingConditions.modes !== undefined && !Array.isArray(teachingConditions.modes)) {
        errors.push({
          field: 'teachingConditions.modes',
          message: 'modes phải là một danh sách ID',
        });
      }

      if (
        teachingConditions.offlineLocations !== undefined &&
        !Array.isArray(teachingConditions.offlineLocations)
      ) {
        errors.push({
          field: 'teachingConditions.offlineLocations',
          message: 'offlineLocations phải là một danh sách ID',
        });
      }

      if (
        teachingConditions.serviceAreas !== undefined &&
        !Array.isArray(teachingConditions.serviceAreas)
      ) {
        errors.push({
          field: 'teachingConditions.serviceAreas',
          message: 'serviceAreas phải là danh sách khu vực',
        });
      }

      if (
        teachingConditions.travelRadiusKm !== undefined &&
        teachingConditions.travelRadiusKm !== null
      ) {
        if (
          typeof teachingConditions.travelRadiusKm !== 'number' ||
          teachingConditions.travelRadiusKm < 0
        ) {
          errors.push({
            field: 'teachingConditions.travelRadiusKm',
            message: 'Bán kính di chuyển phải là số không âm',
          });
        }
      }

      if (
        teachingConditions.priceRangeId !== undefined &&
        teachingConditions.priceRangeId !== null
      ) {
        if (!TUTOR_PRICE_RANGES[teachingConditions.priceRangeId]) {
          errors.push({
            field: 'teachingConditions.priceRangeId',
            message: `priceRangeId không hợp lệ. Chỉ chấp nhận: [${Object.keys(TUTOR_PRICE_RANGES).join(', ')}]`,
          });
        } else {
          teachingConditions.priceMin = TUTOR_PRICE_RANGES[teachingConditions.priceRangeId].min;
          teachingConditions.priceMax = TUTOR_PRICE_RANGES[teachingConditions.priceRangeId].max;
          teachingConditions.isNegotiable =
            TUTOR_PRICE_RANGES[teachingConditions.priceRangeId].isNegotiable;
        }
      } else if (
        teachingConditions.priceMin !== undefined ||
        teachingConditions.priceMax !== undefined
      ) {
        const min =
          teachingConditions.priceMin !== undefined ? Number(teachingConditions.priceMin) : 0;
        const max =
          teachingConditions.priceMax !== undefined ? Number(teachingConditions.priceMax) : 0;
        if (min < 0 || max < 0 || (max > 0 && min > max)) {
          errors.push({
            field: 'teachingConditions.price',
            message: 'Học phí priceMin và priceMax phải >= 0 và priceMin <= priceMax',
          });
        }
      }
    }

    // 5. Experience
    if (experienceRange !== undefined && experienceRange !== null) {
      if (!ENUMS.EXPERIENCE_RANGE.includes(experienceRange)) {
        errors.push({
          field: 'experienceRange',
          message: `experienceRange không hợp lệ. Chỉ chấp nhận: [${ENUMS.EXPERIENCE_RANGE.join(', ')}]`,
        });
      }
    }

    if (experienceYears !== undefined && experienceYears !== null) {
      if (typeof experienceYears !== 'number' || experienceYears < 0) {
        errors.push({
          field: 'experienceYears',
          message: 'Số năm kinh nghiệm phải là số >= 0',
        });
      }
    }

    // 6. Qualifications
    if (qualifications !== undefined) {
      if (!Array.isArray(qualifications)) {
        errors.push({
          field: 'qualifications',
          message: 'qualifications phải là danh sách chứng chỉ / bằng cấp',
        });
      } else {
        qualifications.forEach((q, index) => {
          if (!q.title || typeof q.title !== 'string' || q.title.trim().length === 0) {
            errors.push({
              field: `qualifications[${index}].title`,
              message: 'Tên chứng chỉ không được để trống',
            });
          }
        });
      }
    }

    // 7. Support & Assessment
    if (supportApproaches !== undefined && !Array.isArray(supportApproaches)) {
      errors.push({
        field: 'supportApproaches',
        message: 'supportApproaches phải là một danh sách ID',
      });
    }

    if (availableSupport !== undefined && !Array.isArray(availableSupport)) {
      errors.push({
        field: 'availableSupport',
        message: 'availableSupport phải là một danh sách ID',
      });
    }

    if (assessmentMethods !== undefined && !Array.isArray(assessmentMethods)) {
      errors.push({
        field: 'assessmentMethods',
        message: 'assessmentMethods phải là một danh sách ID',
      });
    }

    // 8. Introduction
    if (introduction !== undefined && typeof introduction === 'string') {
      if (introduction.length > 2000) {
        errors.push({
          field: 'introduction',
          message: 'Giới thiệu bản thân không được vượt quá 2000 ký tự',
        });
      }
    }

    if (errors.length > 0) {
      return next(ApiError.badRequest('Dữ liệu lưu nháp hồ sơ gia sư không hợp lệ', errors));
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Validate Submission for Tutor Profile Onboarding (Approval Pending)
 */
const validateSubmitTutorProfile = async (req, res, next) => {
  try {
    sanitizeTutorInput(req.body);

    const {
      expertise = {},
      teachingCapabilities = {},
      schedulePreferences = {},
      teachingConditions = {},
      experienceRange,
      experienceYears,
      supportApproaches,
      availableSupport,
      assessmentMethods,
    } = req.body;

    const errors = [];

    // 1. Mandatory Expertise Q1, Q2, Q3
    if (!isValidObjectId(expertise.categoryId)) {
      errors.push({
        field: 'expertise.categoryId',
        message: 'Vui lòng chọn lĩnh vực giảng dạy thế mạnh (Q1)',
      });
    }
    if (!Array.isArray(expertise.subjectIds) || expertise.subjectIds.length === 0) {
      errors.push({
        field: 'expertise.subjectIds',
        message: 'Vui lòng chọn ít nhất một môn học có thể dạy (Q2)',
      });
    }
    if (!Array.isArray(expertise.topicIds) || expertise.topicIds.length === 0) {
      errors.push({
        field: 'expertise.topicIds',
        message: 'Vui lòng chọn ít nhất một chuyên môn sâu có thể dạy (Q3)',
      });
    }

    // 2. Mandatory Teaching Capabilities Q4, Q5, Q6, Q7, Q8, Q9, Q10, Q11, Q12, Q13, Q14
    if (
      !Array.isArray(teachingCapabilities.supportedPurposes) ||
      teachingCapabilities.supportedPurposes.length === 0
    ) {
      errors.push({
        field: 'teachingCapabilities.supportedPurposes',
        message: 'Vui lòng chọn các mục đích học viên có thể hỗ trợ (Q4)',
      });
    }
    if (
      !Array.isArray(teachingCapabilities.teachableLevels) ||
      teachingCapabilities.teachableLevels.length === 0
    ) {
      errors.push({
        field: 'teachingCapabilities.teachableLevels',
        message: 'Vui lòng chọn trình độ đầu vào bạn có thể tiếp nhận (Q5)',
      });
    }
    if (
      !Array.isArray(teachingCapabilities.supportedTargetLevels) ||
      teachingCapabilities.supportedTargetLevels.length === 0
    ) {
      errors.push({
        field: 'teachingCapabilities.supportedTargetLevels',
        message: 'Vui lòng chọn trình độ đầu ra bạn có thể đào tạo (Q6)',
      });
    }
    if (
      !Array.isArray(teachingCapabilities.supportedGoalTags) ||
      teachingCapabilities.supportedGoalTags.length === 0
    ) {
      errors.push({
        field: 'teachingCapabilities.supportedGoalTags',
        message: 'Vui lòng chọn các mục tiêu cụ thể bạn tự tin hỗ trợ (Q7)',
      });
    }
    if (
      !Array.isArray(teachingCapabilities.estimatedDurationRanges) ||
      teachingCapabilities.estimatedDurationRanges.length === 0
    ) {
      errors.push({
        field: 'teachingCapabilities.estimatedDurationRanges',
        message: 'Vui lòng chọn ước lượng thời gian đạt mục tiêu trung bình (Q8)',
      });
    }
    if (!Array.isArray(teachingCapabilities.methods) || teachingCapabilities.methods.length === 0) {
      errors.push({
        field: 'teachingCapabilities.methods',
        message: 'Vui lòng chọn phương pháp giảng dạy chính (Q9)',
      });
    }
    if (!teachingCapabilities.pace || !ENUMS.PACE.includes(teachingCapabilities.pace)) {
      errors.push({
        field: 'teachingCapabilities.pace',
        message: 'Vui lòng chọn cách điều chỉnh nhịp điệu giảng dạy (Q10)',
      });
    }
    if (
      !Array.isArray(teachingCapabilities.classFormats) ||
      teachingCapabilities.classFormats.length === 0
    ) {
      errors.push({
        field: 'teachingCapabilities.classFormats',
        message: 'Vui lòng chọn quy mô lớp học bạn có thể đảm nhận (Q11)',
      });
    }
    if (!Array.isArray(teachingCapabilities.styles) || teachingCapabilities.styles.length === 0) {
      errors.push({
        field: 'teachingCapabilities.styles',
        message: 'Vui lòng chọn phong cách giảng dạy đặc trưng (Q12)',
      });
    } else if (teachingCapabilities.styles.length > 3) {
      errors.push({
        field: 'teachingCapabilities.styles',
        message: 'Chỉ được chọn tối đa 3 nét phong cách giảng dạy (Q12)',
      });
    }
    if (
      !Array.isArray(teachingCapabilities.materials) ||
      teachingCapabilities.materials.length === 0
    ) {
      errors.push({
        field: 'teachingCapabilities.materials',
        message: 'Vui lòng chọn tài liệu hoặc công cụ sử dụng (Q13)',
      });
    }
    if (!isValidObjectId(teachingCapabilities.interactionLevel)) {
      errors.push({
        field: 'teachingCapabilities.interactionLevel',
        message: 'Vui lòng chọn mức độ tương tác tạo ra trong buổi học (Q14)',
      });
    }

    // 3. Mandatory Schedule Q15, Q16, Q17, Q18
    if (
      !Array.isArray(schedulePreferences.timeBands) ||
      schedulePreferences.timeBands.length === 0
    ) {
      errors.push({
        field: 'schedulePreferences.timeBands',
        message: 'Vui lòng chọn khung thời gian có thể dạy (Q15)',
      });
    }
    if (!Array.isArray(schedulePreferences.weekdays) || schedulePreferences.weekdays.length === 0) {
      errors.push({
        field: 'schedulePreferences.weekdays',
        message: 'Vui lòng chọn các ngày trong tuần có thể nhận lớp (Q16)',
      });
    }
    if (
      !schedulePreferences.maxSessionsPerWeek ||
      !ENUMS.TUTOR_MAX_SESSIONS.includes(schedulePreferences.maxSessionsPerWeek)
    ) {
      errors.push({
        field: 'schedulePreferences.maxSessionsPerWeek',
        message: 'Vui lòng chọn số buổi dạy tối đa mỗi tuần (Q17)',
      });
    }
    if (
      !Array.isArray(schedulePreferences.sessionDurationsMinutes) ||
      schedulePreferences.sessionDurationsMinutes.length === 0
    ) {
      errors.push({
        field: 'schedulePreferences.sessionDurationsMinutes',
        message: 'Vui lòng chọn thời lượng mỗi buổi dạy mong muốn (Q18)',
      });
    }

    // 4. Mandatory Conditions Q19, Q22 and conditional Q20
    if (!Array.isArray(teachingConditions.modes) || teachingConditions.modes.length === 0) {
      errors.push({
        field: 'teachingConditions.modes',
        message: 'Vui lòng chọn hình thức giảng dạy Online / Offline (Q19)',
      });
    } else {
      const isOfflineOrHybrid = await checkContainsOfflineOrHybrid(teachingConditions.modes);
      if (isOfflineOrHybrid) {
        if (
          !Array.isArray(teachingConditions.offlineLocations) ||
          teachingConditions.offlineLocations.length === 0
        ) {
          errors.push({
            field: 'teachingConditions.offlineLocations',
            message: 'Khi chọn dạy Offline hoặc Kết hợp, vui lòng chọn địa điểm có thể dạy (Q20)',
          });
        }
      }
    }

    if (teachingConditions.priceRangeId) {
      if (!TUTOR_PRICE_RANGES[teachingConditions.priceRangeId]) {
        errors.push({
          field: 'teachingConditions.priceRangeId',
          message: 'Mức học phí lựa chọn không hợp lệ (Q22)',
        });
      } else {
        teachingConditions.priceMin = TUTOR_PRICE_RANGES[teachingConditions.priceRangeId].min;
        teachingConditions.priceMax = TUTOR_PRICE_RANGES[teachingConditions.priceRangeId].max;
        teachingConditions.isNegotiable =
          TUTOR_PRICE_RANGES[teachingConditions.priceRangeId].isNegotiable;
      }
    } else if (
      !teachingConditions.isNegotiable &&
      (teachingConditions.priceMax === undefined || teachingConditions.priceMax <= 0)
    ) {
      errors.push({
        field: 'teachingConditions.price',
        message: 'Vui lòng chọn hoặc nhập mức học phí mong muốn cho mỗi buổi dạy (Q22)',
      });
    }

    // 5. Mandatory Experience Q23
    if (!experienceRange && experienceYears === undefined) {
      errors.push({
        field: 'experienceRange',
        message: 'Vui lòng khai báo kinh nghiệm giảng dạy (Q23)',
      });
    }

    // 6. Mandatory Support Q25, Q26, Q27
    if (!Array.isArray(supportApproaches) || supportApproaches.length === 0) {
      errors.push({
        field: 'supportApproaches',
        message: 'Vui lòng chọn phương án tháo gỡ vướng mắc cho học viên (Q25)',
      });
    }
    if (!Array.isArray(availableSupport) || availableSupport.length === 0) {
      errors.push({
        field: 'availableSupport',
        message: 'Vui lòng chọn các hoạt động hỗ trợ ngoài giờ học (Q26)',
      });
    }
    if (!Array.isArray(assessmentMethods) || assessmentMethods.length === 0) {
      errors.push({
        field: 'assessmentMethods',
        message: 'Vui lòng chọn phương thức đánh giá tiến độ học viên (Q27)',
      });
    }

    if (errors.length > 0) {
      return next(
        ApiError.badRequest('Vui lòng hoàn thành đầy đủ các thông tin hồ sơ bắt buộc', errors)
      );
    }

    // 7. Check Taxonomy Hierarchy Q1 -> Q2 -> Q3
    const hierarchyErrors = await validateExpertiseHierarchy(
      expertise.categoryId,
      expertise.subjectIds,
      expertise.topicIds
    );
    if (hierarchyErrors.length > 0) {
      return next(
        ApiError.badRequest(
          'Phân cấp danh mục chuyên môn Q1 -> Q2 -> Q3 không khớp',
          hierarchyErrors
        )
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateUpdateTutorProfile,
  validateSubmitTutorProfile,
  validateExpertiseHierarchy,
  checkContainsOfflineOrHybrid,
};
