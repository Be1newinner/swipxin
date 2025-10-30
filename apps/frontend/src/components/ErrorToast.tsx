import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { AlertCircle, X } from 'lucide-react';

export function ErrorToast({ error, onClear }) {
  useEffect(() => {
    if (error) {
      toast.error(error, {
        description: 'Please try again or contact support if the problem persists',
        icon: <AlertCircle className="w-4 h-4" />,
        action: {
          label: 'Dismiss',
          onClick: onClear,
        },
        onDismiss: onClear,
        duration: 5000,
      });
    }
  }, [error, onClear]);

  return null;
}

// Utility functions for different types of toasts
export const showSuccessToast = (message, description) => {
  toast.success(message, {
    description,
    duration: 3000,
  });
};

export const showErrorToast = (message, description) => {
  toast.error(message, {
    description,
    duration: 5000,
  });
};

export const showInfoToast = (message, description) => {
  toast.info(message, {
    description,
    duration: 4000,
  });
};

export const showWarningToast = (message, description) => {
  toast.warning(message, {
    description,
    duration: 4000,
  });
};