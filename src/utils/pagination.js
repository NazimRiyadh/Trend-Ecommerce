export const getPagination = (page, limit) => {
  const pageNumber = parseInt(page, 10) || 1;
  const limitNumber = parseInt(limit, 10) || 10;
  
  const skip = (pageNumber - 1) * limitNumber;

  return { limit: limitNumber, skip, page: pageNumber };
};

export const getPagingData = (totalItems, page, limit) => {
  const totalPages = Math.ceil(totalItems / limit);
  
  return {
    totalItems,
    totalPages,
    currentPage: page,
    itemsPerPage: limit
  };
};
