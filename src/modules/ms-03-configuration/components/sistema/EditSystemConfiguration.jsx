import React, { useState, useEffect } from "react";
import { updateSystemConfiguration } from "../../services/apisystemconfigurations";
import Swal from "sweetalert2";
import { getMunicipalityId } from '../../../../shared/utils/municipalityHelper.js';
const REGEX_PRESETS = {
    "letters_spaces": { label: "Solo letras y espacios", pattern: "^[A-Za-zÁÉÍÓÚáéíóúñÑ ]+$", example: "Juan Pérez" },
    "alphanumeric": { label: "Texto alfanumérico", pattern: "^[A-Za-z0-9 ]+$", example: "Usuario123 Test" },
    "code_format": { label: "Código sin espacios (letras, números, guion y guion bajo)", pattern: "^[A-Za-z0-9_-]+$", example: "codigo-123_v2" },
    "positive_int": { label: "Entero positivo", pattern: "^[0-9]+$", example: "12345" },
    "int_signed": { label: "Entero positivo o negativo", pattern: "^-?[0-9]+$", example: "-500" },
    "decimal": { label: "Decimal con punto", pattern: "^[0-9]+(\\.[0-9]+)?$", example: "123.45" },
    "date_iso": { label: "Fecha YYYY-MM-DD", pattern: "^\\d{4}-\\d{2}-\\d{2}$", example: "2025-11-30" },
    "date_dmyslash": { label: "Fecha DD/MM/YYYY", pattern: "^\\d{2}\\/\\d{2}\\/\\d{4}$", example: "30/11/2025" },
    "time_24h": { label: "Hora HH:MM (24h)", pattern: "^([01]\\d|2[0-3]):[0-5]\\d$", example: "14:30" },
    "email": { label: "Correo electrónico", pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", example: "usuario@example.com" },
    "password": { label: "Contraseña (8+ car, mayús, minús, número)", pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$", example: "Password123" },
};
const SystemConfigurationEditModal = ({ config, onClose, onUpdated }) => {
    const [formData, setFormData] = useState({
        category: "",
        key: "",
        value: "",
        dataType: "string",
        description: "",
        isEditable: true,
        requiresRestart: false,
        isSensitive: false,
        minimumValue: "",
        maximumValue: "",
        allowedValues: [],
        validationPattern: null,
        updatedAt: new Date().toISOString(),
    });
    const [newAllowedValue, setNewAllowedValue] = useState("");
    const [selectedPreset, setSelectedPreset] = useState("");
    useEffect(() => {
        if (config) {
            let initialValue = config.value ?? "";
            if (config.dataType === "boolean") {
                initialValue = initialValue === true || initialValue === "true";
            }
            setFormData({
                category: config.category || "",
                key: config.key || "",
                value: initialValue,
                dataType: config.dataType || "string",
                description: config.description || "",
                isEditable: config.isEditable ?? true,
                requiresRestart: config.requiresRestart ?? false,
                isSensitive: config.isSensitive ?? false,
                minimumValue: config.minimumValue ?? "",
                maximumValue: config.maximumValue ?? "",
                allowedValues: Array.isArray(config.allowedValues)
                    ? config.allowedValues
                    : config.allowedValues
                        ? config.allowedValues.split(",").map((v) => v.trim())
                        : [],
                validationPattern: config.validationPattern || null,
                updatedAt: new Date().toISOString(),
            });
            if (config.validationPattern) {
                const match = Object.entries(REGEX_PRESETS).find(([, v]) => v.pattern === config.validationPattern);
                setSelectedPreset(match ? match[0] : "");
            } else {
                setSelectedPreset("");
            }
        }
    }, [config]);
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === "dataType") {
            setFormData((prev) => ({
                ...prev,
                dataType: value,
                allowedValues: [],
                value: "",
                validationPattern: value === "string" ? prev.validationPattern : null,
                minimumValue: value === "number" ? prev.minimumValue : "",
                maximumValue: value === "number" ? prev.maximumValue : "",
            }));
            return;
        }
        if (name === "regexPreset") {
            setSelectedPreset(value);
            const pattern = value ? REGEX_PRESETS[value].pattern : "";
            setFormData({
                ...formData,
                validationPattern: pattern || null,
                allowedValues: [],
            });
            return;
        }
        if (name === "validationPattern") {
            setFormData({
                ...formData,
                validationPattern: value || null,
                allowedValues: [],
            });
            return;
        }
        if (name === "category") {
            const sanitized = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúñÑ ]/g, "");
            setFormData({ ...formData, [name]: sanitized });
            return;
        }
        if (name === "key") {
            const sanitized = value.replace(/[^A-Za-z0-9_-]/g, "");
            setFormData({ ...formData, [name]: sanitized });
            return;
        }
        setFormData({
            ...formData,
            [name]:
                type === "checkbox"
                    ? checked
                    : type === "number"
                        ? value === "" ? "" : Number(value)
                        : value,
        });
    };
    const handleAddAllowedValue = () => {
        if (formData.dataType === "boolean") {
            if (newAllowedValue !== "true" && newAllowedValue !== "false") {
                Swal.fire("Valor inválido", "Solo se permiten true/false.", "warning");
                return;
            }
        }
        const trimmed =
            formData.dataType === "boolean"
                ? (newAllowedValue === "true" ? true : false)
                : newAllowedValue.trim();
        if (trimmed === "" && formData.dataType !== "boolean") return;
        if (formData.allowedValues.includes(trimmed)) {
            Swal.fire("Valor duplicado", "Este valor ya está en la lista.", "warning");
            return;
        }
        setFormData({
            ...formData,
            allowedValues: [...formData.allowedValues, trimmed],
        });
        setNewAllowedValue("");
    };
    const handleRemoveAllowedValue = (val) => {
        setFormData({
            ...formData,
            allowedValues: formData.allowedValues.filter((v) => v !== val),
        });
    };
    const handleAddBothBoolean = () => {
        if (formData.dataType !== "boolean") return;
        const merged = Array.from(new Set([...
            formData.allowedValues,
            true,
            false,
        ]));
        setFormData({ ...formData, allowedValues: merged });
    };
    const handleClearAllowedValues = () => {
        setFormData({ ...formData, allowedValues: [] });
    };
    const validarCampos = () => {
        const errores = [];
        const camposObligatorios = [
            { campo: "category", label: "Categoría" },
            { campo: "key", label: "Clave" },
            { campo: "value", label: "Valor" },
            { campo: "description", label: "Descripción" },
        ];
        for (let item of camposObligatorios) {
            const valor = formData[item.campo];
            if (valor === "" || valor === null || valor === undefined) {
                errores.push(`El campo "${item.label}" no puede estar vacío.`);
                continue;
            }
            if (item.campo === "category" && /\d/.test(valor)) {
                errores.push(`El campo "${item.label}" no puede contener números.`);
            }
        }
        const { value, minimumValue, maximumValue, allowedValues, dataType, validationPattern } = formData;
        if (dataType === "boolean" && (!Array.isArray(allowedValues) || allowedValues.length === 0)) {
            errores.push("Para el tipo boolean, debe definir al menos un valor permitido (true o false).");
        }
        if (dataType === "string" && (!Array.isArray(allowedValues) || allowedValues.length === 0)) {
            errores.push("Para el tipo string, debe definir al menos un valor permitido.");
        }
        if (dataType === "number" && (!Array.isArray(allowedValues) || allowedValues.length === 0)) {
            errores.push("Para el tipo number, debe definir al menos un valor permitido dentro del rango definido.");
        }
        if (dataType === "number") {
            if (value === "" || minimumValue === "" || maximumValue === "") {
                errores.push("Value, mínimo y máximo deben estar completos para tipo number.");
            } else if (isNaN(value) || isNaN(minimumValue) || isNaN(maximumValue)) {
                errores.push("Value, mínimo y máximo deben ser números válidos.");
            } else {
                const v = parseFloat(value);
                const min = parseFloat(minimumValue);
                const max = parseFloat(maximumValue);
                if (v < min || v > max) errores.push(`El valor debe estar entre ${minimumValue} y ${maximumValue}.`);
                for (let av of allowedValues) {
                    const num = Number(av);
                    if (isNaN(num) || num < min || num > max) {
                        errores.push(`Valor permitido inválido: ${av}. Debe ser número dentro de ${minimumValue} - ${maximumValue}.`);
                    }
                }
            }
        }
        if (dataType === "boolean") {
            if (value !== true && value !== false && value !== "true" && value !== "false") {
                errores.push("El valor debe ser true o false para tipo boolean.");
            }
            for (let av of allowedValues) {
                if (typeof av !== "boolean") {
                    if (!(av === true || av === false || av === "true" || av === "false")) {
                        errores.push(`Valor permitido inválido: ${av}. Debe ser true o false.`);
                    }
                }
            }
        }
        if (dataType === "string") {
            if (!selectedPreset) {
                errores.push("Debe seleccionar un preset de validación para el tipo string.");
            }
            let regexInst = null;
            if (validationPattern) {
                try {
                    regexInst = new RegExp(validationPattern);
                } catch (err) {
                    errores.push("El patrón de validación no es válido.");
                }
            }
            if (regexInst) {
                for (let av of allowedValues) {
                    const texto = typeof av === "string" ? av : String(av);
                    if (!regexInst.test(texto)) {
                        errores.push(`El valor permitido "${texto}" no coincide con el patrón de validación.`);
                    }
                }
            }
        }
        if (errores.length > 0) {
            const lista = errores.map((err, i) => `<li style="margin-bottom:8px;color:#d97706;">${i + 1}. ${err}</li>`).join("");
            Swal.fire({
                title: "Errores en el formulario",
                html: `<ul style="text-align:left; padding-left: 18px;">${lista}</ul>`,
                icon: "warning",
                confirmButtonText: "Entendido",
            });
            return false;
        }
        return true;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validarCampos()) return;
        const confirm = await Swal.fire({
            title: "¿Guardar cambios?",
            text: "Se actualizará la configuración seleccionada.",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#2563eb",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, guardar",
            cancelButtonText: "Cancelar",
        });
        if (!confirm.isConfirmed) return;
        try {
            const payload = {
                ...formData,
                municipalityId: getMunicipalityId() || "24ad12a5-d9e5-4cdd-91f1-8fd0155c9471",
                value:
                    formData.dataType === "number"
                        ? Number(formData.value)
                        : formData.dataType === "boolean"
                            ? (formData.value === true || formData.value === "true")
                            : formData.value,
                minimumValue: formData.dataType === "number" ? Number(formData.minimumValue) : formData.minimumValue,
                maximumValue: formData.dataType === "number" ? Number(formData.maximumValue) : formData.maximumValue,
                allowedValues:
                    formData.dataType === "number"
                        ? formData.allowedValues.map(Number)
                        : formData.allowedValues,
                updatedAt: new Date().toISOString(),
            };
            await updateSystemConfiguration(config.id, payload);
            Swal.fire("Actualizado", "La configuración fue modificada correctamente.", "success");
            onUpdated();
            onClose();
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo actualizar la configuración.", "error");
        }
    };
    const headerId = "system-config-edit-title";
    const renderSectionTitle = (title, subtitle) => (
        <div className="col-span-2 mt-2">
            <div className="flex items-center gap-2 text-gray-800">
                <h4 className="font-semibold text-base">{title}</h4>
            </div>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
    );
    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center items-center" aria-labelledby={headerId} role="dialog" aria-modal="true">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                <div className="sticky top-0 z-10 bg-blue-600 text-white px-8 py-6 border-b border-blue-700">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div>
                                <h3 id={headerId} className="text-2xl font-bold">Editar Configuración</h3>
                                <p className="text-sm text-blue-100 mt-1">Actualice parámetros, validaciones y valores permitidos.</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition" aria-label="Cerrar modal">✕</button>
                    </div>
                </div>
                <div className="max-h-[75vh] overflow-y-auto p-6 bg-slate-50">
                    <div className="bg-white rounded-3xl shadow-sm p-6">
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {renderSectionTitle("General", "Información básica de la configuración")}
                            {}
                            <div>
                                <label className="block font-semibold mb-1 text-gray-700">Categoría</label>
                                <input
                                    type="text"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    placeholder="Ej: Sistema, Seguridad, UI"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">Solo letras y espacios.</p>
                            </div>
                            <div>
                                <label className="block font-semibold mb-1 text-gray-700">Clave</label>
                                <input
                                    type="text"
                                    name="key"
                                    value={formData.key}
                                    onChange={handleChange}
                                    placeholder="Ej: max_items, theme-color, feature_x"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">Letras, números, guion y guion bajo. Sin espacios.</p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block font-semibold mb-1 text-gray-700">Descripción</label>
                                <input
                                    type="text"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Breve descripción de la configuración"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            {renderSectionTitle("Tipo y Valor", "Seleccione el tipo y su valor")}
                            {}
                            <div>
                                <label className="block font-semibold mb-1 text-gray-700">Tipo de dato</label>
                                <select
                                    name="dataType"
                                    value={formData.dataType}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="string">string</option>
                                    <option value="number">number</option>
                                    <option value="boolean">boolean</option>
                                </select>
                            </div>
                            {}
                            <div>
                                <label className="block font-semibold mb-1 text-gray-700">Valor</label>
                                {formData.dataType === "boolean" ? (
                                    <select
                                        name="value"
                                        value={formData.value === "" ? "" : (formData.value === true || formData.value === "true") ? "true" : "false"}
                                        onChange={(e) =>
                                            handleChange({
                                                target: {
                                                    name: "value",
                                                    value: e.target.value === "true" ? true : false,
                                                    type: "select-one",
                                                },
                                            })
                                        }
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    >
                                        <option value="">Seleccione</option>
                                        <option value="true">true</option>
                                        <option value="false">false</option>
                                    </select>
                                ) : formData.dataType === "number" ? (
                                    <input
                                        type="number"
                                        name="value"
                                        value={formData.value}
                                        onChange={handleChange}
                                        placeholder="Ingrese valor numérico"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        name="value"
                                        value={formData.value}
                                        onChange={handleChange}
                                        placeholder="Ingrese valor"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                )}
                                {formData.dataType === "number" && (
                                    <p className="text-xs text-gray-500 mt-1">Asegúrese de definir el mínimo y máximo.</p>
                                )}
                            </div>
                            {}
                            {formData.dataType === "number" && (
                                <>
                                    <div>
                                        <label className="block font-semibold mb-1 text-gray-700">Valor mínimo</label>
                                        <input
                                            type="number"
                                            name="minimumValue"
                                            value={formData.minimumValue}
                                            onChange={handleChange}
                                            placeholder="Ingrese valor mínimo"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-semibold mb-1 text-gray-700">Valor máximo</label>
                                        <input
                                            type="number"
                                            name="maximumValue"
                                            value={formData.maximumValue}
                                            onChange={handleChange}
                                            placeholder="Ingrese valor máximo"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </>
                            )}
                            {}
                            {formData.dataType === "string" && (
                                <div className="col-span-2">
                                    {renderSectionTitle("Validación", "Use un preset o defina su propio patrón")}
                                    <label className="block font-semibold mb-1 text-gray-700">Presets de validación</label>
                                    <select
                                        name="regexPreset"
                                        value={selectedPreset}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none mb-2"
                                    >
                                        <option value="" disabled>-- Seleccionar un preset --</option>
                                        {Object.entries(REGEX_PRESETS).map(([key, { label, example }]) => (
                                            <option key={key} value={key}>{label} (ej: {example})</option>
                                        ))}
                                    </select>
                                    {selectedPreset && (
                                        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                                            <p className="text-xs text-blue-700 font-semibold">Ejemplo:</p>
                                            <p className="text-sm text-blue-900 font-mono">{REGEX_PRESETS[selectedPreset].example}</p>
                                        </div>
                                    )}
                                    <label className="block font-semibold mb-1 text-gray-700 mt-3">Patrón de validación (regex)</label>
                                    <input
                                        type="text"
                                        name="validationPattern"
                                        value={formData.validationPattern || ""}
                                        onChange={handleChange}
                                        readOnly
                                        disabled
                                        placeholder="Ej: ^[A-Za-z0-9]+$"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-100"
                                    />
                                </div>
                            )}
                            {renderSectionTitle("Valores permitidos", "Defina la lista de valores que se aceptarán")}
                            {}
                            <div className="col-span-2">
                                <div className="flex flex-wrap gap-2 mb-2 min-h-[34px]">
                                    {formData.allowedValues.length === 0 ? (
                                        <span className="text-xs text-gray-400">No hay valores añadidos.</span>
                                    ) : (
                                        formData.allowedValues.map((val, i) => (
                                            <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                                                {val.toString()}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveAllowedValue(val)}
                                                    className="text-red-500 hover:text-red-700 font-bold"
                                                    aria-label={`Eliminar ${val}`}
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {formData.dataType === "boolean" ? (
                                        <select
                                            value={newAllowedValue}
                                            onChange={(e) => setNewAllowedValue(e.target.value)}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        >
                                            <option value="">Seleccione</option>
                                            <option value="true">true</option>
                                            <option value="false">false</option>
                                        </select>
                                    ) : (
                                        <input
                                            value={newAllowedValue}
                                            onChange={(e) => setNewAllowedValue(e.target.value)}
                                            placeholder={formData.dataType === "number" ? "Agregar número" : "Agregar valor"}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAllowedValue())}
                                        />
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleAddAllowedValue}
                                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                                    >
                                        Añadir
                                    </button>
                                    {formData.dataType === "boolean" && (
                                        <button
                                            type="button"
                                            onClick={handleAddBothBoolean}
                                            className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                                        >
                                            Añadir true/false
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleClearAllowedValues}
                                        className="px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                                    >
                                        Limpiar
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Presione Enter para añadir rápidamente. Para números, respete el rango definido.
                                </p>
                            </div>
                            {renderSectionTitle("Opciones avanzadas", "Ajustes adicionales de la configuración")}
                            {}
                            <div className="col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
                                {[
                                    ["requiresRestart", "¿Requiere reinicio?"],
                                    ["isSensitive", "¿Es sensible?"],
                                    ["isEditable", "¿Es editable?"],
                                ].map(([name, label]) => (
                                    <label key={name} className="flex items-center gap-2 text-gray-700">
                                        <input
                                            type="checkbox"
                                            name={name}
                                            checked={!!formData[name]}
                                            onChange={handleChange}
                                            className="rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        {label}
                                    </label>
                                ))}
                            </div>
                        </form>
                    </div>
                </div>
                <div className="sticky bottom-0 z-10 bg-white/95 px-8 py-4 border-t flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                        Guardar cambios
                    </button>
                </div>
            </div>
        </div>
    );
};
export default SystemConfigurationEditModal;
