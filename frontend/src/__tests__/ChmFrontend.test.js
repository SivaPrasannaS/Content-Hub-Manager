
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import rootReducer from '../app/rootReducer';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import { initializeAuth } from '../features/auth/authSlice';
import ArticleListPage from '../features/articles/ArticleListPage';
import ArticleDetailPage from '../features/articles/ArticleDetailPage';
import ArticleFormPage from '../features/articles/ArticleFormPage';
import PageListPage from '../features/pages/PageListPage';
import PageFormPage from '../features/pages/PageFormPage';
import MediaLibraryPage from '../features/media/MediaLibraryPage';
import MediaUploadForm from '../features/media/MediaUploadForm';
import AnalyticsDashboard from '../features/analytics/AnalyticsDashboard';
import CategoryManagerPage from '../features/categories/CategoryManagerPage';
import UserManagementPage from '../features/users/UserManagementPage';
import Pagination from '../components/common/Pagination';
import ProtectedRoute from '../components/rbac/ProtectedRoute';
import RoleGuard from '../components/rbac/RoleGuard';
import Toast from '../components/common/Toast';
import AppRoutes from '../routes/AppRoutes';
import { useRBAC } from '../hooks/useRBAC';
import authAPI from '../features/auth/authAPI';
import articlesAPI from '../features/articles/articlesAPI';
import pagesAPI from '../features/pages/pagesAPI';
import mediaAPI from '../features/media/mediaAPI';
import categoriesAPI from '../features/categories/categoriesAPI';
import analyticsAPI from '../features/analytics/analyticsAPI';
import usersAPI from '../features/users/usersAPI';

jest.mock('../features/auth/authAPI');
jest.mock('../features/articles/articlesAPI');
jest.mock('../features/pages/pagesAPI');
jest.mock('../features/media/mediaAPI');
jest.mock('../features/categories/categoriesAPI');
jest.mock('../features/analytics/analyticsAPI');
jest.mock('../features/users/usersAPI');

const articleItems = [
  { id: 1, title: 'Launch Story', body: 'Body content for launch story article.', excerpt: 'Launch excerpt', status: 'PUBLISHED', authorId: 1, authorUsername: 'owner', categoryId: 1, categoryName: 'News', tags: ['launch'], publishedAt: '2026-03-01T12:00:00', updatedAt: '2026-03-01T12:00:00' },
  { id: 2, title: 'Editorial Calendar', body: 'Body content for editorial calendar article.', excerpt: 'Calendar excerpt', status: 'PUBLISHED', authorId: 2, authorUsername: 'editor', categoryId: 2, categoryName: 'Ops', tags: ['calendar'], publishedAt: '2026-03-02T12:00:00', updatedAt: '2026-03-02T12:00:00' }
];

const draftArticleItems = [
  { id: 3, title: 'Draft Launch Notes', body: 'Draft body content for launch notes article.', excerpt: 'Draft notes excerpt', status: 'DRAFT', authorId: 1, authorUsername: 'owner', categoryId: 1, categoryName: 'News', tags: ['draft'], publishedAt: null, updatedAt: '2026-03-03T12:00:00' }
];

const categories = [
  { id: 1, name: 'News', description: 'News category' },
  { id: 2, name: 'Ops', description: 'Operations category' }
];

const pages = [
  { id: 1, title: 'About CHM', body: 'This page explains the platform and contains enough content.', status: 'PUBLISHED', authorId: 3, authorUsername: 'manager' },
  { id: 2, title: 'Contact', body: 'Reach out to the editorial team using the listed channels here.', status: 'PUBLISHED', authorId: 3, authorUsername: 'manager' }
];

const draftPages = [
  { id: 3, title: 'Draft Roadmap', body: 'This draft page captures the roadmap content for internal review.', status: 'DRAFT', authorId: 3, authorUsername: 'manager', updatedAt: '2026-03-03T12:00:00' }
];

const mediaItems = [
  { id: 1, filename: 'hero-image.png', originalName: 'hero-image.png', url: 'http://localhost:8080/media/hero-image.png', mediaType: 'IMAGE', size: 1024, uploadedById: 1, uploadedByUsername: 'owner' },
  { id: 2, filename: 'brand-guidelines.pdf', originalName: 'brand-guidelines.pdf', url: 'http://localhost:8080/media/brand-guidelines.pdf', mediaType: 'DOCUMENT', size: 2048, uploadedById: 2, uploadedByUsername: 'manager' }
];

const createStore = (preloadedState = {}) =>
  configureStore({
    reducer: rootReducer,
    preloadedState: {
      auth: { user: null, token: null, refreshToken: null, loading: false, error: null, initialized: true, ...preloadedState.auth },
      articles: { items: [], total: 0, page: 0, loading: false, error: null, selected: null, ...preloadedState.articles },
      pages: { items: [], total: 0, loading: false, error: null, ...preloadedState.pages },
      media: { items: [], total: 0, loading: false, error: null, ...preloadedState.media },
      categories: { items: [], loading: false, error: null, ...preloadedState.categories },
      users: { items: [], loading: false, error: null, ...preloadedState.users },
      analytics: { summary: null, monthly: [], byCategory: [], loading: false, error: null, ...preloadedState.analytics }
    }
  });

const renderWithProviders = (ui, { store = createStore(), route = '/' } = {}) => {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </Provider>
  );
};

function RBACProbe({ permission, article, media, check }) {
  const rbac = useRBAC();
  let value = false;
  if (check === 'can') value = rbac.can(permission);
  if (check === 'edit') value = rbac.canEditArticle(article);
  if (check === 'deleteArticle') value = rbac.canDeleteArticle(article);
  if (check === 'deleteMedia') value = rbac.canDeleteMedia(media);
  return <div>{String(value)}</div>;
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  authAPI.login.mockResolvedValue({ id: 1, username: 'owner', roles: ['ROLE_USER'], token: 'token-1', refreshToken: 'refresh-1' });
  authAPI.register.mockResolvedValue({ id: 2, username: 'newUser', roles: ['ROLE_USER'], token: 'token-2', refreshToken: 'refresh-2' });
  articlesAPI.list.mockImplementation((params = {}) => Promise.resolve(
    params.status === 'DRAFT'
      ? { items: draftArticleItems, total: draftArticleItems.length, page: 0 }
      : { items: articleItems, total: articleItems.length, page: 0 }
  ));
  articlesAPI.get.mockResolvedValue(articleItems[0]);
  articlesAPI.create.mockResolvedValue({ ...articleItems[0], id: 3 });
  articlesAPI.update.mockResolvedValue(articleItems[0]);
  articlesAPI.publish.mockResolvedValue({ ...draftArticleItems[0], status: 'PUBLISHED', publishedAt: '2026-03-04T12:00:00', updatedAt: '2026-03-04T12:00:00' });
  pagesAPI.list.mockImplementation((params = {}) => Promise.resolve(
    params.status === 'PUBLISHED'
      ? pages
      : [...pages, ...draftPages]
  ));
  pagesAPI.publish.mockResolvedValue({ ...draftPages[0], status: 'PUBLISHED' });
  pagesAPI.create.mockResolvedValue({ ...pages[0], id: 3, title: 'Created Page' });
  pagesAPI.update.mockResolvedValue(pages[0]);
  mediaAPI.list.mockResolvedValue(mediaItems);
  mediaAPI.create.mockResolvedValue(mediaItems[0]);
  mediaAPI.remove.mockResolvedValue({});
  categoriesAPI.list.mockResolvedValue(categories);
  categoriesAPI.create.mockResolvedValue({ id: 3, name: 'Created Category', description: 'desc' });
  categoriesAPI.update.mockResolvedValue({ id: 1, name: 'Updated Category', description: 'desc' });
  categoriesAPI.remove.mockResolvedValue({});
  analyticsAPI.summary.mockResolvedValue({ totalArticles: 8, publishedArticles: 5, draftArticles: 3, totalPages: 2, totalMedia: 2, totalCategories: 2 });
  analyticsAPI.monthly.mockResolvedValue([{ month: '2026-03', count: 5 }]);
  analyticsAPI.byCategory.mockResolvedValue([{ categoryId: 1, categoryName: 'News', count: 4 }]);
  usersAPI.list.mockResolvedValue([{ id: 1, username: 'owner', roles: ['ROLE_USER'], active: true }]);
  usersAPI.updateRole.mockResolvedValue({ id: 1, role: 'ROLE_MANAGER' });
  usersAPI.deactivate.mockResolvedValue({});
  usersAPI.activate.mockResolvedValue({});
});

test('day_7_login_page_renders_username_and_password_fields', async () => {
  const user = userEvent.setup();
  renderWithProviders(<LoginPage />);
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  const passwordInput = screen.getByLabelText(/password/i);
  expect(passwordInput).toBeInTheDocument();

  const toggleButton = screen.getByRole('button', { name: /show value/i });

  expect(passwordInput).toHaveAttribute('type', 'password');
  expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
  expect(toggleButton).toHaveAttribute('data-visibility-state', 'hidden');

  await user.click(toggleButton);

  expect(passwordInput).toHaveAttribute('type', 'text');
  expect(screen.getByRole('button', { name: /hide value/i })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: /hide value/i })).toHaveAttribute('data-visibility-state', 'visible');

  await user.click(screen.getByRole('button', { name: /hide value/i }));

  expect(passwordInput).toHaveAttribute('type', 'password');
  expect(screen.getByRole('button', { name: /show value/i })).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByRole('button', { name: /show value/i })).toHaveAttribute('data-visibility-state', 'hidden');
});

test('day_7_login_empty_submit_shows_validation_errors', async () => {
  const user = userEvent.setup();
  renderWithProviders(<LoginPage />);
  await user.click(screen.getByRole('button', { name: /sign in/i }));
  expect(await screen.findByText(/username is required/i)).toBeInTheDocument();
  expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument();
});

test('day_7_login_short_password_shows_inline_error', async () => {
  const user = userEvent.setup();
  renderWithProviders(<LoginPage />);
  await user.type(screen.getByLabelText(/username/i), 'owner');
  await user.type(screen.getByLabelText(/password/i), 'short');
  await user.click(screen.getByRole('button', { name: /sign in/i }));
  expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
});

test('day_8_login_success_redirects_to_articles', async () => {
  const user = userEvent.setup();
  const store = createStore();
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/articles" element={<div>Articles destination</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
  await user.type(screen.getByLabelText(/username/i), 'owner');
  await user.type(screen.getByLabelText(/password/i), 'Password@123');
  await user.click(screen.getByRole('button', { name: /sign in/i }));
  expect(await screen.findByText(/articles destination/i)).toBeInTheDocument();
});

test('day_8_login_unauthorized_response_shows_error_banner', async () => {
  const user = userEvent.setup();
  authAPI.login.mockRejectedValueOnce({ response: { data: { message: 'Invalid username or password' } } });
  renderWithProviders(<LoginPage />);
  await user.type(screen.getByLabelText(/username/i), 'owner');
  await user.type(screen.getByLabelText(/password/i), 'Password@123');
  await user.click(screen.getByRole('button', { name: /sign in/i }));
  expect(await screen.findByText(/invalid username or password/i)).toBeInTheDocument();
});

test('day_8_register_duplicate_username_shows_server_error', async () => {
  const user = userEvent.setup();
  authAPI.register.mockRejectedValueOnce({ response: { data: { message: 'Username already exists' } } });
  renderWithProviders(<RegisterPage />);
  await user.type(screen.getByLabelText(/username/i), 'owner');
  await user.type(screen.getByLabelText(/password/i), 'Password@123');
  await user.click(screen.getByRole('button', { name: /register/i }));
  expect(await screen.findByText(/username already exists/i)).toBeInTheDocument();
});

test('day_9_article_list_renders_separate_published_and_draft_tables', async () => {
  renderWithProviders(<ArticleListPage />, { store: createStore({ auth: { user: { id: 1, roles: ['ROLE_USER'] }, token: 'token' }, categories: { items: categories } }) });
  expect(await screen.findByRole('heading', { name: /published articles/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /draft articles/i })).toBeInTheDocument();
  expect(await screen.findByText(/launch story/i)).toBeInTheDocument();
  expect(await screen.findByText(/draft launch notes/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument();
});

test('day_9_article_publish_moves_draft_to_published', async () => {
  const user = userEvent.setup();
  renderWithProviders(<><ArticleListPage /><Toast /></>, { store: createStore({ auth: { user: { id: 1, roles: ['ROLE_USER'] }, token: 'token' }, categories: { items: categories } }) });
  expect(await screen.findByText(/draft launch notes/i)).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /publish/i }));

  await waitFor(() => expect(articlesAPI.publish).toHaveBeenCalledWith(3));
  expect(await screen.findByText(/article published successfully/i)).toBeInTheDocument();
  expect(screen.getAllByText(/draft launch notes/i)).toHaveLength(1);
});

test('day_8_article_list_shows_loading_skeleton_while_fetching', () => {
  articlesAPI.list.mockImplementation(() => new Promise(() => {}));
  renderWithProviders(<ArticleListPage />, { store: createStore() });
  expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
});

test('day_9_article_search_filters_by_title', async () => {
  const user = userEvent.setup();
  renderWithProviders(<ArticleListPage />, { store: createStore({ categories: { items: categories } }) });
  expect(await screen.findByText(/launch story/i)).toBeInTheDocument();
  await user.type(screen.getByPlaceholderText(/search articles by title/i), 'Launch');
  expect(screen.getByText(/launch story/i)).toBeInTheDocument();
  expect(screen.queryByText(/editorial calendar/i)).not.toBeInTheDocument();
});

test('day_9_article_pagination_renders_correct_page_controls', async () => {
  const manyArticles = Array.from({ length: 7 }, (_, index) => ({ ...articleItems[0], id: index + 1, title: `Article ${index + 1}` }));
  articlesAPI.list.mockImplementation((params = {}) => Promise.resolve(
    params.status === 'DRAFT'
      ? { items: [], total: 0, page: 0 }
      : { items: manyArticles, total: manyArticles.length, page: 0 }
  ));
  renderWithProviders(<ArticleListPage />, { store: createStore({ categories: { items: categories } }) });
  expect(await screen.findByRole('button', { name: /previous/i })).toBeDisabled();
  expect(await screen.findByRole('button', { name: '1' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /next/i })).toBeEnabled();
});

test('day_9_article_category_filter_updates_displayed_articles', async () => {
  const user = userEvent.setup();
  renderWithProviders(<ArticleListPage />, { store: createStore({ categories: { items: categories } }) });
  expect(await screen.findByText(/launch story/i)).toBeInTheDocument();
  await user.selectOptions(screen.getByRole('combobox'), '2');
  expect(screen.getByText(/editorial calendar/i)).toBeInTheDocument();
  expect(screen.queryByText(/launch story/i)).not.toBeInTheDocument();
});

test('day_7_article_detail_renders_title_and_body', async () => {
  renderWithProviders(
    <Routes><Route path="/articles/:id" element={<ArticleDetailPage />} /></Routes>,
    { store: createStore({ articles: { selected: articleItems[0] }, auth: { user: { id: 2, roles: ['ROLE_USER'] }, token: 'token' } }), route: '/articles/1' }
  );
  expect(await screen.findByRole('heading', { name: /launch story/i })).toBeInTheDocument();
  expect(screen.getByText(/^body content for launch story article\.$/i)).toBeInTheDocument();
});

test('day_8_article_detail_shows_edit_button_for_owner', async () => {
  renderWithProviders(
    <Routes><Route path="/articles/:id" element={<ArticleDetailPage />} /></Routes>,
    { store: createStore({ articles: { selected: articleItems[0] }, auth: { user: { id: 1, roles: ['ROLE_USER'] }, token: 'token' } }), route: '/articles/1' }
  );
  expect(await screen.findByRole('link', { name: /edit/i })).toBeInTheDocument();
});

test('day_8_article_detail_hides_edit_button_for_non_owner', async () => {
  renderWithProviders(
    <Routes><Route path="/articles/:id" element={<ArticleDetailPage />} /></Routes>,
    { store: createStore({ articles: { selected: articleItems[0] }, auth: { user: { id: 99, roles: ['ROLE_USER'] }, token: 'token' } }), route: '/articles/1' }
  );
  await screen.findByRole('heading', { name: /launch story/i });
  expect(screen.queryByRole('link', { name: /edit/i })).not.toBeInTheDocument();
});

test('day_8_article_form_user_role_hides_status_dropdown', () => {
  renderWithProviders(<ArticleFormPage />, { store: createStore({ auth: { user: { id: 1, roles: ['ROLE_USER'] }, token: 'token' }, categories: { items: categories } }) });
  expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument();
});

test('day_8_article_form_manager_role_shows_status_dropdown', () => {
  renderWithProviders(<ArticleFormPage />, { store: createStore({ auth: { user: { id: 2, roles: ['ROLE_MANAGER'] }, token: 'token' }, categories: { items: categories } }) });
  expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
});

test('day_7_article_form_short_title_shows_validation_error', async () => {
  const user = userEvent.setup();
  renderWithProviders(<ArticleFormPage />, { store: createStore({ auth: { user: { id: 1, roles: ['ROLE_MANAGER'] }, token: 'token' }, categories: { items: categories } }) });
  await user.type(screen.getByLabelText(/^title$/i), 'A');
  await user.type(screen.getByLabelText(/^body$/i), 'This body is definitely longer than twenty characters.');
  await user.selectOptions(screen.getByLabelText(/category/i), '1');
  await user.click(screen.getByRole('button', { name: /save article/i }));
  expect(await screen.findByText(/title must be at least 5 characters/i)).toBeInTheDocument();
});

test('day_7_article_form_short_body_shows_validation_error', async () => {
  const user = userEvent.setup();
  renderWithProviders(<ArticleFormPage />, { store: createStore({ auth: { user: { id: 1, roles: ['ROLE_MANAGER'] }, token: 'token' }, categories: { items: categories } }) });
  await user.type(screen.getByLabelText(/^title$/i), 'Valid Title');
  await user.type(screen.getByLabelText(/^body$/i), 'short');
  await user.selectOptions(screen.getByLabelText(/category/i), '1');
  await user.click(screen.getByRole('button', { name: /save article/i }));
  expect(await screen.findByText(/body must be at least 20 characters/i)).toBeInTheDocument();
});

test('day_8_article_form_edit_mode_preloads_existing_values', async () => {
  renderWithProviders(
    <Routes><Route path="/articles/:id/edit" element={<ArticleFormPage />} /></Routes>,
    { store: createStore({ articles: { selected: articleItems[0] }, auth: { user: { id: 1, roles: ['ROLE_MANAGER'] }, token: 'token' }, categories: { items: categories } }), route: '/articles/1/edit' }
  );
  expect(await screen.findByDisplayValue(articleItems[0].title)).toBeInTheDocument();
});

test('day_8_article_form_submit_shows_spinner_while_loading', () => {
  renderWithProviders(<ArticleFormPage />, { store: createStore({ auth: { user: { id: 1, roles: ['ROLE_MANAGER'] }, token: 'token' }, categories: { items: categories }, articles: { loading: true } }) });
  expect(screen.getByRole('button', { name: /save article/i })).toBeDisabled();
});

test('day_9_page_list_renders_separate_published_and_draft_tables', async () => {
  renderWithProviders(<PageListPage />, { store: createStore({ auth: { user: { id: 2, roles: ['ROLE_MANAGER'] }, token: 'token' } }) });
  expect(await screen.findByRole('heading', { name: /published pages/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /draft pages/i })).toBeInTheDocument();
  expect(await screen.findByText(/about chm/i)).toBeInTheDocument();
  expect(await screen.findByText(/draft roadmap/i)).toBeInTheDocument();
});

test('day_9_page_publish_moves_draft_to_published', async () => {
  const user = userEvent.setup();
  renderWithProviders(<><PageListPage /><Toast /></>, { store: createStore({ auth: { user: { id: 2, roles: ['ROLE_MANAGER'] }, token: 'token' } }) });
  expect(await screen.findByText(/draft roadmap/i)).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /publish/i }));

  await waitFor(() => expect(pagesAPI.publish).toHaveBeenCalledWith(3));
  expect(await screen.findByText(/page published successfully/i)).toBeInTheDocument();
  expect(screen.getAllByText(/draft roadmap/i)).toHaveLength(1);
});

test('day_8_page_form_manager_can_access_create_form', () => {
  renderWithProviders(
    <Routes><Route path="/pages/new" element={<ProtectedRoute permission="page:manage"><PageFormPage /></ProtectedRoute>} /></Routes>,
    { store: createStore({ auth: { user: { id: 2, roles: ['ROLE_MANAGER'] }, token: 'token' } }), route: '/pages/new' }
  );
  expect(screen.getByText(/create page/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Draft' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Published' })).toBeInTheDocument();
});

test('day_8_page_form_user_role_redirects_to_unauthorized', () => {
  renderWithProviders(<AppRoutes />, { store: createStore({ auth: { user: { id: 1, roles: ['ROLE_USER'] }, token: 'token' } }), route: '/pages/new' });
  expect(screen.getByText(/do not have access/i)).toBeInTheDocument();
});

test('day_7_page_form_missing_title_shows_validation_error', async () => {
  const user = userEvent.setup();
  renderWithProviders(<PageFormPage />, { store: createStore({ auth: { user: { id: 2, roles: ['ROLE_MANAGER'] }, token: 'token' } }) });
  await user.type(screen.getByLabelText(/^body$/i), 'This page body is long enough for validation.');
  await user.click(screen.getByRole('button', { name: /save page/i }));
  expect(await screen.findByText(/title must be at least 3 characters/i)).toBeInTheDocument();
});

test('day_8_page_form_submit_success_shows_toast', async () => {
  const user = userEvent.setup();
  renderWithProviders(<><PageFormPage /><Toast /></>, { store: createStore({ auth: { user: { id: 2, roles: ['ROLE_MANAGER'] }, token: 'token' } }) });
  await user.type(screen.getByLabelText(/^title$/i), 'About Platform');
  await user.type(screen.getByLabelText(/^body$/i), 'This page body is long enough for validation and submit.');
  await user.selectOptions(screen.getByLabelText(/status/i), 'PUBLISHED');
  await user.click(screen.getByRole('button', { name: /save page/i }));
  expect(await screen.findByText(/page saved successfully/i)).toBeInTheDocument();
});

test('day_7_media_library_renders_media_grid', async () => {
  renderWithProviders(<MediaLibraryPage />, { store: createStore({ auth: { user: { id: 1, roles: ['ROLE_USER'] }, token: 'token' }, media: { items: mediaItems, total: mediaItems.length } }) });
  expect(await screen.findByText(/hero-image.png/i)).toBeInTheDocument();
});

test('day_8_media_library_shows_loading_skeleton_while_fetching', () => {
  renderWithProviders(<MediaLibraryPage />, { store: createStore({ auth: { user: { id: 1, roles: ['ROLE_USER'] }, token: 'token' }, media: { loading: true } }) });
  expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
});

test('day_8_media_library_search_filters_by_filename', async () => {
  const user = userEvent.setup();
  renderWithProviders(<MediaLibraryPage />, { store: createStore({ auth: { user: { id: 1, roles: ['ROLE_USER'] }, token: 'token' }, media: { items: mediaItems, total: mediaItems.length } }) });
  await user.type(screen.getByPlaceholderText(/search media by filename/i), 'hero');
  expect(screen.getByText(/hero-image.png/i)).toBeInTheDocument();
  expect(screen.queryByText(/brand-guidelines.pdf/i)).not.toBeInTheDocument();
});

test('day_8_media_upload_accepts_valid_file_and_resets_form', async () => {
  const user = userEvent.setup();
  renderWithProviders(<><MediaUploadForm /><Toast /></>, { store: createStore({ auth: { user: { id: 1, roles: ['ROLE_USER'] }, token: 'token' } }) });
  const file = new File(['hello'], 'poster.png', { type: 'image/png' });
  await user.upload(screen.getByLabelText(/select file/i), file);
  expect(screen.getByLabelText(/filename/i)).toHaveValue('poster.png');
  await user.click(screen.getByRole('button', { name: /upload/i }));
  await waitFor(() => expect(mediaAPI.create).toHaveBeenCalled());
  expect(await screen.findByText(/uploaded poster.png/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/filename/i)).toHaveValue('');
  expect(screen.getByLabelText(/original name/i)).toHaveValue('');
  expect(screen.getByLabelText(/^url$/i)).toHaveValue('');
  expect(screen.getByLabelText(/size/i)).toHaveValue(null);
});

test('day_8_media_delete_shows_confirmation_modal', async () => {
  const user = userEvent.setup();
  renderWithProviders(<MediaLibraryPage />, { store: createStore({ auth: { user: { id: 1, roles: ['ROLE_USER'] }, token: 'token' }, media: { items: mediaItems, total: mediaItems.length } }) });
  await user.click(await screen.findByRole('button', { name: /delete/i }));
  expect(screen.getByText(/delete media/i)).toBeInTheDocument();
});

test('day_8_category_manager_manager_can_see_category_list', async () => {
  renderWithProviders(<CategoryManagerPage />, { store: createStore({ auth: { user: { id: 2, roles: ['ROLE_MANAGER'] }, token: 'token' }, categories: { items: categories } }) });
  expect(await screen.findByText(/existing categories/i)).toBeInTheDocument();
  expect(screen.getAllByText(/^News$/i).length).toBeGreaterThan(0);
});

test('day_8_category_manager_user_role_redirects_to_unauthorized', () => {
  renderWithProviders(<AppRoutes />, { store: createStore({ auth: { user: { id: 1, roles: ['ROLE_USER'] }, token: 'token' } }), route: '/categories' });
  expect(screen.getByText(/do not have access/i)).toBeInTheDocument();
});

test('day_7_category_manager_create_category_shows_form', () => {
  renderWithProviders(<CategoryManagerPage />, { store: createStore({ auth: { user: { id: 2, roles: ['ROLE_MANAGER'] }, token: 'token' }, categories: { items: [] } }) });
  expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
  expect(screen.queryByLabelText(/parent category/i)).not.toBeInTheDocument();
  expect(screen.getByText(/no records available/i)).toBeInTheDocument();
});

test('day_8_category_manager_delete_shows_confirmation_modal', async () => {
  const user = userEvent.setup();
  renderWithProviders(<CategoryManagerPage />, { store: createStore({ auth: { user: { id: 2, roles: ['ROLE_MANAGER'] }, token: 'token' }, categories: { items: categories } }) });
  await user.click(screen.getAllByRole('button', { name: /delete/i })[0]);
  expect(screen.getByText(/delete category/i)).toBeInTheDocument();
});

test('day_8_role_admin_can_manage_users_and_hides_admin_rows', async () => {
  usersAPI.list.mockResolvedValue([
    { id: 1, username: 'owner', roles: ['ROLE_USER'], active: true },
    { id: 3, username: 'admin', roles: ['ROLE_ADMIN'], active: true }
  ]);

  renderWithProviders(
    <>
      <RBACProbe permission="user:manage" check="can" />
      <UserManagementPage />
    </>,
    { store: createStore({ auth: { user: { id: 3, roles: ['ROLE_ADMIN'] }, token: 'token' } }) }
  );

  expect(screen.getByText('true')).toBeInTheDocument();

  const ownerRoleSelect = await screen.findByLabelText(/role for owner/i);

  expect(ownerRoleSelect).toBeInTheDocument();
  expect(screen.getByText('owner')).toBeInTheDocument();
  expect(screen.queryByText('admin')).not.toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'ROLE_MANAGER' })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: 'ROLE_ADMIN' })).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/role for admin/i)).not.toBeInTheDocument();
});

test('day_8_user_management_activate_updates_status_immediately', async () => {
  const user = userEvent.setup();
  usersAPI.list.mockResolvedValue([
    { id: 7, username: 'david', roles: ['ROLE_USER'], active: false }
  ]);

  renderWithProviders(<UserManagementPage />, { store: createStore({ auth: { user: { id: 3, roles: ['ROLE_ADMIN'] }, token: 'token' } }) });

  expect(await screen.findByText('david')).toBeInTheDocument();
  expect(screen.getByText('Inactive')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /activate/i }));

  await waitFor(() => expect(usersAPI.activate).toHaveBeenCalledWith(7));
  expect(await screen.findByText('Active')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /deactivate/i })).toBeInTheDocument();
});

test('day_8_rbac_can_edit_article_for_owner', () => {
  renderWithProviders(<RBACProbe article={articleItems[0]} check="edit" />, { store: createStore({ auth: { user: { id: 1, roles: ['ROLE_USER'] }, token: 'token' } }) });
  expect(screen.getByText('true')).toBeInTheDocument();
});

test('day_8_rbac_manager_cannot_delete_others_article', () => {
  renderWithProviders(<RBACProbe article={articleItems[0]} check="deleteArticle" />, { store: createStore({ auth: { user: { id: 99, roles: ['ROLE_MANAGER'] }, token: 'token' } }) });
  expect(screen.getByText('false')).toBeInTheDocument();
});

test('day_8_rbac_admin_can_delete_any_article', () => {
  renderWithProviders(<RBACProbe article={articleItems[0]} check="deleteArticle" />, { store: createStore({ auth: { user: { id: 99, roles: ['ROLE_ADMIN'] }, token: 'token' } }) });
  expect(screen.getByText('true')).toBeInTheDocument();
});

test('day_8_protected_route_unauthenticated_redirects_to_login', () => {
  renderWithProviders(
    <Routes>
      <Route path="/secure" element={<ProtectedRoute permission="article:create"><div>Secure</div></ProtectedRoute>} />
      <Route path="/login" element={<div>Login screen</div>} />
    </Routes>,
    { route: '/secure' }
  );
  expect(screen.getByText(/login screen/i)).toBeInTheDocument();
});

test('day_8_protected_route_unauthorized_redirects_to_unauthorized_page', () => {
  renderWithProviders(
    <Routes>
      <Route path="/secure" element={<ProtectedRoute permission="page:manage"><div>Secure</div></ProtectedRoute>} />
      <Route path="/unauthorized" element={<div>Unauthorized page</div>} />
    </Routes>,
    { store: createStore({ auth: { user: { id: 1, roles: ['ROLE_USER'] }, token: 'token' } }), route: '/secure' }
  );
  expect(screen.getByText(/unauthorized page/i)).toBeInTheDocument();
});

test('day_8_initialize_auth_restores_session_after_refresh', () => {
  localStorage.setItem('chm_access_token', 'persisted-token');
  localStorage.setItem('chm_refresh_token', 'persisted-refresh');
  localStorage.setItem('chm_access_token_user', JSON.stringify({ id: 2, username: 'manager', roles: ['ROLE_MANAGER'] }));

  const store = createStore({ auth: { user: null, token: null, refreshToken: null, initialized: false } });

  return store.dispatch(initializeAuth()).then(() => {
    renderWithProviders(
      <Routes>
        <Route path="/secure" element={<ProtectedRoute permission="page:manage"><div>Secure content</div></ProtectedRoute>} />
        <Route path="/login" element={<div>Login screen</div>} />
      </Routes>,
      { store, route: '/secure' }
    );

    expect(screen.getByText(/secure content/i)).toBeInTheDocument();
    expect(screen.queryByText(/login screen/i)).not.toBeInTheDocument();
  });
});

test('day_8_role_guard_renders_children_when_permitted', () => {
  renderWithProviders(<RoleGuard permission="analytics:view"><div>Analytics child</div></RoleGuard>, { store: createStore({ auth: { user: { id: 2, roles: ['ROLE_MANAGER'] }, token: 'token' } }) });
  expect(screen.getByText(/analytics child/i)).toBeInTheDocument();
});

test('day_8_role_guard_renders_fallback_when_not_permitted', () => {
  renderWithProviders(<RoleGuard permission="analytics:view" fallback={<div>Fallback</div>}><div>Analytics child</div></RoleGuard>, { store: createStore({ auth: { user: { id: 1, roles: ['ROLE_USER'] }, token: 'token' } }) });
  expect(screen.getByText(/fallback/i)).toBeInTheDocument();
});

test('day_8_role_guard_renders_null_without_fallback', () => {
  const { container } = renderWithProviders(<RoleGuard permission="analytics:view"><div>Analytics child</div></RoleGuard>, { store: createStore({ auth: { user: { id: 1, roles: ['ROLE_USER'] }, token: 'token' } }) });
  expect(container).toBeEmptyDOMElement();
});

test('day_9_analytics_by_category_paginates_five_records_per_page', async () => {
  const user = userEvent.setup();
  const byCategoryItems = Array.from({ length: 6 }, (_, index) => ({ categoryId: index + 1, categoryName: `Category ${index + 1}`, count: index + 10 }));
  analyticsAPI.summary.mockResolvedValue({ totalArticles: 8, publishedArticles: 5, draftArticles: 3, totalPages: 2, totalMedia: 2, totalCategories: 6 });
  analyticsAPI.monthly.mockResolvedValue([]);
  analyticsAPI.byCategory.mockResolvedValue(byCategoryItems);

  renderWithProviders(<AnalyticsDashboard />, { store: createStore({ auth: { user: { id: 2, roles: ['ROLE_MANAGER'] }, token: 'token' } }) });

  expect(await screen.findByText('Category 1')).toBeInTheDocument();
  expect(screen.getByText('Category 5')).toBeInTheDocument();
  expect(screen.queryByText('Category 6')).not.toBeInTheDocument();

  await user.click(screen.getAllByRole('button', { name: /next/i })[0]);

  expect(await screen.findByText('Category 6')).toBeInTheDocument();
});

test('day_9_user_management_paginates_five_records_per_page', async () => {
  const user = userEvent.setup();
  const manyUsers = Array.from({ length: 6 }, (_, index) => ({ id: index + 1, username: `user${index + 1}`, roles: ['ROLE_USER'], active: true }));
  usersAPI.list.mockResolvedValue(manyUsers);

  renderWithProviders(<UserManagementPage />, { store: createStore({ auth: { user: { id: 9, roles: ['ROLE_ADMIN'] }, token: 'token' } }) });

  expect(await screen.findByText('user1')).toBeInTheDocument();
  expect(screen.getByText('user5')).toBeInTheDocument();
  expect(screen.queryByText('user6')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /next/i }));

  expect(await screen.findByText('user6')).toBeInTheDocument();
});

test('day_9_category_manager_paginates_five_records_per_page', async () => {
  const user = userEvent.setup();
  const manyCategories = Array.from({ length: 6 }, (_, index) => ({ id: index + 1, name: `Category ${index + 1}`, description: `Description ${index + 1}` }));
  categoriesAPI.list.mockResolvedValue(manyCategories);

  renderWithProviders(<CategoryManagerPage />, { store: createStore({ auth: { user: { id: 2, roles: ['ROLE_MANAGER'] }, token: 'token' } }) });

  expect(await screen.findByText(/existing categories/i)).toBeInTheDocument();
  expect(await screen.findByText('Category 1')).toBeInTheDocument();
  expect(screen.getByText('Category 5')).toBeInTheDocument();
  expect(screen.queryByText('Category 6')).not.toBeInTheDocument();

  await user.click(screen.getAllByRole('button', { name: /next/i })[0]);

  expect(await screen.findByText('Category 6')).toBeInTheDocument();
});