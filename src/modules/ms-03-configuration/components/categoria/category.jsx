import React, { useEffect, useState } from "react";
import { useAuth } from "../../../ms-02-authentication/hooks/useAuth.jsx";
import { getMunicipalidadById } from "../../../ms-01-tenant-management/services/municipalidadService.js";
import {
  getAllActiveCategories,
  getAllInactiveCategories,
  restoreCategory,
  deleteCategory,
} from "../../services/apiCategory";
import {
  FaUndo,
  FaSearch,
  FaEye,
  FaTrash,
  FaEdit,
  FaInfoCircle,
  FaCheckCircle,
  FaBan,
  FaLayerGroup,
  FaFilePdf,
} from "react-icons/fa";
import Swal from "sweetalert2";
import EditarCategoria from "./editcategory";
import CrearCategoria from "./createCategory";
import Paginator from "../../../../shared/utils/Paginator";
import ContentLoading from "../../../../shared/utils/ContentLoading";
import { PDFDownloadLink } from "@react-pdf/renderer";
import CategoryReport, { CategoryDetailReport } from "../../reports/CategoryReport";
import { getMunicipalityId } from "../../../../shared/utils/municipalityHelper.js";
const CategoriaList = () => {
  const { user } = useAuth();
  const [municipalityError, setMunicipalityError] = useState(null);
  const [municipalityName, setMunicipalityName] = useState('Municipalidad');
  const [muniLogo, setMuniLogo] = useState(sessionStorage.getItem('muniLogo') || null);
  const [categorias, setCategorias] = useState([]);
  const [filter, setFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchCategorias = async () => {
    try {
      setLoading(true);
      setError(null);
      const [active, inactive] = await Promise.all([
        getAllActiveCategories(),
        getAllInactiveCategories(),
      ]);
      const todasCategorias = [...active, ...inactive];
      setCategorias(todasCategorias || []);
    } catch (err) {
      setError('Error al cargar las categorías: ' + err.message);
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCategorias();
  }, []);

  useEffect(() => {
    // Escuchar cambios en sessionStorage para el muniLogo
    const handleStorageChange = () => {
      const updatedLogo = sessionStorage.getItem('muniLogo');
      if (updatedLogo !== muniLogo) {
        setMuniLogo(updatedLogo);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // También escuchar cambios custom
    window.addEventListener('muniLogoUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('muniLogoUpdated', handleStorageChange);
    };
  }, [muniLogo]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);
  useEffect(() => {
    const fetchMunicipalityName = async () => {
      const municipalityId = getMunicipalityId() || user?.municipalCode;
      if (!municipalityId) {
        setMunicipalityError('No se pudo detectar municipalityId en el login');
        setMunicipalityName('Municipalidad');
        return;
      }

      try {
        setMunicipalityError(null);
        const municipality = await getMunicipalidadById(municipalityId);
        setMunicipalityName(municipality.nombre || municipality.name || 'Municipalidad');
      } catch (err) {
        setMunicipalityError('No se pudo cargar el nombre de la municipalidad');
        setMunicipalityName('Municipalidad');
      }
    };

    fetchMunicipalityName();
  }, [user?.municipalCode, user]);
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString + "Z");
    return date.toLocaleString("es-PE", {
      timeZone: "America/Lima",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };
  const handleRestore = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Restaurar categoría?",
      text: "Esta categoría volverá a estar activa.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, restaurar",
      cancelButtonText: "Cancelar",
    });
    if (confirm.isConfirmed) {
      try {
        await restoreCategory(id);
        await fetchCategorias();
        Swal.fire("Restaurada", "La categoría ha sido restaurada.", "success");
      } catch {
        Swal.fire("Error", "No se pudo restaurar la categoría.", "error");
      }
    }
  };
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Inactivar categoría?",
      text: "La categoría pasará a estado inactivo.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, inactivar",
      cancelButtonText: "Cancelar",
    });
    if (confirm.isConfirmed) {
      try {
        await deleteCategory(id);
        await fetchCategorias();
        Swal.fire("Inactivada", "La categoría ha sido inactivada.", "success");
      } catch {
        Swal.fire("Error", "No se pudo inactivar la categoría.", "error");
      }
    }
  };
  const filtered = categorias
    .sort((a, b) => {
      const numA = parseInt(a.categoryCode?.split("-")[1], 10) || 0;
      const numB = parseInt(b.categoryCode?.split("-")[1], 10) || 0;
      return numA - numB;
    })
    .filter((cat) => {
      const byState =
        filter === "activos"
          ? cat.active
          : filter === "inactivos"
            ? !cat.active
            : true;
      const search = searchTerm.toLowerCase();
      const parentName = categorias.find(c => c.id === cat.parentCategoryId)?.name || "";
      const bySearch =
        cat.name?.toLowerCase().includes(search) ||
        cat.categoryCode?.toLowerCase().includes(search) ||
        cat.description?.toLowerCase().includes(search) ||
        parentName.toLowerCase().includes(search) ||
        String(cat.level || "").includes(search) ||
        (cat.isInventoriable ? "sí" : "no").includes(search);
      return byState && bySearch;
    });
  const totalCategorias = categorias.length;
  const totalActivas = categorias.filter((c) => c.active).length;
  const totalInactivas = categorias.filter((c) => !c.active).length;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  return (
    <div>
      {loading && (
        <div className="relative min-h-[400px]">
          <ContentLoading isLoading={true} message="Cargando categorías..." />
        </div>
      )}
      {!loading && (
        <>
          <div className="bg-blue-600 shadow-lg mb-8 rounded-2xl">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Gestión de Categorías
                </h1>
                <p className="text-blue-100 text-sm font-medium">
                  Organiza y administra las categorías
                </p>
                {municipalityError && (
                  <div className="mt-2 flex items-center gap-2 text-yellow-300 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    {municipalityError}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-transparent border-2 border-white/70 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-200 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Crear Categoría
              </button>
              <PDFDownloadLink
                document={<CategoryReport categorias={filtered} allCategories={categorias} entity={municipalityName} muniLogo={muniLogo} />}
                fileName="reporte_categorias.pdf"
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-xl font-semibold text-sm transition-all duration-200 hover:bg-blue-50"
              >
                {({ loading }) =>
                  loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Generando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Generar Reporte PDF
                    </>
                  )
                }
              </PDFDownloadLink>
            </div>
          </div>
        </div>
      </div>
      {categorias.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white border-l-4 border-l-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total</p>
                  <p className="text-3xl font-bold text-slate-800">{totalCategorias}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500">
                  <FaLayerGroup className="w-6 h-6" />
                </div>
              </div>
            </div>
            <div className="bg-white border-l-4 border-l-green-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Activas</p>
                  <p className="text-3xl font-bold text-slate-800">{totalActivas}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-green-50 text-green-500">
                  <FaCheckCircle className="w-6 h-6" />
                </div>
              </div>
            </div>
            <div className="bg-white border-l-4 border-l-gray-400 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Inactivas</p>
                  <p className="text-3xl font-bold text-slate-800">{totalInactivas}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-50 text-gray-400">
                  <FaBan className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-3xl shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
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
                placeholder="Buscar por código, nombre, descripción..."
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
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
              >
                <option value="todos">Todas</option>
                <option value="activos">Activas</option>
                <option value="inactivos">Inactivas</option>
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
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-600">
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Código</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Nivel</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Inventariable</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Categoría Padre</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <p className="text-lg font-medium text-gray-900 mb-1">No hay categorías</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50/80 transition-colors duration-200 group border-l-4 border-transparent group-hover:border-blue-500 border-b border-gray-50 last:border-b-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${cat.active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{cat.categoryCode}</p>                          <p className={`text-xs font-medium mt-0.5 ${cat.active ? 'text-green-600' : 'text-gray-500'}`}>
                            {cat.active ? "Activa" : "Inactiva"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{cat.name}</td>
                    <td className="px-6 py-4 text-slate-600">{cat.description || "—"}</td>
                    <td className="px-6 py-4 text-slate-600">{cat.level || "—"}</td>
                    <td className="px-6 py-4 text-slate-600">{cat.isInventoriable ? <span className="text-blue-600 font-semibold">Sí</span> : <span className="text-red-600 font-semibold">No</span>}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {cat.parentCategoryId
                        ? categorias.find(c => c.id === cat.parentCategoryId)?.name || "—"
                        : "Ninguno"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelected(cat)}
                          className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Ver detalles"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        {cat.active ? (
                          <>
                            <PDFDownloadLink
                              document={<CategoryDetailReport category={cat} allCategories={categorias} entity={municipalityName} muniLogo={muniLogo} />}
                              fileName={`categoria_${cat.categoryCode || cat.id}.pdf`}
                              className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Descargar PDF"
                            >
                              {({ loading }) => (
                                <span className="flex items-center justify-center w-8 h-8">
                                  <FaFilePdf className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
                                </span>
                              )}
                            </PDFDownloadLink>
                            <button
                              onClick={() => setEditing(cat)}
                              className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Editar"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(cat.id)}
                              className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Inactivar"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleRestore(cat.id)}
                            className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                            title="Restaurar"
                          >
                            <FaUndo className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {filtered.length > 0 && (
        <div className="mt-6">
          <Paginator
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(newSize) => {
              setItemsPerPage(newSize);
              setCurrentPage(1);
            }}
            showPageInfo={true}
            showItemsPerPage={true}
          />
        </div>
      )}
      {creating && (
        <CrearCategoria
          onClose={() => setCreating(false)}
          onCreated={fetchCategorias}
        />
      )}
      {selected && (
        <div className="fixed inset-0 bg-gray-900/75 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-fadeInScale">
            <div className="px-8 py-6 flex-shrink-0 flex justify-between items-start bg-blue-600 rounded-t-3xl">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-inner">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Detalle de Categoría</h2>
                  <p className="text-blue-100 font-mono text-sm mt-1">{selected.categoryCode}</p>
                  <div className={`mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${selected.active ? 'bg-green-400/30 text-white' : 'bg-gray-400/30 text-white'}`}>
                    {selected.active ? "Activa" : "Inactiva"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelected(null)}
                  className="w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white" style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}>
              <section>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                  Información General
                </h3>
                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Código</label><p className="text-sm font-semibold text-slate-900 mt-1">{selected.categoryCode}</p></div>
                    <div><label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Nombre</label><p className="text-sm font-semibold text-slate-900 mt-1">{selected.name}</p></div>
                    <div className="md:col-span-2"><label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Descripción</label><p className="text-sm text-slate-700 mt-1">{selected.description || "—"}</p></div>
                    <div><label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Nivel</label><p className="text-sm font-semibold text-slate-900 mt-1">{selected.level || "—"}</p></div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Categoría Padre</label>
                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        {selected.parentCategoryId ? categorias.find(c => c.id === selected.parentCategoryId)?.name || "—" : "Ninguno"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
              <section>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                  Configuración de Control
                </h3>
                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3"><div className={`w-5 h-5 flex items-center justify-center rounded-full ${selected.isInventoriable ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{selected.isInventoriable ? <FaCheckCircle /> : <FaBan />}</div><span className="font-medium text-slate-800">Inventariable</span></div>
                    <div className="flex items-center gap-3"><div className={`w-5 h-5 flex items-center justify-center rounded-full ${selected.requiresSerial ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{selected.requiresSerial ? <FaCheckCircle /> : <FaBan />}</div><span className="font-medium text-slate-800">Requiere Serie</span></div>
                    <div className="flex items-center gap-3"><div className={`w-5 h-5 flex items-center justify-center rounded-full ${selected.requiresPlate ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{selected.requiresPlate ? <FaCheckCircle /> : <FaBan />}</div><span className="font-medium text-slate-800">Requiere Placa</span></div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
      {editing && (
        <EditarCategoria
          categoria={editing}
          onClose={() => setEditing(null)}
          onUpdated={fetchCategorias}
        />
      )}
        </>
      )}
    </div>
  );
};
export default CategoriaList;