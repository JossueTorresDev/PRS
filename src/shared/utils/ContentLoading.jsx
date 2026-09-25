import React from 'react';

/**
 * ContentLoading - Componente de carga para contenido de tablas
 * Usa animación "chase" con 6 puntos animados - color cyan para patrimonio
 *
 * Props:
 * - isLoading: boolean - Muestra/oculta la pantalla de carga
 * - message: string - Mensaje opcional a mostrar debajo del spinner
 */
export default function ContentLoading({
  isLoading = true,
  message = 'Cargando...'
}) {
  if (!isLoading) return null;

  // Color cyan para patrimonio
  const accentColor = '#0891b2';

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-50/95">
      <div className="flex flex-col items-center justify-center gap-4">
        {/* Spinner Chase Animation */}
        <div className="sk-chase">
          <div className="sk-chase-dot"></div>
          <div className="sk-chase-dot"></div>
          <div className="sk-chase-dot"></div>
          <div className="sk-chase-dot"></div>
          <div className="sk-chase-dot"></div>
          <div className="sk-chase-dot"></div>
        </div>

        {/* Mensaje */}
        {message && (
          <p className="text-sm font-semibold text-slate-700 text-center px-4">
            {message}
          </p>
        )}
      </div>

      {/* Estilos CSS para la animación chase */}
      <style>{`
        .sk-chase {
          width: 48px;
          height: 48px;
          position: relative;
          animation: sk-chase 2.5s infinite linear both;
        }

        .sk-chase-dot {
          width: 100%;
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
          animation: sk-chase-dot 2.0s infinite ease-in-out both;
        }

        .sk-chase-dot:before {
          content: '';
          display: block;
          width: 25%;
          height: 25%;
          background-color: ${accentColor};
          border-radius: 100%;
          animation: sk-chase-dot-before 2.0s infinite ease-in-out both;
          box-shadow: 0 0 8px ${accentColor}80;
        }

        .sk-chase-dot:nth-child(1) { animation-delay: -1.1s; }
        .sk-chase-dot:nth-child(2) { animation-delay: -1.0s; }
        .sk-chase-dot:nth-child(3) { animation-delay: -0.9s; }
        .sk-chase-dot:nth-child(4) { animation-delay: -0.8s; }
        .sk-chase-dot:nth-child(5) { animation-delay: -0.7s; }
        .sk-chase-dot:nth-child(6) { animation-delay: -0.6s; }

        .sk-chase-dot:nth-child(1):before { animation-delay: -1.1s; }
        .sk-chase-dot:nth-child(2):before { animation-delay: -1.0s; }
        .sk-chase-dot:nth-child(3):before { animation-delay: -0.9s; }
        .sk-chase-dot:nth-child(4):before { animation-delay: -0.8s; }
        .sk-chase-dot:nth-child(5):before { animation-delay: -0.7s; }
        .sk-chase-dot:nth-child(6):before { animation-delay: -0.6s; }

        @keyframes sk-chase {
          100% { transform: rotate(360deg); }
        }

        @keyframes sk-chase-dot {
          80%, 100% { transform: rotate(360deg); }
        }

        @keyframes sk-chase-dot-before {
          50% {
            transform: scale(0.4);
            opacity: 0.5;
          }
          100%, 0% {
            transform: scale(1.0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
