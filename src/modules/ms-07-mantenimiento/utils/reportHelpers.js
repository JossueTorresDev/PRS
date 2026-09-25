export { TYPE_LABELS, WORK_QUALITY_LABELS, ASSET_CONDITION_LABELS, STATUS_LABELS } from '../constants/maintenance.constants';

export const TYPE_COLORS = {
  ELECTRICAL: { bg: '#e0f2fe', text: '#0284c7' },
  MECHANICAL: { bg: '#fef3c7', text: '#d97706' },
  PLUMBING: { bg: '#d1fae5', text: '#059669' },
  STRUCTURAL: { bg: '#fce7f3', text: '#db2777' },
  EMERGENCY: { bg: '#fee2e2', text: '#dc2626' },
  PREVENTIVE: { bg: '#e0e7ff', text: '#4338ca' },
  CORRECTIVE: { bg: '#f3e8ff', text: '#7c3aed' },
  OTHER: { bg: '#f1f5f9', text: '#475569' },
};

export const STATUS_COLORS_REPORT = {
  SCHEDULED: { bg: '#dbeafe', text: '#1d4ed8' },
  IN_PROCESS: { bg: '#fef9c3', text: '#a16207' },
  PENDING_CONFORMITY: { bg: '#fef08a', text: '#854d0e' },
  CONFIRMED: { bg: '#bbf7d0', text: '#15803d' },
  SUSPENDED: { bg: '#fed7aa', text: '#9a3412' },
  CANCELLED: { bg: '#fecaca', text: '#b91c1c' },
};

export const G = {
  indigo50: '#eef2ff',
  indigo600: '#4f46e5',
  indigo700: '#4338ca',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  white: '#ffffff',
  red50: '#fef2f2',
  red600: '#dc2626',
  green50: '#f0fdf4',
  green600: '#16a34a',
  yellow50: '#fefce8',
  yellow600: '#ca8a04',
};

export function fmtDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = typeof dateStr === 'string' && dateStr.length === 10
      ? new Date(dateStr + 'T00:00:00')
      : new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-PE', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
  } catch {
    return '—';
  }
}

export function fmtDateTime(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('es-PE', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
}
