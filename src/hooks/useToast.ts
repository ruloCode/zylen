import toast from 'react-hot-toast';

/**
 * Custom hook wrapper for toast notifications
 * Provides typed, branded toast messages for the app
 */
export function useToast() {
  return {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    loading: (message: string) => toast.loading(message),
    promise: toast.promise,
    dismiss: toast.dismiss,
    custom: toast.custom,
  };
}
