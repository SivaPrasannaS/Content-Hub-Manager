
import { useLocation } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import Toast from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useTheme } from './hooks/useTheme';

function AppShell() {
  useTheme();
  const location = useLocation();
  const authPages = ['/login', '/register'];
  const isAuthPage = authPages.includes(location.pathname);

  return (
    <div className="app-shell min-vh-100">
      {!isAuthPage && <Navbar />}
      <div className="container-fluid">
        <div className="row">
          {!isAuthPage && <Sidebar />}
          <main className={isAuthPage ? 'col-12 app-main' : 'col-12 col-lg-10 ms-lg-auto px-3 px-md-4 py-4 app-main'}>
            <AppRoutes />
          </main>
        </div>
      </div>
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  );
}