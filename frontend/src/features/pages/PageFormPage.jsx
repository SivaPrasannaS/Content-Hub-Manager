
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import FormInput from '../../components/forms/FormInput';
import FormTextarea from '../../components/forms/FormTextarea';
import FormSelect from '../../components/forms/FormSelect';
import { pageSchema } from '../../utils/validators';
import { savePage } from './pagesSlice';
import { useToast } from '../../hooks/useToast';

export default function PageFormPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { loading } = useSelector((state) => state.pages);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { title: '', body: '', status: 'DRAFT' },
    resolver: yupResolver(pageSchema)
  });

  const onSubmit = async (values) => {
    const result = await dispatch(savePage({ values }));
    if (!result.error) {
      toast.success('Page saved successfully');
      navigate('/pages');
    } else {
      toast.error(result.payload);
    }
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <h1 className="h3 fw-bold mb-4">Create Page</h1>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormInput label="Title" name="title" register={register} error={errors.title} />
          <FormTextarea label="Body" name="body" register={register} error={errors.body} rows={8} />
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
          <button type="submit" className="btn btn-dark" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
            Save Page
          </button>
        </form>
      </div>
    </div>
  );
}