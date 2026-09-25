import { getEnv } from '../../../shared/utils/env.js';
import handoverReceiptService from './handoverReceiptService';
import { resolveMovementAssetItems } from '../utils/movementReportHelpers';
import {
  enrichReceiptAssets,
  fetchPatrimonialAssetFields,
  receiptAssetsAreSynced,
} from '../utils/handoverReceiptAssetResolver';
import httpClient from '../../../shared/services/httpClient.js';

const API_BASE_URL = getEnv('VITE_GATEWAY_API_URL', '/api/v1');
const ASSET_MOVEMENTS_ENDPOINT = '/asset-movements';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchMovementById(movementId) {
  try {
    const { data } = await httpClient.get(`${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/${movementId}`);
    return data;
  } catch {
    return null;
  }
}

export async function buildHandoverReceiptAssetsFromMovement(movement, catalogAssets = []) {
  const items = resolveMovementAssetItems(movement);
  if (!items.length) return [];
  return Promise.all(
    items.map(async (item, index) => {
      const fields = await fetchPatrimonialAssetFields(item.assetId, catalogAssets);
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      return {
        ...fields,
        lineNumber: item.lineNumber || index + 1,
        quantity,
      };
    })
  );
}

export async function syncHandoverReceiptAssetsFromMovement(movement, options = {}) {
  const { maxRetries = 6, retryDelayMs = 500, catalogAssets = [] } = options;
  if (!movement?.id) return null;

  const fetched = await fetchMovementById(movement.id);
  const fullMovement = fetched ? { ...movement, ...fetched } : movement;

  const movementAssets = await buildHandoverReceiptAssetsFromMovement(fullMovement, catalogAssets);
  if (!movementAssets.length) return null;

  let receipt = null;
  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    try {
      receipt = await handoverReceiptService.getHandoverReceiptByMovement(movement.id);
      if (receipt?.id) break;
    } catch {
      receipt = null;
    }
    if (attempt < maxRetries - 1) await sleep(retryDelayMs);
  }

  if (!receipt?.id) return null;

  const enrichedReceipt = await enrichReceiptAssets(receipt, catalogAssets, { movement: fullMovement });
  const receiptAssets = enrichedReceipt.assets || receipt.assets || [];

  if (receiptAssetsAreSynced(movementAssets, receiptAssets)) {
    return enrichedReceipt;
  }

  const assetPayload = movementAssets.map((item) => ({
    assetId: item.assetId,
    assetCode: item.assetCode,
    assetDescription: item.assetDescription,
    quantity: item.quantity,
    value: item.value,
    lineNumber: item.lineNumber,
  }));

  const updated = await handoverReceiptService.updateHandoverReceipt(receipt.id, {
    movementId: receipt.movementId || movement.id,
    assets: assetPayload,
    assetIds: assetPayload,
  });

  return enrichReceiptAssets(updated, catalogAssets, { movement: fullMovement });
}

export { enrichReceiptAssets } from '../utils/handoverReceiptAssetResolver';
