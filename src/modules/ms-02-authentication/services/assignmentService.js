import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env.js';

const API_BASE_URL = getEnv('VITE_GATEWAY_API_URL', '');

class AssignmentService {

  async getUserRoles(userId) {
    try {
      const { data } = await httpClient.get(`${API_BASE_URL}/assignments/users/${userId}/roles`);
      const rows = Array.isArray(data) ? data : (data.content && Array.isArray(data.content) ? data.content : []);
      return rows.map((r) => ({
        userId: r.userId || r.id,
        username: r.username,
        roleId: r.roleId,
        roleName: r.roleName,
        roleDescription: r.roleDescription || "",
        expirationDate: r.expirationDate ?? null,
        active: r.active ?? true,
        assignedAt: r.assignedAt ?? null,
      }));
    } catch (error) {
      const msg = error.message || "Error al obtener roles del usuario";
      throw new Error(
        error.status === 500
          ? `${msg} (error del servidor — contacte al administrador)`
          : msg
      );
    }
  }

  async assignRoleToUser(userId, roleId, expirationDate = null) {
    const url = `${API_BASE_URL}/assignments/users/${userId}/roles/${roleId}`;
    const body = { expirationDate: expirationDate || null, active: true };
    console.log('[assignRoleToUser] POST', url, body);
    try {
      const { data } = await httpClient.post(url, body);
      console.log('[assignRoleToUser] Respuesta:', data);
      return data || { success: true };
    } catch (error) {
      console.error('[assignRoleToUser] Error:', { status: error.status, message: error.message, data: error.data });
      if (error.status === 409) {
        return { success: true, alreadyExists: true };
      }
      const msg = (error.status === 500 && error.data?.message)
        ? error.data.message
        : error.message || "Error al asignar rol al usuario";
      throw new Error(msg);
    }
  }

  async removeRoleFromUser(userId, roleId) {
    try {
      const response = await httpClient.delete(
        `${API_BASE_URL}/assignments/users/${userId}/roles/${roleId}`
      );
      return response.data;
    } catch (error) {
      const msg = error.message || "Error al quitar rol del usuario";
      throw new Error(msg);
    }
  }

  async getRolePermissions(roleId) {
    try {
      const { data } = await httpClient.get(
        `${API_BASE_URL}/assignments/roles/${roleId}/permissions`
      );
      console.log('[getRolePermissions] data recibido:', JSON.stringify(data));
      const rows = Array.isArray(data) ? data : [];
      console.log('[getRolePermissions] rows mapeadas:', rows);
      const mapped = rows.map((r) => ({
        roleId: r.roleId,
        roleName: r.roleName,
        permissionId: r.permissionId || r.id || r.permission?.id,
        permissionName: r.permissionName || r.name || r.permission?.name || r.permission?.displayName,
        permissionModule: r.permissionModule || r.module || r.permission?.module,
        permissionAction: r.permissionAction || r.action || r.permission?.action,
        permissionResource: r.permissionResource || r.resource || r.permission?.resource,
        permissionDescription: r.permissionDescription || r.description || r.permission?.description,
      }));
      console.log('[getRolePermissions] resultado final:', mapped);
      return mapped;
    } catch (error) {
      console.error('[getRolePermissions] Error:', { status: error.status, message: error.message, data: error.data });
      const msg = error.message || "Error al obtener permisos del rol";
      throw new Error(
        error.status === 500
          ? `${msg} (error del servidor — contacte al administrador)`
          : msg
      );
    }
  }

  async assignPermissionToRole(roleId, permissionId) {
    const url = `${API_BASE_URL}/assignments/roles/${roleId}/permissions/${permissionId}`;
    console.log('[assignPermissionToRole] POST', url);
    try {
      const response = await httpClient.post(url);
      console.log('[assignPermissionToRole] Respuesta:', response.data);
      return response.data;
    } catch (error) {
      console.error('[assignPermissionToRole] Error:', { status: error.status, message: error.message, data: error.data });
      if (error.status === 409) {
        return { success: true, alreadyExists: true };
      }
      const msg = error.message || "Error al asignar permiso al rol";
      throw new Error(msg);
    }
  }

  async removePermissionFromRole(roleId, permissionId) {
    try {
      const response = await httpClient.delete(
        `${API_BASE_URL}/assignments/roles/${roleId}/permissions/${permissionId}`
      );
      return response.data;
    } catch (error) {
      const msg = error.message || "Error al quitar permiso del rol";
      throw new Error(msg);
    }
  }

  async restorePermissionToRole(roleId, permissionId) {
    try {
      const response = await httpClient.patch(
        `${API_BASE_URL}/assignments/roles/${roleId}/permissions/${permissionId}/restore`
      );
      return response.data;
    } catch (error) {
      const msg = error.message || "Error al restaurar permiso al rol";
      throw new Error(msg);
    }
  }

  async getUserEffectivePermissions(userId) {
    try {
      const { data } = await httpClient.get(
        `${API_BASE_URL}/assignments/users/${userId}/effective-permissions`
      );
      return data;
    } catch (error) {
      const msg = error.message || "Error al obtener permisos efectivos del usuario";
      throw new Error(msg);
    }
  }

}

const assignmentService = new AssignmentService();
export default assignmentService;
