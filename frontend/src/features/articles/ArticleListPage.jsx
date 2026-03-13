import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../categories/categoriesSlice';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import { formatDate } from '../../utils/dateUtils';
import { truncateText } from '../../utils/textUtils';
import usePagination from '../../hooks/usePagination';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useRBAC } from '../../hooks/useRBAC';
import articlesAPI from './articlesAPI';

function ArticleTable({ heading, items, emptyMessage, actionLabel, onAction, actionInProgressId, canRunAction }) {
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
                <th scope="col">Category</th>
                <th scope="col">Author</th>
                <th scope="col">Updated</th>
                <th scope="col" className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((article) => (
                <tr key={article.id}>
                  <td>
                    <div className="fw-semibold">{article.title}</div>
                    <div className="text-secondary small">{truncateText(article.excerpt || article.body)}</div>
                  </td>
                  <td>{article.categoryName}</td>
                  <td>{article.authorUsername}</td>
                  <td>{formatDate(article.updatedAt || article.publishedAt)}</td>
                  <td className="text-end">
                    {actionLabel && canRunAction?.(article) ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-dark"
                        onClick={() => onAction(article)}
                        disabled={actionInProgressId === article.id}
                      >
                        {actionInProgressId === article.id ? 'Publishing...' : actionLabel}
                      </button>
                    ) : (
                      <Link to={`/articles/${article.id}`} className="btn btn-sm btn-outline-dark">Open</Link>
                    )}
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan="5" className="text-center text-secondary py-4">{emptyMessage}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ArticleListPage() {
  const dispatch = useDispatch();
  const { items: categories } = useSelector((state) => state.categories);
  const { isAuthenticated } = useAuth();
  const { canPublishArticle } = useRBAC();
  const toast = useToast();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [query, setQuery] = useState('');
  const [publishedArticles, setPublishedArticles] = useState([]);
  const [draftArticles, setDraftArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [publishInProgressId, setPublishInProgressId] = useState(null);
  const publishedPagination = usePagination(1, 3);
  const draftPagination = usePagination(1, 3);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    let active = true;

    const loadArticles = async () => {
      setLoading(true);
      setError(null);
      try {
        const requests = [articlesAPI.list({ page: 0, size: 50, status: 'PUBLISHED' })];
        if (isAuthenticated) {
          requests.push(articlesAPI.list({ page: 0, size: 50, status: 'DRAFT' }));
        }

        const [publishedResponse, draftResponse] = await Promise.all(requests);
        if (!active) {
          return;
        }

        setPublishedArticles(publishedResponse.items || []);
        setDraftArticles(draftResponse?.items || []);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError.response?.data?.message || 'Unable to fetch articles');
        setPublishedArticles([]);
        setDraftArticles([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadArticles();

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const filterArticles = (items) => items.filter((article) => {
    const matchesQuery = !query || article.title.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = !selectedCategory || String(article.categoryId) === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  const publishedFiltered = useMemo(() => filterArticles(publishedArticles), [publishedArticles, query, selectedCategory]);
  const draftFiltered = useMemo(() => filterArticles(draftArticles), [draftArticles, query, selectedCategory]);

  useEffect(() => {
    publishedPagination.setCurrentPage(1);
    draftPagination.setCurrentPage(1);
  }, [query, selectedCategory]);

  const publishedItems = publishedPagination.paginate(publishedFiltered);
  const draftItems = draftPagination.paginate(draftFiltered);

  const handlePublish = async (article) => {
    setPublishInProgressId(article.id);
    try {
      const publishedArticle = await articlesAPI.publish(article.id);
      setDraftArticles((currentDraftArticles) => currentDraftArticles.filter((item) => item.id !== article.id));
      setPublishedArticles((currentPublishedArticles) => [publishedArticle, ...currentPublishedArticles.filter((item) => item.id !== publishedArticle.id)]);
      toast.success('Article published successfully');
    } catch (publishError) {
      toast.error(publishError.response?.data?.message || 'Unable to publish article');
    } finally {
      setPublishInProgressId(null);
    }
  };

  const draftSectionEnabled = isAuthenticated;

  const helperText = useMemo(() => {
    if (!selectedCategory) {
      return 'Browse published and draft content across the hub.';
    }
    const selected = categories.find((category) => String(category.id) === selectedCategory);
    return `Filtered to ${selected?.name || 'the selected category'} content.`;
  }, [categories, selectedCategory]);

  return (
    <section>
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">Articles</h1>
          <p className="text-secondary mb-0">{helperText}</p>
        </div>
        <Link to="/articles/new" className="btn btn-dark">Create Article</Link>
      </div>
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-8">
          <SearchBar value={query} onChange={setQuery} placeholder="Search articles by title" />
        </div>
        <div className="col-12 col-lg-4">
          <select className="form-select" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
      </div>
      {loading ? (
        <LoadingSkeleton count={4} />
      ) : error ? (
        <div className="alert alert-danger text-center">{error}</div>
      ) : (
        <div className="row g-4">
          <div className={draftSectionEnabled ? 'col-12 col-xl-6' : 'col-12'}>
            <ArticleTable heading="Published Articles" items={publishedItems} emptyMessage="No records available" />
            <div className="mt-3">
              <Pagination
                currentPage={publishedPagination.currentPage}
                totalPages={publishedPagination.totalPages(publishedFiltered.length)}
                onPageChange={publishedPagination.setCurrentPage}
              />
            </div>
          </div>
          {draftSectionEnabled && (
            <div className="col-12 col-xl-6">
              <ArticleTable
                heading="Draft Articles"
                items={draftItems}
                emptyMessage="No records available"
                actionLabel="Publish"
                onAction={handlePublish}
                actionInProgressId={publishInProgressId}
                canRunAction={canPublishArticle}
              />
              <div className="mt-3">
                <Pagination
                  currentPage={draftPagination.currentPage}
                  totalPages={draftPagination.totalPages(draftFiltered.length)}
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