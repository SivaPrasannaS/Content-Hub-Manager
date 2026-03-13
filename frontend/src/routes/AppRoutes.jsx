
import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import ArticleListPage from '../features/articles/ArticleListPage';
import ArticleDetailPage from '../features/articles/ArticleDetailPage';
import ArticleFormPage from '../features/articles/ArticleFormPage';
import PageListPage from '../features/pages/PageListPage';
import PageFormPage from '../features/pages/PageFormPage';
import MediaLibraryPage from '../features/media/MediaLibraryPage';
import CategoryManagerPage from '../features/categories/CategoryManagerPage';
import UserManagementPage from '../features/users/UserManagementPage';
import AnalyticsDashboard from '../features/analytics/AnalyticsDashboard';
import ProtectedRoute from '../components/rbac/ProtectedRoute';

function Unauthorized() {
  return <div className="alert alert-warning">You do not have access to this section.</div>;
}

function NotFound() {
  return <div className="alert alert-secondary">The requested page was not found.</div>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/articles" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/articles" element={<ArticleListPage />} />
      <Route path="/articles/:id" element={<ArticleDetailPage />} />
      <Route path="/articles/new" element={<ProtectedRoute permission="article:create"><ArticleFormPage /></ProtectedRoute>} />
      <Route path="/articles/:id/edit" element={<ProtectedRoute permission="article:create"><ArticleFormPage /></ProtectedRoute>} />
      <Route path="/pages" element={<PageListPage />} />
      <Route path="/pages/new" element={<ProtectedRoute permission="page:manage"><PageFormPage /></ProtectedRoute>} />
      <Route path="/media" element={<ProtectedRoute permission="media:upload"><MediaLibraryPage /></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute permission="category:manage"><CategoryManagerPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute permission="analytics:view"><AnalyticsDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute permission="user:manage"><UserManagementPage /></ProtectedRoute>} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}