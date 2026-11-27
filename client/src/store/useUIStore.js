import { create } from 'zustand';

let toastId = 0;

const useUIStore = create((set) => ({
    toasts: [],
    confirmState: null,

    addToast: ({ message, type = 'info', duration = 4000 }) => {
        const id = ++toastId;
        set((state) => ({
            toasts: [...state.toasts, { id, message, type }],
        }));
        if (duration > 0) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id),
                }));
            }, duration);
        }
        return id;
    },

    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),

    openConfirm: ({ title = 'Confirm Action', message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger' }) => {
        return new Promise((resolve) => {
            set({
                confirmState: {
                    title,
                    message,
                    confirmText,
                    cancelText,
                    variant,
                    resolve,
                },
            });
        });
    },

    closeConfirm: (result) =>
        set((state) => {
            if (state.confirmState?.resolve) {
                state.confirmState.resolve(result);
            }
            return { confirmState: null };
        }),
}));

export const toast = {
    success: (message, duration) => useUIStore.getState().addToast({ message, type: 'success', duration }),
    error: (message, duration) => useUIStore.getState().addToast({ message, type: 'error', duration }),
    info: (message, duration) => useUIStore.getState().addToast({ message, type: 'info', duration }),
    warning: (message, duration) => useUIStore.getState().addToast({ message, type: 'warning', duration }),
};

export const confirmAction = (options) => useUIStore.getState().openConfirm(options);

export default useUIStore;
