import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../../ms-02-authentication/hooks/useAuth";
import { usePermissions } from "../../../hooks/usePermissions";
import InventoryList from "../components/InventoryList";
import InventoryFormModal from "../components/InventoryFormModal";
import InventoryDetailModal from "../components/InventoryDetailModal";
import {
  getAllInventories,
  createInventory,
  updateInventory,
  deleteInventory,
  startInventory,
  completeInventory,
  getAreas,
  getCategories,
  getPhysicalLocations,
  getPersons,
  getUsers,
  getAssets
} from "../services/inventoryApi";
import { createInventoryDetail } from "../services/inventoryDetailApi";
import ContentLoading from "../../../shared/utils/ContentLoading";


export default function InventarioModule() {
  const { user } = useAuth();
  const { canDo } = usePermissions();
  const location = useLocation();
  const [inventories, setInventories] = useState([]);
  const [areas, setAreas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);       // personas
  const [systemUsers, setSystemUsers] = useState([]); // usuarios sistema para verifiedBy
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [editingInventory, setEditingInventory] = useState(null);
  // Si viene de completar un inventario, mostrar directamente el filtro COMPLETED
  const [statusFilter, setStatusFilter] = useState(
    location?.state?.statusFilter || "PLANNED"
  );

  // Permisos operativos del módulo
  const canCreate   = canDo('inventario', 'create');
  const canUpdate   = canDo('inventario', 'update');
  const canDelete   = canDo('inventario', 'delete');
  const canVerify   = canDo('inventario', 'verify', 'scan');
  const canClose    = canDo('inventario', 'close', 'finalize');

  // Mismo patrón que MovementsPage: primero sessionStorage.user, luego JWT
  const municipalityId = (() => {
    try {
      const u = JSON.parse(sessionStorage.getItem('user') || 'null');
      if (u?.municipalCode) return u.municipalCode;
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.municipal_code || payload.municipalCode || payload.municipality_id || null;
      }
    } catch { /* skip */ }
    return null;
  })();

  // Obtener el ID del usuario autenticado
  const currentUserId = user?.id || user?.userId;


  useEffect(() => {
    loadInventories();
    loadConfigurationData();
  }, [municipalityId]);


  const loadInventories = async () => {
    try {
      setLoading(true);
      // Traer todos los inventarios y filtrar en frontend
      // igual que MovementsPage hace con áreas y ubicaciones
      const data = await getAllInventories();
      let all = Array.isArray(data) ? data : [];

      // Mismo patrón condicional que MovementsPage:
      // solo filtra si los objetos tienen el campo municipalityId
      if (all.length > 0 && municipalityId) {
        if (all[0].municipalityId !== undefined) {
          const byMunicipality = all.filter(inv => inv.municipalityId === municipalityId);
          all = byMunicipality.length > 0 ? byMunicipality : all;
        }
      }

      setInventories(all);
    } catch (error) {
      console.error('Error al cargar inventarios:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los inventarios',
        confirmButtonColor: '#4f46e5'
      });
    } finally {
      setLoading(false);
    }
  };


  const loadConfigurationData = async () => {
    try {
      const [areasData, categoriesData, locationsData, personsData, usersData, assetsData] = await Promise.all([
        getAreas(),
        getCategories(),
        getPhysicalLocations(),
        getPersons(),
        getUsers(),
        getAssets()
      ]);

      // Mismo patrón condicional que MovementsPage para áreas
      let filteredAreas = Array.isArray(areasData) ? areasData : [];
      if (filteredAreas.length > 0 && municipalityId) {
        if (filteredAreas[0].municipalityId !== undefined) {
          const byMunicipality = filteredAreas.filter(a => a.municipalityId === municipalityId);
          filteredAreas = byMunicipality.length > 0 ? byMunicipality : filteredAreas;
        }
      }

      // Mismo patrón condicional que MovementsPage para ubicaciones
      let filteredLocations = Array.isArray(locationsData) ? locationsData : [];
      if (filteredLocations.length > 0 && municipalityId) {
        if (filteredLocations[0].municipalityId !== undefined) {
          const byMunicipality = filteredLocations.filter(l => l.municipalityId === municipalityId);
          filteredLocations = byMunicipality.length > 0 ? byMunicipality : filteredLocations;
        }
      }

      // Filtrar personas por municipalidad
      let filteredUsers = Array.isArray(personsData) ? personsData : [];
      if (filteredUsers.length > 0 && municipalityId) {
        const byMunicipality = filteredUsers.filter(p => {
          const pid = p.municipalityId || p.municipalCode || p.municipality;
          return !pid || pid === municipalityId;
        });
        if (byMunicipality.length > 0) filteredUsers = byMunicipality;
      }

      setAreas(filteredAreas);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setLocations(filteredLocations);
      setUsers(filteredUsers);
      setSystemUsers(Array.isArray(usersData) ? usersData.filter(u => u.active !== false) : []);
      setAssets(Array.isArray(assetsData) ? assetsData : []);
    } catch (error) {
      console.error('❌ Error al cargar datos de configuración:', error);
    }
  };


  const handleCreateNew = () => {
    if (!canCreate) return;
    setEditingInventory(null);
    setIsFormOpen(true);
  };


  const handleEdit = (inventory) => {
    if (!canUpdate) return;
    setEditingInventory(inventory);
    setIsFormOpen(true);
  };


  const handleView = (inventory) => {
    setSelectedInventory(inventory);
    setIsDetailOpen(true);
  };


  const handleSave = async (formData) => {
    try {
      Swal.fire({
        title: 'Guardando...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });


      if (editingInventory) {
        await updateInventory(editingInventory.id, formData);
        Swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'Inventario actualizado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        await createInventory(formData);
        Swal.fire({
          icon: 'success',
          title: 'Creado',
          text: 'Inventario creado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      }


      setIsFormOpen(false);
      setEditingInventory(null);
      loadInventories();
    } catch (error) {
      console.error('Error al guardar inventario:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo guardar el inventario',
        confirmButtonColor: '#4f46e5'
      });
    }
  };


  const handleDelete = async (id) => {
    if (!canDelete) return;
    try {
      if (!currentUserId) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo identificar el usuario actual',
          confirmButtonColor: '#4f46e5'
        });
        return;
      }


      console.log('🗑️ Eliminando con userId:', currentUserId);
      console.log('👥 Usuarios disponibles:', users.map(u => ({ id: u.id, nombre: u.nombre || u.name || u.username })));


      Swal.fire({
        title: 'Eliminando...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });


      await deleteInventory(id, currentUserId);
     
      Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'Inventario eliminado correctamente',
        timer: 2000,
        showConfirmButton: false
      });


      loadInventories();
    } catch (error) {
      console.error('Error al eliminar inventario:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo eliminar el inventario',
        confirmButtonColor: '#4f46e5'
      });
    }
  };


  const handleStart = async (id) => {
    if (!canVerify) return;
    try {
      Swal.fire({
        title: 'Iniciando inventario...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const result = await startInventory(id, currentUserId);
      console.log('✅ Inventario iniciado, respuesta:', result);

      // Auto-poblar detalles según el tipo de inventario
      const inventory = inventories.find(inv => inv.id === id);
      if (inventory) {
        try {
          const allAssets = await getAssets();
          // Excluir activos dados de baja
          const activeAssets = allAssets.filter(asset => {
            const status = asset.assetStatus || asset.estadoBien;
            return status !== 'BAJA' && status !== 'INACTIVE';
          });
          let assetsToAdd = [];

          if (inventory.inventoryType === 'GENERAL') {
            assetsToAdd = activeAssets;
          } else if (inventory.inventoryType === 'SELECTIVE') {
            assetsToAdd = activeAssets.filter(asset => {
              if (inventory.areaId) return asset.currentAreaId === inventory.areaId;
              if (inventory.categoryId) return asset.categoryId === inventory.categoryId;
              if (inventory.locationId) return asset.currentLocationId === inventory.locationId;
              return false;
            });
          }

          if (assetsToAdd.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            await Promise.all(
              assetsToAdd.map(asset =>
                createInventoryDetail({
                  municipalityId: inventory.municipalityId,
                  inventoryId: id,
                  assetId: asset.id,
                  foundStatus: 'FOUND',
                  actualConservationStatus: asset.conservationStatus || 'GOOD',
                  actualLocationId: asset.currentLocationId || null,
                  actualResponsibleId: asset.responsibleId || null,
                  verifiedBy: currentUserId || null,
                  verificationDate: `${today}T00:00:00`,
                  observations: '',
                  requiresAction: false,
                  requiredAction: '',
                  photographs: [],
                  additionalEvidence: [],
                  physicalDifferences: '',
                  documentDifferences: ''
                }).catch(err => console.warn(`⚠️ No se pudo crear detalle para asset ${asset.id}:`, err))
              )
            );
            console.log(`✅ ${assetsToAdd.length} detalles creados automáticamente`);
          }
        } catch (err) {
          console.warn('⚠️ Error al auto-poblar detalles:', err);
        }
      }

      Swal.fire({
        icon: 'success',
        title: 'Iniciado',
        text: 'Inventario iniciado correctamente',
        timer: 1500,
        showConfirmButton: false
      });

      setTimeout(() => {
        loadInventories();
      }, 1600);
    } catch (error) {
      console.error('❌ Error al iniciar inventario:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo iniciar el inventario',
        confirmButtonColor: '#4f46e5'
      });
    }
  };


  const handleComplete = async (id) => {
    if (!canClose) return;
    try {
      console.log('✔️ Completando inventario:', id);

      Swal.fire({
        title: 'Completando inventario...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const result = await completeInventory(id, currentUserId);
      console.log('✅ Inventario completado, respuesta:', result);

      Swal.fire({
        icon: 'success',
        title: 'Completado',
        text: 'Inventario completado correctamente',
        timer: 1500,
        showConfirmButton: false
      });

      setTimeout(() => {
        loadInventories();
      }, 1600);
    } catch (error) {
      console.error('❌ Error al completar inventario:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo completar el inventario',
        confirmButtonColor: '#4f46e5'
      });
    }
  };


  if (loading) {
    return (
      <div className="relative min-h-[400px]">
        <ContentLoading isLoading={true} message="Cargando inventarios..." />
      </div>
    );
  }


  const countByStatus = {
    todos: inventories.length,
    PLANNED: inventories.filter(inv => {
      const status = inv?.status || inv?.inventoryStatus;
      let normalized = String(status || '').toUpperCase().trim().replace(/\s+/g, '_');
      if (normalized === 'IN_PROCESS') normalized = 'IN_PROGRESS';
      return normalized === 'PLANNED';
    }).length,
    IN_PROGRESS: inventories.filter(inv => {
      const status = inv?.status || inv?.inventoryStatus;
      let normalized = String(status || '').toUpperCase().trim().replace(/\s+/g, '_');
      if (normalized === 'IN_PROCESS') normalized = 'IN_PROGRESS';
      return normalized === 'IN_PROGRESS';
    }).length,
    COMPLETED: inventories.filter(inv => {
      const status = inv?.status || inv?.inventoryStatus;
      let normalized = String(status || '').toUpperCase().trim().replace(/\s+/g, '_');
      if (normalized === 'IN_PROCESS') normalized = 'IN_PROGRESS';
      return normalized === 'COMPLETED';
    }).length,
    CANCELLED: inventories.filter(inv => {
      const status = inv?.status || inv?.inventoryStatus;
      let normalized = String(status || '').toUpperCase().trim().replace(/\s+/g, '_');
      if (normalized === 'IN_PROCESS') normalized = 'IN_PROGRESS';
      return normalized === 'CANCELLED';
    }).length
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      {/* Header - Turquesa */}
      <div className="bg-teal-600 shadow-lg mb-8 rounded-2xl">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Gestión de Inventarios
                </h1>
                <p className="text-teal-100 text-sm font-medium">
                  Administración de inventarios físicos patrimoniales
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {canCreate && (
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-5 py-2.5 bg-transparent border-2 border-white/70 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-200 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nuevo Inventario
              </button>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Estadísticas Profesionales */}
      {inventories.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Inventarios */}
            <div className="bg-white border-l-4 border-l-teal-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Inventarios</p>
                  <p className="text-3xl font-bold text-slate-800">{countByStatus.todos}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-teal-50 text-teal-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>


            {/* Planificados */}
            <div className="bg-white border-l-4 border-l-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Planificados</p>
                  <p className="text-3xl font-bold text-slate-800">{countByStatus.PLANNED}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>


            {/* En Progreso */}
            <div className="bg-white border-l-4 border-l-yellow-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">En Progreso</p>
                  <p className="text-3xl font-bold text-slate-800">{countByStatus.IN_PROGRESS}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-yellow-50 text-yellow-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>


            {/* Completados */}
            <div className="bg-white border-l-4 border-l-green-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Completados</p>
                  <p className="text-3xl font-bold text-slate-800">{countByStatus.COMPLETED}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-green-50 text-green-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>


            {/* Cancelados */}
            <div className="bg-white border-l-4 border-l-red-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Cancelados</p>
                  <p className="text-3xl font-bold text-slate-800">{countByStatus.CANCELLED}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-red-50 text-red-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      <InventoryList
        inventories={inventories}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStart={handleStart}
        onComplete={handleComplete}
        onCreateNew={handleCreateNew}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        areas={areas}
        categories={categories}
        locations={locations}
        users={users}
        assets={assets}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
        canVerify={canVerify}
        canClose={canClose}
      />


      <InventoryFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingInventory(null);
        }}
        onSave={handleSave}
        inventory={editingInventory}
        areas={areas}
        categories={categories}
        locations={locations}
        users={users}
      />


      {selectedInventory && (
        <InventoryDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedInventory(null);
          }}
          inventory={selectedInventory}
          assets={assets}
          locations={locations}
          users={users}
          systemUsers={systemUsers}
          areaName={selectedInventory.areaId ? (areas.find(a => a.id === selectedInventory.areaId)?.name || null) : null}
          categoryName={selectedInventory.categoryId ? (categories.find(c => c.id === selectedInventory.categoryId)?.name || null) : null}
          locationName={selectedInventory.locationId ? (locations.find(l => l.id === selectedInventory.locationId)?.name || null) : null}
          responsibleName={selectedInventory.generalResponsibleId ? (
            (() => {
              const p = users.find(u => u.id === selectedInventory.generalResponsibleId);
              if (!p) return null;
              return `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.personalEmail || null;
            })()
          ) : null}
        />
      )}
    </div>
  );
}
