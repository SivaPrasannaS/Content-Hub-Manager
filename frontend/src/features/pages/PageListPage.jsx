import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import pagesAPI from './pagesAPI';
import { useRBAC } from '../../hooks/useRBAC';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/dateUtils';
import { truncateText } from '../../utils/textUtils';

function PageTable({ heading, items, actionLabel, onAction, actionInProgressId }) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body p-0">
        <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom">
          <h2 className="h5 mb-0">{heading}</h2>
          <span className="badge text-bg-secondary">{items.length}</span>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Author</th>
                <th scope="col">Updated</th>
                {actionLabel && <th scope="col" className="text-end">Action</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((page) => (
                <tr key={page.id}>
                  <td>
                    <div className="fw-semibold">{page.title}</div>
                    <div className="text-secondary small">{truncateText(page.body)}</div>
                  </td>
                  <td>{page.authorUsername}</td>
                  <td>{formatDate(page.updatedAt)}</td>
                  {actionLabel && (
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-dark"
                        onClick={() => onAction(page)}
                        disabled={actionInProgressId === page.id}
                      >
                        {actionInProgressId === page.id ? 'Publishing...' : actionLabel}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={actionLabel ? '4' : '3'} className="text-center text-secondary py-4">No records available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function PageListPage() {
  const { can } = useRBAC();
  const toast = useToast();
  const [publishedPages, setPublishedPages] = useState([]);
  const [draftPages, setDraftPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [publishInProgressId, setPublishInProgressId] = useState(null);
  const publishedPagination = usePagination(1, 3);
  const draftPagination = usePagination(1, 3);
  const canManagePages = can('page:manage');

  useEffect(() => {
    let active = true;

    const loadPages = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = canManagePages
          ? await pagesAPI.list()
          : await pagesAPI.list({ status: 'PUBLISHED' });
        if (!active) {
          return;
        }

        const items = Array.isArray(response) ? response : [];

        setPublishedPages(items.filter((page) => page.status === 'PUBLISHED'));
        setDraftPages(items.filter((page) => page.status === 'DRAFT'));
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError.response?.data?.message || 'Unable to fetch pages');
        setPublishedPages([]);
        setDraftPages([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPages();

    return () => {
      active = false;
    };
  }, [canManagePages]);

  const publishedItems = publishedPagination.paginate(publishedPages);
  const draftItems = draftPagination.paginate(draftPages);

  const handlePublish = async (page) => {
    setPublishInProgressId(page.id);
    try {
      const publishedPage = await pagesAPI.publish(page.id);
      setDraftPages((currentDraftPages) => currentDraftPages.filter((item) => item.id !== page.id));
      setPublishedPages((currentPublishedPages) => [publishedPage, ...currentPublishedPages.filter((item) => item.id !== publishedPage.id)]);
      toast.success('Page published successfully');
    } catch (publishError) {
      toast.error(publishError.response?.data?.message || 'Unable to publish page');
    } finally {
      setPublishInProgressId(null);
    }
  };

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 fw-bold mb-0">Pages</h1>
        {canManagePages && <Link to="/pages/new" className="btn btn-dark">Create Page</Link>}
      </div>
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : error ? (
        <div className="alert alert-danger text-center">{error}</div>
      ) : (
        <div className="row g-4">
          <div className={canManagePages ? 'col-12 col-xl-6' : 'col-12'}>
            <PageTable heading="Published Pages" items={publishedItems} />
            <div className="mt-3">
              <Pagination
                currentPage={publishedPagination.currentPage}
                totalPages={publishedPagination.totalPages(publishedPages.length)}
                onPageChange={publishedPagination.setCurrentPage}
              />
            </div>
          </div>
          {canManagePages && (
            <div className="col-12 col-xl-6">
              <PageTable
                heading="Draft Pages"
                items={draftItems}
                actionLabel="Publish"
                onAction={handlePublish}
                actionInProgressId={publishInProgressId}
              />
              <div className="mt-3">
                <Pagination
                  currentPage={draftPagination.currentPage}
                  totalPages={draftPagination.totalPages(draftPages.length)}
                  onPageChange={draftPagination.setCurrentPage}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}