import { useEffect } from 'react';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

// Props interface for ErrorToast component
interface ErrorToastProps {
  error: string | null | undefined;
  onClear: () => void;
}

export function ErrorToast({ error, onClear }: ErrorToastProps): null {
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