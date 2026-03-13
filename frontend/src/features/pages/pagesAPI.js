import api from '../../services/axiosInstance';

const pagesAPI = {
  list(params) {
    return api.get('/api/pages', { params }).then((response) => response.data);
  },
  create(payload) {
    return api.post('/api/pages', payload).then((response) => response.data);
  },
  update(id, payload) {
    return api.put(`/api/pages/${id}`, payload).then((response) => response.data);
  },
  publish(id) {
    return api.patch(`/api/pages/${id}/publish`).then((response) => response.data);
  },
  remove(id) {
    return api.delete(`/api/pages/${id}`).then((response) => response.data);
  }
};

export default pagesAPI;