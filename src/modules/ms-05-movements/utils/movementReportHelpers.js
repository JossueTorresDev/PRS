/** Normaliza respuestas de API a arreglo. */
export const normalizeApiList = (data) => {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.content && Array.isArray(data.content)) return data.content;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

export const getOriginAreaId = (movement) =>
  movement?.originAreaId
  ?? movement?.origin_area_id
  ?? movement?.originArea?.id
  ?? null;

export const getDestinationAreaId = (movement) =>
  movement?.destinationAreaId
  ?? movement?.destination_area_id
  ?? movement?.destinationArea?.id
  ?? null;

export const getOriginResponsibleId = (movement) =>
  movement?.originResponsibleId
  ?? movement?.origin_responsible_id
  ?? movement?.originResponsible?.id
  ?? null;

export const getDestinationResponsibleId = (movement) =>
  movement?.destinationResponsibleId
  ?? movement?.destination_responsible_id
  ?? movement?.destinationResponsible?.id
  ?? null;

/** Extrae bienes del movimiento (camelCase o snake_case). */
export function resolveMovementAssetItems(movement) {
  if (!movement) return [];
  const rawItems = movement.assetItems || movement.asset_items;
  if (Array.isArray(rawItems) && rawItems.length > 0) {
    return rawItems
      .map((item) => ({
        assetId: item.assetId || item.asset_id,
        quantity: item.quantity || 1,
        lineNumber: item.lineNumber || item.line_number,
      }))
      .filter((item) => item.assetId);
  }
  const rawIds = movement.assetIds || movement.asset_ids;
  const ids = Array.isArray(rawIds) && rawIds.length > 0
    ? rawIds
    : (movement.assetId || movement.asset_id ? [movement.assetId || movement.asset_id] : []);
  return ids.map((id) => ({ assetId: id, quantity: 1 }));
}

/** Nombre legible de un bien para reportes (descripción o código). */
export function getAssetDisplayName(assetId, assetSearchData = {}) {
  if (!assetId) return 'N/A';
  const asset = assetSearchData[assetId];
  if (asset) return asset.description || asset.code || assetId;
  return assetId;
}

/** Líneas de bienes para el reporte general (acta SBN: un movimiento, varias líneas). */
export function buildMovementAssetReportLines(movement, assetSearchData = {}) {
  const items = resolveMovementAssetItems(movement);
  if (!items.length) return [{ text: 'N/A', quantity: 0 }];

  const formatLine = (index, item, numbered) => {
    const name = formatTextByWords(getAssetDisplayName(item.assetId, assetSearchData), 28);
    const qty = item.quantity || 1;
    const prefix = numbered ? `${index + 1}. ` : '';
    const suffix = qty > 1 ? ` (×${qty})` : '';
    return { text: `${prefix}${name}${suffix}`, quantity: qty };
  };

  if (items.length === 1) return [formatLine(0, items[0], false)];
  return items.map((item, index) => formatLine(index, item, true));
}

/** Totales de bienes y unidades para el pie del reporte general. */
export function summarizeMovementAssets(movements = []) {
  let assetLines = 0;
  let units = 0;
  movements.forEach((movement) => {
    const items = resolveMovementAssetItems(movement);
    assetLines += items.length;
    units += items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  });
  return { movements: movements.length, assetLines, units };
}

/** Payload de bienes para crear o actualizar movimientos. */
export function buildMovementAssetPayload(movementData = {}) {
  const resolvedAssetItems = movementData.assetItems?.length
    ? movementData.assetItems.map((item) => ({
        assetId: item.assetId,
        quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
      }))
    : (movementData.assetIds?.length
      ? movementData.assetIds.map((id) => ({ assetId: id, quantity: 1 }))
      : (movementData.assetId ? [{ assetId: movementData.assetId, quantity: 1 }] : []));
  const resolvedAssetIds = resolvedAssetItems.map((item) => item.assetId);
  return {
    assetItems: resolvedAssetItems,
    assetIds: resolvedAssetIds,
    assetId: resolvedAssetIds[0] || movementData.assetId || '',
  };
}

/** Unifica campos camelCase/snake_case para el formulario de edición. */
export function normalizeMovementForForm(movement) {
  if (!movement) return movement;
  const assetItems = resolveMovementAssetItems(movement);
  const assetIds = assetItems.map((item) => item.assetId);
  return {
    ...movement,
    assetIds,
    assetItems,
    assetId: assetIds[0] || movement.assetId || movement.asset_id || '',
    originAreaId: getOriginAreaId(movement) || '',
    destinationAreaId: getDestinationAreaId(movement) || '',
    originLocationId:
      movement.originLocationId ?? movement.origin_location_id ?? movement.originLocation?.id ?? '',
    destinationLocationId:
      movement.destinationLocationId
      ?? movement.destination_location_id
      ?? movement.destinationLocation?.id
      ?? '',
    originResponsibleId: getOriginResponsibleId(movement) || '',
    destinationResponsibleId: getDestinationResponsibleId(movement) || '',
  };
}

/** Mapa id → nombre de área desde listado de áreas o mapa ya resuelto. */
export const buildAreasNameMap = (areasInput = []) => {
  const map = {};
  if (Array.isArray(areasInput)) {
    areasInput.forEach((area) => {
      if (!area) return;
      const id = area.id || area.areaId;
      if (!id) return;
      const name = area.name || area.areaName || area.nombre || area.areaCode || '';
      if (name) {
        map[id] = name;
        map[String(id)] = name;
      }
    });
  } else if (areasInput && typeof areasInput === 'object') {
    Object.entries(areasInput).forEach(([id, name]) => {
      if (name) {
        map[id] = name;
        map[String(id)] = name;
      }
    });
  }
  return map;
};

export const resolveAreaName = (areaId, areasMap) => {
  if (!areaId) return null;
  return areasMap[areaId] || areasMap[String(areaId)] || null;
};

export const getAreaLabelForMovement = (movement, areasMap) => {
  const embedded =
    movement?.destinationArea?.name
    || movement?.destinationAreaName
    || movement?.destination_area_name;
  if (embedded) return embedded;

  const areaId = getDestinationAreaId(movement);
  if (!areaId) return null;
  return resolveAreaName(areaId, areasMap);
};

export const truncateText = (text, max = 20) => {
  if (!text) return '';
  const str = String(text);
  return str.length > max ? `${str.substring(0, max - 3)}...` : str;
};

/** Salto de línea solo entre palabras (evita cortes tipo INFORMATI-CA en PDF). */
export const formatTextByWords = (text, maxLineLength = 36) => {
  const str = String(text || '').trim();
  if (!str) return '';
  if (str.length <= maxLineLength) return str;

  const words = str.split(/\s+/);
  const lines = [];
  let line = '';

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxLineLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines.join('\n');
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuidLike = (value) => UUID_REGEX.test(String(value || '').trim());

/** Convierte mapa id→nombre (objeto o arreglo de entidades) a lookup con claves string. */
export const buildLookupMap = (input = {}) => {
  if (Array.isArray(input)) {
    const map = {};
    input.forEach((item) => {
      if (!item) return;
      const id = item.id || item.personId || item.userId || item.areaId;
      if (!id) return;
      const name =
        item.name
        || item.fullName
        || item.nombreCompleto
        || item.username
        || item.userName
        || `${item.firstName || ''} ${item.lastName || ''} ${item.middleName || ''}`.trim()
        || item.areaName
        || item.nombre
        || item.areaCode
        || '';
      if (name && !isUuidLike(name)) {
        map[id] = name;
        map[String(id)] = name;
      }
    });
    return map;
  }
  if (input && typeof input === 'object') {
    const map = {};
    Object.entries(input).forEach(([id, name]) => {
      if (!name || isUuidLike(name)) return;
      map[id] = name;
      map[String(id)] = name;
    });
    return map;
  }
  return {};
};

/** Resuelve nombre desde uno o más mapas; no devuelve UUID crudo. */
export const resolveFromLookup = (id, ...lookups) => {
  if (!id) return null;
  const key = String(id);
  for (const map of lookups) {
    if (!map) continue;
    const val = map[id] ?? map[key];
    if (val && val !== id && val !== key && !isUuidLike(val)) return val;
  }
  return null;
};
