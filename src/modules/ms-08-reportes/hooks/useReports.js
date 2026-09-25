import { useState, useCallback } from 'react';
import * as svc from '../services/reportService';

/**
 * Hook que consolida datos de TODOS los microservicios
 * y calcula estadísticas para el módulo de reportes
 */
export function useReports() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Datos crudos
  const [assets, setAssets] = useState([]);
  const [movements, setMovements] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);

  // Estadísticas calculadas
  const [stats, setStats] = useState({
    totalAssets: 0,
    assetsDisponible: 0,
    assetsEnUso: 0,
    assetsBaja: 0,
    totalMovements: 0,
    movementsPending: 0,
    movementsCompleted: 0,
    totalInventories: 0,
    totalMaintenances: 0,
    maintenancesPending: 0,
    assetsByCategory: {},
    assetsByLocation: {},
  });

  /**
   * Cargar TODOS los datos del sistema
   */
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assetsData, movData, invData, maintData, catData, locData] = await Promise.allSettled([
        svc.fetchAssets(),
        svc.fetchMovements(),
        svc.fetchInventories(),
        svc.fetchMaintenances(),
        svc.fetchCategories(),
        svc.fetchLocations(),
      ]);

      const a = assetsData.status === 'fulfilled' ? (Array.isArray(assetsData.value) ? assetsData.value : []) : [];
      const m = movData.status === 'fulfilled' ? (Array.isArray(movData.value) ? movData.value : []) : [];
      const inv = invData.status === 'fulfilled' ? (Array.isArray(invData.value) ? invData.value : (invData.value?.content || [])) : [];
      const maint = maintData.status === 'fulfilled' ? (Array.isArray(maintData.value) ? maintData.value : (maintData.value?.content || [])) : [];
      const cats = catData.status === 'fulfilled' ? (Array.isArray(catData.value) ? catData.value : []) : [];
      const locs = locData.status === 'fulfilled' ? (Array.isArray(locData.value) ? locData.value : []) : [];

      setAssets(a);
      setMovements(m);
      setInventories(inv);
      setMaintenances(maint);
      setCategories(cats);
      setLocations(locs);

      // Calcular estadísticas
      const statusCount = (arr, field, value) =>
        arr.filter(x => (x[field] || '').toUpperCase() === value.toUpperCase()).length;

      const byCategory = {};
      a.forEach(asset => {
        const cat = asset.categoryName || asset.category || 'Sin categoría';
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      });

      const byLocation = {};
      a.forEach(asset => {
        const loc = asset.locationName || asset.location || 'Sin ubicación';
        byLocation[loc] = (byLocation[loc] || 0) + 1;
      });

      setStats({
        totalAssets: a.length,
        assetsDisponible: statusCount(a, 'status', 'DISPONIBLE') + statusCount(a, 'status', 'AVAILABLE'),
        assetsEnUso: statusCount(a, 'status', 'EN_USO') + statusCount(a, 'status', 'IN_USE'),
        assetsBaja: statusCount(a, 'status', 'BAJA') + statusCount(a, 'status', 'DISPOSED'),
        totalMovements: m.length,
        movementsPending: m.filter(x => ['PENDING', 'PENDIENTE', 'PENDING_APPROVAL'].includes((x.status || '').toUpperCase())).length,
        movementsCompleted: m.filter(x => ['COMPLETED', 'COMPLETADO'].includes((x.status || '').toUpperCase())).length,
        totalInventories: inv.length,
        totalMaintenances: maint.length,
        maintenancesPending: maint.filter(x => ['PENDING', 'PENDIENTE', 'SCHEDULED'].includes((x.status || '').toUpperCase())).length,
        assetsByCategory: byCategory,
        assetsByLocation: byLocation,
      });

      // Reportar errores parciales
      const errors = [];
      if (assetsData.status === 'rejected') errors.push('Bienes');
      if (movData.status === 'rejected') errors.push('Movimientos');
      if (invData.status === 'rejected') errors.push('Inventarios');
      if (maintData.status === 'rejected') errors.push('Mantenimientos');
      if (errors.length > 0) {
        setError(`No se pudieron cargar: ${errors.join(', ')}`);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Exportar datos
  const exportAssetsCSV = useCallback(() => {
    const data = assets.map(a => ({
      Código: a.assetCode || a.code || '',
      Nombre: a.description || a.assetName || a.name || '',
      Categoría: a.categoryName || a.category || '',
      Ubicación: a.locationName || a.location || '',
      Estado: a.status || '',
      'Valor Adquisición': a.acquisitionValue || a.purchasePrice || '',
      'Fecha Adquisición': a.acquisitionDate || a.purchaseDate || '',
    }));
    svc.exportToCSV(data, 'reporte-bienes.csv');
  }, [assets]);

  const exportMovementsCSV = useCallback(() => {
    const data = movements.map(m => ({
      Tipo: m.movementType || m.type || '',
      'Bien': m.assetId || '',
      Estado: m.status || '',
      'Origen': m.originResponsibleId || '',
      'Destino': m.destinationResponsibleId || '',
      Fecha: m.createdAt || m.requestDate || '',
    }));
    svc.exportToCSV(data, 'reporte-movimientos.csv');
  }, [movements]);

  return {
    loading, error, clearError,
    assets, movements, inventories, maintenances,
    categories, locations, stats,
    loadAll,
    exportAssetsCSV, exportMovementsCSV,
  };
}

export default useReports;
