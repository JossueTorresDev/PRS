import React, { useState, useEffect } from 'react';
import { getBienesPatrimoniales, deleteBienPatrimonial, restaurarBienPatrimonial } from '../../services/api';
import { pdf } from '@react-pdf/renderer';
import ReportDocument from '../../components/PatrimonioReports';
import AssetReportWithQR from '../../components/AssetReportWithQR';
import AssetModal from '../../components/assets/AssetModal';
import AssetDetailModal from '../../components/assets/AssetDetailModal';
import BulkUploadModal from '../../components/assets/BulkUploadModal';
import DepreciationHistoryModal from '../../components/depreciation/DepreciationHistoryModal';
import { getMunicipalityId } from '../../../../shared/utils/municipalityHelper.js';
import ContentLoading from '../../../../shared/utils/ContentLoading.jsx';

/**
 * Página principal de gestión de bienes patrimoniales
 * Muestra listado, búsqueda, filtros y acciones sobre los bienes
 */
export default function AssetListPage() {
  const [bienes, setBienes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('TODOS');
  const [sortField, setSortField] = useState('assetCode');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Estados para modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedBien, setSelectedBien] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDepModal, setShowDepModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Cargar bienes patrimoniales
  useEffect(() => {
    loadBienes();
  }, []);

  const loadBienes = async () => {
    try {
      setLoading(true);
      setError(null);
      const municipalityId = getMunicipalityId();
      const data = await getBienesPatrimoniales();
      
      // Filtrar por municipalityId (client-side)
      const filteredData = data.filter(b => !municipalityId || b.municipalityId === municipalityId);
      setBienes(filteredData);
    } catch (err) {
      setError('Error al cargar los bienes patrimoniales');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const motivo = prompt('¿Por qué desea dar de baja este bien? (opcional)');
    if (motivo !== null) {
      try {
        await deleteBienPatrimonial(id, motivo || 'Bien dado de baja');
        loadBienes();
      } catch (err) {
        alert('Error al dar de baja el bien');
      }
    }
  };

  const handleRestore = async (id) => {
    const motivo = prompt('¿Por qué desea restaurar este bien? (opcional)');
    if (motivo !== null) {
      try {
        await restaurarBienPatrimonial(id, motivo || 'Bien restaurado');
        loadBienes();
      } catch (err) {
        alert('Error al restaurar el bien');
      }
    }
  };

  const handleCreate = () => {
    setSelectedBien(null);
    setIsEditing(false);
    setIsFormModalOpen(true);
  };

  const handleEdit = (bien) => {
    setSelectedBien(bien);
    setIsEditing(true);
    // Setting `isFormModalOpen` sync is fine now because `closeDetailModal` delays the nullification
    setIsFormModalOpen(true);
  };

  const handleViewDetail = (bien) => {
    setSelectedBien(bien);
    setIsDetailModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setSelectedBien(null);
    setIsEditing(false);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    // Don't nullify selectedBien if we are switching to editing mode
    setTimeout(() => {
        setIsFormModalOpen((currOpen) => {
            if (!currOpen) {
                setSelectedBien(null);
            }
            return currOpen;
        });
    }, 50);
  };

  const handleFormSuccess = () => {
    loadBienes();
    closeFormModal();
    if (isDetailModalOpen) {
      closeDetailModal();
    }
  };

  const openDepreciationModal = (bien) => {
    setSelectedAsset(bien);
    setShowDepModal(true);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtrado de bienes
  const filteredBienes = bienes.filter((bien) => {
    const matchSearch =
      (bien.assetCode || bien.codigoPatrimonial)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bien.description || bien.descripcion)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bien.brand || bien.marca)?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchEstado;
    const currentStatus = bien.assetStatus || bien.estadoBien;
    
    if (filterEstado === 'TODOS') {
      matchEstado = currentStatus !== 'BAJA' && currentStatus !== 'INACTIVE' && currentStatus !== 'DISPOSED';
    } else {
      const statusEquivalence = {
        'AVAILABLE': ['AVAILABLE', 'DISPONIBLE'],
        'IN_USE': ['IN_USE', 'EN_USO'],
        'MAINTENANCE': ['MAINTENANCE', 'MANTENIMIENTO', 'EN_MANTENIMIENTO', 'IN_MAINTENANCE'],
        'INACTIVE': ['INACTIVE', 'BAJA', 'DISPOSED'],
        'LOANED': ['LOANED', 'PRESTADO']
      };
      const acceptedValues = statusEquivalence[filterEstado] || [filterEstado];
      matchEstado = acceptedValues.includes(currentStatus);
    }

    return matchSearch && matchEstado;
  });

  const handleGeneratePdf = async () => {
    if (generatingPdf || filteredBienes.length === 0) return;
    setGeneratingPdf(true);
    // Ceder el hilo para que React pinte el overlay antes del trabajo pesado
    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
    try {
      const blob = await pdf(
        <ReportDocument type="bienes" items={filteredBienes} meta={{ title: 'Listado de Bienes', badge: 'LISTADO DE BIENES' }} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_bienes_${new Date().toISOString().slice(0,10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al generar PDF:', err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Ordenamiento
  const sortedBienes = [...filteredBienes].sort((a, b) => {
    let aValue, bValue;
    switch (sortField) {
      case 'assetCode':
        aValue = (a.assetCode || a.codigoPatrimonial || '').toLowerCase();
        bValue = (b.assetCode || b.codigoPatrimonial || '').toLowerCase();
        break;
      case 'description':
        aValue = (a.description || a.descripcion || '').toLowerCase();
        bValue = (b.description || b.descripcion || '').toLowerCase();
        break;
      case 'brand':
        aValue = (a.brand || a.marca || '').toLowerCase();
        bValue = (b.brand || b.marca || '').toLowerCase();
        break;
      case 'value':
        aValue = a.currentValue || a.valorActual || a.acquisitionValue || a.valorAdquisicion || 0;
        bValue = b.currentValue || b.valorActual || b.acquisitionValue || b.valorAdquisicion || 0;
        break;
      case 'acquisitionDate':
        aValue = new Date(a.acquisitionDate || a.fechaAdquisicion || 0).getTime();
        bValue = new Date(b.acquisitionDate || b.fechaAdquisicion || 0).getTime();
        break;
      case 'status':
        aValue = (a.assetStatus || a.estadoBien || '').toLowerCase();
        bValue = (b.assetStatus || b.estadoBien || '').toLowerCase();
        break;
      default:
        return 0;
    }
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginación
  const totalPages = Math.ceil(sortedBienes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedBienes.slice(startIndex, endIndex);
  const totalItems = sortedBienes.length;

  // Resetear página cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEstado]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-PE');
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      DISPONIBLE: 'bg-green-100 text-green-800',
      EN_USO: 'bg-blue-100 text-blue-800',
      MANTENIMIENTO: 'bg-yellow-100 text-yellow-800',
      EN_MANTENIMIENTO: 'bg-yellow-100 text-yellow-800',
      IN_MAINTENANCE: 'bg-yellow-100 text-yellow-800',
      BAJA: 'bg-red-100 text-red-800',
      PRESTADO: 'bg-purple-100 text-purple-800',
      AVAILABLE: 'bg-green-100 text-green-800',
      IN_USE: 'bg-blue-100 text-blue-800',
      MAINTENANCE: 'bg-yellow-100 text-yellow-800',
      INACTIVE: 'bg-red-100 text-red-800',
      DISPOSED: 'bg-red-100 text-red-800',
      LOANED: 'bg-purple-100 text-purple-800',
    };
    return estados[estado] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      DISPONIBLE: 'Disponible',
      EN_USO: 'En Uso',
      MANTENIMIENTO: 'Mantenimiento',
      EN_MANTENIMIENTO: 'En mantenimiento',
      IN_MAINTENANCE: 'En mantenimiento',
      BAJA: 'Baja',
      PRESTADO: 'Prestado',
      AVAILABLE: 'Disponible',
      IN_USE: 'En Uso',
      MAINTENANCE: 'Mantenimiento',
      INACTIVE: 'Baja',
      DISPOSED: 'Baja',
      LOANED: 'Prestado',
    };
    return labels[estado] || estado;
  };

  const getStatusDotColor = (estado) => {
    const colors = {
      DISPONIBLE: 'bg-green-500',
      AVAILABLE: 'bg-green-500',
      EN_USO: 'bg-blue-500',
      IN_USE: 'bg-blue-500',
      MANTENIMIENTO: 'bg-yellow-500',
      EN_MANTENIMIENTO: 'bg-yellow-500',
      IN_MAINTENANCE: 'bg-yellow-500',
      MAINTENANCE: 'bg-yellow-500',
      BAJA: 'bg-red-500',
      INACTIVE: 'bg-red-500',
      DISPOSED: 'bg-red-500',
      PRESTADO: 'bg-purple-500',
      LOANED: 'bg-purple-500',
    };
    return colors[estado] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="relative min-h-[400px]">
        <ContentLoading isLoading={true} message="Cargando inventario de bienes patrimoniales..." />
      </div>
    );
  }


  return (
    <>
      {generatingPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4">
            <svg className="w-10 h-10 animate-spin text-slate-800" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-lg font-semibold text-slate-800">Generando reporte...</p>
            <p className="text-sm text-slate-500">Esto puede tomar unos segundos</p>
          </div>
        </div>
      )}
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 sm:p-6">
      {/* Header - Slate 800 */}
      <div className="bg-slate-800 shadow-lg mb-6 sm:mb-8 rounded-2xl">
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Gestión de Bienes Patrimoniales
                </h1>
                <p className="text-slate-200 text-xs sm:text-sm font-medium">
                  Administración y control de activos institucionales
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleGeneratePdf}
                disabled={generatingPdf}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 disabled:opacity-50 disabled:cursor-wait text-white rounded-xl font-semibold transition-all duration-200 text-xs sm:text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {generatingPdf ? 'Generando...' : 'Exportar PDF'}
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-transparent border-2 border-white/70 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-200 text-xs sm:text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden sm:inline">Nuevo Bien</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
              <button
                onClick={() => setIsBulkUploadOpen(true)}
                className="flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-transparent border-2 border-white/70 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-200 text-xs sm:text-sm hidden"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="hidden sm:inline">Carga Masiva</span>
                <span className="sm:hidden">CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas Profesionales */}
      {bienes.length > 0 && (
        <div className="mb-4 sm:mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Total Activos */}
            <div className="bg-white border-l-4 border-l-slate-800 rounded-2xl p-3 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Activos</p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-800">
                    {bienes.filter((b) => !['BAJA', 'INACTIVE', 'DISPOSED'].includes(b.assetStatus || b.estadoBien)).length}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-800">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Disponibles */}
            <div className="bg-white border-l-4 border-l-green-500 rounded-2xl p-3 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Disponibles</p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-800">
                    {bienes.filter((b) => ['DISPONIBLE', 'AVAILABLE'].includes(b.assetStatus || b.estadoBien)).length}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center bg-green-50 text-green-500">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* En Uso */}
            <div className="bg-white border-l-4 border-l-slate-600 rounded-2xl p-3 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">En Uso</p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-800">
                    {bienes.filter((b) => ['EN_USO', 'IN_USE'].includes(b.assetStatus || b.estadoBien)).length}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-700">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Mantenimiento */}
            <div className="bg-white border-l-4 border-l-yellow-500 rounded-2xl p-3 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Mantenimiento</p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-800">
                    {bienes.filter((b) => ['MANTENIMIENTO', 'MAINTENANCE', 'EN_MANTENIMIENTO', 'IN_MAINTENANCE'].includes(b.assetStatus || b.estadoBien)).length}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center bg-yellow-50 text-yellow-500">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Dados de Baja */}
            <div className="bg-white border-l-4 border-l-red-500 rounded-2xl p-3 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Dados de Baja</p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-800">
                    {bienes.filter((b) => ['BAJA', 'INACTIVE', 'DISPOSED'].includes(b.assetStatus || b.estadoBien)).length}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center bg-red-50 text-red-500">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Buscar
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar por código, descripción o marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Estado
            </label>
            <div className="relative">
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="AVAILABLE">Disponible</option>
                <option value="IN_USE">En Uso</option>
                <option value="MAINTENANCE">Mantenimiento</option>
                <option value="INACTIVE">Baja</option>
                <option value="LOANED">Prestado</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Tabla Profesional */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px]">
            <thead className="bg-slate-800">
              <tr>
                <th 
                  className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-slate-700 transition select-none"
                  onClick={() => handleSort('assetCode')}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="hidden sm:inline">Código</span>
                    <span className="sm:hidden">Cod.</span>
                    {sortField === 'assetCode' && (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {sortDirection === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-slate-700 transition select-none"
                  onClick={() => handleSort('description')}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    Descripción
                    {sortField === 'description' && (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {sortDirection === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-slate-700 transition select-none hidden sm:table-cell"
                  onClick={() => handleSort('brand')}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    Marca/Modelo
                    {sortField === 'brand' && (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {sortDirection === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-slate-700 transition select-none hidden lg:table-cell"
                  onClick={() => handleSort('value')}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    Valor
                    {sortField === 'value' && (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {sortDirection === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-slate-700 transition select-none"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    Estado
                    {sortField === 'status' && (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {sortDirection === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                  <span className="hidden sm:inline">Acciones</span>
                  <span className="sm:hidden">Acc.</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-3 sm:px-6 py-10 sm:py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-4 sm:mb-6">
                        <svg className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <p className="text-lg sm:text-xl font-semibold text-slate-700 mb-2">No se encontraron bienes</p>
                      <p className="text-sm sm:text-base text-slate-500">Intenta con otros filtros o agrega un nuevo bien</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((bien) => {
                  const status = bien.assetStatus || bien.estadoBien;
                  const isBaja = ['BAJA', 'INACTIVE', 'DISPOSED'].includes(status);
                  
                  return (
                    <tr
                      key={bien.id}
                      className={`group hover:bg-slate-50 transition-all duration-200 border-l-4 ${
                        isBaja ? 'border-l-red-500' : 'border-l-slate-800'
                      } hover:border-l-slate-700 bg-white`}
                    >
                      {/* Código con indicador de estado */}
                      <td className="px-3 sm:px-6 py-3 sm:py-5 w-24 sm:w-auto">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0 ${getStatusDotColor(status)}`}></div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-slate-900 text-xs sm:text-sm truncate">{bien.assetCode || bien.codigoPatrimonial}</div>
                            {(bien.serialNumber || bien.serie) && (
                              <div className="text-xs text-slate-500 mt-0.5 hidden sm:block">S/N: {bien.serialNumber || bien.serie}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Descripción */}
                      <td className="px-3 sm:px-6 py-3 sm:py-5 min-w-[100px] sm:min-w-[150px]">
                        <div className="text-sm font-medium text-slate-800 line-clamp-2">
                          {bien.description || bien.descripcion}
                        </div>
                      </td>

                      {/* Marca/Modelo */}
                      <td className="px-3 sm:px-6 py-3 sm:py-5 hidden sm:table-cell">
                        <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg">
                          <span className="text-xs font-medium text-slate-700 truncate max-w-[100px]">
                            {bien.brand || bien.marca || '-'}
                            {(bien.model || bien.modelo) && ` / ${bien.model || bien.modelo}`}
                          </span>
                        </div>
                      </td>

                      {/* Valor */}
                      <td className="px-3 sm:px-6 py-3 sm:py-5 hidden lg:table-cell">
                        <div className="inline-flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg">
                          <span className="text-xs font-semibold text-green-700">
                            {formatCurrency(bien.currentValue || bien.valorActual || bien.acquisitionValue || bien.valorAdquisicion)}
                          </span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-3 sm:px-6 py-3 sm:py-5 w-20 sm:w-auto">
                        <span className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${getEstadoBadge(status)}`}>
                          {getEstadoLabel(status)}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-3 sm:px-6 py-3 sm:py-5 w-16 sm:w-auto">
                        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                          {/* Ver Detalles */}
                          <button
                            onClick={() => handleViewDetail(bien)}
                            className="p-1.5 text-slate-600 hover:text-white hover:bg-slate-700 rounded transition-all duration-200 border border-slate-200 hover:border-slate-700 hover:shadow-md"
                            title="Ver detalles"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {/* Generar PDF */}
                          <AssetReportWithQR
                            asset={bien}
                            fileName={`bien_${bien.assetCode || bien.codigoPatrimonial || bien.id}.pdf`}
                          >
                            {({ loading }) => (
                              <span className={`p-1.5 text-green-600 hover:text-white hover:bg-green-600 rounded transition-all duration-200 border border-green-200 hover:border-green-600 hover:shadow-md inline-flex ${loading ? 'opacity-50 cursor-wait' : ''}`}>
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </span>
                            )}
                          </AssetReportWithQR>

                          {!isBaja ? (
                            <>
                              {/* Editar */}
                              <button
                                onClick={() => handleEdit(bien)}
                                className="p-1.5 text-blue-600 hover:text-white hover:bg-blue-600 rounded transition-all duration-200 border border-blue-200 hover:border-blue-600 hover:shadow-md"
                                title="Editar"
                              >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>

                              {/* Depreciación */}
                              {bien.isDepreciable && (
                                <button
                                  onClick={() => openDepreciationModal(bien)}
                                  className="p-1.5 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded transition-all duration-200 border border-indigo-200 hover:border-indigo-600 hover:shadow-md"
                                  title="Historial de depreciación"
                                >
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </button>
                              )}

                              {/* Dar de Baja */}
                              <button
                                onClick={() => handleDelete(bien.id)}
                                className="p-1.5 text-red-600 hover:text-white hover:bg-red-600 rounded transition-all duration-200 border border-red-200 hover:border-red-600 hover:shadow-md"
                                title="Dar de baja"
                              >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Restaurar */}
                              <button
                                onClick={() => handleRestore(bien.id)}
                                className="p-1.5 text-orange-600 hover:text-white hover:bg-orange-600 rounded transition-all duration-200 border border-orange-200 hover:border-orange-600 hover:shadow-md"
                                title="Restaurar bien"
                              >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>


        {/* Paginación Profesional */}
        {totalItems > 0 && (
          <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-t border-gray-200">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* Información de registros */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 text-sm text-slate-600 w-full lg:w-auto">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 text-sm sm:text-base">
                    {startIndex + 1} - {Math.min(endIndex, totalItems)}
                  </span>
                  <span className="text-sm sm:text-base">de</span>
                  <span className="font-semibold text-slate-900 text-sm sm:text-base">{totalItems}</span>
                  <span className="text-sm sm:text-base">registros</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-slate-600 font-medium text-xs sm:text-sm">Mostrar:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 font-medium text-xs sm:text-sm bg-white"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* Controles de paginación */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Botón Primera Página */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                    currentPage === 1
                      ? "text-slate-300 cursor-not-allowed"
                      : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                  title="Primera página"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>

                {/* Botón Anterior */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                    currentPage === 1
                      ? "text-slate-300 cursor-not-allowed"
                      : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                  title="Página anterior"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Números de página */}
                <div className="flex items-center gap-0.5 sm:gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      if (page === 1 || page === totalPages) return true;
                      if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                      return false;
                    })
                    .map((page, index, array) => {
                      const prevPage = array[index - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;

                      return (
                        <div key={page} className="flex items-center gap-0.5 sm:gap-1">
                          {showEllipsis && (
                            <span className="px-1 sm:px-2 text-slate-400 text-xs sm:text-sm">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`min-w-[32px] sm:min-w-[40px] h-8 sm:h-10 px-2 sm:px-3 rounded-lg font-semibold transition-all duration-200 text-xs sm:text-sm ${
                              currentPage === page
                                ? "bg-indigo-600 text-white shadow-md"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    })}
                </div>

                {/* Botón Siguiente */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    currentPage === totalPages
                      ? "text-slate-300 cursor-not-allowed"
                      : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                  title="Página siguiente"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Botón Última Página */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    currentPage === totalPages
                      ? "text-slate-300 cursor-not-allowed"
                      : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                  title="Última página"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      <AssetModal
        key={`form-${selectedBien?.id || 'new'}`}
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        onSuccess={handleFormSuccess}
        bien={isEditing ? selectedBien : null}
      />

      <AssetDetailModal
        key={`detail-${selectedBien?.id || 'view'}`}
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        bien={selectedBien}
        onEdit={handleEdit}
      />

      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onSuccess={loadBienes}
      />

      {showDepModal && (
        <DepreciationHistoryModal
          asset={selectedAsset}
          onClose={() => setShowDepModal(false)}
        />
      )}
    </div>
    </>
  );
}
