import { Toaster } from 'react-hot-toast';

/**
 * Toast container component with Zylen DOFUS dark theme styling
 * Uses react-hot-toast with custom DOFUS-inspired configuration
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
        // Default options - DOFUS dark theme
        duration: 3000,
        style: {
          background: 'rgba(23, 20, 18, 0.95)', // charcoal oscuro DOFUS
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)', // borde sutil blanco
          borderRadius: '0px', // esquinas cuadradas DOFUS
          padding: '1rem 1.25rem',
          fontSize: '0.9375rem',
          fontWeight: '500',
          color: '#FFFFFF', // texto blanco
          boxShadow: '0px 0px 4px 0px rgb(0, 0, 0)', // shadow DOFUS
        },
        // Success toast - Verde brillante DOFUS
        success: {
          duration: 3500,
          style: {
            background: 'rgba(155, 215, 50, 0.15)', // verde brillante con transparencia
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(155, 215, 50, 0.4)', // borde verde brillante
            borderRadius: '0px', // esquinas cuadradas
            color: '#FFFFFF', // texto blanco
            boxShadow: '0 0 12px rgba(155, 215, 50, 0.4)', // brillo verde
          },
          iconTheme: {
            primary: '#9BD732', // verde brillante DOFUS
            secondary: '#000000', // negro para contraste
          },
        },
        // Error toast - Rojo DOFUS
        error: {
          duration: 4000,
          style: {
            background: 'rgba(217, 83, 79, 0.15)', // rojo DOFUS con transparencia
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(217, 83, 79, 0.4)', // borde rojo DOFUS
            borderRadius: '0px', // esquinas cuadradas
            color: '#FFFFFF', // texto blanco
            boxShadow: '0 0 12px rgba(217, 83, 79, 0.4)', // brillo rojo
          },
          iconTheme: {
            primary: '#D9534F', // rojo DOFUS
            secondary: '#FFFFFF', // blanco
          },
        },
        // Loading toast - Cyan brillante
        loading: {
          style: {
            background: 'rgba(50, 200, 220, 0.15)', // cyan brillante con transparencia
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(50, 200, 220, 0.4)', // borde cyan
            borderRadius: '0px', // esquinas cuadradas
            color: '#FFFFFF', // texto blanco
            boxShadow: '0 0 12px rgba(50, 200, 220, 0.4)', // brillo cyan
          },
          iconTheme: {
            primary: '#32C8DC', // cyan brillante
            secondary: '#FFFFFF', // blanco
          },
        },
      }}
    />
  );
}
