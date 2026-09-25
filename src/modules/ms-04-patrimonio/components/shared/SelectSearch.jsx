import React, { useState, useMemo, useRef, useEffect } from 'react';

export default function SelectSearch({
  label,
  name,
  value,
  onChange,
  options = [],
  valueKey = 'id',
  labelKey = 'label',
  placeholder = 'Buscar... ',
  emptyOption = '-- Seleccione --',
  required = false,
  disabled = false,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  // Normalizar `options` para evitar crashes si el caller pasa un objeto en vez de un array
  const opts = useMemo(() => {
    if (Array.isArray(options)) return options;
    if (options && typeof options === 'object') {
      if (Array.isArray(options.data)) return options.data;
      if (Array.isArray(options.items)) return options.items;
      // si es un objeto con keys que contienen arrays, intentar recuperar el primer array
      const arr = Object.values(options).find(v => Array.isArray(v));
      if (Array.isArray(arr)) return arr;
    }
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('SelectSearch: expected `options` to be an array but received:', options);
    }
    return [];
  }, [options]);

  // Helpers para normalizar label/value de una opción
  const getOptionLabel = (opt) => {
    if (!opt) return '';
    return (
      opt[labelKey] ||
      opt.nombre ||
      opt.razonSocial ||
      opt.nombres ||
      opt.label ||
      opt.codigo ||
      opt.code ||
      ''
    );
  };

  const getOptionValue = (opt) => {
    if (!opt) return '';
    return (
      opt[valueKey] ||
      opt.id ||
      opt._id ||
      opt.code ||
      opt.codigo ||
      opt.codigoProveedor ||
      opt.codigoUbicacion ||
      opt.codigoArea ||
      opt.personaId ||
      ''
    );
  };

  // Mostrar el label del value actual en el input
  const currentLabel = useMemo(() => {
    const found = opts.find((o) => {
      const optVal = String(getOptionValue(o));
      const targetVal = value !== undefined && value !== null ? String(value) : '';
      // también comparar contra label si el value viene como texto
      const optLabel = String(getOptionLabel(o));
      return optVal === targetVal || optLabel === targetVal;
    });
    return found ? getOptionLabel(found) : '';
  }, [opts, value, valueKey, labelKey]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    if (!value) {
      setQuery('');
    }
  }, [value]);

  const filtered = useMemo(() => {
    const q = (query || '').toLowerCase();
    if (!q) return opts;
    return opts.filter((opt) => {
      const labelVal = (getOptionLabel(opt) || '').toString().toLowerCase();
      const valueVal = (getOptionValue(opt) || '').toString().toLowerCase();
      // buscar también en campos alternativos
      const extra = (
        (opt.razonSocial || '') + ' ' + (opt.nombres || '') + ' ' + (opt.codigo || '') + ' '
        + (opt.codigoProveedor || '') + ' ' + (opt.codigoUbicacion || '')
      ).toString().toLowerCase();
      return labelVal.includes(q) || valueVal.includes(q) || extra.includes(q);
    });
  }, [opts, query, labelKey, valueKey]);

  const handleSelect = (opt) => {
    const selectedValue = getOptionValue(opt) || getOptionLabel(opt);
    if (onChange) onChange({ target: { name, value: selectedValue } });
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={ref} className="relative">
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>}

      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        value={open ? query : currentLabel}
        onChange={(e) => { if (!disabled) { setQuery(e.target.value); setOpen(true); } }}
        onFocus={() => { if (!disabled) setOpen(true); }}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'border-slate-300'}`}
      />

      {open && (
        <ul className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-white border border-slate-200 rounded-md shadow-lg">
          <li key="__empty__" className="px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 cursor-default">{emptyOption}</li>
          {filtered.map(opt => (
            <li
              key={getOptionValue(opt) || getOptionLabel(opt) || JSON.stringify(opt)}
              className={`px-3 py-2 text-sm hover:bg-slate-100 cursor-pointer ${String(getOptionValue(opt)) === String(value) ? 'bg-green-50' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(opt); }}
            >
              {getOptionLabel(opt)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
