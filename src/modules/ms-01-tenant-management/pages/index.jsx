import React, { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import Swal from 'sweetalert2';
import {
  getMunicipalidades,
  getMunicipalidadById,
  getMunicipalidadDetails, // Added getMunicipalidadDetails
  getMunicipalidadCompleta, // Nueva función para obtener datos completos
  createMunicipalidad,
  updateMunicipalidad,
  deleteMunicipalidad,
  getMunicipalityLogoForReport
} from '../services/municipalidadService';
import MunicipalidadModal from '../components/MunicipalidadModalNuevo';
import MunicipalidadDetailModal from '../components/MunicipalidadDetailModal';
import MunicipalidadStats from '../components/MunicipalidadStats';
import { MunicipalidadesReportDocument, MunicipalidadDetailReportDocument } from '../reports/MunicipalidadesReport';

const MunicipalidadPage = () => {
  const [municipalidades, setMunicipalidades] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMunicipalidad, setSelectedMunicipalidad] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('todos');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  // Sorting state
  const [sortField, setSortField] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [reportLogo, setReportLogo] = useState(null);
  const [logoReady, setLogoReady] = useState(false);

  const loadMunicipalidades = async () => {
    try {
      const response = await getMunicipalidades();
      setMunicipalidades(response?.data || []);
    } catch (error) {
      console.error('Error al cargar municipalidades:', error);
      setMunicipalidades([]); // Aseguramos que sea un array vacío en caso de error
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las municipalidades'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMunicipalidades();
  }, []);

  useEffect(() => {
    let cancelled = false;
    getMunicipalityLogoForReport()
      .then((logo) => {
        if (!cancelled) {
          setReportLogo(logo);
          setLogoReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLogoReady(true);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedState]);

  // Filtrar municipalidades según los criterios de búsqueda y estado
  const filteredMunicipalidades = municipalidades.filter(municipalidad => {
    // Búsqueda por texto: solo nombre, RUC y tipo
    const matchesSearch = searchTerm.toLowerCase().trim() === '' ||
      municipalidad.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      municipalidad.ruc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      municipalidad.tipo?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por estado seleccionado
    const matchesState = selectedState === 'todos' ||
      (selectedState === 'activo' && municipalidad.activo === true) ||
      (selectedState === 'inactivo' && municipalidad.activo === false);

    return matchesSearch && matchesState;
  });

  // Sorting helper
  const compareValues = (a, b) => (a > b) - (a < b);
  const getFieldValue = (m, field) => {
    switch (field) {
      case 'nombre':
        return (m.nombre || '').toLowerCase();
      case 'ruc':
        return (m.ruc || '').toString();
      case 'tipo':
        return (m.tipo || '').toString();
      case 'ubicacion':
        return `${m.distrito || ''}| ${m.provincia || ''}| ${m.departamento || ''} `.toLowerCase();
      case 'estado':
        return m.activo ? 1 : 0; // activos primero si asc
      default:
        return '';
    }
  };
  const sortedMunicipalidades = [...filteredMunicipalidades].sort((a, b) => {
    const va = getFieldValue(a, sortField);
    const vb = getFieldValue(b, sortField);
    const cmp = compareValues(va, vb);
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const totalItems = sortedMunicipalidades.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedMunicipalidades = sortedMunicipalidades.slice(startIndex, endIndex);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };
  const SortIcon = ({ field, className = '' }) => (
    <span className={`ml - 1 inline - block align - middle ${className} `}>
      {sortField !== field ? (
        <svg className="w-3 h-3 inline" viewBox="0 0 20 20" fill="currentColor"><path d="M7 7l3-3 3 3H7zm6 6l-3 3-3-3h6z" /></svg>
      ) : sortOrder === 'asc' ? (
        <svg className="w-3 h-3 inline" viewBox="0 0 20 20" fill="currentColor"><path d="M7 13l3-3 3 3H7z" /></svg>
      ) : (
        <svg className="w-3 h-3 inline" viewBox="0 0 20 20" fill="currentColor"><path d="M7 7l3 3 3-3H7z" /></svg>
      )}
    </span>
  );

  const handleCreate = async (data) => {
    try {
      await createMunicipalidad(data);
      await loadMunicipalidades();
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Municipalidad creada correctamente'
      });
    } catch (error) {
      console.error('Error al crear municipalidad:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo crear la municipalidad'
      });
    }
  };

  const handleUpdate = async (data) => {
    try {
      // Comparar datos actuales con nuevos para enviar solo los cambios
      const changes = {};
      Object.keys(data).forEach(key => {
        if (data[key] !== selectedMunicipalidad[key]) {
          changes[key] = data[key];
        }
      });

      console.log('Enviando cambios:', changes);

      if (Object.keys(changes).length === 0) {
        setIsModalOpen(false);
        setSelectedMunicipalidad(null);
        return; // No hay cambios que actualizar
      }

      const fullData = { ...selectedMunicipalidad, ...data };
      const updatedMunicipalidad = await updateMunicipalidad(selectedMunicipalidad.id, changes, fullData);
      console.log('Municipalidad actualizada:', updatedMunicipalidad);

      // Actualizar la lista de municipalidades
      const updatedList = municipalidades.map(m =>
        m.id === selectedMunicipalidad.id ? { ...m, ...changes } : m
      );
      setMunicipalidades(updatedList);

      setIsModalOpen(false);
      setSelectedMunicipalidad(null);

      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Municipalidad actualizada correctamente'
      });
    } catch (error) {
      console.error('Error al actualizar municipalidad:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar la municipalidad'
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: '¿Desactivar municipalidad?',
        text: "La municipalidad será marcada como inactiva",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, desactivar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        focusConfirm: false,
        focusCancel: true
      });

      if (result.isConfirmed) {
        // Mostrar indicador de carga
        Swal.fire({
          title: 'Desactivando...',
          text: 'Por favor espere',
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Realizar la actualización solo del campo activo
        await updateMunicipalidad(id, { activo: false });

        // Recargar los datos
        await loadMunicipalidades();

        // Mostrar mensaje de éxito
        await Swal.fire({
          icon: 'success',
          title: '¡Desactivado!',
          text: 'La municipalidad ha sido desactivada correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error al desactivar municipalidad:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo desactivar la municipalidad. Por favor, inténtelo nuevamente.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleRestore = async (id) => {
    try {
      const result = await Swal.fire({
        title: '¿Restaurar municipalidad?',
        text: "La municipalidad será activada nuevamente",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#059669',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, restaurar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        focusConfirm: false,
        focusCancel: true
      });

      if (result.isConfirmed) {
        // Mostrar indicador de carga
        Swal.fire({
          title: 'Restaurando...',
          text: 'Por favor espere',
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Realizar la actualización del estado a activo
        await updateMunicipalidad(id, { activo: true });

        // Recargar los datos
        await loadMunicipalidades();

        // Mostrar mensaje de éxito
        await Swal.fire({
          icon: 'success',
          title: '¡Restaurada!',
          text: 'La municipalidad ha sido activada correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error al restaurar municipalidad:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo restaurar la municipalidad. Por favor, inténtelo nuevamente.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const showBlockingLoader = ({ title, subtitle, message, tone = 'primary' }) => {
    const safeTitle = title || 'Cargando…';
    const safeSubtitle = subtitle || '';
    const safeMessage = message || 'Por favor espere…';
    const accent = tone === 'dark' ? '#0f172a' : '#2563eb';

    Swal.fire({
      title: '',
      html: `
        <div class="sipreb-loader">
          <div class="sipreb-loader__header">
            <div class="sipreb-loader__icon ${tone === 'dark' ? 'sipreb-loader__icon--dark' : ''}">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style="color:white">
                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                <path d="M21 12a9 9 0 1 1-3.3-6.9" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
              </svg>
            </div>
          </div>
          <div class="sipreb-loader__titles">
            <div class="sipreb-loader__title">${safeTitle}</div>
            ${safeSubtitle ? `<div class="sipreb-loader__subtitle">${safeSubtitle}</div>` : ''}
          </div>

          <div class="sipreb-loader__body">
            <div class="sipreb-loader__spinner" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 50 50" style="display:block;">
                <circle cx="25" cy="25" r="18" fill="none" stroke="rgba(226,232,240,.9)" stroke-width="6"></circle>
                <circle cx="25" cy="25" r="18" fill="none" stroke="${accent}" stroke-width="6" stroke-linecap="round" stroke-dasharray="85 30">
                  <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.85s" repeatCount="indefinite"></animateTransform>
                </circle>
              </svg>
            </div>
            <div class="sipreb-loader__message" id="swal-loader-msg">${safeMessage}</div>
          </div>
          <div class="sipreb-loader__progress" aria-hidden="true">
            <div class="sipreb-loader__bar"></div>
          </div>
        </div>        
      `,
      showConfirmButton: false,
      showCancelButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      buttonsStyling: false,
      customClass: {
        popup: 'sipreb-loader-popup',
      },
    });
  };

  const openModal = async (municipalidad = null) => {
    if (municipalidad) {
      try {
        showBlockingLoader({
          title: 'Cargando datos para edición',
          subtitle: 'Municipalidad, usuario y persona',
          message: 'Preparando formulario, por favor espere…',
          tone: 'primary',
        });
        
        // Cargar datos completos (municipalidad + persona + usuario)
        const details = await getMunicipalidadCompleta(municipalidad.id);
        
        setSelectedMunicipalidad(details);
        setIsModalOpen(true);
        Swal.close();
      } catch (error) {
        console.error('Error al cargar detalles para edición:', error);
        setSelectedMunicipalidad(municipalidad);
        setIsModalOpen(true);
        Swal.close();
      }
    } else {
      setSelectedMunicipalidad(null);
      setIsModalOpen(true);
    }
  };

  const openDetailModal = async (municipalidad) => {
    try {
      showBlockingLoader({
        title: 'Cargando detalles',
        subtitle: 'Ficha de municipalidad',
        message: 'Un momento, por favor…',
        tone: 'dark',
      });
      const details = await getMunicipalidadDetails(municipalidad.id);
      setSelectedMunicipalidad(details);
      Swal.close();
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      setSelectedMunicipalidad(municipalidad);
      Swal.close();
      setIsDetailModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      {/* Header alineado al estándar de Autenticación */}
      <div className="bg-gradient-to-r from-teal-700 via-cyan-700 to-slate-900 shadow-lg mb-8 rounded-2xl">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Municipalidades</h1>
                <p className="text-cyan-100 text-sm font-medium">Administración y control de municipalidades</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {logoReady ? (
              <PDFDownloadLink
                document={<MunicipalidadesReportDocument municipalidades={sortedMunicipalidades} meta={{
                  title: 'Reporte de Municipalidades',
                  subtitle: 'Listado general del sistema',
                  entity: 'Municipalidad de San Luis',
                  office: 'Gestión de Tenientes',
                  logoUrl: reportLogo
                }} />}
                fileName={`municipalidades-${new Date().getTime()}.pdf`}
              >
                {({ loading }) => (
                  <button
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/20 border-2 border-cyan-400/70 hover:bg-cyan-500/40 text-cyan-100 hover:text-white rounded-xl font-semibold transition-all duration-200 text-sm disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {loading ? 'Generando...' : 'Descargar Reporte'}
                  </button>
                )}
              </PDFDownloadLink>
              ) : (
                <button
                  disabled
                  className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/20 border-2 border-cyan-400/70 text-cyan-100 rounded-xl font-semibold text-sm opacity-50 cursor-wait"
                >
                  Preparando reporte...
                </button>
              )}
              <button
                onClick={() => openModal()}
                className="flex items-center gap-2 px-5 py-2.5 bg-transparent border-2 border-white/70 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-200 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nueva Municipalidad
              </button>
            </div>
          </div>
        </div>
      </div>

      {!isLoading && <MunicipalidadStats municipalidades={municipalidades} />}

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
        </div>
      ) : municipalidades.length === 0 ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">Error al cargar las municipalidades</p>
        </div>
      ) : null}

      {/* Filtros y búsqueda estandarizados */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">Buscar</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-cyan-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre, RUC o tipo..."
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">Estado</label>
            <div className="relative">
              <select
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              >
                <option value="todos">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
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

      {/* Acciones principales: ya existe el botón en el header */}

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-teal-700 via-cyan-700 to-slate-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    <button type="button" onClick={() => toggleSort('nombre')} className="hover:text-white">
                      Nombre <span className="text-white"><SortIcon field="nombre" /></span>
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    <button type="button" onClick={() => toggleSort('ruc')} className="hover:text-white">
                      RUC <span className="text-white"><SortIcon field="ruc" /></span>
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    <button type="button" onClick={() => toggleSort('tipo')} className="hover:text-white">
                      Tipo <span className="text-white"><SortIcon field="tipo" /></span>
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    <button type="button" onClick={() => toggleSort('ubicacion')} className="hover:text-white">
                      Ubicación <span className="text-white"><SortIcon field="ubicacion" /></span>
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    <button type="button" onClick={() => toggleSort('estado')} className="hover:text-white">
                      Estado <span className="text-white"><SortIcon field="estado" /></span>
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedMunicipalidades.map((municipalidad) => (
                  <tr key={municipalidad.id} className="group hover:bg-slate-50 transition-all duration-200 border-l-4 border-l-slate-200 hover:border-l-slate-400 bg-white">
                    <td className="px-6 py-5">
                      <div className="text-sm font-semibold text-slate-900">
                        {municipalidad.nombre}
                      </div>
                      <div className="text-xs text-slate-500">
                        {municipalidad.ubigeo}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {municipalidad.ruc}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${municipalidad.tipo === 'PROVINCIAL' ? 'bg-violet-100 text-violet-800' : municipalidad.tipo === 'DISTRITAL' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {municipalidad.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm text-slate-900">
                        {municipalidad.distrito}
                      </div>
                      <div className="text-xs text-slate-500">
                        {municipalidad.provincia}, {municipalidad.departamento}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${municipalidad.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {municipalidad.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center gap-2">
                        {/* Descargar Ficha */}
                        <PDFDownloadLink
                          document={<MunicipalidadDetailReportDocument municipalidad={municipalidad} meta={{
                            title: municipalidad.nombre,
                            subtitle: 'Ficha informativa',
                            logoUrl: reportLogo
                          }} />}
                          fileName={`municipalidad-${municipalidad.nombre}-${new Date().getTime()}.pdf`}
                        >
                          {({ loading }) => (
                            <button
                              disabled={loading || !logoReady}
                              className="p-2.5 text-amber-600 hover:text-white hover:bg-amber-600 rounded-lg transition-all duration-200 border border-amber-200 hover:border-amber-600 hover:shadow-md disabled:opacity-50"
                              title="Descargar ficha"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M8 16.5a1 1 0 11-2 0 1 1 0 012 0zM15 16.5a1 1 0 11-2 0 1 1 0 012 0z" />
                                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0015.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                              </svg>
                            </button>
                          )}
                        </PDFDownloadLink>

                        {/* Ver Detalles */}
                        <button
                          onClick={() => openDetailModal(municipalidad)}
                          className="p-2.5 text-slate-600 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200 border border-slate-200 hover:border-slate-700 hover:shadow-md"
                          title="Ver detalle"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        </button>

                        {/* Editar / Desactivar */}
                        {municipalidad.activo ? (
                          <>
                            <button
                              onClick={() => openModal(municipalidad)}
                              className="p-2.5 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-600 hover:shadow-md"
                              title="Editar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(municipalidad.id)}
                              className="p-2.5 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-600 hover:shadow-md"
                              title="Desactivar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleRestore(municipalidad.id)}
                            className="p-2.5 text-green-600 hover:text-white hover:bg-green-600 rounded-lg transition-all duration-200 border border-green-200 hover:border-green-600 hover:shadow-md"
                            title="Restaurar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {municipalidades.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <svg
                          className="w-12 h-12 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        <p className="text-gray-500 text-lg">No se encontraron municipalidades</p>
                        <p className="text-gray-400 text-sm">
                          Intenta con otros filtros o agrega una nueva municipalidad
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Paginación alineada al estándar */}
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-t border-gray-200">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{totalItems === 0 ? 0 : startIndex + 1} - {endIndex}</span>
                  <span>de</span>
                  <span className="font-semibold text-slate-900">{totalItems}</span>
                  <span>registros</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={`p - 2 rounded - lg transition - all duration - 200 ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'} `}
                  onClick={() => setPage(1)}
                  disabled={currentPage === 1}
                  title="Primera página"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                </button>
                <button
                  className={`p - 2 rounded - lg transition - all duration - 200 ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'} `}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  title="Página anterior"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).slice(Math.max(0, currentPage - 3), currentPage + 2).map((_, idx) => {
                    const n = Math.max(1, currentPage - 2) + idx;
                    if (n > totalPages) return null;
                    return (
                      <button
                        key={n}
                        className={`min - w - [40px] h - 10 px - 3 rounded - lg font - semibold transition - all duration - 200 ${n === currentPage ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'} `}
                        onClick={() => setPage(n)}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                <button
                  className={`p - 2 rounded - lg transition - all duration - 200 ${currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'} `}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  title="Página siguiente"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
                <button
                  className={`p - 2 rounded - lg transition - all duration - 200 ${currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'} `}
                  onClick={() => setPage(totalPages)}
                  disabled={currentPage === totalPages}
                  title="Última página"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <MunicipalidadModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMunicipalidad(null);
        }}
        onSubmit={selectedMunicipalidad ? handleUpdate : handleCreate}
        onSuccess={() => {
          loadMunicipalidades();
          setIsModalOpen(false);
          setSelectedMunicipalidad(null);
        }}
        initialData={selectedMunicipalidad}
      />

      <MunicipalidadDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMunicipalidad(null);
        }}
        municipalidad={selectedMunicipalidad}
      />
    </div>
  );
};

export default MunicipalidadPage;
