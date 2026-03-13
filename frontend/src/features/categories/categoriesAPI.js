import api from '../../services/axiosInstance';

const categoriesAPI = {
  list() {
    return api.get('/api/categories').then((response) => response.data);
  },
  create(payload) {
    return api.post('/api/categories', payload).then((response) => response.data);
  },
  update(id, payload) {
    return api.put(`/api/categories/${id}`, payload).then((response) => response.data);
  },
  remove(id) {
    return api.delete(`/api/categories/${id}`).then((response) => response.data);
  }
};

export default categoriesAPI;