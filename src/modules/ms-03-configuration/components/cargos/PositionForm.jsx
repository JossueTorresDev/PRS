import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { createPosition, updatePosition } from "../../services/positionApi";
const PositionForm = ({ position, positions = [], onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    positionCode: "",
    name: "",
    description: "",
    hierarchicalLevel: 1,
    baseSalary: 0,
  });
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (position) {
      setFormData({
        positionCode: position.positionCode || "",
        name: position.name || "",
        description: position.description || "",
        hierarchicalLevel: position.hierarchicalLevel || 1,
        baseSalary: position.baseSalary || 0,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        hierarchicalLevel: 1,
        baseSalary: 0,
      });
    }
  }, [position]);
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let newValue = type === "number" ? (value === "" ? "" : Number(value)) : value.trimStart();
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    validateField(name, newValue);
  };
  const validateField = (name, value) => {
    let newErrors = { ...errors };
    const hasSpaces = /\s/.test(value);
    switch (name) {
      case "positionCode":
        if (!value?.toString().trim()) newErrors.positionCode = "El código del cargo es obligatorio.";
        else if (hasSpaces) newErrors.positionCode = "El código no debe contener espacios.";
        else if (value.length > 10) newErrors.positionCode = "Máximo 10 caracteres.";
        else if (positions.some((p) => p.positionCode?.toLowerCase() === value.toLowerCase() && p.id !== position?.id))
          newErrors.positionCode = "Ya existe un cargo con este código.";
        else delete newErrors.positionCode;
        break;
      case "name":
        if (!value?.toString().trim()) newErrors.name = "El nombre es obligatorio.";
        else if (value.length > 100) newErrors.name = "Máximo 100 caracteres.";
        else delete newErrors.name;
        break;
      case "description":
        if (!value?.toString().trim()) newErrors.description = "La descripción es obligatoria.";
        else if (value.length < 5) newErrors.description = "Debe tener al menos 5 caracteres.";
        else delete newErrors.description;
        break;
      case "hierarchicalLevel":
        if (!value || value === "" || Number(value) < 1) newErrors.hierarchicalLevel = "El nivel jerárquico es obligatorio y debe ser 1 o mayor.";
        else delete newErrors.hierarchicalLevel;
        break;
      case "baseSalary":
        if (value === "" || value === null || value === undefined) newErrors.baseSalary = "El salario base es obligatorio.";
        else if (Number(value) < 0) newErrors.baseSalary = "El salario no puede ser negativo.";
        else delete newErrors.baseSalary;
        break;
      default:
        break;
    }
    setErrors(newErrors);
  };
  const validateAll = () => {
    let newErrors = {};
    if (!formData.name?.trim()) {
      newErrors.name = "El nombre es obligatorio.";
    }
    if (!formData.description?.trim()) {
      newErrors.description = "La descripción es obligatoria.";
    }
    if (!formData.hierarchicalLevel || formData.hierarchicalLevel < 1) {
      newErrors.hierarchicalLevel = "El nivel jerárquico es obligatorio.";
    }
    if (formData.baseSalary === "" || formData.baseSalary === null || formData.baseSalary === undefined) {
      newErrors.baseSalary = "El salario base es obligatorio.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) {
      Swal.fire({ icon: "error", title: "Errores en el formulario", text: "Corrige los campos en rojo antes de continuar." });
      return;
    }
    try {
      if (position?.id) {
        const updateData = {
          name: formData.name,
          description: formData.description || "",
          hierarchicalLevel: formData.hierarchicalLevel || 1,
          baseSalary: formData.baseSalary || 0,
        };
        console.log("Enviando actualización:", updateData);
        await updatePosition(position.id, updateData);
        Swal.fire({ title: "¡Actualizado!", text: "El cargo fue actualizado correctamente.", icon: "success", timer: 2000, showConfirmButton: false });
      } else {
        // Obtener el municipalityId del usuario en sesión
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        const municipalityId = user?.municipalCode || user?.municipalityId || user?.municipality_id;

        // Obtener el código autogenerado del backend
        const { getNextPositionCode } = await import('../../services/positionApi');
        const positionCode = await getNextPositionCode(municipalityId);

        await createPosition({
          positionCode,
          name: formData.name,
          description: formData.description || "",
          hierarchicalLevel: formData.hierarchicalLevel || 1,
          baseSalary: formData.baseSalary || 0,
          municipalityId,
        });
        Swal.fire({ title: "¡Creado!", text: "El cargo fue creado correctamente.", icon: "success", timer: 2000, showConfirmButton: false });
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving position:", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "No se pudo guardar el cargo.";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        footer: error.response?.data?.details ? `<small>${error.response.data.details}</small>` : ""
      });
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {position && (
      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 border-l-4 border-l-blue-500 border border-blue-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </span>
          <div>
            <p className="text-slate-800">Identificación</p>
            <p className="text-xs text-slate-600 font-normal">Código único del cargo</p>
          </div>
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 pl-1 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              Código del Cargo
            </label>
            <div className="relative">
              <input
                type="text"
                name="positionCode"
                value={formData.positionCode}
                disabled
                className="w-full px-4 py-3.5 border-2 rounded-xl text-slate-900 text-sm font-medium shadow-sm opacity-60 cursor-not-allowed bg-gray-100 border-gray-200"
              />
            </div>
            <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              El código es generado automáticamente y no puede modificarse
            </p>
          </div>
        </div>
      </div>
      )}
      {}
      <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-6 border-l-4 border-l-green-500 border border-green-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </span>
          <div>
            <p className="text-slate-800">Información del Cargo</p>
            <p className="text-xs text-slate-600 font-normal">Detalles y características</p>
          </div>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 pl-1 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Nombre del Cargo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                maxLength={100}
                placeholder="Ej: Director de Recursos Humanos"
                className={`w-full px-4 py-3.5 border-2 rounded-xl text-slate-900 focus:ring-2 focus:ring-offset-2 transition-all text-sm font-medium shadow-sm ${
                  errors.name
                    ? "bg-red-50 border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : formData.name?.trim()
                    ? "bg-white border-green-300 focus:border-green-500 focus:ring-green-500/20"
                    : "bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
              />
              {formData.name?.trim() && !errors.name && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
            </div>
            {errors.name && (
              <div className="mt-2 px-4 py-2.5 bg-red-100 border-l-4 border-l-red-600 rounded-lg shadow-sm">
                <p className="text-sm text-red-800 font-medium">{errors.name}</p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 pl-1 flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              Nivel Jerárquico <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="hierarchicalLevel"
              value={formData.hierarchicalLevel}
              onChange={handleChange}
              min={1}
              placeholder="1"
              className={`w-full px-4 py-3.5 border-2 rounded-xl text-slate-900 focus:ring-2 focus:ring-offset-2 transition-all text-sm font-medium shadow-sm ${
                errors.hierarchicalLevel
                  ? "bg-red-50 border-red-300 focus:border-red-500 focus:ring-red-500/20"
                  : "bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
              }`}
            />
            {errors.hierarchicalLevel && (
              <div className="mt-2 px-4 py-2.5 bg-red-100 border-l-4 border-l-red-600 rounded-lg shadow-sm">
                <p className="text-sm text-red-800 font-medium">{errors.hierarchicalLevel}</p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 pl-1 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Salario Base (S/.) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="baseSalary"
              value={formData.baseSalary}
              onChange={handleChange}
              min={0}
              step="0.01"
              placeholder="0.00"
              className={`w-full px-4 py-3.5 border-2 rounded-xl text-slate-900 focus:ring-2 focus:ring-offset-2 transition-all text-sm font-medium shadow-sm ${
                errors.baseSalary
                  ? "bg-red-50 border-red-300 focus:border-red-500 focus:ring-red-500/20"
                  : "bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
              }`}
            />
            {errors.baseSalary && (
              <div className="mt-2 px-4 py-2.5 bg-red-100 border-l-4 border-l-red-600 rounded-lg shadow-sm">
                <p className="text-sm text-red-800 font-medium">{errors.baseSalary}</p>
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 pl-1 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Descripción <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe las responsabilidades y funciones del cargo..."
                className={`w-full px-4 py-3.5 border-2 rounded-xl text-slate-900 focus:ring-2 focus:ring-offset-2 transition-all text-sm resize-none font-medium shadow-sm ${
                  errors.description
                    ? "bg-red-50 border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : formData.description?.trim()
                    ? "bg-white border-green-300 focus:border-green-500 focus:ring-green-500/20"
                    : "bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
              />
              {formData.description?.trim() && !errors.description && (
                <div className="absolute right-3 top-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
            </div>
            {errors.description && (
              <div className="mt-2 px-4 py-2.5 bg-red-100 border-l-4 border-l-red-600 rounded-lg shadow-sm">
                <p className="text-sm text-red-800 font-medium">{errors.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 hover:border-gray-400 font-semibold transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {position ? "Actualizar Cargo" : "Crear Cargo"}
        </button>
      </div>
    </form>
  );
};
export default PositionForm;
