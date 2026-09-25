import { uploadFile as sharedUpload, deleteFile as sharedDelete } from '../../../shared/services/storageService';
import { validateMovementFile } from './movementDocumentValidation';
import imageCompression from 'browser-image-compression';

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

const compressIfImage = async (file) => {
  if (!IMAGE_TYPES.includes(file.type)) return file;
  try {
    return await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      preserveExif: false,
    });
  } catch {
    return file;
  }
};

export const uploadMovementDocument = async (file) => {
  const validation = validateMovementFile(file);
  if (!validation.valid) return { success: false, error: validation.error };

  const fileToUpload = await compressIfImage(file);
  const result = await sharedUpload(fileToUpload);

  if (!result.success) {
    return { success: false, error: result.error || 'Error al subir el archivo' };
  }

  return {
    success: true,
    url: result.url,
    fileName: file.name,
    fileSize: fileToUpload.size,
    fileType: fileToUpload.type,
    path: result.fileName,
  };
};

export const uploadMultipleMovementDocuments = async (files, _movementId = null, _municipalityId = null, uploadedBy = null) => {
  const uploaded = [];
  for (const file of files) {
    try {
      const result = await uploadMovementDocument(file);
      if (result.success) {
        uploaded.push({
          fileName: result.fileName,
          fileUrl: result.url,
          fileType: result.fileType,
          fileSize: result.fileSize,
          uploadedAt: new Date().toISOString(),
          uploadedBy: uploadedBy || null,
        });
      }
    } catch { /* ignore individual upload failures */ }
  }
  return uploaded;
};

export const deleteMovementDocument = async (storageFileName) => {
  if (!storageFileName) {
    return { success: false, error: 'Nombre de archivo no proporcionado' };
  }
  return sharedDelete(storageFileName);
};
