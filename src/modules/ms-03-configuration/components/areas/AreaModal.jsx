import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { createArea, updateArea } from "../../services/areasApi";
import { getMunicipalityId, getUserId } from "../../../../shared/utils/municipalityHelper";

export default function AreaModal({ isOpen, onClose, onSuccess, area = null }) {
  const [formData, setFormData] = useState({
    areaCode: '', name: '', description: '', hierarchicalLevel: '',
    physicalLocation: '', phone: '', email: '', annualBudget: '',
    active: true, responsibleId: null, parentAreaId: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const isEditing = !!(area && area.id);

  useEffect(() => {
    if (!isOpen) return;
    if (area && area.id) {
      setFormData({
        areaCode: area.areaCode || '', name: area.name || '',
        description: area.description || '',
        hierarchicalLevel: String(area.hierarchicalLevel || ''),
        physicalLocation: area.physicalLocation || '',
        phone: area.phone || '', email: area.email || '',
        annualBudget: area.annualBudget ? String(area.annualBudget) : '',
        active: area.active !== false,
        responsibleId: area.responsibleId || null, parentAreaId: area.parentAreaId || null,
      });
    } else {
      setFormData({
        areaCode: '', name: '', description: '', hierarchicalLevel: '',
        physicalLocation: '', phone: '', email: '', annualBudget: '',
        active: true, responsibleId: null, parentAreaId: null,
      });
    }
    setErrors({});
  }, [isOpen, area]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!isEditing && formData.areaCode?.trim()) {
      // solo validar código si se está editando o si el usuario lo ingresó manualmente
    }
    if (!formData.name?.trim()) e.name = 'El nombre es requerido';
    if (!formData.hierarchicalLevel) e.hierarchicalLevel = 'Seleccione un nivel';
    if (!formData.description?.trim()) e.description = 'La descripción es requerida';
    if (!formData.physicalLocation?.trim()) e.physicalLocation = 'La ubicación es requerida';
    if (!formData.phone?.trim()) e.phone = 'El teléfono es requerido';
    if (!formData.email?.trim()) e.email = 'El email es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Email inválido';
    if (!formData.annualBudget || parseFloat(formData.annualBudget) <= 0) e.annualBudget = 'Ingrese un monto válido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const municipalityId = getMunicipalityId();
      const userId = getUserId();

      if (!municipalityId) {
        Swal.fire({ title: 'Error de sesión', text: 'No se pudo obtener el municipio del usuario. Por favor, vuelva a iniciar sesión.', icon: 'error', confirmButtonText: 'Aceptar' });
        return;
      }

      const payload = {
        municipalityId,
        ...(isEditing && { areaCode: formData.areaCode.trim().toUpperCase() }),
        name: formData.name.trim(),
        description: formData.description.trim(),
        hierarchicalLevel: parseInt(formData.hierarchicalLevel),
        physicalLocation: formData.physicalLocation.trim(),
        phone: formData.phone.replace(/[^0-9]/g, ''),
        email: formData.email.trim().toLowerCase(),
        annualBudget: parseFloat(formData.annualBudget) || 0,
        active: formData.active,
        ...(userId && { createdBy: userId }),
        responsibleId: formData.responsibleId || null,
        parentAreaId: formData.parentAreaId || null,
      };
      if (isEditing) { await updateArea(area.id, payload); }
      else { await createArea(payload); }
      Swal.fire({ title: '¡Éxito!', text: isEditing ? 'Área actualizada' : 'Área creada correctamente', icon: 'success', timer: 2000, showConfirmButton: false });
      onSuccess(); onClose();
    } catch (error) {
      Swal.fire({ title: 'Error', text: error?.message || 'Error al guardar', icon: 'error', confirmButtonText: 'Aceptar' });
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  const inputCls = (field) =>
    `w-full px-3 py-2.5 border-2 rounded-xl text-slate-900 focus:ring-2 focus:ring-offset-1 transition-all text-sm font-medium shadow-sm ${
      errors[field]
        ? 'bg-red-50 border-red-300 focus:border-red-500 focus:ring-red-500/20'
        : formData[field]?.toString().trim()
        ? 'bg-white border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20'
        : 'bg-white border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20'
    }`;

  const ErrMsg = ({ field }) => errors[field]
    ? <div className="mt-2 px-3 py-2 bg-red-100 border-l-4 border-l-red-500 rounded-lg"><p className="text-xs text-red-800 font-medium">{errors[field]}</p></div>
    : null;

  const Label = ({ icon, text, required }) => (
    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 pl-1 flex items-center gap-2">
      {icon}
      {text} {required && <span className="text-red-500">*</span>}
    </label>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-start z-50 p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mt-4 mb-4">

        {/* Header */}
        <div className="bg-emerald-600 px-8 py-5 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{isEditing ? 'Editar Área' : 'Nueva Área'}</h2>
              <p className="text-emerald-100 text-xs">{isEditing ? area?.name : 'Completa los datos del área'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">

          {/* ── Identificación ── */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 border-l-4 border-l-blue-500 border border-blue-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </span>
              <div>
                <p className="text-slate-800">Identificación</p>
                <p className="text-xs text-slate-500 font-normal">Código y nombre del área</p>
              </div>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {isEditing && (
              <div>
                <Label text="Código" icon={<svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>} />
                <input type="text" name="areaCode" value={formData.areaCode}
                  readOnly disabled placeholder="Generado automáticamente"
                  className="w-full px-3 py-2.5 border-2 rounded-xl text-slate-900 text-sm font-medium shadow-sm opacity-60 cursor-not-allowed bg-gray-100 border-gray-200" />
                <p className="mt-1.5 text-xs text-slate-400 flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>Generado automáticamente</p>
              </div>
              )}
              <div className={isEditing ? '' : 'col-span-2'}>
                <Label required text="Nombre" icon={<svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
                <input type="text" name="name" value={formData.name} onChange={handleChange}
                  placeholder="Nombre del área" className={inputCls('name')} />
                <ErrMsg field="name" />
              </div>
            </div>
          </div>

          {/* ── Organización ── */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3 border-l-4 border-l-emerald-500 border border-emerald-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </span>
              <div>
                <p className="text-slate-800">Organización</p>
                <p className="text-xs text-slate-500 font-normal">Nivel jerárquico, ubicación y descripción</p>
              </div>
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label required text="Nivel Jerárquico" icon={<svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>} />
                <select name="hierarchicalLevel" value={formData.hierarchicalLevel} onChange={handleChange} className={inputCls('hierarchicalLevel')}>
                  <option value="">Seleccione el nivel</option>
                  <option value="1">Nivel 1 — Gerencia</option>
                  <option value="2">Nivel 2 — Subgerencia</option>
                </select>
                <ErrMsg field="hierarchicalLevel" />
              </div>
              <div>
                <Label required text="Ubicación Física" icon={<svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
                <input type="text" name="physicalLocation" value={formData.physicalLocation} onChange={handleChange}
                  placeholder="Ej: Piso 2, Oficina 201" className={inputCls('physicalLocation')} />
                <ErrMsg field="physicalLocation" />
              </div>
            </div>
            <div>
              <Label required text="Descripción" icon={<svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>} />
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3}
                placeholder="Describe las funciones y responsabilidades del área..."
                className={`${inputCls('description')} resize-none`} />
              <ErrMsg field="description" />
            </div>
          </div>

          {/* ── Contacto y Presupuesto ── */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-3 border-l-4 border-l-purple-500 border border-purple-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </span>
              <div>
                <p className="text-slate-800">Contacto y Presupuesto</p>
                <p className="text-xs text-slate-500 font-normal">Datos de comunicación y financieros</p>
              </div>
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label required text="Teléfono" icon={<svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>} />
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                  placeholder="Ej: 950263442" className={inputCls('phone')} />
                <ErrMsg field="phone" />
              </div>
              <div>
                <Label required text="Email" icon={<svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  placeholder="correo@ejemplo.com" className={inputCls('email')} />
                <ErrMsg field="email" />
              </div>
              <div>
                <Label required text="Presupuesto (S/.)" icon={<svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                <input type="number" name="annualBudget" value={formData.annualBudget} onChange={handleChange}
                  min="0" step="0.01" placeholder="0.00" className={inputCls('annualBudget')} />
                <ErrMsg field="annualBudget" />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={loading}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all duration-200 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
              {loading ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>{isEditing ? 'Actualizando...' : 'Guardando...'}</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{isEditing ? 'Actualizar Área' : 'Crear Área'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
