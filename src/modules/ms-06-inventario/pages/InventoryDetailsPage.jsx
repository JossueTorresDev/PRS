import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import InventoryDetailList from "../components/InventoryDetailList";
import InventoryDetailFormModal from "../components/InventoryDetailFormModal";
import InventoryDetailViewModal from "../components/InventoryDetailViewModal";
import { getInventoryById, getPhysicalLocations, getPersons, getUsers, getAssets, completeInventory } from "../services/inventoryApi";
import { createInventoryDetail, updateInventoryDetail, getDetailsByInventoryId } from "../services/inventoryDetailApi";
import { uploadAllInventoryPhotos } from "../services/inventoryStorageService";
import ContentLoading from "../../../shared/utils/ContentLoading";


const STATUS_CONFIG = {
  PLANNED: { label: 'Planificado', color: 'bg-blue-50 text-blue-700 border-2 border-blue-300', icon: ClipboardDocumentListIcon },
  IN_PROGRESS: { label: 'En Progreso', color: 'bg-amber-50 text-amber-700 border-2 border-amber-300', icon: ClockIcon },
  COMPLETED: { label: 'Completado', color: 'bg-green-50 text-green-700 border-2 border-green-300', icon: CheckCircleIcon },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-50 text-red-700 border-2 border-red-300', icon: XCircleIcon }
};


export default function InventoryDetailsPage() {
  const { inventoryId } = useParams();
  const navigate = useNavigate();


  // Obtener municipalityId del usuario en sesión
  const municipalityId = (() => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      return user?.municipalityId || user?.municipality_id || user?.municipalCode || null;
    } catch {
      return null;
    }
  })();
 
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editingDetail, setEditingDetail] = useState(null);
  const [viewingDetail, setViewingDetail] = useState(null);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);       // personas — para actualResponsibleId
  const [systemUsers, setSystemUsers] = useState([]); // usuarios sistema — para verifiedBy
  const [assets, setAssets] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);


  // Obtener userId del token JWT
  const currentUserId = (() => {
    try {
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.user_id || payload.userId || payload.sub || null;
      }
    } catch { /* skip */ }
    return null;
  })();


  const handleComplete = async () => {
    const result = await Swal.fire({
      title: '¿Completar inventario?',
      text: 'Se subirán todas las fotografías al almacenamiento y se marcará como completado. Esta acción no se puede deshacer.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, completar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      // Paso 1: Mostrar progreso inicial
      Swal.fire({
        title: 'Completando inventario...',
        html: '<p>Paso 1/3: Preparando datos...</p>',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });


      console.log('\n🔍 INICIANDO PROCESO DE COMPLETADO DE INVENTARIO');
      console.log(`📦 Inventario ID: ${inventoryId}`);
      console.log(`👤 Usuario ID: ${currentUserId}\n`);


      // Paso 2: Obtener todos los detalles con fotos
      console.log('📥 Obteniendo detalles del inventario...');
      const allDetails = await getDetailsByInventoryId(inventoryId);
      console.log(`✅ Total de detalles obtenidos: ${allDetails.length}`);
     
      const detailsWithPhotos = allDetails.filter(d => d.photographs && d.photographs.length > 0);
      console.log(`📸 Detalles con fotografías: ${detailsWithPhotos.length}\n`);


      if (detailsWithPhotos.length > 0) {
        // Paso 3: Actualizar progreso - subiendo fotos
        Swal.fire({
          title: 'Completando inventario...',
          html: `<p>Paso 2/3: Subiendo ${detailsWithPhotos.length} detalle(s) con fotografías...</p>`,
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });


        console.log('📤 Iniciando subida de fotografías al storage...\n');


        // Subir todas las fotos
        const uploadResult = await uploadAllInventoryPhotos(detailsWithPhotos, inventoryId);


        console.log('\n📋 RESULTADO DE UPLOADS:');
        console.log(`   ✅ Exitosos: ${uploadResult.successCount}`);
        console.log(`   ❌ Fallidos: ${uploadResult.failedCount}`);
        console.log(`   📦 Detalles procesados: ${uploadResult.detailsUpdated.length}\n`);


        // Actualizar cada detalle con las URLs reales de storage
        console.log('💾 Guardando cambios en la base de datos...\n');
        for (const updatedDetail of uploadResult.detailsUpdated) {
          try {
            console.log(`📝 Actualizando detalle: ${updatedDetail.id}`);
            if (updatedDetail.photographs.length > 0) {
              const photoUrls = updatedDetail.photographs
                .map((p, i) => `   Foto ${i + 1}: ${p.data.substring(0, 60)}...`)
                .join('\n');
              console.log(photoUrls);
            } else {
              console.log(`   (Sin fotografías nuevas)`);
            }
           
            await updateInventoryDetail(updatedDetail.id, {
              photographs: updatedDetail.photographs
            });
            console.log(`✅ Detalle actualizado\n`);
          } catch (err) {
            console.warn(`⚠️ No se pudo actualizar fotografías del detalle ${updatedDetail.id}:`, err);
          }
        }


        if (uploadResult.failedCount > 0) {
          console.warn(`\n⚠️ ADVERTENCIA: ${uploadResult.failedCount} foto(s) no pudieron ser subidas`);
          if (uploadResult.errors.length > 0) {
            console.warn('Errores:\n', uploadResult.errors);
          }
        }


        // Log final del resumen
        console.log('\n✅ FOTOS ALMACENADAS EN STORAGE:');
        uploadResult.uploadSummary.forEach(upload => {
          console.log(`   • Detalle: ${upload.detailId}, Foto ${upload.photoIndex + 1}: ${upload.status}`);
          if (upload.url) {
            console.log(`     🔗 ${upload.url}`);
          }
        });
      } else {
        console.log('⏭️  No hay fotografías para subir\n');
      }


      // Paso 4: Completar inventario en el backend
      console.log('\n📍 Paso 3/3: Completando inventario en el sistema...');
      Swal.fire({
        title: 'Completando inventario...',
        html: '<p>Paso 3/3: Finalizando...</p>',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });


      await completeInventory(inventoryId, currentUserId);
      console.log(`✅ Inventario completado: ${inventoryId}\n`);


      await Swal.fire({
        icon: 'success',
        title: 'Completado',
        text: 'Inventario completado correctamente. Todas las fotografías han sido almacenadas.',
        timer: 2000,
        showConfirmButton: false
      });


      console.log('🎉 PROCESO FINALIZADO EXITOSAMENTE\n');


      // Navegar a la lista de inventarios con filtro COMPLETED
      navigate('/inventarios', { state: { statusFilter: 'COMPLETED' } });
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




  useEffect(() => {
    loadInventory();
    loadConfigData();
  }, [inventoryId, municipalityId]);




  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await getInventoryById(inventoryId);
     
      // Validar que el inventario pertenece a la municipalidad del usuario
      if (municipalityId && data.municipalityId !== municipalityId) {
        Swal.fire({
          icon: 'error',
          title: 'Acceso Denegado',
          text: 'No tienes permiso para acceder a este inventario',
          confirmButtonColor: '#4f46e5'
        }).then(() => navigate('/inventarios'));
        return;
      }
     
      setInventory(data);
      // Cargar assets según el tipo de inventario
      await loadAssets(data);
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar el inventario'
      });
    } finally {
      setLoading(false);
    }
  };


  const loadAssets = async (inv) => {
    try {
      const allAssets = await getAssets();
      if (!inv || inv.inventoryType === 'GENERAL') {
        setAssets(allAssets);
      } else {
        // SELECTIVE: filtrar por el criterio guardado en el inventario
        const filtered = allAssets.filter(asset => {
          if (inv.areaId) return asset.currentAreaId === inv.areaId;
          if (inv.categoryId) return asset.categoryId === inv.categoryId;
          if (inv.locationId) return asset.currentLocationId === inv.locationId;
          return true;
        });
        setAssets(filtered);
      }
    } catch (error) {
      console.error('Error al cargar bienes:', error);
    }
  };




  const loadConfigData = async () => {
    try {
      const [locationsData, personsData, usersData] = await Promise.all([
        getPhysicalLocations(),
        getPersons(),
        getUsers()
      ]);
      setLocations(locationsData);
      setUsers(personsData);          // personas para actualResponsibleId
      setSystemUsers(usersData);      // usuarios del sistema para verifiedBy
    } catch (error) {
      console.error('Error al cargar datos de configuración:', error);
    }
  };




  const handleAddDetail = () => {
    setEditingDetail(null);
    setIsFormOpen(true);
  };




  const handleEditDetail = (detail) => {
    setEditingDetail(detail);
    setIsFormOpen(true);
  };




  const handleViewDetail = (detail) => {
    setViewingDetail(detail);
    setIsViewOpen(true);
  };




  const handleSaveDetail = async (formData) => {
    try {
      Swal.fire({
        title: 'Guardando...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });




      if (editingDetail) {
        await updateInventoryDetail(editingDetail.id, formData);
      } else {
        await createInventoryDetail(formData);
      }




      Swal.fire({
        icon: 'success',
        title: editingDetail ? 'Actualizado' : 'Creado',
        text: 'Registro guardado correctamente',
        timer: 1500,
        showConfirmButton: false
      });




      setIsFormOpen(false);
      setEditingDetail(null);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo guardar el registro'
      });
    }
  };




  const normalizeStatus = (status) => {
    if (!status) return 'PLANNED';
    let normalized = String(status).toUpperCase().trim().replace(/\s+/g, '_');
    if (normalized === 'IN_PROCESS') normalized = 'IN_PROGRESS';
    return normalized;
  };




  if (loading) {
    return (
      <div className="relative min-h-[400px]">
        <ContentLoading isLoading={true} message="Cargando inventario..." />
      </div>
    );
  }




  if (!inventory) {
    return (
      <div className="p-6 text-center">
        <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <ClipboardDocumentListIcon className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Inventario no encontrado</h3>
        <button
          onClick={() => navigate('/inventarios')}
          className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
        >
          Volver a la lista
        </button>
      </div>
    );
  }




  const inventoryStatus = normalizeStatus(inventory.status || inventory.inventoryStatus);
  const statusConfig = STATUS_CONFIG[inventoryStatus] || STATUS_CONFIG.PLANNED;
  const StatusIcon = statusConfig.icon;








  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/inventarios')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="font-medium">Volver a Inventarios</span>
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{inventory.inventoryNumber}</h1>
            <p className="text-base text-gray-600">{inventory.description || 'Verificación de bienes del inventario'}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Botón Completar — solo cuando IN_PROGRESS */}
            {inventoryStatus === 'IN_PROGRESS' && (
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm"
              >
                <CheckCircleIcon className="h-4 w-4" />
                Completar Inventario
              </button>
            )}
            <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full text-sm font-bold bg-white border-2 ${
              inventoryStatus === 'IN_PROGRESS' ? 'text-amber-700 border-amber-300' :
              inventoryStatus === 'COMPLETED'   ? 'text-green-700 border-green-300' :
              inventoryStatus === 'CANCELLED'   ? 'text-red-700 border-red-300' :
                                                  'text-blue-700 border-blue-300'
            }`}>
              <StatusIcon className="h-5 w-5" />
              {statusConfig.label}
            </div>
          </div>
        </div>
      </div>




      {/* Lista de detalles */}
      <InventoryDetailList
        key={refreshKey}
        inventoryId={inventoryId}
        inventoryStatus={inventoryStatus}
        inventory={inventory}
        assets={assets}
        onAddDetail={handleAddDetail}
        onEditDetail={handleEditDetail}
        onViewDetail={handleViewDetail}
      />




      {/* Modal de formulario */}
      <InventoryDetailFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingDetail(null);
        }}
        onSave={handleSaveDetail}
        detail={editingDetail}
        inventoryId={inventoryId}
        municipalityId={inventory.municipalityId}
        assets={assets}
        locations={locations}
        users={users}
      />




      {/* Modal de vista */}
      <InventoryDetailViewModal
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setViewingDetail(null);
        }}
        detail={viewingDetail}
        assets={assets}
        locations={locations}
        users={users}
        systemUsers={systemUsers}
      />
    </div>
  );
}
