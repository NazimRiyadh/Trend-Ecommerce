import axiosInstance from '../axiosInstance';

export const attributeApi = {
  getAll: (params) => axiosInstance.get('/attributes', { params }),
  create: (data) => axiosInstance.post('/attributes', data),
  update: (id, data) => axiosInstance.put(`/attributes/${id}`, data),
  delete: (id) => axiosInstance.delete(`/attributes/${id}`)
};
