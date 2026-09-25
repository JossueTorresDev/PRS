import React from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';

export default function UserInfo() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
      <div className="h-10 w-10 rounded-full bg-cyan-600 flex items-center justify-center">
        <span className="text-white font-semibold">
          {(user?.nombre || user?.email || 'U').charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {user?.nombre || 'Usuario'}
        </p>
        <p className="text-xs text-slate-400 truncate">
          {user?.email || 'usuario@sipreb.com'}
        </p>
        <p className="text-xs text-slate-500 truncate">
          {user?.rol || 'Administrador'}
        </p>
      </div>
    </div>
  );
}

