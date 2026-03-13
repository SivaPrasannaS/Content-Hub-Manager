import { useMemo, useState } from 'react';

export const usePagination = (initialPage = 1, pageSize = 6) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [perPage] = useState(pageSize);

  const paginate = (items = []) => {
    const startIndex = (currentPage - 1) * perPage;
    return items.slice(startIndex, startIndex + perPage);
  };

  const totalPages = (totalItems) => Math.max(1, Math.ceil(totalItems / perPage));

  return useMemo(() => ({ currentPage, setCurrentPage, perPage, paginate, totalPages }), [currentPage, perPage]);
};

export default usePagination;