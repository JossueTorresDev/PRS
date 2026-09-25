import { useEffect, useState } from "react";
import roleService from "../../services/roleService";

export default function UserDebugInfo() {
  const [userInfo, setUserInfo] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const info = await roleService.getCurrentUser();
        setUserInfo(info);
      } catch (error) {
      }
    };

    loadUserInfo();
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-all duration-200 z-50"
      >
        🔍 Debug Usuario
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-slate-300 rounded-lg shadow-xl p-4 max-w-md z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-slate-800">🔍 Debug - Usuario Actual</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-slate-500 hover:text-slate-700"
        >
          ✕
        </button>
      </div>

      {userInfo ? (
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-slate-700">👤 Usuario:</span>
            <span className="ml-2 text-slate-600">
              {userInfo.sub || userInfo.userId || "No identificado"}
            </span>
          </div>

          <div>
            <span className="font-medium text-slate-700">🎭 Roles:</span>
            <div className="ml-2 text-slate-600">
              {userInfo.roles || userInfo.authorities ? (
                <pre className="text-xs bg-slate-100 p-2 rounded mt-1 overflow-x-auto">
                  {JSON.stringify(
                    userInfo.roles || userInfo.authorities,
                    null,
                    2
                  )}
                </pre>
              ) : (
                <span className="text-red-500">Sin roles</span>
              )}
            </div>
          </div>

          <div>
            <span className="font-medium text-slate-700">
              🔐 ¿Es SUPER_ADMIN?:
            </span>
            <span
              className={`ml-2 font-bold ${
                roleService.isSuperAdmin(userInfo)
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {roleService.isSuperAdmin(userInfo) ? "✅ SÍ" : "❌ NO"}
            </span>
          </div>

          <div>
            <span className="font-medium text-slate-700">⏰ Expiración:</span>
            <span className="ml-2 text-slate-600">
              {userInfo.exp
                ? new Date(userInfo.exp * 1000).toLocaleString()
                : "No especificada"}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <span className="font-medium text-slate-700">
              📋 Token completo:
            </span>
            <pre className="text-xs bg-slate-100 p-2 rounded mt-1 overflow-x-auto max-h-32">
              {JSON.stringify(userInfo, null, 2)}
            </pre>
          </div>
        </div>
      ) : (
        <div className="text-red-500 text-sm">
          ❌ No se pudo cargar la información del usuario
        </div>
      )}

      <div className="mt-3 pt-2 border-t border-slate-200">
        <button
          onClick={async () => {
            const info = await roleService.getCurrentUser();
            setUserInfo(info);
          }}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          🔄 Recargar Info
        </button>
      </div>
    </div>
  );
}

