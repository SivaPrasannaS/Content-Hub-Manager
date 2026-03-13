import { useEffect, useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import FormInput from '../../components/forms/FormInput';
import FormTextarea from '../../components/forms/FormTextarea';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { categorySchema } from '../../utils/validators';
import { truncateText } from '../../utils/textUtils';
import { deleteCategory, fetchCategories, saveCategory } from './categoriesSlice';
import { useToast } from '../../hooks/useToast';

export default function CategoryManagerPage() {
  const dispatch = useDispatch();
  const toast = useToast();
  const { items, loading } = useSelector((state) => state.categories);
  const [confirmId, setConfirmId] = useState(null);
  const { currentPage, setCurrentPage, paginate, totalPages } = usePagination(1, 5);
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: { name: '', description: '' },
    resolver: yupResolver(categorySchema)
  });

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [items.length, setCurrentPage]);

  const pagedItems = paginate(items);

  const onSubmit = async (values) => {
    const result = await dispatch(saveCategory({ values }));
    if (!result.error) {
      toast.success('Category saved successfully');
      reset();
    } else {
      toast.error(result.payload);
    }
  };

  const onDelete = async () => {
    const result = await dispatch(deleteCategory(confirmId));
    if (!result.error) {
      toast.success('Category deleted successfully');
    } else {
      toast.error(result.payload);
    }
    setConfirmId(null);
  };

  return (
    <section>
      <div className="row g-4">
        <div className="col-12 col-xl-5">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h1 className="h3 fw-bold mb-4">Category Manager</h1>
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <FormInput label="Name" name="name" register={register} error={errors.name} />
                <FormTextarea label="Description" name="description" register={register} error={errors.description} rows={4} />
                <button type="submit" className="btn btn-dark" disabled={loading}>
                  {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                  Save Category
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-7">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h2 className="h4 fw-bold mb-3">Existing Categories</h2>
              <div className="list-group">
                {pagedItems.map((category) => (
                  <div key={category.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold">{category.name}</div>
                      <small className="text-secondary">{truncateText(category.description)}</small>
                    </div>
                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => setConfirmId(category.id)}>
                      Delete
                    </button>
                  </div>
                ))}
                {!items.length && <div className="list-group-item text-secondary text-center py-4">No records available</div>}
              </div>
              <div className="mt-3">
                <Pagination currentPage={currentPage} totalPages={totalPages(items.length)} onPageChange={setCurrentPage} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal
        show={Boolean(confirmId)}
        title="Delete category"
        message="Deleting this category may affect article organization. Continue?"
        onConfirm={onDelete}
        onCancel={() => setConfirmId(null)}
      />
    </section>
  );
}