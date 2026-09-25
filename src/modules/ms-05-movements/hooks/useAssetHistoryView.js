import { useState, useEffect, useCallback } from 'react';
import assetMovementService from '../services/assetMovementService';
import handoverReceiptService from '../services/handoverReceiptService';
import handoverUserService from '../services/handoverUserService';
import personService from '../../ms-02-authentication/services/personService';
import { getAllAreas } from '../../ms-03-configuration/services/areasApi';
import { getAllPhysicalLocations } from '../../ms-03-configuration/services/physicalLocationApi';
import { getBienPatrimonialById } from '../../ms-04-patrimonio/services/api';
import { cleanAssetName } from '../utils/assetNameFormatter';
import { normalizeApiList } from '../utils/movementReportHelpers';

export function useAssetHistoryView(assetId, enabled = false) {
  const [assetName, setAssetName] = useState('');
  const [assetMovements, setAssetMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyMapsReady, setHistoryMapsReady] = useState(false);
  const [persons, setPersons] = useState({});
  const [users, setUsers] = useState({});
  const [areas, setAreas] = useState({});
  const [locations, setLocations] = useState({});
  const [movementReceipts, setMovementReceipts] = useState({});

  const loadReceiptsForMovements = async (movementsData) => {
    const receiptsMap = {};
    const completedMovements = movementsData.filter((m) => m.movementStatus === 'COMPLETED');
    for (const mov of completedMovements) {
      try {
        const receipt = await handoverReceiptService.getHandoverReceiptByMovement(mov.id);
        if (receipt?.receiptNumber) receiptsMap[mov.id] = receipt.receiptNumber;
      } catch { /* acta opcional */ }
    }
    setMovementReceipts(receiptsMap);
  };

  const loadRelatedDataForHistory = async (movementsData) => {
    const personsMap = {};
    const usersMap = {};
    const areasMap = {};
    const locationsMap = {};
    const personIds = new Set();
    const userIds = new Set();
    const areaIds = new Set();
    const locationIds = new Set();
    const personName = (p) =>
      (p ? `${p.firstName || ''} ${p.middleName || ''} ${p.lastName || ''}`.trim() : null);

    movementsData.forEach((m) => {
      if (m.originResponsibleId) personIds.add(m.originResponsibleId);
      if (m.destinationResponsibleId) personIds.add(m.destinationResponsibleId);
      if (m.approvedBy) userIds.add(m.approvedBy);
      if (m.originAreaId) areaIds.add(m.originAreaId);
      if (m.destinationAreaId) areaIds.add(m.destinationAreaId);
      if (m.originLocationId) locationIds.add(m.originLocationId);
      if (m.destinationLocationId) locationIds.add(m.destinationLocationId);
    });

    const resolveResponsible = async (id) => {
      if (!id || personsMap[id]) return;
      try {
        const p = await personService.getPersonById(id);
        if (p) { personsMap[id] = personName(p) || id; return; }
      } catch { /* usuario */ }
      try {
        const u = await handoverUserService.getUserById(id);
        if (u?.personId) {
          const p = await personService.getPersonById(u.personId);
          personsMap[id] = personName(p) || u.username || id;
        } else if (u?.username) personsMap[id] = u.username;
      } catch { /* sin nombre */ }
    };

    const resolveUser = async (id) => {
      if (!id || usersMap[id]) return;
      try {
        const u = await handoverUserService.getUserById(id);
        if (u?.personId) {
          try {
            const p = await personService.getPersonById(u.personId);
            usersMap[id] = personName(p) || u.username || id;
          } catch {
            usersMap[id] = u.username || id;
          }
        } else if (u?.username) usersMap[id] = u.username;
      } catch {
        try {
          const p = await personService.getPersonById(id);
          usersMap[id] = personName(p) || id;
        } catch { /* sin nombre */ }
      }
    };

    await Promise.all([
      ...[...personIds].map((id) => resolveResponsible(id)),
      ...[...userIds].map((id) => resolveUser(id)),
    ]);

    try {
      const allAreas = normalizeApiList(await getAllAreas());
      for (const id of areaIds) {
        const a = allAreas.find((x) => x.id === id || x.areaId === id || String(x.id) === String(id));
        if (a) {
          const name = a.name || a.areaName || a.nombre || a.areaCode;
          if (name) { areasMap[id] = name; areasMap[String(id)] = name; }
        }
      }
    } catch { /* opcional */ }

    try {
      const allLocs = normalizeApiList(await getAllPhysicalLocations());
      for (const id of locationIds) {
        const l = allLocs.find((x) => x.id === id || x.locationId === id || String(x.id) === String(id));
        if (l) {
          const name = l.name || l.locationName || l.nombre || l.locationCode;
          if (name) { locationsMap[id] = name; locationsMap[String(id)] = name; }
        }
      }
    } catch { /* opcional */ }

    setPersons(personsMap);
    setUsers(usersMap);
    setAreas(areasMap);
    setLocations(locationsMap);
    setHistoryMapsReady(true);
  };

  const loadHistory = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    setHistoryMapsReady(false);
    setAssetMovements([]);
    setMovementReceipts({});
    try {
      try {
        const asset = await getBienPatrimonialById(id);
        if (asset) {
          setAssetName(cleanAssetName(asset.description || asset.descripcion || asset.assetCode || id));
        } else {
          setAssetName(id);
        }
      } catch {
        setAssetName(id);
      }

      const movs = await assetMovementService.getMovementsByAsset(id);
      const arr = Array.isArray(movs) ? movs : [];
      setAssetMovements(arr);
      if (arr.length > 0) {
        await loadRelatedDataForHistory(arr);
        loadReceiptsForMovements(arr).catch(() => {});
      } else {
        setHistoryMapsReady(true);
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
      setAssetMovements([]);
      setHistoryMapsReady(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !assetId) return;
    loadHistory(assetId);
  }, [assetId, enabled, loadHistory]);

  return {
    assetName,
    assetMovements,
    loading,
    historyMapsReady,
    persons,
    users,
    areas,
    locations,
    movementReceipts,
    reload: () => loadHistory(assetId),
  };
}
