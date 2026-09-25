export function cleanAssetName(description) {
  if (!description || typeof description !== 'string') {
    return description || '';
  }
  const separatorIndex = description.indexOf(' - ');
  if (separatorIndex === -1) {
    return description.trim();
  }
  const cleanName = description.substring(0, separatorIndex).trim();
  return cleanName;
}
export function formatAssetDisplayName(asset, includeCode = true) {
  if (!asset) {
    return '';
  }
  const assetCode = asset.assetCode || asset.code || asset.codigoPatrimonial || '';
  const description = asset.description || asset.descripcion || asset.name || '';
  const cleanName = cleanAssetName(description);
  if (!cleanName) {
    return assetCode || 'Sin descripción';
  }
  if (includeCode && assetCode) {
    return `${assetCode} - ${cleanName}`;
  }
  return cleanName;
}
export function getAssetNameOnly(asset) {
  if (!asset) {
    return '';
  }
  const description = asset.description || asset.descripcion || asset.name || '';
  return cleanAssetName(description);
}
export function extractAssetLocation(description) {
  if (!description || typeof description !== 'string') {
    return null;
  }
  const separatorIndex = description.indexOf(' - ');
  if (separatorIndex === -1) {
    return null;
  }
  const location = description.substring(separatorIndex + 3).trim();
  return location || null;
}
export default {
  cleanAssetName,
  formatAssetDisplayName,
  getAssetNameOnly,
  extractAssetLocation
};