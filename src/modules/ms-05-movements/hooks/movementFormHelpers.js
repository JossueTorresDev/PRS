import authService from '../../ms-02-authentication/services/auth.service';
import { MovementStatus } from '../types/movementTypes';

export const INITIAL_FORM = {
  assetId: '',
  assetIds: [],
  assetItems: [],
  movementType: '',
  movementSubtype: '',
  originResponsibleId: '',
  destinationResponsibleId: '',
  originAreaId: '',
  destinationAreaId: '',
  originLocationId: '',
  destinationLocationId: '',
  reason: '',
  observations: '',
  specialConditions: '',
  supportingDocumentNumber: '',
  supportingDocumentType: '',
  attachedDocuments: '',
  requiresApproval: true,
  movementStatus: MovementStatus.REQUESTED,
  requestingUser: '',
  executingUser: '',
};

export const getCurrentUserId = () => {
  const currentUser = authService.getCurrentUser();
  if (currentUser?.userId || currentUser?.id) return currentUser.userId || currentUser.id;
  try {
    const stored = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (stored?.userId || stored?.id) return stored.userId || stored.id;
  } catch { /* sessionStorage inválido */ }
  try {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user_id || payload.sub || payload.userId || payload.id;
    }
  } catch { /* token inválido */ }
  return null;
};

export const findWarehouseArea = (areas) =>
  areas.find((a) => {
    const code = (a.areaCode || '').toUpperCase();
    const name = (a.name || '').toLowerCase();
    return (
      code === 'DGA-PAT-06'
      || name.includes('almacen')
      || name.includes('almacén')
      || name.includes('logistica')
      || name.includes('logística')
      || name.includes('abastecimiento')
    );
  });

export const findWarehouseLocation = (locations) =>
  locations.find((l) => {
    const code = (l.locationCode || '').toUpperCase();
    const name = (l.name || '').toLowerCase();
    return (
      code === 'LOC-003'
      || name.includes('logística y abastecimiento')
      || name.includes('logistica y abastecimiento')
      || name.includes('almacén')
      || name.includes('almacen')
      || name.includes('logistica')
      || name.includes('logística')
    );
  });

export const syncAssetFields = (items) => {
  const normalized = (items || []).map((item) => ({
    assetId: item.assetId,
    quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
  }));
  return {
    assetItems: normalized,
    assetIds: normalized.map((item) => item.assetId),
    assetId: normalized[0]?.assetId || '',
  };
};

export const resolveAssetId = (asset) => asset?.id || asset?.assetId || asset?.uuid || null;

export const matchesAssetId = (asset, assetId) => {
  if (!asset || assetId == null || assetId === '') return false;
  const id = resolveAssetId(asset);
  return id != null && String(id) === String(assetId);
};
