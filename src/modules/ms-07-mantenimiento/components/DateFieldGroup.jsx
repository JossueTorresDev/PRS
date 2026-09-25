import { useState, useRef, useEffect, useCallback } from 'react';

export default function DateFieldGroup({ label, value = '', onChange, required = false, disabled = false, error }) {
  const parseDateValue = useCallback((val) => {
    if (!val) return { day: '', month: '', year: '' };
    const parts = val.split('-');
    if (parts.length === 3) {
      return { day: parts[2] || '', month: parts[1] || '', year: parts[0] || '' };
    }
    return { day: '', month: '', year: '' };
  }, []);

  const [fields, setFields] = useState(() => parseDateValue(value));
  const monthRef = useRef(null);
  const yearRef = useRef(null);

  useEffect(() => {
    setFields(parseDateValue(value));
  }, [value, parseDateValue]);

  const handleFieldChange = (field, newValue) => {
    const cleaned = newValue.replace(/\D/g, '');
    let clampedValue = cleaned;

    if (field === 'day') {
      clampedValue = cleaned.slice(0, 2);
      const num = parseInt(clampedValue, 10);
      if (!isNaN(num) && clampedValue.length === 2 && num > 31) clampedValue = '31';
    } else if (field === 'month') {
      clampedValue = cleaned.slice(0, 2);
      const num = parseInt(clampedValue, 10);
      if (!isNaN(num) && clampedValue.length === 2 && num > 12) clampedValue = '12';
    } else if (field === 'year') {
      clampedValue = cleaned.slice(0, 4);
      const yearNum = parseInt(clampedValue, 10);
      if (!isNaN(yearNum) && clampedValue.length === 4) {
        if (yearNum < 1900) clampedValue = '1900';
        if (yearNum > 2100) clampedValue = '2100';
      }
    }

    const updated = { ...fields, [field]: clampedValue };
    setFields(updated);

    if (field === 'day' && clampedValue.length === 2) {
      monthRef.current?.focus();
    } else if (field === 'month' && clampedValue.length === 2) {
      yearRef.current?.focus();
    }

    if (updated.day.length === 2 && updated.month.length === 2 && updated.year.length === 4) {
      onChange?.(`${updated.year}-${updated.month}-${updated.day}`);
    } else if (!updated.day && !updated.month && !updated.year) {
      onChange?.('');
    }
  };

  const handleBlur = () => {
    if (fields.day && fields.month && fields.year && fields.year.length === 4) {
      const y = fields.year;
      const m = fields.month.padStart(2, '0');
      const d = fields.day.padStart(2, '0');
      const monthNum = parseInt(m, 10);
      const dayNum = parseInt(d, 10);
      if (monthNum < 1 || monthNum > 12 || dayNum < 1) return;
      const maxDays = [31, (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      const clampedDay = String(Math.min(dayNum, maxDays[monthNum - 1] || 31)).padStart(2, '0');
      const updated = { day: clampedDay, month: m, year: y };
      setFields(updated);
      onChange?.(`${y}-${m}-${clampedDay}`);
    }
  };

  const fieldStyle = {
    width: '100%',
    padding: '10px 0',
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    backgroundColor: disabled ? '#f1f5f9' : '#ffffff',
    border: `1.5px solid ${error ? '#ef4444' : '#e2e8f0'}`,
    borderRadius: '10px',
    letterSpacing: '1px',
  };

  const fieldFocusStyle = {
    borderColor: '#283447',
    boxShadow: '0 0 0 3px rgba(40, 52, 71, 0.1)',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
    textAlign: 'center',
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: '600',
          color: '#334155',
          marginBottom: '10px',
        }}>
          {label}
          {required && <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>}
        </label>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1.4fr',
        gap: '10px',
        backgroundColor: '#f8fafc',
        padding: '14px',
        borderRadius: '14px',
        border: `1px solid ${error ? '#fecaca' : '#e5e7eb'}`,
      }}>
        <div>
          <span style={labelStyle}>Día</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="00"
            maxLength={2}
            value={fields.day}
            onChange={(e) => handleFieldChange('day', e.target.value)}
            disabled={disabled}
            style={fieldStyle}
            className="date-input-placeholder"
            onFocus={(e) => Object.assign(e.target.style, fieldFocusStyle)}
            onBlur={(e) => {
              e.target.style.borderColor = error ? '#ef4444' : '#e2e8f0';
              e.target.style.boxShadow = 'none';
              handleBlur();
            }}
          />
        </div>

        <div>
          <span style={labelStyle}>Mes</span>
          <input
            ref={monthRef}
            type="text"
            inputMode="numeric"
            placeholder="00"
            maxLength={2}
            value={fields.month}
            onChange={(e) => handleFieldChange('month', e.target.value)}
            disabled={disabled}
            style={fieldStyle}
            className="date-input-placeholder"
            onFocus={(e) => Object.assign(e.target.style, fieldFocusStyle)}
            onBlur={(e) => {
              e.target.style.borderColor = error ? '#ef4444' : '#e2e8f0';
              e.target.style.boxShadow = 'none';
              handleBlur();
            }}
          />
        </div>

        <div>
          <span style={labelStyle}>Año</span>
          <input
            ref={yearRef}
            type="text"
            inputMode="numeric"
            placeholder="0000"
            maxLength={4}
            value={fields.year}
            onChange={(e) => handleFieldChange('year', e.target.value)}
            disabled={disabled}
            style={fieldStyle}
            className="date-input-placeholder"
            onFocus={(e) => Object.assign(e.target.style, fieldFocusStyle)}
            onBlur={(e) => {
              e.target.style.borderColor = error ? '#ef4444' : '#e2e8f0';
              e.target.style.boxShadow = 'none';
              handleBlur();
            }}
          />
        </div>
      </div>

      {error && (
        <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', paddingLeft: '4px' }}>
          {error}
        </p>
      )}
    </div>
  );
}
