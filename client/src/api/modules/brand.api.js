import axiosInstance from '../axiosInstance';

export const brandApi = {
  getAll: (params) => axiosInstance.get('/brands', { params }),
  create: (data) => axiosInstance.post('/brands', data),
  update: (id, data) => axiosInstance.put(`/brands/${id}`, data),
  delete: (id) => axiosInstance.delete(`/brands/${id}`)
};
