const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');
const Taxonomy = require('../models/taxonomy.model');
const { TAXONOMY_TYPES } = require('../constants/taxonomyTypes');
const { LEARNER_BUDGET_RANGES, ENUMS } = require('../constants/profileStatus');

const isValidObjectId = (id) => id && mongoose.Types.ObjectId.isValid(id);

/**
 * Check if a mode ObjectId or slug corresponds to offline or hybrid
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
 * Validate Taxonomy Hierarchy Q1 -> Q2 -> Q3
 */
const validateHierarchy = async (categoryId, subjectIds = [], topicIds = []) => {
  const errors = [];

  if (categoryId) {
    const category = await Taxonomy.findOne({
      _id: categoryId,
      type: TAXONOMY_TYPES.CATEGORY,
      active: true,
    });
    if (!category) {
      errors.push({
        field: 'learning.categoryId',
        message: 'Lĩnh vực (Category) không tồn tại hoặc đã bị vô hiệu hóa',
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
          field: 'learning.subjectIds',
          message: 'Một hoặc nhiều môn học không thuộc lĩnh vực đã chọn hoặc không hợp lệ',
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
          field: 'learning.topicIds',
          message:
            'Một hoặc nhiều chuyên môn sâu không thuộc các môn học đã chọn hoặc không hợp lệ',
        });
      }
    }
  }

  return errors;
};

/**
 * Middleware: Validate Partial Update (Draft Save) for Learner Preference
 */
const validateUpdateLearnerPreference = async (req, res, next) => {
  try {
    const {
      learning,
      learningStyle,
      schedulePreferences,
      constraints,
      tutorRequirements,
      supportNeeds,
      additionalNote,
    } = req.body;

    const errors = [];

    // 1. Learning validations
    if (learning) {
      if (learning.categoryId !== undefined && learning.categoryId !== null) {
        if (!isValidObjectId(learning.categoryId)) {
          errors.push({
            field: 'learning.categoryId',
            message: 'Category ID phải là ObjectId hợp lệ',
          });
        }
      }

      if (learning.subjectIds !== undefined) {
        if (!Array.isArray(learning.subjectIds)) {
          errors.push({
            field: 'learning.subjectIds',
            message: 'subjectIds phải là một danh sách ID',
          });
        } else {
          for (const sId of learning.subjectIds) {
            if (!isValidObjectId(sId)) {
              errors.push({
                field: 'learning.subjectIds',
                message: `Subject ID "${sId}" không hợp lệ`,
              });
              break;
            }
          }
        }
      }

      if (learning.topicIds !== undefined) {
        if (!Array.isArray(learning.topicIds)) {
          errors.push({
            field: 'learning.topicIds',
            message: 'topicIds phải là một danh sách ID',
          });
        } else {
          for (const tId of learning.topicIds) {
            if (!isValidObjectId(tId)) {
              errors.push({
                field: 'learning.topicIds',
                message: `Topic ID "${tId}" không hợp lệ`,
              });
              break;
            }
          }
        }
      }

      if (learning.purposes !== undefined) {
        if (!Array.isArray(learning.purposes)) {
          errors.push({
            field: 'learning.purposes',
            message: 'purposes phải là một danh sách ID',
          });
        }
      }

      if (
        learning.currentLevel !== undefined &&
        learning.currentLevel !== null &&
        !isValidObjectId(learning.currentLevel)
      ) {
        errors.push({
          field: 'learning.currentLevel',
          message: 'currentLevel phải là ObjectId hợp lệ',
        });
      }

      if (
        learning.targetLevel !== undefined &&
        learning.targetLevel !== null &&
        !isValidObjectId(learning.targetLevel)
      ) {
        errors.push({
          field: 'learning.targetLevel',
          message: 'targetLevel phải là ObjectId hợp lệ',
        });
      }

      if (learning.targetDuration !== undefined && learning.targetDuration !== null) {
        if (!ENUMS.TARGET_DURATION.includes(learning.targetDuration)) {
          errors.push({
            field: 'learning.targetDuration',
            message: `targetDuration không hợp lệ. Chỉ chấp nhận: [${ENUMS.TARGET_DURATION.join(', ')}]`,
          });
        }
      }

      if (learning.goalText !== undefined && typeof learning.goalText === 'string') {
        if (learning.goalText.length > 500) {
          errors.push({
            field: 'learning.goalText',
            message: 'Mục tiêu cụ thể không được vượt quá 500 ký tự',
          });
        }
      }
    }

    // 2. Learning style validations
    if (learningStyle) {
      if (learningStyle.methods !== undefined && !Array.isArray(learningStyle.methods)) {
        errors.push({
          field: 'learningStyle.methods',
          message: 'methods phải là một danh sách ID',
        });
      }

      if (learningStyle.pace !== undefined && learningStyle.pace !== null) {
        if (!ENUMS.PACE.includes(learningStyle.pace)) {
          errors.push({
            field: 'learningStyle.pace',
            message: `pace không hợp lệ. Chỉ chấp nhận: [${ENUMS.PACE.join(', ')}]`,
          });
        }
      }

      if (learningStyle.classFormat !== undefined && learningStyle.classFormat !== null) {
        if (!ENUMS.CLASS_FORMAT.includes(learningStyle.classFormat)) {
          errors.push({
            field: 'learningStyle.classFormat',
            message: `classFormat không hợp lệ. Chỉ chấp nhận: [${ENUMS.CLASS_FORMAT.join(', ')}]`,
          });
        }
      }

      if (learningStyle.preferredTutorStyles !== undefined) {
        if (!Array.isArray(learningStyle.preferredTutorStyles)) {
          errors.push({
            field: 'learningStyle.preferredTutorStyles',
            message: 'preferredTutorStyles phải là một danh sách ID',
          });
        } else if (learningStyle.preferredTutorStyles.length > 3) {
          errors.push({
            field: 'learningStyle.preferredTutorStyles',
            message: 'Chỉ được chọn tối đa 3 phong cách gia sư',
          });
        }
      }

      if (learningStyle.materials !== undefined && !Array.isArray(learningStyle.materials)) {
        errors.push({
          field: 'learningStyle.materials',
          message: 'materials phải là một danh sách ID',
        });
      }

      if (
        learningStyle.interactionLevel !== undefined &&
        learningStyle.interactionLevel !== null &&
        !isValidObjectId(learningStyle.interactionLevel)
      ) {
        errors.push({
          field: 'learningStyle.interactionLevel',
          message: 'interactionLevel phải là ObjectId hợp lệ',
        });
      }
    }

    // 3. Schedule validations
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
        } else {
          const invalidDays = schedulePreferences.weekdays.filter(
            (d) => typeof d !== 'number' || d < 0 || d > 6
          );
          if (invalidDays.length > 0) {
            errors.push({
              field: 'schedulePreferences.weekdays',
              message: 'Ngày trong tuần phải là số từ 0 đến 6',
            });
          }
        }
      }

      if (
        schedulePreferences.sessionsPerWeek !== undefined &&
        schedulePreferences.sessionsPerWeek !== null
      ) {
        if (
          typeof schedulePreferences.sessionsPerWeek !== 'number' ||
          schedulePreferences.sessionsPerWeek < 1 ||
          schedulePreferences.sessionsPerWeek > 5
        ) {
          errors.push({
            field: 'schedulePreferences.sessionsPerWeek',
            message: 'Số buổi mỗi tuần phải từ 1 đến 5',
          });
        }
      }

      if (
        schedulePreferences.durationMinutes !== undefined &&
        !Array.isArray(schedulePreferences.durationMinutes)
      ) {
        errors.push({
          field: 'schedulePreferences.durationMinutes',
          message: 'durationMinutes phải là danh sách thời lượng',
        });
      }
    }

    // 4. Constraints validations
    if (constraints) {
      if (constraints.modes !== undefined && !Array.isArray(constraints.modes)) {
        errors.push({
          field: 'constraints.modes',
          message: 'modes phải là một danh sách ID',
        });
      }

      if (
        constraints.offlineLocations !== undefined &&
        !Array.isArray(constraints.offlineLocations)
      ) {
        errors.push({
          field: 'constraints.offlineLocations',
          message: 'offlineLocations phải là một danh sách ID',
        });
      }

      if (constraints.budgetRangeId !== undefined && constraints.budgetRangeId !== null) {
        if (!LEARNER_BUDGET_RANGES[constraints.budgetRangeId]) {
          errors.push({
            field: 'constraints.budgetRangeId',
            message: `budgetRangeId không hợp lệ. Chỉ chấp nhận: [${Object.keys(LEARNER_BUDGET_RANGES).join(', ')}]`,
          });
        } else {
          // Auto-normalize budgetMin and budgetMax from preset
          constraints.budgetMin = LEARNER_BUDGET_RANGES[constraints.budgetRangeId].min;
          constraints.budgetMax = LEARNER_BUDGET_RANGES[constraints.budgetRangeId].max;
        }
      } else if (constraints.budgetMin !== undefined || constraints.budgetMax !== undefined) {
        const min = constraints.budgetMin !== undefined ? Number(constraints.budgetMin) : 0;
        const max = constraints.budgetMax !== undefined ? Number(constraints.budgetMax) : 0;
        if (min < 0 || max < 0 || (max > 0 && min > max)) {
          errors.push({
            field: 'constraints.budget',
            message: 'Ngân sách budgetMin và budgetMax phải >= 0 và budgetMin <= budgetMax',
          });
        }
      }
    }

    // 5. Tutor requirements validations
    if (tutorRequirements) {
      if (tutorRequirements.selectionPriorities !== undefined) {
        if (!Array.isArray(tutorRequirements.selectionPriorities)) {
          errors.push({
            field: 'tutorRequirements.selectionPriorities',
            message: 'selectionPriorities phải là một danh sách ID',
          });
        } else if (tutorRequirements.selectionPriorities.length > 3) {
          errors.push({
            field: 'tutorRequirements.selectionPriorities',
            message: 'Chỉ được chọn tối đa 3 ưu tiên khi chọn gia sư',
          });
        }
      }

      if (
        tutorRequirements.experienceRange !== undefined &&
        tutorRequirements.experienceRange !== null
      ) {
        if (!ENUMS.EXPERIENCE_RANGE.includes(tutorRequirements.experienceRange)) {
          errors.push({
            field: 'tutorRequirements.experienceRange',
            message: `experienceRange không hợp lệ. Chỉ chấp nhận: [${ENUMS.EXPERIENCE_RANGE.join(', ')}]`,
          });
        }
      }

      if (
        tutorRequirements.certificateRequirement !== undefined &&
        tutorRequirements.certificateRequirement !== null
      ) {
        if (!ENUMS.CERTIFICATE_REQUIREMENT.includes(tutorRequirements.certificateRequirement)) {
          errors.push({
            field: 'tutorRequirements.certificateRequirement',
            message: `certificateRequirement không hợp lệ. Chỉ chấp nhận: [${ENUMS.CERTIFICATE_REQUIREMENT.join(', ')}]`,
          });
        }
      }
    }

    // 6. Support needs validations
    if (supportNeeds) {
      if (supportNeeds.difficulties !== undefined && !Array.isArray(supportNeeds.difficulties)) {
        errors.push({
          field: 'supportNeeds.difficulties',
          message: 'difficulties phải là một danh sách ID',
        });
      }

      if (
        supportNeeds.desiredSupport !== undefined &&
        !Array.isArray(supportNeeds.desiredSupport)
      ) {
        errors.push({
          field: 'supportNeeds.desiredSupport',
          message: 'desiredSupport phải là một danh sách ID',
        });
      }

      if (
        supportNeeds.progressTracking !== undefined &&
        supportNeeds.progressTracking !== null &&
        !isValidObjectId(supportNeeds.progressTracking)
      ) {
        errors.push({
          field: 'supportNeeds.progressTracking',
          message: 'progressTracking phải là ObjectId hợp lệ',
        });
      }
    }

    // 7. Additional note length
    if (additionalNote !== undefined && typeof additionalNote === 'string') {
      if (additionalNote.length > 1000) {
        errors.push({
          field: 'additionalNote',
          message: 'Ghi chú thêm không được vượt quá 1000 ký tự',
        });
      }
    }

    if (errors.length > 0) {
      return next(ApiError.badRequest('Dữ liệu lưu nháp hồ sơ không hợp lệ', errors));
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Validate Complete Onboarding Submission for Learner Preference
 */
const validateCompleteLearnerPreference = async (req, res, next) => {
  try {
    const {
      learning = {},
      learningStyle = {},
      schedulePreferences = {},
      constraints = {},
      tutorRequirements = {},
      supportNeeds = {},
    } = req.body;

    const errors = [];

    // 1. Mandatory Q1, Q2, Q3, Q4, Q5, Q6, Q8
    if (!isValidObjectId(learning.categoryId)) {
      errors.push({ field: 'learning.categoryId', message: 'Vui lòng chọn lĩnh vực học (Q1)' });
    }
    if (!Array.isArray(learning.subjectIds) || learning.subjectIds.length === 0) {
      errors.push({
        field: 'learning.subjectIds',
        message: 'Vui lòng chọn ít nhất một môn học (Q2)',
      });
    }
    if (!Array.isArray(learning.topicIds) || learning.topicIds.length === 0) {
      errors.push({
        field: 'learning.topicIds',
        message: 'Vui lòng chọn ít nhất một chuyên môn chi tiết (Q3)',
      });
    }
    if (!Array.isArray(learning.purposes) || learning.purposes.length === 0) {
      errors.push({
        field: 'learning.purposes',
        message: 'Vui lòng chọn mục đích học tập chính (Q4)',
      });
    }
    if (!isValidObjectId(learning.currentLevel)) {
      errors.push({
        field: 'learning.currentLevel',
        message: 'Vui lòng chọn trình độ hiện tại của bạn (Q5)',
      });
    }
    if (!isValidObjectId(learning.targetLevel)) {
      errors.push({
        field: 'learning.targetLevel',
        message: 'Vui lòng chọn trình độ mục tiêu mong muốn (Q6)',
      });
    }
    if (!learning.targetDuration || !ENUMS.TARGET_DURATION.includes(learning.targetDuration)) {
      errors.push({
        field: 'learning.targetDuration',
        message: 'Vui lòng chọn thời gian mong muốn đạt mục tiêu (Q8)',
      });
    }

    // 2. Mandatory Q9, Q10, Q11, Q12, Q13, Q14
    if (!Array.isArray(learningStyle.methods) || learningStyle.methods.length === 0) {
      errors.push({
        field: 'learningStyle.methods',
        message: 'Vui lòng chọn ít nhất một phương pháp học tập yêu thích (Q9)',
      });
    }
    if (!learningStyle.pace || !ENUMS.PACE.includes(learningStyle.pace)) {
      errors.push({
        field: 'learningStyle.pace',
        message: 'Vui lòng chọn tốc độ học mong muốn (Q10)',
      });
    }
    if (!learningStyle.classFormat || !ENUMS.CLASS_FORMAT.includes(learningStyle.classFormat)) {
      errors.push({
        field: 'learningStyle.classFormat',
        message: 'Vui lòng chọn hình thức lớp học mong muốn (Q11)',
      });
    }
    if (
      !Array.isArray(learningStyle.preferredTutorStyles) ||
      learningStyle.preferredTutorStyles.length === 0
    ) {
      errors.push({
        field: 'learningStyle.preferredTutorStyles',
        message: 'Vui lòng chọn phong cách gia sư kỳ vọng (Q12)',
      });
    } else if (learningStyle.preferredTutorStyles.length > 3) {
      errors.push({
        field: 'learningStyle.preferredTutorStyles',
        message: 'Chỉ được chọn tối đa 3 phong cách gia sư (Q12)',
      });
    }
    if (!Array.isArray(learningStyle.materials) || learningStyle.materials.length === 0) {
      errors.push({
        field: 'learningStyle.materials',
        message: 'Vui lòng chọn loại tài liệu học tập yêu thích (Q13)',
      });
    }
    if (!isValidObjectId(learningStyle.interactionLevel)) {
      errors.push({
        field: 'learningStyle.interactionLevel',
        message: 'Vui lòng chọn mức độ tương tác mong muốn (Q14)',
      });
    }

    // 3. Mandatory Q15, Q16, Q17, Q18
    if (
      !Array.isArray(schedulePreferences.timeBands) ||
      schedulePreferences.timeBands.length === 0
    ) {
      errors.push({
        field: 'schedulePreferences.timeBands',
        message: 'Vui lòng chọn khung thời gian có thể học (Q15)',
      });
    }
    if (!Array.isArray(schedulePreferences.weekdays) || schedulePreferences.weekdays.length === 0) {
      errors.push({
        field: 'schedulePreferences.weekdays',
        message: 'Vui lòng chọn các ngày trong tuần có thể học (Q16)',
      });
    }
    if (!schedulePreferences.sessionsPerWeek) {
      errors.push({
        field: 'schedulePreferences.sessionsPerWeek',
        message: 'Vui lòng chọn số buổi học mỗi tuần (Q17)',
      });
    }
    if (
      !Array.isArray(schedulePreferences.durationMinutes) ||
      schedulePreferences.durationMinutes.length === 0
    ) {
      errors.push({
        field: 'schedulePreferences.durationMinutes',
        message: 'Vui lòng chọn thời lượng mỗi buổi học (Q18)',
      });
    }

    // 4. Mandatory Q19, Q21 and conditional Q20
    if (!Array.isArray(constraints.modes) || constraints.modes.length === 0) {
      errors.push({
        field: 'constraints.modes',
        message: 'Vui lòng chọn hình thức học Online / Offline (Q19)',
      });
    } else {
      const isOfflineOrHybrid = await checkContainsOfflineOrHybrid(constraints.modes);
      if (isOfflineOrHybrid) {
        if (
          !Array.isArray(constraints.offlineLocations) ||
          constraints.offlineLocations.length === 0
        ) {
          errors.push({
            field: 'constraints.offlineLocations',
            message: 'Khi chọn hình thức Offline hoặc Kết hợp, vui lòng chọn địa điểm học (Q20)',
          });
        }
      }
    }

    if (constraints.budgetRangeId) {
      if (!LEARNER_BUDGET_RANGES[constraints.budgetRangeId]) {
        errors.push({
          field: 'constraints.budgetRangeId',
          message: 'Mức ngân sách lựa chọn không hợp lệ (Q21)',
        });
      } else {
        constraints.budgetMin = LEARNER_BUDGET_RANGES[constraints.budgetRangeId].min;
        constraints.budgetMax = LEARNER_BUDGET_RANGES[constraints.budgetRangeId].max;
      }
    } else if (constraints.budgetMax === undefined || constraints.budgetMax <= 0) {
      errors.push({
        field: 'constraints.budget',
        message: 'Vui lòng chọn hoặc nhập ngân sách cho một buổi học (Q21)',
      });
    }

    // 5. Mandatory Q22, Q23, Q24
    if (
      !Array.isArray(tutorRequirements.selectionPriorities) ||
      tutorRequirements.selectionPriorities.length === 0
    ) {
      errors.push({
        field: 'tutorRequirements.selectionPriorities',
        message: 'Vui lòng chọn các yếu tố ưu tiên khi chọn gia sư (Q22)',
      });
    } else if (tutorRequirements.selectionPriorities.length > 3) {
      errors.push({
        field: 'tutorRequirements.selectionPriorities',
        message: 'Chỉ được chọn tối đa 3 yếu tố ưu tiên (Q22)',
      });
    }

    if (
      !tutorRequirements.experienceRange ||
      !ENUMS.EXPERIENCE_RANGE.includes(tutorRequirements.experienceRange)
    ) {
      errors.push({
        field: 'tutorRequirements.experienceRange',
        message: 'Vui lòng chọn yêu cầu số năm kinh nghiệm gia sư (Q23)',
      });
    }

    if (
      !tutorRequirements.certificateRequirement ||
      !ENUMS.CERTIFICATE_REQUIREMENT.includes(tutorRequirements.certificateRequirement)
    ) {
      errors.push({
        field: 'tutorRequirements.certificateRequirement',
        message: 'Vui lòng chọn yêu cầu về chứng chỉ / bằng cấp (Q24)',
      });
    }

    // 6. Mandatory Q25, Q26, Q27
    if (!Array.isArray(supportNeeds.difficulties) || supportNeeds.difficulties.length === 0) {
      errors.push({
        field: 'supportNeeds.difficulties',
        message: 'Vui lòng chọn khó khăn lớn nhất của bạn khi học (Q25)',
      });
    }
    if (!Array.isArray(supportNeeds.desiredSupport) || supportNeeds.desiredSupport.length === 0) {
      errors.push({
        field: 'supportNeeds.desiredSupport',
        message: 'Vui lòng chọn hoạt động bạn mong muốn gia sư hỗ trợ nhiều nhất (Q26)',
      });
    }
    if (!isValidObjectId(supportNeeds.progressTracking)) {
      errors.push({
        field: 'supportNeeds.progressTracking',
        message: 'Vui lòng chọn phương thức theo dõi tiến độ (Q27)',
      });
    }

    if (errors.length > 0) {
      return next(
        ApiError.badRequest('Vui lòng hoàn thành đầy đủ tất cả các câu hỏi bắt buộc', errors)
      );
    }

    // 7. Check Taxonomy Hierarchy Q1 -> Q2 -> Q3
    const hierarchyErrors = await validateHierarchy(
      learning.categoryId,
      learning.subjectIds,
      learning.topicIds
    );
    if (hierarchyErrors.length > 0) {
      return next(
        ApiError.badRequest('Phân cấp danh mục câu hỏi Q1 -> Q2 -> Q3 không khớp', hierarchyErrors)
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateUpdateLearnerPreference,
  validateCompleteLearnerPreference,
  validateHierarchy,
  checkContainsOfflineOrHybrid,
};
