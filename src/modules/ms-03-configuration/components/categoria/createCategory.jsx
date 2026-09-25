import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FaPlusCircle } from "react-icons/fa";
import { createCategory, getAllActiveCategories, getAllInactiveCategories } from "../../services/apiCategory";
import { getMunicipalityId } from '../../../../shared/utils/municipalityHelper.js';
import { validateCategory } from '../../utils/categoryValidation';
const getMunicipalityIdFromUser = () => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        return user?.municipalCode || getMunicipalityId();
    } catch (error) {
        return getMunicipalityId();
    }
};
const CrearCategoria = ({ onClose, onCreated }) => {
    const [categoriasPadre, setCategoriasPadre] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [categoria, setCategoria] = useState({
        categoryCode: "",
        name: "",
        description: "",
        parentCategoryId: null,
        isInventoriable: false,
        requiresSerial: false,
        requiresPlate: false,
        level: 1,
        municipalityId: getMunicipalityIdFromUser(),
    });
    const generarCodigoCategoria = (categorias) => {
        if (!categorias || categorias.length === 0) return "CAT-001";
        const numeros = categorias
            .map((c) => {
                const match = c.categoryCode?.match(/CAT-(\d+)/);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter((n) => !isNaN(n));
        const maxNum = numeros.length > 0 ? Math.max(...numeros) : 0;
        return `CAT-${(maxNum + 1).toString().padStart(3, "0")}`;
    };
    useEffect(() => {
        const fetchCategorias = async () => {
            try {
                const [actives, inactives] = await Promise.all([
                    getAllActiveCategories(),
                    getAllInactiveCategories(),
                ]);

                const all = [...actives, ...inactives];

                const municipalCode = getMunicipalityIdFromUser();

                const filtradas = municipalCode
                    ? all.filter(c => c.municipalityId === municipalCode)
                    : all;

                const activasFiltradas = municipalCode
                    ? actives.filter(c => c.municipalityId === municipalCode)
                    : actives;

                setCategoriasPadre(activasFiltradas);
                setAllCategories(filtradas);

                const nuevoCodigo = generarCodigoCategoria(all);
                setCategoria((prev) => ({
                    ...prev,
                    categoryCode: nuevoCodigo
                }));

            } catch (error) {
                console.error("Error cargando categorías:", error);
            }
        };

        fetchCategorias();
    }, []);
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCategoria((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value === "" ? null : value,
        }));
    };
    const validarCategoria = () => {
        const result = validateCategory(categoria, allCategories);
        return {
            válido: result.valid,
            errores: result.errors,
        };
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const { válido, errores } = validarCategoria();
        if (!válido) {
            const listaErrores = errores
                .map((err, idx) => `<li style="margin-bottom: 8px; color: #dc2626;">${idx + 1}. ${err}</li>`)
                .join("");
            Swal.fire({
                title: "Errores en el formulario",
                html: `<ul style="text-align: left; font-size: 0.9rem; line-height: 1.8; list-style-position: inside; padding: 0;">${listaErrores}</ul>`,
                icon: "warning",
                confirmButtonText: "Entendido",
            });
            return;
        }
        const confirm = await Swal.fire({
            title: "¿Deseas crear esta categoría?",
            text: "Se registrará una nueva categoría con los datos ingresados.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, crear",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#16a34a",
            cancelButtonColor: "#d33",
        });
        if (!confirm.isConfirmed) return;
        try {
            Swal.fire({
                title: "Creando categoría...",
                text: "Por favor, espera unos segundos.",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => Swal.showLoading(),
            });
            await createCategory({
                ...categoria,
                municipalityId: categoria.municipalityId || getMunicipalityIdFromUser(),
                level: Number(categoria.level),
                parentCategoryId: categoria.parentCategoryId || null,
            });
            Swal.close();
            await Swal.fire("Creada", "La categoría ha sido creada correctamente.", "success");
            onCreated?.();
            onClose?.();
        } catch (error) {
            console.error("Error al crear categoría:", error);
            Swal.close();
            Swal.fire("Error", "No se pudo crear la categoría.", "error");
        }
    };
    return (
        <div className="fixed inset-0 bg-gray-900/75 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col animate-fadeInScale">
                { }
                <div className="px-6 py-5 flex-shrink-0 flex justify-between items-center bg-blue-600 rounded-t-3xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white shadow-inner">
                            <FaPlusCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Crear Categoría</h2>
                            <p className="text-blue-100 text-xs font-medium">Registra una nueva categoría</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-all duration-200"
                        title="Cerrar"
                    >
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
                                        value={categoria.categoryCode}
                                        readOnly
                                        className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-slate-800 font-semibold cursor-not-allowed border-0"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Generado automáticamente</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nivel</label>
                                    <input
                                        type="number"
                                        name="level"
                                        value={categoria.level ?? 0}
                                        min={0}
                                        onChange={(e) =>
                                            handleChange({
                                                target: {
                                                    name: "level",
                                                    value: Math.max(0, Number(e.target.value)),
                                                },
                                            })
                                        }
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
                                        value={categoria.name || ""}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s]/g, "");
                                            setCategoria((prev) => ({ ...prev, name: value }));
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
                                            value={categoria.parentCategoryId || ""}
                                            onChange={handleChange}
                                            className="w-full appearance-none px-4 pr-10 py-2.5 bg-white rounded-xl text-slate-800 border-0 focus:ring-2 focus:ring-indigo-500/20"
                                        >
                                            <option value="">— Ninguna —</option>
                                            {categoriasPadre.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
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
                                        value={categoria.description || ""}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-4 py-2.5 bg-white rounded-xl text-slate-800 border-0 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                                    />
                                </div>
                                {categoria.parentCategoryId && (
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nivel de Categoría Padre</label>
                                        <div className="w-full px-4 py-2.5 bg-white rounded-xl text-slate-800 flex items-center gap-2">
                                            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                                {allCategories.find((c) => c.id === categoria.parentCategoryId)?.level || "—"}
                                            </span>
                                            <span className="text-sm">{allCategories.find((c) => c.id === categoria.parentCategoryId)?.name}</span>
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
                                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-100 text-slate-700 hover:border-indigo-200 transition-colors">
                                    <input type="checkbox" name="requiresSerial" checked={categoria.requiresSerial} onChange={handleChange} />
                                    <span className="text-sm font-medium">Requiere Serie</span>
                                </label>
                                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-100 text-slate-700 hover:border-indigo-200 transition-colors">
                                    <input type="checkbox" name="requiresPlate" checked={categoria.requiresPlate} onChange={handleChange} />
                                    <span className="text-sm font-medium">Requiere Placa</span>
                                </label>
                                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-100 text-slate-700 hover:border-indigo-200 transition-colors">
                                    <input type="checkbox" name="isInventoriable" checked={categoria.isInventoriable} onChange={handleChange} />
                                    <span className="text-sm font-medium">Inventariable</span>
                                </label>
                            </div>
                        </div>
                        { }
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 bg-gray-100 text-slate-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                            >
                                Crear
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default CrearCategoria;