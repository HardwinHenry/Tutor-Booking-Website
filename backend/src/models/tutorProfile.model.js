const mongoose = require('mongoose');
const {
  COMPLETION_STATUS,
  ALL_COMPLETION_STATUSES,
  APPROVAL_STATUS,
  ALL_APPROVAL_STATUSES,
} = require('../constants/profileStatus');
const { QUESTIONNAIRE_VERSION } = require('../constants/questionnaire.config');

const qualificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tên chứng chỉ / bằng cấp là bắt buộc'],
      trim: true,
      maxlength: [200, 'Tên chứng chỉ không vượt quá 200 ký tự'],
    },
    issuer: {
      type: String,
      trim: true,
      default: '',
      maxlength: [200, 'Đơn vị cấp không vượt quá 200 ký tự'],
    },
    issueYear: {
      type: Number,
      default: null,
    },
    credentialUrl: {
      type: String,
      trim: true,
      default: '',
    },
    certificateType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Taxonomy',
      default: null,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const tutorProfileSchema = new mongoose.Schema(
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
    approvalStatus: {
      type: String,
      enum: {
        values: ALL_APPROVAL_STATUSES,
        message: 'Trạng thái phê duyệt {VALUE} không hợp lệ',
      },
      default: APPROVAL_STATUS.PENDING,
      index: true,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    expertise: {
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
    },
    teachingCapabilities: {
      supportedPurposes: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Taxonomy',
        },
      ],
      teachableLevels: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Taxonomy',
        },
      ],
      supportedTargetLevels: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Taxonomy',
        },
      ],
      supportedGoalTags: [
        {
          type: String,
          trim: true,
        },
      ],
      estimatedDurationRanges: [
        {
          type: String,
        },
      ],
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
      classFormats: [
        {
          type: String,
        },
      ],
      styles: [
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
      maxSessionsPerWeek: {
        type: String,
        default: null,
      },
      sessionDurationsMinutes: [
        {
          type: mongoose.Schema.Types.Mixed,
        },
      ],
    },
    teachingConditions: {
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
      serviceAreas: [
        {
          type: String,
          trim: true,
        },
      ],
      travelRadiusKm: {
        type: Number,
        default: null,
      },
      priceRangeId: {
        type: String,
        default: null,
      },
      priceMin: {
        type: Number,
        default: 0,
      },
      priceMax: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: 'VND',
      },
      isNegotiable: {
        type: Boolean,
        default: false,
      },
    },
    experienceRange: {
      type: String,
      default: null,
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    qualifications: [qualificationSchema],
    supportApproaches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Taxonomy',
      },
    ],
    availableSupport: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Taxonomy',
      },
    ],
    assessmentMethods: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Taxonomy',
      },
    ],
    introduction: {
      type: String,
      trim: true,
      maxlength: [2000, 'Giới thiệu bản thân không vượt quá 2000 ký tự'],
      default: '',
    },
    ratingSummary: {
      averageRating: {
        type: Number,
        default: null,
      },
      reviewCount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    submittedAt: {
      type: Date,
      default: null,
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

// Compound and auxiliary indexes for search, filtering, and admin workflows
tutorProfileSchema.index({ approvalStatus: 1, completionStatus: 1 });
tutorProfileSchema.index({ 'expertise.categoryId': 1, approvalStatus: 1 });
tutorProfileSchema.index({ 'expertise.subjectIds': 1, approvalStatus: 1 });
tutorProfileSchema.index({ 'teachingConditions.priceMin': 1, 'teachingConditions.priceMax': 1 });
tutorProfileSchema.index({ 'ratingSummary.averageRating': -1 });
tutorProfileSchema.index({ submittedAt: -1 });

const TutorProfile = mongoose.model('TutorProfile', tutorProfileSchema);

module.exports = TutorProfile;
