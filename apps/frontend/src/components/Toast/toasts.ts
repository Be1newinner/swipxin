import { toast } from 'sonner';

// Toast utility options interface
interface ToastOptions {
    description?: string;
    duration?: number;
}

// Utility functions for different types of toasts
export const showSuccessToast = (
    message: string,
    description?: string
): void => {
    toast.success(message, {
        description,
        duration: 3000,
    });
};

export const showErrorToast = (
    message: string,
    description?: string
): void => {
    toast.error(message, {
        description,
        duration: 5000,
    });
};

export const showInfoToast = (
    message: string,
    description?: string
): void => {
    toast.info(message, {
        description,
        duration: 4000,
    });
};

export const showWarningToast = (
    message: string,
    description?: string
): void => {
    toast.warning(message, {
        description,
        duration: 4000,
    });
};

// Advanced toast utility with full options
export const showToast = (
    type: 'success' | 'error' | 'info' | 'warning',
    message: string,
    options?: ToastOptions
): void => {
    const toastFn = toast[type];
    toastFn(message, {
        description: options?.description,
        duration: options?.duration,
    });
};
