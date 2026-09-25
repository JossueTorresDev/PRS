import { usePermissions } from '../../hooks/usePermissions';

export const useSidebarConfig = () => {
  const { canView } = usePermissions();

  return [
    // ── Dashboard ───────────────────────────────────────────
    {
      key: "dashboard",
      label: "Dashboard",
      icon: "chart",
      path: "/",
      implemented: true,
      visible: true // Siempre visible
    },

    // ── Administración Global (solo SUPER_ADMIN) ────────────
    canView('admin') && {
      key: "admin",
      label: "Administración",
      color: "#dc2626",
      icon: "shield-check",
      children: [
        { key: "municipalidades", label: "Municipalidades", path: "/admin/municipalidades", icon: "building-2", implemented: true },
        { key: "suscripciones", label: "Suscripciones", path: "/admin/suscripciones", icon: "credit-card", implemented: false, badge: "Próximamente" },
        { key: "facturacion", label: "Facturación", path: "/admin/facturacion", icon: "receipt", implemented: false, badge: "Próximamente" },
        { key: "onboarding", label: "Onboarding", path: "/admin/onboarding", icon: "user-plus", implemented: false, badge: "Próximamente" }
      ]
    },

    // ── Gestión de Activos ──────────────────────────────────
    (canView('bienes') || canView('categorias') || canView('proveedores') || canView('ubicaciones')) && {
      key: "assets",
      label: "Gestión de Activos",
      color: "#34d399",
      icon: "box",
      children: [
        canView('bienes') && { key: "bienes", label: "Bienes", path: "/bienes", icon: "package", implemented: true },
        canView('categorias') && { key: "categorias", label: "Categorías", path: "/categorias", icon: "tag", implemented: true },
        canView('proveedores') && { key: "proveedores", label: "Proveedores", path: "/proveedores", icon: "truck", implemented: true },
        canView('ubicaciones') && { key: "ubicaciones", label: "Ubicaciones", path: "/ubicaciones", icon: "map-pin", implemented: true }
      ].filter(Boolean)
    },

    // ── Operaciones ─────────────────────────────────────────
    (canView('movimientos') || canView('actas') || canView('inventarios') || canView('mantenimientos')) && {
      key: "operations",
      label: "Operaciones",
      color: "#f59e0b",
      icon: "swap",
      children: [
        canView('movimientos') && { key: "movimientos", label: "Movimientos", path: "/movimientos", icon: "arrow-right", implemented: true },
        canView('actas') && { key: "actas", label: "Actas de Entrega", path: "/actas", icon: "file-text", implemented: true },
        canView('inventarios') && { key: "inventarios", label: "Inventarios", path: "/inventarios", icon: "clipboard", implemented: true },
        canView('mantenimientos') && { key: "mantenimientos", label: "Mantenimientos", path: "/mantenimientos", icon: "tool", implemented: true }
      ].filter(Boolean)
    },

    // ── Usuarios y Seguridad ────────────────────────────────
    (canView('usuarios') || canView('personas') || canView('roles') || canView('permisos') || canView('areas') || canView('cargos')) && {
      key: "users",
      label: "Usuarios y Seguridad",
      color: "#f97316",
      icon: "users",
      children: [
        canView('usuarios') && { key: "usuarios", label: "Usuarios", path: "/usuarios", icon: "user", implemented: true },
        canView('personas') && { key: "personas", label: "Personas", path: "/personas", icon: "user-check", implemented: true },
        canView('roles') && { key: "roles", label: "Roles", path: "/roles", icon: "shield", implemented: true },
        canView('permisos') && { key: "permisos", label: "Permisos", path: "/permisos", icon: "lock", implemented: true },
        canView('areas') && { key: "areas", label: "Áreas", path: "/areas", icon: "building", implemented: true },
        canView('cargos') && { key: "cargos", label: "Cargos", path: "/cargos", icon: "briefcase", implemented: true }
      ].filter(Boolean)
    },

    // ── Contabilidad ────────────────────────────────────────
    (canView('bajas') || canView('valores')) && {
      key: "accounting",
      label: "Contabilidad",
      color: "#eab308",
      icon: "calculator",
      children: [
        canView('bajas') && { key: "bajas", label: "Bajas de Activos", path: "/bajas", icon: "trash", implemented: true },
        canView('valores') && { key: "valores", label: "Historial de Valores", path: "/valores", icon: "dollar-sign", implemented: false, badge: "Próximamente" }
      ].filter(Boolean)
    },

    // ── Reportes y Auditoría ────────────────────────────────
    (canView('reportes') || canView('auditoria') || canView('notificaciones')) && {
      key: "reports",
      label: "Reportes",
      color: "#8b5cf6",
      icon: "report",
      children: [
        canView('reportes') && { key: "reportes", label: "Reportes", path: "/reportes", icon: "bar-chart", implemented: true },
        canView('auditoria') && { key: "auditoria", label: "Auditoría", path: "/auditoria", icon: "shield", implemented: true },
        canView('notificaciones') && { key: "notificaciones", label: "Notificaciones", path: "/notificaciones", icon: "bell", implemented: true }
      ].filter(Boolean)
    },

    // ── Configuración ───────────────────────────────────────
    canView('sistema') && {
      key: "settings",
      label: "Configuración",
      color: "#94a3b8",
      icon: "cog",
      children: [
        { key: "sistema", label: "Sistema", path: "/sistema", icon: "settings", implemented: true }
      ]
    }
  ].filter(Boolean); // Este filter elimina los bloques que devolvieron 'false' al fallar canView()
};
