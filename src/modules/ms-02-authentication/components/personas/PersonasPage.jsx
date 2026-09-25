import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import documentTypeService from "../../services/documentTypeService";
import personService from "../../services/personService";
import PersonDetailModal from "./PersonDetailModal";
import PersonModal from "./PersonModal";
import { PDFDownloadLink } from "@react-pdf/renderer";
import PersonReport from "../../reports/PersonReport";
import { loadCompressedLogo } from "../../../../shared/reports";

export default function PersonasPage() {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [documentTypes, setDocumentTypes] = useState({});

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const hasLoadedInitialData = useRef(false);
  const [municipalityLogo, setMunicipalityLogo] = useState(null);
  const municipalityName = sessionStorage.getItem('muniName') || '';

  useEffect(() => {
    loadCompressedLogo(80).then(setMunicipalityLogo);
  }, []);

  const getPersonStatus = (person) => {
    if (typeof person.status === "boolean") {
      return person.status ? "ACTIVE" : "INACTIVE";
    }
    if (typeof person.active === "boolean") {
      return person.active ? "ACTIVE" : "INACTIVE";
    }
    return "ACTIVE";
  };

  useEffect(() => {
    if (hasLoadedInitialData.current) return;
    hasLoadedInitialData.current = true;
    loadPersons();
    loadDocumentTypes();
  }, []);

  const loadDocumentTypes = async () => {
    try {
      const types = await documentTypeService.getAllDocumentTypes();
      const typesMap = types.reduce((acc, type) => {
        acc[type.id] = type.code;
        return acc;
      }, {});
      setDocumentTypes(typesMap);
    } catch (error) {
      setDocumentTypes({ 1: "RUC", 2: "DNI", 3: "CE", 4: "PAS" });
    }
  };

  const loadPersons = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await personService.getAllPersons();
      setPersons(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(`Error al cargar las personas: ${err.message}`);
      setPersons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "¿Eliminar persona?",
      html: `<div class="text-center"><p class="text-slate-600">Esta acción marcará a la persona como eliminada.</p></div>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      customClass: {
        popup: "rounded-2xl shadow-2xl",
        confirmButton: "btn-confirm-danger",
        cancelButton: "rounded-lg px-6 py-2.5",
      },
    });

    if (result.isConfirmed) {
      try {
        await personService.deletePerson(id);
        Swal.fire({
          title: "¡Eliminado!",
          text: "La persona ha sido eliminada correctamente",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        loadPersons();
      } catch (err) {
        Swal.fire({
          title: "Error",
          text: err.message || "No se pudo eliminar la persona",
          icon: "error",
        });
      }
    }
  };

  const handleRestore = async (id) => {
    const result = await Swal.fire({
      title: "¿Reactivar persona?",
      html: `<div class="text-center"><p class="text-slate-600">Esta acción reactivará a la persona y podrá volver a utilizarse en el sistema.</p></div>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, reactivar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      customClass: {
        popup: "rounded-2xl shadow-2xl",
        confirmButton: "bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-6 rounded-lg",
        cancelButton: "rounded-lg px-6 py-2.5",
      },
    });

    if (result.isConfirmed) {
      try {
        await personService.restorePerson(id).catch(() => {});
        const personToRestore = persons.find(p => p.id === id);
        if (personToRestore) {
           await personService.updatePerson(id, { ...personToRestore, active: true, status: true });
        }

        Swal.fire({
          title: "¡Reactivado!",
          text: "La persona ha sido reactivada correctamente",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        loadPersons();
      } catch (err) {
        Swal.fire({
          title: "Error",
          text: err.message || "No se pudo reactivar la persona",
          icon: "error",
        });
      }
    }
  };


  const handleCreate = () => {
    setSelectedPerson(null);
    setIsModalOpen(true);
  };

  const handleEdit = (person) => {
    setSelectedPerson(person);
    setIsModalOpen(true);
  };

  const handleViewDetail = (person) => {
    setSelectedPerson(person);
    setIsDetailModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPerson(null);
  };

  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedPerson(null);
  };

  const handleSuccess = () => {
    Swal.fire({
      title: "¡Éxito!",
      text: selectedPerson ? "Persona actualizada correctamente" : "Persona creada correctamente",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
    });
    loadPersons();
    handleModalClose();
  };

  const filteredPersons = persons.filter((person) => {
    const matchSearch =
      person.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.documentNumber?.includes(searchTerm) ||
      person.personalEmail?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchGender = genderFilter === "ALL" || person.gender === genderFilter;
    const personStatus = getPersonStatus(person);
    const matchStatus = statusFilter === "ALL" || personStatus === statusFilter;

    return matchSearch && matchGender && matchStatus;
  });

  const totalPages = Math.ceil(filteredPersons.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPersons = filteredPersons.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, genderFilter, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-200 border-t-cyan-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Cargando personas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4">
      {}
      <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 shadow-lg mb-5 rounded-2xl">
        <div className="px-5 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Gestión de Personas
                </h1>
                <p className="text-cyan-100 text-sm font-medium">
                  Administración de personas del sistema
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <PDFDownloadLink
                document={<PersonReport persons={filteredPersons} documentTypes={documentTypes} municipalityLogo={municipalityLogo} municipalityName={municipalityName} />}
                fileName={`reporte_personas_${new Date().toISOString().slice(0, 10)}.pdf`}
                className="flex items-center gap-2 px-5 py-2.5 bg-transparent border-2 border-white hover:bg-white/10 text-white hover:text-white rounded-xl font-semibold transition-all duration-200 text-sm shadow-md"
              >
                {({ loading }) => (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {loading ? "Preparando..." : "Reporte PDF"}
                  </>
                )}
              </PDFDownloadLink>
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-5 py-2.5 bg-transparent border-2 border-white hover:bg-white/10 text-white rounded-xl font-semibold transition-all duration-200 text-sm shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nueva Persona
              </button>
            </div>
          </div>
        </div>
      </div>

      {}
      {persons.length > 0 && (
        <div className="mb-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border-l-4 border-l-cyan-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Personas</p>
                  <p className="text-3xl font-bold text-slate-800">{persons.length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-cyan-50 text-cyan-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white border-l-4 border-l-green-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Activos</p>
                  <p className="text-3xl font-bold text-slate-800">{persons.filter((p) => getPersonStatus(p) === "ACTIVE").length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-green-50 text-green-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white border-l-4 border-l-cyan-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Masculino</p>
                  <p className="text-3xl font-bold text-slate-800">{persons.filter((p) => p.gender === "M").length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-cyan-50 text-cyan-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white border-l-4 border-l-pink-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Femenino</p>
                  <p className="text-3xl font-bold text-slate-800">{persons.filter((p) => p.gender === "F").length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-pink-50 text-pink-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Buscar
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-cyan-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Nombre, documento, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm font-medium"
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
              Género
            </label>
            <div className="relative">
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm"
              >
                <option value="ALL">Todos</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Estado
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm"
              >
                <option value="ALL">Todos</option>
                <option value="ACTIVE">Activos</option>
                <option value="INACTIVE">Inactivos</option>
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

      {}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cyan-600">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Persona
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Documento
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Género
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Celular
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedPersons.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-lg font-semibold text-slate-700 mb-1">No se encontraron personas</p>
                      <p className="text-sm text-slate-500">Intenta con otros filtros o agrega una nueva persona</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPersons.map((person) => {
                  const personStatus = getPersonStatus(person);
                  return (
                    <tr
                      key={person.id}
                      className="border-l-4 border-l-cyan-500 bg-white"
                    >
                      {}
                      <td className="px-4 py-3">
                        <div className={`font-semibold text-sm ${
                          personStatus === "ACTIVE" ? "text-emerald-600" : "text-red-500"
                        }`}>
                          {person.firstName} {person.lastName}
                        </div>
                      </td>

                      {}
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{person.documentNumber}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{documentTypes[person.documentTypeId] || "N/A"}</p>
                        </div>
                      </td>

                      {}
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${person.gender === "M" ? "text-cyan-600" : "text-pink-600"}`}>
                          {person.gender === "M" ? "\u2642 Masculino" : "\u2640 Femenino"}
                        </span>
                      </td>

                      {}
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-700">{person.personalEmail || "-"}</p>
                      </td>

                      {}
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-700">{person.personalPhone || "-"}</p>
                      </td>

                      {}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {}
                          <button
                            onClick={() => handleViewDetail(person)}
                            className="p-2.5 text-slate-600 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200 border border-slate-200 hover:border-slate-700 hover:shadow-md"
                            title="Ver detalles"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {}
                          <button
                            onClick={() => personStatus === "ACTIVE" && handleEdit(person)}
                            disabled={personStatus !== "ACTIVE"}
                            className={`p-2.5 rounded-lg transition-all duration-200 border shadow-sm ${personStatus !== "ACTIVE"
                              ? "text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed"
                              : "text-cyan-600 hover:text-white hover:bg-cyan-600 border-cyan-200 hover:border-cyan-600 hover:shadow-md"
                              }`}
                            title={personStatus !== "ACTIVE" ? "No se puede editar una persona inactiva" : "Editar"}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          {}
                          {personStatus === "ACTIVE" ? (
                            <button
                              onClick={() => handleDelete(person.id)}
                              className="p-2.5 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-600 hover:shadow-md"
                              title="Eliminar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestore(person.id)}
                              className="p-2.5 text-green-600 hover:text-white hover:bg-green-600 rounded-lg transition-all duration-200 border border-green-200 hover:border-green-600 hover:shadow-md"
                              title="Reactivar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
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

        {}
        {filteredPersons.length > 0 && totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">
                {startIndex + 1} - {Math.min(endIndex, filteredPersons.length)}
              </span>
              <span>de</span>
              <span className="font-semibold text-slate-900">{filteredPersons.length}</span>
              <span>registros</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg ${currentPage === 1 ? "text-slate-300 cursor-not-allowed" : "text-slate-600"}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg ${currentPage === 1 ? "text-slate-300 cursor-not-allowed" : "text-slate-600"}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <span className="px-3 py-1.5 text-sm font-semibold text-slate-700">
                Página {currentPage} de {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg ${currentPage === totalPages ? "text-slate-300 cursor-not-allowed" : "text-slate-600"}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg ${currentPage === totalPages ? "text-slate-300 cursor-not-allowed" : "text-slate-600"}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {}
      <PersonModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        person={selectedPerson}
        onSuccess={handleSuccess}
      />

      <PersonDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleDetailModalClose}
        person={selectedPerson}
      />
    </div>
  );
}


