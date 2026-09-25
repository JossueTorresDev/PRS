import {
  TagIcon,
  CubeIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import {
  MovementStatusLabels,
  MovementTypeLabels,
  getMovementTypeSelectOptions,
} from '../../../types/movementTypes';
import { formatAssetDisplayName } from '../../../utils/assetNameFormatter';
import { matchesAssetId } from '../../../hooks/movementFormHelpers';
import { getScenarioShortLabel, getMaxQuantityForMovement } from '../../../utils/movementAssetContext';
import SelectSearch from '../../../../ms-04-patrimonio/components/shared/SelectSearch';
import { SectionTitle, FieldLabel, BRAND, ACCENT, ACCENT_LIGHT } from './formTabUi';

const fieldClass = (hasError) =>
  `w-full px-4 py-3 border rounded-lg text-gray-800 bg-white transition-all focus:outline-none focus:ring-2 focus:ring-[#283447]/15 focus:border-[#283447] ${
    hasError ? 'border-red-400 bg-red-50/40' : 'border-gray-200 hover:border-gray-300'
  }`;

const searchWrapperClass = (hasError) =>
  `[&_input]:w-full [&_input]:pl-11 [&_input]:pr-4 [&_input]:py-3 [&_input]:text-sm [&_input]:rounded-lg [&_input]:border [&_input]:transition-all [&_input]:focus:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-[#283447]/15 [&_input]:focus:border-[#283447] ${
    hasError
      ? '[&_input]:border-red-400 [&_input]:bg-red-50/40'
      : '[&_input]:border-gray-200 [&_input]:bg-gray-50/80 [&_input]:hover:border-gray-300 [&_input]:hover:bg-white'
  }`;

function AlertBox({ variant, icon: Icon, title, children }) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
  };
  const iconStyles = {
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-600',
  };
  return (
    <div className={`rounded-lg border px-4 py-3 flex items-start gap-3 ${styles[variant]}`}>
      {Icon && <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${iconStyles[variant]}`} />}
      <div className="min-w-0">
        {title && <p className="text-sm font-semibold">{title}</p>}
        {children && <div className={`text-sm leading-relaxed ${title ? 'mt-1' : ''}`}>{children}</div>}
      </div>
    </div>
  );
}

function AssetRow({
  item,
  entry,
  movementType,
  resolveAssetLabel,
  onQuantityChange,
  onRemove,
  editable,
  isEditing = false,
}) {
  const scenarioLabel = entry?.context ? getScenarioShortLabel(entry.context) : null;
  const movementTypeLabel = movementType ? (MovementTypeLabels[movementType] || movementType) : null;
  const displayBadgeLabel = isEditing ? movementTypeLabel : scenarioLabel;
  const stock = entry?.context?.stock;
  const isStockItem = stock?.isStockItem;
  const maxQty = isStockItem && entry?.context && movementType
    ? getMaxQuantityForMovement(entry.context, movementType)
    : 9999;
  const isFirstAssignment = !isEditing && (
    entry?.context?.scenarioKey === 'FIRST_ASSIGNMENT' ||
    entry?.context?.isFirstAssignment
  );
  const qty = item.quantity || 1;
  const label = resolveAssetLabel(item.assetId);

  const accentClass = isEditing
    ? 'border-l-slate-500'
    : isFirstAssignment
      ? 'border-l-emerald-500'
      : scenarioLabel
        ? 'border-l-blue-400'
        : 'border-l-gray-200';

  return (
    <div
      className={`group flex items-center gap-4 rounded-lg border border-gray-100 bg-white px-4 py-3.5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all border-l-4 ${accentClass}`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate" title={label}>
          {label}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          {displayBadgeLabel && (
            <span
              className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                isEditing
                  ? 'bg-slate-100 text-slate-700'
                  : isFirstAssignment
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isEditing ? `Tipo acta: ${displayBadgeLabel}` : displayBadgeLabel}
            </span>
          )}
          {isStockItem && (
            <span className="text-[10px] text-gray-400">
              Almacén {stock.availableInWarehouse} · En uso {stock.assignedInUse}
            </span>
          )}
        </div>
      </div>

      {editable ? (
        <>
          <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex-shrink-0">
            <button
              type="button"
              onClick={() => onQuantityChange?.(item.assetId, String(Math.max(1, qty - 1)))}
              disabled={qty <= 1}
              className="p-2 text-gray-500 hover:text-[#283447] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Disminuir"
            >
              <MinusIcon className="h-3.5 w-3.5" />
            </button>
            <input
              type="number"
              min={1}
              max={maxQty}
              value={qty}
              onChange={(e) => onQuantityChange?.(item.assetId, e.target.value)}
              className="w-12 py-2 text-center text-sm font-normal text-gray-700 bg-white border-x border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#283447]/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => onQuantityChange?.(item.assetId, String(Math.min(maxQty, qty + 1)))}
              disabled={qty >= maxQty}
              className="p-2 text-gray-500 hover:text-[#283447] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Aumentar"
            >
              <PlusIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => onRemove?.(item.assetId)}
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all flex-shrink-0"
            title="Quitar bien"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </>
      ) : (
        <span className="text-sm font-normal text-gray-700 tabular-nums flex-shrink-0">{qty}</span>
      )}
    </div>
  );
}

export default function MovementFormBasicTab({
  formData, errors, displayAssets, loadingData, movement,
  checkingActiveMovements, activeMovementWarning, assetMovementStatus,
  allowedMovementTypes, handleChange,
  selectedAssets = [], assetContextMap = {}, assetPickerValue = '', setAssetPickerValue,
  handleAddAsset, handleRemoveAsset, handleAssetQuantityChange,
  canEditAssets = true,
}) {
  const selectedItems = formData.assetItems?.length
    ? formData.assetItems
    : (formData.assetIds?.length
      ? formData.assetIds.map((id) => ({ assetId: id, quantity: 1 }))
      : (formData.assetId ? [{ assetId: formData.assetId, quantity: 1 }] : []));
  const selectedIds = selectedItems.map((item) => item.assetId);
  const totalQuantity = selectedItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const statusIsError = assetMovementStatus?.isError || errors.movementType;

  const includeTypes = [movement?.movementType, formData.movementType].filter(Boolean);
  const visibleTypeOptions = getMovementTypeSelectOptions({
    context: 'form',
    includeValues: includeTypes,
  });
  const movementTypeOptions = [
    { value: '', label: 'Seleccionar tipo de movimiento' },
    ...(selectedIds.length > 0 && allowedMovementTypes?.length && !movement
      ? visibleTypeOptions.filter(
          (o) =>
            !o.value ||
            allowedMovementTypes.includes(o.value) ||
            o.value === formData.movementType
        )
      : visibleTypeOptions),
  ];

  const assetOptions = displayAssets
    .filter((asset) => {
      const id = asset.id || asset.assetId || asset.uuid;
      return id && !selectedIds.includes(id);
    })
    .map((asset) => {
      const id = asset.id || asset.assetId || asset.uuid;
      return { id, label: formatAssetDisplayName(asset, true) };
    })
    .filter(Boolean);

  const resolveAssetLabel = (assetId) => {
    const asset =
      selectedAssets.find((a) => matchesAssetId(a, assetId)) ||
      displayAssets.find((a) => matchesAssetId(a, assetId)) ||
      assetContextMap[assetId]?.asset ||
      assetContextMap[String(assetId)]?.asset;
    return asset ? formatAssetDisplayName(asset, true) : assetId;
  };

  return (
    <div className="space-y-6">
      {/* Barra superior: número de acta o aviso de alta */}
      {movement ? (
        <div
          className="flex items-center gap-4 rounded-xl px-5 py-4 text-white shadow-md"
          style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #3d5166 100%)` }}
        >
          <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
            <TagIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider opacity-70">Número de movimiento</p>
            <p className="text-xl font-bold tracking-wide">{formData.movementNumber || '—'}</p>
          </div>
        </div>
      ) : (
        <AlertBox variant="info" icon={InformationCircleIcon}>
          Al guardar se asignará el número del acta. Agregue los bienes que formarán parte de este movimiento.
        </AlertBox>
      )}

      {/* Bienes patrimoniales */}
      <div className="rounded-xl bg-gray-50/70 ring-1 ring-gray-200/80 p-5">
        <SectionTitle
          badge={
            selectedItems.length > 0 ? (
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span
                  className="px-2.5 py-1 rounded-md ring-1"
                  style={{ backgroundColor: `${BRAND}10`, color: BRAND, borderColor: `${BRAND}25` }}
                >
                  {selectedItems.length} bien{selectedItems.length !== 1 ? 'es' : ''}
                </span>
                <span
                  className="px-2.5 py-1 rounded-md ring-1"
                  style={{ backgroundColor: ACCENT_LIGHT, color: ACCENT, borderColor: `${ACCENT}30` }}
                >
                  {totalQuantity} ud.
                </span>
              </div>
            ) : null
          }
        >
          <span className="flex items-center gap-1.5">
            <CubeIcon className="h-3.5 w-3.5" />
            Bienes patrimoniales
            <span className="text-red-500 normal-case tracking-normal">*</span>
          </span>
        </SectionTitle>

        {canEditAssets && (
          <div className="relative mb-4">
            {loadingData ? (
              <div className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-400 bg-white text-sm animate-pulse">
                Cargando activos...
              </div>
            ) : (
              <>
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none z-10" style={{ color: ACCENT }} />
                <div className={searchWrapperClass(errors.assetId)}>
                  <SelectSearch
                    key={`asset-picker-${selectedItems.length}`}
                    name="assetPicker"
                    value={assetPickerValue || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setAssetPickerValue?.(value);
                      if (value) handleAddAsset?.(value);
                    }}
                    options={assetOptions}
                    placeholder="Buscar y agregar bien por nombre o código..."
                    emptyOption={assetOptions.length === 0
                      ? '-- No hay más bienes disponibles --'
                      : '-- Agregar bien al movimiento --'}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {selectedItems.length > 0 ? (
          <div className="space-y-2.5">
            {selectedItems.map((item) => (
              <AssetRow
                key={item.assetId}
                item={item}
                entry={assetContextMap[item.assetId]}
                movementType={formData.movementType}
                resolveAssetLabel={resolveAssetLabel}
                onQuantityChange={handleAssetQuantityChange}
                onRemove={handleRemoveAsset}
                editable={canEditAssets}
                isEditing={!!movement}
              />
            ))}
          </div>
        ) : canEditAssets ? (
          <div className="flex flex-col items-center justify-center py-12 rounded-lg border border-dashed border-gray-300 bg-white/50">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: ACCENT_LIGHT }}>
              <CubeIcon className="h-6 w-6" style={{ color: ACCENT }} />
            </div>
            <p className="text-sm font-medium text-slate-500">Sin bienes agregados</p>
            <p className="text-xs text-slate-400 mt-1">Use el buscador para añadir ítems al acta</p>
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {errors.assetId && (
            <AlertBox variant="error" icon={ExclamationTriangleIcon}>{errors.assetId}</AlertBox>
          )}
          {checkingActiveMovements && (
            <div className="flex items-center gap-2.5 text-sm text-gray-500 py-1">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#283447] border-t-transparent" />
              Verificando movimientos activos...
            </div>
          )}
          {activeMovementWarning && !checkingActiveMovements && (
            <AlertBox
              variant="warning"
              icon={ExclamationTriangleIcon}
              title={`Uno de los bienes ya tiene ${
                activeMovementWarning.count > 1
                  ? `${activeMovementWarning.count} movimientos activos`
                  : 'un movimiento activo'
              }`}
            >
              {activeMovementWarning.movementNumber} —{' '}
              {MovementStatusLabels[activeMovementWarning.movementStatus] || activeMovementWarning.movementStatus}
            </AlertBox>
          )}
          {assetMovementStatus && selectedIds.length > 0 && canEditAssets && !movement && statusIsError && (
            <AlertBox
              variant="error"
              icon={ExclamationTriangleIcon}
              title={errors.movementType ? 'Tipo de movimiento no válido' : assetMovementStatus.label}
            >
              <p>{assetMovementStatus.description}</p>
              {errors.movementType && <p className="mt-1">{errors.movementType}</p>}
            </AlertBox>
          )}
        </div>
      </div>

      {/* Clasificación del movimiento */}
      <div className="rounded-xl bg-gray-50/70 ring-1 ring-gray-200/80 p-5">
        <SectionTitle accent={ACCENT}>Clasificación del movimiento</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <div>
            <FieldLabel icon={ArrowPathIcon} required>Tipo de Movimiento</FieldLabel>
            <select
              name="movementType"
              value={formData.movementType}
              onChange={handleChange}
              className={fieldClass(errors.movementType)}
            >
              {movementTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {errors.movementType && (
              <p className="mt-1.5 text-sm text-red-600">{errors.movementType}</p>
            )}
          </div>
          <div>
            <FieldLabel icon={AdjustmentsHorizontalIcon}>Subtipo de Movimiento</FieldLabel>
            <input
              type="text"
              name="movementSubtype"
              value={formData.movementSubtype}
              onChange={handleChange}
              maxLength={50}
              className={fieldClass(errors.movementSubtype)}
              placeholder="Ej: TransferenciaPorAscenso"
            />
            {errors.movementSubtype && (
              <p className="mt-1.5 text-sm text-red-600">{errors.movementSubtype}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
