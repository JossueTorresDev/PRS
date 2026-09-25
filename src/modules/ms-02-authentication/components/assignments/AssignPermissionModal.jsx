import { useState, useMemo } from "react";
import Swal from "sweetalert2";
import assignmentService from "../../services/assignmentService";

export default function AssignPermissionModal({
  isOpen,
  onClose,
  onSuccess,
  role,
  permissions,
  assignedPermissions,
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const availablePermissions = (permissions || []).filter(
    (permission) =>
      !(assignedPermissions || []).some((ap) =>
        String(ap.permissionId) === String(permission.id)
      )
  );

  const filteredPermissions = availablePermissions.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const text = `${p.module} ${p.action} ${p.resource} ${p.displayName || ""} ${p.description || ""}`.toLowerCase();
    return text.includes(term);
  });

  const groupedPermissions = useMemo(() => {
    const groups = {};
    filteredPermissions.forEach((p) => {
      const mod = p.module || "Sin módulo";
      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(p);
    });
    return groups;
  }, [filteredPermissions]);

  if (!isOpen) return null;

  const togglePermission = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredPermissions.map((p) => p.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      Swal.fire({
        title: "Atención",
        text: "Debes seleccionar al menos un permiso",
        icon: "warning",
        customClass: { confirmButton: "btn-confirm-danger" },
      });
      return;
    }

    const count = selectedIds.size;
    const confirm = await Swal.fire({
      title: `¿Asignar ${count} permiso${count > 1 ? "s" : ""}?`,
      html: `Se asignarán <strong>${count}</strong> permiso${count > 1 ? "s" : ""} al rol <strong>${getRolePrimaryLabel(role)}</strong>.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, asignar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#0f172a",
      cancelButtonColor: "#64748b",
    });

    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);

      const ids = Array.from(selectedIds);
      const results = await Promise.allSettled(
        ids.map((permissionId) =>
          assignmentService.assignPermissionToRole(role.id || role.roleId, permissionId)
        )
      );

      let successCount = 0;
      let duplicateCount = 0;
      let errorCount = 0;

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          if (result.value?.alreadyExists) {
            duplicateCount++;
          } else {
            successCount++;
          }
        } else {
          errorCount++;
        }
      });

      if (duplicateCount > 0) {
        Swal.fire({
          title: "¡Atención!",
          html: `<p>${duplicateCount} permiso(s) ya estaban asignados</p><p>${successCount} asignados correctamente</p>`,
          icon: "warning",
          customClass: { confirmButton: "btn-confirm-primary" },
        });
      } else if (errorCount > 0) {
        Swal.fire({
          title: "Resultado parcial",
          html: `<p>Asignados: <strong>${successCount}</strong></p><p>Fallidos: <strong>${errorCount}</strong></p>`,
          icon: "warning",
          customClass: { confirmButton: "btn-confirm-danger" },
        });
      } else {
        Swal.fire({
          title: "¡Éxito!",
          text: `${successCount} permiso${successCount > 1 ? "s" : ""} asignado${successCount > 1 ? "s" : ""} correctamente`,
          icon: "success",
          timer: 2500,
          showConfirmButton: false,
        });
      }

      setSelectedIds(new Set());
      setSearchTerm("");
      onSuccess();
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.message || "No se pudieron asignar los permisos",
        icon: "error",
        customClass: { confirmButton: "btn-confirm-danger" },
      });
    } finally {
      setLoading(false);
    }
  };

  const getPermissionPrimaryLabel = (permission) => {
    const description = permission.description?.trim();
    const displayName = permission.displayName?.trim();
    return description || displayName || `${permission.action} · ${permission.resource}`;
  };

  const getPermissionSecondaryLabel = (permission) => {
    const hasDescription = permission.description?.trim() || permission.displayName?.trim();
    return hasDescription ? `${permission.action} · ${permission.resource}` : null;
  };

  const getRolePrimaryLabel = (role) => {
    const description = role?.description?.trim();
    return description || role?.name || "-";
  };

  const getRoleSecondaryLabel = (role) => {
    const description = role?.description?.trim();
    return description ? role?.name : null;
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setSearchTerm("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Asignar permisos</h2>
              <p className="text-sm font-medium text-slate-900 mt-0.5">
                {getRolePrimaryLabel(role)}
              </p>
              {getRoleSecondaryLabel(role) && (
                <p className="text-xs text-slate-500 mt-0.5">{getRoleSecondaryLabel(role)}</p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-5 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar permisos..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                disabled={filteredPermissions.length === 0}
                className="px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Todos
              </button>
              <button
                type="button"
                onClick={deselectAll}
                disabled={selectedIds.size === 0}
                className="px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ninguno
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-500">
              {availablePermissions.length} disponible
              {availablePermissions.length !== 1 ? "s" : ""} · {assignedPermissions.length} ya
              asignado{assignedPermissions.length !== 1 ? "s" : ""}
            </span>
            {selectedIds.size > 0 && (
              <span className="text-xs text-slate-600 font-medium">
                {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <div className="p-5 overflow-y-auto flex-1" style={{ maxHeight: "400px" }}>
          {availablePermissions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600 font-medium">Todos los permisos asignados</p>
              <p className="text-slate-400 text-sm mt-1">
                Este rol ya tiene todos los permisos del sistema
              </p>
            </div>
          ) : filteredPermissions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 font-medium">Sin resultados</p>
              <p className="text-slate-400 text-sm mt-1">
                No se encontraron permisos para &quot;{searchTerm}&quot;
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedPermissions).map(([moduleName, modulePerms]) => (
                <div key={moduleName}>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {moduleName}
                    </h4>
                    <span className="text-xs text-slate-400">({modulePerms.length})</span>
                  </div>
                  <div className="space-y-1">
                    {modulePerms.map((permission) => {
                      const isSelected = selectedIds.has(permission.id);
                      return (
                        <label
                          key={permission.id}
                          className={`flex items-start gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors border ${
                            isSelected
                              ? "bg-slate-100 border-slate-300"
                              : "bg-white border-slate-100 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePermission(permission.id)}
                            className="mt-0.5 h-4 w-4 text-slate-900 rounded border-slate-300 focus:ring-slate-400 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900">
                              {getPermissionPrimaryLabel(permission)}
                            </div>
                            {getPermissionSecondaryLabel(permission) && (
                              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                {getPermissionSecondaryLabel(permission)}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-200 flex-shrink-0 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || selectedIds.size === 0}
          >
            {loading ? "Asignando..." : `Asignar${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
