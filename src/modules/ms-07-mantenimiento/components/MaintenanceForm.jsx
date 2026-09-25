import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import DateFieldGroup from "./DateFieldGroup";
import {
  TYPE_LABELS,
  PRIORITY_LABELS,
} from "../constants/maintenance.constants";

const initialFormState = {
  assetId: "",
  maintenanceType: "",
  priority: "",
  scheduledDate: "",
  workDescription: "",
  reportedProblem: "",
  observations: "",
  technicalResponsibleId: "",
  serviceSupplierId: "",
  supervisorId: "",
  laborCost: "",
  additionalCost: "",
  hasCosts: false,
  hasWarranty: false,
  warrantyExpirationDate: "",
  serviceReference: "",
  executionDays: 1,
};

const typePriorityMap = {
  PREVENTIVE: "LOW",
  PREDICTIVE: "MEDIUM",
  CORRECTIVE: "HIGH",
  EMERGENCY: "CRITICAL",
};

export default function MaintenanceForm({
  isOpen,
  onClose,
  onSave,
  maintenance = null,
  assets = [],
  users = [],
  persons = [],
  suppliers = [],
  saving = false,
}) {
  const isEditing = !!maintenance;
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [assetQuery, setAssetQuery] = useState("");
  // Lock de proveedor por garantía vigente
  const [warrantyLockSupplier, setWarrantyLockSupplier] = useState(false);
  const [lockedSupplierName, setLockedSupplierName] = useState("");

  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const getAddMonthsStr = (months) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + months);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const day = Math.min(new Date().getDate(), lastDay);
    d.setDate(day);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const getAssetLabel = (asset) => {
    if (!asset) return "";
    const code = asset.assetCode || asset.codigoPatrimonial || "";
    const desc = asset.description || asset.descripcion || asset.id;
    return `${code} — ${desc}`.trim();
  };

  const getPersonLabel = (person) => {
    if (!person) return "";
    return (
      person.fullName ||
      `${person.firstName || ""} ${person.lastName || ""}`.trim() ||
      person.documentNumber ||
      String(person.id)
    );
  };

  const getWarrantyStatus = () => {
    if (!form.hasWarranty || !form.warrantyExpirationDate) {
      return {
        label: "Sin Garantía",
        className: "bg-slate-200 text-slate-500",
      };
    }

    const parts = form.warrantyExpirationDate.split("-");
    if (parts.length !== 3)
      return { label: "Vigente", className: "bg-emerald-100 text-emerald-700" };

    const [y, m, d] = parts.map(Number);
    if (!y || !m || !d)
      return { label: "Vigente", className: "bg-emerald-100 text-emerald-700" };

    const today = new Date();
    const todayMid = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const expDate = new Date(y, m - 1, d);
    const diffDays = Math.floor(
      (expDate.getTime() - todayMid.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0)
      return { label: "Vencida", className: "bg-rose-100 text-rose-700" };
    if (diffDays <= 3)
      return { label: "Por vencer", className: "bg-amber-100 text-amber-700" };
    return { label: "Vigente", className: "bg-emerald-100 text-emerald-700" };
  };

  // Evalúa si la garantía de un activo está vigente
  const evaluateAssetWarranty = (asset) => {
    const warrantyDate =
      asset?.warrantyExpirationDate ||
      asset?.fechaGarantia ||
      asset?.garantiaHasta;
    if (!warrantyDate) return { isActive: false, date: null };
    const today = getTodayStr();
    const isActive = String(warrantyDate).slice(0, 10) >= today;
    return { isActive, date: warrantyDate };
  };

  useEffect(() => {
    if (maintenance) {
      const sDate = maintenance.scheduledDate || "";
      if (sDate.length === 10) {
        const [y, m, d] = sDate.split("-");
        setDay(d);
        setMonth(m);
        setYear(y);
      } else {
        setDay("");
        setMonth("");
        setYear("");
      }
      const derivedPriority =
        typePriorityMap[maintenance.maintenanceType] ||
        maintenance.priority ||
        "";
      setForm({
        assetId: maintenance.assetId || "",
        maintenanceType: maintenance.maintenanceType || "",
        priority: derivedPriority,
        scheduledDate: sDate,
        workDescription: maintenance.workDescription || "",
        reportedProblem: maintenance.reportedProblem || "",
        observations: maintenance.observations || "",
        technicalResponsibleId: maintenance.technicalResponsibleId || "",
        serviceSupplierId: maintenance.serviceSupplierId || "",
        supervisorId: maintenance.supervisorId || "",
        laborCost: maintenance.laborCost ?? "",
        additionalCost: maintenance.additionalCost ?? "",
        hasCosts: maintenance.laborCost !== null && maintenance.laborCost !== undefined && maintenance.laborCost !== "",
        hasWarranty: maintenance.hasWarranty || false,
        warrantyExpirationDate: maintenance.warrantyExpirationDate || "",
        serviceReference:
          maintenance.serviceReference || maintenance.workOrder || "",
        executionDays: maintenance.executionDays ?? 1,
      });
      setShowEmergencyAlert(maintenance.maintenanceType === "EMERGENCY");
      // Al editar, evaluar garantía del activo seleccionado para re-aplicar lock si corresponde
      if (maintenance.assetId) {
        const asset = assets.find(
          (a) => String(a.id) === String(maintenance.assetId),
        );
        if (asset) {
          const { isActive } = evaluateAssetWarranty(asset);
          const hasAssetSupplier = !!asset.supplierId;
          if (isActive && hasAssetSupplier) {
            setWarrantyLockSupplier(true);
            const sup = suppliers.find(
              (s) => String(s.id) === String(asset.supplierId),
            );
            setLockedSupplierName(
              sup
                ? sup.legalName || sup.tradeName || ""
                : "Proveedor de Garantía",
            );
          } else {
            setWarrantyLockSupplier(false);
            setLockedSupplierName("");
          }
        }
      }
    } else {
      const today = new Date();
      const yearRef = today.getFullYear();
      const correlative = Math.floor(Math.random() * 9000) + 1000;
      const todayStr = `${yearRef}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      setDay(String(today.getDate()).padStart(2, "0"));
      setMonth(String(today.getMonth() + 1).padStart(2, "0"));
      setYear(String(yearRef));

      setForm({
        ...initialFormState,
        scheduledDate: todayStr,
        serviceReference: `O.S. ${yearRef}-${correlative}`,
      });
      setShowEmergencyAlert(false);
      setWarrantyLockSupplier(false);
      setLockedSupplierName("");
    }
    setErrors({});
  }, [maintenance, isOpen]);

  const availableSupervisors = useMemo(() => {
    if (!form.technicalResponsibleId) return users;
    const techPerson = persons.find(
      (p) => String(p.id) === String(form.technicalResponsibleId),
    );
    if (techPerson && techPerson.directManagerId) {
      const filtered = users.filter(
        (u) => String(u.id) === String(techPerson.directManagerId),
      );
      return filtered.length > 0 ? filtered : users;
    }
    return users;
  }, [form.technicalResponsibleId, users, persons]);

  const selectedAsset = useMemo(
    () => assets.find((a) => String(a.id) === String(form.assetId)) || null,
    [assets, form.assetId],
  );

  const filteredAssets = useMemo(() => {
    const q = assetQuery.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((a) => getAssetLabel(a).toLowerCase().includes(q));
  }, [assets, assetQuery]);

  const filteredPersons = useMemo(() => {
    return persons.filter((p) => p.status !== false);
  }, [persons]);

  const updateScheduledDate = (d, m, y) => {
    const dayPart = String(d || "").padStart(2, "0");
    const monthPart = String(m || "").padStart(2, "0");
    const yearPart = String(y || "");
    if (
      dayPart.length === 2 &&
      monthPart.length === 2 &&
      yearPart.length === 4
    ) {
      const dateStr = `${yearPart}-${monthPart}-${dayPart}`;
      handleChange("scheduledDate", dateStr);
    }
  };

  const handleChange = (field, value) => {
    let finalValue = value;
    let errMessage = null;
    const today = getTodayStr();

    // ─── Lógica de garantía y proveedor al seleccionar activo ───
    if (field === "assetId" && value) {
      const asset = assets.find((a) => String(a.id) === String(value));
      if (!asset) return;
      const { isActive, date: warrantyDate } = evaluateAssetWarranty(asset);
        const assetSupplierId = asset.supplierId
          ? String(asset.supplierId)
          : null;

        if (isActive && assetSupplierId) {
          // Garantía vigente con proveedor vinculado → auto-asignar y bloquear
          const sup = suppliers.find((s) => String(s.id) === assetSupplierId);
          const supplierName = sup
            ? sup.legalName || sup.tradeName || "Proveedor de Garantía"
            : "Proveedor de Garantía";
          setWarrantyLockSupplier(true);
          setLockedSupplierName(supplierName);
          setForm((prev) => ({
            ...prev,
            [field]: value,
            serviceSupplierId: assetSupplierId,
            warrantyExpirationDate: String(warrantyDate).slice(0, 10),
            hasWarranty: true,
          }));
        } else if (warrantyDate) {
          // Tiene fecha de garantía pero está vencida → solo llenar la fecha, proveedor libre
          setWarrantyLockSupplier(false);
          setLockedSupplierName("");
          setForm((prev) => ({
            ...prev,
            [field]: value,
            warrantyExpirationDate: String(warrantyDate).slice(0, 10),
            hasWarranty: false,
          }));
        } else {
          // Sin garantía → proveedor completamente libre
          setWarrantyLockSupplier(false);
          setLockedSupplierName("");
          setForm((prev) => ({
            ...prev,
            [field]: value,
            hasWarranty: false,
            warrantyExpirationDate: "",
          }));
        }
        return;
    }

    if (field === "scheduledDate" && value && value.length === 10) {
      const maxDate = getAddMonthsStr(1);
      if (value < today) {
        errMessage = "La fecha programada no puede ser anterior a hoy";
      } else if (value > maxDate) {
        errMessage = "Solo se permite programar hasta 1 mes de anticipación";
      } else if (value === today) {
        setShowEmergencyAlert(true);
        setForm((prev) => ({
          ...prev,
          [field]: finalValue,
          maintenanceType: "EMERGENCY",
          priority: "CRITICAL",
        }));
        setErrors((prev) => ({ ...prev, [field]: null }));
        return;
      } else {
        setShowEmergencyAlert(false);
      }
    }

    if (field === "maintenanceType") {
      let nextScheduledDate = form.scheduledDate;
      let nextDay = day,
        nextMonth = month,
        nextYear = year;

      if (value === "EMERGENCY") {
        const todayStr = getTodayStr();
        const [y, m, d] = todayStr.split("-");
        nextScheduledDate = todayStr;
        nextDay = d;
        nextMonth = m;
        nextYear = y;
        setShowEmergencyAlert(true);
      }

      setDay(nextDay);
      setMonth(nextMonth);
      setYear(nextYear);
      const nextPriority = typePriorityMap[value] || "";
      setForm((prev) => ({
        ...prev,
        [field]: value,
        priority: nextPriority,
        scheduledDate: nextScheduledDate,
      }));
      setErrors((prev) => ({ ...prev, [field]: null }));
      return;
    }

    if (field === "executionDays") {
      if (value === "") {
        finalValue = "";
      } else {
        const parsed = parseInt(value, 10);
        if (Number.isNaN(parsed)) finalValue = 1;
        else finalValue = Math.min(Math.max(parsed, 1), 30);
      }
    }

    setForm((prev) => ({ ...prev, [field]: finalValue }));
    if (errMessage) {
      setErrors((prev) => ({ ...prev, [field]: errMessage }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    const today = getTodayStr();

    if (!form.assetId) errs.assetId = "Seleccione un activo";

    if (!form.scheduledDate) {
      errs.scheduledDate =
        "La fecha programada es obligatoria (complete día, mes y año)";
    } else if (form.scheduledDate.length === 10) {
      const maxDate = getAddMonthsStr(1);
      if (form.scheduledDate < today) {
        errs.scheduledDate = "La fecha programada debe ser hoy o una fecha futura (máximo 1 mes)";
      } else if (form.scheduledDate > maxDate) {
        errs.scheduledDate = "Solo puede programar hasta 1 mes de anticipación";
      }
    } else {
      errs.scheduledDate = "Fecha incorrecta";
    }

    if (!form.maintenanceType)
      errs.maintenanceType = "Seleccione el tipo de mantenimiento";
    if (!form.priority && form.maintenanceType) {
      const autoPriority = typePriorityMap[form.maintenanceType];
      if (!autoPriority)
        errs.priority = "No se pudo asignar prioridad automática para este tipo";
    }
    if (!form.workDescription.trim())
      errs.workDescription = "La descripción es obligatoria";
    if (!form.reportedProblem.trim())
      errs.reportedProblem = "El problema reportado es obligatorio";
    if (!form.technicalResponsibleId)
      errs.technicalResponsibleId = "Seleccione un responsable técnico";

    setErrors(errs);
    return errs;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      const firstMessage = Object.values(validationErrors)[0];
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "warning",
        title: "Revise el formulario",
        text: firstMessage,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
      return;
    }

    const payload = { ...form };

    if (payload.executionDays === "" || Number.isNaN(Number(payload.executionDays))) {
      delete payload.executionDays;
    }

    if (!payload.priority && payload.maintenanceType) {
      payload.priority =
        typePriorityMap[payload.maintenanceType] || payload.priority;
    }

    if (!payload.hasCosts) {
      delete payload.laborCost;
      delete payload.additionalCost;
    }

    delete payload.hasCosts;

    if (!payload.serviceSupplierId) payload.serviceSupplierId = null;
    if (!payload.supervisorId) delete payload.supervisorId;
    if (!payload.observations) delete payload.observations;

    await onSave(payload);
  };

  if (!isOpen) return null;

  const inputClass =
    "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400";
  const selectClass = inputClass + " appearance-none cursor-pointer bg-white";
  const labelClass =
    "block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1";
  const errorClass = "text-red-500 text-[10px] font-medium mt-1 ml-1";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        onClick={onClose}
        style={{ animation: "fadeIn 0.3s ease-out" }}
      />
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col border border-white/20"
        style={{ animation: "modalEntry 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {isEditing ? "Editar Mantenimiento" : "Nuevo Mantenimiento"}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {isEditing
                ? `Referencia: ${maintenance.maintenanceCode}`
                : "Complete la información técnica para el registro"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all active:scale-90"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form
          id="maintenance-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* ── Sección: Información General ── */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                <span className="w-6 h-px bg-indigo-200" />
                General
              </h3>

              {/* Activo */}
              <div>
                <label className={labelClass}>Activo / Bien *</label>
                <div className="relative">
                  <div
                    className={`pointer-events-none absolute -inset-0.5 rounded-2xl blur-sm transition-opacity ${errors.assetId ? "bg-rose-200/70 opacity-70" : "bg-indigo-200/60 opacity-50"}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAssetPickerOpen(true);
                      setAssetQuery("");
                    }}
                    className={`relative z-10 w-full text-left pr-12 rounded-2xl bg-gradient-to-b from-white via-white to-slate-50 border-2 border-slate-200 shadow-lg shadow-slate-200/40 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-200/40 px-4 py-2.5 text-sm ${errors.assetId ? "border-rose-400" : ""}`}
                  >
                    <span
                      className={
                        selectedAsset ? "text-slate-900" : "text-slate-400"
                      }
                    >
                      {selectedAsset
                        ? getAssetLabel(selectedAsset)
                        : "Seleccionar activo..."}
                    </span>
                  </button>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M19 9l-7 7-7-7"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                {errors.assetId && (
                  <p className={errorClass}>{errors.assetId}</p>
                )}
              </div>

              {/* Orden de servicio y días */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Orden de servicio</label>
                  <input
                    type="text"
                    value={form.serviceReference}
                    disabled
                    placeholder="Generado automáticamente"
                    className={`${inputClass} bg-slate-50 text-slate-500`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Días Fuera de Servicio</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.executionDays}
                    onChange={(e) =>
                      handleChange("executionDays", e.target.value)
                    }
                    placeholder="Días"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Tipo de mantenimiento */}
              <div>
                <label className={labelClass}>Tipo de mantenimiento</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TYPE_LABELS).map(([val, lab]) => (
                    <button
                      key={val}
                      type="button"
                      disabled={showEmergencyAlert}
                      onClick={() => handleChange("maintenanceType", val)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border-2 ${
                        form.maintenanceType === val
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100"
                          : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
                      } ${showEmergencyAlert ? "opacity-70 cursor-not-allowed grayscale-[0.5]" : ""}`}
                    >
                      {lab}
                    </button>
                  ))}
                </div>
                {errors.maintenanceType && (
                  <p className={errorClass}>{errors.maintenanceType}</p>
                )}
              </div>

              {/* Prioridad (auto) */}
              <div>
                <label className={labelClass}>Prioridad</label>
                <div className="flex bg-slate-50 p-1 rounded-xl gap-1 border border-slate-100">
                  {Object.entries(PRIORITY_LABELS).map(([val, lab]) => (
                    <button
                      key={val}
                      type="button"
                      disabled
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        form.priority === val
                          ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                          : "text-slate-400"
                      } opacity-70 cursor-not-allowed`}
                    >
                      {lab}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-2 ml-1">
                  La prioridad se asigna automáticamente según el tipo.
                </p>
              </div>
            </div>

            {/* ── Sección: Programación ── */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                <span className="w-6 h-px bg-indigo-200" />
                Programación
              </h3>

              <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50">
                <label className={labelClass}>Fecha Programada *</label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    {
                      label: "Día",
                      placeholder: "DD",
                      value: day,
                      maxLen: 2,
                      onChange: (val) => {
                        setDay(val);
                        updateScheduledDate(val.padStart(2, "0"), month, year);
                      },
                    },
                    {
                      label: "Mes",
                      placeholder: "MM",
                      value: month,
                      maxLen: 2,
                      onChange: (val) => {
                        setMonth(val);
                        updateScheduledDate(day, val.padStart(2, "0"), year);
                      },
                    },
                    {
                      label: "Año",
                      placeholder: "YYYY",
                      value: year,
                      maxLen: 4,
                      onChange: (val) => {
                        setYear(val);
                        updateScheduledDate(day, month, val);
                      },
                    },
                  ].map(
                    ({ label, placeholder, value: fv, maxLen, onChange }) => (
                      <div key={label} className="flex flex-col gap-1">
                        <span className="text-[8px] font-bold text-slate-400 uppercase text-center">
                          {label}
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder={placeholder}
                          value={fv}
                          onChange={(e) =>
                            onChange(e.target.value.slice(0, maxLen))
                          }
                          className="h-11 rounded-xl text-xs font-bold text-center bg-white border border-slate-200 text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                      </div>
                    ),
                  )}
                </div>
                {errors.scheduledDate && (
                  <p className={errorClass}>{errors.scheduledDate}</p>
                )}

                {showEmergencyAlert && (
                  <div className="mt-4 p-3 rounded-xl bg-white border border-blue-200 flex items-start gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-blue-800 uppercase tracking-tight">
                        Emergencia Detectada
                      </h4>
                      <p className="text-[10px] text-blue-700 mt-0.5 leading-tight">
                        Programado para hoy. Prioridad elevada automáticamente.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Garantía */}
              <div>
                <label className={labelClass}>Garantía del Activo</label>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Estado
                    </span>
                    {(() => {
                      const status = getWarrantyStatus();
                      return (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${status.className}`}
                        >
                          {status.label}
                        </span>
                      );
                    })()}
                  </div>
                  <DateFieldGroup
                    value={form.warrantyExpirationDate}
                    onChange={(val) =>
                      handleChange("warrantyExpirationDate", val)
                    }
                    disabled={true}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Sección: Especificaciones del Trabajo ── */}
          <div className="space-y-6 pt-4">
            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2 mb-2">
              <span className="w-6 h-px bg-indigo-200" />
              Especificaciones del Trabajo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className={labelClass}>Descripción detallada *</label>
                <textarea
                  rows={4}
                  value={form.workDescription}
                  onChange={(e) =>
                    handleChange("workDescription", e.target.value)
                  }
                  placeholder="¿Qué tareas se deben realizar?"
                  className={`${inputClass} resize-none`}
                  style={
                    errors.workDescription ? { borderColor: "#ef4444" } : {}
                  }
                />
                {errors.workDescription && (
                  <p className={errorClass}>{errors.workDescription}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Problema Reportado *</label>
                <textarea
                  rows={4}
                  value={form.reportedProblem}
                  onChange={(e) =>
                    handleChange("reportedProblem", e.target.value)
                  }
                  placeholder="Describa el fallo o motivo..."
                  className={`${inputClass} resize-none`}
                  style={
                    errors.reportedProblem ? { borderColor: "#ef4444" } : {}
                  }
                />
                {errors.reportedProblem && (
                  <p className={errorClass}>{errors.reportedProblem}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Sección: Personal Asignado ── */}
          <div className="space-y-6 pt-4">
            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2 mb-2">
              <span className="w-6 h-px bg-indigo-200" />
              Personal Asignado
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Responsable Técnico → personas físicas */}
              <div>
                <label className={labelClass}>Responsable Técnico *</label>
                <select
                  value={form.technicalResponsibleId}
                  onChange={(e) =>
                    handleChange("technicalResponsibleId", e.target.value)
                  }
                  className={selectClass}
                  style={
                    errors.technicalResponsibleId
                      ? { borderColor: "#ef4444" }
                      : {}
                  }
                >
                  <option value="">Seleccionar persona...</option>
                  {filteredPersons.map((p) => (
                    <option key={p.id} value={p.id}>
                      {getPersonLabel(p)}
                    </option>
                  ))}
                </select>
                {errors.technicalResponsibleId && (
                  <p className={errorClass}>{errors.technicalResponsibleId}</p>
                )}
              </div>

              {/* Proveedor Externo — con lógica de garantía */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                  Proveedor Externo{" "}
                  {warrantyLockSupplier ? (
                    <span className="normal-case font-normal text-emerald-600">
                      (Garantía vigente)
                    </span>
                  ) : (
                    <span className="normal-case font-normal">(Opcional)</span>
                  )}
                </label>
                {warrantyLockSupplier ? (
                  <div className="w-full px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-emerald-500 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <span className="text-emerald-800 font-semibold flex-1 truncate">
                      {lockedSupplierName || "Proveedor del bien"}
                    </span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-black uppercase shrink-0">
                      Bloqueado
                    </span>
                  </div>
                ) : (
                  <select
                    value={form.serviceSupplierId}
                    onChange={(e) =>
                      handleChange("serviceSupplierId", e.target.value)
                    }
                    className={selectClass}
                  >
                    <option value="">Seleccionar proveedor...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.legalName || s.tradeName || "Proveedor sin nombre"}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Supervisor */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                  Supervisor{" "}
                  <span className="normal-case font-normal">(Opcional)</span>
                </label>
                <div className="relative">
                  <select
                    value={form.supervisorId}
                    onChange={(e) =>
                      handleChange("supervisorId", e.target.value)
                    }
                    className={selectClass}
                  >
                    <option value="">Seleccionar supervisor...</option>
                    {availableSupervisors.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.username ||
                          `${u.firstName || ""} ${u.lastName || ""}`.trim()}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-3 pointer-events-none text-slate-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M19 9l-7 7-7-7"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Asset Picker Modal */}
        {assetPickerOpen && (
          <>
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70]"
              onClick={() => setAssetPickerOpen(false)}
            />
            {/* Mobile */}
            <div className="fixed inset-x-0 bottom-0 z-[80] md:hidden">
              <div className="bg-white rounded-t-3xl shadow-2xl border border-slate-100">
                <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-700">
                      Bien patrimonial
                    </h4>
                    <button
                      type="button"
                      onClick={() => setAssetPickerOpen(false)}
                      className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-4">
                    <input
                      type="text"
                      value={assetQuery}
                      onChange={(e) => setAssetQuery(e.target.value)}
                      placeholder="Buscar por código o descripción..."
                      className={`${inputClass} rounded-2xl`}
                    />
                  </div>
                </div>
                <div className="max-h-[55vh] overflow-y-auto p-3 no-scrollbar">
                  {filteredAssets.length === 0 && (
                    <p className="text-xs text-slate-500 px-3 py-6">
                      Sin resultados.
                    </p>
                  )}
                  {filteredAssets.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => {
                        handleChange("assetId", asset.id);
                        setAssetPickerOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-2xl border transition-all mb-2 ${String(form.assetId) === String(asset.id) ? "border-indigo-400 bg-indigo-50" : "border-slate-100 bg-white hover:bg-slate-50"}`}
                    >
                      <div className="text-xs font-black text-slate-700">
                        {asset.assetCode ||
                          asset.codigoPatrimonial ||
                          "SIN CÓDIGO"}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                        {asset.description || asset.descripcion || asset.id}
                      </div>
                      {(() => {
                        const { isActive } = evaluateAssetWarranty(asset);
                        return isActive && asset.supplierId ? (
                          <span className="text-[9px] text-emerald-600 font-bold">
                            ✓ Garantía vigente
                          </span>
                        ) : null;
                      })()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Desktop */}
            <div
              className="fixed inset-x-0 z-[80] hidden md:block"
              style={{ top: "160px" }}
            >
              <div className="mx-auto w-full max-w-xl">
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                    <input
                      type="text"
                      value={assetQuery}
                      onChange={(e) => setAssetQuery(e.target.value)}
                      placeholder="Buscar por código o descripción..."
                      className={`${inputClass} rounded-xl`}
                    />
                    <button
                      type="button"
                      onClick={() => setAssetPickerOpen(false)}
                      className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"
                      aria-label="Cerrar"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto p-3 no-scrollbar">
                    {filteredAssets.length === 0 && (
                      <p className="text-xs text-slate-500 px-3 py-6">
                        Sin resultados.
                      </p>
                    )}
                    {filteredAssets.map((asset) => (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => {
                          handleChange("assetId", asset.id);
                          setAssetPickerOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-2xl border transition-all mb-2 ${String(form.assetId) === String(asset.id) ? "border-indigo-400 bg-indigo-50" : "border-slate-100 bg-white hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-black text-slate-700">
                            {asset.assetCode ||
                              asset.codigoPatrimonial ||
                              "SIN CÓDIGO"}
                          </div>
                          {(() => {
                            const { isActive } = evaluateAssetWarranty(asset);
                            return isActive && asset.supplierId ? (
                              <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                Garantía vigente
                              </span>
                            ) : null;
                          })()}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                          {asset.description || asset.descripcion || asset.id}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80 backdrop-blur-md">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight max-w-[200px]">
            * Campos obligatorios para el registro oficial SBN.
          </p>
          <div className="flex items-center gap-4">
            <button
              type="submit"
              form="maintenance-form"
              disabled={saving}
              className="px-10 py-4 bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-3"
            >
              {saving && (
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {isEditing ? "Guardar Cambios" : "Registrar Mantenimiento"}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalEntry { from { opacity: 0; transform: scale(0.9) translateY(40px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
        .no-scrollbar::-webkit-scrollbar { width: 0; height: 0; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
