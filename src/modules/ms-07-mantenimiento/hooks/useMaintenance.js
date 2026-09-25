import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import maintenanceService from "../services/maintenanceService";
import {
  extractMaintenancesList,
  normalizeMaintenance,
  buildMaintenanceWritePayload,
} from "../utils/maintenanceMapper";
import userService from "../../ms-02-authentication/services/userService";
import personService from "../../ms-02-authentication/services/personService";
import { getProveedores } from "../../ms-03-configuration/services/api";
import { usePermissions } from "../../../hooks/usePermissions";

function getMunicipalityIdFromJWT() {
  try {
    const token = sessionStorage.getItem("accessToken");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return (
      payload.municipalityId ||
      payload.municipality_id ||
      payload.municipalCode ||
      payload.municipal_code ||
      null
    );
  } catch {
    return null;
  }
}

function getUserIdFromJWT() {
  try {
    const token = sessionStorage.getItem("accessToken");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.user_id || payload.userId || payload.sub || null;
  } catch {
    return null;
  }
}

const ASSET_ID_FIELDS = ["id", "assetId", "asset_id", "bienId", "bien_id", "uuid"];
const ASSET_NAME_FIELDS = [
  "description",
  "descripcion",
  "assetDescription",
  "asset_description",
  "name",
  "nombre",
  "assetName",
  "asset_name",
  "nombreBien",
  "nombre_bien",
  "descripcionBien",
  "descripcion_bien",
  "denominacion",
  "denomination",
  "denominacionBien",
  "denominacion_bien",
];
const ASSET_CODE_FIELDS = [
  "assetCode",
  "asset_code",
  "codigoBien",
  "codigo_bien",
  "codigoPatrimonial",
  "codigo_patrimonial",
  "patrimonialCode",
  "patrimonial_code",
  "code",
  "codigo",
];

function pickFirst(record, fields) {
  if (!record || typeof record !== "object") return "";
  for (const field of fields) {
    const value = record[field];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
}

function getAssetRecordId(asset) {
  return pickFirst(asset, ASSET_ID_FIELDS);
}

function getAssetDisplayName(asset) {
  return pickFirst(asset, ASSET_NAME_FIELDS);
}

function getAssetDisplayCode(asset) {
  return pickFirst(asset, ASSET_CODE_FIELDS);
}

function extractAssetRecord(data) {
  if (!data || typeof data !== "object") return null;
  if (Array.isArray(data)) return data[0] || null;
  const nested = data.data || data.content || data.asset || data.bien || data.result;
  if (Array.isArray(nested)) return nested[0] || null;
  return nested || data;
}

export function useMaintenance() {
  const { canDo, hasRole } = usePermissions();
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({ status: 'SCHEDULED', type: '', priority: '', search: '' });
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [persons, setPersons] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const abortRef = useRef(null);
  const assetDetailsCacheRef = useRef(new Map());

  const municipalityId = useMemo(() => getMunicipalityIdFromJWT(), []);
  const currentUserId = useMemo(() => getUserIdFromJWT(), []);
  const isSuperAdmin = hasRole("SUPER_ADMIN");

  const canRead = canDo("mantenimiento", "read");
  const canCreate = canDo("mantenimiento", "create");
  const canUpdate = canDo("mantenimiento", "update");
  const canExecute = canDo("mantenimiento", "execute", "process");
  const canConfirm = canDo("mantenimiento", "confirm", "sign");
  const canViewCosts = canDo("mantenimiento", "viewCosts");

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const safeSet = (setter, value) => {
    if (mountedRef.current) setter(value);
  };

  const loadMaintenances = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      safeSet(setLoading, true);
      safeSet(setError, null);
      const data = await maintenanceService.getAll(
        municipalityId,
        page,
        size,
        filters,
        controller.signal,
      );
      if (!controller.signal.aborted && mountedRef.current) {
        let items = [];
        if (data && data.content !== undefined) {
          items = extractMaintenancesList(data.content);
          safeSet(setTotalElements, data.totalElements || 0);
          safeSet(setTotalPages, data.totalPages || 0);
        } else {
          items = extractMaintenancesList(data);
          safeSet(setTotalElements, 0);
          safeSet(setTotalPages, 0);
        }

        const missingAssetIds = Array.from(
          new Set(
            items
              .filter((m) => m.assetId && !getAssetDisplayName(m))
              .map((m) => String(m.assetId)),
          ),
        );

        if (missingAssetIds.length > 0) {
          await Promise.allSettled(
            missingAssetIds.map(async (assetId) => {
              if (assetDetailsCacheRef.current.has(assetId)) return;
              const detail = await maintenanceService.getAssetDetails(
                assetId,
                controller.signal,
              );
              assetDetailsCacheRef.current.set(
                assetId,
                extractAssetRecord(detail) || {},
              );
            }),
          );

          items = items.map((m) => {
            const cached = assetDetailsCacheRef.current.get(String(m.assetId));
            if (!cached) return m;

            const assetDescription =
              getAssetDisplayName(m) || getAssetDisplayName(cached);
            const assetCode = getAssetDisplayCode(m) || getAssetDisplayCode(cached);

            return {
              ...m,
              ...(assetDescription ? { assetDescription } : {}),
              ...(assetCode ? { assetCode } : {}),
            };
          });
        }

        if (controller.signal.aborted || !mountedRef.current) return;

        // Filtrado cliente para campos que el backend no soporta
        const { type, priority, search } = filters;
        if (type || priority || search) {
          items = items.filter((m) => {
            if (type && m.maintenanceType !== type) return false;
            if (priority && m.priority !== priority) return false;
            if (search) {
              const q = search.toLowerCase();
              const haystack = [m.maintenanceCode, m.assetDescription, m.workOrder, m.workDescription, m.assetCode].filter(Boolean).join(" ").toLowerCase();
              if (!haystack.includes(q)) return false;
            }
            return true;
          });
        }
        safeSet(setMaintenances, items);
      }
    } catch (err) {
      if (err.name !== "CanceledError" && err.name !== "AbortError" && mountedRef.current) {
        const message = (() => {
          if (err.status === 500) {
            return "No se pudieron cargar los mantenimientos. El servidor municipal devolvió un error interno. Reintenta en unos momentos o contacta al administrador si el problema persiste.";
          }
          return err.message;
        })();
        safeSet(setError, message);
        console.error("[useMaintenance] loadMaintenances failed:", err);
      }
    } finally {
      if (mountedRef.current) {
        safeSet(setLoading, false);
      }
    }
  }, [page, size, filters, municipalityId]);

  const loadCrossData = useCallback(async () => {
    const promises = [];

    promises.push(
      (async () => {
        try {
          const userData = await userService.getAllUsers();
          let arr = [];
          if (Array.isArray(userData)) arr = userData;
          else if (userData?.data && Array.isArray(userData.data))
            arr = userData.data;
          else if (userData?.content && Array.isArray(userData.content))
            arr = userData.content;
          safeSet(setUsers, arr);
        } catch {
          safeSet(setUsers, []);
        }
      })(),
    );

    promises.push(
      (async () => {
        try {
          const personData = await personService.getAllPersons();
          let arr = [];
          if (Array.isArray(personData)) arr = personData;
          else if (personData?.data && Array.isArray(personData.data))
            arr = personData.data;
          else if (personData?.content && Array.isArray(personData.content))
            arr = personData.content;
          safeSet(setPersons, arr);
        } catch {
          safeSet(setPersons, []);
        }
      })(),
    );

    promises.push(
      (async () => {
        try {
          const supplierData = await getProveedores();
          let arr = [];
          if (Array.isArray(supplierData)) arr = supplierData;
          else if (supplierData?.data && Array.isArray(supplierData.data))
            arr = supplierData.data;
          else if (supplierData?.content && Array.isArray(supplierData.content))
            arr = supplierData.content;
          safeSet(setSuppliers, arr);
        } catch {
          safeSet(setSuppliers, []);
        }
      })(),
    );

    promises.push(
      (async () => {
        try {
          const assetData = await maintenanceService.getAllAssets(municipalityId);
          let arr = [];
          if (Array.isArray(assetData)) arr = assetData;
          else if (assetData?.data && Array.isArray(assetData.data))
            arr = assetData.data;
          else if (assetData?.content && Array.isArray(assetData.content))
            arr = assetData.content;
          const excluded = [
            "BAJA",
            "BAJA_PERMANENTE",
            "OBSOLETO",
            "PERDIDO",
            "ROBADO",
            "DESTRUIDO",
          ];
          safeSet(setAssets, arr.filter(
              (a) =>
                !excluded.includes(
                  a.assetStatus || a.estadoBien || a.status || "",
                ),
            ));
        } catch {
          safeSet(setAssets, []);
        }
      })(),
    );

    await Promise.allSettled(promises);
  }, [municipalityId]);

  useEffect(() => {
    Promise.all([loadMaintenances(), loadCrossData()]).catch(() => {});
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [loadMaintenances, loadCrossData]);

  const getAssetName = useCallback(
    (assetId, fallbackRecord = null) => {
      if (!assetId && fallbackRecord) {
        const fallbackName = getAssetDisplayName(fallbackRecord);
        if (fallbackName) return fallbackName;
      }
      if (!assetId) return "—";
      const asset = assets.find(
        (a) => String(getAssetRecordId(a)) === String(assetId),
      );
      const cached = assetDetailsCacheRef.current.get(String(assetId));
      const name =
        getAssetDisplayName(asset) ||
        getAssetDisplayName(fallbackRecord) ||
        getAssetDisplayName(cached);
      if (name) return name;
      return asset
        ? asset.description || asset.descripcion || String(assetId)
        : String(assetId).slice(0, 8) + "…";
    },
    [assets],
  );

  const getUserName = useCallback(
    (userId) => {
      if (!userId) return "—";
      const user = users.find((u) => String(u.id) === String(userId));
      return user
        ? user.username ||
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            String(userId)
        : String(userId).slice(0, 8) + "…";
    },
    [users],
  );

  const getPersonName = useCallback(
    (personId) => {
      if (!personId) return "—";
      const person = persons.find((p) => String(p.id) === String(personId));
      if (person) {
        return (
          person.fullName ||
          `${person.firstName || ""} ${person.lastName || ""}`.trim() ||
          String(personId)
        );
      }
      const user = users.find((u) => String(u.id) === String(personId));
      if (user) {
        return (
          user.username ||
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          String(personId)
        );
      }
      return String(personId).slice(0, 8) + "…";
    },
    [persons, users],
  );

  const getSupplierName = useCallback(
    (supplierId) => {
      if (!supplierId) return "—";
      const s = suppliers.find(
        (s) =>
          String(s.id) === String(supplierId) ||
          String(s.ruc) === String(supplierId) ||
          String(s.idProvider) === String(supplierId) ||
          String(s.numeroDocumento) === String(supplierId) ||
          String(s.documentNumber) === String(supplierId),
      );
      if (s) {
        return (
          s.legalName ||
          s.tradeName ||
          s.razonSocial ||
          s.name ||
          String(supplierId)
        );
      }
      return String(supplierId).length > 20
        ? String(supplierId).slice(0, 8) + "…"
        : String(supplierId);
    },
    [suppliers],
  );

  const createMaintenance = useCallback(
    async (data) => {
      const payload = buildMaintenanceWritePayload(data, {
        municipalityId,
        isCreate: true,
      });

      if (payload.assetId) {
        const selectedAsset = assets.find(
          (a) => String(getAssetRecordId(a)) === String(payload.assetId),
        );
        if (selectedAsset) {
          payload.assetCode = getAssetDisplayCode(selectedAsset) || "";
          payload.assetDescription = getAssetDisplayName(selectedAsset) || "";
        }
      }

      if (!municipalityId) {
        throw new Error(
          "No se pudo identificar la municipalidad de su sesión. Cierre sesión e ingrese nuevamente.",
        );
      }

      if (!payload.requestedBy && currentUserId)
        payload.requestedBy = currentUserId;
      const result = await maintenanceService.create(payload);
      await loadMaintenances();
      return normalizeMaintenance(result);
    },
    [currentUserId, loadMaintenances, assets, municipalityId],
  );

  const updateMaintenance = useCallback(
    async (id, data) => {
      const payload = buildMaintenanceWritePayload(data, {
        municipalityId,
        isCreate: false,
      });

      if (payload.assetId) {
        const selectedAsset = assets.find(
          (a) => String(getAssetRecordId(a)) === String(payload.assetId),
        );
        if (selectedAsset) {
          payload.assetCode = getAssetDisplayCode(selectedAsset) || "";
          payload.assetDescription = getAssetDisplayName(selectedAsset) || "";
        }
      }

      const result = await maintenanceService.update(id, payload);
      await loadMaintenances();
      return normalizeMaintenance(result);
    },
    [loadMaintenances, assets, municipalityId],
  );

  const startMaintenance = useCallback(
    async (id, observations = "") => {
      const result = await maintenanceService.startMaintenance(id, {
        observations,
      });
      await loadMaintenances();
      return result;
    },
    [loadMaintenances],
  );

  const completeMaintenance = useCallback(
    async (id, body) => {
      const result = await maintenanceService.completeMaintenance(id, body);
      await loadMaintenances();
      return result;
    },
    [loadMaintenances],
  );


  const confirmMaintenance = useCallback(
    async (id, conformityData) => {
      const result = await maintenanceService.confirmMaintenance(id, conformityData);
      await loadMaintenances();
      return result;
    },
    [loadMaintenances],
  );

  const suspendMaintenance = useCallback(
    async (id, nextDate, observations = "") => {
      const result = await maintenanceService.suspendMaintenance(id, {
        nextDate,
        observations,
      });
      await loadMaintenances();
      return result;
    },
    [loadMaintenances],
  );

  const rescheduleMaintenance = useCallback(
    async (id, nextDate, observations = "") => {
      const result = await maintenanceService.rescheduleMaintenance(id, {
        nextDate,
        observations,
      });
      await loadMaintenances();
      return result;
    },
    [loadMaintenances],
  );

  const cancelMaintenance = useCallback(
    async (id, observations = "") => {
      const result = await maintenanceService.cancelMaintenance(id, {
        observations,
      });
      await loadMaintenances();
      return result;
    },
    [loadMaintenances],
  );

  return {
    maintenances,
    loading,
    error,
    page,
    setPage,
    size,
    setSize,
    totalElements,
    totalPages,
    filters,
    setFilters,
    municipalityId,
    currentUserId,
    isSuperAdmin,
    canRead,
    canCreate,
    canUpdate,
    canExecute,
    canConfirm,
    canViewCosts,
    assets,
    users,
    persons,
    suppliers,
    getAssetName,
    getUserName,
    getPersonName,
    getSupplierName,
    loadMaintenances,
    createMaintenance,
    updateMaintenance,
    startMaintenance,
    completeMaintenance,
    confirmMaintenance,
    suspendMaintenance,
    rescheduleMaintenance,
    cancelMaintenance,
  };
}

export default useMaintenance;
