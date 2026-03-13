import axios from 'axios';
import tokenService from './tokenService';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const setupInterceptors = (store) => {
  api.interceptors.request.use((config) => {
    const token = tokenService.getAccessToken();
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      const refreshToken = tokenService.getRefreshToken();

      if (error.response?.status === 401 && refreshToken && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const refreshResponse = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/refresh`, {
            refreshToken
          });
          const { token, refreshToken: newRefreshToken, id, username, roles } = refreshResponse.data;
          tokenService.setAccessToken(token);
          tokenService.setRefreshToken(newRefreshToken);
          store.dispatch({
            type: 'auth/setCredentials',
            payload: { token, refreshToken: newRefreshToken, user: { id, username, roles } }
          });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (refreshError) {
          tokenService.clearTokens();
          store.dispatch({ type: 'auth/logout' });
          window.location.assign('/login');
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
};

export default api;