import axiosInstance from '../axiosInstance';

export const roleApi = {
  getAll: (params) => axiosInstance.get('/roles', { params }),
  getById: (id) => axiosInstance.get(`/roles/${id}`),
  create: (data) => axiosInstance.post('/roles', data),
  update: (id, data) => axiosInstance.put(`/roles/${id}`, data),
  delete: (id) => axiosInstance.delete(`/roles/${id}`),
};
