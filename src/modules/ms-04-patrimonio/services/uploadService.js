import { uploadFile as sharedUpload, deleteFile as sharedDelete } from '../../../shared/services/storageService';

const ALLOWED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const validateFile = (file) => {
  if (!ALLOWED_FILE_TYPES[file.type]) {
    return { valid: false, error: 'Tipo de archivo no permitido según normativa SBN. Solo se permiten: PDF, DOC, DOCX, XLS, XLSX' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'El archivo es muy grande. Tamaño máximo: 5MB' };
  }
  return { valid: true };
};

export const generateUniqueFileName = (originalName, assetCode) => {
  const timestamp = Date.now();
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const extension = sanitizedName.substring(sanitizedName.lastIndexOf('.'));
  const nameWithoutExt = sanitizedName.substring(0, sanitizedName.lastIndexOf('.'));
  return `${assetCode}_${timestamp}_${nameWithoutExt}${extension}`;
};

export const uploadAssetDocument = async (file, assetCode, onProgress = null) => {
  const validation = validateFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  const result = await sharedUpload(file);
  if (!result.success) return result;
  return {
    success: true,
    url: result.url,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    path: result.fileName,
  };
};

export const deleteAssetDocument = async (fileName) => {
  return sharedDelete(fileName);
};

export const downloadAssetDocument = async (fileUrl) => {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) return { success: false, error: 'Error al descargar archivo' };
    const blob = await response.blob();
    return { success: true, blob };
  } catch (error) {
    return { success: false, error: 'Error al descargar el archivo' };
  }
};

const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const MAX_IMAGE_SIZE = 3 * 1024 * 1024;

export const validateImageFile = (file) => {
  if (!ALLOWED_IMAGE_TYPES[file.type]) {
    return { valid: false, error: 'Solo se permiten imágenes en formato JPG, PNG o WEBP' };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: 'La imagen es muy grande. Tamaño máximo: 3MB' };
  }
  return { valid: true };
};

export const uploadAssetImage = async (file, assetCode) => {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  const result = await sharedUpload(file);
  if (!result.success) return result;
  return {
    success: true,
    url: result.url,
    path: result.fileName,
  };
};

export const getFileIcon = (fileType) => {
  if (fileType?.includes('pdf')) return '📄';
  if (fileType?.includes('word') || fileType?.includes('doc')) return '📝';
  if (fileType?.includes('image')) return '🖼️';
  return '📎';
};

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
