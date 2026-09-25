import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import areaService from "../../services/areaService";
import personService from "../../services/personService";
import positionService from "../../services/positionService";
import userService from "../../services/userService";
import AssignmentsPage from "../assignments/AssignmentsPage";
import UserActionsMenu from "./UserActionsMenu";
import UserDetailModal from "./UserDetailModal";
import UserModal from "./UserModal";
import UserStatsCards from "./UserStatsCards";
import UserSearchBar from "./UserSearchBar";
import UserPagination from "./UserPagination";
import { PDFDownloadLink } from "@react-pdf/renderer";
import UserReport from "../../reports/UserReport";
import { loadCompressedLogo } from "../../../../shared/reports";
import { getUserInfo } from "../../../../shared/utils/municipalityHelper";


export default function UsuariosPage() {
  const currentUserMuniCode = getUserInfo().municipalCode;

  const [users, setUsers] = useState([]);
  const [persons, setPersons] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ACTIVE");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAssignments, setShowAssignments] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [positions, setPositions] = useState([]);
  const [areas, setAreas] = useState([]);
  const [municipalityLogo, setMunicipalityLogo] = useState(null);
  const municipalityName = sessionStorage.getItem('muniName') || '';

  useEffect(() => {
    loadCompressedLogo(80).then(setMunicipalityLogo);
  }, []);

  useEffect(() => {
    loadUsers(true); // primera carga con spinner
    loadPositions();
    loadAreas();

    const intervalId = setInterval(() => {
      loadUsers(false);
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const loadPositions = async () => {
    try {
      const data = await positionService.getActivePositions();
      setPositions(data);
    } catch (error) {
    }
  };

  const loadAreas = async () => {
    try {
      const data = await areaService.getActiveAreas();
      setAreas(data);
    } catch (error) {
    }
  };

  const loadUsers = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      setError(null);

      const allUsersData = await userService.getAllUsers();

      let blockedUsersData = [];
      try {
        blockedUsersData = await userService.getBlockedUsers();
      } catch (err) {
      }

      const allUsers = Array.isArray(allUsersData) ? allUsersData : [];
      const blocked = Array.isArray(blockedUsersData) ? blockedUsersData : [];

      const blockedIds = new Set(blocked.map(u => u.id));

      const combinedUsers = allUsers.map(user => {
        if (blockedIds.has(user.id)) {
          return { ...user, status: "BLOCKED" };
        }
        return user;
      });

      blocked.forEach(blockedUser => {
        if (!combinedUsers.find(u => u.id === blockedUser.id)) {
          combinedUsers.push(blockedUser);
        }
      });

      setUsers(combinedUsers);

      const personsData = await personService.getAllPersons();
      const personsMap = {};
      personsData.forEach((person) => {
        personsMap[person.id] = person;
      });
      setPersons(personsMap);
    } catch (err) {

      if (showSpinner) {
        setError(`Error al cargar los usuarios: ${err.message}`);
      }
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "¿Eliminar usuario?",
      html: `
        <div class="text-center">
          <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <p class="text-slate-600">Esta acción marcará al usuario como eliminado.<br/>Podrás restaurarlo después si es necesario.</p>
        </div>
      `,
      icon: null,
      showCancelButton: true,
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      background: "#ffffff",
      customClass: {
        popup: "rounded-2xl shadow-2xl border border-slate-200",
        title: "text-2xl font-bold text-slate-900 mb-4",
        htmlContainer: "text-slate-600",
        confirmButton: "rounded-lg px-6 py-2.5 font-medium shadow-sm btn-confirm-danger",
        cancelButton: "rounded-lg px-6 py-2.5 font-medium shadow-sm",
      },
    });

    if (result.isConfirmed) {
      try {

        const currentUser = JSON.parse(sessionStorage.getItem("user"));
        const currentUserId = currentUser?.userId;

        if (!currentUserId) {
        }

        Swal.fire({
          title: "Eliminando...",
          html: `
            <div class="text-center py-4">
              <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-cyan-600 mb-4"></div>
              <p class="text-slate-600">Por favor espera un momento</p>
            </div>
          `,
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          customClass: {
            popup: "rounded-2xl shadow-2xl",
          },
        });

        await userService.deleteUser(id);

        await Swal.fire({
          title: "¡Eliminado!",
          html: `
            <div class="text-center">
              <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p class="text-slate-600">El usuario ha sido eliminado correctamente</p>
            </div>
          `,
          icon: null,
          confirmButtonText: "Entendido",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          customClass: {
            popup: "rounded-2xl shadow-2xl border border-slate-200",
            title: "text-2xl font-bold text-slate-900 mb-4",
            confirmButton: "btn-confirm-success",
          },
        });

        loadUsers(false);
      } catch (err) {
        Swal.fire({
          title: "Error al eliminar",
          html: `
            <div class="text-center">
              <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p class="text-slate-600">${err.message || "No se pudo eliminar el usuario"
            }</p>
            </div>
          `,
          icon: null,
          confirmButtonText: "Cerrar",
          customClass: {
            popup: "rounded-2xl shadow-2xl border border-slate-200",
            title: "text-2xl font-bold text-slate-900 mb-4",
            confirmButton: "rounded-lg px-6 py-2.5 font-medium shadow-sm btn-confirm-danger",
          },
        });
      }
    }
  };

  const handleRestore = async (id) => {
    const result = await Swal.fire({
      title: "¿Restaurar usuario?",
      text: "El usuario volverá a estar activo en el sistema",
      icon: "question",
      showCancelButton: true,
      customClass: { confirmButton: 'btn-confirm-success' },
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, restaurar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        await userService.restoreUser(id);

        Swal.fire({
          title: "¡Restaurado!",
          text: "El usuario ha sido restaurado correctamente",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        loadUsers(false);
      } catch (err) {
        Swal.fire({
          title: "Error",
          text: `No se pudo restaurar el usuario: ${err.message}`,
          icon: "error",
          customClass: { confirmButton: 'btn-confirm-danger' },
        });
      }
    }
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setIsEditing(false);
    setIsFormModalOpen(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsEditing(true);

    setTimeout(() => {
      setIsFormModalOpen(true);
    }, 10);
  };

  const handleViewDetail = (user) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setSelectedUser(null);
    setIsEditing(false);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedUser(null);
  };

  const handleFormSuccess = () => {
    Swal.fire({
      title: "¡Éxito!",
      text: isEditing
        ? "Usuario actualizado correctamente"
        : "Usuario creado correctamente",
      icon: "success",
      confirmButtonText: "Continuar",
      timer: 2000,
      timerProgressBar: true,
      customClass: {
        popup: "rounded-2xl shadow-2xl",
        title: "text-slate-900 font-bold",
        htmlContainer: "text-slate-600",
        confirmButton: "rounded-lg px-6 py-2.5 font-medium btn-confirm-success",
      },
    });

    loadUsers(false);
    closeFormModal();
    if (isDetailModalOpen) closeDetailModal();
  };

  const getPersonName = (personId) => {
    const person = persons[personId];
    if (!person) return "-";
    return `${person.firstName || ""} ${person.lastName || ""}`.trim() || "-";
  };

  const getAreaName = (areaId) => {
    if (!areaId) return "-";
    const area = areas.find(a => a.id === areaId);
    return area ? area.name : `ID: ${areaId.substring(0, 8)}...`;
  };

  const getPositionName = (positionId) => {
    if (!positionId) return "-";
    const position = positions.find(p => p.id === positionId);
    return position ? position.name : `ID: ${positionId.substring(0, 8)}...`;
  };

  const baseUsers = useMemo(() => {
    return users.filter(user => {
      // Si el usuario actual tiene municipalCode -> solo ve usuarios de ESA municipalidad
      if (currentUserMuniCode) {
        return user.municipalCode === currentUserMuniCode;
      }
      // Si el usuario actual NO tiene municipalCode -> solo ve usuarios SIN municipalCode
      return !user.municipalCode;
    });
  }, [users, currentUserMuniCode]);

  const filteredUsers = baseUsers.filter((user) => {
    const personName = getPersonName(user.personId);
    const matchSearch =
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      personName.toLowerCase().includes(searchTerm.toLowerCase());

    let userStatus = user.status;

    if (user.blockedUntil) {
      const blockedUntilDate = new Date(user.blockedUntil);
      if (blockedUntilDate > new Date()) {
        userStatus = "BLOCKED";
      }
    }

    const matchStatus = userStatus === filterStatus;

    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);




  if (showAssignments) {
    return <AssignmentsPage onBack={() => setShowAssignments(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      
      <div className="bg-cyan-600 shadow-lg mb-8 rounded-2xl">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Gestión de Usuarios
                </h1>
                <p className="text-cyan-100 text-sm font-medium">
                  Administración de usuarios del sistema municipal
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAssignments(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all duration-200 backdrop-blur-sm text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Asignaciones
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-5 py-2.5 bg-transparent border-2 border-white/70 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-200 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nuevo Usuario
              </button>
              <PDFDownloadLink
                document={
                  <UserReport 
                    users={filteredUsers} 
                    persons={persons} 
                    areas={areas} 
                    positions={positions} 
                    municipalityLogo={municipalityLogo}
                    municipalityName={municipalityName}
                  />
                }
                fileName={`reporte_usuarios_${new Date().toISOString().slice(0, 10)}.pdf`}
                className="flex items-center gap-2 px-5 py-2.5 bg-transparent border-2 border-white/70 hover:bg-white/20 text-white hover:text-white rounded-xl font-semibold transition-all duration-200 text-sm"
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
            </div>
          </div>
        </div>
      </div>

      
      <UserStatsCards baseUsers={baseUsers} />

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
          <p className="font-medium">{error}</p>
          <button
            onClick={() => {
              sessionStorage.clear();
              window.location.href = `${import.meta.env.BASE_URL}login`;
            }}
            className="mt-2 text-sm underline hover:text-red-900"
          >
            Limpiar sesión y volver a login
          </button>
        </div>
      )}

      <UserSearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} filterStatus={filterStatus} setFilterStatus={setFilterStatus} />

      
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cyan-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Persona
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Área
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mb-6">
                        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <p className="text-xl font-semibold text-slate-700 mb-2">No se encontraron usuarios</p>
                      <p className="text-slate-500">Intenta con otros filtros o agrega un nuevo usuario</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="group hover:bg-slate-50 transition-all duration-200 border-l-4 border-l-cyan-500 hover:border-l-cyan-600 bg-white"
                  >
                    
                    <td className="px-6 py-5">
                      <div className={`font-semibold text-sm ${
                        user.status === "ACTIVE" ? "text-emerald-600" :
                        user.status === "SUSPENDED" ? "text-orange-500" :
                        user.status === "BLOCKED" ? "text-cyan-600" :
                        "text-red-500"
                      }`}>{user.username}</div>
                    </td>

                    
                    <td className="px-6 py-5">
                      <div className={`text-sm font-medium ${
                        persons[user.personId]?.status === true || persons[user.personId]?.status === "ACTIVE"
                          ? "text-slate-800" : "text-red-500"
                      }`}>{getPersonName(user.personId)}</div>
                    </td>

                    
                    <td className="px-6 py-5">
                      <span className="text-sm font-semibold text-slate-800">{getAreaName(user.areaId)}</span>
                    </td>

                    
                    <td className="px-6 py-5">
                      <span className="text-sm font-semibold text-slate-700">{getPositionName(user.positionId)}</span>
                    </td>

                    
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        
                        <button
                          onClick={() => handleViewDetail(user)}
                          className="p-2.5 text-slate-600 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200 border border-slate-200 hover:border-slate-700 hover:shadow-md"
                          title="Ver detalles"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        
                        <button
                          onClick={() => user.status !== "INACTIVE" && handleEdit(user)}
                          disabled={user.status === "INACTIVE"}
                          className={`p-2.5 rounded-lg transition-all duration-200 border shadow-sm ${user.status === "INACTIVE"
                            ? "text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed"
                            : "text-cyan-600 hover:text-white hover:bg-cyan-600 border-cyan-200 hover:border-cyan-600 hover:shadow-md"
                            }`}
                          title={user.status === "INACTIVE" ? "No se puede editar un usuario inactivo" : "Editar usuario"}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        
                        {user.status === "INACTIVE" ? (
                          <button
                            onClick={() => handleRestore(user.id)}
                            className="p-2.5 text-green-600 hover:text-white hover:bg-green-600 rounded-lg transition-all duration-200 border border-green-200 hover:border-green-600 hover:shadow-md"
                            title="Restaurar usuario"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2.5 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-600 hover:shadow-md"
                            title="Eliminar usuario"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}

                        
                        <UserActionsMenu user={user} onSuccess={() => loadUsers(false)} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <UserPagination
          filteredUsers={filteredUsers}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          startIndex={startIndex}
          endIndex={endIndex}
        />
      </div>

      
      <UserModal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        onSuccess={handleFormSuccess}
        user={isEditing ? selectedUser : null}
        users={baseUsers}
      />

      <UserDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        user={selectedUser}
        onEdit={handleEdit}
        users={baseUsers}
      />
    </div>
  );
}
