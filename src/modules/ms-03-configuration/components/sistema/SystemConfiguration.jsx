import React, { useEffect, useState } from "react";
import SystemConfigurationEditModal from "./EditSystemConfiguration";
import CreateSystemConfiguration from "./createSystemConfiguration";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SystemConfigReport from "../../reports/SystemConfigReport";
import { getMunicipalidadById } from "../../../ms-01-tenant-management/services/municipalidadService.js";
import { getMunicipalityId } from "../../../../shared/utils/municipalityHelper.js";
import {
    getAllSystemConfigurations,
    softDeleteSystemConfiguration,
    restoreSystemConfiguration,
} from "../../services/apisystemconfigurations";
import { FaEdit, FaSearch, FaEye, FaTrash, FaUndo, FaPlus, FaLayerGroup } from "react-icons/fa";
import Swal from "sweetalert2";
import Paginator from "../../../../shared/utils/Paginator";
const SystemConfigurationList = () => {
    const [configs, setConfigs] = useState([]);
    const [filteredConfigs, setFilteredConfigs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedConfig, setSelectedConfig] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [editableFilter, setEditableFilter] = useState("all");
    const [municipalityName, setMunicipalityName] = useState('Municipalidad');
    const [municipalityError, setMunicipalityError] = useState(null);
    const fetchConfigurations = async () => {
        try {
            setLoading(true);
            const data = await getAllSystemConfigurations();
            setConfigs(data);
            setFilteredConfigs(data);
        } catch (err) {
            console.error("Error al obtener configuraciones del sistema:", err);
            Swal.fire("Error", "No se pudieron cargar las configuraciones.", "error");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchConfigurations();
    }, []);

    useEffect(() => {
        const loadMunicipalityName = async () => {
            const municipalityId = getMunicipalityId();
            if (!municipalityId) {
                setMunicipalityError('No se pudo detectar municipalityId en el login');
                return;
            }

            try {
                setMunicipalityError(null);
                const municipality = await getMunicipalidadById(municipalityId);
                setMunicipalityName(municipality.nombre || municipality.name || 'Municipalidad');
            } catch (err) {
                console.error('Error al cargar el nombre de la municipalidad:', err);
                setMunicipalityError('No se pudo cargar el nombre de la municipalidad');
            }
        };

        loadMunicipalityName();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, configs, itemsPerPage, editableFilter]);
    useEffect(() => {
        let filtered = configs.filter(
            (c) =>
                c.key?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.category?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.value?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.dataType?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (editableFilter === "editable") {
            filtered = filtered.filter((c) => !!c.isEditable);
        } else if (editableFilter === "notEditable") {
            filtered = filtered.filter((c) => !c.isEditable);
        }
        setFilteredConfigs(filtered);
    }, [searchTerm, configs, editableFilter]);
    const formatDate = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString + "Z");
        return date.toLocaleString("es-PE", {
            timeZone: "America/Lima",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };
    const formatBoolean = (value) => {
        if (value === true) return "Sí";
        if (value === false) return "No";
        return "—";
    };
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "¿Desactivar configuración?",
            text: "Esta acción marcará la configuración como no editable.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, desactivar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
        });
        if (result.isConfirmed) {
            try {
                await softDeleteSystemConfiguration(id);
                Swal.fire("Desactivada", "La configuración fue marcada como no editable.", "success");
                fetchConfigurations();
            } catch (error) {
                Swal.fire("Error", "No se pudo desactivar la configuración.", "error");
            }
        }
    };
    const handleRestore = async (id) => {
        const result = await Swal.fire({
            title: "¿Restaurar configuración?",
            text: "La configuración volverá a estar editable.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, restaurar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#28a745",
            cancelButtonColor: "#6c757d",
        });
        if (result.isConfirmed) {
            try {
                await restoreSystemConfiguration(id);
                Swal.fire("Restaurada", "La configuración fue restaurada exitosamente.", "success");
                fetchConfigurations();
            } catch (error) {
                Swal.fire("Error", "No se pudo restaurar la configuración.", "error");
            }
        }
    };
    const excludedFields = ["id", "createdBy", "updatedBy", "municipalityId"];
    const detailOrder = [
        "municipalityId",
        "category",
        "key",
        "value",
        "dataType",
        "description",
        "isEditable",
        "requiresRestart",
        "isSensitive",
        "minimumValue",
        "maximumValue",
        "allowedValues",
        "validationPattern",
    ];
    const fieldLabels = {
        municipalityId: "Municipalidad ID",
        category: "Categoría",
        key: "Clave",
        value: "Valor",
        dataType: "Tipo de dato",
        description: "Descripción",
        isEditable: "¿Es editable?",
        requiresRestart: "¿Requiere reinicio?",
        isSensitive: "¿Es sensible?",
        minimumValue: "Valor mínimo",
        maximumValue: "Valor máximo",
        allowedValues: "Valores permitidos",
        validationPattern: "Patrón de validación",
    };
    const totalConfigs = filteredConfigs.length;
    const totalEditable = filteredConfigs.filter((c) => c.isEditable).length;
    const totalNotEditable = filteredConfigs.filter((c) => !c.isEditable).length;
    const totalRestartRequired = filteredConfigs.filter((c) => c.requiresRestart).length;

    return (
        <div className="p-8 space-y-8 bg-gray-50 rounded-2xl shadow-md border border-gray-200">
            <div className="bg-blue-600 shadow-lg rounded-2xl">
                <div className="px-6 py-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white shadow-inner">
                                <FaLayerGroup className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-extrabold text-white tracking-tight">
                                    Configuraciones del Sistema
                                </h2>
                                <p className="text-sm text-blue-100 mt-1">
                                    Administra claves, valores y permisos de configuración del sistema.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-transparent border-2 border-white/70 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-200 text-sm"
                            >
                                <FaPlus /> Nueva Configuración
                            </button>
                            <PDFDownloadLink
                                document={<SystemConfigReport configs={filteredConfigs} entity={municipalityName} />}
                                fileName="reporte_configuraciones.pdf"
                                className="flex items-center justify-center px-5 py-2.5 bg-white text-blue-600 rounded-xl font-semibold text-sm"
                            >
                                {({ loading }) => loading ? "Generando..." : "Generar Reporte PDF"}
                            </PDFDownloadLink>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-3xl shadow-sm p-5">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border-l-4 border-l-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total de configuraciones</p>
                        <p className="text-3xl font-bold text-slate-800">{totalConfigs}</p>
                    </div>
                    <div className="bg-white border-l-4 border-l-green-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Editable</p>
                        <p className="text-3xl font-bold text-slate-800">{totalEditable}</p>
                    </div>
                    <div className="bg-white border-l-4 border-l-gray-400 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">No editable</p>
                        <p className="text-3xl font-bold text-slate-800">{totalNotEditable}</p>
                    </div>
                    <div className="bg-white border-l-4 border-l-amber-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Requiere reinicio</p>
                        <p className="text-3xl font-bold text-slate-800">{totalRestartRequired}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                            Buscar
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaSearch className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Ej: seguridad, login, valor, tipo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                            Estado
                        </label>
                        <div className="relative">
                            <select
                                value={editableFilter}
                                onChange={(e) => setEditableFilter(e.target.value)}
                                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                            >
                                <option value="all">Todas</option>
                                <option value="editable">Editable</option>
                                <option value="notEditable">No editable</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {loading ? (
                <p className="text-center text-gray-500 italic py-6">Cargando configuraciones...</p>
            ) : filteredConfigs.length === 0 ? (
                <p className="text-center text-gray-500 italic py-6">
                    No hay configuraciones que coincidan.
                </p>
            ) : (
                (() => {
                    const totalItems = filteredConfigs.length;
                    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const paginated = filteredConfigs.slice(startIndex, endIndex);
                    return (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {paginated.map((config) => (
                                    <div
                                        key={config.id}
                                        className="bg-white p-5 rounded-2xl shadow hover:shadow-lg border border-gray-200 transition-all duration-200 relative"
                                    >
                                        <h3 className="text-lg font-bold text-gray-800 mb-2 capitalize">
                                            {config.category}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-1">
                                            <span className="font-semibold text-gray-700">Clave:</span>{" "}
                                            {config.key}
                                        </p>
                                        <p className="text-sm text-gray-600 mb-1">
                                            <span className="font-semibold text-gray-700">Valor:</span>{" "}
                                            {config.value}
                                        </p>
                                        <p className="text-sm text-gray-600 mb-1">
                                            <span className="font-semibold text-gray-700">Tipo:</span>{" "}
                                            {config.dataType}
                                        </p>
                                        <div className="flex justify-between items-center mt-3 text-sm">
                                            <span
                                                className={`font-semibold ${config.isEditable
                                                    ? "text-green-600"
                                                    : "text-gray-500"
                                                    }`}
                                            >
                                                {config.isEditable ? "Editable" : "No editable"}
                                            </span>
                                            <span
                                                className={`font-semibold ${config.requiresRestart
                                                    ? "text-amber-600"
                                                    : "text-gray-500"
                                                    }`}
                                            >
                                                {config.requiresRestart ? "Requiere reinicio" : "Normal"}
                                            </span>
                                        </div>
                                        <div className="flex justify-end items-center gap-3 mt-4">
                                            <button
                                                className="text-gray-600 hover:text-blue-600 transition"
                                                title="Ver detalles"
                                                onClick={() => {
                                                    setSelectedConfig(config);
                                                    setShowDetails(true);
                                                }}
                                            >
                                                <FaEye />
                                            </button>
                                            {config.isEditable && (
                                                <button
                                                    className="text-blue-600 hover:text-blue-800 transition"
                                                    title="Editar configuración"
                                                    onClick={() => {
                                                        setSelectedConfig(config);
                                                        setShowEditModal(true);
                                                    }}
                                                >
                                                    <FaEdit />
                                                </button>
                                            )}
                                            {config.isEditable ? (
                                                <button
                                                    className="text-red-600 hover:text-red-800 transition"
                                                    title="Desactivar configuración"
                                                    onClick={() => handleDelete(config.id)}
                                                >
                                                    <FaTrash />
                                                </button>
                                            ) : (
                                                <button
                                                    className="text-green-600 hover:text-green-800 transition"
                                                    title="Restaurar configuración"
                                                    onClick={() => handleRestore(config.id)}
                                                >
                                                    <FaUndo />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <Paginator
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalItems={totalItems}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={(p) => setCurrentPage(p)}
                                    onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
                                    pageSizeOptions={[5, 10, 25, 50]}
                                    showPageInfo={true}
                                    showItemsPerPage={true}
                                />
                            </div>
                        </>
                    );
                })()
            )}
            {showDetails && selectedConfig && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center items-center">
                    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                        <div className="sticky top-0 z-10 bg-blue-600 text-white px-8 py-6 border-b border-blue-700">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div>
                                        <h3 className="text-2xl font-bold">Detalles de Configuración</h3>
                                        <p className="text-sm text-blue-100 mt-1">Revise los parámetros, estados y validaciones de la configuración.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowDetails(false)}
                                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
                                    aria-label="Cerrar modal"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2 text-xs">
                                <span className={`px-2 py-1 rounded-full border ${selectedConfig.isEditable ? 'bg-white/20 text-white border-white/40' : 'bg-white/15 text-white/70 border-white/30'}`}>
                                    {selectedConfig.isEditable ? 'Editable' : 'No editable'}
                                </span>
                                <span className={`px-2 py-1 rounded-full border ${selectedConfig.requiresRestart ? 'bg-white/20 text-white border-white/40' : 'bg-white/15 text-white/70 border-white/30'}`}>
                                    {selectedConfig.requiresRestart ? 'Requiere reinicio' : 'Sin reinicio'}
                                </span>
                                <span className={`px-2 py-1 rounded-full border ${selectedConfig.isSensitive ? 'bg-white/20 text-white border-white/40' : 'bg-white/15 text-white/70 border-white/30'}`}>
                                    {selectedConfig.isSensitive ? 'Sensible' : 'No sensible'}
                                </span>
                            </div>
                        </div>
                        <div className="max-h-[70vh] overflow-y-auto p-6 bg-slate-50">
                            <div className="mb-5">
                                <div className="flex items-center gap-2 text-gray-800 mb-2">
                                    <h4 className="font-semibold text-base">Información General</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                                    {['category','key','dataType','description'].map((key) => {
                                        const label = fieldLabels[key] || key;
                                        const value = selectedConfig[key];
                                        const displayValue = (value === null || value === '') ? '—' : value;
                                        return (
                                            <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <span className="block font-semibold capitalize text-gray-800 mb-1">{label}</span>
                                                <span className="block text-gray-600 break-words">{displayValue}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="mb-5">
                                <div className="flex items-center gap-2 text-gray-800 mb-2">
                                    <h4 className="font-semibold text-base">Valores</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                                    {['value','minimumValue','maximumValue','allowedValues'].map((key) => {
                                        const label = fieldLabels[key] || key;
                                        let value = selectedConfig[key];
                                        let displayValue = value;
                                        if (Array.isArray(value)) displayValue = value.join(', ');
                                        else if (typeof value === 'object' && value !== null) displayValue = JSON.stringify(value);
                                        else if (value === null || value === '') displayValue = (key === 'minimumValue' || key === 'maximumValue') ? 'Ninguno' : '—';
                                        return (
                                            <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <span className="block font-semibold capitalize text-gray-800 mb-1">{label}</span>
                                                <span className="block text-gray-600 break-words">{displayValue}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="mb-5">
                                <div className="flex items-center gap-2 text-gray-800 mb-2">
                                    <h4 className="font-semibold text-base">Validación</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                                    {['validationPattern'].map((key) => {
                                        const label = fieldLabels[key] || key;
                                        const value = selectedConfig[key];
                                        const displayValue = (value === null || value === '') ? 'NINGUNO' : value;
                                        return (
                                            <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-100 md:col-span-2">
                                                <span className="block font-semibold capitalize text-gray-800 mb-1">{label}</span>
                                                <span className="block text-gray-600 break-words font-mono text-xs">{displayValue}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="sticky bottom-0 z-10 bg-white/90 backdrop-blur px-6 py-4 border-t flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDetails(false)}
                                className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showEditModal && selectedConfig && (
                <SystemConfigurationEditModal
                    config={selectedConfig}
                    onClose={() => setShowEditModal(false)}
                    onUpdated={fetchConfigurations}
                />
            )}
            {showCreateModal && (
                <CreateSystemConfiguration
                    onClose={() => setShowCreateModal(false)}
                    onCreated={fetchConfigurations}
                />
            )}
        </div>
    );
};
export default SystemConfigurationList;