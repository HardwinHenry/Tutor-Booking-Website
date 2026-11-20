const mongoose = require('mongoose');
const { ALL_TAXONOMY_TYPES } = require('../constants/taxonomyTypes');
const { slugify } = require('../utils/slug.util');

const taxonomySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên danh mục là bắt buộc'],
      trim: true,
      maxlength: [150, 'Tên danh mục không quá 150 ký tự'],
    },
    slug: {
      type: String,
      required: [true, 'Slug danh mục là bắt buộc'],
      trim: true,
      lowercase: true,
    },
    type: {
      type: String,
      required: [true, 'Loại danh mục (type) là bắt buộc'],
      enum: {
        values: ALL_TAXONOMY_TYPES,
        message: 'Loại danh mục {VALUE} không hợp lệ',
      },
      index: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Taxonomy',
      default: null,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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

// Compound index to ensure uniqueness per type + parentId + slug
taxonomySchema.index({ type: 1, slug: 1, parentId: 1 }, { unique: true });
taxonomySchema.index({ type: 1, active: 1, sortOrder: 1 });
taxonomySchema.index({ parentId: 1, active: 1, sortOrder: 1 });

// Automatically compute slug before validation if not provided
taxonomySchema.pre('validate', function () {
  if (this.name && !this.slug) {
    this.slug = slugify(this.name);
  }
});

const Taxonomy = mongoose.model('Taxonomy', taxonomySchema);

module.exports = Taxonomy;
