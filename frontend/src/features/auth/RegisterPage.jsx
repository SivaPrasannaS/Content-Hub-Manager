import { useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import FormInput from '../../components/forms/FormInput';
import { registerAsync } from './authSlice';
import { registerSchema } from '../../utils/validators';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, isAuthenticated, initialized } = useAuth();
  const toast = useToast();
  const redirectTo = location.state?.from?.pathname || '/articles';
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { username: '', password: '' },
    resolver: yupResolver(registerSchema)
  });

  useEffect(() => {
    if (initialized && isAuthenticated) {
      toast.success('Registration successful');
      navigate(redirectTo, { replace: true });
    }
  }, [initialized, isAuthenticated, navigate, redirectTo, toast]);

  const onSubmit = (values) => dispatch(registerAsync(values));

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-5">
          <div className="card border-0 shadow-lg">
            <div className="card-body p-4 p-md-5">
              <h1 className="h3 fw-bold mb-3">Create Account</h1>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <FormInput label="Username" name="username" register={register} error={errors.username} />
                <FormInput label="Password" name="password" type="password" register={register} error={errors.password} />
                <button type="submit" className="btn btn-warning w-100" disabled={loading}>
                  {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                  Register
                </button>
              </form>
              <p className="mt-3 mb-0 text-center">
                Already registered? <Link to="/login">Login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}