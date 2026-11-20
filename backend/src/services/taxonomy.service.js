const mongoose = require('mongoose');
const Taxonomy = require('../models/taxonomy.model');
const ApiError = require('../utils/apiError');
const { slugify } = require('../utils/slug.util');

/**
 * Get all taxonomies with flexible filters
 */
const getTaxonomies = async (query = {}) => {
  const { type, parentId, active, search, page, limit } = query;
  const filter = {};

  if (type) {
    filter.type = type;
  }

  if (parentId !== undefined) {
    if (parentId === 'null' || parentId === null || parentId === '') {
      filter.parentId = null;
    } else if (mongoose.Types.ObjectId.isValid(parentId)) {
      filter.parentId = parentId;
    }
  }

  // If active is explicitly passed, parse it; otherwise default to active: true for public queries
  if (active !== undefined) {
    filter.active = active === 'true' || active === true;
  } else {
    filter.active = true;
  }

  if (search && typeof search === 'string') {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { slug: { $regex: escaped, $options: 'i' } },
    ];
  }

  const sort = { sortOrder: 1, name: 1 };

  if (page && limit) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Taxonomy.find(filter).sort(sort).skip(skip).limit(limitNum),
      Taxonomy.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  const items = await Taxonomy.find(filter).sort(sort);
  return { items };
};

/**
 * Get taxonomy by ID
 */
const getTaxonomyById = async (id) => {
  const item = await Taxonomy.findById(id).populate('parentId', 'name slug type');
  if (!item) {
    throw ApiError.notFound('Danh mục không tồn tại');
  }
  return item;
};

/**
 * Get direct children of a taxonomy (e.g. category -> subjects, subject -> topics)
 */
const getChildren = async (parentId, { activeOnly = true } = {}) => {
  // Verify parent exists
  const parent = await Taxonomy.findById(parentId);
  if (!parent) {
    throw ApiError.notFound('Danh mục cha không tồn tại');
  }

  const filter = {
    parentId,
    ...(activeOnly ? { active: true } : {}),
  };

  const items = await Taxonomy.find(filter).sort({ sortOrder: 1, name: 1 });
  return { parent, children: items };
};

/**
 * Create a new taxonomy entry (Admin only)
 */
const createTaxonomy = async (data) => {
  const {
    name,
    type,
    parentId = null,
    description = '',
    active = true,
    sortOrder = 0,
    metadata = {},
  } = data;
  let { slug } = data;

  if (!slug) {
    slug = slugify(name);
  }

  // Validate parent if provided
  let parentDoc = null;
  if (parentId) {
    parentDoc = await Taxonomy.findById(parentId);
    if (!parentDoc) {
      throw ApiError.badRequest('Danh mục cha được chỉ định không tồn tại');
    }
  }

  // Check unique collision
  const existing = await Taxonomy.findOne({
    type,
    slug,
    parentId: parentId || null,
  });

  if (existing) {
    throw ApiError.conflict(
      `Danh mục với loại "${type}" và slug "${slug}" đã tồn tại trong cùng cấp phân cấp`
    );
  }

  const taxonomy = await Taxonomy.create({
    name,
    slug,
    type,
    parentId: parentId || null,
    description,
    active,
    sortOrder,
    metadata,
  });

  return taxonomy;
};

/**
 * Update taxonomy (Admin only)
 * Note: Soft deactivation (active: false) is preferred over hard delete to preserve relationships.
 */
const updateTaxonomy = async (id, updateData) => {
  const taxonomy = await Taxonomy.findById(id);
  if (!taxonomy) {
    throw ApiError.notFound('Danh mục cần cập nhật không tồn tại');
  }

  // If changing parentId
  if (updateData.parentId !== undefined) {
    if (updateData.parentId === id) {
      throw ApiError.badRequest('Một danh mục không thể làm cha của chính nó');
    }

    if (updateData.parentId) {
      const parent = await Taxonomy.findById(updateData.parentId);
      if (!parent) {
        throw ApiError.badRequest('Danh mục cha mới không tồn tại');
      }
    }
  }

  // If slug or type changed, check conflict
  const targetType = updateData.type || taxonomy.type;
  const targetSlug = updateData.slug || taxonomy.slug;
  const targetParent =
    updateData.parentId !== undefined ? updateData.parentId || null : taxonomy.parentId;

  if (
    targetSlug !== taxonomy.slug ||
    targetType !== taxonomy.type ||
    String(targetParent) !== String(taxonomy.parentId)
  ) {
    const conflict = await Taxonomy.findOne({
      _id: { $ne: id },
      type: targetType,
      slug: targetSlug,
      parentId: targetParent,
    });
    if (conflict) {
      throw ApiError.conflict('Slug và loại này đã bị trùng với một danh mục khác ở cùng cấp');
    }
  }

  // Apply updates
  Object.assign(taxonomy, updateData);
  await taxonomy.save();

  return taxonomy;
};

/**
 * Validate an array of taxonomy IDs for Phase 4 onboarding and matching
 */
const validateTaxonomyIds = async (ids = [], expectedType = null, allowInactive = false) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { valid: true, invalidIds: [] };
  }

  const query = {
    _id: { $in: ids },
    ...(expectedType ? { type: expectedType } : {}),
    ...(allowInactive ? {} : { active: true }),
  };

  const foundDocs = await Taxonomy.find(query).select('_id');
  const foundIdStrings = new Set(foundDocs.map((d) => d._id.toString()));

  const invalidIds = ids.filter((id) => !foundIdStrings.has(id.toString()));

  return {
    valid: invalidIds.length === 0,
    invalidIds,
    foundDocs,
  };
};

module.exports = {
  getTaxonomies,
  getTaxonomyById,
  getChildren,
  createTaxonomy,
  updateTaxonomy,
  validateTaxonomyIds,
};
