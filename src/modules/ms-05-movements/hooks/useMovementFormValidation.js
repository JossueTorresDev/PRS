import { useState, useEffect } from 'react';
import {
  validateField,
  validateForm,
  validateCrossFields,
} from '../utils/movementFormValidation';
import {
  validateAssetStatusForContext,
  validateEachAssetForMovementType,
} from '../utils/movementAssetContext';
import { MovementType } from '../types/movementTypes';
import { hasTabErrors, isTabComplete } from './movementFormTabUtils';

export function useMovementFormValidation({
  formData,
  movement,
  users,
  assignmentContext,
  assetContextMap,
  selectedAsset,
  displayAssets,
  assets,
  uploadedDocuments,
  selectedFiles,
  errors,
  setErrors,
  checkDocumentDuplicateOnSubmit,
}) {
  const [formProgress, setFormProgress] = useState({ completed: 0, total: 0, percentage: 0 });

  const getValidationContext = (asset) => ({
    assignmentContext,
    asset: asset || selectedAsset,
    assetContextEntries: Object.values(assetContextMap),
    isEditing: !!movement,
    isFirstAssignment: assignmentContext?.isFirstAssignment ?? false,
    hasCompletedMovements: assignmentContext?.hasCompletedMovements ?? false,
    users,
  });

  const getAssetForValidation = (assetId, data = formData) => {
    if (!assetId) return null;
    return (
      selectedAsset
      || assets?.find((a) => (a.id || a.assetId || a.uuid) === assetId)
      || displayAssets.find((a) => (a.id || a.assetId || a.uuid) === assetId)
      || null
    );
  };

  const mergeCrossFieldErrors = (data, assetCtx = selectedAsset) => {
    const cross = validateCrossFields(data, {
      ...getValidationContext(assetCtx),
    });
    setErrors((prev) => {
      const next = { ...prev };
      ['originAreaId', 'destinationAreaId', 'destinationResponsibleId', 'movementType'].forEach((k) => {
        if (prev[k] && !cross[k]) delete next[k];
      });
      return { ...next, ...cross };
    });
  };

  const applyRealtimeFieldError = (fieldName, fieldValue, nextFormData) => {
    const data = nextFormData || formData;
    const err = validateField(fieldName, fieldValue);
    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[fieldName] = err;
      else delete next[fieldName];

      const contextEntries = Object.values(assetContextMap);
      if (contextEntries.length > 0 && data.movementType && !movement) {
        const perAssetErrors = validateEachAssetForMovementType(contextEntries, data.movementType);
        if (perAssetErrors.length > 0) {
          const movementTypeErrors = perAssetErrors.filter(
            (msg) => msg.includes('corresponde a Primera Asignación') || msg.includes('no admite el tipo')
          );
          if (movementTypeErrors.length > 0) next.movementType = movementTypeErrors[0];
          else next.assetId = perAssetErrors[0];
        } else {
          if (prev.movementType?.includes('corresponde a Primera Asignación')) delete next.movementType;
          if (prev.assetId?.includes('estado')) delete next.assetId;
        }
      } else if (!movement && data.assetId && data.movementType && assignmentContext) {
        const asset = getAssetForValidation(data.assetId, data);
        const statusCheck = validateAssetStatusForContext(
          asset,
          data.movementType,
          assignmentContext
        );
        if (!statusCheck.valid) next.assetId = statusCheck.message;
        else if (prev.assetId?.includes('estado')) delete next.assetId;
      } else if (movement && prev.assetId?.includes('estado')) {
        delete next.assetId;
      }

      const cross = validateCrossFields(data, {
        ...getValidationContext(getAssetForValidation(data.assetId, data)),
      });
      ['originAreaId', 'destinationAreaId', 'destinationResponsibleId', 'movementType'].forEach((k) => {
        if (cross[k]) next[k] = cross[k];
        else if (
          ['originAreaId', 'destinationAreaId', 'destinationResponsibleId', 'movementType'].includes(k)
          && prev[k]
          && !cross[k]
        ) {
          delete next[k];
        }
      });
      return next;
    });
  };

  const validate = async () => {
    let newErrors = validateForm(formData, getValidationContext());
    const docNum = (formData.supportingDocumentNumber || '').trim();
    newErrors = await checkDocumentDuplicateOnSubmit(docNum, newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    mergeCrossFieldErrors(formData);
  }, [
    formData.originAreaId,
    formData.destinationAreaId,
    formData.originResponsibleId,
    formData.destinationResponsibleId,
    formData.movementType,
    assignmentContext,
    selectedAsset,
    movement,
  ]);

  useEffect(() => {
    const hasAssets = (formData.assetIds?.length > 0) || formData.assetId;
    const required = [hasAssets, formData.movementType, formData.reason, formData.requestingUser];
    if (
      formData.movementType === MovementType.INITIAL_ASSIGNMENT
      || formData.movementType === MovementType.RETURN
    ) {
      required.push(formData.originResponsibleId);
    }
    const optional = [
      formData.movementSubtype,
      formData.originResponsibleId,
      formData.destinationResponsibleId,
      formData.originAreaId,
      formData.destinationAreaId,
      formData.originLocationId,
      formData.destinationLocationId,
      formData.observations,
      formData.specialConditions,
      formData.supportingDocumentNumber,
      formData.supportingDocumentType,
      formData.executingUser,
    ];
    const hasDocuments = uploadedDocuments.length > 0 || selectedFiles.length > 0;
    const total = required.length + optional.length + 1;
    const completed = required.filter((f) => f?.toString().trim()).length
      + optional.filter((f) => f?.toString().trim()).length
      + (hasDocuments ? 1 : 0);
    setFormProgress({ completed, total, percentage: Math.round((completed / total) * 100) });
  }, [formData, uploadedDocuments, selectedFiles]);

  const checkTabComplete = (tabId) => isTabComplete(tabId, formData, uploadedDocuments, selectedFiles);
  const checkTabErrors = (tabId) => hasTabErrors(tabId, errors);

  return {
    formProgress,
    validate,
    applyRealtimeFieldError,
    mergeCrossFieldErrors,
    getAssetForValidation,
    isTabComplete: checkTabComplete,
    hasTabErrors: checkTabErrors,
  };
}
