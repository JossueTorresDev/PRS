export {
  validateMovementFile,
  generateMovementFileName,
  parseAttachedDocuments,
  prepareAttachedDocuments,
  getFileIcon,
  formatFileSize,
  ALLOWED_FILE_ACCEPT,
  ALLOWED_FILE_TYPES_LABEL,
} from './movementDocumentValidation';
export {
  uploadMovementDocument,
  uploadMultipleMovementDocuments,
  deleteMovementDocument,
} from './movementDocumentStorage';
export const downloadMovementDocument = async (fileUrl, fileName) => {
  if (!fileUrl) return { success: false, error: 'URL del archivo no proporcionada' };
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'documento.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || 'Error al descargar el archivo' };
  }
};
