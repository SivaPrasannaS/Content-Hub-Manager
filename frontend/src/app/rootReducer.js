import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import articlesReducer from '../features/articles/articlesSlice';
import pagesReducer from '../features/pages/pagesSlice';
import mediaReducer from '../features/media/mediaSlice';
import categoriesReducer from '../features/categories/categoriesSlice';
import usersReducer from '../features/users/usersSlice';
import analyticsReducer from '../features/analytics/analyticsSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  articles: articlesReducer,
  pages: pagesReducer,
  media: mediaReducer,
  categories: categoriesReducer,
  users: usersReducer,
  analytics: analyticsReducer
});

export default rootReducer;