import { useState, useEffect } from 'react';
import assetMovementService from '../services/assetMovementService';
import { parseAttachedDocuments } from '../services/movementDocumentService';
import userService from '../../ms-02-authentication/services/userService';
import handoverUserService from '../services/handoverUserService';
import personService from '../../ms-02-authentication/services/personService';
import authService from '../../ms-02-authentication/services/auth.service';
import { getAllAreas } from '../../ms-03-configuration/services/areasApi';
import { getAllPhysicalLocations } from '../../ms-03-configuration/services/physicalLocationApi';
import { getBienPatrimonialById } from '../../ms-04-patrimonio/services/api';
import { cleanAssetName } from '../utils/assetNameFormatter';
import { normalizeApiList, normalizeMovementForForm, resolveMovementAssetItems } from '../utils/movementReportHelpers';
import {
  buildPersonsById,
  buildUsersByAccountId,
  getPersonFullName,
  resolveResponsibleDisplayName,
  resolveUserDisplayName,
} from '../utils/movementUserAreaUtils';

const normalizeList = (data) => normalizeApiList(data);

export function useMovementDetails({ movementId}) {
  const [movement, setMovement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [persons, setPersons] = useState({});
  const [users, setUsers] = useState({});
  const [areas, setAreas] = useState({});
  const [locations, setLocations] = useState({});
  const [assetName, setAssetName] = useState(null);
  const [assetNames, setAssetNames] = useState([]);
  const [loadingRelatedData, setLoadingRelatedData] = useState(false);
  const [attachedDocuments, setAttachedDocuments] = useState([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  useEffect(() => {
    loadMovement();
    checkUserRole();
  }, [movementId]);
  const checkUserRole = () => {
    try {
      const currentUser = authService.getCurrentUser();
      let userId = currentUser?.userId || currentUser?.id;
      let userRoles = currentUser?.roles || [];
      if (!userId) {
        try {
          const stored = JSON.parse(sessionStorage.getItem('user') || 'null');
          userId = stored?.userId || stored?.id;
          userRoles = stored?.roles || [];
        } catch {  }
      }
      const isSuper = userRoles.some(r => r === 'SUPERADMIN' || r === 'superadmin' || r?.name === 'SUPERADMIN' || r?.name === 'superadmin');
      setCurrentUserId(userId);
      setIsSuperAdmin(isSuper);
    } catch { setIsSuperAdmin(false); }
  };
  const loadMovement = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await assetMovementService.getMovementById(movementId);
      if (data) {
        const normalized = normalizeMovementForForm(data);
        setMovement(normalized);
        setAttachedDocuments(data.attachedDocuments ? parseAttachedDocuments(data.attachedDocuments) : []);
        await loadRelatedData(normalized);
      } else {
        setError('Movimiento no encontrado');
      }
    } catch {
      setError('Error al cargar el movimiento');
    } finally {
      setLoading(false);
    }
  };
  const loadRelatedData = async (movementData) => {
    setLoadingRelatedData(true);
    const personsMap = {}, usersMap = {}, areasMap = {}, locationsMap = {};

    const resolveName = (p) => getPersonFullName(p);

    const putDisplayName = (map, id, name) => {
      if (!id || !name) return;
      map[id] = name;
      map[String(id)] = name;
    };

    let allUsers = [];
    let allPersons = [];
    try {
      allUsers = normalizeList(await userService.getAllUsers());
    } catch { /* lista local opcional */ }
    try {
      allPersons = normalizeList(await personService.getAllPersons());
    } catch {
      try {
        allPersons = normalizeList(await personService.getActivePersons());
      } catch { /* sin catálogo de personas */ }
    }

    const personsById = buildPersonsById(allPersons);
    const usersById = buildUsersByAccountId(allUsers);

    const resolveResponsible = async (id) => {
      const cached = resolveResponsibleDisplayName(id, usersById, personsById);
      if (cached) return cached;
      try {
        const p = await personService.getPersonById(id);
        return resolveName(p) || id;
      } catch {
        try {
          const u = await handoverUserService.getUserById(id);
          if (u?.personId) {
            try {
              const p = await personService.getPersonById(u.personId);
              return resolveName(p) || u.username || id;
            } catch {
              return u.username || id;
            }
          }
          return u?.username || id;
        } catch {
          return id;
        }
      }
    };

    const resolveUser = async (id) => {
      const cached = resolveUserDisplayName(id, usersById, personsById);
      if (cached) return cached;
      try {
        const u = await handoverUserService.getUserById(id);
        if (u?.personId) {
          try {
            const p = await personService.getPersonById(u.personId);
            return resolveName(p) || u.username || id;
          } catch {
            return u.username || id;
          }
        }
        return u?.username || id;
      } catch {
        try {
          const p = await personService.getPersonById(id);
          return resolveName(p) || id;
        } catch {
          return 'Usuario no disponible';
        }
      }
    };

    try {
      const responsibleIds = [...new Set([movementData.originResponsibleId, movementData.destinationResponsibleId].filter(Boolean))];
      const userIds = [...new Set([movementData.requestingUser, movementData.executingUser, movementData.approvedBy].filter(Boolean))];

      const [responsibleResults, userResults, allAreas, allLocs, asset] = await Promise.allSettled([
        Promise.all(responsibleIds.map(id => resolveResponsible(id).then(name => [id, name]))),
        Promise.all(userIds.map(id => resolveUser(id).then(name => [id, name]))),
        getAllAreas(),
        getAllPhysicalLocations(),
        (() => {
          const items = resolveMovementAssetItems(movementData);
          const ids = items.map((item) => item.assetId).filter(Boolean);
          return Promise.allSettled(ids.map((id) => getBienPatrimonialById(id)));
        })(),
      ]);

      if (responsibleResults.status === 'fulfilled') {
        responsibleResults.value.forEach(([id, name]) => putDisplayName(personsMap, id, name));
      }
      if (userResults.status === 'fulfilled') {
        userResults.value.forEach(([id, name]) => putDisplayName(usersMap, id, name));
      }
      if (allAreas.status === 'fulfilled') {
        for (const id of [movementData.originAreaId, movementData.destinationAreaId].filter(Boolean)) {
          const a = allAreas.value.find(x => x.id === id);
          areasMap[id] = a ? a.name || a.areaCode || id : id;
        }
      }
      if (allLocs.status === 'fulfilled') {
        for (const id of [movementData.originLocationId, movementData.destinationLocationId].filter(Boolean)) {
          const l = allLocs.value.find(x => x.id === id);
          locationsMap[id] = l ? l.name || l.locationCode || id : id;
        }
      }
      if (asset.status === 'fulfilled' && Array.isArray(asset.value)) {
        const items = resolveMovementAssetItems(movementData);
        const names = asset.value
          .map((result, index) => {
            const fallbackId = items[index]?.assetId || movementData.assetId;
            if (result.status === 'fulfilled' && result.value) {
              return cleanAssetName(
                result.value.description || result.value.descripcion || result.value.assetCode || fallbackId
              );
            }
            return fallbackId;
          })
          .filter(Boolean);
        setAssetNames(names);
        setAssetName(names[0] || movementData.assetId || null);
      } else if (movementData.assetId) {
        setAssetName(movementData.assetId);
        setAssetNames([movementData.assetId]);
      }
      setPersons(personsMap);
      setUsers(usersMap);
      setAreas(areasMap);
      setLocations(locationsMap);
    } catch {  }
    finally { setLoadingRelatedData(false); }
  };
  const handleAction = async (actionFn, ...args) => {
    setActionLoading(true);
    try {
      await actionFn(...args);
      await loadMovement();
    } finally { setActionLoading(false); }
  };
  return {
    movement, loading, error, actionLoading, persons, users, areas, locations,
    assetName, assetNames, loadingRelatedData, attachedDocuments, isSuperAdmin, currentUserId,
    handleAction,
  };
}
