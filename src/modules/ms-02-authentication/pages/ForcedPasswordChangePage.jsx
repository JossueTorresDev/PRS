import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../hooks/useAuth.jsx";

export default function ForcedPasswordChangePage() {
  const { user, changePassword, logout } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      Swal.fire({
        title: "Campos incompletos",
        text: "Completa todos los campos para continuar.",
        icon: "warning",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    if (newPassword.length < 8) {
      Swal.fire({
        title: "Contraseña insegura",
        text: "La nueva contraseña debe tener al menos 8 caracteres.",
        icon: "warning",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        title: "Las contraseñas no coinciden",
        text: "Verifica que la confirmación sea igual a la nueva contraseña.",
        icon: "error",
        confirmButtonText: "Corregir",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    try {
      setLoading(true);
      await changePassword(currentPassword, newPassword);

      await Swal.fire({
        title: "Contraseña actualizada",
        text: "Por seguridad, inicia sesión nuevamente con tu nueva contraseña.",
        icon: "success",
        confirmButtonText: "Ir al login",
        confirmButtonColor: "#22c55e",
      });

      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      Swal.fire({
        title: "Error al cambiar contraseña",
        text: error.message || "No se pudo actualizar la contraseña.",
        icon: "error",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const username = user?.username || "Usuario";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-10">
      <div className="max-w-lg w-full">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-400/40 mb-4">
            <svg
              className="w-8 h-8 text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m0-8v2m-7 5a9 9 0 1114 0H5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Cambio de contraseña requerido
          </h1>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            Por políticas de seguridad, debes actualizar tu contraseña antes de
            continuar usando el sistema.
          </p>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/70 rounded-3xl shadow-2xl p-6">
          <div className="mb-6 rounded-2xl bg-slate-800/80 border border-slate-700 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <span className="text-indigo-300 font-semibold text-sm">
                {username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">
                Usuario autenticado
              </p>
              <p className="text-sm font-semibold text-slate-100">
                {username}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2 pl-1">
                Contraseña actual
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                placeholder="Ingresa tu contraseña actual"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2 pl-1">
                Nueva contraseña
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2 pl-1">
                Confirmar nueva contraseña
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                placeholder="Repite la nueva contraseña"
              />
            </div>

            <div className="bg-slate-800/70 border border-slate-700 rounded-2xl px-4 py-3 text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-slate-200">
                Recomendaciones de seguridad:
              </p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Usa al menos 8 caracteres.</li>
                <li>Combina mayúsculas, minúsculas, números y símbolos.</li>
                <li>No reutilices contraseñas de otros sistemas.</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-sm shadow-lg shadow-amber-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  Guardando cambios...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 11c1.38 0 2.5-1.12 2.5-2.5S13.38 6 12 6s-2.5 1.12-2.5 2.5S10.62 11 12 11z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.5 20a9.5 9.5 0 0119 0H4.5z"
                    />
                  </svg>
                  Cambiar contraseña y salir
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

