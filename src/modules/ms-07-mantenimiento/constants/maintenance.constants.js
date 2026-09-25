export const MaintenanceType = {
  PREVENTIVE: 'PREVENTIVE',
  CORRECTIVE: 'CORRECTIVE',
  PREDICTIVE: 'PREDICTIVE',
  EMERGENCY: 'EMERGENCY',
};

export const TYPE_LABELS = {
  PREVENTIVE: 'Preventivo',
  CORRECTIVE: 'Correctivo',
  PREDICTIVE: 'Predictivo',
  EMERGENCY: 'Emergencia',
};

export const TYPE_COLORS = {
  PREVENTIVE: { bg: '#EEF2FF', text: '#4338CA' },
  CORRECTIVE: { bg: '#EFF6FF', text: '#1D4ED8' },
  PREDICTIVE: { bg: '#F0FDF4', text: '#15803D' },
  EMERGENCY: { bg: '#FEF2F2', text: '#B91C1C' },
};

export const Priority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export const PRIORITY_LABELS = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

export const PRIORITY_COLORS = {
  LOW: { bg: '#F1F5F9', text: '#475569' },
  MEDIUM: { bg: '#E0F2FE', text: '#0369A1' },
  HIGH: { bg: '#DBEAFE', text: '#1E40AF' },
  CRITICAL: { bg: '#FEE2E2', text: '#991B1B' },
};

export const MaintenanceStatus = {
  SCHEDULED: 'SCHEDULED',
  IN_PROCESS: 'IN_PROCESS',
  PENDING_CONFORMITY: 'PENDING_CONFORMITY',
  CONFIRMED: 'CONFIRMED',
  SUSPENDED: 'SUSPENDED',
  CANCELLED: 'CANCELLED',
};

export const STATUS_LABELS = {
  SCHEDULED: 'Programado',
  IN_PROCESS: 'En Proceso',
  PENDING_CONFORMITY: 'Pend. Conformidad',
  CONFIRMED: 'Confirmado',
  SUSPENDED: 'Suspendido',
  CANCELLED: 'Cancelado',
};

export const STATUS_COLORS = {
  SCHEDULED: { bg: '#F8FAFC', text: '#64748B', dot: '#94A3B8' },
  IN_PROCESS: { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  PENDING_CONFORMITY: { bg: '#F0FDFA', text: '#0F766E', dot: '#14B8A6' },
  CONFIRMED: { bg: '#EEF2FF', text: '#4338CA', dot: '#6366F1' },
  SUSPENDED: { bg: '#DBEAFE', text: '#1E40AF', dot: '#2563EB' },
  CANCELLED: { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444' },
};

export const STATUS_TRANSITIONS = {
  SCHEDULED: [
    { action: 'start', label: 'Iniciar', color: '#3B82F6' },
    { action: 'suspend', label: 'Suspender', color: '#2563EB' },
    { action: 'reschedule', label: 'Reprogramar', color: '#6366F1' },
    { action: 'cancel', label: 'Cancelar', color: '#EF4444' },
  ],
  IN_PROCESS: [
    { action: 'complete', label: 'Completar', color: '#10B981' },
    { action: 'suspend', label: 'Suspender', color: '#2563EB' },
    { action: 'cancel', label: 'Cancelar', color: '#EF4444' },
  ],
  PENDING_CONFORMITY: [
    { action: 'confirm', label: 'Conformidad', color: '#14B8A6' },
  ],
  SUSPENDED: [
    { action: 'reschedule', label: 'Reanudar', color: '#6366F1' },
    { action: 'cancel', label: 'Cancelar', color: '#EF4444' },
  ],
};

export const WORK_QUALITY_LABELS = {
  EXCELLENT: 'Excelente',
  GOOD: 'Bueno',
  ACCEPTABLE: 'Aceptable',
  DEFICIENT: 'Deficiente',
};

export const ASSET_CONDITION_LABELS = {
  OPTIMAL: 'Óptimo / Como nuevo',
  OPERATIONAL: 'Operativo',
  PARTIAL: 'Operatividad parcial',
  REQUIRES_FOLLOWUP: 'Requiere seguimiento',
  NON_OPERATIONAL: 'No operativo',
};

export const PART_TYPE = {
  SPARE_PART: 'SPARE_PART',
  CONSUMABLE: 'CONSUMABLE',
  TOOL: 'TOOL',
  SERVICE: 'SERVICE',
  OTHER: 'OTHER',
};

export const PART_TYPE_LABELS = {
  SPARE_PART: 'Repuesto',
  CONSUMABLE: 'Consumible',
  TOOL: 'Herramienta',
  SERVICE: 'Servicio',
  OTHER: 'Otro',
};

export const UNIT_OF_MEASURE = {
  UND: 'UND',
  KG: 'KG',
  L: 'L',
  M: 'M',
  M2: 'M2',
  PIECE: 'PIECE',
};

export const UNIT_OF_MEASURE_LABELS = {
  UND: 'Unidad',
  KG: 'Kilogramo',
  L: 'Litro',
  M: 'Metro',
  M2: 'Metro Cuadrado',
  PIECE: 'Pieza',
};

