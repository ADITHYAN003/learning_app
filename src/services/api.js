import axios from 'axios';

// const BASE_URL = 'http://localhost:8000/api';
const BASE_URL = 'https://projectlearning.pythonanywhere.com/api';

export const authAPI = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await authAPI.post('/auth/token/refresh/', {
          refresh: refreshToken
        });

        const { access } = response.data;
        localStorage.setItem('accessToken', access);
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        originalRequest.headers['Authorization'] = `Bearer ${access}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const profileAPI = {
  getProgress: () => api.get('/profile/progress/'),
  getDomainOptions: () => api.get('/profile/step1/domain/'),
  updateDomain: (domain) => api.post('/profile/step1/domain/', { domain }),
  getLanguageOptions: () => api.get('/profile/step2/language/'),
  updateLanguage: (language) => api.post('/profile/step2/language/', { language }),
  getFrameworkOptions: () => api.get('/profile/step3/framework/'),
  updateFramework: (framework) => api.post('/profile/step3/framework/', { framework }),
  getLevelOptions: () => api.get('/profile/step4/level/'),
  updateLevel: (data) => api.post('/profile/step4/level/', data),
};

export const roadmapAPI = {
  list: (profileId) => api.get(`/profiles/${profileId}/roadmaps/`),
  create: (profileId) => api.post(`/profiles/${profileId}/roadmaps/create/`),
  get: (roadmapId) => api.get(`/roadmaps/${roadmapId}/`),
  update: (roadmapId, data) => api.patch(`/roadmaps/${roadmapId}/`, data),
  delete: (roadmapId) => api.delete(`/roadmaps/${roadmapId}/`),
  createAdditionalPath: (pathData) => {
    return api.post('roadmaps/additional-path/', pathData);
  },
  
  getPathConfiguration: () => {
    return api.get('roadmaps/path-configuration/');
  }
};

export const taskAPI = {
  list: (roadmapId) => api.get(`/roadmaps/${roadmapId}/tasks/`),
  create: (roadmapId, data) => api.post(`/roadmaps/${roadmapId}/tasks/`, data),
  update: (taskId, data) => api.patch(`/tasks/${taskId}/`, data),
  delete: (taskId) => api.delete(`/tasks/${taskId}/`),
  toggleComplete: (taskId) => api.post(`/tasks/${taskId}/toggle/`),
};

export const resourceAPI = {
  list: (taskId) => api.get(`/tasks/${taskId}/resources/`),
  create: (taskId, data) => api.post(`/tasks/${taskId}/resources/`, data),
  update: (resourceId, data) => api.patch(`/resources/${resourceId}/`, data),
  delete: (resourceId) => api.delete(`/resources/${resourceId}/`),
  toggleComplete: (resourceId) => api.post(`/resources/${resourceId}/toggle/`),
};