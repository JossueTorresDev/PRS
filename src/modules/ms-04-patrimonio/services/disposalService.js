import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env.js';
import assetMovementService from '../../ms-05-movements/services/assetMovementService';

const API_BASE_URL = `${getEnv('VITE_GATEWAY_API_URL', 'http://localhost:5003/api/v1')}`;

const normalizeDateTime = (v) => {
  if (!v) return null;
  if (v instanceof Date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}T${pad(v.getHours())}:${pad(v.getMinutes())}:${pad(v.getSeconds())}`;
  }
  if (typeof v === 'string') {
    const s = v.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00:00`;
    if (/Z$/.test(s)) return s.replace(/Z$/, '');
    return s;
  }
  return null;
};

export const getDisposalDetailsByDisposalId = async (disposalId) => {
  const { data } = await httpClient.get(`${API_BASE_URL}/asset-disposal-details/disposal/${disposalId}`);
  return data;
};

export const getActiveAssetIds = async () => {
  const { data } = await httpClient.get(`${API_BASE_URL}/asset-disposal-details/active-asset-ids`);
  return data;
};

export const createDisposal = async (data) => {
  const response = await httpClient.post(`${API_BASE_URL}/asset-disposals`, data);
  return response.data;
};

export const updateDisposal = async (id, data) => {
  const response = await httpClient.put(`${API_BASE_URL}/asset-disposals/${id}`, data);
  return response.data;
};

export const getAllDisposals = async () => {
  const { data } = await httpClient.get(`${API_BASE_URL}/asset-disposals`);
  return data;
};

export const getDisposalById = async (id) => {
  const { data } = await httpClient.get(`${API_BASE_URL}/asset-disposals/${id}`);
  return data;
};

export const getDisposalsByStatus = async (status) => {
  const { data } = await httpClient.get(`${API_BASE_URL}/asset-disposals/status/${status}`);
  return data;
};

export const getDisposalByFileNumber = async (fileNumber) => {
  const { data } = await httpClient.get(`${API_BASE_URL}/asset-disposals/file-number/${fileNumber}`);
  return data;
};

export const getDisposalsByRequestedBy = async (userId) => {
  const { data } = await httpClient.get(`${API_BASE_URL}/asset-disposals/requested-by/${userId}`);
  return data;
};

export const assignCommittee = async (disposalId, data) => {
  const response = await httpClient.put(`${API_BASE_URL}/asset-disposals/${disposalId}/assign-committee`, {
    assignedBy: data.assignedBy,
  });
  return response.data;
};

export const resolveDisposal = async (disposalId, data) => {
  const payload = {
    approved: data.approved,
    resolutionNumber: data.resolutionNumber,
    observations: data.observations,
  };
  const response = await httpClient.put(`${API_BASE_URL}/asset-disposals/${disposalId}/resolve`, payload);
  return response.data;
};

export const cancelDisposal = async (disposalId, cancelledBy) => {
  const { data } = await httpClient.patch(`${API_BASE_URL}/asset-disposals/${disposalId}/cancel`, null, {
    params: { cancelledBy },
  });
  return data;
};

export const finalizeDisposal = async (disposalId) => {
  const response = await httpClient.patch(`${API_BASE_URL}/asset-disposals/${disposalId}/complete`);
  const result = response.data;

  const disposal = await getDisposalWithAssets(disposalId);
  const assets = disposal?.disposalAssets || disposal?.assets || [];
  const timestamp = Date.now();

  Promise.all(assets.map(detail => {
    const movementData = {
      municipalityId: disposal.municipalityId,
      movementNumber: `MV-BAJA-${String(detail.assetId || '').substring(0, 8).toUpperCase()}-${timestamp}`,
      assetId: detail.assetId,
      movementType: 'DISPOSAL',
      movementSubtype: detail.recommendation || null,
      originResponsibleId: detail.currentResponsibleId || detail.asset?.currentResponsibleId || null,
      destinationResponsibleId: detail.removalResponsibleId || detail.removalResponsible || null,
      originLocationId: detail.currentLocationId || detail.asset?.currentLocationId || null,
      destinationLocationId: null,
      originAreaId: null,
      destinationAreaId: null,
      requestDate: normalizeDateTime(disposal.requestDate) || null,
      approvalDate: normalizeDateTime(disposal.approvalDate) || null,
      executionDate: normalizeDateTime(disposal.physicalRemovalDate) || null,
      movementStatus: 'COMPLETED',
      requiresApproval: false,
      approvedBy: disposal.approvedById || null,
      reason: disposal.reasonDescription || null,
      observations: detail.observations || null,
      specialConditions: null,
      requestingUser: disposal.requestedBy || null,
    };
    return assetMovementService.createMovement(movementData)
      .catch(err => {});
  }));

  return result;
};

export const restoreDisposal = async (disposalId) => {
  const { data } = await httpClient.patch(`${API_BASE_URL}/asset-disposals/${disposalId}/restore`);
  return data;
};

export const deleteDisposal = async (disposalId) => {
  await httpClient.delete(`${API_BASE_URL}/asset-disposals/${disposalId}`);
  return true;
};

export const addAssetToDisposal = async (data) => {
  const response = await httpClient.post(`${API_BASE_URL}/asset-disposal-details`, data);
  return response.data;
};

export const getDisposalDetailById = async (id) => {
  const { data } = await httpClient.get(`${API_BASE_URL}/asset-disposal-details/${id}`);
  return data;
};

export const getAssetsByDisposalId = async (disposalId) => {
  const { data } = await httpClient.get(`${API_BASE_URL}/asset-disposal-details/disposal/${disposalId}`);
  return data;
};

export const getDisposalHistoryByAsset = async (assetId) => {
  const { data } = await httpClient.get(`${API_BASE_URL}/asset-disposal-details/asset/${assetId}`);
  return data;
};

export const addTechnicalOpinion = async (detailId, data) => {
  const response = await httpClient.put(`${API_BASE_URL}/asset-disposal-details/${detailId}/technical-opinion`, data);
  return response.data;
};

export const executeRemoval = async (detailId, data) => {
  const response = await httpClient.put(`${API_BASE_URL}/asset-disposal-details/${detailId}/execute-removal`, data);
  return response.data;
};

export const removeAssetFromDisposal = async (detailId) => {
  await httpClient.delete(`${API_BASE_URL}/asset-disposal-details/${detailId}`);
  return true;
};

export const getDisposalWithAssets = async (disposalId) => {
  const [disposal, assets] = await Promise.all([
    getDisposalById(disposalId),
    getAssetsByDisposalId(disposalId),
  ]);
  return {
    ...disposal,
    disposalAssets: assets,
    assets,
  };
};

export const DISPOSAL_STATUS = [
  { value: 'INITIATED', label: 'Iniciado', color: 'blue' },
  { value: 'UNDER_EVALUATION', label: 'En Evaluación', color: 'yellow' },
  { value: 'APPROVED', label: 'Aprobado', color: 'green' },
  { value: 'REJECTED', label: 'Rechazado', color: 'red' },
  { value: 'EXECUTED', label: 'Ejecutado', color: 'purple' },
  { value: 'CANCELLED', label: 'Cancelado', color: 'gray' },
];

export const DISPOSAL_TYPES = [
  { value: 'ADMINISTRATIVE', label: 'Administrativa', icon: '📋' },
  { value: 'TECHNICAL', label: 'Técnica', icon: '🔧' },
  { value: 'FORTUITOUS', label: 'Fortuita', icon: '⚡' },
  { value: 'OBSOLESCENCE', label: 'Obsolescencia', icon: '⏳' },
];

export const RECOMMENDATIONS = [
  { value: 'DESTROY', label: 'Destruir' },
  { value: 'DONATE', label: 'Donar' },
  { value: 'SELL', label: 'Vender' },
  { value: 'RECYCLE', label: 'Reciclar' },
  { value: 'TRANSFER', label: 'Transferir' },
];

export const createDisposalRequest = async (data) => {
  if (!data.technicalReportAuthorId || data.technicalReportAuthorId.trim() === '') {
    throw new Error('El campo technicalReportAuthorId es obligatorio y no puede estar vacío');
  }

  const payload = {
    municipalityId: data.municipalityId,
    disposalType: data.disposalType,
    disposalReason: data.disposalReason,
    reasonDescription: data.reasonDescription,
    technicalReportAuthorId: data.technicalReportAuthorId,
    observations: data.observations || null,
    requiresDestruction: data.requiresDestruction || false,
    allowsDonation: data.allowsDonation || false,
    recoverableValue: data.recoverableValue || 0,
    requestedBy: data.requestedBy,
    supportingDocuments: data.supportingDocuments || [],
  };

  const response = await httpClient.post(`${API_BASE_URL}/asset-disposals`, payload);
  return response.data;
};

export const getPendingDisposalRequests = async () => {
  const { data } = await httpClient.get(`${API_BASE_URL}/asset-disposals/status/INITIATED`);
  return data;
};

export const getDisposalsUnderEvaluation = async () => {
  const { data } = await httpClient.get(`${API_BASE_URL}/asset-disposals/status/UNDER_EVALUATION`);
  return data;
};

export const getApprovedDisposals = async () => {
  const { data } = await httpClient.get(`${API_BASE_URL}/asset-disposals/status/APPROVED`);
  return data;
};

export const getDisposalRequestHistory = async () => {
  const { data } = await httpClient.get(`${API_BASE_URL}/asset-disposals`);
  return data;
};
