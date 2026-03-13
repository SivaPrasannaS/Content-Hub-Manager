import api from '../../services/axiosInstance';

const analyticsAPI = {
  summary() {
    return api.get('/api/analytics/summary').then((response) => response.data);
  },
  monthly() {
    return api.get('/api/analytics/monthly').then((response) => response.data);
  },
  byCategory() {
    return api.get('/api/analytics/by-category').then((response) => response.data);
  }
};

export default analyticsAPI;