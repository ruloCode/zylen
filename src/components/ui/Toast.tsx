import { Toaster } from 'react-hot-toast';

/**
 * Toast container component with Zylen brand styling
 * Uses react-hot-toast with custom configuration
 */
export function ToastContainer() {
  return (
    <Toaster
      position="bottom-right"
      containerStyle={{
        bottom: '7rem', // Posición por encima del navbar (navbar tiene h-16 = 4rem, agregamos espacio extra)
        right: '1rem',
      }}
      toastOptions={{
        // Default options
        duration: 3000,
        style: {
          background: 'rgba(255, 253, 251, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(247, 238, 219, 0.5)',
          borderRadius: '1rem',
          padding: '1rem 1.25rem',
          fontSize: '0.9375rem',
          fontWeight: '500',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), 0 0 20px rgba(255, 200, 87, 0.15)',
        },
        // Success toast
        success: {
          duration: 3500,
          style: {
            background: 'linear-gradient(135deg, rgba(255, 200, 87, 0.15) 0%, rgba(255, 183, 77, 0.15) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 200, 87, 0.4)',
            color: '#1A1D1F',
            boxShadow: '0 4px 12px rgba(255, 200, 87, 0.2), 0 0 20px rgba(255, 200, 87, 0.3)',
          },
          iconTheme: {
            primary: '#FFC857',
            secondary: '#FFFAEE',
          },
        },
        // Error toast
        error: {
          duration: 4000,
          style: {
            background: 'rgba(232, 116, 129, 0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(232, 116, 129, 0.4)',
            color: '#1A1D1F',
            boxShadow: '0 4px 12px rgba(232, 116, 129, 0.2), 0 0 20px rgba(232, 116, 129, 0.2)',
          },
          iconTheme: {
            primary: '#E87481',
            secondary: '#FFFAEE',
          },
        },
        // Loading toast
        loading: {
          style: {
            background: 'rgba(42, 183, 169, 0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(42, 183, 169, 0.4)',
            color: '#1A1D1F',
          },
          iconTheme: {
            primary: '#26A69A',
            secondary: '#FFFAEE',
          },
        },
      }}
    />
  );
}
