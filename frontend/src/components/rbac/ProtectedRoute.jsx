
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useRBAC } from '../../hooks/useRBAC';

export default function ProtectedRoute({ children, permission }) {
  const { isAuthenticated, initialized } = useAuth();
  const { can } = useRBAC();
  const location = useLocation();

  if (!initialized) {
    return <div className="py-5 text-center text-secondary">Restoring your session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (permission && !can(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}