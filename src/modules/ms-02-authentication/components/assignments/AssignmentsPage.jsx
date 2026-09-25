import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import assignmentService from "../../services/assignmentService";
import permissionService from "../../services/permissionService";
import personService from "../../services/personService";
import roleService from "../../services/roleService";
import userService from "../../services/userService";
import AssignPermissionModal from "./AssignPermissionModal";
import AssignRoleModal from "./AssignRoleModal";

export default function AssignmentsPage({ onBack }) {
  const isExpired = (expirationDate) => {
    if (!expirationDate) return false;
    try {
      let expirationDateObj;
      if (typeof expirationDate === "string" && expirationDate.includes("-") && !expirationDate.includes("T")) {
        const [year, month, day] = expirationDate.split("-").map(Number);
        expirationDateObj = new Date(year, month - 1, day);
      } else {
        expirationDateObj = new Date(expirationDate);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expirationDateObj.setHours(0, 0, 0, 0);

      return expirationDateObj < today;
    } catch {
      return false;
    }
  };

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [persons, setPersons] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("role-permission");

  const [isAssignRoleModalOpen, setIsAssignRoleModalOpen] = useState(false);
  const [isAssignPermissionModalOpen, setIsAssignPermissionModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [userRolesError, setUserRolesError] = useState(null);
  const [rolePermissionsError, setRolePermissionsError] = useState(null);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  const [searchUsers, setSearchUsers] = useState("");
  const [searchRoles, setSearchRoles] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const fetchWithFallback = async (p, fallback = []) => {
        try {
          return await p;
        } catch {
          return fallback;
        }
      };

      const [usersData, rolesData, permissionsData, personsData] = await Promise.all([
        fetchWithFallback(userService.getAllUsers()),
        fetchWithFallback(roleService.getAllRoles()),
        fetchWithFallback(permissionService.getAllPermissions()),
        fetchWithFallback(personService.getAllPersons()),
      ]);

      const getData = (data) => {
        if (Array.isArray(data)) return data;
        if (data && data.content && Array.isArray(data.content)) return data.content;
        return [];
      };

      setUsers(getData(usersData));
      setRoles(getData(rolesData));
      setPermissions(getData(permissionsData));

      const personsMap = {};
      if (Array.isArray(personsData)) {
        personsData.forEach((person) => {
          personsMap[person.id] = person;
        });
      }
      setPersons(personsMap);
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: `No se pudieron cargar los datos iniciales. Detalle: ${err.message}`,
        icon: "error",
        customClass: { confirmButton: "btn-confirm-danger" },
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserRoles = async (userId) => {
    try {
      setLoadingRoles(true);
      setUserRolesError(null);
      const rows = await assignmentService.getUserRoles(userId);

      const expiredAssignments = rows.filter((r) => isExpired(r.expirationDate));

      if (expiredAssignments.length > 0) {
        await Promise.all(
          expiredAssignments.map((r) => assignmentService.removeRoleFromUser(userId, r.roleId))
        );
        const cleanedRows = rows.filter((r) => !isExpired(r.expirationDate));
        setUserRoles(cleanedRows);
      } else {
        setUserRoles(rows);
      }
    } catch (err) {
      setUserRoles([]);
      setUserRolesError(err.message);
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadRolePermissions = async (roleId) => {
    try {
      setLoadingPermissions(true);
      setRolePermissionsError(null);
      const rows = await assignmentService.getRolePermissions(roleId);
      setRolePermissions(rows);
    } catch (err) {
      setRolePermissions([]);
      setRolePermissionsError(err.message);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSelectedRole(null);
    loadUserRoles(user.id || user.userId);
  };

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setSelectedUser(null);
    loadRolePermissions(role.id);
  };

  const handleRemoveRoleFromUser = async (userId, roleId) => {
    const result = await Swal.fire({
      title: "¿Quitar rol?",
      text: "El usuario perderá este rol y sus permisos asociados",
      icon: "warning",
      showCancelButton: true,
      customClass: { confirmButton: "btn-confirm-danger" },
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, quitar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await assignmentService.removeRoleFromUser(userId, roleId);
        Swal.fire({
          title: "¡Éxito!",
          text: "Rol quitado correctamente",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        loadUserRoles(userId);
      } catch (err) {
        Swal.fire({
          title: "Error",
          text: err.message || "No se pudo quitar el rol",
          icon: "error",
          customClass: { confirmButton: "btn-confirm-danger" },
        });
      }
    }
  };

  const handleRemovePermissionFromRole = async (roleId, permissionId) => {
    const result = await Swal.fire({
      title: "¿Quitar permiso?",
      text: "El rol perderá este permiso",
      icon: "warning",
      showCancelButton: true,
      customClass: { confirmButton: "btn-confirm-danger" },
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, quitar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await assignmentService.removePermissionFromRole(roleId, permissionId);
        Swal.fire({
          title: "¡Éxito!",
          text: "Permiso quitado correctamente",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        loadRolePermissions(roleId);
      } catch (err) {
        Swal.fire({
          title: "Error",
          text: err.message || "No se pudo quitar el permiso",
          icon: "error",
          customClass: { confirmButton: "btn-confirm-danger" },
        });
      }
    }
  };

  const getPersonName = (personId) => {
    const person = persons[personId];
    if (!person) return "-";
    return `${person.firstName || ""} ${person.lastName || ""}`.trim() || "-";
  };

  const getRolePrimaryLabel = (role) => {
    const description = role?.description?.trim();
    return description || role?.name || "-";
  };

  const getRoleSecondaryLabel = (role) => {
    const description = role?.description?.trim();
    return description ? role?.name : null;
  };

  const getUserPrimaryLabel = (user) => {
    const personName = getPersonName(user.personId);
    return personName !== "-" ? personName : user.username;
  };

  const getUserSecondaryLabel = (user) => {
    const personName = getPersonName(user.personId);
    return personName !== "-" ? user.username : null;
  };

  const getAssignedRolePrimaryLabel = (assignment) => {
    const role = rolesById[assignment.roleId];
    const description = assignment.roleDescription?.trim() || role?.description?.trim();
    return description || assignment.roleName || "-";
  };

  const getAssignedRoleSecondaryLabel = (assignment) => {
    const role = rolesById[assignment.roleId];
    const description = assignment.roleDescription?.trim() || role?.description?.trim();
    return description ? assignment.roleName : null;
  };

  const formatDate = (date, dateOnly = false) => {
    if (!date) return "-";
    try {
      let dateObj;
      if (Array.isArray(date)) {
        const [year, month, day, hour = 0, minute = 0, second = 0] = date;
        dateObj = new Date(year, month - 1, day, hour, minute, second);
      } else if (typeof date === "string" && date.includes("-") && !date.includes("T")) {
        const [year, month, day] = date.split("-").map(Number);
        dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      } else {
        dateObj = new Date(date);
      }
      if (isNaN(dateObj.getTime())) return "-";

      if (dateOnly) {
        return new Intl.DateTimeFormat("es-PE", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          timeZone: "UTC",
        }).format(dateObj);
      }

      return new Intl.DateTimeFormat("es-PE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(dateObj);
    } catch {
      return "-";
    }
  };

  const activeUsers = useMemo(
    () => users.filter((u) => u.status === "ACTIVE"),
    [users]
  );

  const activeRoles = useMemo(
    () => roles.filter((r) => !r.deletedAt),
    [roles]
  );

  const rolesById = useMemo(() => {
    const map = {};
    roles.forEach((role) => {
      map[role.id] = role;
    });
    return map;
  }, [roles]);

  const filteredUsers = useMemo(() => {
    const term = searchUsers.toLowerCase().trim();
    if (!term) return activeUsers;
    return activeUsers.filter((user) => {
      const personName = getPersonName(user.personId).toLowerCase();
      return user.username?.toLowerCase().includes(term) || personName.includes(term);
    });
  }, [activeUsers, searchUsers, persons]);

  const filteredRolesList = useMemo(() => {
    const term = searchRoles.toLowerCase().trim();
    if (!term) return activeRoles;
    return activeRoles.filter(
      (role) =>
        role.name?.toLowerCase().includes(term) ||
        role.description?.toLowerCase().includes(term)
    );
  }, [activeRoles, searchRoles]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSelectedUser(null);
    setSelectedRole(null);
    setUserRoles([]);
    setRolePermissions([]);
    setUserRolesError(null);
    setRolePermissionsError(null);
    setSearchUsers("");
    setSearchRoles("");
  };

  const getRoleStatusText = (assignment) => {
    const parts = [];
    parts.push(assignment.active ? "Activo" : "Inactivo");
    parts.push(assignment.expirationDate ? "Temporal" : "Permanente");
    return parts.join(" · ");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-10 h-10 mx-auto mb-4">
            <div className="absolute inset-0 border-2 border-slate-200 rounded-full" />
            <div className="absolute inset-0 border-2 border-slate-400 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="text-slate-500 text-sm">Cargando asignaciones...</p>
        </div>
      </div>
    );
  }

  const renderEmptyState = (title, subtitle) => (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <p className="text-slate-600 font-medium">{title}</p>
      <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
    </div>
  );

  const renderErrorState = (message, onRetry) => (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <p className="text-slate-600 font-medium">Error al cargar datos</p>
      <p className="text-slate-400 text-sm mt-1 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-sm text-slate-600 hover:text-slate-900 underline"
        >
          Reintentar
        </button>
      )}
    </div>
  );

  const renderSearchInput = (value, onChange, placeholder) => (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Asignaciones</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Primero define los permisos de cada rol, luego asígnalos a los usuarios.
              </p>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                ← Volver a Usuarios
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex gap-6 border-b border-slate-200 mb-6">
          <button
            onClick={() => switchTab("role-permission")}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "role-permission"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Rol-Permiso ({activeRoles.length})
          </button>
          <button
            onClick={() => switchTab("user-role")}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "user-role"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Usuario-Rol ({activeUsers.length})
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 min-h-[560px]">
            {activeTab === "role-permission" ? (
              <>
                <div className="flex flex-col">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h2 className="text-sm font-semibold text-slate-900">Roles</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Selecciona un rol</p>
                    <div className="mt-3">{renderSearchInput(searchRoles, setSearchRoles, "Buscar rol...")}</div>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[480px]">
                    {filteredRolesList.length === 0 ? (
                      renderEmptyState("Sin resultados", "Prueba con otro término de búsqueda")
                    ) : (
                      filteredRolesList.map((role) => (
                        <button
                          key={role.id}
                          onClick={() => handleSelectRole(role)}
                          className={`w-full px-5 py-3.5 text-left border-b border-slate-100 transition-colors ${
                            selectedRole?.id === role.id
                              ? "bg-slate-100"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="font-medium text-sm text-slate-900">{getRolePrimaryLabel(role)}</div>
                          {getRoleSecondaryLabel(role) && (
                            <div className="text-xs text-slate-500 mt-0.5 truncate">
                              {getRoleSecondaryLabel(role)}
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-slate-900">
                        {selectedRole ? getRolePrimaryLabel(selectedRole) : "Permisos"}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedRole ? (
                          <>
                            {getRoleSecondaryLabel(selectedRole) && (
                              <span className="block truncate">{getRoleSecondaryLabel(selectedRole)}</span>
                            )}
                            <span>
                              {rolePermissionsError
                                ? "No se pudieron cargar los permisos"
                                : `${rolePermissions.length} permiso${rolePermissions.length !== 1 ? "s" : ""} asignado${rolePermissions.length !== 1 ? "s" : ""}`}
                            </span>
                          </>
                        ) : (
                          "Selecciona un rol de la lista"
                        )}
                      </p>
                    </div>
                    {selectedRole && (
                      <button
                        onClick={() => setIsAssignPermissionModalOpen(true)}
                        disabled={loadingPermissions}
                        className="shrink-0 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingPermissions ? "Cargando..." : "Asignar"}
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[480px]">
                    {!selectedRole ? (
                      renderEmptyState("Selecciona un rol", "Para ver y gestionar sus permisos")
                    ) : rolePermissionsError ? (
                      renderErrorState(rolePermissionsError, () =>
                        loadRolePermissions(selectedRole.id)
                      )
                    ) : rolePermissions.length === 0 ? (
                      renderEmptyState("Sin permisos asignados", "Este rol no tiene permisos configurados")
                    ) : (
                      rolePermissions.map((rolePerm) => {
                        const permDetails = permissions.find(
                          (p) => String(p.id) === String(rolePerm.permissionId)
                        );
                        const module =
                          permDetails?.module ||
                          rolePerm.permissionModule ||
                          rolePerm.permissionName ||
                          "Permiso";
                        const action = permDetails?.action || rolePerm.permissionAction || "-";
                        const resource = permDetails?.resource || rolePerm.permissionResource || "-";
                        const description =
                          permDetails?.description || rolePerm.permissionDescription || null;
                        const isPermInactive = !!permissions.find(
                          (p) => p.id === rolePerm.permissionId
                        )?.deletedAt;
                        const permPrimary = description?.trim() || module;
                        const permSecondary = description?.trim()
                          ? `${module} · ${action} · ${resource}`
                          : `${action} · ${resource}`;

                        return (
                          <div
                            key={rolePerm.permissionId}
                            className="flex items-start justify-between gap-3 px-5 py-3.5 border-b border-slate-100"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm text-slate-900">{permPrimary}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{permSecondary}</div>
                            </div>
                            <button
                              onClick={() => {
                                if (!isPermInactive) {
                                  handleRemovePermissionFromRole(
                                    selectedRole.id,
                                    rolePerm.permissionId
                                  );
                                }
                              }}
                              disabled={isPermInactive}
                              className={`shrink-0 text-xs transition-colors ${
                                isPermInactive
                                  ? "text-slate-300 cursor-not-allowed"
                                  : "text-slate-400 hover:text-red-600"
                              }`}
                              title={isPermInactive ? "Permiso inactivo" : "Quitar permiso"}
                            >
                              Quitar
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h2 className="text-sm font-semibold text-slate-900">Usuarios</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Selecciona un usuario</p>
                    <div className="mt-3">{renderSearchInput(searchUsers, setSearchUsers, "Buscar usuario...")}</div>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[480px]">
                    {filteredUsers.length === 0 ? (
                      renderEmptyState("Sin resultados", "Prueba con otro término de búsqueda")
                    ) : (
                      filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleSelectUser(user)}
                          className={`w-full px-5 py-3.5 text-left border-b border-slate-100 transition-colors ${
                            selectedUser?.id === user.id ? "bg-slate-100" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="font-medium text-sm text-slate-900">{getUserPrimaryLabel(user)}</div>
                          {getUserSecondaryLabel(user) && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              {getUserSecondaryLabel(user)}
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-slate-900">
                        {selectedUser ? getUserPrimaryLabel(selectedUser) : "Roles"}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedUser ? (
                          <>
                            {getUserSecondaryLabel(selectedUser) && (
                              <span className="block truncate">
                                {getUserSecondaryLabel(selectedUser)}
                              </span>
                            )}
                            <span>
                              {userRolesError
                                ? "No se pudieron cargar los roles"
                                : `${userRoles.filter((r) => !isExpired(r.expirationDate)).length} rol${userRoles.filter((r) => !isExpired(r.expirationDate)).length !== 1 ? "es" : ""} asignado${userRoles.filter((r) => !isExpired(r.expirationDate)).length !== 1 ? "s" : ""}`}
                            </span>
                          </>
                        ) : (
                          "Selecciona un usuario de la lista"
                        )}
                      </p>
                    </div>
                    {selectedUser && (
                      <button
                        onClick={() => setIsAssignRoleModalOpen(true)}
                        disabled={loadingRoles}
                        className="shrink-0 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingRoles ? "Cargando..." : "Asignar"}
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[480px]">
                    {!selectedUser ? (
                      renderEmptyState("Selecciona un usuario", "Para ver y gestionar sus roles")
                    ) : userRolesError ? (
                      renderErrorState(userRolesError, () =>
                        loadUserRoles(selectedUser.id || selectedUser.userId)
                      )
                    ) : userRoles.filter((r) => !isExpired(r.expirationDate)).length === 0 ? (
                      renderEmptyState("Sin roles asignados", "Este usuario no tiene roles")
                    ) : (
                      userRoles
                        .filter((assignment) => !isExpired(assignment.expirationDate))
                        .map((assignment) => (
                          <div
                            key={assignment.roleId}
                            className="flex items-start justify-between gap-3 px-5 py-3.5 border-b border-slate-100"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm text-slate-900">
                                {getAssignedRolePrimaryLabel(assignment)}
                              </div>
                              {getAssignedRoleSecondaryLabel(assignment) && (
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {getAssignedRoleSecondaryLabel(assignment)}
                                </div>
                              )}
                              <div className="text-xs text-slate-500 mt-0.5">
                                {getRoleStatusText(assignment)}
                                {assignment.assignedAt &&
                                  ` · Asignado ${formatDate(assignment.assignedAt)}`}
                              </div>
                              {assignment.expirationDate && (
                                <div className="text-xs text-slate-400 mt-1">
                                  Expira: {formatDate(assignment.expirationDate, true)}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                assignment.active &&
                                !isExpired(assignment.expirationDate) &&
                                handleRemoveRoleFromUser(
                                  selectedUser.id || selectedUser.userId,
                                  assignment.roleId
                                )
                              }
                              disabled={!assignment.active || isExpired(assignment.expirationDate)}
                              className={`shrink-0 text-xs transition-colors ${
                                !assignment.active || isExpired(assignment.expirationDate)
                                  ? "text-slate-300 cursor-not-allowed"
                                  : "text-slate-400 hover:text-red-600"
                              }`}
                              title={
                                !assignment.active
                                  ? "Rol inactivo"
                                  : isExpired(assignment.expirationDate)
                                    ? "Rol expirado"
                                    : "Quitar rol"
                              }
                            >
                              Quitar
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <AssignRoleModal
        isOpen={isAssignRoleModalOpen}
        onClose={() => setIsAssignRoleModalOpen(false)}
        onSuccess={() => {
          setIsAssignRoleModalOpen(false);
          if (selectedUser) loadUserRoles(selectedUser.id || selectedUser.userId);
        }}
        user={selectedUser}
        roles={activeRoles}
        assignedRoles={userRoles}
      />

      <AssignPermissionModal
        isOpen={isAssignPermissionModalOpen}
        onClose={() => setIsAssignPermissionModalOpen(false)}
        onSuccess={() => {
          setIsAssignPermissionModalOpen(false);
          if (selectedRole) loadRolePermissions(selectedRole.id);
        }}
        role={selectedRole}
        permissions={permissions.filter((p) => !p.deletedAt)}
        assignedPermissions={rolePermissions}
      />
    </div>
  );
}
