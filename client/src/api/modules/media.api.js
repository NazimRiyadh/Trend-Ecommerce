import axiosInstance from '../axiosInstance';

export const mediaApi = {
  getAll: (params) => axiosInstance.get('/media', { params }),
  getById: (id) => axiosInstance.get(`/media/${id}`),
  upload: (data, onUploadProgress) => axiosInstance.post('/media/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress
  }),
  update: (id, data) => axiosInstance.put(`/media/${id}`, data),
  delete: (id) => axiosInstance.delete(`/media/${id}`),
};
