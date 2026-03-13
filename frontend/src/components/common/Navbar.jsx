
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import ThemeToggle from './ThemeToggle';
import useAuth from '../../hooks/useAuth';
import { logout } from '../../features/auth/authSlice';

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg sticky-top app-navbar border-bottom shadow-sm">
      <div className="container-fluid px-3 px-md-4">
        <Link className="navbar-brand fw-bold text-uppercase app-brand" to="/articles">
          CHM
        </Link>
        <div className="d-flex align-items-center gap-2 ms-auto">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <span className="badge user-chip text-dark">{user?.username}</span>
              <button type="button" className="btn btn-dark" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <Link className="btn btn-dark" to="/login">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}