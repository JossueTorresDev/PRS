import React from 'react';

/**
 * LoadingScreen - Componente universal de pantalla de carga
 * Diseño basado en el splash screen de index.html
 *
 * Props:
 * - isLoading: boolean - Muestra/oculta la pantalla de carga
 * - message: string - Mensaje personalizado (default: "Cargando sistema...")
 * - fullScreen: boolean - Si true, ocupa toda la pantalla
 */
export default function LoadingScreen({
  isLoading = true,
  message = 'Cargando sistema...',
  fullScreen = true
}) {
  if (!isLoading) return null;

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex items-center justify-center'
    : 'absolute inset-0 z-40 flex items-center justify-center';

  return (
    <div
      className={containerClasses}
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Fondo con efecto sutil */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.1,
          background: `radial-gradient(circle at 30% 40%, rgba(251,191,36,0.3) 0%, transparent 50%),
                       radial-gradient(circle at 70% 60%, rgba(59,130,246,0.2) 0%, transparent 50%)`
        }}
      />

      {/* Card moderna */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '56px 72px',
          border: '1px solid rgba(251, 191, 36, 0.2)',
          textAlign: 'center',
          maxWidth: '420px',
          position: 'relative',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(251, 191, 36, 0.1)'
        }}
      >
        {/* Línea dorada superior */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '20%',
            right: '20%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)',
            borderRadius: '2px'
          }}
        />

        {/* Icono de edificio municipal */}
        <div
          style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
            boxShadow: '0 8px 32px rgba(251, 191, 36, 0.3)'
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
        </div>

        {/* Título */}
        <h1
          style={{
            color: '#ffffff',
            fontSize: '36px',
            fontWeight: 700,
            margin: '0 0 8px 0',
            letterSpacing: '-0.5px'
          }}
        >
          SIPREB
        </h1>

        {/* Subtítulo */}
        <p
          style={{
            color: '#94a3b8',
            fontSize: '16px',
            margin: '0 0 40px 0',
            fontWeight: 500,
            letterSpacing: '0.5px'
          }}
        >
          Sistema Patrimonial Municipal
        </p>

        {/* Animación de carga moderna - 3 puntos */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span
            className="loading-dot"
            style={{
              width: '8px',
              height: '8px',
              background: '#fbbf24',
              borderRadius: '50%'
            }}
          />
          <span
            className="loading-dot"
            style={{
              width: '8px',
              height: '8px',
              background: '#fbbf24',
              borderRadius: '50%',
              animationDelay: '0.2s'
            }}
          />
          <span
            className="loading-dot"
            style={{
              width: '8px',
              height: '8px',
              background: '#fbbf24',
              borderRadius: '50%',
              animationDelay: '0.4s'
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#64748b',
          fontSize: '12px',
          letterSpacing: '0.5px'
        }}
      >
        {message}
      </div>

      {/* Animación CSS */}
      <style>{`
        @keyframes modernPulse {
          0%, 100% {
            transform: scale(0.6);
            opacity: 0.4;
          }
          50% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .loading-dot {
          animation: modernPulse 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
