import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { fetchAnalytics } from './analyticsSlice';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

export default function AnalyticsDashboard() {
  const dispatch = useDispatch();
  const { summary, monthly, byCategory, loading } = useSelector((state) => state.analytics);
  const { currentPage, setCurrentPage, paginate, totalPages } = usePagination(1, 5);

  useEffect(() => {
    dispatch(fetchAnalytics());
  }, [dispatch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [byCategory.length, setCurrentPage]);

  if (loading || !summary) {
    return <LoadingSkeleton count={3} />;
  }

  const pagedByCategory = paginate(byCategory);

  return (
    <section>
      <h1 className="h2 fw-bold mb-4">Analytics Dashboard</h1>
      <div className="row g-4 mb-4">
        {[
          ['Total Articles', summary.totalArticles],
          ['Published', summary.publishedArticles],
          ['Drafts', summary.draftArticles],
          ['Media Assets', summary.totalMedia]
        ].map(([label, value]) => (
          <div className="col-12 col-md-6 col-xl-3" key={label}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-secondary small text-uppercase">{label}</div>
                <div className="display-6 fw-bold">{value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="row g-4">
        <div className="col-12 col-xl-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h2 className="h4 fw-bold">Monthly Activity</h2>
              <ul className="list-group list-group-flush">
                {monthly.map((item) => (
                  <li key={item.month} className="list-group-item d-flex justify-content-between px-0">
                    <span>{item.month}</span>
                    <strong>{item.count}</strong>
                  </li>
                ))}
                {!monthly.length && <li className="list-group-item px-0 text-secondary text-center">No records available</li>}
              </ul>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h2 className="h4 fw-bold">By Category</h2>
              <ul className="list-group list-group-flush">
                {pagedByCategory.map((item) => (
                  <li key={item.categoryId} className="list-group-item d-flex justify-content-between px-0">
                    <span>{item.categoryName}</span>
                    <strong>{item.count}</strong>
                  </li>
                ))}
                {!byCategory.length && <li className="list-group-item px-0 text-secondary text-center">No records available</li>}
              </ul>
              <div className="mt-3">
                <Pagination currentPage={currentPage} totalPages={totalPages(byCategory.length)} onPageChange={setCurrentPage} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}