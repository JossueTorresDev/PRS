const TAB_ERROR_FIELDS = {
  basica: ['assetId', 'movementType', 'movementSubtype', 'reason'],
  'origen-destino': [
    'originResponsibleId', 'destinationResponsibleId',
    'originAreaId', 'destinationAreaId', 'originLocationId', 'destinationLocationId',
  ],
  'usuarios-detalles': ['requestingUser', 'executingUser', 'observations', 'specialConditions'],
  documentacion: ['supportingDocumentNumber', 'supportingDocumentType'],
};

export function isTabComplete(tabId, formData, uploadedDocuments, selectedFiles) {
  switch (tabId) {
    case 'basica':
      return !!(
        (formData.assetIds?.length || formData.assetId)
        && formData.movementType
        && formData.reason
      );
    case 'origen-destino':
      return !!(
        formData.originResponsibleId
        || formData.destinationResponsibleId
        || formData.originAreaId
        || formData.destinationAreaId
      );
    case 'usuarios-detalles':
      return !!formData.requestingUser;
    case 'documentacion':
      return uploadedDocuments.length > 0 || selectedFiles.length > 0;
    default:
      return false;
  }
}

export function hasTabErrors(tabId, errors) {
  const keys = Object.keys(errors);
  return keys.some((k) => (TAB_ERROR_FIELDS[tabId] || []).includes(k));
}
