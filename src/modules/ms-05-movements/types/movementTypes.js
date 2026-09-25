export const MovementType = {
  INITIAL_ASSIGNMENT: 'INITIAL_ASSIGNMENT',
  REASSIGNMENT: 'REASSIGNMENT',
  AREA_TRANSFER: 'AREA_TRANSFER',
  EXTERNAL_TRANSFER: 'EXTERNAL_TRANSFER',
  RETURN: 'RETURN',
  LOAN: 'LOAN',
  MAINTENANCE: 'MAINTENANCE',
  REPAIR: 'REPAIR',
  DISPOSAL: 'DISPOSAL'
};
export const MovementStatus = {
  REQUESTED: 'REQUESTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  IN_PROCESS: 'IN_PROCESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  PARTIAL: 'PARTIAL'
};
export const MovementTypeLabels = {
  [MovementType.INITIAL_ASSIGNMENT]: 'Primera Asignación',
  [MovementType.REASSIGNMENT]: 'Reasignación',
  [MovementType.AREA_TRANSFER]: 'Transferencia entre Áreas',
  [MovementType.EXTERNAL_TRANSFER]: 'Transferencia Externa',
  [MovementType.RETURN]: 'Devolución',
  [MovementType.LOAN]: 'Préstamo Temporal',
  [MovementType.MAINTENANCE]: 'Mantenimiento',
  [MovementType.REPAIR]: 'Reparación',
  [MovementType.DISPOSAL]: 'Baja'
};

/** Solo UI: ocultos en filtros del módulo de movimientos (no se eliminan del sistema). */
export const UI_HIDDEN_MOVEMENT_TYPES_MODULE = [
  MovementType.LOAN,
  MovementType.MAINTENANCE,
  MovementType.REPAIR,
];

/** Solo UI: ocultos en el selector del formulario de movimiento. */
export const UI_HIDDEN_MOVEMENT_TYPES_FORM = [
  MovementType.LOAN,
  MovementType.MAINTENANCE,
  MovementType.REPAIR,
  MovementType.DISPOSAL,
];

/**
 * Opciones para selects de tipo de movimiento.
 * @param {'module'|'form'} context
 * @param {string[]} includeValues - tipos a mostrar aunque estén ocultos (ej. al editar un registro existente)
 */
export function getMovementTypeSelectOptions({ context = 'module', includeValues = [] } = {}) {
  const hidden =
    context === 'form' ? UI_HIDDEN_MOVEMENT_TYPES_FORM : UI_HIDDEN_MOVEMENT_TYPES_MODULE;
  const include = new Set(includeValues.filter(Boolean));
  return Object.entries(MovementTypeLabels)
    .filter(([value]) => !hidden.includes(value) || include.has(value))
    .map(([value, label]) => ({ value, label }));
}
export const MovementStatusLabels = {
  [MovementStatus.REQUESTED]: 'Solicitado',
  [MovementStatus.APPROVED]: 'Aprobado',
  [MovementStatus.REJECTED]: 'Rechazado',
  [MovementStatus.IN_PROCESS]: 'En Proceso',
  [MovementStatus.COMPLETED]: 'Completado',
  [MovementStatus.CANCELLED]: 'Cancelado',
  [MovementStatus.PARTIAL]: 'Parcial'
};
export const MovementStatusConfig = {
  [MovementStatus.REQUESTED]: {
    label: 'Solicitado',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    bgColor: 'bg-blue-500'
  },
  [MovementStatus.APPROVED]: {
    label: 'Aprobado',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    bgColor: 'bg-indigo-500'
  },
  [MovementStatus.REJECTED]: {
    label: 'Rechazado',
    color: 'bg-red-50 text-red-700 border-red-200',
    bgColor: 'bg-red-500'
  },
  [MovementStatus.IN_PROCESS]: {
    label: 'En Proceso',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    bgColor: 'bg-amber-500'
  },
  [MovementStatus.COMPLETED]: {
    label: 'Completado',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bgColor: 'bg-emerald-600'
  },
  [MovementStatus.CANCELLED]: {
    label: 'Cancelado',
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    bgColor: 'bg-gray-500'
  },
  [MovementStatus.PARTIAL]: {
    label: 'Parcial',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    bgColor: 'bg-purple-500'
  }
};
export function canTransitionTo(currentStatus, targetStatus) {
  const validTransitions = {
    [MovementStatus.REQUESTED]: [MovementStatus.APPROVED, MovementStatus.REJECTED, MovementStatus.CANCELLED],
    [MovementStatus.APPROVED]: [MovementStatus.IN_PROCESS, MovementStatus.COMPLETED, MovementStatus.CANCELLED],
    [MovementStatus.REJECTED]: [],
    [MovementStatus.IN_PROCESS]: [MovementStatus.COMPLETED, MovementStatus.CANCELLED],
    [MovementStatus.COMPLETED]: [],
    [MovementStatus.CANCELLED]: [],
    [MovementStatus.PARTIAL]: [MovementStatus.COMPLETED, MovementStatus.CANCELLED]
  };
  return validTransitions[currentStatus]?.includes(targetStatus) || false;
}
export function getAvailableActions(status) {
  const actions = {
    [MovementStatus.REQUESTED]: ['approve', 'reject', 'cancel', 'edit', 'delete'],
    [MovementStatus.APPROVED]: ['in-process', 'complete', 'cancel', 'edit'],
    [MovementStatus.REJECTED]: ['view'],
    [MovementStatus.IN_PROCESS]: ['complete', 'cancel'],
    [MovementStatus.COMPLETED]: ['view'],
    [MovementStatus.CANCELLED]: ['view'],
    [MovementStatus.PARTIAL]: ['complete', 'cancel']
  };
  return actions[status] || [];
}
export function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error('Fecha inválida:', dateString);
      return 'Fecha inválida';
    }
    return date.toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error al formatear fecha:', dateString, error);
    return 'Error en fecha';
  }
}
export function formatDateOnly(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error('Fecha inválida:', dateString);
      return 'Fecha inválida';
    }
    return date.toLocaleDateString('es-PE', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('Error al formatear fecha:', dateString, error);
    return 'Error en fecha';
  }
}
export function calculateDuration(startDate, endDate = null) {
  if (!startDate) return { days: 0, months: 0, years: 0, description: 'N/A' };
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { days: 0, months: 0, years: 0, description: 'N/A' };
  }
  const diffMs = end - start;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  // Si la duración es negativa o cero, mostrar "Menos de 1 día"
  if (diffDays < 1) {
    return { 
      days: 0, 
      months: 0, 
      years: 0, 
      description: 'Menos de 1 día' 
    };
  }
  let years = 0;
  let months = 0;
  let days = diffDays;
  if (days >= 365) {
    years = Math.floor(days / 365);
    days = days % 365;
  }
  if (days >= 30) {
    months = Math.floor(days / 30);
    days = days % 30;
  }
  const parts = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'año' : 'años'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'mes' : 'meses'}`);
  if (days > 0) parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);
  // Si no hay partes (todos son 0), mostrar "Menos de 1 día"
  const description = parts.length > 0 ? parts.join(', ') : 'Menos de 1 día';
  return { days: diffDays, months, years, description };
}
export function getMovementStartDate(movement) {
  if (movement.movementStatus === 'COMPLETED') {
    return movement.completionDate || 
           movement.completedAt || 
           movement.completedDate ||
           movement.executionDate || 
           movement.receptionDate || 
           movement.approvalDate || 
           movement.requestDate || 
           null;
  }
  return movement.requestDate || movement.createdAt || null;
}
export function getMovementEndDate(movement, nextMovement = null) {
  if (nextMovement && nextMovement.movementStatus === 'COMPLETED') {
    return nextMovement.completionDate || 
           nextMovement.completedAt || 
           nextMovement.completedDate ||
           nextMovement.executionDate || 
           nextMovement.requestDate || 
           null;
  }
  // el período sigue activo (return null para calcular hasta "ahora")
  if (movement.movementStatus === 'COMPLETED' && !nextMovement) {
    return null; 
  }
  return null;
}
