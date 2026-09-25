import { useState, useEffect, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import DateFieldGroup from "./DateFieldGroup";
import {
  WORK_QUALITY_LABELS,
  ASSET_CONDITION_LABELS,
  STATUS_LABELS,
} from "../constants/maintenance.constants";

import { getProveedores } from "../../ms-03-configuration/services/api";
import userService from "../../ms-02-authentication/services/userService";
import personService from "../../ms-02-authentication/services/personService";
import positionService from "../../ms-02-authentication/services/positionService";
import { uploadFile } from "../../../shared/services/storageService";
import maintenanceService from "../services/maintenanceService";

export default function MaintenanceStatusFlow({
  isOpen,
  action,
  maintenance,
  onClose,
  onExecute,
}) {
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  // Estados para datos maestros
  const [suppliers, setSuppliers] = useState([]);
  const [users, setUsers] = useState([]);
  const [persons, setPersons] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loadingMasterData, setLoadingMasterData] = useState(false);

  const fetchMasterData = useCallback(async () => {
    if (suppliers.length > 0 && users.length > 0 && persons.length > 0 && positions.length > 0) return;
    try {
      setLoadingMasterData(true);
      
      // Obtener datos del usuario logueado primero
      let currentUserData = null;
      let currentPersonData = null;
      let currentPositionData = null;
      
      try {
        const userSession = JSON.parse(sessionStorage.getItem("user") || "{}");
        const currentUserId = userSession.id || userSession.userId;
        
        if (currentUserId) {
          // Obtener datos específicos del usuario actual en lugar de todos los usuarios
          currentUserData = await userService.getUserById(currentUserId);
          
          if (currentUserData && currentUserData.personId) {
            currentPersonData = await personService.getPersonById(currentUserData.personId);
            
            if (currentUserData.positionId) {
              currentPositionData = await positionService.getPositionById(currentUserData.positionId);
            }
            
            // Actualizar el formulario con los datos del usuario actual
            setFormData((prev) => ({
              ...prev,
              patrimonialControllerName: currentPersonData?.fullName || 
                `${currentPersonData?.firstName || ""} ${currentPersonData?.lastName || ""}`.trim() || "",
              patrimonialControllerDni: currentPersonData?.documentNumber || "",
              userId: currentUserId,
              userAreaResponsibleName: currentPersonData?.fullName || 
                `${currentPersonData?.firstName || ""} ${currentPersonData?.lastName || ""}`.trim() || "",
              userAreaResponsiblePosition: currentPositionData ? 
                (currentPositionData.nombre || currentPositionData.name || currentPositionData.title || "") : "",
              userAreaResponsibleDni: currentPersonData?.documentNumber || "",
            }));
          }
        }
      } catch (userErr) {
        console.warn("Error al obtener datos del usuario logueado:", userErr);
      }

      // Cargar proveedores y otros datos maestros en paralelo
      const [suppliersData, allUsersData, allPersonsData, allPositionsData] =
        await Promise.all([
          getProveedores(),
          userService.getAllUsers(),
          personService.getAllPersons(),
          positionService.getAllPositions(),
        ]);

      const toArr = (d) => (Array.isArray(d) ? d : d?.content || d?.data || []);
      setSuppliers(toArr(suppliersData));
      setUsers(toArr(allUsersData));
      setPersons(toArr(allPersonsData));
      setPositions(toArr(allPositionsData));

      if (maintenance?.serviceSupplierId) {
        const sup = toArr(suppliersData).find(
          (s) => String(s.id) === String(maintenance.serviceSupplierId),
        );
        if (sup) {
          setFormData((prev) => ({
            ...prev,
            supplierRepresentativeName: sup.mainContact || "",
            supplierRepresentativeDni: sup.numeroDocumento || "",
          }));
        }
      }
    } catch (err) {
      console.error("Error al cargar datos maestros:", err);
    } finally {
      setLoadingMasterData(false);
    }
  }, [maintenance?.serviceSupplierId, suppliers.length, users.length, persons.length, positions.length]);

  useEffect(() => {
    if (isOpen && maintenance) {
      const generatedConformityNumber = `CONF-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;
      setFormData({
        laborCost: maintenance.laborCost || "",
        appliedSolution: maintenance.appliedSolution || "",
        workQuality: "EXCELLENT",
        assetConditionAfter: "OPERATIONAL",
        nextDate: maintenance.nextDate || "",
        serviceSupplierId: maintenance.serviceSupplierId || "",
        supplierRepresentativeName: "",
        supplierRepresentativeDni: "",
        userId: "",
        userAreaResponsibleName: "",
        userAreaResponsiblePosition: "",
        userAreaResponsibleDni: "",
        patrimonialControllerUserId: "",
        patrimonialControllerName: "",
        patrimonialControllerDni: "",
        requiresFollowup: false,
        followupDescription: "",
        digitalSignature: "",
        observations: "",
        workOrder: maintenance.workOrder || "",
        conformityNumber: generatedConformityNumber,
        invoiceNumber: "",
      });
      setSelectedFile(null);

      if (action === "confirm") {
        fetchMasterData();
      }
    }
  }, [isOpen, maintenance, action, fetchMasterData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSupplierChange = (supplierId) => {
    const selected = suppliers.find((s) => String(s.id) === String(supplierId));
    setFormData((prev) => ({
      ...prev,
      serviceSupplierId: supplierId,
      supplierRepresentativeName: selected?.mainContact || "",
      supplierRepresentativeDni: selected?.numeroDocumento || "",
    }));
  };

  const handleUserChange = (userId) => {
    const selectedUser = users.find((u) => String(u.id) === String(userId));
    if (!selectedUser) return;

    const person = persons.find((p) => String(p.id) === String(selectedUser.personId));
    const position = positions.find((p) => String(p.id) === String(selectedUser.positionId));

    setFormData((prev) => ({
      ...prev,
      userAreaResponsibleName: person
        ? (person.fullName || `${person.firstName || ""} ${person.lastName || ""}`.trim() || "")
        : "",
      userAreaResponsiblePosition: position
        ? (position.nombre || position.name || position.title || "")
        : "",
      userAreaResponsibleDni: person ? (person.documentNumber || "") : "",
    }));
  };

  const handlePatrimonialUserChange = (userId) => {
    const selectedUser = users.find((u) => String(u.id) === String(userId));
    if (!selectedUser) return;

    const person = persons.find((p) => String(p.id) === String(selectedUser.personId));

    setFormData((prev) => ({
      ...prev,
      patrimonialControllerName: person
        ? (person.fullName || `${person.firstName || ""} ${person.lastName || ""}`.trim() || "")
        : "",
      patrimonialControllerDni: person ? (person.documentNumber || "") : "",
    }));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      let payload;
      let uploadedFileResult = null;

      if (action === "start") {
        payload = { observations: formData.observations };
      } else if (action === "complete") {
        if (!formData.appliedSolution?.trim()) {
          setSaving(false);
          Swal.fire({
            icon: "warning",
            title: "Campo requerido",
            text: "La solución aplicada es obligatoria para completar el mantenimiento.",
            confirmButtonText: "Entendido",
            customClass: {
              container: 'z-[100000]',
              popup: 'z-[100000]'
            }
          });
          return;
        }
        if (!formData.workOrder?.trim()) {
          setSaving(false);
          Swal.fire({
            icon: "warning",
            title: "Campo requerido",
            text: "La orden de trabajo es obligatoria para completar el mantenimiento.",
            confirmButtonText: "Entendido",
            customClass: {
              container: 'z-[100000]',
              popup: 'z-[100000]'
            }
          });
          return;
        }

        // Subir boleta primero si se seleccionó un archivo
        if (selectedFile) {
          setUploadingFile(true);
          const result = await uploadFile(selectedFile);
          setUploadingFile(false);
          if (!result.success) {
            setSaving(false);
            Swal.fire({
              icon: "error",
              title: "Error al subir archivo",
              text: result.error || "No se pudo subir la boleta. Intente nuevamente.",
              confirmButtonText: "Entendido",
              customClass: {
                container: 'z-[100000]',
                popup: 'z-[100000]'
              }
            });
            return;
          }
          uploadedFileResult = result;
        }

        payload = {
          workOrder: formData.workOrder,
          laborCost: formData.laborCost !== "" && formData.laborCost != null ? parseFloat(formData.laborCost) : null,
          additionalCost: formData.additionalCost !== "" && formData.additionalCost != null
            ? parseFloat(formData.additionalCost)
            : null,
          appliedSolution: formData.appliedSolution,
          observations: formData.observations,
          invoiceNumber: formData.invoiceNumber || "",
        };
      } else if (action === "confirm") {
        payload = {
          conformityNumber: formData.conformityNumber,
          workQuality: formData.workQuality,
          assetConditionAfter: formData.assetConditionAfter,
          observations: formData.observations,
          supplierRepresentativeName: formData.supplierRepresentativeName,
          supplierRepresentativeDni: formData.supplierRepresentativeDni,
          userAreaResponsibleName: formData.userAreaResponsibleName,
          userAreaResponsiblePosition: formData.userAreaResponsiblePosition,
          userAreaResponsibleDni: formData.userAreaResponsibleDni,
          requiresFollowup: formData.requiresFollowup,
          followupDescription: formData.followupDescription,
          digitalSignature: formData.digitalSignature,
          patrimonialControllerName: formData.patrimonialControllerName || "",
          patrimonialControllerDni: formData.patrimonialControllerDni || "",
        };

        const requiredFields = [
          { key: "supplierRepresentativeName", label: "Representante del Proveedor" },
          { key: "supplierRepresentativeDni", label: "DNI del Proveedor" },
          { key: "userAreaResponsibleName", label: "Responsable del Área" },
          { key: "userAreaResponsiblePosition", label: "Cargo del Responsable" },
          { key: "userAreaResponsibleDni", label: "DNI del Responsable" },
          { key: "patrimonialControllerName", label: "Controlador Patrimonial" },
          { key: "patrimonialControllerDni", label: "DNI del Controlador Patrimonial" },
        ];
        const missing = requiredFields.filter((f) => !payload[f.key]?.trim());
        if (missing.length > 0) {
          setSaving(false);
          Swal.fire({
            icon: "warning",
            title: "Campos requeridos",
            text: `Complete los siguientes campos: ${missing.map((f) => f.label).join(", ")}`,
            confirmButtonText: "Entendido",
            customClass: {
              container: 'z-[100000]',
              popup: 'z-[100000]'
            }
          });
          return;
        }
        const missingConfirm = [];
        if (!formData.workQuality) missingConfirm.push("Calidad del trabajo");
        if (!formData.assetConditionAfter) missingConfirm.push("Estado del bien");
        if (missingConfirm.length > 0) {
          setSaving(false);
          Swal.fire({
            icon: "warning",
            title: "Campos requeridos",
            text: `Complete: ${missingConfirm.join(", ")}`,
            confirmButtonText: "Entendido",
            customClass: {
              container: 'z-[100000]',
              popup: 'z-[100000]'
            }
          });
          return;
        }
      } else if (action === "suspend") {
        if (!formData.nextDate || formData.nextDate.length < 10 || new Date(formData.nextDate + "T00:00:00") <= new Date(new Date().toDateString())) {
          setSaving(false);
          Swal.fire({
            icon: "warning",
            title: "Fecha inválida",
            text: "La próxima fecha debe ser una fecha futura",
            confirmButtonText: "Entendido",
            customClass: {
              container: 'z-[100000]',
              popup: 'z-[100000]'
            }
          });
          return;
        }
        payload = {
          nextDate: formData.nextDate,
          observations: formData.observations,
        };
      } else if (action === "cancel") {
        if (!formData.observations?.trim()) {
          setSaving(false);
          Swal.fire({
            icon: "warning",
            title: "Motivo requerido",
            text: "Debe ingresar el motivo de cancelación",
            confirmButtonText: "Entendido",
            customClass: {
              container: 'z-[100000]',
              popup: 'z-[100000]'
            }
          });
          return;
        }
        payload = { observations: formData.observations };
      } else if (action === "reschedule") {
        if (!formData.nextDate || formData.nextDate.length < 10 || new Date(formData.nextDate + "T00:00:00") <= new Date(new Date().toDateString())) {
          setSaving(false);
          Swal.fire({
            icon: "warning",
            title: "Fecha inválida",
            text: "La próxima fecha debe ser una fecha futura",
            confirmButtonText: "Entendido",
            customClass: {
              container: 'z-[100000]',
              popup: 'z-[100000]'
            }
          });
          return;
        }
        payload = {
          nextDate: formData.nextDate,
          observations: formData.observations,
        };
      } else {
        payload = { ...formData };
      }

      await onExecute(action, maintenance, payload);

      // Si se subió una boleta, guardar la metadata del documento
      if (uploadedFileResult && action === "complete") {
        try {
          const ext = (uploadedFileResult.originalName || "").split(".").pop().toUpperCase();
          await maintenanceService.uploadMaintenanceDocument(maintenance.id, {
            documentType: "BOLETA",
            invoiceNumber: formData.invoiceNumber || "",
            invoiceDate: new Date().toISOString().slice(0, 10),
            fileName: uploadedFileResult.fileName,
            originalName: uploadedFileResult.originalName,
            fileType: ["JPG", "JPEG", "PNG", "WEBP", "GIF"].includes(ext) ? ext : "JPG",
          });
        } catch (docErr) {
          console.warn("No se pudo guardar la metadata del documento:", docErr);
        }
      }

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `Mantenimiento ${getActionLabel(action).toLowerCase()} exitosamente`,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        customClass: {
          container: 'z-[100000]',
          popup: 'z-[100000]'
        }
      });
      onClose();
    } catch (err) {
      console.error('Error en handleSubmit:', err);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo completar la operación",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        customClass: {
          container: 'z-[100000]',
          popup: 'z-[100000]'
        }
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !maintenance || !action) return null;

  const getActionLabel = (a) => {
    const labels = {
      start: "Iniciado",
      complete: "Completado",
      confirm: "Confirmado",
      suspend: "Suspendido",
      cancel: "Cancelado",
      reschedule: "Reprogramado",
    };
    return labels[a] || a;
  };

  const inputClass =
    "w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 text-sm font-bold placeholder:text-slate-400 placeholder:font-medium outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all shadow-sm";
  const labelClass =
    "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1";

  const renderForm = () => {
    switch (action) {
      case "start":
        return (
          <div className="space-y-6">
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-[2rem] p-8 text-center">
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <svg
                  className="w-8 h-8 text-indigo-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                ¿Desea iniciar la ejecución técnica para el mantenimiento{" "}
                <span className="font-black text-slate-900">
                  {maintenance.maintenanceCode}
                </span>
                ?
              </p>
            </div>
            <div>
              <label className={labelClass}>Notas de Inicio (Opcional)</label>
              <textarea
                rows={2}
                value={formData.observations || ""}
                onChange={(e) => handleChange("observations", e.target.value)}
                placeholder="Ej. Se inicia con todo el equipo completo..."
                className={inputClass}
                style={{ resize: "none" }}
              />
            </div>
          </div>
        );

      case "complete":
        return (
          <div className="space-y-8">
            <p className="text-sm text-slate-500 font-medium leading-relaxed px-1">
              Registre los detalles finales para cerrar la orden de
              mantenimiento{" "}
              <span className="font-black text-slate-900">
                {maintenance.maintenanceCode}
              </span>
              .
            </p>

            <div className="space-y-6">
              <div>
                <label className={labelClass}>Orden de Trabajo (O/T) *</label>
                <input
                  type="text"
                  required
                  value={formData.workOrder || ""}
                  onChange={(e) => handleChange("workOrder", e.target.value)}
                  placeholder="Ej. OT-2026-00123"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Mano de Obra (S/)</label>
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      S/
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.laborCost || ""}
                      onChange={(e) =>
                        handleChange("laborCost", e.target.value)
                      }
                      placeholder="0.00"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Costos Adicionales (S/)</label>
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      S/
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.additionalCost || ""}
                      onChange={(e) =>
                        handleChange("additionalCost", e.target.value)
                      }
                      placeholder="0.00"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
              </div>

              {/* Boleta / Factura - Subida de archivo */}
              <div className="bg-indigo-50/30 border border-indigo-100 rounded-2xl p-5 space-y-4">
                <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                  Boleta / Factura (Opcional)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Campo N° de Boleta/Factura oculto visualmente; el valor se sigue
                      enviando en el payload de finalización y en la metadata del documento */}
                  <input
                    type="hidden"
                    value={formData.invoiceNumber || ""}
                    onChange={(e) => handleChange("invoiceNumber", e.target.value)}
                  />
                  <div className="md:col-start-2">
                    <label className={labelClass}>Archivo (JPG, PNG, WEBP, GIF)</label>
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          if (file) {
                            const allowedTypes = [
                              "image/jpeg",
                              "image/png",
                              "image/webp",
                              "image/gif",
                            ];
                            const allowedExts = /\.(jpg|jpeg|png|webp|gif)$/i;
                            if (
                              !allowedTypes.includes(file.type) &&
                              !allowedExts.test(file.name)
                            ) {
                              Swal.fire({
                                icon: "warning",
                                title: "Formato no permitido",
                                text: "Solo se permiten imágenes (JPG, PNG, WEBP, GIF).",
                                confirmButtonText: "Entendido",
                                customClass: {
                                  container: 'z-[100000]',
                                  popup: 'z-[100000]'
                                }
                              });
                              if (fileInputRef.current) fileInputRef.current.value = "";
                              setSelectedFile(null);
                              return;
                            }
                          }
                          setSelectedFile(file);
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 px-4 py-3.5 bg-white border border-dashed border-indigo-300 rounded-xl text-sm text-indigo-600 font-bold hover:bg-indigo-50 transition-all flex items-center gap-2 justify-center"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        {selectedFile ? "Cambiar archivo" : "Seleccionar archivo"}
                      </button>
                      {selectedFile && (
                        <button
                          type="button"
                          onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                          className="p-3 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {selectedFile && (
                      <p className="text-[10px] text-emerald-600 font-bold mt-1.5 ml-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Solución Técnica Implementada *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.appliedSolution || ""}
                  onChange={(e) =>
                    handleChange("appliedSolution", e.target.value)
                  }
                  placeholder="Detalle los trabajos realizados..."
                  className={inputClass}
                  style={{ resize: "none" }}
                />
              </div>

              <div>
                <label className={labelClass}>Observaciones Adicionales</label>
                <textarea
                  rows={2}
                  value={formData.observations || ""}
                  onChange={(e) => handleChange("observations", e.target.value)}
                  placeholder="Notas adicionales sobre la ejecución técnica..."
                  className={inputClass}
                  style={{ resize: "none" }}
                />
              </div>
            </div>
          </div>
        );

      case "confirm":
        return (
          <div className="space-y-8">
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-[2rem] p-6 mb-2">
              <p className="text-sm text-emerald-800 font-medium leading-relaxed">
                Conformidad del servicio para{" "}
                <span className="font-black">
                  {maintenance.maintenanceCode}
                </span>
                . El acta de recepción se generará automáticamente.
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className={labelClass}>Calidad del Servicio *</label>
                  <select
                    value={formData.workQuality || ""}
                    onChange={(e) =>
                      handleChange("workQuality", e.target.value)
                    }
                    className={`${inputClass} appearance-none cursor-pointer`}
                  >
                    {Object.entries(WORK_QUALITY_LABELS).map(([val, lab]) => (
                      <option key={val} value={val}>
                        {lab}
                      </option>
                    ))}
                  </select>
                  <div className="absolute bottom-4 right-5 pointer-events-none text-slate-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M19 9l-7 7-7-7"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                <div className="relative">
                  <label className={labelClass}>Condición Final *</label>
                  <select
                    value={formData.assetConditionAfter || ""}
                    onChange={(e) =>
                      handleChange("assetConditionAfter", e.target.value)
                    }
                    className={`${inputClass} appearance-none cursor-pointer`}
                  >
                    {Object.entries(ASSET_CONDITION_LABELS).map(
                      ([val, lab]) => (
                        <option key={val} value={val}>
                          {lab}
                        </option>
                      ),
                    )}
                  </select>
                  <div className="absolute bottom-4 right-5 pointer-events-none text-slate-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M19 9l-7 7-7-7"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Número de Acta (Generado)</label>
                <input
                  type="text"
                  readOnly
                  value={formData.conformityNumber || ""}
                  className={`${inputClass} bg-slate-100/50 border-dashed text-slate-400 cursor-not-allowed`}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                    Firma 1: Representante del Proveedor
                  </h4>
                  {loadingMasterData && (
                    <span className="text-[9px] text-slate-400 animate-pulse">
                      Cargando...
                    </span>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Seleccionar Proveedor *</label>
                  <div className="relative">
                    <select
                      value={formData.serviceSupplierId || ""}
                      onChange={(e) => handleSupplierChange(e.target.value)}
                      className={`${inputClass} appearance-none cursor-pointer`}
                      disabled={loadingMasterData}
                    >
                      <option value="">Seleccionar proveedor...</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.legalName || s.tradeName}
                        </option>
                      ))}
                    </select>
                    <div className="absolute bottom-4 right-5 pointer-events-none text-slate-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M19 9l-7 7-7-7"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>
                      Nombre del Representante
                    </label>
                    <input
                      type="text"
                      value={formData.supplierRepresentativeName || ""}
                      onChange={(e) =>
                        handleChange(
                          "supplierRepresentativeName",
                          e.target.value,
                        )
                      }
                      placeholder="Nombre completo"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>DNI / RUC</label>
                    <input
                      type="text"
                      value={formData.supplierRepresentativeDni || ""}
                      onChange={(e) =>
                        handleChange(
                          "supplierRepresentativeDni",
                          e.target.value,
                        )
                      }
                      placeholder="Identificación"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                    Firma 2: Responsable del Área Usuaria
                  </h4>
                </div>

                <div>
                  <label className={labelClass}>
                    Seleccionar Responsable *
                  </label>
                  <div className="relative">
                    <select
                      value={formData.userId || ""}
                      onChange={(e) => handleUserChange(e.target.value)}
                      className={`${inputClass} appearance-none cursor-pointer`}
                      disabled={loadingMasterData}
                    >
                      <option value="">Seleccionar jefe/encargado...</option>
                      {users.map((u) => {
                        const p = persons.find(
                          (person) => person.id === u.personId,
                        );
                        const pName = p
                          ? p.fullName || `${p.firstName} ${p.lastName}`
                          : u.username;
                        return (
                          <option key={u.id} value={u.id}>
                            {pName} ({u.username})
                          </option>
                        );
                      })}
                    </select>
                    <div className="absolute bottom-4 right-5 pointer-events-none text-slate-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M19 9l-7 7-7-7"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Nombre del Responsable</label>
                  <input
                    type="text"
                    value={formData.userAreaResponsibleName || ""}
                    onChange={(e) =>
                      handleChange("userAreaResponsibleName", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Cargo</label>
                    <input
                      type="text"
                      value={formData.userAreaResponsiblePosition || ""}
                      onChange={(e) =>
                        handleChange(
                          "userAreaResponsiblePosition",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>DNI</label>
                    <input
                      type="text"
                      maxLength="8"
                      value={formData.userAreaResponsibleDni || ""}
                      onChange={(e) =>
                        handleChange("userAreaResponsibleDni", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                    Firma 3: Controlador Patrimonial
                  </h4>
                </div>

                <div>
                  <label className={labelClass}>
                    Seleccionar Controlador Patrimonial *
                  </label>
                  <div className="relative">
                    <select
                      value={formData.patrimonialControllerUserId || ""}
                      onChange={(e) => handlePatrimonialUserChange(e.target.value)}
                      className={`${inputClass} appearance-none cursor-pointer`}
                      disabled={loadingMasterData}
                    >
                      <option value="">Seleccionar controlador patrimonial...</option>
                      {users.map((u) => {
                        const p = persons.find(
                          (person) => person.id === u.personId,
                        );
                        const pName = p
                          ? p.fullName || `${p.firstName} ${p.lastName}`
                          : u.username;
                        return (
                          <option key={u.id} value={u.id}>
                            {pName} ({u.username})
                          </option>
                        );
                      })}
                    </select>
                    <div className="absolute bottom-4 right-5 pointer-events-none text-slate-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M19 9l-7 7-7-7"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Nombre del Controlador Patrimonial</label>
                  <input
                    type="text"
                    value={formData.patrimonialControllerName || ""}
                    onChange={(e) =>
                      handleChange("patrimonialControllerName", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="md:col-span-1">
                    <label className={labelClass}>DNI</label>
                    <input
                      type="text"
                      maxLength="8"
                      value={formData.patrimonialControllerDni || ""}
                      onChange={(e) =>
                        handleChange("patrimonialControllerDni", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="requiresFollowup"
                    checked={formData.requiresFollowup || false}
                    onChange={(e) =>
                      handleChange("requiresFollowup", e.target.checked)
                    }
                    className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="requiresFollowup"
                    className="text-sm font-bold text-slate-700 cursor-pointer"
                  >
                    ¿Requiere seguimiento posterior?
                  </label>
                </div>

                {formData.requiresFollowup && (
                  <div>
                    <label className={labelClass}>
                      Descripción del Seguimiento
                    </label>
                    <textarea
                      rows={2}
                      value={formData.followupDescription || ""}
                      onChange={(e) =>
                        handleChange("followupDescription", e.target.value)
                      }
                      placeholder="Indique las tareas pendientes o recomendaciones..."
                      className={inputClass}
                      style={{ resize: "none" }}
                    />
                  </div>
                )}
              </div>

              <div className="pt-4">
                <label className={labelClass}>
                  Observaciones de Conformidad
                </label>
                <textarea
                  rows={2}
                  value={formData.observations || ""}
                  onChange={(e) => handleChange("observations", e.target.value)}
                  placeholder="Comentarios adicionales sobre la recepción del servicio..."
                  className={inputClass}
                  style={{ resize: "none" }}
                />
              </div>

              {/* Firma Digital Placeholder */}
              <div className="pt-6">
                <label className={labelClass}>
                  Firma Digital (PIN / Identificación)
                </label>
                <div className="bg-slate-900 rounded-3xl p-6 text-center shadow-xl shadow-slate-200">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-6 h-6 text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <input
                    type="password"
                    placeholder="Ingrese su clave de firma..."
                    value={formData.digitalSignature || ""}
                    onChange={(e) =>
                      handleChange("digitalSignature", e.target.value)
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-sm outline-none focus:border-indigo-500/50 transition-all"
                  />
                  <p className="text-[9px] text-white/40 mt-3 uppercase tracking-widest font-black">
                    Validación Biométrica Requerida
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "suspend":
        return (
          <div className="space-y-8">
            <div className="bg-amber-50/50 border border-amber-100 rounded-[2rem] p-6">
              <p className="text-sm text-amber-800 font-medium">
                Se pausará el seguimiento de este mantenimiento. Indique cuándo
                planea reanudarlo y el motivo.
              </p>
            </div>
            <div className="space-y-6">
              <div>
                <DateFieldGroup
                  label="Fecha de Reanudación"
                  value={formData.nextDate || ""}
                  onChange={(val) => handleChange("nextDate", val)}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Motivo de la Suspensión *</label>
                <textarea
                  rows={3}
                  value={formData.observations || ""}
                  onChange={(e) => handleChange("observations", e.target.value)}
                  placeholder="Ej. Esperando repuestos del extranjero..."
                  className={inputClass}
                  style={{ resize: "none" }}
                />
              </div>
            </div>
          </div>
        );

      case "cancel":
        return (
          <div className="space-y-8">
            <div className="bg-red-50/50 border border-red-100 rounded-[2rem] p-8 text-center">
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-black text-slate-900 tracking-tight mb-2">
                Anular Solicitud
              </h4>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                ¿Está seguro de cancelar permanentemente el mantenimiento{" "}
                <span className="font-black text-red-600">
                  {maintenance.maintenanceCode}
                </span>
                ?
              </p>
            </div>
            <div>
              <label className={labelClass}>Motivo de Cancelación *</label>
              <textarea
                rows={3}
                value={formData.observations || ""}
                onChange={(e) => handleChange("observations", e.target.value)}
                placeholder="Explique por qué se anula este registro..."
                className={inputClass}
                style={{ resize: "none" }}
              />
            </div>
          </div>
        );

      case "reschedule":
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-8 text-center text-blue-800">
              <p className="text-sm font-medium leading-relaxed">
                Se reactivará la solicitud y volverá al estado{" "}
                <span className="font-black">Programado</span>. Indique la nueva
                fecha y el motivo del cambio.
              </p>
            </div>
            <div>
              <DateFieldGroup
                label="Nueva Fecha Programada *"
                value={formData.nextDate || ""}
                onChange={(val) => handleChange("nextDate", val)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Motivo de Reprogramación *</label>
              <textarea
                rows={3}
                value={formData.observations || ""}
                onChange={(e) => handleChange("observations", e.target.value)}
                placeholder="Ej. El técnico asignado no podrá asistir..."
                className={inputClass}
                style={{ resize: "none" }}
              />
            </div>
          </div>
        );

      default:
        return <p className="text-sm text-gray-500">Acción no reconocida</p>;
    }
  };

  const actionConfig = {
    start: { title: "Iniciar Ejecución", color: "#4F46E5", icon: "▶" },
    complete: { title: "Finalizar Trabajos", color: "#10b981", icon: "✓" },
    confirm: { title: "Conformidad SBN", color: "#14b8a6", icon: "📋" },
    suspend: { title: "Pausar Proceso", color: "#3B82F6", icon: "⏸" },
    cancel: { title: "Anular Registro", color: "#ef4444", icon: "✕" },
    reschedule: { title: "Reactivar Solicitud", color: "#3b82f6", icon: "📅" },
  };

  const config = actionConfig[action] || {
    title: "Gestión",
    color: "#64748b",
    icon: "•",
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        onClick={onClose}
        style={{ animation: "fadeIn 0.3s ease-out" }}
      />

      <div
        className="relative bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 z-[10000]"
        style={{ animation: "modalEntry 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* Modal Header */}
        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-slate-100"
              style={{ backgroundColor: config.color, color: "#ffffff" }}
            >
              {config.icon}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tighter">
                {config.title}
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                {maintenance.maintenanceCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all"
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">
          {renderForm()}
        </div>

        {/* Modal Footer */}
        <div className="px-10 py-8 border-t border-slate-50 flex items-center justify-end gap-4 shrink-0 bg-slate-50/30">
          <button
            onClick={onClose}
            className="px-8 py-3.5 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all"
          >
            Atrás
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || uploadingFile}
            className="px-10 py-3.5 text-xs font-black text-white uppercase tracking-widest rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center gap-3"
            style={{
              backgroundColor: config.color,
              shadowColor: config.color + "40",
            }}
          >
            {(saving || uploadingFile) && (
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
            {uploadingFile ? "Subiendo boleta..." : "Confirmar Acción"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalEntry { from { opacity: 0; transform: scale(0.9) translateY(30px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
