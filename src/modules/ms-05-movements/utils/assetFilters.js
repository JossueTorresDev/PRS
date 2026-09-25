import { MovementType } from '../types/movementTypes';
import { validateAssetStatusForContext } from './movementAssetContext';
const EXCLUDED_ASSET_STATUSES = [
  'BAJA',
  'BAJA_PERMANENTE',
  'OBSOLETO',
  'PERDIDO',
  'ROBADO',
  'DESTRUIDO'
];
const TRANSFER_STATUSES = ['IN_USE', 'EN_USO', 'DISPONIBLE', 'AVAILABLE'];

export function getValidAssetStatusesForMovementType(movementType, { hasAssignmentHistory = false } = {}) {
  switch (movementType) {
    case MovementType.INITIAL_ASSIGNMENT:
      return hasAssignmentHistory
        ? ['DISPONIBLE', 'AVAILABLE']
        : ['DISPONIBLE', 'AVAILABLE', 'IN_USE', 'EN_USO'];
    case MovementType.RETURN:
      return ['IN_USE', 'EN_USO'];
    case MovementType.REASSIGNMENT:
    case MovementType.AREA_TRANSFER:
      return hasAssignmentHistory ? TRANSFER_STATUSES : ['IN_USE', 'EN_USO'];
    case MovementType.MAINTENANCE:
    case MovementType.REPAIR:
      return ['DISPONIBLE', 'AVAILABLE', 'IN_USE', 'EN_USO', 'MANTENIMIENTO', 'EN_MANTENIMIENTO', 'MAINTENANCE'];
    case MovementType.LOAN:
      return ['DISPONIBLE', 'AVAILABLE'];
    case MovementType.EXTERNAL_TRANSFER:
      return ['DISPONIBLE', 'AVAILABLE', 'IN_USE', 'EN_USO'];
    case MovementType.DISPOSAL:
      return ['DISPONIBLE', 'AVAILABLE', 'IN_USE', 'EN_USO'];
    default:
      return ['DISPONIBLE', 'AVAILABLE', 'IN_USE', 'EN_USO'];
  }
}
export function filterAssetsByMovementType(assets, movementType = null, options = {}) {
  if (!Array.isArray(assets) || assets.length === 0) return [];
  if (!movementType) {
    return assets.filter(asset => {
      const status = asset.assetStatus || asset.estadoBien || asset.status || '';
      if (EXCLUDED_ASSET_STATUSES.includes(status)) return false;
      return !status || status === 'DISPONIBLE' || status === 'IN_USE' || status === 'EN_USO' || status === 'AVAILABLE';
    });
  }
  const validStatuses = getValidAssetStatusesForMovementType(movementType, options)
    .map((s) => s.toUpperCase());
  return assets.filter(asset => {
    const status = (asset.assetStatus || asset.estadoBien || asset.status || '').toUpperCase();
    if (!status) return validStatuses.includes('DISPONIBLE');
    return validStatuses.includes(status);
  });
}
export function getAssetFilterMessage(movementType) {
  if (!movementType) {
    return 'Se muestran activos disponibles y en uso. Los activos dados de baja, en mantenimiento o perdidos no aparecen en la lista.';
  }
  switch (movementType) {
    case MovementType.INITIAL_ASSIGNMENT:
      return 'Activos sin movimientos completados (disponibles o con custodia en almacén).';
    case MovementType.RETURN:
      return 'Solo se muestran activos actualmente en uso que pueden ser devueltos.';
    case MovementType.REASSIGNMENT:
      return 'Se muestran activos en uso o disponibles con asignación previa que pueden reasignarse.';
    case MovementType.AREA_TRANSFER:
      return 'Se muestran activos en uso o disponibles con asignación previa que pueden transferirse entre áreas.';
    case MovementType.MAINTENANCE:
    case MovementType.REPAIR:
      return 'Se muestran activos disponibles, en uso o ya en mantenimiento.';
    case MovementType.LOAN:
      return 'Solo se muestran activos disponibles para préstamo temporal.';
    case MovementType.EXTERNAL_TRANSFER:
      return 'Se muestran activos disponibles y en uso que pueden ser transferidos externamente.';
    case MovementType.DISPOSAL:
      return 'Se muestran activos disponibles y en uso que pueden ser dados de baja.';
    default:
      return 'Se muestran activos disponibles y en uso.';
  }
}
export function validateAssetStatusForMovement(asset, movementType, options = {}) {
  const hasAssignmentHistory = options.hasAssignmentHistory ?? options.assignmentContext?.isTransfer;
  const context =
    options.assignmentContext ||
    (hasAssignmentHistory
      ? { isFirstAssignment: false, isTransfer: true }
      : { isFirstAssignment: true, isTransfer: false });
  return validateAssetStatusForContext(asset, movementType, context);
}
export default {
  filterAssetsByMovementType,
  getValidAssetStatusesForMovementType,
  getAssetFilterMessage,
  validateAssetStatusForMovement,
  EXCLUDED_ASSET_STATUSES
};
