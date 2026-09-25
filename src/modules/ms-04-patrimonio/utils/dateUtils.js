const parseDate = (str) => {
  if (!str) return null;
  if (str.includes('T')) return new Date(str);
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const formatDateSafe = (str, locale = 'es-PE', options = {}) => {
  const d = parseDate(str);
  if (!d) return '—';
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric', ...options });
};

export const formatDateOnly = (str, locale = 'es-ES') => {
  const d = parseDate(str);
  if (!d) return '—';
  return d.toLocaleDateString(locale);
};

export const getDateValue = (str) => {
  const d = parseDate(str);
  return d ? d.getTime() : 0;
};
