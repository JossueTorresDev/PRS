/**
 * Archivo de exportación principal del módulo ms-04-patrimonio
 * 
 * ESTRUCTURA REORGANIZADA:
 * - pages/assets/        → Gestión de bienes patrimoniales
 * - pages/depreciation/  → Historial de depreciación
 * - pages/disposals/     → Expedientes de baja (flujo simplificado)
 */

// Páginas de Assets (Bienes Patrimoniales)
export { default as AssetListPage } from './assets/AssetListPage';

// Páginas de Depreciation (Depreciación)
export { default as DepreciationHistoryPage } from './depreciation/DepreciationHistoryPage';

// Páginas de Disposals (Bajas)
export { default as DisposalManagementPage } from './disposals/DisposalManagementPage';
export { default as DisposalApprovalPage } from './disposals/DisposalApprovalPage';

// Por compatibilidad, exportar también el componente antiguo con su nombre original
export { default as BienesPatrimoniales } from './BienesPatrimoniales_OLD';
