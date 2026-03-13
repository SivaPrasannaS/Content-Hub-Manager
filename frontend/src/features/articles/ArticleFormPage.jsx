import { useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import FormInput from '../../components/forms/FormInput';
import FormTextarea from '../../components/forms/FormTextarea';
import FormSelect from '../../components/forms/FormSelect';
import { articleSchema } from '../../utils/validators';
import { fetchArticleById, saveArticle } from './articlesSlice';
import { fetchCategories } from '../categories/categoriesSlice';
import { useRBAC } from '../../hooks/useRBAC';
import { useToast } from '../../hooks/useToast';

export default function ArticleFormPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useRBAC();
  const { selected, loading } = useSelector((state) => state.articles);
  const { items: categories } = useSelector((state) => state.categories);
  const showStatus = can('article:publish');
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(articleSchema),
    defaultValues: {
      title: '',
      body: '',
      excerpt: '',
      categoryId: '',
      status: 'DRAFT',
      tags: ''
    }
  });

  useEffect(() => {
    dispatch(fetchCategories());
    if (id) {
      dispatch(fetchArticleById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (id && selected) {
      reset({
        title: selected.title,
        body: selected.body,
        excerpt: selected.excerpt || '',
        categoryId: String(selected.categoryId),
        status: selected.status,
        tags: (selected.tags || []).join(', ')
      });
    }
  }, [id, reset, selected]);

  const onSubmit = async (values) => {
    const result = await dispatch(saveArticle({ id, values }));
    if (!result.error) {
      toast.success(`Article ${id ? 'updated' : 'created'} successfully`);
      navigate('/articles');
    } else {
      toast.error(result.payload);
    }
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <h1 className="h3 fw-bold mb-4">{id ? 'Edit Article' : 'Create Article'}</h1>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormInput label="Title" name="title" register={register} error={errors.title} />
          <FormTextarea label="Body" name="body" register={register} error={errors.body} rows={8} />
          <FormTextarea label="Excerpt" name="excerpt" register={register} error={errors.excerpt} rows={3} />
          <FormSelect
            label="Category"
            name="categoryId"
            register={register}
            error={errors.categoryId}
            options={categories.map((category) => ({ value: String(category.id), label: category.name }))}
          />
          {showStatus && (
            <FormSelect
              label="Status"
              name="status"
              register={register}
              error={errors.status}
              options={[
                { value: 'DRAFT', label: 'Draft' },
                { value: 'PUBLISHED', label: 'Published' }
              ]}
            />
          )}
          <FormInput label="Tags" name="tags" register={register} error={errors.tags} placeholder="news, product, release" />
          <button type="submit" className="btn btn-dark" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
            Save Article
          </button>
        </form>
      </div>
    </div>
  );
}