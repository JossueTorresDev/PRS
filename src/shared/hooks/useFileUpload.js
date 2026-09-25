import { useState, useCallback } from 'react';
import { uploadFile, deleteFile } from '../services/storageService';

export function useFileUpload({ maxFiles = 5, onUploaded = null } = {}) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const addFiles = useCallback(async (fileList) => {
    const newFiles = Array.from(fileList);
    if (files.length + newFiles.length > maxFiles) {
      setError(`Máximo ${maxFiles} archivos permitidos`);
      return;
    }

    setUploading(true);
    setError(null);

    const uploaded = [];

    for (const file of newFiles) {
      const result = await uploadFile(file);
      if (result.success) {
        const entry = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          storageFileName: result.fileName,
          url: result.url,
          uploading: false,
        };
        uploaded.push(entry);
        onUploaded?.(entry);
      } else {
        setError(result.error);
      }
    }

    setFiles(prev => [...prev, ...uploaded]);
    setUploading(false);
  }, [files, maxFiles, onUploaded]);

  const removeFile = useCallback(async (id) => {
    const file = files.find(f => f.id === id);
    if (!file) return;

    if (file.storageFileName) {
      await deleteFile(file.storageFileName);
    }

    setFiles(prev => prev.filter(f => f.id !== id));
  }, [files]);

  const reset = useCallback(() => {
    setFiles([]);
    setUploading(false);
    setError(null);
  }, []);

  return {
    files,
    uploading,
    error,
    addFiles,
    removeFile,
    reset,
    setError,
  };
}
