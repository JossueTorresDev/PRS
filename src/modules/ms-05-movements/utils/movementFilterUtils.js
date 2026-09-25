export function applyMovementFilters(movements, filters, relatedData = {}) {
  if (!movements || movements.length === 0) {
    return [];
  }
  const { assets = {}, persons = {}, areas = {}, locations = {} } = relatedData;
  return movements.filter(movement => {
    if (filters.searchText && filters.searchText.trim()) {
      const searchLower = filters.searchText.toLowerCase().trim();
      const movementNumber = (movement.movementNumber || '').toLowerCase();
      if (movementNumber.includes(searchLower)) {
        return true;
      }
      const asset = assets[movement.assetId];
      if (asset) {
        const assetCode = (asset.assetCode || asset.code || '').toLowerCase();
        const assetDescription = (asset.description || asset.descripcion || '').toLowerCase();
        if (assetCode.includes(searchLower) || assetDescription.includes(searchLower)) {
          return true;
        }
      }
      const originResponsible = persons[movement.originResponsibleId];
      const destResponsible = persons[movement.destinationResponsibleId];
      if (originResponsible) {
        const originName = `${originResponsible.firstName || ''} ${originResponsible.lastName || ''}`.toLowerCase();
        if (originName.includes(searchLower)) {
          return true;
        }
      }
      if (destResponsible) {
        const destName = `${destResponsible.firstName || ''} ${destResponsible.lastName || ''}`.toLowerCase();
        if (destName.includes(searchLower)) {
          return true;
        }
      }
      return false;
    }
    if (filters.status && movement.movementStatus !== filters.status) {
      return false;
    }
    if (filters.type && movement.movementType !== filters.type) {
      return false;
    }
    if (filters.startDate) {
      const movementDate = new Date(movement.requestDate || movement.createdAt);
      const filterDate = new Date(filters.startDate);
      if (movementDate < filterDate) {
        return false;
      }
    }
    if (filters.endDate) {
      const movementDate = new Date(movement.requestDate || movement.createdAt);
      const filterDate = new Date(filters.endDate);
      filterDate.setDate(filterDate.getDate() + 1);
      if (movementDate >= filterDate) {
        return false;
      }
    }
    if (filters.originAreaId && movement.originAreaId !== filters.originAreaId) {
      return false;
    }
    if (filters.destinationAreaId && movement.destinationAreaId !== filters.destinationAreaId) {
      return false;
    }
    if (filters.originLocationId && movement.originLocationId !== filters.originLocationId) {
      return false;
    }
    if (filters.destinationLocationId && movement.destinationLocationId !== filters.destinationLocationId) {
      return false;
    }
    if (filters.responsibleId) {
      if (movement.originResponsibleId !== filters.responsibleId && 
          movement.destinationResponsibleId !== filters.responsibleId) {
        return false;
      }
    }
    return true;
  });
}
export function countMovementsByStatus(movements) {
  const counts = {
    REQUESTED: 0,
    APPROVED: 0,
    REJECTED: 0,
    IN_PROCESS: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    PARTIAL: 0,
    total: 0
  };
  if (!movements || movements.length === 0) {
    return counts;
  }
  movements.forEach(movement => {
    const status = movement.movementStatus;
    if (counts.hasOwnProperty(status)) {
      counts[status]++;
    }
    counts.total++;
  });
  return counts;
}
export function countMovementsByType(movements) {
  const counts = {};
  if (!movements || movements.length === 0) {
    return counts;
  }
  movements.forEach(movement => {
    const type = movement.movementType;
    counts[type] = (counts[type] || 0) + 1;
  });
  return counts;
}