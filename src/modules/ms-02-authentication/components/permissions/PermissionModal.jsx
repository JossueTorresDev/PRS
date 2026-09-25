import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import permissionService from "../../services/permissionService";

export default function PermissionModal({ isOpen, onClose, onSuccess, permission, isEditing }) {
  const [formData, setFormData] = useState({ module: "", action: "", resource: "", displayName: "", description: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (permission && isEditing) {
      setFormData({
        module: permission.module || "",
        action: permission.action || "",
        resource: permission.resource || "",
        displayName: permission.displayName || "",
        description: permission.description || "",
      });
    } else {
      setFormData({ module: "", action: "", resource: "", displayName: "", description: "" });
    }
  }, [permission, isEditing]);

  const resourcesByModule = {
    "Usuarios y Seguridad": ["*", "Usuarios", "Personas", "Roles", "Permisos", "Areas", "Cargos"],
    "Activos": ["*", "Bienes", "Categorias", "Proveedores", "Ubicaciones"],
    "Operaciones": ["*", "Movimientos", "Actas", "Inventarios", "Mantenimientos"],
    "Contabilidad": ["*", "Bajas", "Valores"],
    "Reportes": ["*", "Reportes", "Auditoria", "Notificaciones"],
    "Configuracion": ["*", "Sistema"],
    "dashboard": ["*"],
    "roles": ["*"],
    "permisos": ["*"],
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "module") {
      setFormData(prev => ({ ...prev, [name]: value, resource: "" }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const availableResources = formData.module ? resourcesByModule[formData.module] || ["*"] : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.module || !formData.action || !formData.resource || !formData.displayName) {
      Swal.fire({
        title: "Campos requeridos",
        html: `<p class="text-slate-600">Por favor completa todos los campos obligatorios marcados con <span class="text-red-500 font-bold">*</span></p>`,
        icon: "warning",
        customClass: { popup: "rounded-2xl shadow-2xl", confirmButton: "rounded-lg px-6 py-2.5 font-medium btn-confirm-primary" },
      });
      return;
    }
    setLoading(true);
    try {
      if (isEditing) await permissionService.updatePermission(permission.id, formData);
      else await permissionService.createPermission(formData);
      onSuccess();
    } catch (error) {
      Swal.fire({
        title: "Error al guardar",
        html: `<p class="text-slate-600">${error.message || "No se pudo guardar el permiso"}</p>`,
        icon: "error",
        customClass: { popup: "rounded-2xl shadow-2xl", confirmButton: "btn-confirm-danger" },
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all appearance-none";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-0.5";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-200 overflow-hidden animate-fadeInScale">

        {}
        <div className="bg-cyan-600 px-7 py-5 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isEditing
                    ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    : "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"}
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEditing ? "Editar Permiso" : "Nuevo Permiso"}
                </h2>
                <p className="text-cyan-100 text-xs font-medium mt-0.5">
                  {isEditing ? "Modifica los datos del permiso" : "Completa los datos del permiso"}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {}
        <div className="p-7 overflow-y-auto flex-1" style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}>
          <form onSubmit={handleSubmit} id="perm-form-main" className="space-y-6">

            {}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Configuración Técnica</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {}
                <div>
                  <label className={labelClass}>Módulo <span className="text-red-500">*</span></label>
                  <select name="module" value={formData.module} onChange={handleChange} className={inputClass} required>
                    <option value="">Seleccionar módulo</option>
                    <option value="Usuarios y Seguridad">Usuarios y Seguridad</option>
                    <option value="Activos">Activos</option>
                    <option value="Operaciones">Operaciones</option>
                    <option value="Contabilidad">Contabilidad</option>
                    <option value="Reportes">Reportes</option>
                    <option value="Configuracion">Configuración</option>
                    <option value="dashboard">Dashboard</option>
                    <option value="roles">Roles</option>
                    <option value="permisos">Permisos</option>
                  </select>
                </div>

                {}
                <div>
                  <label className={labelClass}>Acción <span className="text-red-500">*</span></label>
                  <select name="action" value={formData.action} onChange={handleChange} className={inputClass} required>
                    <option value="">Seleccionar acción</option>
                    <option value="read">Lectura</option>
                    <option value="write">Escritura</option>
                    <option value="delete">Eliminación</option>
                    <option value="manage">Control Total</option>
                  </select>
                </div>

                {}
                <div>
                  <label className={labelClass}>Recurso <span className="text-red-500">*</span></label>
                  <select name="resource" value={formData.resource} onChange={handleChange} className={inputClass} required disabled={!formData.module}>
                    <option value="">{formData.module ? "Seleccionar recurso" : "Elige un módulo"}</option>
                    {availableResources.map(r => <option key={r} value={r}>{r === "*" ? "* (Todos)" : r}</option>)}
                  </select>
                  {!formData.module && (
                    <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      Selecciona primero un módulo
                    </p>
                  )}
                </div>
              </div>
            </div>

            {}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Información de Visualización</h3>
              </div>

              <div className="space-y-4">
                {}
                <div>
                  <label className={labelClass}>Nombre del Permiso <span className="text-red-500">*</span></label>
                  <select name="displayName" value={formData.displayName} onChange={handleChange} className={inputClass} required>
                    <option value="">Seleccionar nombre</option>
                    <option value="Gestión Completa">Gestión Completa</option>
                    <option value="Lectura de Datos">Lectura de Datos</option>
                    <option value="Creación de Registros">Creación de Registros</option>
                    <option value="Edición de Registros">Edición de Registros</option>
                    <option value="Eliminación de Registros">Eliminación de Registros</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1.5 pl-0.5">Este nombre se mostrará en tablas y listas de selección.</p>
                </div>

                {}
                <div>
                  <label className={labelClass}>Descripción</label>
                  <textarea
                    name="description" value={formData.description} onChange={handleChange}
                    placeholder="Describe el propósito de este permiso..."
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all resize-none placeholder:text-gray-300"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {}
        <div className="px-7 py-5 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-slate-50/80">
          <button
            type="button" onClick={onClose} disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:border-slate-400 rounded-xl font-semibold transition-all text-sm shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            Cancelar
          </button>
          <button
            type="submit" form="perm-form-main" disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {loading ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>Guardando...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{isEditing ? "Actualizar Permiso" : "Crear Permiso"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
