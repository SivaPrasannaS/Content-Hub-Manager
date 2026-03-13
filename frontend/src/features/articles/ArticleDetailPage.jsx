import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchArticleById } from './articlesSlice';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { useRBAC } from '../../hooks/useRBAC';
import { formatDate } from '../../utils/dateUtils';

export default function ArticleDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { selected, loading } = useSelector((state) => state.articles);
  const { canEditArticle } = useRBAC();

  useEffect(() => {
    dispatch(fetchArticleById(id));
  }, [dispatch, id]);

  if (loading || !selected) {
    return <LoadingSkeleton count={1} height="10rem" />;
  }

  return (
    <article className="card border-0 shadow-sm">
      <div className="card-body p-4 p-md-5">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">
          <div>
            <span className="badge text-bg-warning mb-2">{selected.categoryName}</span>
            <h1 className="display-6 fw-bold">{selected.title}</h1>
          </div>
          {canEditArticle(selected) && <Link to={`/articles/${selected.id}/edit`} className="btn btn-dark align-self-start">Edit</Link>}
        </div>
        <p className="text-secondary">By {selected.authorUsername} · {formatDate(selected.publishedAt)}</p>
        <div className="fs-5 lh-lg">{selected.body}</div>
      </div>
    </article>
  );
}