import { useState, useEffect, useMemo, useCallback } from 'react';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import MovementsList from '../components/movements/MovementsList';
import MovementForm from '../components/movements/MovementForm';
import MovementDetails from '../components/movements/MovementDetails';
import { useAssetMovements } from '../hooks/useAssetMovements';
import assetMovementService from '../services/assetMovementService';
import userService from '../../ms-02-authentication/services/userService';
import personService from '../../ms-02-authentication/services/personService';
import positionService from '../../ms-02-authentication/services/positionService';
import { getBienesPatrimoniales, getBienPatrimonialById } from '../../ms-04-patrimonio/services/api';
import { getAllAreas, getAreaById } from '../../ms-03-configuration/services/areasApi';
import { getAllPhysicalLocations, getPhysicalLocationById } from '../../ms-03-configuration/services/physicalLocationApi';
import { hydrateMovementFormCatalogs } from '../utils/movementCatalogUtils';
import { MovementStatus, getMovementTypeSelectOptions } from '../types/movementTypes';
import { pdf } from '@react-pdf/renderer';
import MovementReport, { MOVEMENT_LIST_REPORT_TITLE } from '../reports/MovementReport';
import { loadCompressedLogo } from '../../../shared/reports';
import { openPdfInBrowser } from '../utils/openPdfReport';
import {
  getDestinationAreaId,
  normalizeApiList,
  normalizeMovementForForm,
  buildMovementAssetPayload,
  resolveMovementAssetItems,
} from '../utils/movementReportHelpers';
import { usePermissions } from '../../../hooks/usePermissions.js';
import ContentLoading from '../../../shared/utils/ContentLoading';
import AssetHistoryModal from '../components/movements/AssetHistoryModal';
import { formatAssetDisplayName } from '../utils/assetNameFormatter';

export default function MovementsPage() {
  const { canDo } = usePermissions();
  const canReadAllMovements = canDo('movimientos', 'read', '*');
  const readOwnScopeOnly = !canReadAllMovements && canDo('movimientos', 'read', 'own');
  const municipalityId = (() => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      if (user?.municipalCode) return user.municipalCode;
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.municipal_code || payload.municipalCode || payload.municipality_id || null;
      }
    } catch { /* skip */ }
    return null;
  })();

  const {
    movements, loading, error, loadMovements,
    createMovement, updateMovement, deleteMovement, restoreMovement,
    approveMovement, rejectMovement, markInProcess, completeMovement, cancelMovement
  } = useAssetMovements();
  const [deletedMovements, setDeletedMovements] = useState([]);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [assetSearchData, setAssetSearchData] = useState({});
  const [users, setUsers] = useState([]);
  const [persons, setPersons] = useState([]);
  const [positions, setPositions] = useState([]);
  const [assets, setAssets] = useState([]);
  const [areas, setAreas] = useState([]);
  const [locations, setLocations] = useState([]);
  const [formAreas, setFormAreas] = useState([]);
  const [formLocations, setFormLocations] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [municipalityLogo, setMunicipalityLogo] = useState(null);
  const [pdfExportLoading, setPdfExportLoading] = useState(false);
  const [showAssetHistory, setShowAssetHistory] = useState(false);
  const [historyAssetId, setHistoryAssetId] = useState(null);
  const [historyAssetSelect, setHistoryAssetSelect] = useState('');
  const municipalityName = sessionStorage.getItem('muniName') || '';

  useEffect(() => {
    loadCompressedLogo(80).then(setMunicipalityLogo);
  }, []);

  useEffect(() => {
    if (readOwnScopeOnly && activeFilter !== 'active') {
      setActiveFilter('active');
    }
  }, [readOwnScopeOnly, activeFilter]);

  useEffect(() => {
    const loadAssetSearchData = async () => {
      if (!movements || movements.length === 0) return;
      try {
        const assetIds = [...new Set(
          movements
            .flatMap((m) => resolveMovementAssetItems(m).map((item) => item.assetId))
            .filter(Boolean)
        )];
        const dataMap = {};
        await Promise.all(
          assetIds.map(async (assetId) => {
            try {
              const localAsset = assets.find(a => a.id === assetId);
              const asset = localAsset || await getBienPatrimonialById(assetId);
              if (asset) {
                dataMap[assetId] = {
                  code: asset.assetCode || asset.codigoPatrimonial || '',
                  description: asset.description || asset.descripcion || '',
                  sbn: asset.sbn || asset.codigoSBN || ''
                };
              }
            } catch {  }
          })
        );
        setAssetSearchData(dataMap);
      } catch {  }
    };
    loadAssetSearchData();
  }, [movements, assets]);
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        try {
          const userData = await userService.getAllUsers();
          let usersArray = [];
          if (Array.isArray(userData)) usersArray = userData;
          else if (userData?.data && Array.isArray(userData.data)) usersArray = userData.data;
          else if (userData?.content && Array.isArray(userData.content)) usersArray = userData.content;
          else if (userData && typeof userData === 'object') usersArray = [userData];
          const activeUsers = usersArray.filter(user => {
            const status = user.status || user.userStatus || user.state;
            const active = user.active !== undefined ? user.active : undefined;
            if (status === undefined && active === undefined) return true;
            return status === 'ACTIVE' || active === true ||
              (status !== 'INACTIVE' && status !== 'SUSPENDED' && status !== 'BLOCKED' && status !== 'INACTIVO');
          });
          setUsers(activeUsers.length > 0 ? activeUsers : usersArray);
        } catch { setUsers([]); }
        try {
          let personData = null;
          try { personData = await personService.getActivePersons(); }
          catch { personData = await personService.getAllPersons(); }
          let personsArray = [];
          if (Array.isArray(personData)) personsArray = personData;
          else if (personData?.data && Array.isArray(personData.data)) personsArray = personData.data;
          else if (personData?.content && Array.isArray(personData.content)) personsArray = personData.content;
          else if (personData && typeof personData === 'object') personsArray = [personData];
          if (municipalityId && personsArray.length > 0) {
            const byMunicipality = personsArray.filter(p => {
              const pid = p.municipalityId || p.municipalCode || p.municipality;
              return !pid || pid === municipalityId;
            });
            if (byMunicipality.length > 0) personsArray = byMunicipality;
          }
          const activePersons = personsArray.filter(person => {
            const status = person.status || person.personStatus || person.state;
            const active = person.active !== undefined ? person.active : undefined;
            if (status === undefined && active === undefined) return true;
            return status === 'ACTIVE' || active === true ||
              (status !== 'INACTIVE' && status !== 'SUSPENDED' && status !== 'BLOCKED' && status !== 'INACTIVO');
          });
          setPersons(activePersons.length > 0 ? activePersons : personsArray);
        } catch { setPersons([]); }
        try {
          const positionData = await positionService.getActivePositions();
          const positionsArray = normalizeApiList(positionData);
          setPositions(positionsArray);
        } catch { setPositions([]); }
        try {
          const assetData = await getBienesPatrimoniales();
          let assetsArray = normalizeApiList(assetData);
          if (municipalityId && assetsArray.length > 0) {
            assetsArray = assetsArray.filter(a => {
              const amid = a.municipalityId || a.municipalCode || a.municipality;
              return !amid || String(amid) === String(municipalityId);
            });
          }
          const permanentlyExcluded = ['BAJA', 'BAJA_PERMANENTE', 'OBSOLETO', 'PERDIDO', 'ROBADO', 'DESTRUIDO'];
          setAssets(assetsArray.filter(a => !permanentlyExcluded.includes(a.assetStatus || a.estadoBien || a.status || '')));
        } catch { setAssets([]); }
        try {
          const areaData = await getAllAreas();
          let filteredAreas = normalizeApiList(areaData);
          if (filteredAreas.length > 0) {
            if (filteredAreas[0].municipalityId) {
              const byMunicipality = filteredAreas.filter(
                (a) => !municipalityId || String(a.municipalityId) === String(municipalityId)
              );
              filteredAreas = (byMunicipality.length > 0 ? byMunicipality : filteredAreas).filter(a => a.active !== false);
            } else {
              filteredAreas = filteredAreas.filter(a => a.active !== false);
            }
          }
          setAreas(filteredAreas);
        } catch { setAreas([]); }
        try {
          const locationData = await getAllPhysicalLocations();
          let filteredLocations = normalizeApiList(locationData);
          if (filteredLocations.length > 0) {
            if (filteredLocations[0].municipalityId) {
              const byMunicipality = filteredLocations.filter(
                (l) => !municipalityId || String(l.municipalityId) === String(municipalityId)
              );
              filteredLocations = (byMunicipality.length > 0 ? byMunicipality : filteredLocations).filter(l => l.active !== false);
            } else {
              filteredLocations = filteredLocations.filter(l => l.active !== false);
            }
          }
          setLocations(filteredLocations);
        } catch { setLocations([]); }
      } catch {  } finally { setLoadingData(false); }
    };
    loadData();
  }, [municipalityId]);

  useEffect(() => {
    if (!showForm) {
      setFormAreas([]);
      setFormLocations([]);
      return undefined;
    }

    if (!selectedMovement) {
      setFormAreas(areas);
      setFormLocations(locations);
      return undefined;
    }

    let cancelled = false;
    setFormAreas(areas);
    setFormLocations(locations);

    hydrateMovementFormCatalogs({
      areas,
      locations,
      movement: selectedMovement,
      getAreaById,
      getPhysicalLocationById,
    }).then((result) => {
      if (!cancelled) {
        setFormAreas(result.areas);
        setFormLocations(result.locations);
      }
    }).catch(() => {
      if (!cancelled) {
        setFormAreas(areas);
        setFormLocations(locations);
      }
    });

    return () => { cancelled = true; };
  }, [showForm, selectedMovement, areas, locations]);

  const handleCreateNew = useCallback(() => { setSelectedMovement(null); setShowForm(true); }, []);
  const handleEdit = useCallback(async (movement) => {
    try {
      const full = await assetMovementService.getMovementById(movement.id);
      setSelectedMovement(
        normalizeMovementForForm(full ? { ...movement, ...full } : movement)
      );
    } catch {
      setSelectedMovement(normalizeMovementForForm(movement));
    }
    setShowForm(true);
  }, []);
  const handleView = useCallback((movement) => { setSelectedMovement(movement); setShowDetails(true); }, []);
  const handleFormCancel = useCallback(() => { setShowForm(false); setSelectedMovement(null); }, []);
  const handleDetailsClose = useCallback(() => { setShowDetails(false); setSelectedMovement(null); }, []);
  const handleFormSave = async (movementData) => {
    try {
      if (selectedMovement) {
        const assetPayload = buildMovementAssetPayload(movementData);
        const updateData = {
          municipalityId: movementData.municipalityId || municipalityId,
          ...assetPayload,
          movementType: movementData.movementType,
          movementSubtype: movementData.movementSubtype || null,
          originResponsibleId: movementData.originResponsibleId || null,
          destinationResponsibleId: movementData.destinationResponsibleId || null,
          originAreaId: movementData.originAreaId || null,
          destinationAreaId: movementData.destinationAreaId || null,
          originLocationId: movementData.originLocationId || null,
          destinationLocationId: movementData.destinationLocationId || null,
          reason: movementData.reason,
          observations: movementData.observations || null,
          specialConditions: movementData.specialConditions || null,
          supportingDocumentNumber: movementData.supportingDocumentNumber || null,
          supportingDocumentType: movementData.supportingDocumentType || null,
          attachedDocuments: (() => {
            const docs = movementData.attachedDocuments;
            if (!docs || docs === '' || (Array.isArray(docs) && docs.length === 0)) return null;
            if (typeof docs === 'string') {
              try { const parsed = JSON.parse(docs); return Array.isArray(parsed) && parsed.length > 0 ? parsed : null; }
              catch { return null; }
            }
            return Array.isArray(docs) && docs.length > 0 ? docs : null;
          })(),
          requiresApproval: movementData.requiresApproval !== undefined ? movementData.requiresApproval : true,
          movementStatus: movementData.movementStatus || selectedMovement.movementStatus,
          requestingUser: movementData.requestingUser,
          executingUser: movementData.executingUser || null
        };
        const fieldsToExclude = ['id', 'movementNumber', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'deletedAt', 'deletedBy'];
        const nullableFields = ['movementSubtype', 'observations', 'specialConditions', 'supportingDocumentNumber',
          'supportingDocumentType', 'attachedDocuments', 'executingUser', 'originResponsibleId',
          'destinationResponsibleId', 'originAreaId', 'destinationAreaId', 'originLocationId', 'destinationLocationId'];
        Object.keys(updateData).forEach(key => {
          if (fieldsToExclude.includes(key)) { delete updateData[key]; return; }
          if (updateData[key] === undefined || updateData[key] === '') {
            if (nullableFields.includes(key)) updateData[key] = null;
            else delete updateData[key];
          }
        });
        if (!updateData.assetId) updateData.assetId = selectedMovement.assetId;
        if (!updateData.assetIds?.length) {
          const fallback = buildMovementAssetPayload(selectedMovement);
          updateData.assetIds = fallback.assetIds;
          updateData.assetItems = fallback.assetItems;
        }
        if (!updateData.movementType) updateData.movementType = selectedMovement.movementType;
        if (!updateData.reason) updateData.reason = selectedMovement.reason || '';
        if (!updateData.requestingUser) updateData.requestingUser = selectedMovement.requestingUser;
        const updated = await assetMovementService.updateMovement(selectedMovement.id, updateData);
        updateMovement(normalizeMovementForForm({
          ...selectedMovement,
          ...updated,
          assetItems: updated?.assetItems?.length ? updated.assetItems : updateData.assetItems,
          assetIds: updated?.assetIds?.length ? updated.assetIds : updateData.assetIds,
          assetId: updated?.assetId || updateData.assetId,
        }));
        await loadMovements();
      } else {
        const createData = {
          ...movementData,
          municipalityId: movementData.municipalityId || municipalityId,
          requiresApproval: movementData.requiresApproval !== undefined ? movementData.requiresApproval : true,
        };
        delete createData.movementNumber;
        createData.attachedDocuments = (() => {
          const docs = movementData.attachedDocuments;
          if (!docs || docs === '' || (Array.isArray(docs) && docs.length === 0)) return null;
          if (typeof docs === 'string') {
            try { const parsed = JSON.parse(docs); return Array.isArray(parsed) && parsed.length > 0 ? parsed : null; }
            catch { return null; }
          }
          return Array.isArray(docs) && docs.length > 0 ? docs : null;
        })();
        const newMovement = await createMovement(createData);
        if (newMovement.movementNumber) {
          Swal.fire({
            title: 'Movimiento creado',
            text: `Numero de Movimiento: ${newMovement.movementNumber}`,
            icon: 'success', confirmButtonColor: '#10b981', confirmButtonText: 'Aceptar',
            timer: 3000, timerProgressBar: true,
          });
        }
        await loadMovements();
      }
      setShowForm(false);
      setSelectedMovement(null);
    } catch (error) { throw error; }
  };
  const handleApprove = async (id, approvedBy) => {
    try { await approveMovement(id, approvedBy); loadMovements(); } catch (error) { throw error; }
  };
  const handleReject = async (id, approvedBy, rejectionReason) => {
    try { await rejectMovement(id, approvedBy, rejectionReason); loadMovements(); } catch (error) { throw error; }
  };
  const handleMarkInProcess = async (id, executingUser) => {
    try { await markInProcess(id, executingUser); loadMovements(); } catch (error) { throw error; }
  };
  const handleComplete = async (id) => {
    try {
      await completeMovement(id);
      loadMovements();
      
      // El backend genera el acta automáticamente en MovementStatusManager.java
      // No es necesario crear el acta desde el frontend
      
      Swal.fire({
        icon: 'success',
        title: '¡Movimiento completado!',
        html: `
          <div class="text-left">
            <p class="text-gray-700 mb-3">El movimiento fue completado exitosamente.</p>
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div class="flex items-start">
                <svg class="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p class="text-sm font-semibold text-blue-800 mb-1">Acta generada automáticamente</p>
                  <p class="text-xs text-blue-700">El acta de entrega-recepción fue creada con todos los bienes y cantidades del movimiento. Revísala en "Actas de Entrega".</p>
                </div>
              </div>
            </div>
          </div>
        `,
        confirmButtonColor: '#283447',
        confirmButtonText: 'Entendido',
        width: '500px',
        timer: 5000,
        timerProgressBar: true,
      });
    } catch (error) { 
      throw error; 
    }
  };
  const handleCancel = async (id, cancellationReason) => {
    try { await cancelMovement(id, cancellationReason); loadMovements(); } catch (error) { throw error; }
  };
  const handleRestore = async (movement) => {
    if (!movement?.id) { Swal.fire({ icon: 'error', title: 'Error', text: 'ID de movimiento no valido' }); return; }
    const result = await Swal.fire({
      title: 'Restaurar movimiento?',
      text: `El movimiento ${movement.movementNumber || movement.id.slice(-8)} sera restaurado.`,
      icon: 'question', showCancelButton: true, confirmButtonColor: '#10b981', cancelButtonColor: '#64748b',
      confirmButtonText: 'Si, restaurar', cancelButtonText: 'Cancelar', reverseButtons: true,
    });
    if (result.isConfirmed) {
      try {
        const currentUser = JSON.parse(sessionStorage.getItem('user') || 'null');
        const token = sessionStorage.getItem('accessToken');
        let restoredBy = currentUser?.userId || currentUser?.id || null;
        if (!restoredBy && token) {
          try { restoredBy = JSON.parse(atob(token.split('.')[1]))?.user_id || null; } catch { /* skip */ }
        }
        Swal.fire({ title: 'Restaurando...', allowOutsideClick: false, allowEscapeKey: false, didOpen: () => Swal.showLoading() });
        await restoreMovement(movement.id, restoredBy);
        Swal.fire({ title: 'Restaurado!', text: 'El movimiento fue restaurado correctamente.', icon: 'success', confirmButtonColor: '#10b981', timer: 2000, timerProgressBar: true });
        await loadMovements();
        if (activeFilter === 'inactive' || activeFilter === 'all') {
          try { const deleted = await assetMovementService.getDeletedMovements(); setDeletedMovements(Array.isArray(deleted) ? deleted : []); }
          catch {  }
        }
      } catch (err) {
        Swal.fire({ title: 'Error al restaurar', text: err.message || 'No se pudo restaurar el movimiento', icon: 'error', confirmButtonColor: '#ef4444' });
      }
    }
  };
  const handleDelete = async (movement) => {
    if (!movement?.id) { Swal.fire({ icon: 'error', title: 'Error', text: 'ID de movimiento no valido' }); return; }
    const result = await Swal.fire({
      title: 'Eliminar movimiento?',
      text: `El movimiento ${movement.movementNumber || movement.id.slice(-8)} sera marcado como eliminado.`,
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b',
      confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar', reverseButtons: true,
    });
    if (result.isConfirmed) {
      try {
        const currentUser = JSON.parse(sessionStorage.getItem('user') || 'null');
        const token = sessionStorage.getItem('accessToken');
        let deletedBy = currentUser?.userId || currentUser?.id || null;
        if (!deletedBy && token) {
          try { deletedBy = JSON.parse(atob(token.split('.')[1]))?.user_id || null; } catch { /* skip */ }
        }
        Swal.fire({ title: 'Eliminando...', allowOutsideClick: false, allowEscapeKey: false, didOpen: () => Swal.showLoading() });
        await deleteMovement(movement.id, deletedBy);
        Swal.fire({ title: 'Eliminado!', text: 'El movimiento fue marcado como eliminado.', icon: 'success', confirmButtonColor: '#10b981', timer: 2000, timerProgressBar: true });
        await loadMovements();
        if (activeFilter === 'inactive' || activeFilter === 'all') {
          try { const deleted = await assetMovementService.getDeletedMovements(); setDeletedMovements(Array.isArray(deleted) ? deleted : []); }
          catch {  }
        }
      } catch (err) {
        Swal.fire({ title: 'Error al eliminar', text: err.message || 'No se pudo eliminar el movimiento', icon: 'error', confirmButtonColor: '#ef4444' });
      }
    }
  };
  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: MovementStatus.REQUESTED, label: 'Solicitado' },
    { value: MovementStatus.APPROVED, label: 'Aprobado' },
    { value: MovementStatus.REJECTED, label: 'Rechazado' },
    { value: MovementStatus.IN_PROCESS, label: 'En Proceso' },
    { value: MovementStatus.COMPLETED, label: 'Completado' },
    { value: MovementStatus.CANCELLED, label: 'Cancelado' },
    { value: MovementStatus.PARTIAL, label: 'Parcial' }
  ];
  const typeOptions = [
    { value: '', label: 'Todos los tipos' },
    ...getMovementTypeSelectOptions({ context: 'module' }),
  ];
  useEffect(() => {
    const loadDeletedMovements = async () => {
      if (readOwnScopeOnly) {
        setDeletedMovements([]);
        return;
      }
      if (activeFilter === 'inactive' || activeFilter === 'all') {
        try {
          setLoadingDeleted(true);
          const deleted = await assetMovementService.getDeletedMovements();
          setDeletedMovements(Array.isArray(deleted) ? deleted : []);
        } catch { setDeletedMovements([]); }
        finally { setLoadingDeleted(false); }
      } else { setDeletedMovements([]); }
    };
    loadDeletedMovements();
  }, [municipalityId, activeFilter, readOwnScopeOnly]);
  const isMovementActive = useCallback((movement) => {
    if (movement.active !== undefined) return movement.active === true;
    if (movement.deleted !== undefined) return movement.deleted === false;
    if (movement.deletedAt) return false;
    return true;
  }, []);

  const filteredMovements = useMemo(() => {
    const allMovementsToFilter = activeFilter === 'all'
      ? [...movements, ...deletedMovements]
      : activeFilter === 'inactive' ? deletedMovements : movements;
    return allMovementsToFilter.filter(movement => {
      if (statusFilter && movement.movementStatus !== statusFilter) return false;
      if (typeFilter && movement.movementType !== typeFilter) return false;
      const isActive = isMovementActive(movement);
      if (activeFilter === 'active' && !isActive) return false;
      if (activeFilter === 'inactive' && isActive) return false;
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        if ((movement.movementNumber || '').toLowerCase().includes(query)) return true;
        const assetItems = resolveMovementAssetItems(movement);
        for (const item of assetItems) {
          const d = assetSearchData[item.assetId];
          if (d) {
            if ((d.code || '').toLowerCase().includes(query)) return true;
            if ((d.description || '').toLowerCase().includes(query)) return true;
            if ((d.sbn || '').toLowerCase().includes(query)) return true;
          }
          if ((item.assetId || '').toLowerCase().includes(query)) return true;
        }
        if ((movement.reason || '').toLowerCase().includes(query)) return true;
        if ((movement.observations || '').toLowerCase().includes(query)) return true;
        if ((movement.originResponsibleId || '').toLowerCase().includes(query)) return true;
        if ((movement.destinationResponsibleId || '').toLowerCase().includes(query)) return true;
        return false;
      }
      return true;
    });
  }, [movements, deletedMovements, activeFilter, statusFilter, typeFilter, searchQuery, assetSearchData, isMovementActive]);
  const handleExportMovementsPdf = useCallback(async () => {
    if (pdfExportLoading || filteredMovements.length === 0) return;
    setPdfExportLoading(true);
    try {
      const enrichedMovements = await Promise.all(
        filteredMovements.map(async (movement) => {
          const hasAssetItems = Array.isArray(movement.assetItems || movement.asset_items)
            && (movement.assetItems || movement.asset_items).length > 0;
          const hasDestination = Boolean(getDestinationAreaId(movement));
          if (hasAssetItems && hasDestination) return movement;
          try {
            const full = await assetMovementService.getMovementById(movement.id);
            return full ? { ...movement, ...full } : movement;
          } catch {
            return movement;
          }
        })
      );

      const blob = await pdf(
        <MovementReport
          movements={enrichedMovements}
          assetSearchData={assetSearchData}
          areas={areas}
          persons={persons}
          municipalityLogo={municipalityLogo}
          municipalityName={municipalityName}
        />
      ).toBlob();

      openPdfInBrowser(blob, MOVEMENT_LIST_REPORT_TITLE);
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo generar el reporte PDF de movimientos.',
      });
    } finally {
      setPdfExportLoading(false);
    }
  }, [
    pdfExportLoading,
    filteredMovements,
    assetSearchData,
    areas,
    persons,
    municipalityLogo,
    municipalityName,
  ]);

  const assetHistoryOptions = useMemo(() => (
    assets
      .map((asset) => {
        const id = asset.id || asset.assetId || asset.uuid;
        if (!id) return null;
        return { id, label: formatAssetDisplayName(asset, true) };
      })
      .filter(Boolean)
      .sort((a, b) => a.label.localeCompare(b.label, 'es'))
  ), [assets]);

  const stats = useMemo(() => ({
    total: movements.filter(m => isMovementActive(m)).length,
    requested: movements.filter(m => isMovementActive(m) && m.movementStatus === MovementStatus.REQUESTED).length,
    inProcess: movements.filter(m => isMovementActive(m) && m.movementStatus === MovementStatus.IN_PROCESS).length,
    completed: movements.filter(m => isMovementActive(m) && m.movementStatus === MovementStatus.COMPLETED).length,
  }), [movements, isMovementActive]);

  if (loading || loadingDeleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
        <div className="relative h-[calc(100vh-3rem)]">
          <ContentLoading isLoading={true} message="Cargando movimientos..." />
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <div className="shadow-lg mb-8 rounded-2xl" style={{ background: 'var(--color-sidebar-gradient-horizontal)' }}>
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Movimientos de Activos</h1>
                <p className="text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Gestion y seguimiento de movimientos patrimoniales
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportMovementsPdf}
                disabled={pdfExportLoading || filteredMovements.length === 0}
                className={`flex items-center gap-2 px-5 py-2.5 bg-white/10 border-2 border-white/50 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-200 text-sm ${pdfExportLoading || filteredMovements.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {pdfExportLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Preparando...
                  </>
                ) : (
                  <>
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    Exportar PDF
                  </>
                )}
              </button>
              {canDo('movimientos', 'movement', 'submit') && (
                <button
                  onClick={handleCreateNew}
                  className="flex items-center gap-2 px-5 py-2.5 bg-transparent border-2 border-white/70 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-200 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Nuevo Movimiento
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {movements.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ borderLeft: '4px solid #283447' }}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(40, 52, 71, 0.1)' }}>
                  <svg className="w-6 h-6" style={{ color: '#283447' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white border-l-4 border-l-blue-500 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Solicitados</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-slate-800">{stats.requested}</p>
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white border-l-4 border-l-yellow-500 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">En Proceso</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-slate-800">{stats.inProcess}</p>
                <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white border-l-4 border-l-green-500 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Completados</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-slate-800">{stats.completed}</p>
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por numero, activo..."
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">Estado</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer text-sm">
              {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">Tipo</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer text-sm">
              {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">Estado del Registro</label>
            {readOwnScopeOnly ? (
              <div
                className="w-full pl-4 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-slate-700 font-medium text-sm"
                title="Tu perfil solo muestra movimientos activos en los que participas"
              >
                Activos
              </div>
            ) : (
              <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer text-sm">
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
                <option value="all">Todos</option>
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">Historial de bien</label>
            <select
              value={historyAssetSelect}
              onChange={(e) => {
                const value = e.target.value;
                setHistoryAssetSelect(value);
                if (value) {
                  setHistoryAssetId(value);
                  setShowAssetHistory(true);
                }
              }}
              disabled={loadingData || assetHistoryOptions.length === 0}
              className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer text-sm disabled:opacity-50"
            >
              <option value="">
                {loadingData
                  ? 'Cargando bienes...'
                  : assetHistoryOptions.length === 0
                    ? 'No hay bienes disponibles'
                    : 'Seleccionar bien...'}
              </option>
              {assetHistoryOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <p className="mt-1 text-sm text-red-700">{error}</p>
          <button onClick={loadMovements} className="mt-2 text-sm text-red-600 hover:text-red-500 underline">Intentar nuevamente</button>
        </div>
      )}
      <MovementsList
        municipalityId={municipalityId}
        statusFilter={statusFilter || null}
        typeFilter={typeFilter || null}
        activeFilter={activeFilter}
        readOwnScopeOnly={readOwnScopeOnly}
        hasListFilters={Boolean(statusFilter || typeFilter || searchQuery?.trim())}
        onView={handleView}
        onEdit={canDo('movimientos', 'movement', 'submit') ? handleEdit : null}
        onDelete={canDo('movimientos', 'movement', 'cancel') ? handleDelete : null}
        onRestore={canDo('movimientos', 'movement', 'restore') ? handleRestore : null}
        movements={filteredMovements}
        loading={loading}
        error={error}
        users={users}
        persons={persons}
        areas={areas}
        locations={locations}
        assetSearchData={assetSearchData}
        municipalityLogo={municipalityLogo}
        municipalityName={municipalityName}
      />
      {showForm && (
        <MovementForm
          municipalityId={municipalityId}
          movement={selectedMovement}
          assets={assets}
          users={users}
          persons={persons}
          positions={positions}
          areas={selectedMovement ? formAreas : areas}
          locations={selectedMovement ? formLocations : locations}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
          loadingData={loadingData}
        />
      )}
      <AssetHistoryModal
        open={showAssetHistory}
        assetId={historyAssetId}
        onClose={() => {
          setShowAssetHistory(false);
          setHistoryAssetId(null);
          setHistoryAssetSelect('');
        }}
        municipalityLogo={municipalityLogo}
        municipalityName={municipalityName}
      />
      {showDetails && selectedMovement && (
        <MovementDetails
          movementId={selectedMovement.id}
          municipalityId={municipalityId}
          municipalityLogo={municipalityLogo}
          municipalityName={municipalityName}
          onClose={handleDetailsClose}
          onEdit={canDo('movimientos', 'movement', 'submit') ? handleEdit : null}
          onApprove={canDo('movimientos', 'movement', 'approve') ? handleApprove : null}
          onReject={canDo('movimientos', 'movement', 'approve') ? handleReject : null}
          onMarkInProcess={canDo('movimientos', 'movement', 'execute') ? handleMarkInProcess : null}
          onComplete={canDo('movimientos', 'movement', 'execute') ? handleComplete : null}
          onCancel={canDo('movimientos', 'movement', 'cancel') ? handleCancel : null}
        />
      )}
    </div>
  );
}
