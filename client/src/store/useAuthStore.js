import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            error: null,

            login: async (email, password) => {
                set({ loading: true, error: null });
                try {
                    const response = await api.post('/auth/login', { email, password });

                    if (response.data.requires2FA) {
                        set({ loading: false });
                        return response.data;
                    }

                    set({
                        user: { _id: response.data._id, email: response.data.email, role: response.data.role },
                        token: response.data.token,
                        isAuthenticated: true,
                        loading: false,
                    });
                    return response.data;
                } catch (error) {
                    set({
                        error: error.response?.data?.message || 'Login failed',
                        loading: false,
                    });
                    throw error;
                }
            },

            logout: async () => {
                try {
                    await api.post('/auth/logout');
                } catch (error) {
                    console.error('Logout error:', error);
                } finally {
                    set({ user: null, token: null, isAuthenticated: false });
                }
            },

            getProfile: async () => {
                try {
                    const response = await api.get('/auth/profile');
                    set({ user: response.data });
                    return response.data;
                } catch (error) {
                    console.error('Fetch profile error:', error);
                }
            },

            setAuth: (data) => {
                set({
                    user: { _id: data._id, email: data.email, role: data.role },
                    token: data.token,
                    isAuthenticated: true,
                    loading: false,
                    error: null
                });
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'auth-storage',
        }
    )
);

export default useAuthStore;
