import { MovementType } from '../types/movementTypes';
import {
  resolveAssetAssignmentContext,
  isMovementTypeAllowed,
  validateAssetStatusForContext,
  validateAssetGroupCompatibility,
  validateEachAssetForMovementType,
  validateAssetItemQuantities,
  getRequiredFieldsForMovementType,
  getFieldLabel,
} from './movementAssetContext';
import {
  getRequestingUserFilterHint,
  isRequestingUserAllowed,
  requestingUserUsesAreaFilter,
} from './movementUserAreaUtils';

export const SUPPORTING_DOCUMENT_TYPE_DEFAULT = 'Solicitud Interna';
export const SUPPORTING_DOC_NUMBER_REGEX = /^SI-\d{4}-\d{4}$/i;
const LOCAL_DOC_SEQ_KEY = 'sipreb_supporting_doc_seq_';

export function buildSupportingDocumentNumber(year, sequence) {
  const y = year || new Date().getFullYear();
  const seq = String(Math.max(1, sequence)).padStart(4, '0');
  return `SI-${y}-${seq}`;
}

function collectUsedSequences(movements = [], year = new Date().getFullYear()) {
  const pattern = new RegExp(`^SI-${year}-(\\d{4})$`, 'i');
  const used = new Set();
  (movements || []).forEach((m) => {
    const match = (m.supportingDocumentNumber || '').trim().match(pattern);
    if (match) used.add(parseInt(match[1], 10));
  });
  return used;
}

/** Primer correlativo libre: 1, 2, (3 eliminado) → sugiere 3. Sin registros activos → 1. */
export function findNextAvailableSequence(movements = [], year = new Date().getFullYear()) {
  const used = collectUsedSequences(movements, year);
  let seq = 1;
  while (used.has(seq)) seq += 1;
  return seq;
}

export function parseMaxSupportingDocumentSequence(movements = [], year = new Date().getFullYear()) {
  const used = collectUsedSequences(movements, year);
  if (used.size === 0) return 0;
  return Math.max(...used);
}

/**
 * Calcula el siguiente SI-YYYY-XXXX.
 * - Usa movimientos activos del servidor (los eliminados no cuentan → se pueden reutilizar huecos).
 * - Busca el primer número libre (no solo el máximo + 1).
 * - sessionStorage solo si falló la carga del listado.
 */
export function generateNextSupportingDocumentNumber(movements = [], options = {}) {
  const year = options.year || new Date().getFullYear();
  const excludeMovementId = options.excludeMovementId || null;
  const serverListLoaded = options.serverListLoaded !== false;
  const filtered = excludeMovementId
    ? (movements || []).filter((m) => m.id !== excludeMovementId)
    : movements || [];

  if (serverListLoaded) {
    const nextSeq = findNextAvailableSequence(filtered, year);
    return {
      number: buildSupportingDocumentNumber(year, nextSeq),
      source: filtered.length > 0 ? 'server' : 'new',
    };
  }

  let maxSeq = 0;
  try {
    maxSeq = parseInt(sessionStorage.getItem(`${LOCAL_DOC_SEQ_KEY}${year}`) || '0', 10);
  } catch {
    /* sessionStorage no disponible */
  }

  return {
    number: buildSupportingDocumentNumber(year, maxSeq + 1),
    source: maxSeq > 0 ? 'local' : 'new',
  };
}

export function rememberSupportingDocumentNumber(docNumber) {
  const match = (docNumber || '').trim().match(/^SI-(\d{4})-(\d{4})$/i);
  if (!match) return;
  try {
    const year = match[1];
    const seq = parseInt(match[2], 10);
    const key = `${LOCAL_DOC_SEQ_KEY}${year}`;
    const prev = parseInt(sessionStorage.getItem(key) || '0', 10);
    if (seq > prev) sessionStorage.setItem(key, String(seq));
  } catch {
    /* ignorar */
  }
}

/** Códigos de documento soporte (ej. SI-2026-0001). */
const SUPPORTING_DOC_IN_TEXT = /(?:SI)-\d{4}-\d{3,4}/gi;

function endsWithAssetOrDocReference(text) {
  const v = text.trim();
  return (
    /(?:BP|SI)-\d{4}-\d{3,4}$/i.test(v) ||
    /\d{4,}-\d{1,6}$/.test(v) ||
    /[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+$/.test(v) ||
    /\s(19|20)\d{2}$/.test(v)
  );
}

/** Caracteres permitidos en textos descriptivos institucionales. */
const DESCRIPTIVE_TEXT_CHARS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,;:!?¿¡()\-'"\/]+$/;

function validateDescriptiveText(value, { required = false, minLength = 0, maxLength, fieldLabel, allowAssetCodes = false }) {
  if (value == null || value === '') {
    return required ? `El campo ${fieldLabel} es obligatorio.` : null;
  }

  if (/^\s/.test(value)) {
    return `El campo ${fieldLabel} no puede iniciar con espacios.`;
  }
  if (/\s$/.test(value)) {
    return `El campo ${fieldLabel} no puede terminar con espacios.`;
  }
  if (!value.trim()) {
    return `El campo ${fieldLabel} no puede contener solo espacios.`;
  }
  if (/\s{2,}/.test(value)) {
    return `El campo ${fieldLabel} no puede tener espacios dobles o múltiples seguidos.`;
  }
  if (!DESCRIPTIVE_TEXT_CHARS.test(value.trim())) {
    return `El campo ${fieldLabel} solo admite letras, números en contexto (códigos), espacios y signos de puntuación comunes.`;
  }

  const v = value.trim();

  if (minLength > 0 && v.length < minLength) {
    return `El campo ${fieldLabel} debe tener al menos ${minLength} caracteres.`;
  }
  if (maxLength && v.length > maxLength) {
    return `El campo ${fieldLabel} no puede exceder ${maxLength} caracteres.`;
  }

  const letterErr = letterMsg(v, `El campo ${fieldLabel}`);
  if (letterErr) return letterErr;

  if (/[.,;:]\d+$/i.test(v)) {
    return `El campo ${fieldLabel} no puede terminar con números sueltos después de un punto o signo de puntuación.`;
  }

  if (/\s\d+$/i.test(v) && !endsWithAssetOrDocReference(v)) {
    return `El campo ${fieldLabel} no puede terminar con números sueltos. Si menciona un código de bien, inclúyalo completo (ej. BP-2026-002 o 51111001-001).`;
  }

  if (!allowAssetCodes) {
    const withoutCodes = v.replace(SUPPORTING_DOC_IN_TEXT, ' ').replace(/(?:BP)-\d{4}-\d{3,4}/gi, ' ');
    if (/\d{3,}/.test(withoutCodes.replace(/\s(19|20)\d{2}\b/g, ' '))) {
      return `El campo ${fieldLabel} no puede incluir secuencias numéricas sueltas. Indique códigos con formato BP-2026-002 si corresponde.`;
    }
  }

  if (minLength >= 10) {
    const words = v.split(/\s+/).filter((w) => /[a-zA-ZáéíóúÁÉÍÓÚñÑ]{2,}/.test(w));
    if (words.length < 3) {
      return `El campo ${fieldLabel} debe describir el motivo con al menos tres palabras.`;
    }
  }

  return null;
}

export const FIRST_ASSIGNMENT_ALLOWED_TYPES = [MovementType.INITIAL_ASSIGNMENT];
export const TRANSFER_ALLOWED_TYPES = [MovementType.REASSIGNMENT, MovementType.AREA_TRANSFER];

export function getAllowedMovementTypes(isFirstAssignment) {
  return isFirstAssignment ? FIRST_ASSIGNMENT_ALLOWED_TYPES : TRANSFER_ALLOWED_TYPES;
}

export function isMovementTypeAllowedForAsset(movementType, isFirstAssignment) {
  if (!movementType) return true;
  return getAllowedMovementTypes(isFirstAssignment).includes(movementType);
}

const hasLetters = (s) => /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(s);
const onlyNums = (s) => /^[\d\s]+$/.test(s);
const onlySpecial = (s) => /^[^a-zA-ZáéíóúÁÉÍÓÚñÑ\d\s]+$/.test(s);

const letterMsg = (v, field) => {
  if (!hasLetters(v)) {
    if (onlyNums(v)) return `${field} no puede contener solo números`;
    if (onlySpecial(v)) return `${field} no puede contener solo caracteres especiales`;
    return `${field} debe contener al menos una letra`;
  }
  return null;
};

export function validateMovementSubtype(value) {
  if (!value) return null;
  if (/^\s/.test(value)) return 'No puede iniciar con espacios.';
  if (/\d/.test(value)) return 'No se permiten números en el subtipo de movimiento.';
  if (/[^a-zA-ZáéíóúÁÉÍÓÚñÑ_\s]/.test(value)) {
    return 'No se permiten caracteres especiales. Use solo letras, espacios y guión bajo.';
  }
  const v = value.trim();
  if (v.length > 50) return 'El subtipo no puede exceder 50 caracteres';
  return null;
}

export function validateAreasMatch(originAreaId, destinationAreaId) {
  if (!originAreaId || !destinationAreaId) return null;
  if (String(originAreaId) === String(destinationAreaId)) {
    return 'El área de origen y el área de destino no pueden ser iguales en el mismo movimiento.';
  }
  return null;
}

export function validateResponsiblesMatch(originResponsibleId, destinationResponsibleId) {
  if (!originResponsibleId || !destinationResponsibleId) return null;
  if (String(originResponsibleId) === String(destinationResponsibleId)) {
    return 'El responsable de origen y el responsable de destino no pueden ser la misma persona.';
  }
  return null;
}

export function getSuggestedMovementType({ asset, isFirstAssignment }) {
  if (asset && isFirstAssignment !== undefined) {
    return resolveAssetAssignmentContext(asset, isFirstAssignment ? [] : [{ movementStatus: 'COMPLETED' }])
      .suggestedMovementType;
  }
  return MovementType.INITIAL_ASSIGNMENT;
}

export function validateMovementTypeForAsset(movementType, { assignmentContext, isFirstAssignment, asset, isEditing }) {
  if (!movementType || isEditing) return null;
  const ctx =
    assignmentContext ||
    (asset ? resolveAssetAssignmentContext(asset, []) : null);
  if (!ctx) return null;

  if (!isMovementTypeAllowed(movementType, ctx)) {
    return ctx.isFirstAssignment
      ? 'Este bien corresponde a Primera Asignación. Cambie el tipo de movimiento.'
      : 'Tipo no permitido para este bien. Use Reasignación, Transferencia entre Áreas o Devolución (si está en uso).';
  }
  return null;
}

export function getAssetMovementStatusLabel(isFirstAssignment) {
  const ctx = resolveAssetAssignmentContext(
    { assetStatus: isFirstAssignment ? 'AVAILABLE' : 'IN_USE' },
    isFirstAssignment ? [] : [{ movementStatus: 'COMPLETED' }]
  );
  return ctx.statusInfo;
}

export function validateSupportingDocumentNumber(value, { required = true } = {}) {
  const v = (value || '').trim();
  if (!v) {
    return required ? 'El número de documento de soporte es obligatorio.' : null;
  }
  if (!SUPPORTING_DOC_NUMBER_REGEX.test(v)) {
    return 'Formato obligatorio: SI-YYYY-XXXX (ejemplo: SI-2026-0001).';
  }
  return null;
}

export function validateSupportingDocumentType(value) {
  const v = value ? value.trim() : '';
  if (!v) return 'El tipo de documento de soporte es obligatorio.';
  if (/\s{2,}/.test(value)) return 'No puede tener espacios múltiples consecutivos';
  if (v.length > 50) return 'Máximo 50 caracteres';
  return letterMsg(v, 'El tipo de documento');
}

const TEXT_FIELD_LABELS = {
  reason: 'motivo',
  observations: 'observaciones',
  specialConditions: 'condiciones especiales',
};

export function validateField(name, value) {
  const v = value ? value.trim() : '';
  if (!v && !['observations', 'specialConditions', 'movementSubtype', 'reason'].includes(name)) {
    return null;
  }

  switch (name) {
    case 'movementSubtype':
      return validateMovementSubtype(value);
    case 'supportingDocumentNumber':
      return validateSupportingDocumentNumber(value, { required: false });
    case 'supportingDocumentType':
      return v ? validateSupportingDocumentType(value) : null;
    case 'reason':
      return validateDescriptiveText(value, {
        required: false,
        minLength: 10,
        maxLength: 500,
        fieldLabel: 'motivo',
        allowAssetCodes: true,
      });
    case 'observations':
      return validateDescriptiveText(value, {
        required: false,
        minLength: 0,
        maxLength: 1000,
        fieldLabel: 'observaciones',
      });
    case 'specialConditions':
      return validateDescriptiveText(value, {
        required: false,
        minLength: 0,
        maxLength: 500,
        fieldLabel: 'condiciones especiales',
      });
    default:
      return null;
  }
}

export function validateCrossFields(formData, context = {}) {
  const errors = {};
  const areaErr = validateAreasMatch(formData.originAreaId, formData.destinationAreaId);
  if (areaErr) errors.originAreaId = areaErr;

  const respErr = validateResponsiblesMatch(
    formData.originResponsibleId,
    formData.destinationResponsibleId
  );
  if (respErr) errors.destinationResponsibleId = respErr;

  const typeErr = validateMovementTypeForAsset(formData.movementType, context);
  if (typeErr) errors.movementType = typeErr;

  return errors;
}

export function validateForm(formData, context = {}) {
  const errors = {};
  const { asset, assignmentContext, assetContextEntries = [], isEditing } = context;

  const assetIds = Array.isArray(formData.assetIds) && formData.assetIds.length > 0
    ? formData.assetIds
    : (formData.assetId?.trim() ? [formData.assetId] : []);

  if (assetIds.length === 0) {
    errors.assetId = 'Debe seleccionar al menos un bien patrimonial.';
  } else if (!isEditing && assetContextEntries.length > 0) {
    const contexts = assetContextEntries.map((entry) => entry.context).filter(Boolean);
    const groupCheck = validateAssetGroupCompatibility(contexts);
    if (!groupCheck.valid) {
      errors.assetId = groupCheck.message;
    } else if (formData.movementType?.trim()) {
      const perAssetErrors = validateEachAssetForMovementType(assetContextEntries, formData.movementType);
      const quantityErrors = validateAssetItemQuantities(
        assetContextEntries,
        formData.movementType,
        formData.assetItems?.length
          ? formData.assetItems
          : assetIds.map((id) => ({ assetId: id, quantity: 1 }))
      );
      const allErrors = [...perAssetErrors, ...quantityErrors];
      if (allErrors.length > 0) {
        const movementTypeErrors = allErrors.filter(
          (msg) => msg.includes('corresponde a Primera Asignación') || msg.includes('no admite el tipo')
        );
        if (movementTypeErrors.length > 0) {
          errors.movementType = movementTypeErrors[0];
        } else {
          errors.assetId = allErrors[0];
        }
      }
    }
  } else if (!isEditing && formData.movementType?.trim() && asset && assignmentContext) {
    const statusCheck = validateAssetStatusForContext(asset, formData.movementType, assignmentContext);
    if (!statusCheck.valid) errors.assetId = statusCheck.message;
  }

  if (!formData.movementType?.trim()) {
    errors.movementType = 'Debe seleccionar el tipo de movimiento.';
  } else if (assignmentContext && !isEditing && !errors.movementType) {
    if (!isMovementTypeAllowed(formData.movementType, assignmentContext)) {
      errors.movementType = assignmentContext.isFirstAssignment
        ? 'Este bien corresponde a Primera Asignación. Seleccione ese tipo de movimiento.'
        : 'Tipo no permitido para este bien. Use Reasignación, Transferencia entre Áreas o Devolución (si está en uso).';
    }
  }

  if (!formData.requestingUser?.trim()) {
    errors.requestingUser = 'Debe seleccionar la persona solicitante.';
  } else if (
    context.users?.length &&
    requestingUserUsesAreaFilter(formData.movementType) &&
    !isRequestingUserAllowed(
      formData.requestingUser,
      context.users,
      formData.movementType,
      formData.originAreaId,
      formData.destinationAreaId
    )
  ) {
    errors.requestingUser =
      getRequestingUserFilterHint(formData.movementType) ||
      'El solicitante debe pertenecer al área indicada para este tipo de movimiento.';
  }

  const reasonErr = validateField('reason', formData.reason || '');
  if (!formData.reason?.trim()) {
    errors.reason = 'El motivo del movimiento es obligatorio.';
  } else if (reasonErr) {
    errors.reason = reasonErr;
  }

  const docNumErr = validateSupportingDocumentNumber(formData.supportingDocumentNumber, { required: true });
  if (docNumErr) errors.supportingDocumentNumber = docNumErr;

  const docTypeErr = validateSupportingDocumentType(formData.supportingDocumentType || '');
  if (docTypeErr) errors.supportingDocumentType = docTypeErr;

  ['observations', 'specialConditions', 'movementSubtype'].forEach((f) => {
    const err = validateField(f, formData[f] || '');
    if (err) errors[f] = err;
  });

  if (formData.movementType) {
    const { required } = getRequiredFieldsForMovementType(formData.movementType);
    required.forEach((field) => {
      if (['assetId', 'movementType', 'reason', 'requestingUser', 'supportingDocumentNumber', 'supportingDocumentType'].includes(field)) {
        return;
      }
      if (!formData[field]?.toString().trim()) {
        const key =
          field === 'originResponsibleId'
            ? 'originResponsibleId'
            : field === 'destinationResponsibleId'
              ? 'destinationResponsibleId'
              : field;
        errors[key] = `Debe completar el campo: ${getFieldLabel(field)}.`;
      }
    });
  }

  Object.assign(errors, validateCrossFields(formData, context));

  return errors;
}

export function isSupportingDocumentNumberDuplicate(docNumber, movements, currentMovementId = null) {
  const normalized = (docNumber || '').trim().toUpperCase();
  if (!normalized) return false;
  return (movements || []).some((m) => {
    if (currentMovementId && m.id === currentMovementId) return false;
    const existing = (m.supportingDocumentNumber || '').trim().toUpperCase();
    return existing === normalized;
  });
}

export { resolveAssetAssignmentContext, isMovementTypeAllowed, validateAssetStatusForContext };
