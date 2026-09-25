import { MovementType } from '../types/movementTypes';

/** Detecta ID de área en un usuario (varios nombres posibles del API). */
export function getUserAreaId(user) {
  if (!user) return null;
  if (user.areaId != null && user.areaId !== '') return user.areaId;
  if (user.area_id != null && user.area_id !== '') return user.area_id;
  if (user.area?.id != null && user.area.id !== '') return user.area.id;
  return null;
}

/** Etiqueta legible del área en un usuario. */
export function getUserAreaLabel(user) {
  if (!user) return null;
  const label =
    user.areaName ??
    user.area_name ??
    user.area?.name ??
    user.areaLabel ??
    null;
  if (label && String(label).trim()) return String(label).trim();
  const id = getUserAreaId(user);
  return id ? `Área ${String(id).slice(0, 8)}…` : null;
}

export function getUserPersonId(user) {
  if (!user) return null;
  return user.personId || user.person_id || null;
}

/** ID que se guarda en originResponsibleId / destinationResponsibleId (personId). */
export function getUserSelectId(user) {
  return getUserPersonId(user);
}

/** ID de cuenta de usuario (requestingUser / executingUser en el API). */
export function getUserAccountId(user) {
  if (!user) return null;
  return user.id || user.userId || null;
}

/**
 * Solicitante filtrado por área según SBN / acta:
 * - Devolución → área origen (quien devuelve el bien).
 * - Primera asignación, transferencia, reasignación y transferencia externa → área destino (quien recibe/solicita).
 */
export function requestingUserUsesAreaFilter(movementType) {
  return (
    movementType === MovementType.RETURN ||
    movementType === MovementType.INITIAL_ASSIGNMENT ||
    movementType === MovementType.AREA_TRANSFER ||
    movementType === MovementType.REASSIGNMENT ||
    movementType === MovementType.EXTERNAL_TRANSFER
  );
}

export function getRequestingUserFilterAreaId(movementType, originAreaId, destinationAreaId) {
  if (!requestingUserUsesAreaFilter(movementType)) return null;
  if (movementType === MovementType.RETURN) return originAreaId || null;
  return destinationAreaId || null;
}

/** Texto de ayuda bajo el combo de usuario solicitante. */
export function getRequestingUserFilterHint(movementType) {
  if (movementType === MovementType.RETURN) {
    return 'Devolución: solo usuarios del área de origen (quien devuelve el bien).';
  }
  if (movementType === MovementType.INITIAL_ASSIGNMENT) {
    return 'Primera asignación: solo usuarios del área de destino (área usuaria que recibe el bien).';
  }
  if (
    movementType === MovementType.AREA_TRANSFER ||
    movementType === MovementType.REASSIGNMENT
  ) {
    return 'Transferencia / reasignación: solo usuarios del área de destino (quien solicita recibir el bien).';
  }
  if (movementType === MovementType.EXTERNAL_TRANSFER) {
    return 'Transferencia externa: solo usuarios del área de destino seleccionada.';
  }
  return null;
}

export function getRequestingUserAreaPendingMessage(movementType) {
  if (movementType === MovementType.RETURN) return 'Seleccione primero el área de origen';
  if (requestingUserUsesAreaFilter(movementType)) return 'Seleccione primero el área de destino';
  return 'Complete el área en Origen y Destino';
}

export function isRequestingUserAllowed(
  userId,
  users = [],
  movementType,
  originAreaId,
  destinationAreaId
) {
  if (!userId) return false;
  if (!requestingUserUsesAreaFilter(movementType)) return true;
  const allowed = getRequestingUsersForArea(users, movementType, originAreaId, destinationAreaId);
  return allowed.some((u) => String(getUserAccountId(u)) === String(userId));
}

/** Usuarios solicitantes filtrados por área según tipo de movimiento. */
export function getRequestingUsersForArea(users = [], movementType, originAreaId, destinationAreaId) {
  const base = getUsersWithPerson(users);
  if (!requestingUserUsesAreaFilter(movementType)) return base;
  const areaId = getRequestingUserFilterAreaId(movementType, originAreaId, destinationAreaId);
  if (!areaId) return [];
  return base.filter((u) => userBelongsToArea(u, areaId));
}

/** Usuarios con persona vinculada, aptos para solicitante o ejecutor. */
export function getUsersWithPerson(users = []) {
  const seen = new Set();
  return users.filter((u) => {
    const accountId = getUserAccountId(u);
    const personId = getUserPersonId(u);
    if (!accountId || !personId || seen.has(accountId)) return false;
    seen.add(accountId);
    return true;
  });
}

export function getUserDisplayName(user) {
  if (!user) return 'Sin nombre';
  if (user.username) return user.username;
  const parts = [user.firstName || user.first_name, user.lastName || user.last_name].filter(Boolean);
  if (parts.length) return parts.join(' ');
  return user.email || user.id || 'Usuario';
}

export function buildPersonsById(persons = []) {
  const map = {};
  (persons || []).forEach((person) => {
    if (!person) return;
    const id = person.id || person.personId;
    if (!id) return;
    map[id] = person;
    map[String(id)] = person;
  });
  return map;
}

export function buildPositionsById(positions = []) {
  const map = {};
  (positions || []).forEach((position) => {
    if (!position?.id) return;
    map[position.id] = position;
    map[String(position.id)] = position;
  });
  return map;
}

/** Nombre completo de persona (mismo criterio que gestión de usuarios / reportes). */
export function getPersonFullName(person) {
  if (!person) return null;
  if (person.fullName?.trim()) return person.fullName.trim();
  if (person.nombreCompleto?.trim()) return person.nombreCompleto.trim();
  const firstName = person.firstName || person.nombres || '';
  const middleName = person.middleName || person.apellidoMaterno || '';
  const lastName = person.lastName || person.apellidos || person.apellidoPaterno || '';
  const full = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();
  return full || null;
}

export function getUserPositionLabel(user, positionsById = {}) {
  if (!user) return null;
  const embedded =
    user.positionName ??
    user.position_name ??
    user.position?.name ??
    user.cargo ??
    null;
  if (embedded && String(embedded).trim()) return String(embedded).trim();
  const positionId = user.positionId || user.position_id;
  if (!positionId) return null;
  const position = positionsById[positionId] || positionsById[String(positionId)];
  return position?.name || position?.nombre || position?.positionName || null;
}

export function usersHaveAreaField(users = []) {
  return users.some((u) => getUserAreaId(u) != null || getUserAreaLabel(u));
}

/** Coincidencia estricta: usuario pertenece al área seleccionada del formulario. */
export function userBelongsToArea(user, selectedAreaId) {
  if (!selectedAreaId) return false;
  const userAreaId = getUserAreaId(user);
  if (userAreaId == null || userAreaId === '') return false;
  return String(userAreaId).trim() === String(selectedAreaId).trim();
}

export function filterUsersByArea(users = [], selectedAreaId) {
  if (!selectedAreaId) return [];
  return users.filter((u) => userBelongsToArea(u, selectedAreaId));
}

/** Usuarios con personId, sin duplicados, filtrados por área. */
export function getAssignableUsersForArea(users = [], selectedAreaId) {
  const withPerson = users.filter((u) => getUserPersonId(u));
  const filtered = filterUsersByArea(withPerson, selectedAreaId);
  const seen = new Set();
  return filtered.filter((u) => {
    const id = getUserSelectId(u);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/** Nombre para mostrar de un usuario (persona vinculada o username). */
export function resolveUserDisplayName(userId, usersById = {}, personsById = {}) {
  if (!userId) return null;
  const user = usersById[userId] || usersById[String(userId)];
  if (user) {
    const personId = getUserPersonId(user);
    const person = personId ? personsById[personId] || personsById[String(personId)] : null;
    return getPersonFullName(person) || user.username || String(userId);
  }
  const person = personsById[userId] || personsById[String(userId)];
  if (person) return getPersonFullName(person) || String(userId);
  return null;
}

/** Nombre para responsables (personId; fallback a usuario). */
export function resolveResponsibleDisplayName(personId, usersById = {}, personsById = {}) {
  if (!personId) return null;
  const person = personsById[personId] || personsById[String(personId)];
  if (person) return getPersonFullName(person) || String(personId);
  return resolveUserDisplayName(personId, usersById, personsById);
}

export function buildUsersByAccountId(users = []) {
  const map = {};
  (users || []).forEach((user) => {
    const id = getUserAccountId(user);
    if (!id) return;
    map[id] = user;
    map[String(id)] = user;
  });
  return map;
}

/** Etiqueta del combo: "Nombre completo - Cargo". */
export function buildUserOptionLabel(user, personsById = {}, positionsById = {}) {
  const personId = getUserPersonId(user);
  const person = personId ? personsById[personId] || personsById[String(personId)] : null;
  const fullName = getPersonFullName(person) || getUserDisplayName(user);
  const position = getUserPositionLabel(user, positionsById);
  return position ? `${fullName} - ${position}` : fullName;
}
