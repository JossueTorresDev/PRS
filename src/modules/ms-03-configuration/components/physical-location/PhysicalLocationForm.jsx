import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { createPhysicalLocation, updatePhysicalLocation } from "../../services/physicalLocationApi";

const LOC_TYPES = [
  { value: "OFFICE", label: "Oficina" },
  { value: "WAREHOUSE", label: "Almacén" },
  { value: "FIELD", label: "Campo" },
  { value: "VEHICLE", label: "Vehículo" },
  { value: "STORAGE", label: "Almacenamiento" },
  { value: "WORKSHOP", label: "Taller" },
];

export default function PhysicalLocationForm({ isOpen, onClose, onSuccess, location = null, nextCode }) {
  const isEditing = !!(location && location.id);

  const [form, setForm] = useState({
    locationCode: "", name: "", description: "", locationType: "",
    address: "", floor: "", sector: "", reference: "",
    gpsCoordinates: null, maxCapacity: "", areaM2: "", responsibleId: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (location && location.id) {
      setForm({
        locationCode: location.locationCode || "",
        name: location.name || "",
        description: location.description || "",
        locationType: location.locationType || "",
        address: location.address || "",
        floor: location.floor ?? "",
        sector: location.sector || "",
        reference: location.reference || "",
        gpsCoordinates: location.gpsCoordinates || null,
        maxCapacity: location.maxCapacity ? String(location.maxCapacity) : "",
        areaM2: location.areaM2 ? String(location.areaM2) : "",
        responsibleId: location.responsibleId || "",
      });
    } else {
      setForm({
        locationCode: nextCode || "", name: "", description: "", locationType: "",
        address: "", floor: "", sector: "", reference: "",
        gpsCoordinates: null, maxCapacity: "", areaM2: "", responsibleId: "",
      });
    }
    setErrors({});
  }, [isOpen, location, nextCode]);

  const validate = (data) => {
    const e = {};
    if (!data.name?.trim()) e.name = "El nombre es requerido";
    else if (data.name.trim().length < 3) e.name = "Mínimo 3 caracteres";
    if (!data.locationType) e.locationType = "El tipo es requerido";
    if (data.floor && (isNaN(Number(data.floor)) || !Number.isInteger(Number(data.floor)))) e.floor = "Debe ser entero";
    if (data.maxCapacity && (isNaN(Number(data.maxCapacity)) || Number(data.maxCapacity) < 0)) e.maxCapacity = "Debe ser ≥ 0";
    if (data.areaM2 && (isNaN(Number(data.areaM2)) || Number(data.areaM2) <= 0)) e.areaM2 = "Debe ser > 0";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    try {
      setLoading(true);
      if (isEditing) {
        const payload = {
          id: location.id,
          locationCode: form.locationCode.trim(),
          name: form.name.trim(),
          description: form.description?.trim() || null,
          locationType: form.locationType,
          address: form.address?.trim() || "",
          sector: form.sector?.trim() || "",
          floor: form.floor ? parseInt(form.floor) : null,
          reference: form.reference?.trim() || "",
          maxCapacity: form.maxCapacity ? parseInt(form.maxCapacity) : 0,
          areaM2: form.areaM2 ? parseFloat(form.areaM2) : 0,
        };
        await updatePhysicalLocation(location.id, payload);
      } else {
        const payload = {
          municipalityId: "7a52b3a4-87a9-4b1f-91d4-a1ee23c5e9c5",
          name: form.name.trim(),
          description: form.description?.trim() || null,
          locationType: form.locationType,
          parentLocationId: null,
          address: form.address?.trim() || null,
          floor: form.floor ? Number(form.floor) : null,
          sector: form.sector?.trim() || null,
          reference: form.reference?.trim() || null,
          gpsCoordinates: { x: 0, y: 0 },
          maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : 0,
          areaM2: form.areaM2 ? parseFloat(form.areaM2) : 0,
          active: true,
          createdBy: "3bddf19a-2d5a-4ee7-8be4-63494fb411b8",
        };
        await createPhysicalLocation(payload);
      }
      Swal.fire({ title: "¡Éxito!", text: isEditing ? "Ubicación actualizada" : "Ubicación creada", icon: "success", timer: 2000, showConfirmButton: false, customClass: { popup: "rounded-2xl shadow-2xl" } });
      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire({ title: "Error", text: err?.message || "No se pudo guardar", icon: "error", confirmButtonText: "Aceptar" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = (field) =>
    `w-full px-3 py-2.5 border-2 rounded-xl text-slate-900 focus:ring-2 focus:ring-offset-1 transition-all text-sm font-medium shadow-sm ${
      errors[field]
        ? "bg-red-50 border-red-300 focus:border-red-500 focus:ring-red-500/20"
        : form[field]?.toString().trim()
        ? "bg-white border-teal-300 focus:border-teal-500 focus:ring-teal-500/20"
        : "bg-white border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
    }`;

  const ErrMsg = ({ field }) => errors[field]
    ? <div className="mt-1.5 px-3 py-1.5 bg-red-100 border-l-4 border-l-red-500 rounded-lg"><p className="text-xs text-red-800 font-medium">{errors[field]}</p></div>
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-start z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-4">
        {/* Header */}
        <div className="bg-teal-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{isEditing ? "Editar Ubicación" : "Nueva Ubicación Física"}</h2>
              <p className="text-teal-100 text-xs">{isEditing ? location?.name : "Completa los datos de la ubicación"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Identificación */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border-l-4 border-l-blue-500 border border-blue-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
              </span>
              <div><p className="text-slate-800">Identificación</p><p className="text-xs text-slate-500 font-normal">Código y nombre</p></div>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {isEditing && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                  Código
                </label>
                <input name="locationCode" value={form.locationCode} onChange={handleChange}
                  readOnly placeholder="Generado automáticamente"
                  className="w-full px-3 py-2.5 border-2 rounded-xl text-slate-900 text-sm font-medium shadow-sm opacity-60 cursor-not-allowed bg-gray-100 border-gray-200" />
                <p className="mt-1 text-xs text-slate-400">Generado automáticamente por el sistema</p>
              </div>
              )}
              <div className={isEditing ? '' : 'col-span-2'}>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Nombre de la ubicación" className={inputCls('name')} />
                <ErrMsg field="name" />
              </div>
            </div>
          </div>

          {/* Tipo y Ubicación */}
          <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-xl p-4 border-l-4 border-l-teal-500 border border-teal-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </span>
              <div><p className="text-slate-800">Tipo y Ubicación</p><p className="text-xs text-slate-500 font-normal">Clasificación y dirección</p></div>
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                  Tipo <span className="text-red-500">*</span>
                </label>
                <select name="locationType" value={form.locationType} onChange={handleChange} className={inputCls('locationType')}>
                  <option value="">Seleccione tipo</option>
                  {LOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <ErrMsg field="locationType" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                  Piso
                </label>
                <input name="floor" type="number" value={form.floor} onChange={handleChange} placeholder="Ej: 2" className={inputCls('floor')} />
                <ErrMsg field="floor" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                  Sector
                </label>
                <input name="sector" value={form.sector} onChange={handleChange} placeholder="Ej: Almacén, Oficinas" className={inputCls('sector')} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Referencia
                </label>
                <input name="reference" value={form.reference} onChange={handleChange} placeholder="Puntos de referencia" className={inputCls('reference')} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Dirección
              </label>
              <input name="address" value={form.address} onChange={handleChange} placeholder="Dirección completa" className={inputCls('address')} />
            </div>
          </div>

          {/* Capacidad */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border-l-4 border-l-purple-500 border border-purple-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              </span>
              <div><p className="text-slate-800">Capacidad y Área</p><p className="text-xs text-slate-500 font-normal">Dimensiones físicas</p></div>
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Capacidad Máx. (personas)
                </label>
                <input name="maxCapacity" type="number" min="0" value={form.maxCapacity} onChange={handleChange} placeholder="Ej: 10" className={inputCls('maxCapacity')} />
                <ErrMsg field="maxCapacity" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                  Área (m²)
                </label>
                <input name="areaM2" type="number" min="0" step="0.01" value={form.areaM2} onChange={handleChange} placeholder="Ej: 25.50" className={inputCls('areaM2')} />
                <ErrMsg field="areaM2" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                Descripción
              </label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={2}
                placeholder="Descripción detallada de la ubicación..."
                className={`${inputCls('description')} resize-none`} />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={loading}
              className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
              {loading ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>{isEditing ? "Actualizando..." : "Guardando..."}</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{isEditing ? "Actualizar" : "Crear Ubicación"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
