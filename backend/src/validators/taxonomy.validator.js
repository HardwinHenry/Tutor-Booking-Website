const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');
const { ALL_TAXONOMY_TYPES } = require('../constants/taxonomyTypes');
const { ROLES } = require('../constants/roles');

/**
 * Validate MongoDB ObjectId param
 */
const validateTaxonomyIdParam = (req, res, next) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return next(ApiError.badRequest('ID danh mục không hợp lệ (phải là Mongo ObjectId hợp lệ)'));
  }

  next();
};

/**
 * Validate Questionnaire Role param
 */
const validateQuestionnaireRole = (req, res, next) => {
  const { role } = req.params;
  const allowedRoles = [ROLES.LEARNER, ROLES.TUTOR];

  if (!role || !allowedRoles.includes(role)) {
    return next(
      ApiError.badRequest(
        `Vai trò questionnaire không hợp lệ. Chỉ chấp nhận: [${allowedRoles.join(', ')}]`
      )
    );
  }

  next();
};

/**
 * Validate Create Taxonomy Request Body
 */
const validateCreateTaxonomy = (req, res, next) => {
  const { name, type, slug, parentId, active, sortOrder, description } = req.body;
  const errors = [];

  // Name validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Tên danh mục là bắt buộc' });
  } else if (name.trim().length > 150) {
    errors.push({ field: 'name', message: 'Tên danh mục không được vượt quá 150 ký tự' });
  }

  // Type validation
  if (!type || typeof type !== 'string' || !ALL_TAXONOMY_TYPES.includes(type)) {
    errors.push({
      field: 'type',
      message: `Loại danh mục (type) không hợp lệ. Chỉ chấp nhận: [${ALL_TAXONOMY_TYPES.join(', ')}]`,
    });
  }

  // Slug validation (optional, can be generated)
  if (slug !== undefined && slug !== null) {
    if (typeof slug !== 'string' || slug.trim().length === 0) {
      errors.push({ field: 'slug', message: 'Slug không hợp lệ' });
    }
  }

  // ParentId validation (optional)
  if (parentId !== undefined && parentId !== null && parentId !== '') {
    if (!mongoose.Types.ObjectId.isValid(parentId)) {
      errors.push({ field: 'parentId', message: 'Parent ID phải là MongoDB ObjectId hợp lệ' });
    }
  }

  // Active validation (optional)
  if (active !== undefined && typeof active !== 'boolean') {
    errors.push({ field: 'active', message: 'Trường active phải là kiểu boolean' });
  }

  // SortOrder validation (optional)
  if (sortOrder !== undefined && typeof sortOrder !== 'number') {
    errors.push({ field: 'sortOrder', message: 'Trường sortOrder phải là kiểu số' });
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Dữ liệu tạo danh mục không hợp lệ', errors));
  }

  req.body.name = name.trim();
  if (slug) req.body.slug = slug.trim().toLowerCase();
  if (description) req.body.description = description.trim();

  next();
};

/**
 * Validate Update Taxonomy Request Body
 */
const validateUpdateTaxonomy = (req, res, next) => {
  const { name, slug, parentId, active, sortOrder, description } = req.body;
  const errors = [];

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Tên danh mục không được để trống' });
    } else if (name.trim().length > 150) {
      errors.push({ field: 'name', message: 'Tên danh mục không được vượt quá 150 ký tự' });
    }
  }

  if (slug !== undefined) {
    if (typeof slug !== 'string' || slug.trim().length === 0) {
      errors.push({ field: 'slug', message: 'Slug không được để trống' });
    }
  }

  if (parentId !== undefined && parentId !== null && parentId !== '') {
    if (!mongoose.Types.ObjectId.isValid(parentId)) {
      errors.push({ field: 'parentId', message: 'Parent ID phải là MongoDB ObjectId hợp lệ' });
    }
  }

  if (active !== undefined && typeof active !== 'boolean') {
    errors.push({ field: 'active', message: 'Trường active phải là kiểu boolean' });
  }

  if (sortOrder !== undefined && typeof sortOrder !== 'number') {
    errors.push({ field: 'sortOrder', message: 'Trường sortOrder phải là kiểu số' });
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Dữ liệu cập nhật danh mục không hợp lệ', errors));
  }

  if (name) req.body.name = name.trim();
  if (slug) req.body.slug = slug.trim().toLowerCase();
  if (description) req.body.description = description.trim();

  next();
};

module.exports = {
  validateTaxonomyIdParam,
  validateQuestionnaireRole,
  validateCreateTaxonomy,
  validateUpdateTaxonomy,
};
