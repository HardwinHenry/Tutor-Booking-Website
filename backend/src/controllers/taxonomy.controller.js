const taxonomyService = require('../services/taxonomy.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/taxonomies
 * Retrieve taxonomies with filters (type, parentId, active, search)
 */
const getTaxonomies = asyncHandler(async (req, res) => {
  const result = await taxonomyService.getTaxonomies(req.query);
  return ApiResponse.ok(res, result, 'Lấy danh sách danh mục thành công');
});

/**
 * GET /api/taxonomies/:id
 * Retrieve specific taxonomy detail
 */
const getTaxonomyById = asyncHandler(async (req, res) => {
  const item = await taxonomyService.getTaxonomyById(req.params.id);
  return ApiResponse.ok(res, { item }, 'Lấy chi tiết danh mục thành công');
});

/**
 * GET /api/taxonomies/:id/children
 * Retrieve immediate child taxonomies for cascading selection (Category -> Subjects -> Topics)
 */
const getChildren = asyncHandler(async (req, res) => {
  const activeOnly = req.query.active !== 'false';
  const result = await taxonomyService.getChildren(req.params.id, { activeOnly });
  return ApiResponse.ok(res, result, 'Lấy danh mục con thành công');
});

/**
 * GET /api/tags
 * Convenience alias for general tags and taxonomies
 */
const getTags = asyncHandler(async (req, res) => {
  const query = { ...req.query };
  const result = await taxonomyService.getTaxonomies(query);
  return ApiResponse.ok(res, result, 'Lấy danh sách tags thành công');
});

/**
 * POST /api/admin/taxonomies
 * Create new taxonomy (Admin only)
 */
const createTaxonomy = asyncHandler(async (req, res) => {
  const item = await taxonomyService.createTaxonomy(req.body);
  return ApiResponse.created(res, { item }, 'Tạo danh mục mới thành công');
});

/**
 * PATCH /api/admin/taxonomies/:id
 * Update or soft-deactivate taxonomy (Admin only)
 */
const updateTaxonomy = asyncHandler(async (req, res) => {
  const item = await taxonomyService.updateTaxonomy(req.params.id, req.body);
  return ApiResponse.ok(res, { item }, 'Cập nhật danh mục thành công');
});

module.exports = {
  getTaxonomies,
  getTaxonomyById,
  getChildren,
  getTags,
  createTaxonomy,
  updateTaxonomy,
};
