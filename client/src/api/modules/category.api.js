import axiosInstance from '../axiosInstance';

export const categoryApi = {
  getAll: (params) => axiosInstance.get('/categories', { params }),
  getTree: () => axiosInstance.get('/categories'),
  create: (data) => axiosInstance.post('/categories', data),
  update: (id, data) => axiosInstance.put(`/categories/${id}`, data),
  delete: (id) => axiosInstance.delete(`/categories/${id}`)
};
