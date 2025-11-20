import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// 认证服务
export const authService = {
  register: (email, password, username) => 
    api.post('/auth/register', { email, password, username }),
  
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
  
  getProfile: () => 
    api.get('/auth/profile'),
};

// 积分服务
export const creditsService = {
  getBalance: () => 
    api.get('/credits/balance'),
  
  getHistory: (limit = 20) => 
    api.get(`/credits/history?limit=${limit}`),
  
  recharge: (amount, paymentMethod) => 
    api.post('/credits/recharge', { amount, paymentMethod }),
};

// 任务服务
export const taskService = {
  create: (data) => 
    api.post('/tasks/create', data),
  
  getById: (id) => 
    api.get(`/tasks/${id}`),
  
  getList: (status = 'all', limit = 20) => 
    api.get(`/tasks/list?status=${status}&limit=${limit}`),
  
  delete: (id) => 
    api.delete(`/tasks/${id}`),
};

// 文件上传服务
export const uploadService = {
  uploadVoice: (file) => {
    const formData = new FormData();
    formData.append('audio', file);
    return api.post('/upload/voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  uploadTemplate: (file) => {
    const formData = new FormData();
    formData.append('video', file);
    return api.post('/upload/template', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// 管理员服务
export const adminService = {
  getStats: () => 
    api.get('/admin/stats'),
  
  getUsers: (page = 1, limit = 20) => 
    api.get(`/admin/users?page=${page}&limit=${limit}`),
  
  createPromotion: (data) => 
    api.post('/admin/promotions', data),
  
  getPromotions: () => 
    api.get('/admin/promotions'),
  
  updatePromotion: (id, data) => 
    api.put(`/admin/promotions/${id}`, data),
  
  deletePromotion: (id) => 
    api.delete(`/admin/promotions/${id}`),
};

export default api;
