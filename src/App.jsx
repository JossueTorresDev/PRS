import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import SidebarLayout from "./layouts/SidebarLayout";
import RoleGuard from "./components/RoleGuard";
import Dashboard from "./modules/ms-01-dashboard/pages";
import MunicipalDashboard from "./modules/ms-01-dashboard/pages/MunicipalDashboard";
import InternalManagement from "./modules/ms-01-dashboard/pages/InternalManagement";
import PlatformAdmin from "./modules/ms-01-dashboard/pages/PlatformAdmin";
import PublicHome from "./modules/ms-01-dashboard/pages/PublicHome";
import TenantManagement from "./modules/ms-01-tenant-management/pages";
import { AuthProvider } from "./modules/ms-02-authentication/components/AuthProvider.jsx";
import { useAuth } from "./modules/ms-02-authentication/hooks/useAuth.jsx";
import {
  withAuth,
  withPublicAuth,
} from "./modules/ms-02-authentication/hooks/useProtectedRoute.jsx";
import { LoginPage } from "./modules/ms-02-authentication/pages";
import ForcedPasswordChangePage from "./modules/ms-02-authentication/pages/ForcedPasswordChangePage.jsx";
import Categoria from "./modules/ms-03-configuration/components/categoria/category.jsx";
import sistema from "./modules/ms-03-configuration/components/sistema/SystemConfiguration.jsx";
import Bienes from "./modules/ms-04-patrimonio/pages/assets/AssetListPage";
import DepreciationHistoryPage from "./modules/ms-04-patrimonio/pages/depreciation/DepreciationHistoryPage";
import DisposalManagement from "./modules/ms-04-patrimonio/pages/disposals/DisposalManagementPage";

import Permisos from "./modules/ms-02-authentication/components/permissions/PermissionsPage";
import Personas from "./modules/ms-02-authentication/components/personas/PersonasPage";
import Roles from "./modules/ms-02-authentication/components/roles/RolesPage";
import Usuarios from "./modules/ms-02-authentication/components/usuarios/UsuariosPage";
import Areas from "./modules/ms-03-configuration/components/areas/AreasPage";
import Cargos from "./modules/ms-03-configuration/components/cargos/PositionList";
import PhysicalLocationPage from "./modules/ms-03-configuration/components/physical-location/PhysicalLocationPage.jsx";
import Suppliers from "./modules/ms-03-configuration/components/suppliers";
import Movimientos from "./modules/ms-05-movements/pages";
import Actas from "./modules/ms-05-movements/pages/ActasPage";
import Inventarios from "./modules/ms-06-inventario/pages";
import InventoryDetailsPage from "./modules/ms-06-inventario/pages/InventoryDetailsPage";
import Mantenimientos from "./modules/ms-07-mantenimiento/pages";
import Reportes from "./modules/ms-08-reportes/pages";

// Componentes protegidos (autenticación)
const ProtectedDashboard = withAuth(Dashboard);
const ProtectedMunicipalDashboard = withAuth(MunicipalDashboard);
const ProtectedInternalManagement = withAuth(InternalManagement);
const ProtectedPlatformAdmin = withAuth(PlatformAdmin);
const ProtectedTenantManagement = withAuth(TenantManagement);
const ProtectedBienes = withAuth(Bienes);
const ProtectedMovimientos = withAuth(Movimientos);
const ProtectedActas = withAuth(Actas);
const ProtectedInventarios = withAuth(Inventarios);
const ProtectedInventoryDetails = withAuth(InventoryDetailsPage);
const ProtectedMantenimientos = withAuth(Mantenimientos);
const ProtectedAreas = withAuth(Areas);
const ProtectedSuppliers = withAuth(Suppliers);
const ProtectedPersonas = withAuth(Personas);
const ProtectedUsuarios = withAuth(Usuarios);
const ProtectedRoles = withAuth(Roles);
const ProtectedPermisos = withAuth(Permisos);
const ProtectedCargos = withAuth(Cargos);
const ProtectedReportes = withAuth(Reportes);
const ProtectedCategoria = withAuth(Categoria);
const Protectedsistema = withAuth(sistema);
const ProtectedPhysicalLocation = withAuth(PhysicalLocationPage);
const ProtectedDisposalManagement = withAuth(DisposalManagement);
const ProtectedForcedPasswordChange = withAuth(ForcedPasswordChangePage);

// Componentes públicos
const PublicLogin = withPublicAuth(LoginPage);

const HomeRedirect = () => {
  const { user } = useAuth();
  const roles = user?.roles || [];

  if (roles.includes('SUPER_ADMIN') || roles.includes('ONBOARDING_MANAGER')) {
    return <ProtectedPlatformAdmin />;
  }
  
  if (roles.includes('TENANT_ADMIN') || roles.includes('MOVIMIENTOS_APROBADOR')) {
    return <ProtectedInternalManagement />;
  }

  return <ProtectedMunicipalDashboard />;
};

function App() {
  useEffect(() => {
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.style.opacity = "0";
        loadingScreen.style.transition = "opacity 0.5s ease-out";
        setTimeout(() => {
          loadingScreen.remove();
        }, 500);
      }, 1000);
    }
  }, []);

  return (
    <AuthProvider>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<PublicLogin />} />
        <Route path="/home" element={<PublicHome />} />

        {/* Cambio de contraseña obligatorio */}
        <Route path="/auth/change-password" element={<ProtectedForcedPasswordChange />} />

        {/* ── Dashboard (Redirección inteligente según rol) ── */}
        <Route path="/" element={
          <SidebarLayout><HomeRedirect /></SidebarLayout>
        } />

        {/* ── ADMINISTRACIÓN (SUPER_ADMIN, ONBOARDING_MANAGER) ── */}
        <Route path="/admin/municipalidades" element={
          <SidebarLayout>
            <RoleGuard allowedRoles={['SUPER_ADMIN', 'ONBOARDING_MANAGER']}>
              <ProtectedTenantManagement />
            </RoleGuard>
          </SidebarLayout>
        } />
        <Route path="/admin/suscripciones" element={
          <SidebarLayout>
            <RoleGuard allowedRoles={['SUPER_ADMIN', 'ONBOARDING_MANAGER']}>
              <ProtectedTenantManagement />
            </RoleGuard>
          </SidebarLayout>
        } />
        <Route path="/admin/facturacion" element={
          <SidebarLayout>
            <RoleGuard allowedRoles={['SUPER_ADMIN', 'ONBOARDING_MANAGER']}>
              <ProtectedTenantManagement />
            </RoleGuard>
          </SidebarLayout>
        } />
        <Route path="/admin/onboarding" element={
          <SidebarLayout>
            <RoleGuard allowedRoles={['SUPER_ADMIN', 'ONBOARDING_MANAGER']}>
              <ProtectedTenantManagement />
            </RoleGuard>
          </SidebarLayout>
        } />

        {/* ── BIENES (patrimonio + movimientos + inventario) ── */}
        <Route path="/bienes" element={
          <SidebarLayout>
            <RoleGuard allowedRoles={['PATRIMONIO_GESTOR', 'PATRIMONIO_OPERARIO', 'PATRIMONIO_VIEWER', 'MOVIMIENTOS_SOLICITANTE', 'MOVIMIENTOS_APROBADOR', 'MOVIMIENTOS_EJECUTOR', 'INVENTARIO_COORDINADOR', 'INVENTARIO_VERIFICADOR', 'TENANT_ADMIN']}>
              <ProtectedBienes />
            </RoleGuard>
          </SidebarLayout>
        } />
        <Route path="/historial/:assetId" element={
          <SidebarLayout>
            <RoleGuard allowedRoles={['PATRIMONIO_GESTOR', 'TENANT_ADMIN']}>
              <DepreciationHistoryPage />
            </RoleGuard>
          </SidebarLayout>
        } />

        {/* ── BAJAS (patrimonio + auditoría) ── */}
        <Route path="/bajas" element={
          <SidebarLayout>
            <RoleGuard allowedRoles={['PATRIMONIO_GESTOR', 'PATRIMONIO_EVALUADOR', 'PATRIMONIO_APROBADOR', 'PATRIMONIO_EJECUTOR', 'AUDITORIA_VIEWER', 'TENANT_ADMIN']}>
              <ProtectedDisposalManagement />
            </RoleGuard>
          </SidebarLayout>
        } />

        {/* ── MOVIMIENTOS ── */}
        <Route path="/movimientos" element={
          <SidebarLayout>
            <RoleGuard allowedRoles={['MOVIMIENTOS_SOLICITANTE', 'MOVIMIENTOS_APROBADOR', 'MOVIMIENTOS_EJECUTOR', 'MOVIMIENTOS_VIEWER', 'TENANT_ADMIN']}>
              <ProtectedMovimientos />
            </RoleGuard>
          </SidebarLayout>
        } />
        <Route path="/actas" element={
          <SidebarLayout>
            <RoleGuard allowedRoles={['MOVIMIENTOS_APROBADOR', 'MOVIMIENTOS_EJECUTOR', 'TENANT_ADMIN']}>
              <ProtectedActas />
            </RoleGuard>
          </SidebarLayout>
        } />

        {/* ── INVENTARIOS ── */}
        <Route path="/inventarios" element={
          <SidebarLayout>
            <RoleGuard allowedRoles={['INVENTARIO_COORDINADOR', 'INVENTARIO_VERIFICADOR', 'TENANT_ADMIN']}>
              <ProtectedInventarios />
            </RoleGuard>
          </SidebarLayout>
        } />
        <Route path="/inventarios/:inventoryId/detalles" element={
          <SidebarLayout>
            <RoleGuard allowedRoles={['INVENTARIO_COORDINADOR', 'INVENTARIO_VERIFICADOR', 'TENANT_ADMIN']}>
              <ProtectedInventoryDetails />
            </RoleGuard>
          </SidebarLayout>
        } />

        {/* ── MANTENIMIENTOS ── */}
        <Route path="/mantenimientos" element={
          <SidebarLayout>
            <RoleGuard allowedRoles={['MANTENIMIENTO_GESTOR', 'MANTENIMIENTO_VIEWER', 'TENANT_ADMIN']}>
              <ProtectedMantenimientos />
            </RoleGuard>
          </SidebarLayout>
        } />

        {/* ── CONFIGURACIÓN (TENANT_ADMIN, TENANT_CONFIG_MANAGER) ── */}
        <Route path="/areas" element={
          <SidebarLayout>
            <RoleGuard allowedRoles={['TENANT_ADMIN', 'TENANT_CONFIG_MANAGER']}>
              <ProtectedAreas />
            </RoleGuard>
          </SidebarLayout>
        } />
        <Route path="/ubicaciones" element={
          <SidebarLayout>
            <RoleGuard allowedRoles={['TENANT_ADMIN', 'TENANT_CONFIG_MANAGER']}>
              <ProtectedPhysicalLocation />
            </RoleGuard>
          </SidebarLayout>
        } />
        <Route path="/proveedores" element={
          <SidebarLayout>
            <RoleGuard allowedRoles={['TENANT_ADMIN', 'TENANT_CONFIG_MANAGER']}>
              <ProtectedSuppliers />
            </RoleGuard>
          </SidebarLayout>
        } />
        <Route path="/categorias" element={
          <SidebarLayout>
            <RoleGuard allowedRoles={['TENANT_ADMIN', 'TENANT_CONFIG_MANAGER']}>
              <ProtectedCategoria />
            </RoleGuard>
          </SidebarLayout>
        } />
        <Route path="/cargos" element={
          <SidebarLayout>
            <RoleGuard allowedRoles={['TENANT_ADMIN', 'TENANT_CONFIG_MANAGER']}>
              <ProtectedCargos />
            </RoleGuard>
          </SidebarLayout>
        } />
        <Route path="/sistema" element={
          <SidebarLayout>
            <RoleGuard allowedRoles={['TENANT_ADMIN', 'TENANT_CONFIG_MANAGER']}>
              <Protectedsistema />
            </RoleGuard>
          </SidebarLayout>
        } />

        {/* ── USUARIOS Y SEGURIDAD (TENANT_ADMIN) ── */}
        <Route path="/personas" element={
          <SidebarLayout>
            <RoleGuard allowedRoles={['TENANT_ADMIN']}>
              <ProtectedPersonas />
            </RoleGuard>
          </SidebarLayout>
        } />
        <Route path="/usuarios" element={
          <SidebarLayout>
            <RoleGuard allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
              <ProtectedUsuarios />
            </RoleGuard>
          </SidebarLayout>
        } />
        <Route path="/roles" element={
          <SidebarLayout>
            <RoleGuard allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
              <ProtectedRoles />
            </RoleGuard>
          </SidebarLayout>
        } />
        <Route path="/permisos" element={
          <SidebarLayout>
            <RoleGuard allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
              <ProtectedPermisos />
            </RoleGuard>
          </SidebarLayout>
        } />

        {/* ── REPORTES (AUDITORIA_VIEWER, TENANT_ADMIN) ── */}
        <Route path="/reportes" element={
          <SidebarLayout>
            <RoleGuard allowedRoles={['AUDITORIA_VIEWER', 'REPORTES_VIEWER', 'TENANT_ADMIN']}>
              <ProtectedReportes />
            </RoleGuard>
          </SidebarLayout>
        } />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
