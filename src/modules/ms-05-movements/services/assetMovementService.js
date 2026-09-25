import { syncAssetStatusOnMovementComplete, syncAssetStatusOnMovementCancel, syncAssetStatusOnMovementReject } from './assetStatusSyncService';
import { syncHandoverReceiptAssetsFromMovement } from './handoverReceiptSyncService';
import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env.js';

const API_BASE_URL = getEnv('VITE_GATEWAY_API_URL', 'http://localhost:5005');
const ASSET_MOVEMENTS_ENDPOINT = '/asset-movements';

class AssetMovementService {
  async createMovement(movementData) {
    const dataToSend = { ...movementData };
    if (dataToSend.attachedDocuments) {
      if (Array.isArray(dataToSend.attachedDocuments)) {
        dataToSend.attachedDocuments = JSON.stringify(dataToSend.attachedDocuments);
      } else if (typeof dataToSend.attachedDocuments === 'string') {
        try { JSON.parse(dataToSend.attachedDocuments); } catch {
          dataToSend.attachedDocuments = JSON.stringify(dataToSend.attachedDocuments);
        }
      }
    }
    const response = await httpClient.post(`${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}`, dataToSend);
    return response.data;
  }

  async getAllMovements() {
    try {
      const { data } = await httpClient.get(`${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (error.status === 404) return [];
      throw error;
    }
  }

  async getMovementById(id) {
    try {
      const { data } = await httpClient.get(`${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/${id}`);
      return data;
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  async updateMovement(id, movementData) {
    const dataToSend = { ...movementData };
    if (dataToSend.attachedDocuments === null || dataToSend.attachedDocuments === undefined || dataToSend.attachedDocuments === '') {
      dataToSend.attachedDocuments = '[]';
    } else if (Array.isArray(dataToSend.attachedDocuments)) {
      dataToSend.attachedDocuments = dataToSend.attachedDocuments.length > 0
        ? JSON.stringify(dataToSend.attachedDocuments) : '[]';
    } else if (typeof dataToSend.attachedDocuments === 'string') {
      try { JSON.parse(dataToSend.attachedDocuments); } catch { dataToSend.attachedDocuments = '[]'; }
    }
    const response = await httpClient.put(`${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/${id}`, dataToSend);
    return response.data;
  }

  async approveMovement(id, approvedBy) {
    try {
      const response = await httpClient.post(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/${id}/approve`,
        { approvedBy }
      );
      return response.data;
    } catch (error) {
      if (error.status === 400) {
        throw new Error(error.data?.message || 'approvedBy es requerido');
      }
      throw error;
    }
  }

  async rejectMovement(id, approvedBy, rejectionReason) {
    try {
      const body = { approvedBy };
      if (rejectionReason) body.rejectionReason = rejectionReason;
      const response = await httpClient.post(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/${id}/reject`, body
      );
      const rejectedMovement = response.data;

      const syncResult = await syncAssetStatusOnMovementReject(rejectedMovement);
      if (!syncResult.success) {
        console.warn('No se pudo actualizar el estado del bien al rechazar:', syncResult.error);
      }

      return rejectedMovement;
    } catch (error) {
      if (error.status === 400) {
        throw new Error(error.data?.message || 'approvedBy es requerido');
      }
      throw error;
    }
  }

  async markInProcess(id, executingUser) {
    const response = await httpClient.post(
      `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/${id}/in-process`,
      { executingUser }
    );
    return response.data;
  }

  async completeMovement(id) {
    const response = await httpClient.post(
      `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/${id}/complete`
    );
    const completedMovement = response.data;

    const movMunicipalityId = completedMovement.municipalityId;
    const syncResult = await syncAssetStatusOnMovementComplete(
      completedMovement,
      movMunicipalityId,
      async (movId) => {
        await httpClient.post(
          `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/${movId}/revert-complete`
        );
      }
    );

    if (!syncResult.success) {
      const sagaError = new Error(
        syncResult.compensated
          ? `El movimiento fue revertido porque no se pudo actualizar el bien: ${syncResult.error}`
          : `Advertencia: el movimiento se completó pero el bien no se actualizó. Error: ${syncResult.error}`
      );
      sagaError.syncResult = syncResult;
      sagaError.movement = completedMovement;
      throw sagaError;
    }

    let handoverReceiptSync = null;
    try {
      handoverReceiptSync = await syncHandoverReceiptAssetsFromMovement(completedMovement);
    } catch {
      handoverReceiptSync = null;
    }

    return { ...completedMovement, syncResult, handoverReceiptSync };
  }

  async cancelMovement(id, cancellationReason) {
    const body = {};
    if (cancellationReason) body.cancellationReason = cancellationReason;
    const response = await httpClient.post(
      `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/${id}/cancel`,
      Object.keys(body).length > 0 ? body : undefined
    );
    const cancelledMovement = response.data;

    const syncResult = await syncAssetStatusOnMovementCancel(cancelledMovement);
    if (!syncResult.success) {
      console.warn('No se pudo actualizar el estado del bien al cancelar:', syncResult.error);
    }

    return cancelledMovement;
  }

  async deleteMovement(id, deletedBy) {
    const response = await httpClient.delete(
      `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/${id}`,
      { data: { deletedBy } }
    );
    return response.data;
  }

  async restoreMovement(id, restoredBy) {
    const response = await httpClient.post(
      `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/${id}/restore`,
      { restoredBy }
    );
    return response.data;
  }

  async getMovementsByAsset(assetId) {
    try {
      const { data } = await httpClient.get(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/asset/${assetId}`
      );
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  async getMovementsByType(movementType) {
    try {
      const { data } = await httpClient.get(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/type/${movementType}`
      );
      return data;
    } catch {
      return [];
    }
  }

  async getMovementsByStatus(status) {
    try {
      const { data } = await httpClient.get(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/status/${status}`
      );
      return data;
    } catch {
      return [];
    }
  }

  async getPendingApprovalMovements() {
    try {
      const { data } = await httpClient.get(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/pending-approval`
      );
      return data;
    } catch {
      return [];
    }
  }

  async getMovementsByDestinationResponsible(destinationResponsibleId) {
    try {
      const { data } = await httpClient.get(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/destination-responsible/${destinationResponsibleId}`
      );
      return data;
    } catch {
      return [];
    }
  }

  async getMovementsByOriginResponsible(originResponsibleId) {
    try {
      const { data } = await httpClient.get(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/origin-responsible/${originResponsibleId}`
      );
      return data;
    } catch {
      return [];
    }
  }

  async countMovements() {
    try {
      const { data } = await httpClient.get(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/count`
      );
      return data?.count || 0;
    } catch {
      return 0;
    }
  }

  async getDeletedMovements() {
    try {
      const { data } = await httpClient.get(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/deleted`
      );
      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (error.status === 404) return [];
      return [];
    }
  }

  async checkActiveMovements(assetId) {
    try {
      const movements = await this.getMovementsByAsset(assetId);
      if (!movements || movements.length === 0) {
        return { hasActiveMovement: false, activeMovements: [] };
      }
      const activeStates = ['REQUESTED', 'APPROVED', 'IN_PROCESS'];
      const activeMovements = movements.filter(mov => activeStates.includes(mov.movementStatus));
      return {
        hasActiveMovement: activeMovements.length > 0,
        activeMovements
      };
    } catch (error) {
      return { hasActiveMovement: false, activeMovements: [], error: error.message };
    }
  }
}

export default new AssetMovementService();
