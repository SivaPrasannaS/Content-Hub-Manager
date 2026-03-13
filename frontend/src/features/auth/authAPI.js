import api from '../../services/axiosInstance';

const authAPI = {
  login(payload) {
    return api.post('/api/auth/login', payload).then((response) => response.data);
  },
  register(payload) {
    return api.post('/api/auth/register', payload).then((response) => response.data);
  },
  refresh(refreshToken) {
    return api.post('/api/auth/refresh', { refreshToken }).then((response) => response.data);
  }
};

export default authAPI;