const mongoose = require('mongoose');

const recommendationLogSchema = new mongoose.Schema(
  {
    learnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    algorithmVersion: {
      type: String,
      required: true,
    },
    filtersApplied: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    topRecommendations: [
      {
        tutorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        tutorProfileId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'TutorProfile',
        },
        matchScore: Number,
        rank: Number,
      },
    ],
    totalCandidatesEvaluated: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

recommendationLogSchema.index({ learnerId: 1, createdAt: -1 });

const RecommendationLog = mongoose.model('RecommendationLog', recommendationLogSchema);

module.exports = RecommendationLog;
