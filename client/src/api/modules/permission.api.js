import axiosInstance from '../axiosInstance';

export const permissionApi = {
  getAll: (params) => axiosInstance.get('/permissions', { params }),
  createGroup: (data) => axiosInstance.post('/permissions', data),
  updateGroup: (id, data) => axiosInstance.put(`/permissions/${id}`, data),
  deleteGroup: (id) => axiosInstance.delete(`/permissions/${id}`),
};
