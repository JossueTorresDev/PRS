import { MovementType } from '../types/movementTypes';

export const ASSIGNMENT_SCENARIO = {
  FIRST_ASSIGNMENT: 'FIRST_ASSIGNMENT',
  TRANSFER: 'TRANSFER',
};

const STATUS_AVAILABLE = ['DISPONIBLE', 'AVAILABLE', ''];
const STATUS_IN_USE = ['IN_USE', 'EN_USO'];
const TERMINAL_MOVEMENT_STATUSES = ['CANCELLED', 'REJECTED'];

export function normalizeAssetStatus(asset) {
  return (asset?.assetStatus || asset?.estadoBien || asset?.status || '').toString().trim().toUpperCase();
}

export function getAssetId(asset) {
  return asset?.id || asset?.assetId || asset?.uuid || null;
}

function assetHasCustody(asset) {
  if (!asset) return false;
  const responsible =
    asset.responsibleId ||
    asset.responsible_id ||
    asset.responsiblePersonId ||
    asset.currentResponsibleId;
  const area = asset.areaId || asset.area_id || asset.currentAreaId;
  const location =
    asset.locationId || asset.location_id || asset.physicalLocationId || asset.currentLocationId;
  return !!(responsible || area || location);
}

function getCompletedMovements(movements = []) {
  return (movements || []).filter((m) => m.movementStatus === 'COMPLETED');
}

/**
 * Completa el historial cuando read:own ocultó movimientos completados ajenos
 * o al editar un acta cuyo tipo ya implica traslado previo.
 */
export function enrichMovementsForScenario(movements = [], { editingMovement } = {}) {
  const list = [...(movements || [])];
  const hasCompleted = getCompletedMovements(list).length > 0;
  if (hasCompleted || !editingMovement) return list;

  const type = editingMovement.movementType || editingMovement.movement_type;
  if (type && type !== MovementType.INITIAL_ASSIGNMENT) {
    list.push({
      id: editingMovement.id,
      movementStatus: 'COMPLETED',
      movementType: type,
      assetId: editingMovement.assetId || editingMovement.asset_id,
      _syntheticHistory: true,
    });
  }
  return list;
}

function getLastCompletedMovement(movements = []) {
  return getCompletedMovements(movements).sort(
    (a, b) =>
      new Date(b.receptionDate || b.executionDate || b.completionDate || b.requestDate || 0) -
      new Date(a.receptionDate || a.executionDate || a.completionDate || a.requestDate || 0)
  )[0];
}

function getLastValidMovement(movements = []) {
  const valid = (movements || [])
    .filter(
      (m) =>
        !TERMINAL_MOVEMENT_STATUSES.includes(m.movementStatus) &&
        (m.destinationAreaId || m.destinationLocationId || m.destinationResponsibleId)
    )
    .sort((a, b) => new Date(b.requestDate || 0) - new Date(a.requestDate || 0));
  return getLastCompletedMovement(movements) || valid[0] || null;
}

/**
 * Cantidad registrada en Patrimonio.
 * ms-04 no captura cantidad en el alta: cada bien = 1 registro = 1 unidad (valor por defecto 1).
 * Si el API de assets devuelve quantity en el futuro, el saldo por lote se activará automáticamente.
 */
export function getAssetRegisteredQuantity(asset) {
  const raw = asset?.quantity ?? asset?.totalQuantity ?? asset?.stockQuantity ?? asset?.cantidad ?? 1;
  const parsed = parseInt(raw, 10);
  return Math.max(1, Number.isFinite(parsed) ? parsed : 1);
}

export function getMovementQuantityForAsset(movement, assetId) {
  if (!movement || !assetId) return 0;
  if (Array.isArray(movement.assetItems) && movement.assetItems.length > 0) {
    const item = movement.assetItems.find((i) => i.assetId === assetId);
    if (item) return Math.max(1, parseInt(item.quantity, 10) || 1);
  }
  const ids = movement.assetIds?.length ? movement.assetIds : (movement.assetId ? [movement.assetId] : []);
  if (ids.includes(assetId)) return 1;
  return 0;
}

/**
 * Saldo patrimonial según práctica SBN: unidades en almacén vs asignadas en uso.
 * Primera asignación consume saldo en almacén; devolución lo repone.
 */
export function computeAssetStockBalance(asset, movements = []) {
  const assetId = getAssetId(asset);
  const totalQuantity = getAssetRegisteredQuantity(asset);
  const completed = getCompletedMovements(movements);

  let assignedFromWarehouse = 0;
  let returnedToWarehouse = 0;

  completed.forEach((movement) => {
    const qty = getMovementQuantityForAsset(movement, assetId);
    if (!qty) return;
    if (movement.movementType === MovementType.INITIAL_ASSIGNMENT) {
      assignedFromWarehouse += qty;
    } else if (movement.movementType === MovementType.RETURN) {
      returnedToWarehouse += qty;
    }
  });

  const assignedInUse = Math.max(0, assignedFromWarehouse - returnedToWarehouse);
  const availableInWarehouse = Math.max(0, totalQuantity - assignedInUse);

  return {
    totalQuantity,
    assignedInUse,
    availableInWarehouse,
    returnedToWarehouse,
    isStockItem: totalQuantity > 1,
    hasPartialStock: totalQuantity > 1 && assignedInUse > 0 && availableInWarehouse > 0,
  };
}

export function getAssetScenarioKey(context, stock) {
  if (stock?.isStockItem) {
    if (stock.availableInWarehouse > 0) return ASSIGNMENT_SCENARIO.FIRST_ASSIGNMENT;
    if (stock.assignedInUse > 0) return ASSIGNMENT_SCENARIO.TRANSFER;
    return 'DEPLETED';
  }
  return context?.isFirstAssignment ? ASSIGNMENT_SCENARIO.FIRST_ASSIGNMENT : ASSIGNMENT_SCENARIO.TRANSFER;
}

export function getMaxQuantityForMovement(context, movementType) {
  const stock = context?.stock;
  if (!stock?.isStockItem) return 1;
  if (movementType === MovementType.INITIAL_ASSIGNMENT) return stock.availableInWarehouse;
  if ([MovementType.REASSIGNMENT, MovementType.AREA_TRANSFER, MovementType.RETURN].includes(movementType)) {
    return stock.assignedInUse;
  }
  return stock.totalQuantity;
}

export function validateMovementQuantityForAsset(context, movementType, quantity) {
  const stock = context?.stock;
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  if (!stock?.isStockItem) {
    return { valid: true, max: 9999, message: '' };
  }

  if (movementType === MovementType.INITIAL_ASSIGNMENT) {
    if (qty > stock.availableInWarehouse) {
      return {
        valid: false,
        max: stock.availableInWarehouse,
        message: `Solo hay ${stock.availableInWarehouse} unidad(es) en almacén disponibles para primera asignación.`,
      };
    }
    return { valid: true, max: stock.availableInWarehouse, message: '' };
  }

  if ([MovementType.REASSIGNMENT, MovementType.AREA_TRANSFER, MovementType.RETURN].includes(movementType)) {
    if (qty > stock.assignedInUse) {
      return {
        valid: false,
        max: stock.assignedInUse,
        message: `Solo hay ${stock.assignedInUse} unidad(es) asignada(s) en uso para este tipo de movimiento.`,
      };
    }
    return { valid: true, max: stock.assignedInUse, message: '' };
  }

  return { valid: true, max: stock.totalQuantity, message: '' };
}

/**
 * Determina el escenario del bien: primera asignación o traslado.
 * Fuente única de verdad para tipos permitidos, sugerencias y validación de estado.
 */
export function resolveAssetAssignmentContext(asset, movements = []) {
  const status = normalizeAssetStatus(asset);
  const completedMovements = getCompletedMovements(movements);
  const hasCompletedMovements = completedMovements.length > 0;
  const hasCustody = assetHasCustody(asset);
  const inUse = STATUS_IN_USE.includes(status);
  const isAvailable = STATUS_AVAILABLE.includes(status);
  const stock = computeAssetStockBalance(asset, movements);

  let isFirstAssignment;
  if (stock.isStockItem) {
    isFirstAssignment = stock.availableInWarehouse > 0;
  } else {
    // Bien unitario: si Patrimonio ya registra custodia o uso, hubo asignación formal.
    // read:own puede ocultar movimientos completados ajenos en el listado por activo.
    isFirstAssignment = !hasCompletedMovements && !hasCustody && !inUse;
  }

  const scenarioKey = getAssetScenarioKey({ isFirstAssignment }, stock);
  const scenario =
    scenarioKey === 'DEPLETED' ? ASSIGNMENT_SCENARIO.TRANSFER : scenarioKey;

  let guidedTypes = [];
  if (stock.isStockItem) {
    if (stock.availableInWarehouse > 0 && stock.assignedInUse === 0) {
      guidedTypes = [MovementType.INITIAL_ASSIGNMENT];
    } else if (stock.availableInWarehouse === 0 && stock.assignedInUse > 0) {
      guidedTypes = [MovementType.REASSIGNMENT, MovementType.AREA_TRANSFER];
    } else if (stock.hasPartialStock) {
      guidedTypes = [
        MovementType.INITIAL_ASSIGNMENT,
        MovementType.REASSIGNMENT,
        MovementType.AREA_TRANSFER,
      ];
    }
  } else {
    guidedTypes =
      scenario === ASSIGNMENT_SCENARIO.FIRST_ASSIGNMENT
        ? [MovementType.INITIAL_ASSIGNMENT]
        : [MovementType.REASSIGNMENT, MovementType.AREA_TRANSFER];
  }

  const allowedMovementTypes = [...guidedTypes];
  if (inUse || stock.assignedInUse > 0) {
    if (!allowedMovementTypes.includes(MovementType.RETURN)) {
      allowedMovementTypes.push(MovementType.RETURN);
    }
  }

  let suggestedMovementType = MovementType.INITIAL_ASSIGNMENT;
  if (stock.isStockItem && stock.availableInWarehouse > 0) {
    suggestedMovementType = MovementType.INITIAL_ASSIGNMENT;
  } else if (scenario === ASSIGNMENT_SCENARIO.TRANSFER) {
    suggestedMovementType = inUse || stock.assignedInUse > 0
      ? MovementType.RETURN
      : MovementType.REASSIGNMENT;
  }

  const lastMovement = getLastValidMovement(movements);

  return {
    scenario,
    scenarioKey,
    isFirstAssignment: scenario === ASSIGNMENT_SCENARIO.FIRST_ASSIGNMENT,
    isTransfer: scenario === ASSIGNMENT_SCENARIO.TRANSFER,
    hasCompletedMovements,
    hasCustody,
    status,
    inUse,
    isAvailable,
    allowedMovementTypes,
    suggestedMovementType,
    lastMovement,
    stock,
    statusInfo: buildStatusInfo(scenario, allowedMovementTypes, suggestedMovementType, hasCustody, stock),
  };
}

function buildStatusInfo(scenario, allowedMovementTypes, suggestedMovementType, hasCustody, stock = null) {
  const typeLabels = {
    [MovementType.INITIAL_ASSIGNMENT]: 'Primera Asignación',
    [MovementType.REASSIGNMENT]: 'Reasignación',
    [MovementType.AREA_TRANSFER]: 'Transferencia entre Áreas',
    [MovementType.RETURN]: 'Devolución',
  };
  const guidedOnly = allowedMovementTypes.filter((t) => t !== MovementType.RETURN);
  const allowedText = guidedOnly.map((t) => typeLabels[t] || t).join(' o ');
  const returnNote = allowedMovementTypes.includes(MovementType.RETURN)
    ? ' También puede usar Devolución si regresa el bien a almacén.'
    : '';

  if (stock?.hasPartialStock) {
    return {
      label: 'Stock parcial en almacén',
      description:
        `${stock.availableInWarehouse} de ${stock.totalQuantity} unidad(es) aún en almacén (primera asignación). ` +
        `${stock.assignedInUse} ya entregada(s). En cada acta mueva solo un tipo: salida de almacén o traslado de las asignadas.${returnNote}`,
      suggestedLabel: typeLabels[suggestedMovementType],
    };
  }

  if (stock?.isStockItem && stock.availableInWarehouse > 0) {
    return {
      label: `${stock.availableInWarehouse} unidad(es) en almacén`,
      description:
        `Registre la primera entrega formal de las unidades pendientes al área o responsable correspondiente (acta SBN).${returnNote}`,
      suggestedLabel: typeLabels[MovementType.INITIAL_ASSIGNMENT],
    };
  }

  if (scenario === ASSIGNMENT_SCENARIO.FIRST_ASSIGNMENT) {
    return {
      label: 'Bien sin historial de movimientos',
      description: `Registre la primera entrega formal del bien al área o responsable correspondiente.${returnNote}`,
      suggestedLabel: typeLabels[suggestedMovementType],
    };
  }

  return {
    label: stock?.isStockItem ? `${stock.assignedInUse} unidad(es) en uso` : 'Con movimientos previos',
    description: `Tipos: ${allowedText}.${returnNote}`,
    suggestedLabel: typeLabels[suggestedMovementType],
  };
}

export function getOriginFromContext(asset, lastMovement, movementType) {
  if (lastMovement) {
    return {
      originAreaId: lastMovement.destinationAreaId || '',
      originLocationId: lastMovement.destinationLocationId || '',
      originResponsibleId: lastMovement.destinationResponsibleId || '',
    };
  }
  if (!asset) return {};
  return {
    originAreaId: asset.areaId || asset.area_id || asset.currentAreaId || '',
    originLocationId:
      asset.locationId || asset.location_id || asset.physicalLocationId || asset.currentLocationId || '',
    originResponsibleId:
      asset.responsibleId ||
      asset.responsible_id ||
      asset.responsiblePersonId ||
      asset.currentResponsibleId ||
      '',
  };
}

export function isMovementTypeAllowed(movementType, context) {
  if (!movementType || !context) return true;
  const stock = context.stock;
  if (stock?.isStockItem) {
    if (movementType === MovementType.INITIAL_ASSIGNMENT) return stock.availableInWarehouse > 0;
    if ([MovementType.REASSIGNMENT, MovementType.AREA_TRANSFER].includes(movementType)) {
      return stock.assignedInUse > 0;
    }
    if (movementType === MovementType.RETURN) return stock.assignedInUse > 0;
  }
  return context.allowedMovementTypes.includes(movementType);
}

export function getValidStatusesForMovement(movementType, context) {
  const { isFirstAssignment, isTransfer } = context || {};
  switch (movementType) {
    case MovementType.INITIAL_ASSIGNMENT:
      if (!context?.hasCompletedMovements) {
        return ['DISPONIBLE', 'AVAILABLE', 'IN_USE', 'EN_USO', ''];
      }
      return ['DISPONIBLE', 'AVAILABLE', ''];
    case MovementType.REASSIGNMENT:
    case MovementType.AREA_TRANSFER:
      if (isTransfer || !isFirstAssignment) {
        return ['IN_USE', 'EN_USO', 'DISPONIBLE', 'AVAILABLE', ''];
      }
      return ['IN_USE', 'EN_USO'];
    case MovementType.RETURN:
      return ['IN_USE', 'EN_USO'];
    default:
      return ['DISPONIBLE', 'AVAILABLE', 'IN_USE', 'EN_USO', ''];
  }
}

export function validateAssetStatusForContext(asset, movementType, context) {
  if (!asset || !movementType) {
    return { valid: true, message: '' };
  }
  const status = normalizeAssetStatus(asset);
  const validStatuses = getValidStatusesForMovement(movementType, context);
  if (validStatuses.includes(status)) {
    return { valid: true, message: 'Estado válido para el movimiento.' };
  }

  const assetName =
    asset.description || asset.descripcion || asset.assetCode || asset.code || 'El activo seleccionado';
  const readable = {
    IN_USE: 'En uso',
    EN_USO: 'En uso',
    AVAILABLE: 'Disponible',
    DISPONIBLE: 'Disponible',
  };

  return {
    valid: false,
    message: `${assetName} está en estado "${readable[status] || status}". Para este tipo de movimiento el estado no es compatible. Verifique el registro en Patrimonio o elija el tipo sugerido.`,
  };
}

export function getRequiredFieldsForMovementType(movementType) {
  const base = ['assetId', 'movementType', 'reason', 'requestingUser', 'supportingDocumentNumber', 'supportingDocumentType'];
  switch (movementType) {
    case MovementType.INITIAL_ASSIGNMENT:
      return {
        required: [...base, 'destinationResponsibleId', 'destinationAreaId'],
        recommended: ['originResponsibleId', 'originAreaId', 'originLocationId', 'destinationLocationId'],
      };
    case MovementType.REASSIGNMENT:
      return {
        required: [
          ...base,
          'originResponsibleId',
          'destinationResponsibleId',
          'originAreaId',
          'destinationAreaId',
        ],
        recommended: ['originLocationId', 'destinationLocationId'],
      };
    case MovementType.AREA_TRANSFER:
      return {
        required: [
          ...base,
          'originResponsibleId',
          'destinationResponsibleId',
          'originAreaId',
          'destinationAreaId',
        ],
        recommended: ['originLocationId', 'destinationLocationId'],
      };
    case MovementType.RETURN:
      return {
        required: [...base, 'originResponsibleId', 'destinationResponsibleId'],
        recommended: ['originAreaId', 'destinationAreaId', 'destinationAreaId'],
      };
    default:
      return { required: base, recommended: [] };
  }
}

const FIELD_LABELS = {
  assetId: 'bien patrimonial',
  movementType: 'tipo de movimiento',
  reason: 'motivo del movimiento',
  requestingUser: 'persona solicitante',
  supportingDocumentNumber: 'número de documento de soporte',
  supportingDocumentType: 'tipo de documento de soporte',
  originResponsibleId: 'responsable de origen',
  destinationResponsibleId: 'responsable de destino',
  originAreaId: 'área de origen',
  destinationAreaId: 'área de destino',
  originLocationId: 'ubicación de origen',
  destinationLocationId: 'ubicación de destino',
};

export function getFieldLabel(fieldName) {
  return FIELD_LABELS[fieldName] || fieldName;
}

const MOVEMENT_TYPE_LABELS = {
  [MovementType.INITIAL_ASSIGNMENT]: 'Primera Asignación',
  [MovementType.REASSIGNMENT]: 'Reasignación',
  [MovementType.AREA_TRANSFER]: 'Transferencia entre Áreas',
  [MovementType.RETURN]: 'Devolución',
};

export function getScenarioShortLabel(context) {
  if (!context) return '';
  if (context.stock?.hasPartialStock) {
    return `${context.stock.availableInWarehouse} en almacén`;
  }
  if (context.stock?.isStockItem && context.stock.availableInWarehouse > 0) {
    return `${context.stock.availableInWarehouse} en almacén`;
  }
  if (context.stock?.isStockItem && context.stock.assignedInUse > 0) {
    return `${context.stock.assignedInUse} en uso`;
  }
  return context.isFirstAssignment ? 'Primera asignación' : 'Con historial';
}

export function contextsShareScenario(contexts = []) {
  if (!contexts.length) return true;
  const key = contexts[0].scenarioKey ?? contexts[0].scenario;
  return contexts.every((ctx) => (ctx.scenarioKey ?? ctx.scenario) === key);
}

export function intersectAllowedMovementTypes(contexts = []) {
  if (!contexts.length) return [];
  let allowed = [...contexts[0].allowedMovementTypes];
  for (let i = 1; i < contexts.length; i += 1) {
    const set = new Set(contexts[i].allowedMovementTypes);
    allowed = allowed.filter((type) => set.has(type));
  }
  return allowed;
}

/**
 * Valida que todos los bienes puedan registrarse en un mismo acta administrativa (práctica SBN).
 * No se mezclan primera asignación con traslados/reasignaciones en un solo documento.
 */
export function validateAssetGroupCompatibility(contexts = []) {
  if (!contexts.length) {
    return { valid: true, message: '', allowedMovementTypes: [] };
  }

  if (!contextsShareScenario(contexts)) {
    const enAlmacen = contexts.filter(
      (ctx) => (ctx.scenarioKey ?? ctx.scenario) === ASSIGNMENT_SCENARIO.FIRST_ASSIGNMENT
    ).length;
    const enUso = contexts.filter(
      (ctx) => (ctx.scenarioKey ?? ctx.scenario) === ASSIGNMENT_SCENARIO.TRANSFER
    ).length;
    return {
      valid: false,
      message:
        `No puede agrupar en un mismo acta bienes con saldo en almacén (${enAlmacen}) con bienes solo en uso/traslado (${enUso}). Según la normativa SBN, registre un acta por cada tipo de entrega o traslado.`,
      allowedMovementTypes: [],
    };
  }

  const allowedMovementTypes = intersectAllowedMovementTypes(contexts);
  if (!allowedMovementTypes.length) {
    return {
      valid: false,
      message:
        'Los bienes seleccionados no comparten un tipo de movimiento válido. Verifique el estado de cada bien o regístrelos en movimientos separados.',
      allowedMovementTypes: [],
    };
  }

  return { valid: true, message: '', allowedMovementTypes };
}

export function buildGroupStatusInfo(contexts = []) {
  if (!contexts.length) return null;

  const compat = validateAssetGroupCompatibility(contexts);
  if (!compat.valid) {
    return {
      label: 'Bienes incompatibles en el mismo acta',
      description: compat.message,
      isError: true,
    };
  }

  const count = contexts.length;
  const scenario = contexts[0].scenario;
  const guidedOnly = compat.allowedMovementTypes.filter((type) => type !== MovementType.RETURN);
  const allowedText = guidedOnly.map((type) => MOVEMENT_TYPE_LABELS[type] || type).join(' o ');
  const returnNote = compat.allowedMovementTypes.includes(MovementType.RETURN)
    ? ' También puede usar Devolución si regresa bienes a almacén.'
    : '';

  const totalInWarehouse = contexts.reduce(
    (sum, ctx) => sum + (ctx.stock?.availableInWarehouse || (ctx.isFirstAssignment ? 1 : 0)),
    0
  );
  const hasStock = contexts.some((ctx) => ctx.stock?.isStockItem);

  if (scenario === ASSIGNMENT_SCENARIO.FIRST_ASSIGNMENT) {
    return {
      label: hasStock
        ? (count > 1 ? `${count} bienes con saldo en almacén` : 'Saldo en almacén')
        : (count > 1 ? `${count} bienes sin historial de movimientos` : 'Bien sin historial de movimientos'),
      description: hasStock
        ? (count > 1
          ? `Puede registrar la primera entrega de ${totalInWarehouse} unidad(es) en un mismo acta (práctica SBN). Use Primera Asignación y respete el saldo de cada bien.`
          : `Hay ${totalInWarehouse} unidad(es) pendientes de primera entrega. Indique la cantidad a asignar en este acta.`)
        : (count > 1
          ? 'Puede registrar la primera entrega de todos en un mismo acta (práctica SBN en municipalidades). Use el tipo Primera Asignación.'
          : 'Registre la primera entrega formal del bien al área o responsable correspondiente.'),
      suggestedLabel: MOVEMENT_TYPE_LABELS[MovementType.INITIAL_ASSIGNMENT],
    };
  }

  return {
    label: count > 1 ? `${count} bienes con historial patrimonial` : 'Con movimientos previos',
    description:
      count > 1
        ? `Todos los bienes tienen movimientos registrados. En un mismo acta use ${allowedText} con el mismo origen y destino.${returnNote}`
        : `Tipos permitidos: ${allowedText}.${returnNote}`,
    suggestedLabel: MOVEMENT_TYPE_LABELS[contexts[0].suggestedMovementType],
  };
}

export function buildGroupAssignmentContext(contexts = []) {
  if (!contexts.length) return null;

  const compat = validateAssetGroupCompatibility(contexts);
  if (!compat.valid) return null;

  const base = contexts[0];
  const allowedMovementTypes = compat.allowedMovementTypes;
  let suggestedMovementType = base.suggestedMovementType;
  if (!allowedMovementTypes.includes(suggestedMovementType)) {
    suggestedMovementType =
      allowedMovementTypes.find((type) => type !== MovementType.RETURN) || allowedMovementTypes[0];
  }

  return {
    scenario: base.scenario,
    isFirstAssignment: contexts.every((ctx) => ctx.isFirstAssignment),
    isTransfer: contexts.some((ctx) => ctx.isTransfer),
    hasCompletedMovements: contexts.some((ctx) => ctx.hasCompletedMovements),
    hasCustody: contexts.some((ctx) => ctx.hasCustody),
    status: base.status,
    inUse: contexts.some((ctx) => ctx.inUse),
    isAvailable: contexts.every((ctx) => ctx.isAvailable),
    allowedMovementTypes,
    suggestedMovementType,
    lastMovement: base.lastMovement,
    statusInfo: buildGroupStatusInfo(contexts),
  };
}

export function getNewAssetIncompatibilityMessage(newContext, existingContexts = [], assetName = 'El bien') {
  if (!existingContexts.length || !newContext) return null;

  const existingKey = existingContexts[0]?.scenarioKey ?? existingContexts[0]?.scenario;
  const newKey = newContext.scenarioKey ?? newContext.scenario;
  if (existingKey !== newKey) {
    const existingLabel =
      existingKey === ASSIGNMENT_SCENARIO.FIRST_ASSIGNMENT
        ? 'saldo en almacén (primera asignación)'
        : 'traslado o reasignación';
    const newLabel =
      newKey === ASSIGNMENT_SCENARIO.FIRST_ASSIGNMENT
        ? 'saldo en almacén (primera asignación)'
        : 'traslado o reasignación';
    return `"${assetName}" corresponde a ${newLabel}, pero los bienes ya agregados son de ${existingLabel}. Según la normativa SBN, regístrelo en un movimiento aparte.`;
  }

  const allowed = intersectAllowedMovementTypes([...existingContexts, newContext]);
  if (!allowed.length) {
    return `"${assetName}" no comparte un tipo de movimiento válido con los bienes ya seleccionados. Regístrelo en un movimiento separado.`;
  }

  return null;
}

export function validateEachAssetForMovementType(entries = [], movementType) {
  if (!movementType || !entries.length) return [];

  const messages = [];
  entries.forEach((entry) => {
    const { asset, context, assetId } = entry;
    if (!context) return;

    if (!isMovementTypeAllowed(movementType, context)) {
      const assetName =
        asset?.description || asset?.descripcion || asset?.assetCode || asset?.code || assetId || 'Un bien';
      messages.push(
        context.isFirstAssignment
          ? `${assetName} corresponde a Primera Asignación.`
          : `${assetName} no admite el tipo de movimiento seleccionado.`
      );
      return;
    }

    const statusCheck = validateAssetStatusForContext(asset, movementType, context);
    if (!statusCheck.valid) {
      messages.push(statusCheck.message);
    }
  });

  return messages;
}

export function validateAssetItemQuantities(assetContextEntries = [], movementType, assetItems = []) {
  if (!movementType || !assetItems.length) return [];

  const entryById = Object.fromEntries(
    assetContextEntries.map((entry) => [entry.assetId, entry])
  );
  const messages = [];

  assetItems.forEach((item) => {
    const entry = entryById[item.assetId];
    if (!entry?.context) return;
    const qtyCheck = validateMovementQuantityForAsset(
      entry.context,
      movementType,
      item.quantity
    );
    if (!qtyCheck.valid) {
      const assetName =
        entry.asset?.description ||
        entry.asset?.descripcion ||
        entry.asset?.assetCode ||
        item.assetId;
      messages.push(`${assetName}: ${qtyCheck.message}`);
    }
  });

  return messages;
}
