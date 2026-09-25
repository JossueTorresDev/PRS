import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../../hooks/useAuth.jsx";
import LoadingScreen from "../../../../shared/utils/LoadingScreen.jsx";
import { ROUTE_CHANGE_PASSWORD } from "../../config/index.js";
import { parseLoginError, showLoginAlert } from "../../utils/loginErrorHandler.js";

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.username || !formData.password) {
        throw new Error("Por favor completa todos los campos");
      }

      if (formData.username.length < 3) {
        throw new Error(
          "El nombre de usuario debe tener al menos 3 caracteres"
        );
      }

      const result = await login({
        username: formData.username,
        password: formData.password,
      });

      if (result.user?.requiresPasswordReset) {
        Swal.fire({
          title: "Cambio de Contraseña Requerido",
          text: "Por seguridad debes actualizar tu contraseña antes de continuar.",
          icon: "warning",
          confirmButtonText: "Cambiar contraseña",
          showCancelButton: false,
          confirmButtonColor: '#f59e0b',
        }).then(() => {
          navigate(ROUTE_CHANGE_PASSWORD);
        });
      } else {
        const userName = result.user?.nombre || result.user?.username || "Usuario";
        await Swal.fire({
          toast: false,
          position: 'center',
          showConfirmButton: false,
          showCancelButton: false,
          showDenyButton: false,
          showCloseButton: false,
          backdrop: 'rgba(0, 0, 0, 0.3)',
          timer: 3000,
          background: 'rgba(255, 255, 255, 0.65)',
          html: `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; text-align: center; padding: 24px 0;">
              <div style="width: 80px; height: 80px; border-radius: 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div style="width: 100%;">
                <div style="font-weight: 700; font-size: 24px; color: #1c1c1e; letter-spacing: -0.5px; margin-bottom: 12px;">
                  Inicio de sesión
                </div>
                <div style="font-size: 18px; color: #3a3a3c; line-height: 1.5; font-weight: 500;">
                  ¡Bienvenido de nuevo,<br/><span style="color: #059669; font-weight: 700;">${userName}</span>!
                </div>
              </div>
            </div>
          `,
          customClass: {
            popup: 'ios-notification-centered',
            actions: 'hidden'
          },
          didOpen: (popup) => {
            popup.style.backdropFilter = 'blur(40px) saturate(200%)';
            popup.style.WebkitBackdropFilter = 'blur(40px) saturate(200%)';
            popup.style.borderRadius = '32px';
            popup.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0,0,0,0.05)';
            popup.style.border = '1px solid rgba(255, 255, 255, 0.4)';
            popup.style.padding = '40px 32px';
            popup.style.maxWidth = '480px';
            popup.style.width = '100%';
            const actions = popup.querySelector('.swal2-actions');
            if (actions) actions.style.display = 'none';
          }
        });
        navigate("/");
      }
    } catch (error) {
      setIsSubmitting(false);
      console.error("Error en login:", error);
      const errorConfig = parseLoginError(error, formData.username);
      showLoginAlert(errorConfig);
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-white">
      {/* Panel izquierdo - Imagen Municipal con Overlay (55%) */}
      <div className="hidden lg:flex w-[55%] relative items-center justify-center overflow-hidden">
        {/* Imagen de fondo - Municipalidad genérica moderna */}
        <div 
          className="absolute inset-0 bg-cover bg-center scale-105 animate-pulse-slow"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80')`,
            filter: 'brightness(0.4)'
          }}
        />
        
        {/* Overlay degradado */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-amber-900/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-900/50" />

        {/* Efecto de partículas sutiles */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(251,191,36,0.8) 1px, transparent 0)`,
            backgroundSize: '30px 30px'
          }} />
        </div>

        {/* Contenido grande y espaciado */}
        <div className="relative z-10 px-16 py-12 w-full max-w-2xl">
          {/* Logo grande */}
          <div className="flex items-center gap-4 mb-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/40">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <span className="text-amber-400 text-lg font-semibold tracking-widest">SIPREB</span>
              <p className="text-slate-400 text-sm">Sistema Patrimonial</p>
            </div>
          </div>

          {/* Título principal grande */}
          <div className="mb-8">
            <h1 className="text-6xl lg:text-7xl font-bold text-white mb-2 leading-tight">
              Gestión
            </h1>
            <h1 className="text-6xl lg:text-7xl font-bold text-amber-400 mb-6 leading-tight">
              Patrimonial
            </h1>
            <div className="flex items-center gap-4">
              <div className="h-1 w-20 bg-gradient-to-r from-amber-400 to-transparent rounded-full" />
              <span className="text-slate-500 text-lg font-light tracking-wider">Sistema Integral Municipal</span>
            </div>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed mb-10 max-w-lg">
            Plataforma integral para la administración moderna de bienes municipales. 
            Gestión eficiente, segura y transparente de activos patrimoniales.
          </p>

          {/* Features en horizontal más espaciados */}
          <div className="flex gap-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-white text-lg font-semibold">Seguro</p>
                <p className="text-slate-400 text-sm">Datos encriptados</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white text-lg font-semibold">24/7</p>
                <p className="text-slate-400 text-sm">Siempre online</p>
              </div>
            </div>
          </div>
        </div>

        {/* Líneas decorativas */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-amber-500/50 via-transparent to-amber-500/50" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
      </div>

      {/* Panel derecho - Formulario White (45%) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white relative overflow-hidden">
        {/* Líneas decorativas sutiles */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#000"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        <div className="relative z-10 w-full max-w-md px-8">
          {/* Header minimalista */}
          <div className="mb-10">
            <p className="text-xs text-amber-600 font-semibold tracking-[0.2em] uppercase mb-2">
              Acceso al Sistema
            </p>
            <h2 className="text-3xl font-bold text-slate-900">
              Bienvenido
            </h2>
          </div>

          {/* Formulario con floating labels */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Usuario con floating label */}
            <div className="relative">
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleInputChange}
                onFocus={() => setFocusedInput('username')}
                onBlur={() => setFocusedInput(null)}
                className="peer w-full h-14 px-4 pt-4 pb-1 bg-transparent border-b-2 border-slate-200 text-slate-900 placeholder-transparent focus:outline-none focus:border-amber-400 transition-colors duration-300"
                placeholder="Usuario"
              />
              <label
                htmlFor="username"
                className="absolute left-4 top-4 text-slate-400 text-base transition-all duration-300 pointer-events-none
                  peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400
                  peer-focus:top-1 peer-focus:text-xs peer-focus:text-amber-500
                  peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-amber-500"
              >
                Usuario
              </label>
              <div className="absolute right-4 top-4 text-slate-300 peer-focus:text-amber-400 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              {/* Línea animada */}
              <div className={`absolute bottom-0 left-0 h-0.5 bg-amber-400 transition-all duration-300 ${focusedInput === 'username' ? 'w-full' : 'w-0'}`} />
            </div>

            {/* Input Contraseña con floating label */}
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                className="peer w-full h-14 px-4 pt-4 pb-1 bg-transparent border-b-2 border-slate-200 text-slate-900 placeholder-transparent focus:outline-none focus:border-amber-400 transition-colors duration-300"
                placeholder="Contraseña"
              />
              <label
                htmlFor="password"
                className="absolute left-4 top-4 text-slate-400 text-base transition-all duration-300 pointer-events-none
                  peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400
                  peer-focus:top-1 peer-focus:text-xs peer-focus:text-amber-500
                  peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-amber-500"
              >
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-slate-300 hover:text-amber-500 transition-colors"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
              {/* Línea animada */}
              <div className={`absolute bottom-0 left-0 h-0.5 bg-amber-400 transition-all duration-300 ${focusedInput === 'password' ? 'w-full' : 'w-0'}`} />
            </div>

            {/* Botón o Pantalla de carga SIPREB */}
            {isSubmitting ? (
              <div className="mt-8">
                <LoadingScreen isLoading={true} message="Iniciando sesión..." fullScreen={false} />
              </div>
            ) : (
              <button
                type="submit"
                className="group relative w-full h-14 mt-10 overflow-hidden rounded-xl bg-slate-900 text-white font-medium text-base tracking-wide transition-all duration-500 hover:shadow-2xl hover:shadow-slate-900/20"
              >
                {/* Gradiente sutil que aparece en hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Línea dorada animada en la parte inferior */}
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-transparent via-amber-400 to-transparent group-hover:w-full transition-all duration-500" />

                <span className="relative z-10 flex items-center justify-center">
                  <span className="group-hover:tracking-widest transition-all duration-300">Iniciar Sesión</span>
                </span>
              </button>
            )}
          </form>

          {/* Footer minimalista */}
          <div className="mt-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-400">Sistema Activo</span>
              <span className="text-xs text-slate-400">v2.0.0</span>
            </div>
          </div>

          {/* Copyright */}
          <p className="text-center mt-8 text-xs text-slate-400">
            © 2026 SIPREB: Sistema De Seguimiento  Patrimonial
          </p>
        </div>
      </div>

      {/* Animaciones */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 15s infinite ease-in-out;
        }
        @keyframes aurora1 {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); }
          33% { transform: translate(5%, 5%) rotate(5deg) scale(1.1); }
          66% { transform: translate(-3%, 8%) rotate(-3deg) scale(0.95); }
          100% { transform: translate(0, 0) rotate(0deg) scale(1); }
        }
        @keyframes aurora2 {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); }
          50% { transform: translate(-8%, -5%) rotate(-8deg) scale(1.05); }
          100% { transform: translate(5%, -10%) rotate(5deg) scale(0.95); }
        }
        @keyframes aurora3 {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); }
          50% { transform: translate(10%, 5%) rotate(10deg) scale(1.15); }
          100% { transform: translate(-5%, -5%) rotate(-5deg) scale(1); }
        }
      `}</style>
    </div>
  );
}

