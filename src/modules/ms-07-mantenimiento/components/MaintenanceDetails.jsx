import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import {
  AdjustmentsHorizontalIcon,
  CheckCircleIcon,
  ClockIcon,
  PlayCircleIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  TYPE_LABELS,
  PRIORITY_LABELS,
  PART_TYPE_LABELS,
  UNIT_OF_MEASURE_LABELS,
  WORK_QUALITY_LABELS,
  ASSET_CONDITION_LABELS,
} from "../constants/maintenance.constants";
import maintenanceService from "../services/maintenanceService";
import { pdf } from "@react-pdf/renderer";
import SingleMaintenanceReport from "../reports/SingleMaintenanceReport";
import {
  normalizeMaintenance,
  computeFinancialSummary,
} from "../utils/maintenanceMapper";
import { getMunicipalidadById } from "../../ms-01-tenant-management/services/municipalidadService";
import { loadCompressedLogo } from "../../../shared/reports";
import { getFileUrl } from "../../../shared/services/storageService";

const EVENT_ICONS = {
  PENDING: PlusCircleIcon,
  SCHEDULED: ClockIcon,
  IN_PROCESS: PlayCircleIcon,
  COMPLETED: CheckCircleIcon,
  PENDING_CONFORMITY: CheckCircleIcon,
  CONFIRMED: ShieldCheckIcon,
  CANCELLED: XCircleIcon,
  SUSPENDED: ClockIcon,
};

const getHistoryStatus = (historyItem, type) => {
  if (!historyItem) return null;
  if (type === "previous") {
    return (
      historyItem.previousStatus ||
      historyItem.oldStatus ||
      historyItem.previousState ||
      null
    );
  }

  return historyItem.newStatus || historyItem.newState || null;
};

const getEventIcon = (historyItem) => {
  const previousStatus = getHistoryStatus(historyItem, "previous");
  const newStatus = getHistoryStatus(historyItem, "new");

  if (!previousStatus) return PlusCircleIcon;
  return EVENT_ICONS[newStatus] || AdjustmentsHorizontalIcon;
};

const InfoRow = ({ label, value, full = false }) => {
  const isEmpty =
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "string" && value.trim() === "");
  return (
    <div
      className={`min-w-0 border-b border-slate-100/80 pb-4 transition-all duration-200 hover:border-slate-300/80 ${
        full ? "sm:col-span-2" : ""
      }`}
    >
      <dt className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] mb-1.5">
        {label}
      </dt>
      <dd className="text-sm text-slate-900 font-medium leading-snug break-words">
        {isEmpty ? <span className="text-slate-300 font-normal">—</span> : value}
      </dd>
    </div>
  );
};

const SummaryTile = ({ label, value, helper, color }) => (
  <div className="min-w-0 rounded-lg border border-slate-200/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
    <div className="mb-2 flex items-center gap-2">
      {color && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
    </div>
    <p className="truncate text-sm font-semibold text-slate-950">{value}</p>
    {helper && (
      <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
        {helper}
      </p>
    )}
  </div>
);

const extractCollection = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  for (const key of keys) {
    const value = payload[key];
    const nested = extractCollection(value, keys);
    if (nested.length > 0) return nested;
  }

  const candidates = [
    payload.content,
    payload.data,
    payload.items,
    payload.results,
    payload.records,
    payload.list,
    payload.values,
    payload.result,
    payload.page,
  ];

  for (const candidate of candidates) {
    const nested = extractCollection(candidate, keys);
    if (nested.length > 0) return nested;
  }

  if (payload._embedded && typeof payload._embedded === "object") {
    const embedded = Object.values(payload._embedded).find(Array.isArray);
    if (embedded) return embedded;
  }

  return [];
};

const isPartLike = (part) =>
  Boolean(
    part &&
      typeof part === "object" &&
      (
        part.partName ||
        part.name ||
        part.description ||
        part.descripcion ||
        part.itemName ||
        part.materialName ||
        part.sparePartName ||
        part.replacementName ||
        part.quantity != null ||
        part.qty != null ||
        part.cantidad != null ||
        part.unitCost != null ||
        part.unitPrice != null ||
        part.unit_cost != null ||
        part.unit_price != null
      ),
  );

const normalizePartRecord = (part) => {
  if (!isPartLike(part)) return null;

  const partName =
    part.partName ||
    part.name ||
    part.description ||
    part.descripcion ||
    part.itemName ||
    part.materialName ||
    part.sparePartName ||
    part.replacementName;

  const quantity =
    part.quantity ??
    part.qty ??
    part.cantidad ??
    part.amount ??
    0;
  const lineTotal =
    part.subtotal ??
    part.total ??
    part.totalCost ??
    part.total_cost ??
    part.lineTotal ??
    part.line_total;
  const rawUnitCost =
    part.unitCost ??
    part.unit_cost ??
    part.unitPrice ??
    part.unit_price ??
    part.price ??
    part.precioUnitario ??
    part.costoUnitario;
  const unitCost =
    rawUnitCost ??
    (lineTotal != null && parseFloat(quantity) > 0
      ? parseFloat(lineTotal) / parseFloat(quantity)
      : lineTotal ?? 0);

  const normalized = {
    ...part,
    partName: partName || "Insumo",
    partType:
      part.partType ||
      part.type ||
      part.tipo ||
      part.materialType ||
      part.sparePartType ||
      "SPARE_PART",
    quantity,
    unitCost,
    unitOfMeasure:
      part.unitOfMeasure ||
      part.unit_of_measure ||
      part.unit ||
      part.unidadMedida ||
      part.unidad ||
      "UND",
  };

  if (part.unitPrice == null) normalized.unitPrice = normalized.unitCost;
  return normalized;
};

const extractParts = (payload) =>
  extractCollection(payload, [
    "parts",
    "maintenanceParts",
    "maintenance_parts",
    "spareParts",
    "spare_parts",
    "materials",
    "materiales",
    "repuestos",
    "insumos",
  ])
    .map(normalizePartRecord)
    .filter(Boolean);

const getEnumLabel = (labels, value) => {
  if (value === null || value === undefined || value === "") return value;
  const key = String(value).trim().toUpperCase();
  return labels[key] || value;
};

export default function MaintenanceDetails({
  isOpen,
  onClose,
  maintenance,
  onUpdateMaintenance,
  getUserName,
  getPersonName,
  getSupplierName,
  assets,
  users,
  persons,
  onDownloadConformityAct,
  canUpdate = false,
  canExecute = false,
  canViewCosts = false,
}) {
  const [history, setHistory] = useState([]);
  const [parts, setParts] = useState([]);
  const [conformity, setConformity] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingParts, setLoadingParts] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [showAddPart, setShowAddPart] = useState(false);
  const [localMaintenance, setLocalMaintenance] = useState(null);
  const [reprogramming, setReprogramming] = useState(false);
  const [autoReprogrammed, setAutoReprogrammed] = useState(false);
  const [newPart, setNewPart] = useState({
    partName: "",
    partType: "SPARE_PART",
    quantity: 1,
    unitCost: "",
    unitOfMeasure: "UND",
  });
  const [addingPart, setAddingPart] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [supplierDisplay, setSupplierDisplay] = useState("—");
  const [boletaImageUrl, setBoletaImageUrl] = useState(null);
  const [boletaImageLoading, setBoletaImageLoading] = useState(false);
  const [boletaImageError, setBoletaImageError] = useState(null);
  const abortRef = useRef(null);
  const mountedRef = useRef(true);
  const autoReprogramDoneRef = useRef(false);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const municipalityId = useMemo(() => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      return user?.municipalityId || user?.municipalidadId || null;
    } catch { return null; }
  }, []);

  const fetchParts = (id, controller) => {
    if (!mountedRef.current) return;
    setLoadingParts(true);
    maintenanceService
      .getParts(id, 0, 100, controller?.signal)
      .then((data) => {
        if (mountedRef.current && !controller?.signal?.aborted) {
          const arr = extractParts(data);
          setParts(arr);
        }
      })
      .catch((err) => {
        if (mountedRef.current && !controller?.signal?.aborted) {
          console.warn("[MaintenanceDetails] getParts falló:", err?.message);
          setParts((prev) => (prev.length > 0 ? prev : []));
        }
      })
      .finally(() => {
        if (mountedRef.current && !controller?.signal?.aborted) setLoadingParts(false);
      });
  };

  useEffect(() => {
    if (isOpen && maintenance?.id) {
      setHistory([]);
      setParts([]);
      setConformity(null);
      setDocuments([]);
      setBoletaImageUrl(null);
      setBoletaImageError(null);
      // Importante: preservamos TODOS los campos del registro (no solo los normalizados)
      // para que la pestaña de Detalles nunca quede en blanco si getById falla.
      const initial = { ...maintenance, ...normalizeMaintenance(maintenance) };
      setLocalMaintenance(initial);
      const initialParts = extractParts(initial);
      if (initialParts.length > 0) setParts(initialParts);
      setAutoReprogrammed(false);
      autoReprogramDoneRef.current = false;
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      maintenanceService
        .getById(maintenance.id, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted && data) {
            const detailParts = extractParts(data);
            if (detailParts.length > 0) setParts(detailParts);
            setLocalMaintenance((prev) => {
              const base = prev || initial;
              // Mergeamos manteniendo cualquier campo ya presente en `base`
              // (incluye el listado) y sobrescribiendo con la data del detalle
              // sólo cuando el nuevo valor no esté vacío.
              const merged = { ...base };
              const incoming = normalizeMaintenance(data);
              Object.keys(incoming).forEach((key) => {
                const v = incoming[key];
                if (v !== undefined && v !== null && v !== "") {
                  merged[key] = v;
                }
              });
              return merged;
            });
          }
        })
        .catch((err) => {
          if (!controller.signal.aborted) {
            console.warn("[MaintenanceDetails] getById falló:", err?.message);
          }
        });

      setLoadingHistory(true);
      maintenanceService
        .getHistory(maintenance.id, 0, 100, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) {
            const arr = Array.isArray(data) ? data : data?.content || [];
            setHistory(arr);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) setHistory([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoadingHistory(false);
        });

      fetchParts(maintenance.id, controller);

      // Cargar documentos asociados (boleta/factura)
      setLoadingDocuments(true);
      maintenanceService
        .getMaintenanceDocuments(maintenance.id, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) {
            // La respuesta puede llegar como array directo, content paginado, o envuelto
            let arr = [];
            if (Array.isArray(data)) arr = data;
            else if (data && Array.isArray(data.content)) arr = data.content;
            else if (data && Array.isArray(data.data)) arr = data.data;
            else if (data && Array.isArray(data.documents)) arr = data.documents;
            else if (data && Array.isArray(data.items)) arr = data.items;
            console.info(
              "[MaintenanceDetails] documentos recibidos:",
              arr.length,
              arr,
            );
            setDocuments(arr);
          }
        })
        .catch((err) => {
          if (!controller.signal.aborted) {
            console.warn("[MaintenanceDetails] getMaintenanceDocuments falló:", err?.message);
            setDocuments([]);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoadingDocuments(false);
        });

      if (maintenance.maintenanceStatus === "CONFIRMED") {
        maintenanceService
          .getConformity(maintenance.id, controller.signal)
          .then((data) => {
            if (!controller.signal.aborted) setConformity(data);
          })
          .catch(() => {
            if (!controller.signal.aborted) setConformity(null);
          });
      } else {
        setConformity(null);
      }
    }
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [isOpen, maintenance]);

  const currentMaintenance = useMemo(() => {
    // Fallback chain: localMaintenance (mezcla de listado + detalle) ->
    // maintenance (listado) -> {}. Nunca debe quedar en blanco.
    const base = { ...maintenance, ...(localMaintenance || {}) };
    return normalizeMaintenance(base);
  }, [localMaintenance, maintenance]);

  // Subtotal en tiempo real del repuesto que se está registrando.
  const newPartSubtotal = useMemo(() => {
    const q = parseFloat(newPart.quantity) || 0;
    const c = parseFloat(newPart.unitCost) || 0;
    return q * c;
  }, [newPart.quantity, newPart.unitCost]);

  // Resolver URL pública de la imagen de la boleta
  useEffect(() => {
    if (!isOpen) {
      setBoletaImageUrl(null);
      setBoletaImageError(null);
      return;
    }
    // Buscamos cualquier documento con fileName; filtramos por extensión
    // tanto en fileType, documentType, originalName como fileName.
    const imageExts = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i;
    const imageDoc = documents.find((d) => {
      const candidates = [
        d.fileType,
        d.documentType,
        d.originalName,
        d.fileName,
      ].filter(Boolean);
      if (candidates.some((c) => imageExts.test(String(c)))) return true;
      const t = String(d.fileType || d.documentType || "").toUpperCase();
      return ["JPG", "JPEG", "PNG", "WEBP", "GIF"].includes(t);
    });
    console.info(
      "[MaintenanceDetails] documentos cargados:",
      documents.length,
      "doc imagen:",
      imageDoc,
    );
    if (!imageDoc || !imageDoc.fileName) {
      setBoletaImageUrl(null);
      return;
    }
    let active = true;
    setBoletaImageLoading(true);
    setBoletaImageError(null);
    getFileUrl(imageDoc.fileName)
      .then((res) => {
        if (!active) return;
        console.info("[MaintenanceDetails] getFileUrl resultado:", res);
        if (res?.success && res.url) {
          setBoletaImageUrl(res.url);
        } else {
          setBoletaImageError(res?.error || "No se pudo obtener la URL del archivo");
        }
      })
      .catch((err) => {
        if (!active) return;
        console.warn("[MaintenanceDetails] getFileUrl falló:", err?.message);
        setBoletaImageError(err?.message || "Error al obtener la imagen");
      })
      .finally(() => {
        if (active) setBoletaImageLoading(false);
      });
    return () => { active = false; };
  }, [documents, isOpen]);

  const financialSummary = useMemo(
    () => computeFinancialSummary(currentMaintenance, parts),
    [currentMaintenance, parts],
  );

  useEffect(() => {
    const supplierId = currentMaintenance.serviceSupplierId;
    if (!supplierId) {
      setSupplierDisplay("—");
      return;
    }

    const name = getSupplierName(supplierId);
    if (name && name !== String(supplierId)) {
      setSupplierDisplay(name);
      return;
    }

    let active = true;
    maintenanceService
      .getSupplierDetails(supplierId)
      .then((data) => {
        if (!active) return;
        const resolved =
          data?.legalName ||
          data?.tradeName ||
          data?.name ||
          String(supplierId);
        setSupplierDisplay(resolved);
      })
      .catch(() => {
        if (active) setSupplierDisplay(String(supplierId));
      });

    return () => {
      active = false;
    };
  }, [currentMaintenance.serviceSupplierId, getSupplierName]);

  const handleAddPart = async (e) => {
    e.preventDefault();
    if (!newPart.partName?.trim() || !newPart.quantity || !newPart.unitCost) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "warning",
        title: "Campos requeridos",
        text: "Complete todos los campos para agregar el repuesto",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
      return;
    }
    try {
      setAddingPart(true);
      const createdPart = await maintenanceService.addPart(currentMaintenance.id || maintenance.id, {
        ...newPart,
        partName: newPart.partName.trim(),
        quantity: parseFloat(newPart.quantity) || 1,
        unitCost: parseFloat(newPart.unitCost) || 0,
      });
      const extractedCreatedParts = extractParts(createdPart);
      const createdSinglePart = normalizePartRecord(
        createdPart?.data ||
          createdPart?.result ||
          createdPart?.part ||
          createdPart?.item ||
          createdPart,
      );
      const optimisticParts =
        extractedCreatedParts.length > 0
          ? extractedCreatedParts
          : [createdSinglePart].filter(Boolean);
      if (optimisticParts.length > 0) {
        setParts((prev) => {
          const existingIds = new Set(prev.map((part) => part.id).filter(Boolean));
          const nextParts = optimisticParts.filter(
            (part) => !part.id || !existingIds.has(part.id),
          );
          return nextParts.length > 0 ? [...prev, ...nextParts] : prev;
        });
      }
      setNewPart({
        partName: "",
        partType: "SPARE_PART",
        quantity: 1,
        unitCost: "",
        unitOfMeasure: "UND",
      });
      setShowAddPart(false);
      const partsController = new AbortController();
      fetchParts(currentMaintenance.id || maintenance.id, partsController);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Repuesto agregado exitosamente",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error('Error al agregar repuesto:', err);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Error",
        text: err.message || "Error al agregar repuesto",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } finally {
      setAddingPart(false);
    }
  };

  const getLogoBase64 = useCallback(() => loadCompressedLogo(80), []);

  const handleExportPDF = async () => {
    try {
      setPdfGenerating(true);
      const m = currentMaintenance;
      const assetDesc = assets?.find((a) => a.id === m.assetId);

      // Obtener URL de la boleta/factura si existe
      let boletaImageUrl = null;
      try {
        const docsArr = Array.isArray(documents) ? documents : documents?.content || [];
        const imageTypes = ["JPG", "JPEG", "PNG", "WEBP", "GIF"];
        const imageDoc = docsArr.find((d) => {
          if (!d) return false;
          const ft = String(d.fileType || "").toUpperCase();
          if (ft.startsWith("IMAGE/") || imageTypes.includes(ft)) return true;
          const candidates = [d.fileType, d.documentType, d.originalName, d.fileName].filter(Boolean);
          const imageExts = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i;
          if (candidates.some((c) => imageExts.test(String(c)))) return true;
          const dt = String(d.documentType || "").toUpperCase();
          return ["BOLETA", "FACTURA", "COMPROBANTE"].includes(dt);
        });
        if (imageDoc?.fileName) {
          const storageRes = await getFileUrl(imageDoc.fileName);
          if (storageRes?.success && storageRes.url) {
            try {
              const resp = await fetch(storageRes.url);
              const contentType = resp.headers.get('content-type') || '';
              if (!contentType.startsWith('image/')) {
                throw new Error(`Response is not an image: ${contentType}`);
              }
              const blob = await resp.blob();
              boletaImageUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(blob);
              });
            } catch {
              boletaImageUrl = storageRes.url;
            }
          } else {
            console.warn("[PDF] getFileUrl failed:", storageRes?.error);
          }
        } else {
          console.warn("[PDF] No image document found among", docsArr.length, "documents");
        }
      } catch (err) {
        console.warn("Failed to load boleta image for PDF:", err);
      }

      let supplierName = getSupplierName(m.serviceSupplierId);
      if (supplierName === "—" || supplierName.length > 20) {
        try {
          const sd = await maintenanceService.getSupplierDetails(
            m.serviceSupplierId,
          );
          supplierName =
            sd?.legalName ||
            sd?.tradeName ||
            sd?.razonSocial ||
            sd?.nombre ||
            sd?.name ||
            sd?.nombreComercial ||
            sd?.fullName ||
            supplierName;
        } catch (err) {
          console.warn('Failed to get supplier details:', err);
        }
      }
      // Normalizar campos de conformidad (soportar camelCase y snake_case del API)
      const pick = (obj, ...keys) => { if (!obj) return undefined; for (const k of keys) { const v = obj[k]; if (v !== undefined && v !== null && v !== '') return v; } return undefined; };
      const conf = conformity || {};
      m.conformityNumber = pick(m, 'conformityNumber', 'conformity_number', 'numeroConformidad', 'conformidadNumero') || pick(conf, 'conformityNumber', 'conformity_number', 'numeroConformidad', 'conformidadNumero');
      m.workQuality = pick(m, 'workQuality', 'work_quality', 'calidadTrabajo') || pick(conf, 'workQuality', 'work_quality', 'calidadTrabajo');
      m.assetConditionAfter = pick(m, 'assetConditionAfter', 'asset_condition_after', 'estadoFinalBien') || pick(conf, 'assetConditionAfter', 'asset_condition_after', 'estadoFinalBien');
      m.requiresFollowup = pick(m, 'requiresFollowup', 'requires_followup', 'requiereSeguimiento') || pick(conf, 'requiresFollowup', 'requires_followup', 'requiereSeguimiento');
      m.followupDescription = pick(m, 'followupDescription', 'followup_description', 'descripcionSeguimiento') || pick(conf, 'followupDescription', 'followup_description', 'descripcionSeguimiento');
      m.patrimonialControllerName = pick(m, 'patrimonialControllerName', 'patrimonial_controller_name', 'nombreControlPatrimonial') || pick(conf, 'patrimonialControllerName', 'patrimonial_controller_name', 'nombreControlPatrimonial');
      m.patrimonialControllerDni = pick(m, 'patrimonialControllerDni', 'patrimonial_controller_dni', 'dniControlPatrimonial') || pick(conf, 'patrimonialControllerDni', 'patrimonial_controller_dni', 'dniControlPatrimonial');
      m.digitalSignature = pick(m, 'digitalSignature', 'digital_signature', 'firmaDigital') || pick(conf, 'digitalSignature', 'digital_signature', 'firmaDigital');
      const enrichedMaintenance = {
        ...m,
        _assetName:
          assetDesc?.description ||
          assetDesc?.descripcion ||
          m.assetDescription ||
          m.assetId ||
          "—",
        _responsibleName: getPersonName(m.technicalResponsibleId),
        _supplierName: supplierName,
        _supervisorName: (() => {
          const id = m.supervisorId;
          if (!id) return "—";
          const found = users.find((u) => String(u.id) === String(id));
          if (found) return found.username || `${found.firstName || ""} ${found.lastName || ""}`.trim() || String(id);
          const foundP = persons.find((p) => String(p.id) === String(id));
          if (foundP) return foundP.fullName || `${foundP.firstName || ""} ${foundP.lastName || ""}`.trim() || String(id);
          console.warn("[PDF] supervisorId not found in users/persons:", id);
          return String(id).slice(0, 8) + "…";
        })(),
        _requestedByName: getPersonName(m.requestedBy),
      };
      const [logoBase64, muniName] = await Promise.all([
        getLogoBase64(),
        (async () => {
          try {
            const muni = await getMunicipalidadById(municipalityId);
            return muni?.nombre || "";
          } catch { return ""; }
        })(),
      ]);
      const blob = await pdf(
        <SingleMaintenanceReport
          maintenance={enrichedMaintenance}
          parts={parts}
          history={history}
          hideCosts={!canViewCosts}
          municipalityLogo={logoBase64}
          municipalityName={muniName}
          boletaImageUrl={boletaImageUrl}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ficha_mantenimiento_${m.maintenanceCode || "doc"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      Swal.close();
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Error",
        text: "No se pudo generar la ficha PDF.",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } finally {
      setPdfGenerating(false);
    }
  };

  const parseDateOnly = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value !== "string" || value.length !== 10) return null;
    const [y, m, d] = value.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };

  const addDays = (date, days) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

  const executionDaysValue =
    parseInt(currentMaintenance.executionDays || 0, 10) || 0;
  const scheduledDateObj = parseDateOnly(currentMaintenance.scheduledDate);
  const actualEndDate = parseDateOnly(currentMaintenance.endDate);
  const endDateObj = actualEndDate || (scheduledDateObj && executionDaysValue
    ? addDays(scheduledDateObj, executionDaysValue)
    : null);

  const today = new Date();
  const todayMid = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const diffDays = endDateObj
    ? Math.floor(
        (endDateObj.getTime() - todayMid.getTime()) / (1000 * 60 * 60 * 24),
      )
    : null;
  const isOverdue = diffDays !== null && diffDays < 0;
  const isNearDue = diffDays !== null && diffDays >= 0 && diffDays <= 3;

  const handleReprogramPlusOne = useCallback(async () => {
    if (!currentMaintenance?.id) return;
    const nextDays = executionDaysValue + 1;
    setReprogramming(true);
    try {
      await onUpdateMaintenance(currentMaintenance.id, {
        executionDays: nextDays,
      });
      setLocalMaintenance((prev) => ({
        ...(prev || currentMaintenance),
        executionDays: nextDays,
      }));
      setAutoReprogrammed(true);
    } catch (err) {
      console.error("Error al reprogramar:", err.message);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Error",
        text: `No se pudo reprogramar automáticamente: ${err.message}`,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } finally {
      setReprogramming(false);
    }
  }, [currentMaintenance, executionDaysValue, onUpdateMaintenance]);

  useEffect(() => {
    if (!isOpen || !currentMaintenance?.id) return;
    if (autoReprogramDoneRef.current || autoReprogrammed) return;
    if (!isOverdue) return;
    if (!currentMaintenance.scheduledDate || !executionDaysValue) return;
    if (!canUpdate) return;
    if (
      currentMaintenance.maintenanceStatus === "PENDING_CONFORMITY" ||
      currentMaintenance.maintenanceStatus === "CONFIRMED"
    )
      return;

    handleReprogramPlusOne();
    autoReprogramDoneRef.current = true;
  }, [
    currentMaintenance?.id,
    isOpen,
    autoReprogrammed,
    isOverdue,
    currentMaintenance?.scheduledDate,
    currentMaintenance?.maintenanceStatus,
    executionDaysValue,
    canUpdate,
    handleReprogramPlusOne,
  ]);

  if (!isOpen || !maintenance) return null;

  const formatDate = (date) => {
    if (!date) return "—";
    if (typeof date === "string" && date.length === 10) {
      const [year, month, day] = date.split("-");
      const months = [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre",
      ];
      const monthIndex = parseInt(month, 10) - 1;
      const monthName = months[monthIndex] || `mes ${month}`;
      return `${day} de ${monthName} de ${year}`;
    }
    return new Date(date).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    const val = parseFloat(amount || 0);
    return `S/ ${val.toFixed(2)}`;
  };

  const sc = STATUS_COLORS[currentMaintenance.maintenanceStatus] || {
    bg: "#f1f5f9",
    text: "#64748b",
    dot: "#94a3b8",
  };
  const {
    partsTotal,
    laborCost,
    additionalCost,
    total: computedTotal,
  } = financialSummary;
  const serviceOrderRef =
    currentMaintenance.serviceReference || currentMaintenance.workOrder || "";
  const executionDaysDisplay =
    currentMaintenance.executionDays !== undefined &&
    currentMaintenance.executionDays !== null
      ? `${currentMaintenance.executionDays} día${currentMaintenance.executionDays === 1 ? "" : "s"}`
      : null;

  const statusLabel =
    STATUS_LABELS[currentMaintenance.maintenanceStatus] ||
    currentMaintenance.maintenanceStatus ||
    "Sin estado";
  const linkedAsset = assets?.find(
    (asset) => asset.id === currentMaintenance.assetId,
  );
  const assetName = linkedAsset
    ? linkedAsset.description || linkedAsset.descripcion
    : currentMaintenance.assetDescription || "â€”";
  const assetCode = linkedAsset
    ? linkedAsset.assetCode || linkedAsset.codigoBien
    : currentMaintenance.assetCode || "â€”";
  const warrantyDisplay = currentMaintenance.hasWarranty
    ? formatDate(currentMaintenance.warrantyExpirationDate)
    : "No aplica";
  const referenceDisplay =
    currentMaintenance.id?.substring(0, 8) || currentMaintenance.id || "â€”";
  const summaryTiles = [
    {
      label: "Estado",
      value: statusLabel,
      helper: "SituaciÃ³n actual",
      color: sc.dot,
    },
    {
      label: "Programado",
      value: formatDate(currentMaintenance.scheduledDate),
      helper: "Fecha base",
    },
    {
      label: "Fuera de servicio",
      value: executionDaysDisplay || "â€”",
      helper: isOverdue
        ? "Plazo vencido"
        : isNearDue
          ? "Por vencer"
          : "Plazo vigente",
      color: isOverdue ? "#ef4444" : isNearDue ? "#f59e0b" : "#10b981",
    },
    canViewCosts
      ? {
          label: "Total estimado",
          value: formatCurrency(computedTotal),
          helper: "Incluye materiales",
        }
      : {
          label: "GarantÃ­a",
          value: warrantyDisplay,
          helper: currentMaintenance.hasWarranty
            ? "Vigente registrada"
            : "Sin cobertura",
        },
  ];
  const cleanSummaryText = (value) => {
    if (typeof value !== "string") return value;
    return value
      .replace(/\u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u20ac\u009d/g, "\u2014")
      .replace(/\u00c3\u0192\u00c2\u00b3/g, "o")
      .replace(/\u00c3\u0192\u00c2\u00ad/g, "i");
  };

  const tabs = [
    { id: "info", label: "Detalles" },
    { id: "history", label: "Línea de Tiempo" },
    { id: "parts", label: "Repuestos" },
  ];
  const detailSectionClass =
    "mb-6 break-inside-avoid rounded-lg border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]";
  const detailHeadingClass =
    "text-[11px] font-semibold text-slate-950 uppercase tracking-[0.14em]";
  const detailActionClass =
    "text-[10px] font-semibold text-slate-500 hover:text-slate-950 uppercase tracking-[0.12em] transition-colors";
  const detailLoadingClass = "flex items-center gap-3 py-7 text-slate-400";
  
  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: "fadeIn 0.3s ease-out" }}
      />
      <div
        className="relative h-full w-full max-w-[1080px] bg-slate-50 shadow-[-18px_0_45px_-30px_rgba(15,23,42,0.65)] flex flex-col border-l border-slate-200/70"
        style={{ animation: "sheetSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-slate-200/80 bg-slate-50/95 px-5 py-5 backdrop-blur sm:px-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Expediente municipal de mantenimiento
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="truncate text-2xl font-semibold tracking-tight text-slate-950">
                  {currentMaintenance.maintenanceCode}
                </h2>
                <span
                  className="rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{ backgroundColor: sc.bg, color: sc.text }}
                >
                  {statusLabel}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
                <span>Ref: {cleanSummaryText(referenceDisplay)}</span>
                <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
                <span>Codigo: {cleanSummaryText(assetCode)}</span>
                <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
                <span className="truncate normal-case tracking-normal text-slate-600">
                  {cleanSummaryText(assetName)}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                disabled={pdfGenerating}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-slate-300 hover:text-slate-950 hover:shadow-sm active:scale-95 disabled:opacity-50"
                title="Exportar PDF"
              >
                {pdfGenerating ? (
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                )}
              </button>
              {currentMaintenance.maintenanceStatus === "CONFIRMED" && (
                <button
                  onClick={() => onDownloadConformityAct(currentMaintenance)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-600 transition-all hover:bg-amber-50 hover:shadow-sm active:scale-95"
                  title="Descargar Acta SBN"
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
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </button>
              )}
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 hover:shadow-sm active:scale-95"
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
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summaryTiles.map((item) => (
              <SummaryTile
                key={item.label}
                label={cleanSummaryText(item.label)}
                value={cleanSummaryText(item.value)}
                helper={cleanSummaryText(item.helper)}
                color={item.color}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex rounded-lg border border-slate-200 bg-white p-1">
            {tabs
              .filter(
                (tab, index, items) =>
                  items.findIndex((item) => item.id === tab.id) === index,
              )
              .map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-1 rounded-md py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                    activeTab === tab.id
                      ? "bg-slate-950 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7 custom-scrollbar">
          {activeTab === "info" && (
            <div className="animate-fadeIn xl:columns-2 xl:gap-6">
              {/* Activo Card */}
              {(() => {
                const asset = assets?.find(
                  (a) => a.id === currentMaintenance.assetId,
                );
                const assetName = asset
                  ? asset.description || asset.descripcion
                  : currentMaintenance.assetDescription || "—";
                const assetCode = asset
                  ? asset.assetCode || asset.codigoBien
                  : currentMaintenance.assetCode || "—";

                return (
                  <section className={detailSectionClass}>
                    <div className="flex items-center gap-4">
                      <div className="shrink-0 w-11 h-11 rounded-lg border border-slate-200/80 bg-slate-50 flex items-center justify-center text-slate-500">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Activo Vinculado
                        </span>
                        <h3 className="text-base font-semibold text-slate-950 truncate leading-tight">
                          {assetName}
                        </h3>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">
                          Código {assetCode}
                        </p>
                      </div>
                    </div>
                  </section>
                );
              })()}

              {/* Grid de Detalles */}
              <section className={`${detailSectionClass} grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5`}>
                <h4 className={`${detailHeadingClass} sm:col-span-2`}>
                  Datos administrativos
                </h4>
                <InfoRow
                  label="Categoría"
                  value={TYPE_LABELS[currentMaintenance.maintenanceType]}
                />
                <InfoRow
                  label="Prioridad"
                  value={PRIORITY_LABELS[currentMaintenance.priority]}
                />
                <InfoRow
                  label="Programado"
                  value={formatDate(currentMaintenance.scheduledDate)}
                />
                <InfoRow
                  label="Garantía"
                  value={
                    currentMaintenance.hasWarranty
                      ? formatDate(currentMaintenance.warrantyExpirationDate)
                      : "No aplica"
                  }
                />
                <InfoRow label="O.S. / Referencia" value={serviceOrderRef} />
                <InfoRow
                  label="Días Fuera de Servicio"
                  value={executionDaysDisplay}
                />
                <InfoRow
                  label="Inicio Real"
                  value={formatDateTime(currentMaintenance.startDate)}
                />
                <InfoRow
                  label="Finalización"
                  value={formatDateTime(currentMaintenance.endDate)}
                />
              </section>

              {currentMaintenance.scheduledDate &&
                currentMaintenance.maintenanceStatus !== "PENDING_CONFORMITY" &&
                currentMaintenance.maintenanceStatus !== "CONFIRMED" && (
                  <section className={`${detailSectionClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
                    <div className="flex items-center gap-3">
                      {(isOverdue || isNearDue) && (
                        <span
                          className={`w-2 h-2 rounded-full ${isOverdue ? "bg-red-500" : "bg-amber-400"}`}
                        />
                      )}
                      <p className="text-sm text-slate-600">
                        {isOverdue
                          ? "El plazo venció. Se reprograma automáticamente +1 día."
                          : "Puedes reprogramar +1 día si el trabajo sigue en curso."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleReprogramPlusOne}
                      disabled={!canUpdate || reprogramming}
                      className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all active:scale-95 ${
                        canUpdate
                          ? "bg-slate-950 text-white hover:bg-slate-800 hover:shadow-[0_12px_30px_-20px_rgba(15,23,42,0.9)]"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {reprogramming ? "Reprogramando..." : "+1 día"}
                    </button>
                  </section>
                )}

              {currentMaintenance.maintenanceStatus === "CONFIRMED" && (
                <section className={detailSectionClass}>
                  <h4 className={`${detailHeadingClass} mb-6`}>
                    Conformidad SBN
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
                    <InfoRow
                      label="Rep. Proveedor"
                      value={
                        conformity?.supplierRepresentativeName ||
                        currentMaintenance.supplierRepresentativeName
                      }
                    />
                    <InfoRow
                      label="DNI Rep."
                      value={
                        conformity?.supplierRepresentativeDni ||
                        currentMaintenance.supplierRepresentativeDni
                      }
                    />
                    <InfoRow
                      label="Responsable Área"
                      value={
                        conformity?.userAreaResponsibleName ||
                        currentMaintenance.userAreaResponsibleName
                      }
                    />
                    <InfoRow
                      label="Cargo / DNI"
                      value={`${conformity?.userAreaResponsiblePosition || currentMaintenance.userAreaResponsiblePosition || ""} (DNI: ${conformity?.userAreaResponsibleDni || currentMaintenance.userAreaResponsibleDni || ""})`}
                    />
                    <InfoRow
                      label="Calidad"
                      value={getEnumLabel(
                        WORK_QUALITY_LABELS,
                        conformity?.workQuality ||
                          currentMaintenance.workQuality,
                      )}
                    />
                    <InfoRow
                      label="Estado Final"
                      value={getEnumLabel(
                        ASSET_CONDITION_LABELS,
                        conformity?.assetConditionAfter ||
                          currentMaintenance.assetConditionAfter,
                      )}
                    />
                    <InfoRow
                      label="Seguimiento"
                      value={
                        (
                          conformity
                            ? conformity.requiresFollowup
                            : currentMaintenance.requiresFollowup
                        )
                          ? "Sí"
                          : "No"
                      }
                    />
                    {(conformity
                      ? conformity.requiresFollowup
                      : currentMaintenance.requiresFollowup) && (
                      <InfoRow
                        label="Detalles Seguimiento"
                        value={
                          conformity?.followupDescription ||
                          currentMaintenance.followupDescription
                        }
                        full
                      />
                    )}
                  </div>
                  {(conformity?.digitalSignature ||
                    currentMaintenance.digitalSignature) && (
                    <div className="mt-6 pt-6 border-t border-slate-100/80">
                      <dt className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] mb-1.5">
                        Firma Digital
                      </dt>
                      <dd className="text-[11px] text-slate-500 break-all leading-relaxed">
                        {conformity?.digitalSignature ||
                          currentMaintenance.digitalSignature}
                      </dd>
                    </div>
                  )}
                </section>
              )}

              {/* Bloques de Texto */}
              <section className="break-inside-avoid space-y-0">
                <div className={detailSectionClass}>
                  <h4 className={`${detailHeadingClass} mb-4`}>
                    Alcance del Trabajo
                  </h4>
                  <p className="text-sm text-slate-600 leading-7 whitespace-pre-line">
                    {currentMaintenance.workDescription ||
                      "Sin descripción técnica registrada."}
                  </p>
                </div>

                {currentMaintenance.reportedProblem && (
                  <div className={detailSectionClass}>
                    <h4 className={`${detailHeadingClass} mb-4`}>
                      Problema Reportado
                    </h4>
                    <p className="text-sm text-slate-600 leading-7">
                      {currentMaintenance.reportedProblem}
                    </p>
                  </div>
                )}
                {currentMaintenance.observations && (
                  <div className={detailSectionClass}>
                    <h4 className={`${detailHeadingClass} mb-4`}>
                      Observaciones
                    </h4>
                    <p className="text-sm text-slate-600 leading-7">
                      {currentMaintenance.observations}
                    </p>
                  </div>
                )}
                {currentMaintenance.appliedSolution && (
                  <div className={detailSectionClass}>
                    <h4 className={`${detailHeadingClass} mb-4`}>
                      Solución Implementada
                    </h4>
                    <p className="text-sm text-slate-600 leading-7">
                      {currentMaintenance.appliedSolution}
                    </p>
                  </div>
                )}
              </section>

              {/* Equipo Responsable */}
              <section className={detailSectionClass}>
                <h4 className={`${detailHeadingClass} mb-6`}>
                  Equipo de Mantenimiento
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
                  <InfoRow
                    label="Técnico"
                    value={(getPersonName || getUserName)(
                      currentMaintenance.technicalResponsibleId,
                    )}
                  />
                  <InfoRow label="Proveedor" value={supplierDisplay} />
                  <InfoRow
                    label="Supervisor"
                    value={getUserName(currentMaintenance.supervisorId)}
                  />
                  <InfoRow
                    label="Solicitante"
                    value={getUserName(currentMaintenance.requestedBy)}
                  />
                </div>
              </section>

              {canViewCosts && (
                <section className={detailSectionClass}>
                  <h4 className={`${detailHeadingClass} mb-6`}>
                    Resumen Financiero
                  </h4>
                  <div className="divide-y divide-slate-100/80">
                    {/* Mano de Obra */}
                    <div className="flex justify-between gap-4 py-3 text-sm first:pt-0">
                      <span className="text-slate-500">Mano de Obra</span>
                      <span className="text-slate-900 font-medium">
                        {formatCurrency(laborCost)}
                      </span>
                    </div>

                    {/* Costos adicionales (si existen) */}
                    {additionalCost > 0 && (
                      <div className="flex justify-between gap-4 py-3 text-sm">
                        <span className="text-slate-500">
                          Costos Adicionales
                        </span>
                        <span className="text-slate-900 font-medium">
                          {formatCurrency(additionalCost)}
                        </span>
                      </div>
                    )}

                    {/* Repuestos & Materiales — listado individual */}
                    <div className="py-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-slate-500 text-sm">
                          Repuestos & Materiales
                        </span>
                        <span className="text-slate-900 font-medium text-sm">
                          {formatCurrency(partsTotal)}
                        </span>
                      </div>
                      {parts.length > 0 ? (
                        <ul className="mt-3 divide-y divide-slate-100/80">
                          {parts.map((part, i) => {
                            const unit = parseFloat(
                              part.unitPrice || part.unitCost || 0,
                            );
                            const qty = parseFloat(part.quantity || 0);
                            const subtotal = unit * qty;
                            const unitLabel =
                              UNIT_OF_MEASURE_LABELS[part.unitOfMeasure] ||
                              part.unitOfMeasure ||
                              "Und";
                            const typeLabel =
                              PART_TYPE_LABELS[part.partType] ||
                              part.partType ||
                              "Insumo";
                            return (
                              <li
                                key={part.id || i}
                                className="flex items-start justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0"
                              >
                                <div className="min-w-0">
                                  <p className="text-slate-700 truncate">
                                    {part.partName}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-medium">
                                    {typeLabel} · {qty} {unitLabel} ×{" "}
                                    {formatCurrency(unit)}
                                  </p>
                                </div>
                                <span className="shrink-0 text-slate-900 font-medium">
                                  {formatCurrency(subtotal)}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">
                          No se han registrado repuestos o materiales.
                        </p>
                      )}
                    </div>

                    {/* Total */}
                    <div className="mt-2 flex items-center justify-between gap-4 pt-5">
                      <span className="text-[11px] font-semibold text-slate-950 uppercase tracking-[0.14em]">
                        Total
                      </span>
                      <span className="text-xl font-semibold text-slate-950 tracking-tight">
                        {formatCurrency(computedTotal)}
                      </span>
                    </div>
                  </div>
                </section>
              )}

              {/* Comprobante de Boleta / Factura */}
              <section className={detailSectionClass}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={detailHeadingClass}>
                    Comprobante
                  </h4>
                  {documents.length > 0 && (
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em]">
                      {documents.length} doc.
                    </span>
                  )}
                </div>

                {loadingDocuments ? (
                  <div className={detailLoadingClass}>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-200 border-t-slate-950" />
                    <span className="text-xs font-semibold uppercase tracking-[0.12em]">
                      Cargando comprobante…
                    </span>
                  </div>
                ) : boletaImageLoading ? (
                  <div className={detailLoadingClass}>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-200 border-t-slate-950" />
                    <span className="text-xs font-semibold uppercase tracking-[0.12em]">
                      Obteniendo imagen…
                    </span>
                  </div>
                ) : boletaImageError ? (
                  <div className="border-l border-slate-200 pl-4 text-sm text-slate-500">
                    No se pudo mostrar la imagen: {boletaImageError}
                  </div>
                ) : boletaImageUrl ? (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_16px_36px_-32px_rgba(15,23,42,0.75)] transition-shadow duration-300 hover:shadow-[0_22px_48px_-34px_rgba(15,23,42,0.85)]">
                      <img
                        src={boletaImageUrl}
                        alt="Comprobante de boleta o factura"
                        className="w-full h-auto max-h-96 object-contain bg-white"
                        loading="lazy"
                        onError={(e) => {
                          console.warn("[MaintenanceDetails] error cargando img:", boletaImageUrl);
                          e.currentTarget.style.display = "none";
                          setBoletaImageError("La URL de la imagen no es accesible (revise CORS / red).");
                        }}
                      />
                    </div>
                    {(() => {
                      const imgDoc = documents.find((d) => {
                        const exts = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i;
                        const c = [d.fileType, d.documentType, d.originalName, d.fileName].filter(Boolean);
                        if (c.some((x) => exts.test(String(x)))) return true;
                        const t = String(d.fileType || d.documentType || "").toUpperCase();
                        return ["JPG", "JPEG", "PNG", "WEBP", "GIF"].includes(t);
                      });
                      return (
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.12em]">
                          <span>
                            {imgDoc?.documentType === "FACTURA"
                              ? "Factura"
                              : "Boleta"}
                            {imgDoc?.invoiceNumber
                              ? ` · N° ${imgDoc.invoiceNumber}`
                              : ""}
                          </span>
                          <a
                            href={boletaImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={detailActionClass}
                          >
                            Abrir en nueva pestaña
                          </a>
                        </div>
                      );
                    })()}
                  </div>
                ) : documents.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">
                    No se adjuntó un comprobante en este mantenimiento.
                  </p>
                ) : (
                  // Hay documentos, pero ninguno coincide como imagen
                  <div className="space-y-3">
                    <p className="text-sm text-slate-500">
                      Se encontraron {documents.length} documento(s), pero ninguno es una imagen compatible.
                    </p>
                    <ul className="space-y-2">
                      {documents.map((d, i) => (
                        <li
                          key={d.id || i}
                          className="flex items-center justify-between gap-3 border-b border-slate-100/80 pb-2 text-[11px] last:border-b-0 last:pb-0"
                        >
                          <span className="font-medium text-slate-700 truncate">
                            {d.originalName || d.fileName || `Documento ${i + 1}`}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            {d.documentType || d.fileType || "—"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

            </div>

          )}


          {activeTab === "history" && (
            <div className="animate-fadeIn">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Sincronizando Historial
                  </p>
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-300">
                  <ClockIcon className="w-10 h-10" />
                  <p className="text-sm font-medium text-slate-400">
                    Aún no hay cambios registrados en este mantenimiento
                  </p>
                </div>
              ) : (
                (() => {
                  const orderedHistory = [...history].sort((a, b) => {
                    const aTime = new Date(
                      a.changedAt || a.createdAt || 0,
                    ).getTime();
                    const bTime = new Date(
                      b.changedAt || b.createdAt || 0,
                    ).getTime();

                    if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 0;
                    return aTime - bTime;
                  });
                  const firstStatus = getHistoryStatus(orderedHistory[0], "new");
                  const latestStatus =
                    currentMaintenance.maintenanceStatus ||
                    getHistoryStatus(
                      orderedHistory[orderedHistory.length - 1],
                      "new",
                    );
                  const timelineStartColor =
                    STATUS_COLORS[firstStatus]?.dot || "#e2e8f0";
                  const timelineEndColor =
                    STATUS_COLORS[latestStatus]?.dot || "#6366f1";

                  return (
                    <div className="relative pl-8">
                      <div
                        className="absolute left-1 top-2 bottom-2 w-px origin-top"
                        style={{
                          background: `linear-gradient(to bottom, ${timelineStartColor} 0%, ${timelineEndColor} 100%)`,
                          animation:
                            "timelineLineGrow 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
                        }}
                      />

                      {orderedHistory.map((h, i) => {
                        const previousStatus = getHistoryStatus(h, "previous");
                        const newStatus = getHistoryStatus(h, "new");
                        const statusColor =
                          STATUS_COLORS[newStatus]?.dot || "#94a3b8";
                        const statusStyle = STATUS_COLORS[newStatus] || {
                          bg: "#f8fafc",
                          text: "#475569",
                        };
                        const previousLabel =
                          STATUS_LABELS[previousStatus] ||
                          previousStatus ||
                          "Inicio";
                        const newLabel =
                          STATUS_LABELS[newStatus] || newStatus || "Cambio";
                        const EventIcon = getEventIcon(h);
                        const isLatest = i === orderedHistory.length - 1;

                        return (
                          <div
                            key={h.id || i}
                            className="relative mb-8 last:mb-0"
                            style={{
                              animation:
                                "timelineItemIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
                              animationDelay: `${i * 70}ms`,
                            }}
                          >
                            <div className="absolute -left-[31px] top-1.5">
                              {isLatest && (
                                <div
                                  className="absolute inset-0 rounded-full pulse-halo"
                                  style={{ backgroundColor: statusColor }}
                                />
                              )}
                              <div
                                className="relative z-10 w-3.5 h-3.5 rounded-full border-2 border-white ring-2"
                                style={{
                                  backgroundColor: statusColor,
                                  "--tw-ring-color": `${statusColor}40`,
                                }}
                              />
                            </div>

                            <div
                              className={`relative group bg-white border border-slate-200/80 rounded-xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.12)] hover:border-slate-300/80 transition-all duration-300 ${
                                isLatest ? "pt-9 sm:pt-5 sm:pr-36" : ""
                              }`}
                            >
                              {isLatest && (
                                <span className="absolute top-3 right-4 text-[9px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                                  Último cambio
                                </span>
                              )}

                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider"
                                  style={{
                                    backgroundColor: statusStyle.bg,
                                    color: statusStyle.text,
                                  }}
                                >
                                  <EventIcon className="w-3.5 h-3.5" />
                                  {newLabel}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  desde {previousLabel}
                                </span>
                              </div>

                              {(h.reason || h.observations) && (
                                <p className="text-xs text-slate-600 font-medium italic mb-2">
                                  "{h.reason || h.observations}"
                                </p>
                              )}
                              <p className="text-[10px] text-slate-400 font-bold uppercase">
                                {formatDateTime(h.changedAt || h.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>
          )}


          {activeTab === "parts" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Control de Insumos
                </h4>
                <button
                  disabled={
                    !canExecute || maintenance.maintenanceStatus !== "IN_PROCESS"
                  }
                  onClick={() => setShowAddPart(!showAddPart)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                    canExecute && maintenance.maintenanceStatus === "IN_PROCESS"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {showAddPart ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M6 18L18 6M6 6l12 12"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Registrar
                    </>
                  )}
                </button>
              </div>

              {showAddPart && (
                <form
                  onSubmit={handleAddPart}
                  className="bg-slate-900 rounded-3xl p-6 space-y-6 shadow-xl animate-modalEntry"
                >
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                      Descripción del Insumo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Disco de freno, Filtro..."
                      value={newPart.partName}
                      onChange={(e) =>
                        setNewPart({ ...newPart, partName: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                        Tipo *
                      </label>
                      <select
                        value={newPart.partType}
                        onChange={(e) =>
                          setNewPart({ ...newPart, partType: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        {Object.entries(PART_TYPE_LABELS).map(([val, lab]) => (
                          <option key={val} value={val}>
                            {lab}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                        Unidad *
                      </label>
                      <select
                        value={newPart.unitOfMeasure}
                        onChange={(e) =>
                          setNewPart({ ...newPart, unitOfMeasure: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        {Object.entries(UNIT_OF_MEASURE_LABELS).map(([val, lab]) => (
                          <option key={val} value={val}>
                            {lab}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                        Cant. *
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        value={newPart.quantity}
                        onChange={(e) =>
                          setNewPart({
                            ...newPart,
                            quantity: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                        P. Unitario (S/)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="0.00"
                        value={newPart.unitCost}
                        onChange={(e) =>
                          setNewPart({ ...newPart, unitCost: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white outline-none"
                      />
                    </div>
                  </div>
                  {/* Subtotal en tiempo real */}
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-800/70 border border-slate-700 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v8m9-4a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Subtotal
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        ({newPart.quantity || 0} × S/ {parseFloat(newPart.unitCost || 0).toFixed(2)})
                      </span>
                    </div>
                    <span className="text-base font-black text-emerald-400 tracking-tight">
                      {formatCurrency(newPartSubtotal)}
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={addingPart}
                    className="w-full py-3.5 bg-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-900/40"
                  >
                    {addingPart ? "Procesando..." : "Confirmar Registro"}
                  </button>
                </form>
              )}

              {loadingParts ? (
                <div className="flex justify-center py-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-100 border-t-indigo-500" />
                </div>
              ) : parts.length === 0 ? (
                <div className="text-center py-24 bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[2rem]">
                  <p className="text-sm font-bold text-slate-400">
                    Sin repuestos cargados
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {parts.map((part, i) => (
                    <div
                      key={part.id || i}
                      className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:border-indigo-200 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-black text-slate-800">
                            {part.partName}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                              {PART_TYPE_LABELS[part.partType] || part.partType || 'Insumo'}
                            </span>
                            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
                              {UNIT_OF_MEASURE_LABELS[part.unitOfMeasure] || part.unitOfMeasure || 'Und'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                            {part.quantity} {UNIT_OF_MEASURE_LABELS[part.unitOfMeasure] || part.unitOfMeasure || 'Und'}. ×{" "}
                            {formatCurrency(part.unitPrice || part.unitCost)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-indigo-600 tracking-tight">
                            {formatCurrency(
                              (part.quantity || 0) *
                                (part.unitPrice || part.unitCost || 0),
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="bg-slate-900 rounded-3xl p-6 flex justify-between items-center mt-10 shadow-2xl shadow-slate-200">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                        Total Materiales
                      </p>
                      <p className="text-2xl font-black text-white tracking-tighter">
                        {formatCurrency(
                          parts.reduce(
                            (sum, p) =>
                              sum +
                              (p.quantity || 0) *
                                (p.unitPrice || p.unitCost || 0),
                            0,
                          ),
                        )}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sheetSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes progressFill { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulseHalo { 0% { transform: scale(1); opacity: 0.55; } 70% { transform: scale(2); opacity: 0; } 100% { transform: scale(1); opacity: 0; } }
        @keyframes timelineItemIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes timelineLineGrow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        .timeline-glow { filter: drop-shadow(0 0 6px rgba(59,130,246,0.55)); }
        .pulse-halo { animation: pulseHalo 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
