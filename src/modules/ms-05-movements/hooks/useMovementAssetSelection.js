import { useState, useEffect } from 'react';
import { getBienPatrimonialById } from '../../ms-04-patrimonio/services/api';
import assetMovementService from '../services/assetMovementService';
import { filterAssetsByMovementType, getAssetFilterMessage } from '../utils/assetFilters';
import {
  resolveAssetAssignmentContext,
  getOriginFromContext,
  isMovementTypeAllowed,
  validateAssetGroupCompatibility,
  buildGroupAssignmentContext,
  getNewAssetIncompatibilityMessage,
  validateMovementQuantityForAsset,
  getMaxQuantityForMovement,
  enrichMovementsForScenario,
} from '../utils/movementAssetContext';
import { MovementType, MovementStatus } from '../types/movementTypes';
import { SUPPORTING_DOCUMENT_TYPE_DEFAULT } from '../utils/movementFormValidation';
import {
  findWarehouseArea,
  findWarehouseLocation,
  syncAssetFields,
  resolveAssetId,
  matchesAssetId,
} from './movementFormHelpers';

export function useMovementAssetSelection({
  movement,
  assets,
  areas,
  locations,
  loadingData,
  formData,
  setFormData,
  setErrors,
}) {
  const [displayAssets, setDisplayAssets] = useState([]);
  const [assetFilterMessage, setAssetFilterMessage] = useState('');
  const [loadingAssetLocation, setLoadingAssetLocation] = useState(false);
  const [assetLocationLoaded, setAssetLocationLoaded] = useState(false);
  const [isFirstAssignment, setIsFirstAssignment] = useState(false);
  const [checkingActiveMovements, setCheckingActiveMovements] = useState(false);
  const [activeMovementWarning, setActiveMovementWarning] = useState(null);
  const [suggestedMovementType, setSuggestedMovementType] = useState(null);
  const [assetMovementStatus, setAssetMovementStatus] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [assetContextMap, setAssetContextMap] = useState({});
  const [assetPickerValue, setAssetPickerValue] = useState('');
  const [hasCompletedMovements, setHasCompletedMovements] = useState(false);
  const [assignmentContext, setAssignmentContext] = useState(null);

  const canEditAssets = !movement
    || [MovementStatus.REQUESTED, MovementStatus.APPROVED].includes(
      formData.movementStatus || movement?.movementStatus
    );

  const applyAssignmentContext = (ctx) => {
    if (!ctx) {
      setAssignmentContext(null);
      setIsFirstAssignment(false);
      setHasCompletedMovements(false);
      setSuggestedMovementType(null);
      setAssetMovementStatus(null);
      return;
    }
    setAssignmentContext(ctx);
    setIsFirstAssignment(ctx.isFirstAssignment);
    setHasCompletedMovements(ctx.hasCompletedMovements);
    setSuggestedMovementType(ctx.suggestedMovementType);
    setAssetMovementStatus(ctx.statusInfo);
  };

  const fetchAssetContextEntry = async (assetId, assetFromList = null) => {
    const asset =
      assetFromList
      || selectedAssets.find((a) => resolveAssetId(a) === assetId)
      || assets?.find((a) => resolveAssetId(a) === assetId)
      || (await getBienPatrimonialById(assetId));
    const assetMovements = await assetMovementService.getMovementsByAsset(assetId);
    const movementsForContext = enrichMovementsForScenario(assetMovements, { editingMovement: movement });
    const context = resolveAssetAssignmentContext(asset, movementsForContext);
    return { assetId, asset, context };
  };

  const applyGroupContextFromEntries = (entries, { clearGroupError = true } = {}) => {
    const map = Object.fromEntries(entries.map((entry) => [entry.assetId, entry]));
    setAssetContextMap(map);
    setSelectedAssets(entries.map((entry) => entry.asset).filter(Boolean));
    setSelectedAsset(entries[0]?.asset || null);

    const contexts = entries.map((entry) => entry.context);
    const compat = validateAssetGroupCompatibility(contexts);
    if (!compat.valid) {
      setAssetMovementStatus({
        label: 'Bienes incompatibles en el mismo acta',
        description: compat.message,
        isError: true,
      });
      setAssignmentContext(null);
      setIsFirstAssignment(false);
      setHasCompletedMovements(false);
      setSuggestedMovementType(null);
      setErrors((prev) => ({ ...prev, assetId: compat.message }));
      return null;
    }

    const groupCtx = buildGroupAssignmentContext(contexts);
    if (groupCtx) applyAssignmentContext(groupCtx);

    if (clearGroupError) {
      setErrors((prev) => {
        const next = { ...prev };
        const assetError = next.assetId || '';
        if (
          assetError.includes('agrupar')
          || assetError.includes('corresponde a')
          || assetError.includes('no comparte')
          || assetError.includes('incompatible')
        ) {
          delete next.assetId;
        }
        return next;
      });
    }

    return groupCtx;
  };

  const syncAssetContexts = async (items, { syncOrigin = false, assetHints = [] } = {}) => {
    if (!items?.length) {
      setAssetContextMap({});
      applyAssignmentContext(null);
      setSelectedAssets([]);
      setSelectedAsset(null);
      return null;
    }

    const hintsById = Object.fromEntries(
      assetHints
        .map((asset) => {
          const id = resolveAssetId(asset);
          return id ? [id, asset] : null;
        })
        .filter(Boolean)
    );

    const entries = await Promise.all(
      items.map(async (item) => {
        const cached = assetContextMap[item.assetId];
        if (cached?.context && cached?.asset) return cached;
        const hint = hintsById[item.assetId] || cached?.asset;
        try {
          return await fetchAssetContextEntry(item.assetId, hint);
        } catch (error) {
          console.error('Error loading asset context:', error);
          const asset = hint || assets?.find((a) => resolveAssetId(a) === item.assetId);
          const fallbackMovements = enrichMovementsForScenario([], { editingMovement: movement });
          return {
            assetId: item.assetId,
            asset,
            context: resolveAssetAssignmentContext(asset, fallbackMovements),
          };
        }
      })
    );

    const groupCtx = applyGroupContextFromEntries(entries);

    if (syncOrigin && entries[0] && groupCtx) {
      const origin = getOriginFromContext(entries[0].asset, groupCtx.lastMovement, formData.movementType);
      if (origin.originAreaId || origin.originLocationId || origin.originResponsibleId) {
        setFormData((prev) => ({ ...prev, ...origin }));
        setAssetLocationLoaded(true);
        setTimeout(() => setAssetLocationLoaded(false), 5000);
      }
    }

    return groupCtx;
  };

  const loadCurrentAssetLocation = async (
    assetId,
    assetFromList = null,
    { syncOriginToForm = true } = {}
  ) => {
    if (!assetId) return null;
    setLoadingAssetLocation(true);
    setAssetLocationLoaded(false);

    try {
      const items = formData.assetItems?.length
        ? formData.assetItems
        : [{ assetId, quantity: 1 }];
      return await syncAssetContexts(items, {
        syncOrigin: syncOriginToForm,
        assetHints: assetFromList ? [assetFromList] : [],
      });
    } finally {
      setLoadingAssetLocation(false);
    }
  };

  useEffect(() => {
    if (!assets || !Array.isArray(assets)) {
      setDisplayAssets([]);
      setAssetFilterMessage('');
      return;
    }
    const selectedCount = formData.assetItems?.length
      || formData.assetIds?.length
      || (formData.assetId ? 1 : 0);
    const hasAssignmentHistoryForFilter = selectedCount > 0
      ? (assignmentContext?.isTransfer ?? false)
      : (assignmentContext?.hasCompletedMovements ?? false);

    let filtered = filterAssetsByMovementType(assets, formData.movementType, {
      hasAssignmentHistory: hasAssignmentHistoryForFilter,
    });

    if (selectedCount > 0 && !assignmentContext && filtered.length <= selectedCount) {
      filtered = filterAssetsByMovementType(assets, formData.movementType, {
        hasAssignmentHistory: false,
      });
    }

    const pinnedIds = new Set(
      formData.assetItems?.length
        ? formData.assetItems.map((item) => item.assetId)
        : (formData.assetIds?.length ? formData.assetIds : [formData.assetId].filter(Boolean))
    );
    pinnedIds.forEach((selectedId) => {
      const alreadyInList = filtered.some(
        (a) => (a.id || a.assetId || a.uuid) === selectedId
      );
      if (!alreadyInList) {
        const pinned =
          selectedAssets.find((a) => (a.id || a.assetId || a.uuid) === selectedId)
          || selectedAsset
          || assets.find((a) => (a.id || a.assetId || a.uuid) === selectedId);
        if (pinned) filtered = [pinned, ...filtered];
      }
    });
    setDisplayAssets(filtered);
    setAssetFilterMessage(getAssetFilterMessage(formData.movementType));
  }, [
    assets,
    formData.movementType,
    formData.assetId,
    formData.assetIds,
    formData.assetItems,
    selectedAsset,
    selectedAssets,
    assignmentContext,
  ]);

  useEffect(() => {
    if (!movement || loadingData) return;

    const recordItems = movement.assetItems?.length
      ? movement.assetItems
      : (movement.assetId ? [{ assetId: movement.assetId }] : []);

    recordItems.forEach((item) => {
      const assetId = item.assetId || item.asset_id;
      if (!assetId) return;

      const inCatalog = assets?.some((a) => matchesAssetId(a, assetId));
      if (inCatalog) return;

      getBienPatrimonialById(assetId)
        .then((asset) => {
          if (!asset) return;
          setDisplayAssets((prev) => {
            if (prev.some((a) => matchesAssetId(a, assetId))) return prev;
            return [asset, ...prev];
          });
        })
        .catch(() => {});
    });
  }, [movement?.id, assets, loadingData]);

  const pinDisplayAsset = (asset) => {
    const assetId = resolveAssetId(asset);
    if (!asset) return;
    setDisplayAssets((prev) => {
      if (prev.some((a) => matchesAssetId(a, assetId))) return prev;
      return [asset, ...prev];
    });
  };

  const handleAddAsset = async (assetId) => {
    if (!assetId || !canEditAssets) return;
    const currentIds = formData.assetIds?.length
      ? [...formData.assetIds]
      : (formData.assetId ? [formData.assetId] : []);
    if (currentIds.includes(assetId)) {
      setAssetPickerValue('');
      return;
    }

    const asset = (assets || []).find((a) => (a.id || a.assetId || a.uuid) === assetId) || null;
    const nextAssets = [...selectedAssets, asset].filter(Boolean);
    const nextItems = [
      ...(formData.assetItems?.length
        ? formData.assetItems
        : currentIds.map((id) => ({ assetId: id, quantity: 1 }))),
      { assetId, quantity: 1 },
    ];
    const nextIds = nextItems.map((item) => item.assetId);

    setCheckingActiveMovements(true);
    setActiveMovementWarning(null);
    try {
      const result = await assetMovementService.checkActiveMovements(assetId);
      if (result.hasActiveMovement) {
        const activeMovements = (result.activeMovements || []).filter(
          (m) => m.id !== movement?.id
        );
        if (activeMovements.length > 0) {
          const active = activeMovements[0];
          setActiveMovementWarning({
            movementNumber: active.movementNumber,
            movementType: active.movementType,
            movementStatus: active.movementStatus,
            count: activeMovements.length,
            assetId,
          });
          return;
        }
      }
    } catch { /* continuar */ }
    finally { setCheckingActiveMovements(false); }

    let newEntry;
    try {
      newEntry = await fetchAssetContextEntry(assetId, asset);
    } catch {
      setErrors((prev) => ({
        ...prev,
        assetId: 'No se pudo verificar el historial del bien. Intente nuevamente.',
      }));
      setAssetPickerValue('');
      return;
    }

    const existingContexts = currentIds.map((id) => assetContextMap[id]?.context).filter(Boolean);
    const assetName =
      asset?.description || asset?.descripcion || asset?.assetCode || asset?.code || assetId;
    const incompatibility = getNewAssetIncompatibilityMessage(
      newEntry.context,
      existingContexts,
      assetName
    );
    if (incompatibility) {
      setErrors((prev) => ({ ...prev, assetId: incompatibility }));
      setAssetPickerValue('');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      ...syncAssetFields(nextItems),
      ...(nextIds.length === 1 && !movement
        ? { originAreaId: '', originLocationId: '', originResponsibleId: '' }
        : {}),
    }));
    setAssetPickerValue('');

    const groupCtx = await syncAssetContexts(nextItems, {
      syncOrigin: nextIds.length === 1,
      assetHints: nextAssets.filter(Boolean),
    });

    if (groupCtx) {
      const warehouseArea = findWarehouseArea(areas);
      const warehouseLocation = findWarehouseLocation(locations);
      setFormData((prev) => {
        const keepType = isMovementTypeAllowed(prev.movementType, groupCtx)
          ? prev.movementType
          : groupCtx.suggestedMovementType;
        const next = {
          ...prev,
          ...syncAssetFields(nextItems),
          movementType: keepType || groupCtx.suggestedMovementType,
          supportingDocumentType: prev.supportingDocumentType || SUPPORTING_DOCUMENT_TYPE_DEFAULT,
        };
        if (keepType === MovementType.RETURN && (warehouseArea || warehouseLocation)) {
          next.destinationAreaId = prev.destinationAreaId || warehouseArea?.id || '';
          next.destinationLocationId = prev.destinationLocationId || warehouseLocation?.id || '';
        }
        return next;
      });
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next.assetId;
      return next;
    });
  };

  const handleAssetQuantityChange = (assetId, quantity) => {
    if (!assetId || !canEditAssets) return;
    const entry = assetContextMap[assetId];
    const isStockItem = entry?.context?.stock?.isStockItem;
    const maxQty = isStockItem && formData.movementType && entry?.context
      ? getMaxQuantityForMovement(entry.context, formData.movementType)
      : 9999;
    const parsed = Math.min(maxQty, Math.max(1, parseInt(quantity, 10) || 1));
    const currentItems = formData.assetItems?.length
      ? formData.assetItems
      : (formData.assetIds || []).map((id) => ({ assetId: id, quantity: 1 }));
    const nextItems = currentItems.map((item) =>
      (item.assetId === assetId ? { ...item, quantity: parsed } : item)
    );
    setFormData((prev) => ({ ...prev, ...syncAssetFields(nextItems) }));

    if (formData.movementType && entry?.context) {
      const qtyCheck = validateMovementQuantityForAsset(
        entry.context,
        formData.movementType,
        parsed
      );
      setErrors((prev) => {
        const next = { ...prev };
        if (!qtyCheck.valid) next.assetId = qtyCheck.message;
        else if (next.assetId?.includes('unidad')) delete next.assetId;
        return next;
      });
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.assetId;
        return next;
      });
    }
  };

  const handleRemoveAsset = (assetId) => {
    if (!assetId || !canEditAssets) return;
    const currentItems = formData.assetItems?.length
      ? formData.assetItems
      : (formData.assetIds || []).map((id) => ({ assetId: id, quantity: 1 }));
    const nextItems = currentItems.filter((item) => item.assetId !== assetId);
    const nextIds = nextItems.map((item) => item.assetId);
    const nextAssets = selectedAssets.filter((a) => (a.id || a.assetId || a.uuid) !== assetId);
    if (nextIds.length === 0) {
      setFormData((prev) => ({
        ...prev,
        assetItems: [],
        assetIds: [],
        assetId: '',
        originAreaId: '',
        originLocationId: '',
        originResponsibleId: '',
      }));
      setSelectedAssets([]);
      setSelectedAsset(null);
      setAssetContextMap({});
      applyAssignmentContext(null);
      return;
    }
    setFormData((prev) => ({
      ...prev,
      ...syncAssetFields(nextItems),
    }));
    syncAssetContexts(nextItems, {
      syncOrigin: nextIds.length === 1,
      assetHints: nextAssets.filter(Boolean),
    });
  };

  const handleLegacyAssetIdChange = async (value, mergeCrossFieldErrors) => {
    setActiveMovementWarning(null);
    applyAssignmentContext(null);
    setSelectedAsset(null);
    if (value) {
      const asset = (assets || []).find((a) => (a.id || a.assetId || a.uuid) === value) || null;
      setSelectedAsset(asset);
      setCheckingActiveMovements(true);
      try {
        const result = await assetMovementService.checkActiveMovements(value);
        if (result.hasActiveMovement) {
          const active = result.activeMovements[0];
          setActiveMovementWarning({
            movementNumber: active.movementNumber,
            movementType: active.movementType,
            movementStatus: active.movementStatus,
            count: result.activeMovements.length,
          });
        }
      } catch { /* continuar */ }
      finally { setCheckingActiveMovements(false); }

      setFormData((prev) => ({ ...prev, originAreaId: '', originLocationId: '', originResponsibleId: '' }));

      const ctx = await loadCurrentAssetLocation(value, asset);
      if (!movement && ctx) {
        const warehouseArea = findWarehouseArea(areas);
        const warehouseLocation = findWarehouseLocation(locations);
        setFormData((prev) => {
          const keepType = isMovementTypeAllowed(prev.movementType, ctx)
            ? prev.movementType
            : ctx.suggestedMovementType;
          const next = {
            ...prev,
            movementType: keepType || ctx.suggestedMovementType,
            supportingDocumentType: prev.supportingDocumentType || SUPPORTING_DOCUMENT_TYPE_DEFAULT,
          };
          if (keepType === MovementType.RETURN && (warehouseArea || warehouseLocation)) {
            next.destinationAreaId = prev.destinationAreaId || warehouseArea?.id || '';
            next.destinationLocationId = prev.destinationLocationId || warehouseLocation?.id || '';
          }
          return next;
        });
        mergeCrossFieldErrors(
          {
            ...formData,
            assetId: value,
            movementType: isMovementTypeAllowed(formData.movementType, ctx)
              ? formData.movementType || ctx.suggestedMovementType
              : ctx.suggestedMovementType,
          },
          asset
        );
      }
    } else {
      setFormData((prev) => ({ ...prev, originAreaId: '', originLocationId: '', originResponsibleId: '' }));
      applyAssignmentContext(null);
    }
  };

  const initSelectedAssets = (matchedAssets) => {
    setSelectedAssets(matchedAssets);
    setSelectedAsset(matchedAssets[0] || null);
  };

  return {
    displayAssets,
    assetFilterMessage,
    loadingAssetLocation,
    assetLocationLoaded,
    isFirstAssignment,
    checkingActiveMovements,
    activeMovementWarning,
    suggestedMovementType,
    assetMovementStatus,
    selectedAsset,
    selectedAssets,
    assetContextMap,
    assetPickerValue,
    setAssetPickerValue,
    assignmentContext,
    canEditAssets,
    loadCurrentAssetLocation,
    handleAddAsset,
    handleRemoveAsset,
    handleAssetQuantityChange,
    handleLegacyAssetIdChange,
    initSelectedAssets,
    pinDisplayAsset,
  };
}
