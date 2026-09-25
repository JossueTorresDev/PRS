import { useEffect, useState } from "react";
import { getMunicipalidadById } from "../../../ms-01-tenant-management/services/municipalidadService";
import roleService from "../../services/roleService";

export default function RoleModal({
  isOpen,
  onClose,
  role,
  isEditing,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isSystem: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [municipalidad, setMunicipalidad] = useState(null);
  const [loadingMunicipalidad, setLoadingMunicipalidad] = useState(false);

  useEffect(() => {
    if (isOpen) {

      const checkUserPermissions = async () => {
        try {
          const userInfo = await roleService.getCurrentUser();
          const isSuperAdmin = roleService.isSuperAdmin(userInfo);

          if (!isSuperAdmin && !isEditing) {
            setError(`ADVERTENCIA: No tienes permisos de SUPER_ADMIN para crear roles.
            
Tu informacion actual:
- Usuario: ${userInfo?.sub || userInfo?.userId || "No identificado"}
- Roles: ${JSON.stringify(userInfo?.roles || userInfo?.authorities || [])}

Puedes ver este formulario pero no podras crear roles hasta que tengas el rol SUPER_ADMIN.`);
          }
        } catch (error) {
        }
      };

      if (isEditing && role) {
        setFormData({
          name: role.name || "",
          description: role.description || "",
          isSystem: role.isSystem || false,
        });
      } else {
        setFormData({
          name: "",
          description: "",
          isSystem: false,
        });

        checkUserPermissions();
      }

      if (isEditing) {
        setError(null);
      }

      loadMunicipalidad();
    }
  }, [isOpen, isEditing, role]);

  const loadMunicipalidad = async () => {
    const municipalCode = sessionStorage.getItem('municipalCode');
    if (municipalCode) {
      try {
        setLoadingMunicipalidad(true);
        const data = await getMunicipalidadById(municipalCode);
        setMunicipalidad(data);
      } catch (error) {
        setMunicipalidad(null);
      } finally {
        setLoadingMunicipalidad(false);
      }
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("El nombre del rol es obligatorio");
      return false;
    }
    if (formData.name.length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      return false;
    }
    if (formData.name.length > 50) {
      setError("El nombre no puede exceder 50 caracteres");
      return false;
    }
    if (formData.description && formData.description.length > 255) {
      setError("La descripción no puede exceder 255 caracteres");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const userInfo = await roleService.getCurrentUser();

      if (!userInfo) {
        throw new Error(
          "No se pudo obtener la informacion del usuario. Por favor, inicia sesion nuevamente."
        );
      }

      const isSuperAdmin = roleService.isSuperAdmin(userInfo);

      if (!isSuperAdmin && !isEditing) {
        throw new Error(
          `ACCESO DENEGADO: Solo usuarios con rol SUPER_ADMIN pueden crear roles.
          
Tu informacion actual:
- Usuario: ${userInfo.sub || userInfo.userId || "No identificado"}
- Roles: ${JSON.stringify(userInfo.roles || userInfo.authorities || [])}

Solucion: Contacta al administrador para que te asigne el rol SUPER_ADMIN.`
        );
      }

      const currentMunicipalCode = sessionStorage.getItem('municipalCode');
      
      const roleData = {
        name: formData.name.trim().toUpperCase(),
        description: formData.description.trim(),
        isSystem: Boolean(formData.isSystem),
        active: true,



        municipalCode: formData.isSystem ? null : currentMunicipalCode,
      };

      if (isEditing) {
        await roleService.updateRole(role.id, roleData);
      } else {
        await roleService.createRole(roleData);
      }

      onSuccess();
    } catch (error) {
      setError(error.message || "No se pudo guardar el rol");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (error) {
      setError(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-100 animate-fadeInScale">
        {}
        <div className="px-6 py-5 bg-cyan-600 rounded-t-3xl flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEditing ? "Editar Rol" : "Nuevo Rol"}
                </h2>
                <p className="text-cyan-100 text-sm mt-0.5">
                  {isEditing
                    ? "Actualiza la información del rol"
                    : "Completa los datos para crear un nuevo rol"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto flex-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {}
          <div className="bg-white rounded-2xl p-6 border-l-4 border-l-cyan-500 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              Información Básica
            </h3>

            <div className="space-y-6">
              {}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                  Nombre del Rol <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej: MANAGER, ADMIN, OPERATOR"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm"
                  disabled={loading}
                  required
                />
              </div>

              {}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe las responsabilidades y permisos de este rol..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm resize-none"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {}
          <div className="bg-white rounded-2xl p-6 border-l-4 border-l-cyan-500 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              Configuración
            </h3>

            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Rol del Sistema
                </label>
                <p className="text-xs text-slate-500">
                  Los roles del sistema no pueden ser eliminados
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isSystem"
                  checked={formData.isSystem}
                  onChange={handleChange}
                  className="sr-only peer"
                  disabled={loading}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>
          </div>

          {}
          <div className="bg-white rounded-2xl p-6 border-l-4 border-l-cyan-500 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Información del Sistema
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {}
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Municipalidad
                </label>

                {loadingMunicipalidad ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-cyan-600 border-t-transparent"></div>
                    <span className="text-sm text-slate-700">Cargando...</span>
                  </div>
                ) : municipalidad ? (
                  <div>
                    <p className="text-sm font-bold text-slate-900 mb-1">
                      {municipalidad.nombre}
                    </p>
                    <div className="flex flex-wrap gap-1 text-xs text-slate-600">
                      <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                        {municipalidad.tipo}
                      </span>
                      <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                        {municipalidad.distrito}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-mono text-slate-900 font-semibold">
                        {sessionStorage.getItem('municipalCode')?.substring(0, 8) || 'XXXXXXXX'}...
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Asignado automáticamente
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {}
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Creado Por
                </label>
                <div>
                  <p className="text-sm font-mono text-slate-900 font-semibold">
                    {JSON.parse(sessionStorage.getItem('user') || '{}')?.username || 'Usuario'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Tu usuario actual
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-4 flex items-start gap-2 bg-gray-50 p-3 rounded-xl">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Estos campos se asignan automáticamente desde tu sesión para garantizar la trazabilidad y seguridad.</span>
            </p>
          </div>

        </form>

        {}
        <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 rounded-b-3xl flex-shrink-0 flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all duration-200 flex items-center justify-center gap-2"
            disabled={loading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-600/20"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {isEditing ? "Actualizar Rol" : "Crear Rol"}
              </>
            )}
          </button>
        </div>

        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </div>
  );
}

