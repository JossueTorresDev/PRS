import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FaEdit } from "react-icons/fa";
import { updateCategory, getAllActiveCategories, getAllInactiveCategories } from "../../services/apiCategory";
import { validateCategory } from '../../utils/categoryValidation';
import { getMunicipalityId } from '../../../../shared/utils/municipalityHelper.js';
const getMunicipalityIdFromUser = () => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        return user?.municipalCode || getMunicipalityId();
    } catch (error) {
        return getMunicipalityId();
    }
};
const EditarCategoria = ({ categoria, onClose, onUpdated }) => {
    const [form, setForm] = useState({
        categoryCode: categoria.categoryCode || "",
        name: categoria.name || "",
        description: categoria.description || "",
        level: categoria.level || 1,
        requiresSerial: categoria.requiresSerial || false,
        requiresPlate: categoria.requiresPlate || false,
        isInventoriable: categoria.isInventoriable || false,
        parentCategoryId: categoria.parentCategoryId || null,
        municipalityId: getMunicipalityIdFromUser(),
    });
    const [allCategories, setAllCategories] = useState([]);
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const [active, inactive] = await Promise.all([
                    getAllActiveCategories(),
                    getAllInactiveCategories()
                ]);            
                const all = [...active, ...inactive];

                const user = JSON.parse(sessionStorage.getItem('user') || '{}');
                const municipalCode = user?.municipalCode;

                const filtradas = municipalCode
                    ? all.filter(c => c.municipalityId === municipalCode)
                    : all;

                const filteredCategories = all
                    .filter(c => c.id !== categoria.id)
                    .sort((a, b) => a.name.localeCompare(b.name));
                setAllCategories(filteredCategories);
            } catch (error) {
                console.error("Error al cargar categorías:", error);
            }
        };
        fetchCategories();
    }, [categoria.id]);
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({
            ...form,
            [name]: type === "checkbox" ? checked : value === "" ? null : value,
        });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const { valid, errors } = validateCategory(form, allCategories);
        const errores = errors;
        if (errores.length > 0) {
            const listaErrores = errores.map((err, idx) => `<li style="margin-bottom: 8px; color: #dc2626;">${idx + 1}. ${err}</li>`).join("");
            Swal.fire({
                title: "Errores en el formulario",
                html: `<ul style="text-align: left; font-size: 0.9rem; line-height: 1.8; list-style-position: inside; padding: 0;">${listaErrores}</ul>`,
                icon: "warning",
                confirmButtonText: "Entendido",
            });
            return;
        }
        const confirm = await Swal.fire({
            title: "¿Deseas guardar los cambios?",
            text: "Se actualizarán los datos de esta categoría.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, guardar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#2563eb",
            cancelButtonColor: "#d33",
        });
        if (!confirm.isConfirmed) return;
        try {
            Swal.fire({
                title: "Actualizando categoría...",
                text: "Por favor, espera unos segundos.",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => Swal.showLoading(),
            });
            await updateCategory(categoria.id, {
                ...form,
                municipalityId: form.municipalityId || getMunicipalityIdFromUser(),
                level: Number(form.level),
                parentCategoryId: form.parentCategoryId || null,
            });
            Swal.close();
            await Swal.fire("Actualizada", "La categoría se actualizó correctamente.", "success");
            onUpdated?.();
            onClose?.();
        } catch (error) {
            console.error("Error al actualizar categoría:", error);
            Swal.close();
            Swal.fire("Error", "No se pudo actualizar la categoría.", "error");
        }
    };
    return (
        <div className="fixed inset-0 bg-gray-900/75 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col animate-fadeInScale">
                { }
                <div className="px-6 py-5 flex-shrink-0 flex justify-between items-center bg-blue-600 rounded-t-3xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white shadow-inner">
                            <FaEdit className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Editar Categoría</h2>
                            <p className="text-blue-100 text-xs font-medium">Actualiza la información de la categoría</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-all duration-200" title="Cerrar">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                { }
                <div className="flex-1 overflow-y-auto p-6 bg-white" style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        { }
                        <div className="bg-gray-50 rounded-2xl p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Código</label>
                                    <input
                                        type="text"
                                        name="categoryCode"
                                        value={form.categoryCode}
                                        readOnly
                                        className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-slate-800 font-semibold cursor-not-allowed border-0"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Código interno generado automáticamente.</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nivel</label>
                                    <input
                                        type="number"
                                        name="level"
                                        value={form.level}
                                        min={1}
                                        onChange={(e) => setForm((prev) => ({ ...prev, level: Math.max(1, Number(e.target.value)) }))}
                                        className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-slate-800 border-0 focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Jerarquía de la categoría</p>
                                </div>
                            </div>
                        </div>
                        { }
                        <div className="bg-gray-50 rounded-2xl p-5">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><span className="w-2 h-5 bg-blue-500 rounded-full"></span>Información General</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nombre</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s]/g, "");
                                            setForm((prev) => ({ ...prev, name: value }));
                                        }}
                                        className="w-full px-4 py-2.5 bg-white rounded-xl text-slate-800 border-0 focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Nombre único de la categoría</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Categoría Padre</label>
                                    <div className="relative">
                                        <select
                                            name="parentCategoryId"
                                            value={form.parentCategoryId || ""}
                                            onChange={handleChange}
                                            className="w-full appearance-none px-4 pr-10 py-2.5 bg-white rounded-xl text-slate-800 border-0 focus:ring-2 focus:ring-indigo-500/20"
                                        >
                                            <option value="">— Ninguna —</option>
                                            {allCategories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Solo categorías activas</p>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Descripción</label>
                                    <textarea
                                        name="description"
                                        value={form.description}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-4 py-2.5 bg-white rounded-xl text-slate-800 border-0 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                                    />
                                </div>
                                {form.parentCategoryId && (
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nivel de Categoría Padre</label>
                                        <div className="w-full px-4 py-2.5 bg-white rounded-xl text-slate-800 flex items-center gap-2">
                                            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                                {allCategories.find((c) => c.id === form.parentCategoryId)?.level || "—"}
                                            </span>
                                            <span className="text-sm">{allCategories.find((c) => c.id === form.parentCategoryId)?.name}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Tu categoría debe tener un nivel superior</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        { }
                        <div className="bg-gray-50 rounded-2xl p-5">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><span className="w-2 h-5 bg-blue-500 rounded-full"></span>Configuración de Control</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { name: "requiresSerial", label: "Requiere Serie" },
                                    { name: "requiresPlate", label: "Requiere Placa" },
                                    { name: "isInventoriable", label: "Inventariable" }
                                ].map((chk) => (
                                    <label key={chk.name} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-100 text-slate-700 hover:border-indigo-200 transition-colors">
                                        <input type="checkbox" name={chk.name} checked={form[chk.name]} onChange={handleChange} />
                                        <span className="text-sm font-medium">{chk.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        { }
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-100 text-slate-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold">Cancelar</button>
                            <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold">Guardar Cambios</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default EditarCategoria;
