function getPagination(query) {
  const page = Math.max(Number(query.page || 1), 1);
  const requestedLimit = Math.max(Number(query.limit || 50), 1);
  const limit = Math.min(requestedLimit, 500);
  const skip = (page - 1) * limit;

  return { page, limit, skip, take: limit };
}

function buildPaginatedResponse({ data, total, page, limit }) {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = { getPagination, buildPaginatedResponse };
