import toast from '@/lib/toast';

/**
 * Custom hook wrapper for toast notifications
 * Provides typed, branded toast messages for the app.
 *
 * RN port: thin wrapper over the `@/lib/toast` facade (react-native-toast-message)
 * keeping the react-hot-toast-shaped API the web hook exposed. `loading` and
 * `custom` degrade to info toasts; `promise` shows loading/success/error
 * messages around the given promise.
 */
export function useToast() {
  return {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    loading: (message: string) => toast.info(message),
    promise: <T>(
      promise: Promise<T>,
      msgs: { loading: string; success: string; error: string }
    ): Promise<T> => {
      toast.info(msgs.loading);
      promise.then(
        () => toast.success(msgs.success),
        () => toast.error(msgs.error)
      );
      return promise;
    },
    dismiss: () => toast.dismiss(),
    custom: (message: string) => toast(message),
  };
}
