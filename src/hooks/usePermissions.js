import { useAuth } from '../modules/ms-02-authentication/hooks/useAuth.jsx';
import { normalizeRoles } from '../shared/utils/roleUtils.js';

// ── Mapeo de fallback: qué puede VER cada rol en el sidebar ──
const ROLE_VIEW_MAP = {
  SUPER_ADMIN:              '__ALL__', // bypass total
  TENANT_ADMIN:             '__ALL_EXCEPT_ADMIN__',
  ONBOARDING_MANAGER:       ['admin', 'municipalidades'],
  TENANT_CONFIG_MANAGER:    ['areas', 'cargos', 'categorias', 'proveedores', 'ubicaciones', 'sistema', 'personas'],
  PATRIMONIO_GESTOR:        ['bienes', 'categorias', 'proveedores', 'ubicaciones', 'bajas', 'valores'],
  PATRIMONIO_EVALUADOR:     ['bajas'],
  PATRIMONIO_APROBADOR:     ['bajas'],
  PATRIMONIO_EJECUTOR:      ['bajas'],
  PATRIMONIO_OPERARIO:      ['bienes'],
  PATRIMONIO_VIEWER:        ['bienes'],
  MOVIMIENTOS_SOLICITANTE:  ['movimientos', 'bienes'],
  MOVIMIENTOS_APROBADOR:    ['movimientos', 'actas', 'bienes'],
  MOVIMIENTOS_EJECUTOR:     ['movimientos', 'actas', 'bienes'],
  MOVIMIENTOS_VIEWER:       ['movimientos'],
  INVENTARIO_COORDINADOR:   ['inventarios', 'bienes'],
  INVENTARIO_VERIFICADOR:   ['inventarios', 'bienes'],
  MANTENIMIENTO_GESTOR:     ['mantenimientos'],
  MANTENIMIENTO_VIEWER:     ['mantenimientos'],
  AUDITORIA_VIEWER:         ['bajas', 'auditoria', 'reportes'],
  REPORTES_VIEWER:          ['reportes'],
  REPORTES_SCHEDULER:       ['reportes'],
};

// ── Mapeo de fallback: qué puede HACER cada rol (module:action) ──
const ROLE_DO_MAP = {
  PATRIMONIO_GESTOR:        [
    'patrimonio:read', 'patrimonio:create', 'patrimonio:update', 'patrimonio:delete',
    'patrimonio:disposal', 'patrimonio:committee', 'patrimonio:depreciation',
    'movimientos:movement:submit', 'movimientos:read:*'
  ],
  PATRIMONIO_EVALUADOR:     [
    'patrimonio:read', 'patrimonio:committee:assign', 'patrimonio:disposal:evaluate'
  ],
  PATRIMONIO_APROBADOR:     [
    'patrimonio:read', 'patrimonio:disposal:approve'
  ],
  PATRIMONIO_EJECUTOR:      [
    'patrimonio:read', 'patrimonio:disposal:execute'
  ],
  PATRIMONIO_OPERARIO:      [
    'patrimonio:read', 'patrimonio:create', 'patrimonio:update',
    'movimientos:movement:submit', 'movimientos:read:own'
  ],
  PATRIMONIO_VIEWER:        ['patrimonio:read', 'movimientos:read:*'],
  MOVIMIENTOS_SOLICITANTE:  [
    'movimientos:movement:submit', 'movimientos:movement:cancel', 'movimientos:read:own'
  ],
  MOVIMIENTOS_APROBADOR:    [
    'movimientos:movement:approve', 'movimientos:receipt:generate', 'movimientos:read:*'
  ],
  MOVIMIENTOS_EJECUTOR:     [
    'movimientos:movement:execute', 'movimientos:receipt:generate',
    'movimientos:receipt:sign', 'movimientos:read:*'
  ],
  MOVIMIENTOS_VIEWER:       ['movimientos:read:*'],
  INVENTARIO_COORDINADOR:   ['inventario:read', 'inventario:create', 'inventario:update', 'inventario:delete', 'inventario:verify', 'inventario:close'],
  INVENTARIO_VERIFICADOR:   ['inventario:read', 'inventario:verify'],
  MANTENIMIENTO_GESTOR:     ['mantenimiento:read', 'mantenimiento:create', 'mantenimiento:update', 'mantenimiento:execute', 'mantenimiento:confirm'],
  MANTENIMIENTO_VIEWER:     ['mantenimiento:read'],
  AUDITORIA_VIEWER:         ['patrimonio:read', 'movimientos:read:*', 'inventario:read', 'mantenimiento:read'],
  REPORTES_VIEWER:          ['reportes:read'],
  REPORTES_SCHEDULER:       ['reportes:read', 'reportes:schedule'],
  TENANT_CONFIG_MANAGER:    [
    'config:read', 'config:create', 'config:update', 'config:delete',
    'config:org:manage:create', 'config:org:manage:update', 'config:org:manage:delete'
  ],
};

export const usePermissions = () => {
  const { user } = useAuth();
  
  const permissions = user?.permissions || [];
  const roles = normalizeRoles(user?.roles || []);
  const hasGranular = permissions.length > 0;

  /**
   * Verifica si el usuario tiene permiso para ver un módulo en el sidebar.
   * Prioridad: permisos granulares > fallback por rol.
   */
  const canView = (resource) => {
    // SUPER_ADMIN → solo dashboard, admin, municipalidades y usuarios
    if (roles.includes('SUPER_ADMIN')) {
      return ['admin', 'municipalidades', 'usuarios', 'roles', 'permisos'].includes(resource);
    }
    
    // TENANT_ADMIN → todo excepto 'admin'
    if (roles.includes('TENANT_ADMIN') && resource !== 'admin') return true;

    // Si hay permisos granulares, usarlos
    if (hasGranular) {
      return permissions.includes(`sidebar:view:${resource}`);
    }

    // Fallback por rol
    for (const role of roles) {
      const allowed = ROLE_VIEW_MAP[role];
      if (!allowed) continue;
      if (allowed === '__ALL__') return true;
      if (allowed === '__ALL_EXCEPT_ADMIN__' && resource !== 'admin') return true;
      if (Array.isArray(allowed) && allowed.includes(resource)) return true;
    }

    return false;
  };

  /**
   * Verifica si el usuario tiene un permiso operativo específico.
   * Prioridad: permisos granulares > fallback por rol.
   */
  const canDo = (module, action, resource = null) => {
    // SUPER_ADMIN → acceso total
    if (roles.includes('SUPER_ADMIN')) return true;

    // TENANT_ADMIN → acceso operativo completo dentro de su tenant
    if (roles.includes('TENANT_ADMIN')) return true;

    const perm = resource ? `${module}:${action}:${resource}` : `${module}:${action}`;

    // Si hay permisos granulares, usarlos
    if (hasGranular) {
      if (permissions.includes(perm)) return true;
      // movimientos:read:* cubre consultas restringidas read:own
      if (module === 'movimientos' && action === 'read' && resource === 'own'
          && permissions.includes(`${module}:read:*`)) {
        return true;
      }
      return false;
    }

    // Fallback por rol
    for (const role of roles) {
      const allowed = ROLE_DO_MAP[role];
      if (!allowed) continue;
      if (allowed.includes(perm)) return true;
      // movimientos:read:* cubre read:own en fallback por rol
      if (module === 'movimientos' && action === 'read' && resource === 'own'
          && allowed.includes(`${module}:read:*`)) {
        return true;
      }
      // También chequear sin resource (ej: "patrimonio:read" cubre "patrimonio:read:own")
      if (resource && allowed.includes(`${module}:${action}`)) return true;
    }

    return false;
  };

  /**
   * Verifica si el usuario tiene al menos uno de los roles indicados.
   */
  const hasRole = (...requiredRoles) => {
    if (roles.includes('SUPER_ADMIN')) return true;
    return requiredRoles.some(r => roles.includes(r));
  };

  return { canView, canDo, hasRole, permissions, roles, user };
};
