import api from '../../services/axiosInstance';

const articlesAPI = {
  list(params) {
    return api.get('/api/articles', { params }).then((response) => response.data);
  },
  get(id) {
    return api.get(`/api/articles/${id}`).then((response) => response.data);
  },
  create(payload) {
    return api.post('/api/articles', payload).then((response) => response.data);
  },
  update(id, payload) {
    return api.put(`/api/articles/${id}`, payload).then((response) => response.data);
  },
  publish(id) {
    return api.patch(`/api/articles/${id}/publish`).then((response) => response.data);
  },
  remove(id) {
    return api.delete(`/api/articles/${id}`).then((response) => response.data);
  }
};

export default articlesAPI;