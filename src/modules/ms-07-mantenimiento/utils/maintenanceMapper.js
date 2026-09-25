const FIELD_LABELS = {
  assetId: 'Activo / Bien',
  maintenanceType: 'Tipo de mantenimiento',
  priority: 'Prioridad',
  scheduledDate: 'Fecha programada',
  workDescription: 'Descripción detallada',
  reportedProblem: 'Problema reportado',
  technicalResponsibleId: 'Responsable técnico',
  serviceSupplierId: 'Proveedor externo',
  supervisorId: 'Supervisor',
  serviceReference: 'Orden de servicio',
  executionDays: 'Días fuera de servicio',
  municipalityId: 'Municipalidad',
  warrantyExpirationDate: 'Garantía del activo',
  hasWarranty: 'Garantía del activo',
  laborCost: 'Mano de obra',
  additionalCost: 'Costos adicionales',
};

/**
 * Convierte validationErrors del API a texto legible para el usuario.
 */
export function formatApiValidationErrors(validationErrors) {
  if (!validationErrors) return '';

  const labelFor = (field) => FIELD_LABELS[field] || field;

  if (typeof validationErrors === 'string') return validationErrors;

  if (Array.isArray(validationErrors)) {
    return validationErrors
      .map((entry) => {
        if (typeof entry === 'string') return entry;
        const field = entry.field || entry.property || entry.name || '';
        const msg = entry.message || entry.defaultMessage || entry.error || '';
        return field ? `${labelFor(field)}: ${msg}` : msg;
      })
      .filter(Boolean)
      .join('\n');
  }

  if (typeof validationErrors === 'object') {
    return Object.entries(validationErrors)
      .map(([field, msg]) => {
        const text = Array.isArray(msg) ? msg.join(', ') : String(msg);
        return `${labelFor(field)}: ${text}`;
      })
      .join('\n');
  }

  return String(validationErrors);
}

/**
 * Toma el primer valor definido entre varias claves posibles del API.
 */
function pickField(record, ...keys) {
  for (const key of keys) {
    const value = record?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

/**
 * Extrae un registro de mantenimiento de distintas formas de respuesta del API.
 */
export function extractMaintenanceRecord(data) {
  if (!data || typeof data !== 'object') return data;
  if (data.id && (data.maintenanceCode || data.assetId || data.maintenanceStatus)) return data;
  const nested = data.data || data.content || data.maintenance || data.result;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) return nested;
  return data;
}

/**
 * Combina listado + detalle sin perder campos que solo vienen en uno de los dos.
 */
export function mergeMaintenanceRecords(base, detail) {
  const a = normalizeMaintenance(extractMaintenanceRecord(base) || {});
  const b = normalizeMaintenance(extractMaintenanceRecord(detail) || {});

  const merged = { ...a };
  for (const key of Object.keys(b)) {
    if (b[key] !== undefined && b[key] !== null && b[key] !== '') {
      merged[key] = b[key];
    }
  }

  return normalizeMaintenance(merged);
}

/**
 * Normaliza nombres de campos que pueden variar entre listado y detalle del API.
 */
export function normalizeMaintenance(record) {
  const source = extractMaintenanceRecord(record);
  if (!source || typeof source !== 'object') return source;

  const serviceReference =
    pickField(
      source,
      'serviceReference',
      'service_reference',
      'serviceOrderReference',
      'service_order_reference',
      'serviceOrder',
      'service_order',
      'ordenServicio',
      'orden_servicio',
      'workOrder',
      'work_order',
      'orderService',
      'order_service'
    ) || '';

  const workOrder =
    pickField(source, 'workOrder', 'work_order', 'serviceReference', 'service_reference') ||
    serviceReference ||
    '';

  const rawDays = pickField(
    source,
    'executionDays',
    'execution_days',
    'daysOutOfService',
    'days_out_of_service',
    'outOfServiceDays',
    'out_of_service_days',
    'diasFueraServicio',
    'dias_fuera_servicio',
    'serviceDays',
    'service_days'
  );

  const parsedDays =
    rawDays !== undefined && rawDays !== null && rawDays !== ''
      ? parseInt(rawDays, 10)
      : undefined;

  const workDescription = pickField(source, 'workDescription', 'work_description', 'descripcionTrabajo', 'descripcion_trabajo', 'description');
  const reportedProblem = pickField(source, 'reportedProblem', 'reported_problem', 'problemaReportado', 'problema_reportado');
  const observations = pickField(source, 'observaciones', 'observations');
  const appliedSolution = pickField(source, 'appliedSolution', 'applied_solution', 'solucionAplicada', 'solucion_aplicada', 'solution');
  const laborCost = pickField(source, 'laborCost', 'labor_cost', 'costoManoObra', 'costo_mano_obra', 'manoObra', 'mano_obra');
  const additionalCost = pickField(source, 'additionalCost', 'additional_cost', 'costoAdicional', 'costo_adicional', 'costosAdicionales', 'costos_adicionales');

  return {
    ...source,
    serviceReference,
    workOrder,
    ...(workDescription != null ? { workDescription } : {}),
    ...(reportedProblem != null ? { reportedProblem } : {}),
    ...(observations != null ? { observations } : {}),
    ...(appliedSolution != null ? { appliedSolution } : {}),
    ...(parsedDays !== undefined && !Number.isNaN(parsedDays)
      ? { executionDays: parsedDays }
      : {}),
    ...(laborCost != null ? { laborCost } : {}),
    ...(additionalCost != null ? { additionalCost } : {}),
  };
}

export function extractMaintenancesList(data) {
  let items = [];
  if (Array.isArray(data)) items = data;
  else if (Array.isArray(data?.content)) items = data.content;
  else if (Array.isArray(data?.data)) items = data.data;
  return items.map(normalizeMaintenance);
}

/** Campos permitidos al crear/actualizar mantenimiento (evita 500 por propiedades extra). */
const WRITABLE_FIELDS = new Set([
  'assetId',
  'assetCode',
  'assetDescription',
  'maintenanceType',
  'priority',
  'scheduledDate',
  'workDescription',
  'reportedProblem',
  'observations',
  'technicalResponsibleId',
  'serviceSupplierId',
  'supervisorId',
  'laborCost',
  'additionalCost',
  'hasWarranty',
  'warrantyExpirationDate',
  'serviceReference',
  'executionDays',
  'requestedBy',
  'municipalityId',
]);

/**
 * Arma el body para POST/PUT del API de mantenimientos.
 * - workOrder NO se envía al crear (se registra al completar el trabajo).
 * - municipalityId es obligatorio para el contexto municipal.
 */
export function buildMaintenanceWritePayload(formData, { municipalityId, isCreate = false } = {}) {
  const normalized = normalizeMaintenance({ ...formData });

  const payload = {};
  for (const key of WRITABLE_FIELDS) {
    if (normalized[key] !== undefined && normalized[key] !== null && normalized[key] !== '') {
      payload[key] = normalized[key];
    }
  }

  if (isCreate) {
    delete payload.workOrder;
  }

  const hasWarranty = Boolean(
    normalized.hasWarranty ||
    (normalized.warrantyExpirationDate &&
      String(normalized.warrantyExpirationDate).length >= 10)
  );
  payload.hasWarranty = hasWarranty;

  if (hasWarranty && normalized.warrantyExpirationDate) {
    payload.warrantyExpirationDate = normalized.warrantyExpirationDate;
  } else {
    delete payload.warrantyExpirationDate;
  }

  if (payload.executionDays !== undefined) {
    payload.executionDays = parseInt(payload.executionDays, 10);
    if (Number.isNaN(payload.executionDays)) delete payload.executionDays;
  }

  if (payload.laborCost !== undefined && payload.laborCost !== "") payload.laborCost = parseFloat(payload.laborCost);
  if (payload.additionalCost !== undefined && payload.additionalCost !== "") payload.additionalCost = parseFloat(payload.additionalCost);
  if (Number.isNaN(payload.laborCost)) delete payload.laborCost;
  if (Number.isNaN(payload.additionalCost)) delete payload.additionalCost;

  if (municipalityId) payload.municipalityId = municipalityId;

  return payload;
}

export function computeFinancialSummary(maintenance, parts = []) {
  const partsTotal = parts.reduce(
    (sum, p) =>
      sum + (p.quantity || 0) * (parseFloat(p.unitPrice ?? p.unitCost ?? 0) || 0),
    0
  );
  const laborCost = parseFloat(maintenance?.laborCost || 0) || 0;
  const additionalCost = parseFloat(maintenance?.additionalCost || 0) || 0;
  const liveTotal = laborCost + additionalCost + partsTotal;
  const apiTotal = parseFloat(maintenance?.totalCost || 0) || 0;
  const hasLiveInputs = parts.length > 0 || laborCost > 0 || additionalCost > 0;

  return {
    partsTotal,
    laborCost,
    additionalCost,
    total: hasLiveInputs ? liveTotal : (apiTotal || liveTotal),
  };
}
