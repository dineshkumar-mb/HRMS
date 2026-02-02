import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://hrms-22ch.onrender.com/api',
    withCredentials: true,
});

api.interceptors.request.use(
    (config) => {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
            const { state } = JSON.parse(authStorage);
            if (state.token) {
                config.headers.Authorization = `Bearer ${state.token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            // Refresh token logic could go here if implemented on backend
            // For now, logout on 401
            localStorage.removeItem('auth-storage');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
