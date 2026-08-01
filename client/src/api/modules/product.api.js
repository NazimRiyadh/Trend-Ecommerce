import axiosInstance from '../axiosInstance';

export const productApi = {
  getAll: (params) => axiosInstance.get('/products', { params }),
  getById: (id) => axiosInstance.get(`/products/${id}`),
  create: (data) => axiosInstance.post('/products', data),
  update: (id, data) => axiosInstance.put(`/products/${id}`, data),
  delete: (id) => axiosInstance.delete(`/products/${id}`),
  addVariants: (id, data) => axiosInstance.post(`/products/${id}/variants`, data),
  updateVariant: (id, variantId, data) => axiosInstance.put(`/products/${id}/variants/${variantId}`, data),
  deleteVariant: (id, variantId) => axiosInstance.delete(`/products/${id}/variants/${variantId}`),
  addMedia: (id, data) => axiosInstance.post(`/products/${id}/media`, data),
  updateMedia: (id, mediaId, data) => axiosInstance.put(`/products/${id}/media/${mediaId}`, data),
  deleteMedia: (id, mediaId) => axiosInstance.delete(`/products/${id}/media/${mediaId}`)
};
