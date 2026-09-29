/** Default page size for admin list endpoints */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Parse page and limit from request query.
 * @param {object} query - req.query
 * @returns {{ page: number, limit: number, skip: number }}
 */
export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Build pagination meta for response.
 * @param {number} page
 * @param {number} limit
 * @param {number} total
 */
export function buildPaginationMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
