const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'ID booking (bookingId) là bắt buộc'],
      unique: true,
      index: true,
    },
    learnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Học viên (learnerId) là bắt buộc'],
      index: true,
    },
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Gia sư (tutorId) là bắt buộc'],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Điểm đánh giá (rating) là bắt buộc'],
      min: [1, 'Điểm đánh giá tối thiểu là 1 sao'],
      max: [5, 'Điểm đánh giá tối đa là 5 sao'],
      validate: {
        validator: Number.isInteger,
        message: 'Điểm đánh giá phải là số nguyên từ 1 đến 5',
      },
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Nội dung đánh giá không vượt quá 1000 ký tự'],
      default: '',
    },
    tutorResponse: {
      comment: {
        type: String,
        trim: true,
        maxlength: [1000, 'Phản hồi của gia sư không vượt quá 1000 ký tự'],
        default: null,
      },
      respondedAt: {
        type: Date,
        default: null,
      },
    },
    isPublic: {
      type: Boolean,
      default: true,
      index: true,
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

// Compound indexes for optimal queries and sorting
reviewSchema.index({ tutorId: 1, isPublic: 1, createdAt: -1 });
reviewSchema.index({ learnerId: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
