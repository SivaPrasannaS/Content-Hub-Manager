import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteMedia, fetchMedia } from './mediaSlice';
import SearchBar from '../../components/common/SearchBar';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ConfirmModal from '../../components/common/ConfirmModal';
import MediaUploadForm from './MediaUploadForm';
import useSearch from '../../hooks/useSearch';
import { useRBAC } from '../../hooks/useRBAC';
import { useToast } from '../../hooks/useToast';

export default function MediaLibraryPage() {
  const dispatch = useDispatch();
  const toast = useToast();
  const { items, loading } = useSelector((state) => state.media);
  const { query, setQuery, filtered } = useSearch(items, (media) => media.filename);
  const { canDeleteMedia } = useRBAC();
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    dispatch(fetchMedia());
  }, [dispatch]);

  const handleDelete = async () => {
    const result = await dispatch(deleteMedia(confirmId));
    if (!result.error) {
      toast.success('Media removed successfully');
    } else {
      toast.error(result.payload);
    }
    setConfirmId(null);
  };

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 fw-bold mb-0">Media Library</h1>
      </div>
      <MediaUploadForm />
      <div className="mb-4">
        <SearchBar value={query} onChange={setQuery} placeholder="Search media by filename" />
      </div>
      {loading ? (
        <LoadingSkeleton count={4} />
      ) : (
        <div className="row g-4">
          {filtered.map((media) => (
            <div key={media.id} className="col-12 col-md-6 col-xl-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h2 className="h5">{media.filename}</h2>
                  <p className="text-secondary mb-2">{media.mediaType} · {media.size} bytes</p>
                  <a href={media.url} className="btn btn-outline-dark btn-sm me-2">Open</a>
                  {canDeleteMedia(media) && (
                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => setConfirmId(media.id)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!filtered.length && <div className="col-12"><div className="alert alert-info text-center">No records available</div></div>}
        </div>
      )}
      <ConfirmModal
        show={Boolean(confirmId)}
        title="Delete media"
        message="This action cannot be undone. Continue?"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </section>
  );
}