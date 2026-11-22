const mongoose = require('mongoose');
const { COMPLETION_STATUS, ALL_COMPLETION_STATUSES } = require('../constants/profileStatus');
const { QUESTIONNAIRE_VERSION } = require('../constants/questionnaire.config');

const learnerPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID là bắt buộc'],
      unique: true,
      index: true,
    },
    questionnaireVersion: {
      type: String,
      default: QUESTIONNAIRE_VERSION,
    },
    completionStatus: {
      type: String,
      enum: {
        values: ALL_COMPLETION_STATUSES,
        message: 'Trạng thái hoàn thành {VALUE} không hợp lệ',
      },
      default: COMPLETION_STATUS.NOT_STARTED,
      index: true,
    },
    learning: {
      categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Taxonomy',
        default: null,
      },
      subjectIds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Taxonomy',
        },
      ],
      topicIds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Taxonomy',
        },
      ],
      purposes: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Taxonomy',
        },
      ],
      currentLevel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Taxonomy',
        default: null,
      },
      targetLevel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Taxonomy',
        default: null,
      },
      goalText: {
        type: String,
        trim: true,
        maxlength: [500, 'Mục tiêu cụ thể không vượt quá 500 ký tự'],
        default: '',
      },
      goalTags: [
        {
          type: String,
          trim: true,
        },
      ],
      targetDuration: {
        type: String,
        default: null,
      },
    },
    learningStyle: {
      methods: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Taxonomy',
        },
      ],
      pace: {
        type: String,
        default: null,
      },
      classFormat: {
        type: String,
        default: null,
      },
      preferredTutorStyles: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Taxonomy',
        },
      ],
      materials: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Taxonomy',
        },
      ],
      interactionLevel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Taxonomy',
        default: null,
      },
    },
    schedulePreferences: {
      timeBands: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Taxonomy',
        },
      ],
      weekdays: [
        {
          type: Number,
          min: 0,
          max: 6,
        },
      ],
      sessionsPerWeek: {
        type: Number,
        default: null,
      },
      durationMinutes: [
        {
          type: mongoose.Schema.Types.Mixed,
        },
      ],
    },
    constraints: {
      modes: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Taxonomy',
        },
      ],
      offlineLocations: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Taxonomy',
        },
      ],
      budgetRangeId: {
        type: String,
        default: null,
      },
      budgetMin: {
        type: Number,
        default: 0,
      },
      budgetMax: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: 'VND',
      },
      area: {
        type: String,
        trim: true,
        default: null,
      },
    },
    tutorRequirements: {
      selectionPriorities: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Taxonomy',
        },
      ],
      experienceRange: {
        type: String,
        default: null,
      },
      certificateRequirement: {
        type: String,
        default: null,
      },
    },
    supportNeeds: {
      difficulties: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Taxonomy',
        },
      ],
      desiredSupport: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Taxonomy',
        },
      ],
      progressTracking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Taxonomy',
        default: null,
      },
    },
    additionalNote: {
      type: String,
      trim: true,
      maxlength: [1000, 'Ghi chú thêm không vượt quá 1000 ký tự'],
      default: '',
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

const LearnerPreference = mongoose.model('LearnerPreference', learnerPreferenceSchema);

module.exports = LearnerPreference;
