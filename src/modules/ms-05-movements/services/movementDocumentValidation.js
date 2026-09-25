export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const ALLOWED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};
export const ALLOWED_FILE_TYPES_LABEL = 'PDF, JPG, PNG, GIF, WEBP';
export const ALLOWED_FILE_ACCEPT = '.pdf,.jpg,.jpeg,.png,.gif,.webp';
export const validateMovementFile = (file) => {
  if (!ALLOWED_FILE_TYPES[file.type]) {
    return { valid: false, error: `Tipo de archivo no permitido. Solo se permiten: ${ALLOWED_FILE_TYPES_LABEL}` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'El archivo es muy grande. Tamaño máximo: 10MB' };
  }
  return { valid: true };
};
export const generateMovementFileName = (originalName, movementId = null) => {
  const timestamp = Date.now();
  const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const ext = sanitized.substring(sanitized.lastIndexOf('.'));
  const base = sanitized.substring(0, sanitized.lastIndexOf('.'));
  return `${movementId ? `MV-${movementId}` : 'MV-TEMP'}_${timestamp}_${base}${ext}`;
};
export const parseAttachedDocuments = (attachedDocuments) => {
  if (!attachedDocuments) return [];
  let documents = [];
  if (Array.isArray(attachedDocuments)) {
    documents = attachedDocuments;
  } else if (typeof attachedDocuments === 'string') {
    try { const parsed = JSON.parse(attachedDocuments); documents = Array.isArray(parsed) ? parsed : []; }
    catch { return []; }
  } else { return []; }
  return documents.map(doc => {
    const n = { ...doc };
    if (n.url && !n.fileUrl) n.fileUrl = n.url;
    if (n.fileUrl && !n.url) n.url = n.fileUrl;
    return n;
  });
};
export const prepareAttachedDocuments = (uploadedFiles) => {
  if (!uploadedFiles?.length) return undefined;
  return JSON.stringify(uploadedFiles);
};
export const getFileIcon = (fileType) => {
  if (!fileType) return '📎';
  const t = fileType.toLowerCase();
  if (t.includes('pdf')) return '📄';
  if (t.includes('word') || t.includes('doc')) return '📝';
  if (t.includes('excel') || t.includes('spreadsheet') || t.includes('xls')) return '📊';
  if (t.includes('image')) return '🖼️';
  return '📎';
};
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
