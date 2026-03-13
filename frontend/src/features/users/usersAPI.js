import api from '../../services/axiosInstance';

const usersAPI = {
  list() {
    return api.get('/api/admin/users').then((response) => response.data);
  },
  updateRole(id, role) {
    return api.put(`/api/admin/users/${id}/role`, { role }).then((response) => response.data);
  },
  deactivate(id) {
    return api.delete(`/api/admin/users/${id}`).then((response) => response.data);
  },
  activate(id) {
    return api.put(`/api/admin/users/${id}/activate`).then((response) => response.data);
  }
};

export default usersAPI;