
export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const visiblePageCount = 3;

  let startPage = Math.max(1, safeCurrentPage - 1);
  let endPage = Math.min(safeTotalPages, startPage + visiblePageCount - 1);

  startPage = Math.max(1, endPage - visiblePageCount + 1);

  const pages = Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);

  const handlePrevious = () => {
    if (safeCurrentPage > 1) {
      onPageChange(safeCurrentPage - 1);
    }
  };

  const handleNext = () => {
    if (safeCurrentPage < safeTotalPages) {
      onPageChange(safeCurrentPage + 1);
    }
  };

  return (
    <nav aria-label="Pagination">
      <ul className="pagination justify-content-center">
        <li className={`page-item ${safeCurrentPage === 1 ? 'disabled' : ''}`}>
          <button
            type="button"
            className="page-link"
            onClick={handlePrevious}
            disabled={safeCurrentPage === 1}
            aria-label="Previous page"
          >
            Previous
          </button>
        </li>
        {pages.map((page) => (
          <li key={page} className={`page-item ${page === safeCurrentPage ? 'active' : ''}`}>
            <button type="button" className="page-link" onClick={() => onPageChange(page)}>
              {page}
            </button>
          </li>
        ))}
        <li className={`page-item ${safeCurrentPage === safeTotalPages ? 'disabled' : ''}`}>
          <button
            type="button"
            className="page-link"
            onClick={handleNext}
            disabled={safeCurrentPage === safeTotalPages}
            aria-label="Next page"
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
}