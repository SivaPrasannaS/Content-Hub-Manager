import api from '../../services/axiosInstance';

const mediaAPI = {
  list() {
    return api.get('/api/media').then((response) => response.data);
  },
  create(payload) {
    return api.post('/api/media', payload).then((response) => response.data);
  },
  remove(id) {
    return api.delete(`/api/media/${id}`).then((response) => response.data);
  }
};

export default mediaAPI;