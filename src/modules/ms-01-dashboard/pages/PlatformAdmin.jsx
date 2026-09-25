import React, { useState, useEffect } from 'react';
import { useAuth } from '../../ms-02-authentication/hooks/useAuth';
import { getMunicipalidades } from '../../ms-01-tenant-management/services/municipalidadService';
import userService from '../../ms-02-authentication/services/userService';
import roleService from '../../ms-02-authentication/services/roleService';
import permissionService from '../../ms-02-authentication/services/permissionService';

export default function PlatformAdmin() {
  const { user } = useAuth();
  const [municipalities, setMunicipalities] = useState([]);
  const [users, setUsers] = useState([]);
  const [rolesCount, setRolesCount] = useState(0);
  const [permissionsCount, setPermissionsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [muniRes, userRes, rolesRes, permissionsRes] = await Promise.all([
          getMunicipalidades(),
          userService.getAllUsers(),
          roleService.getAllRoles(),
          permissionService.getAllPermissions()
        ]);
        
        setMunicipalities(muniRes.data || []);
        setUsers(userRes || []);
        setRolesCount(Array.isArray(rolesRes) ? rolesRes.length : 0);
        setPermissionsCount(Array.isArray(permissionsRes) ? permissionsRes.length : 0);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const globalStats = [
    { label: 'Municipalidades', value: municipalities.length.toString(), trend: 'Tenants', color: 'indigo' },
    { label: 'Usuarios', value: users.length.toString(), trend: 'Cuentas', color: 'sky' },
    { label: 'Roles', value: rolesCount.toString(), trend: 'Perfiles', color: 'emerald' },
    { label: 'Permisos', value: permissionsCount.toString(), trend: 'Accesos', color: 'rose' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Panel de Administración Global</h1>
          <p className="text-slate-400 mt-1 font-medium">Control centralizado de la infraestructura SIPREB.</p>
        </div>
        <div className="flex gap-3 relative z-10">
          <button className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-2xl backdrop-blur-md border border-white/10 transition-all">
            Logs del Sistema
          </button>
          <button className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all">
            Configurar Global
          </button>
        </div>
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {globalStats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-black text-slate-800">{stat.value}</h3>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg bg-${stat.color}-50 text-${stat.color}-600`}>
                {stat.trend}
              </span>
            </div>
            <div className="mt-4 w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
              <div className={`bg-${stat.color}-500 h-full w-2/3 rounded-full`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tenant Monitoring */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">Monitoreo de Tenants</h3>
            <button className="text-sm font-bold text-indigo-600">Gestionar Municipalidades</button>
          </div>
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Cargando municipalidades...</div>
            ) : municipalities.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No hay municipalidades registradas.</div>
            ) : municipalities.slice(0, 5).map((tenant, i) => (
              <div key={tenant.id || i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 overflow-hidden">
                    {tenant.logoUrl ? (
                      <img src={tenant.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      tenant.nombre?.substring(0, 1).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{tenant.nombre}</p>
                    <p className="text-xs text-slate-400">{tenant.ruc} • {tenant.tipo}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    tenant.activo ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {tenant.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <p className="text-xs font-bold text-slate-500 mt-1">{tenant.distrito}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Monitoring */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">Usuarios del Sistema</h3>
            <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Cargando usuarios...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No hay usuarios registrados.</div>
            ) : users.slice(0, 5).map((u, i) => (
              <div key={u.id || i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600">
                    {u.username?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{u.username}</p>
                    <div className="flex gap-1 mt-0.5">
                      {u.roles?.map(role => (
                        <span key={role} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {u.status}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Tenant: {u.municipalCode || 'Global'}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-slate-50">
            <button className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-2xl text-sm transition-all border border-slate-100">
              Ver Todos los Usuarios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
