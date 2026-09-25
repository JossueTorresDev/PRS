import { useAuth } from '../modules/ms-02-authentication/hooks/useAuth.jsx';
import { normalizeRoles } from '../shared/utils/roleUtils.js';

/**
 * Componente que protege rutas por rol.
 * SUPER_ADMIN siempre pasa (bypass absoluto).
 *
 * Uso:
 *   <RoleGuard allowedRoles={['TENANT_ADMIN', 'PATRIMONIO_GESTOR']}>
 *     <MiPagina />
 *   </RoleGuard>
 */
const RoleGuard = ({ allowedRoles = [], children }) => {
  const { user } = useAuth();
  const userRoles = normalizeRoles(user?.roles || []);

  // SUPER_ADMIN siempre pasa
  if (userRoles.includes('SUPER_ADMIN')) {
    return children;
  }

  // Verificar si tiene al menos un rol permitido
  const hasAccess = allowedRoles.some(role => userRoles.includes(role));

  if (!hasAccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="relative group max-w-md w-full">
          {/* Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-3xl blur-xl opacity-60"></div>

          <div className="relative bg-white rounded-3xl p-10 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100 text-center">
            {/* Icono Shield con X */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
              Acceso Restringido
            </h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              No tienes los permisos necesarios para acceder a esta sección. Contacta a tu administrador si crees que esto es un error.
            </p>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Código 403 — Permisos insuficientes</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default RoleGuard;
