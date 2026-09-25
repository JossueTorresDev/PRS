import { getBienPatrimonialById } from '../../ms-04-patrimonio/services/api';
import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env.js';
import { isUuidLike, resolveMovementAssetItems } from './movementReportHelpers';
import { cleanAssetName } from './assetNameFormatter';

const API_BASE_URL = getEnv('VITE_GATEWAY_API_URL', '/api/v1');
const ASSET_MOVEMENTS_ENDPOINT = '/asset-movements';

function unwrapAsset(raw) {
  if (!raw) return null;
  if (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) return raw.data;
  return raw;
}

export function isPlaceholderReceiptDescription(text) {
  const value = String(text || '').trim().toLowerCase();
  return !value
    || value === 'sin descripción'
    || value === 'sin descripcion'
    || value.includes('bien patrimonial del movimiento')
    || value.includes('auto-generated');
}

function isMissingReceiptCode(code) {
  const value = String(code || '').trim();
  return !value || value === '—' || value === '-' || value === 'N/A';
}

export function isUnresolvedReceiptAssetLine(line = {}) {
  const code = String(line.assetCode || line.code || '').trim();
  const description = String(
    line.assetDescription || line.description || line.descripcion || ''
  ).trim();
  return isUuidLike(code)
    || isMissingReceiptCode(code)
    || isPlaceholderReceiptDescription(description);
}

export function extractAssetPatrimonialFields(asset, assetId) {
  const record = unwrapAsset(asset) || {};
  const rawCode = record.assetCode
    || record.codigoPatrimonial
    || record.code
    || record.codigo
    || '';
  const rawDescription = record.description
    || record.descripcion
    || record.name
    || record.assetDescription
    || record.asset_description
    || '';

  const description = cleanAssetName(rawDescription);
  const code = rawCode && !isUuidLike(rawCode) ? String(rawCode).trim() : '';

  return {
    assetId: record.id || record.assetId || assetId,
    assetCode: code || '—',
    assetDescription: description || 'Sin descripción',
    value: parseFloat(record.acquisitionValue || record.valorAdquisicion || 0) || 0,
  };
}

function findAssetInCatalog(assetId, catalogAssets = []) {
  if (!assetId || !catalogAssets.length) return null;
  const target = String(assetId);
  return catalogAssets.find((asset) => {
    const candidates = [
      asset.id,
      asset.assetId,
      asset.uuid,
    ].filter(Boolean).map(String);
    return candidates.includes(target);
  }) || null;
}

async function fetchMovementById(movementId) {
  if (!movementId) return null;
  try {
    const { data } = await httpClient.get(`${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/${movementId}`);
    return data;
  } catch {
    return null;
  }
}

async function resolveLinkedMovement(receipt, options = {}) {
  const { movement = null, movements = [] } = options;
  if (movement?.id) return movement;

  const movementId = receipt?.movementId;
  if (!movementId) return null;

  const fromList = movements.find((item) => String(item.id) === String(movementId));
  if (fromList) return fromList;

  return fetchMovementById(movementId);
}

/** Obtiene código y descripción reales del bien patrimonial. */
export async function fetchPatrimonialAssetFields(assetId, catalogAssets = []) {
  if (!assetId) {
    return {
      assetId: '',
      assetCode: '—',
      assetDescription: 'Sin descripción',
      value: 0,
    };
  }

  const fromCatalog = findAssetInCatalog(assetId, catalogAssets);
  if (fromCatalog) {
    const fields = extractAssetPatrimonialFields(fromCatalog, assetId);
    if (!isPlaceholderReceiptDescription(fields.assetDescription) || !isMissingReceiptCode(fields.assetCode)) {
      return fields;
    }
  }

  try {
    const asset = await getBienPatrimonialById(assetId);
    const fields = extractAssetPatrimonialFields(asset, assetId);
    if (!isPlaceholderReceiptDescription(fields.assetDescription) || !isMissingReceiptCode(fields.assetCode)) {
      return fields;
    }
  } catch {
    // continuar con fallback
  }

  try {
    const { data } = await httpClient.get(`${API_BASE_URL}/assets/${assetId}`);
    const fields = extractAssetPatrimonialFields(data, assetId);
    if (!isPlaceholderReceiptDescription(fields.assetDescription) || !isMissingReceiptCode(fields.assetCode)) {
      return fields;
    }
  } catch {
    // sin más fuentes
  }

  return {
    assetId,
    assetCode: '—',
    assetDescription: 'Sin descripción',
    value: 0,
  };
}

async function buildAssetsFromMovementItems(movementItems = [], receiptAssets = [], catalogAssets = []) {
  return Promise.all(
    movementItems.map(async (item, index) => {
      const receiptLine = receiptAssets[index];
      const quantity = Math.max(
        1,
        parseInt(receiptLine?.quantity || item.quantity, 10) || 1
      );
      const fields = await fetchPatrimonialAssetFields(item.assetId, catalogAssets);
      return {
        ...fields,
        quantity,
        lineNumber: item.lineNumber || index + 1,
      };
    })
  );
}

export function receiptAssetsNeedEnrichment(receiptAssets = []) {
  return receiptAssets.some((line) => isUnresolvedReceiptAssetLine(line));
}

export function receiptAssetsAreSynced(movementAssets = [], receiptAssets = []) {
  if (movementAssets.length !== receiptAssets.length) return false;
  if (receiptAssetsNeedEnrichment(receiptAssets)) return false;

  return movementAssets.every((item, index) => {
    const current = receiptAssets[index];
    if (!current) return false;
    const sameCode = String(current.assetCode || current.code || '') === String(item.assetCode || '');
    const sameQty = (parseInt(current.quantity, 10) || 1) === (item.quantity || 1);
    const sameDescription = String(
      current.assetDescription || current.description || ''
    ) === String(item.assetDescription || '');
    return sameCode && sameQty && sameDescription;
  });
}

/**
 * Enriquece líneas del acta con nombres/códigos reales.
 * Prioriza los bienes del movimiento vinculado (fuente confiable de assetId).
 */
export async function enrichReceiptAssets(receipt, catalogAssets = [], options = {}) {
  if (!receipt) return receipt;

  const linkedMovement = await resolveLinkedMovement(receipt, options);
  const movementItems = resolveMovementAssetItems(linkedMovement);
  const receiptAssets = receipt.assets || [];

  if (movementItems.length > 0) {
    const assets = await buildAssetsFromMovementItems(
      movementItems,
      receiptAssets,
      catalogAssets
    );
    return { ...receipt, assets };
  }

  if (!receiptAssets.length) return receipt;

  const enrichedAssets = await Promise.all(
    receiptAssets.map(async (line, index) => {
      const assetId = line.assetId
        || line.id
        || (isUuidLike(line.assetCode || line.code) ? (line.assetCode || line.code) : null);
      const quantity = Math.max(1, parseInt(line.quantity, 10) || 1);
      const lineNumber = line.lineNumber || index + 1;

      if (!isUnresolvedReceiptAssetLine(line)) {
        return {
          ...line,
          assetId,
          quantity,
          lineNumber,
          assetCode: line.assetCode || line.code || '—',
          assetDescription: line.assetDescription || line.description || line.descripcion || 'Sin descripción',
        };
      }

      const fields = await fetchPatrimonialAssetFields(assetId, catalogAssets);
      return {
        ...line,
        ...fields,
        quantity,
        lineNumber,
      };
    })
  );

  return { ...receipt, assets: enrichedAssets };
}
