import { getBienPatrimonialById, cambiarEstadoBien, actualizarBienPatrimonial } from '../../ms-04-patrimonio/services/api';
import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env.js';
import { MovementType } from '../types/movementTypes';
import { computeAssetStockBalance } from '../utils/movementAssetContext';

const MOVEMENTS_API = `${getEnv('VITE_GATEWAY_API_URL', 'http://localhost:5005')}/asset-movements`;

async function fetchAssetMovements(assetId) {
  try {
    const { data } = await httpClient.get(`${MOVEMENTS_API}/asset/${assetId}`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function withRetry(fn, maxRetries = 3, baseDelayMs = 500) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise(res => setTimeout(res, baseDelayMs * attempt));
      }
    }
  }
  throw lastError;
}

function determineNewAssetStatus(movementType) {
  switch (movementType) {
    case MovementType.RETURN: return 'DISPONIBLE';
    case MovementType.INITIAL_ASSIGNMENT:
    case MovementType.REASSIGNMENT:
    case MovementType.AREA_TRANSFER:
    case MovementType.LOAN:
    case MovementType.EXTERNAL_TRANSFER: return 'IN_USE';
    case MovementType.MAINTENANCE:
    case MovementType.REPAIR: return 'MANTENIMIENTO';
    case MovementType.DISPOSAL: return 'BAJA';
    default: return null;
  }
}

function resolveMovementAssetIds(movement) {
  if (Array.isArray(movement?.assetItems) && movement.assetItems.length > 0) {
    return [...new Set(movement.assetItems.map((item) => item.assetId).filter(Boolean))];
  }
  if (Array.isArray(movement?.assetIds) && movement.assetIds.length > 0) {
    return [...new Set(movement.assetIds.filter(Boolean))];
  }
  if (movement?.assetId) return [movement.assetId];
  return [];
}

async function syncSingleAssetOnComplete(assetId, movement) {
  const asset = await withRetry(() => getBienPatrimonialById(assetId));
  if (!asset) {
    throw new Error(`No se encontró el activo ${assetId}`);
  }
  let newStatus = determineNewAssetStatus(movement.movementType);
  if (!newStatus) {
    return { assetId, updated: false, message: 'No se requiere cambio de estado' };
  }
  try {
    const movements = await fetchAssetMovements(assetId);
    const stock = computeAssetStockBalance(asset, movements);
    if (stock.isStockItem && movement.movementType === MovementType.INITIAL_ASSIGNMENT && stock.availableInWarehouse > 0) {
      newStatus = 'AVAILABLE';
    }
  } catch {}
  const camposAActualizar = { assetStatus: newStatus };
  if (movement.destinationLocationId) camposAActualizar.currentLocationId = movement.destinationLocationId;
  if (movement.destinationAreaId) camposAActualizar.currentAreaId = movement.destinationAreaId;
  if (movement.destinationResponsibleId) camposAActualizar.currentResponsibleId = movement.destinationResponsibleId;
  const updatedAsset = await withRetry(() => actualizarBienPatrimonial(assetId, camposAActualizar));
  return { assetId, updated: true, newStatus, asset: updatedAsset };
}

export async function syncAssetStatusOnMovementComplete(movement, municipalityId, revertMovementFn = null) {
  const assetIds = resolveMovementAssetIds(movement);
  if (assetIds.length === 0) {
    return { success: false, error: 'El movimiento no tiene activos asociados', assetUpdated: false };
  }
  const updatedAssets = [];
  const failures = [];
  for (const assetId of assetIds) {
    try {
      const result = await syncSingleAssetOnComplete(assetId, movement);
      if (result.updated) updatedAssets.push(result);
    } catch (error) {
      failures.push({ assetId, error: error.message || 'Error al sincronizar el activo' });
    }
  }
  if (failures.length === 0) {
    return {
      success: true,
      message: updatedAssets.length > 1 ? `${updatedAssets.length} activos sincronizados correctamente` : 'Activo sincronizado correctamente',
      assetUpdated: updatedAssets.length > 0,
      updatedCount: updatedAssets.length,
      totalCount: assetIds.length,
      newStatus: updatedAssets[0]?.newStatus,
      compensated: false,
    };
  }
  let compensated = false;
  let compensationError = null;
  if (typeof revertMovementFn === 'function') {
    try {
      await withRetry(() => revertMovementFn(movement.id, municipalityId));
      compensated = true;
    } catch (compErr) {
      compensationError = compErr.message;
    }
  }
  const failedIds = failures.map((item) => item.assetId).join(', ');
  return {
    success: false,
    error: `No se pudieron sincronizar ${failures.length} activo(s): ${failedIds}`,
    assetUpdated: updatedAssets.length > 0,
    updatedCount: updatedAssets.length,
    totalCount: assetIds.length,
    failures,
    compensated,
    compensationError,
  };
}

async function syncAllAssetsToStatus(movement, newStatus, motivo) {
  const assetIds = resolveMovementAssetIds(movement);
  if (assetIds.length === 0) {
    return { success: false, error: 'El movimiento no tiene activos asociados', assetUpdated: false };
  }
  const failures = [];
  for (const assetId of assetIds) {
    try {
      await withRetry(() => cambiarEstadoBien(assetId, newStatus, motivo));
    } catch (error) {
      failures.push({ assetId, error: error.message || 'Error al actualizar estado del activo' });
    }
  }
  if (failures.length > 0) {
    return { success: false, error: `No se actualizaron ${failures.length} activo(s)`, assetUpdated: false, failures };
  }
  return {
    success: true,
    message: assetIds.length > 1 ? `Estado de ${assetIds.length} activos actualizado a ${newStatus}` : `Estado del activo actualizado a ${newStatus}`,
    assetUpdated: true,
    newStatus,
    updatedCount: assetIds.length,
  };
}

export async function syncAssetStatusOnMovementCancel(movement) {
  const motivo = `Movimiento cancelado: ${movement.movementNumber || movement.id}`;
  return syncAllAssetsToStatus(movement, 'DISPONIBLE', motivo);
}

export async function syncAssetStatusOnMovementReject(movement) {
  const motivo = `Movimiento rechazado: ${movement.movementNumber || movement.id}`;
  return syncAllAssetsToStatus(movement, 'DISPONIBLE', motivo);
}

export default {
  syncAssetStatusOnMovementComplete,
  syncAssetStatusOnMovementCancel,
  syncAssetStatusOnMovementReject,
};
