import { useState, useEffect, useRef } from 'react';
import assetMovementService from '../services/assetMovementService';
import {
  uploadMultipleMovementDocuments,
  parseAttachedDocuments,
  validateMovementFile,
} from '../services/movementDocumentService';
import {
  validateSupportingDocumentNumber,
  isSupportingDocumentNumberDuplicate,
  generateNextSupportingDocumentNumber,
  rememberSupportingDocumentNumber,
} from '../utils/movementFormValidation';
import { getCurrentUserId } from './movementFormHelpers';

export function useMovementDocuments({
  movement,
  formData,
  setFormData,
  setErrors,
  activeTab,
  saving,
}) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [checkingDocumentDuplicate, setCheckingDocumentDuplicate] = useState(false);
  const [suggestedDocumentNumber, setSuggestedDocumentNumber] = useState('');
  const [suggestedDocumentSource, setSuggestedDocumentSource] = useState('server');
  const [loadingSuggestedDoc, setLoadingSuggestedDoc] = useState(false);
  const [cachedMovements, setCachedMovements] = useState([]);

  const fileInputRef = useRef(null);
  const docDuplicateTimerRef = useRef(null);

  const refreshCachedMovements = async () => {
    try {
      const all = await assetMovementService.getAllMovements();
      const list = Array.isArray(all) ? all : [];
      setCachedMovements(list);
      return { list, serverListLoaded: true };
    } catch {
      setCachedMovements([]);
      return { list: [], serverListLoaded: false };
    }
  };

  const computeSuggestedDocumentNumber = (movementsList = cachedMovements, serverListLoaded = true) => {
    const result = generateNextSupportingDocumentNumber(movementsList, {
      excludeMovementId: movement?.id,
      serverListLoaded,
    });
    setSuggestedDocumentNumber(result.number);
    setSuggestedDocumentSource(result.source);
    return result.number;
  };

  const applySuggestedDocumentNumber = () => {
    const next = suggestedDocumentNumber || computeSuggestedDocumentNumber(cachedMovements);
    setFormData((prev) => ({ ...prev, supportingDocumentNumber: next }));
    setErrors((prev) => {
      const n = { ...prev };
      delete n.supportingDocumentNumber;
      return n;
    });
  };

  useEffect(() => {
    if (movement) return;
    let cancelled = false;
    setLoadingSuggestedDoc(true);
    refreshCachedMovements()
      .then(({ list, serverListLoaded }) => {
        if (!cancelled) computeSuggestedDocumentNumber(list, serverListLoaded);
      })
      .finally(() => {
        if (!cancelled) setLoadingSuggestedDoc(false);
      });
    return () => {
      cancelled = true;
    };
  }, [movement?.id]);

  useEffect(() => {
    if (movement || formData.supportingDocumentNumber?.trim()) return;
    if (activeTab === 'documentacion' && suggestedDocumentNumber) {
      setFormData((prev) => ({
        ...prev,
        supportingDocumentNumber: prev.supportingDocumentNumber || suggestedDocumentNumber,
      }));
    }
  }, [activeTab, suggestedDocumentNumber, movement, formData.supportingDocumentNumber]);

  useEffect(() => {
    const docNum = (formData.supportingDocumentNumber || '').trim();
    if (!docNum || validateSupportingDocumentNumber(docNum, { required: false })) {
      setCheckingDocumentDuplicate(false);
      return;
    }
    if (docDuplicateTimerRef.current) clearTimeout(docDuplicateTimerRef.current);
    docDuplicateTimerRef.current = setTimeout(async () => {
      setCheckingDocumentDuplicate(true);
      try {
        const refreshed = cachedMovements.length
          ? { list: cachedMovements, serverListLoaded: true }
          : await refreshCachedMovements();
        const duplicate = isSupportingDocumentNumberDuplicate(docNum, refreshed.list, movement?.id);
        setErrors((prev) => {
          const next = { ...prev };
          if (duplicate) {
            next.supportingDocumentNumber =
              'Este número de documento ya está registrado en el sistema. Ingrese uno diferente.';
          } else if (next.supportingDocumentNumber?.includes('ya está registrado')) {
            delete next.supportingDocumentNumber;
          }
          return next;
        });
      } catch {
        /* verificación en segundo plano */
      } finally {
        setCheckingDocumentDuplicate(false);
      }
    }, 400);
    return () => {
      if (docDuplicateTimerRef.current) clearTimeout(docDuplicateTimerRef.current);
    };
  }, [formData.supportingDocumentNumber, movement?.id]);

  const processFiles = (files) => {
    const arr = Array.from(files);
    if (!arr.length) return;
    if (selectedFiles.length + uploadedDocuments.length + arr.length > 10) {
      setUploadError('Máximo 10 archivos permitidos');
      return;
    }
    const oversized = arr.filter((f) => f.size > 10 * 1024 * 1024);
    if (oversized.length) {
      setUploadError(`Archivos muy grandes (máx 10MB): ${oversized.map((f) => f.name).join(', ')}`);
      return;
    }
    const invalid = arr.filter((f) => !validateMovementFile(f).valid);
    if (invalid.length) {
      setUploadError(validateMovementFile(invalid[0]).error);
      return;
    }
    setSelectedFiles((prev) => [...prev, ...arr]);
    setUploadError(null);
  };

  const handleFileChange = (e) => {
    processFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploadingFiles && !saving && selectedFiles.length + uploadedDocuments.length < 10) {
      setIsDragging(true);
    }
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!uploadingFiles && !saving && e.dataTransfer.files?.length) {
      processFiles(e.dataTransfer.files);
    }
  };
  const removeSelectedFile = (i) => setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i));
  const removeUploadedDocument = (i) => setUploadedDocuments((prev) => prev.filter((_, idx) => idx !== i));

  const loadDocumentsFromMovement = (attachedDocumentsRaw) => {
    if (attachedDocumentsRaw) {
      try {
        setUploadedDocuments(parseAttachedDocuments(attachedDocumentsRaw));
      } catch {
        setUploadedDocuments([]);
      }
    } else {
      setUploadedDocuments([]);
    }
  };

  const resetDocumentsForNewMovement = () => {
    setUploadedDocuments([]);
    setSelectedFiles([]);
  };

  const checkDocumentDuplicateOnSubmit = async (docNum, newErrors) => {
    if (!docNum || newErrors.supportingDocumentNumber) return newErrors;
    try {
      const refreshed = cachedMovements.length
        ? { list: cachedMovements, serverListLoaded: true }
        : await refreshCachedMovements();
      if (isSupportingDocumentNumberDuplicate(docNum, refreshed.list, movement?.id)) {
        return {
          ...newErrors,
          supportingDocumentNumber:
            'Este número de documento ya está registrado en el sistema. Ingrese uno diferente.',
        };
      }
    } catch {
      /* continuar si la verificación falla */
    }
    return newErrors;
  };

  const uploadPendingFiles = async () => {
    const currentUserId = getCurrentUserId();
    let documentsToAttach = [...uploadedDocuments];
    if (selectedFiles.length > 0) {
      setUploadingFiles(true);
      try {
        const uploaded = await uploadMultipleMovementDocuments(
          selectedFiles,
          movement?.id || null,
          null,
          currentUserId
        );
        if (uploaded.length > 0) {
          documentsToAttach = [...documentsToAttach, ...uploaded];
          setSelectedFiles([]);
          setUploadedDocuments(documentsToAttach);
        } else {
          setUploadError(
            'Advertencia: No se pudieron subir los archivos. El movimiento se guardará sin documentos adjuntos.'
          );
        }
      } catch {
        setUploadError(
          'Advertencia: Error al subir archivos. El movimiento se guardará sin documentos adjuntos.'
        );
      } finally {
        setUploadingFiles(false);
      }
    }
    return documentsToAttach;
  };

  const buildAttachedDocumentsPayload = (documentsToAttach) => {
    const currentUserId = getCurrentUserId();
    const normalized = documentsToAttach.map((doc) => ({
      fileName: doc.fileName || 'Documento sin nombre',
      fileUrl: doc.fileUrl || doc.url || '',
      fileType: doc.fileType || '',
      fileSize: doc.fileSize || 0,
      uploadedAt: doc.uploadedAt || new Date().toISOString(),
      uploadedBy: doc.uploadedBy || currentUserId || null,
    }));
    return normalized.length > 0 ? JSON.stringify(normalized) : null;
  };

  const resolveAssetItemsForSave = () => {
    if (formData.assetItems?.length) {
      return formData.assetItems.map((item) => ({
        assetId: item.assetId,
        quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
      }));
    }
    if (formData.assetIds?.length) {
      return formData.assetIds.map((id) => ({ assetId: id, quantity: 1 }));
    }
    if (formData.assetId) {
      return [{ assetId: formData.assetId, quantity: 1 }];
    }
    return [];
  };

  const finalizeSavePayload = (documentsToAttach) => {
    const resolvedAssetItems = resolveAssetItemsForSave();
    const resolvedAssetIds = resolvedAssetItems.map((item) => item.assetId);
    const dataToSave = {
      ...formData,
      assetItems: resolvedAssetItems,
      assetIds: resolvedAssetIds,
      assetId: resolvedAssetIds[0] || formData.assetId,
      ...(movement ? {} : { movementNumber: undefined }),
      attachedDocuments: buildAttachedDocumentsPayload(documentsToAttach),
    };
    if (!movement) delete dataToSave.movementNumber;
    rememberSupportingDocumentNumber(dataToSave.supportingDocumentNumber);
    return dataToSave;
  };

  return {
    selectedFiles,
    uploadedDocuments,
    uploadingFiles,
    uploadError,
    isDragging,
    checkingDocumentDuplicate,
    suggestedDocumentNumber,
    suggestedDocumentSource,
    loadingSuggestedDoc,
    cachedMovements,
    fileInputRef,
    applySuggestedDocumentNumber,
    refreshCachedMovements,
    checkDocumentDuplicateOnSubmit,
    uploadPendingFiles,
    finalizeSavePayload,
    loadDocumentsFromMovement,
    resetDocumentsForNewMovement,
    setUploadError,
    handleFileChange,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    removeSelectedFile,
    removeUploadedDocument,
  };
}
