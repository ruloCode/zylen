/**
 * Toast facade with a react-hot-toast-compatible call surface, backed by
 * react-native-toast-message. Ported web code keeps `toast.success(...)` /
 * `toast.error(...)` / `toast(...)` call sites unchanged — only the import
 * changes to `@/lib/toast`.
 *
 * The <Toast /> host is mounted once in app/_layout.tsx.
 */

import Toast from 'react-native-toast-message';

function show(type: 'success' | 'error' | 'info', message: string): void {
  Toast.show({
    type,
    text1: message,
    position: 'top',
    visibilityTime: 3000,
  });
}

function base(message: string): void {
  show('info', message);
}

const toast = Object.assign(base, {
  success(message: string): void {
    show('success', message);
  },
  error(message: string): void {
    show('error', message);
  },
  info(message: string): void {
    show('info', message);
  },
  dismiss(): void {
    Toast.hide();
  },
});

export default toast;
export { toast };
