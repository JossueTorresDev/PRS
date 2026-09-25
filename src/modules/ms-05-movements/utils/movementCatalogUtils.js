const matchesCatalogId = (item, id) => {
  if (!item || id == null || id === '') return false;
  return String(item.id) === String(id);
};

export function buildCatalogFallbackItem(id, labelPrefix, codeKey = 'areaCode') {
  const shortId = String(id).slice(0, 8);
  return {
    id,
    name: `${labelPrefix} (${shortId}…)`,
    [codeKey]: '',
    active: true,
    __fallback: true,
  };
}

export async function hydrateCatalogForMovement(catalog = [], ids = [], options = {}) {
  const { fetchById, labelPrefix = 'Registro', codeKey = 'areaCode' } = options;
  const merged = Array.isArray(catalog) ? [...catalog] : [];
  const missingIds = [...new Set(ids.filter(Boolean))].filter(
    (id) => !merged.some((item) => matchesCatalogId(item, id))
  );

  if (!missingIds.length) return merged;

  const fetched = await Promise.all(
    missingIds.map(async (id) => {
      if (typeof fetchById === 'function') {
        try {
          const item = await fetchById(id);
          if (item?.id) return item;
        } catch {
          /* usar fallback */
        }
      }
      return buildCatalogFallbackItem(id, labelPrefix, codeKey);
    })
  );

  fetched.forEach((item) => {
    if (!merged.some((existing) => matchesCatalogId(existing, item.id))) {
      merged.push(item);
    }
  });

  return merged;
}

export async function hydrateMovementFormCatalogs({
  areas = [],
  locations = [],
  movement = null,
  getAreaById,
  getPhysicalLocationById,
} = {}) {
  if (!movement) {
    return { areas, locations };
  }

  const areaIds = [movement.originAreaId, movement.destinationAreaId].filter(Boolean);
  const locationIds = [movement.originLocationId, movement.destinationLocationId].filter(Boolean);

  const [hydratedAreas, hydratedLocations] = await Promise.all([
    hydrateCatalogForMovement(areas, areaIds, {
      fetchById: getAreaById,
      labelPrefix: 'Área',
      codeKey: 'areaCode',
    }),
    hydrateCatalogForMovement(locations, locationIds, {
      fetchById: getPhysicalLocationById,
      labelPrefix: 'Ubicación',
      codeKey: 'locationCode',
    }),
  ]);

  return { areas: hydratedAreas, locations: hydratedLocations };
}
