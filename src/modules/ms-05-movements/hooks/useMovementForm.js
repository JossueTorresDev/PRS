import { useState, useEffect } from 'react';
import {
  SUPPORTING_DOCUMENT_TYPE_DEFAULT,
} from '../utils/movementFormValidation';
import { MovementType, MovementStatus } from '../types/movementTypes';
import {
  getRequestingUsersForArea,
  getRequestingUserFilterAreaId,
  getUserAccountId,
  requestingUserUsesAreaFilter,
} from '../utils/movementUserAreaUtils';
import { normalizeMovementForForm } from '../utils/movementReportHelpers';
import { getBienPatrimonialById } from '../../ms-04-patrimonio/services/api';
import { validateAssetStatusForContext } from '../utils/movementAssetContext';
import {
  INITIAL_FORM,
  getCurrentUserId,
  findWarehouseArea,
  findWarehouseLocation,
  syncAssetFields,
  matchesAssetId,
  resolveAssetId,
} from './movementFormHelpers';
import { useMovementDocuments } from './useMovementDocuments';
import { useMovementAssetSelection } from './useMovementAssetSelection';
import { useMovementFormValidation } from './useMovementFormValidation';

export function useMovementForm({
  movement,
  assets,
  users,
  persons,
  areas,
  locations,
  loadingData,
  onSave,
}) {
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basica');

  const documents = useMovementDocuments({
    movement,
    formData,
    setFormData,
    setErrors,
    activeTab,
    saving,
  });

  const assetsSelection = useMovementAssetSelection({
    movement,
    assets,
    areas,
    locations,
    loadingData,
    formData,
    setFormData,
    setErrors,
  });

  const validation = useMovementFormValidation({
    formData,
    movement,
    users,
    assignmentContext: assetsSelection.assignmentContext,
    assetContextMap: assetsSelection.assetContextMap,
    selectedAsset: assetsSelection.selectedAsset,
    displayAssets: assetsSelection.displayAssets,
    assets,
    uploadedDocuments: documents.uploadedDocuments,
    selectedFiles: documents.selectedFiles,
    errors,
    setErrors,
    checkDocumentDuplicateOnSubmit: documents.checkDocumentDuplicateOnSubmit,
  });

  useEffect(() => {
    if (movement || loadingData || areas.length === 0 || locations.length === 0) return;
    const warehouseArea = findWarehouseArea(areas);
    const warehouseLocation = findWarehouseLocation(locations);
    if (formData.movementType === MovementType.INITIAL_ASSIGNMENT) {
      if (warehouseArea || warehouseLocation) {
        setFormData((prev) => ({
          ...prev,
          originAreaId: prev.originAreaId || warehouseArea?.id || '',
          originLocationId: prev.originLocationId || warehouseLocation?.id || '',
        }));
      }
    } else if (formData.movementType === MovementType.RETURN) {
      if (warehouseArea || warehouseLocation) {
        setFormData((prev) => ({
          ...prev,
          destinationAreaId: prev.destinationAreaId || warehouseArea?.id || '',
          destinationLocationId: prev.destinationLocationId || warehouseLocation?.id || '',
        }));
      }
    }
  }, [formData.movementType, areas, locations, movement, loadingData]);

  useEffect(() => {
    if (!movement || loadingData) return;

    let cancelled = false;
    const record = normalizeMovementForForm(movement);
    const editAssetItems = Array.isArray(record.assetItems) && record.assetItems.length > 0
      ? record.assetItems
      : (record.assetId ? [{ assetId: record.assetId, quantity: 1 }] : []);

    const hydrateEditAssets = async () => {
      const resolvedAssets = await Promise.all(
        editAssetItems.map(async (item) => {
          const fromList = (assets || []).find((a) => matchesAssetId(a, item.assetId));
          if (fromList) return fromList;
          try {
            return await getBienPatrimonialById(item.assetId);
          } catch {
            return null;
          }
        })
      );
      if (cancelled) return;

      const validAssets = resolvedAssets.filter(Boolean);
      assetsSelection.initSelectedAssets(validAssets);

      validAssets.forEach((asset) => assetsSelection.pinDisplayAsset(asset));

      const primaryAssetId = resolveAssetId(validAssets[0]) || record.assetId;
      if (primaryAssetId) {
        await assetsSelection.loadCurrentAssetLocation(
          primaryAssetId,
          validAssets[0] || null,
          { syncOriginToForm: false }
        );
      }

      setErrors((prev) => {
        if (!prev.assetId?.includes('estado') && !prev.movementType?.includes('Primera Asignación')) {
          return prev;
        }
        const next = { ...prev };
        if (next.assetId?.includes('estado')) delete next.assetId;
        if (next.movementType?.includes('Primera Asignación')) delete next.movementType;
        return next;
      });
    };

    hydrateEditAssets();
    return () => { cancelled = true; };
  }, [movement?.id, loadingData, assets]);

  useEffect(() => {
    const currentUserId = getCurrentUserId();
    if (movement) {
      const record = normalizeMovementForForm(movement);
      const editAssetItems = Array.isArray(record.assetItems) && record.assetItems.length > 0
        ? record.assetItems.map((item) => ({
            assetId: item.assetId,
            quantity: item.quantity || 1,
          }))
        : (Array.isArray(record.assetIds) && record.assetIds.length > 0
          ? record.assetIds.map((id) => ({ assetId: id, quantity: 1 }))
          : (record.assetId ? [{ assetId: record.assetId, quantity: 1 }] : []));
      const assetFields = syncAssetFields(editAssetItems);
      setFormData({
        movementNumber: record.movementNumber || '',
        ...assetFields,
        movementType: record.movementType || MovementType.REASSIGNMENT,
        movementSubtype: record.movementSubtype || '',
        originResponsibleId: record.originResponsibleId || '',
        destinationResponsibleId: record.destinationResponsibleId || '',
        originAreaId: record.originAreaId || '',
        destinationAreaId: record.destinationAreaId || '',
        originLocationId: record.originLocationId || '',
        destinationLocationId: record.destinationLocationId || '',
        reason: record.reason || '',
        observations: record.observations || '',
        specialConditions: record.specialConditions || '',
        supportingDocumentNumber: record.supportingDocumentNumber || '',
        supportingDocumentType: record.supportingDocumentType || SUPPORTING_DOCUMENT_TYPE_DEFAULT,
        attachedDocuments: record.attachedDocuments || '',
        requiresApproval: record.requiresApproval !== undefined ? record.requiresApproval : true,
        movementStatus: record.movementStatus || MovementStatus.REQUESTED,
        requestingUser: record.requestingUser || '',
        executingUser: record.executingUser || '',
      });
      documents.loadDocumentsFromMovement(record.attachedDocuments);
    } else {
      setFormData((prev) => ({
        ...prev,
        requestingUser: currentUserId || '',
        executingUser: currentUserId || '',
        supportingDocumentType: prev.supportingDocumentType || SUPPORTING_DOCUMENT_TYPE_DEFAULT,
      }));
      documents.resetDocumentsForNewMovement();
    }
  }, [movement?.id]);

  useEffect(() => {
    if (movement || loadingData) return;
    if (!requestingUserUsesAreaFilter(formData.movementType)) return;

    const areaId = getRequestingUserFilterAreaId(
      formData.movementType,
      formData.originAreaId,
      formData.destinationAreaId
    );
    const allowed = areaId
      ? getRequestingUsersForArea(
          users,
          formData.movementType,
          formData.originAreaId,
          formData.destinationAreaId
        )
      : [];
    const allowedIds = new Set(
      allowed.map((u) => String(getUserAccountId(u))).filter(Boolean)
    );

    setFormData((prev) => {
      let nextUser = prev.requestingUser;
      if (!areaId) {
        if (nextUser) nextUser = '';
      } else if (nextUser && !allowedIds.has(String(nextUser))) {
        nextUser = '';
      }
      if (!nextUser && areaId) {
        const sessionId = getCurrentUserId();
        if (sessionId && allowedIds.has(String(sessionId))) nextUser = sessionId;
      }
      if (nextUser === prev.requestingUser) return prev;
      return { ...prev, requestingUser: nextUser };
    });
  }, [
    formData.movementType,
    formData.originAreaId,
    formData.destinationAreaId,
    users,
    loadingData,
    movement,
  ]);

  useEffect(() => {
    if (movement) return;
    const sessionId = getCurrentUserId();
    if (!sessionId) return;

    setFormData((prev) => {
      if (String(prev.executingUser) === String(sessionId)) return prev;
      return { ...prev, executingUser: sessionId };
    });
  }, [movement, users, loadingData]);

  const handleChange = async (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'executingUser') return;
    const newValue = type === 'checkbox' ? checked : value;
    const nextFormData = { ...formData, [name]: newValue };
    setFormData(nextFormData);

    const realtimeFields = [
      'movementSubtype',
      'supportingDocumentNumber',
      'supportingDocumentType',
      'reason',
      'observations',
      'specialConditions',
      'originAreaId',
      'destinationAreaId',
      'originResponsibleId',
      'destinationResponsibleId',
      'movementType',
      'assetId',
    ];
    if (realtimeFields.includes(name)) {
      validation.applyRealtimeFieldError(name, newValue, nextFormData);
    } else if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    if (name === 'supportingDocumentType' && !value?.trim()) {
      setFormData((prev) => ({ ...prev, supportingDocumentType: SUPPORTING_DOCUMENT_TYPE_DEFAULT }));
    }
    if (name === 'movementType' && !movement && areas.length > 0 && locations.length > 0) {
      const warehouseArea = findWarehouseArea(areas);
      const warehouseLocation = findWarehouseLocation(locations);

      if (value === MovementType.INITIAL_ASSIGNMENT && (warehouseArea || warehouseLocation)) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          originAreaId: warehouseArea?.id || '',
          originLocationId: warehouseLocation?.id || '',
        }));
        return;
      }

      if (value === MovementType.RETURN) {
        if (formData.assetId) {
          setFormData((prev) => ({ ...prev, [name]: value }));
          await assetsSelection.loadCurrentAssetLocation(formData.assetId);
          return;
        }
        if (warehouseArea || warehouseLocation) {
          setFormData((prev) => ({
            ...prev,
            [name]: value,
            destinationAreaId: warehouseArea?.id || '',
            destinationLocationId: warehouseLocation?.id || '',
          }));
          return;
        }
      }
    }
    if (name === 'assetId' && !movement && !formData.assetIds?.length) {
      await assetsSelection.handleLegacyAssetIdChange(value, validation.mergeCrossFieldErrors);
    }

    if (name === 'movementType' && assetsSelection.assignmentContext && !movement) {
      const asset = validation.getAssetForValidation(formData.assetId);
      validation.applyRealtimeFieldError('movementType', newValue, nextFormData);
      if (asset && newValue) {
        const statusCheck = validateAssetStatusForContext(
          asset,
          newValue,
          assetsSelection.assignmentContext
        );
        setErrors((prev) => {
          const next = { ...prev };
          if (!statusCheck.valid) next.assetId = statusCheck.message;
          else if (next.assetId?.includes('estado')) delete next.assetId;
          return next;
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!(await validation.validate())) return;
    setSaving(true);
    setErrors({});
    documents.setUploadError(null);
    try {
      const documentsToAttach = await documents.uploadPendingFiles();
      const dataToSave = documents.finalizeSavePayload(documentsToAttach);
      await onSave(dataToSave);
    } catch (error) {
      setErrors({ submit: error.message || 'Error al guardar el movimiento' });
    } finally {
      setSaving(false);
    }
  };

  return {
    formData,
    displayAssets: assetsSelection.displayAssets,
    assetFilterMessage: assetsSelection.assetFilterMessage,
    errors,
    saving,
    loadingAssetLocation: assetsSelection.loadingAssetLocation,
    assetLocationLoaded: assetsSelection.assetLocationLoaded,
    isFirstAssignment: assetsSelection.isFirstAssignment,
    activeTab,
    setActiveTab,
    formProgress: validation.formProgress,
    checkingActiveMovements: assetsSelection.checkingActiveMovements,
    activeMovementWarning: assetsSelection.activeMovementWarning,
    checkingDocumentDuplicate: documents.checkingDocumentDuplicate,
    suggestedDocumentNumber: documents.suggestedDocumentNumber,
    suggestedDocumentSource: documents.suggestedDocumentSource,
    loadingSuggestedDoc: documents.loadingSuggestedDoc,
    applySuggestedDocumentNumber: documents.applySuggestedDocumentNumber,
    suggestedMovementType: assetsSelection.suggestedMovementType,
    assetMovementStatus: assetsSelection.assetMovementStatus,
    allowedMovementTypes: assetsSelection.assignmentContext?.allowedMovementTypes ?? null,
    assignmentContext: assetsSelection.assignmentContext,
    selectedFiles: documents.selectedFiles,
    uploadedDocuments: documents.uploadedDocuments,
    uploadingFiles: documents.uploadingFiles,
    uploadError: documents.uploadError,
    isDragging: documents.isDragging,
    fileInputRef: documents.fileInputRef,
    selectedAssets: assetsSelection.selectedAssets,
    assetContextMap: assetsSelection.assetContextMap,
    assetPickerValue: assetsSelection.assetPickerValue,
    setAssetPickerValue: assetsSelection.setAssetPickerValue,
    handleChange,
    handleAddAsset: assetsSelection.handleAddAsset,
    handleRemoveAsset: assetsSelection.handleRemoveAsset,
    handleAssetQuantityChange: assetsSelection.handleAssetQuantityChange,
    handleSubmit,
    handleFileChange: documents.handleFileChange,
    handleDragEnter: documents.handleDragEnter,
    handleDragLeave: documents.handleDragLeave,
    handleDragOver: documents.handleDragOver,
    handleDrop: documents.handleDrop,
    removeSelectedFile: documents.removeSelectedFile,
    removeUploadedDocument: documents.removeUploadedDocument,
    isTabComplete: validation.isTabComplete,
    hasTabErrors: validation.hasTabErrors,
    canEditAssets: assetsSelection.canEditAssets,
  };
}
