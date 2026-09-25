import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../modules/ms-02-authentication/hooks/useAuth.jsx";
import { useSidebarConfig } from "./components/sidebarConfig.js";
import { getMunicipalidadById } from "../modules/ms-01-tenant-management/services/municipalidadService";
import { getMunicipalityId } from "../shared/utils/municipalityHelper.js";
import { useNotifications } from "../modules/ms-09-notificaciones/hooks/useNotifications.js";
import LoadingScreen from "../shared/utils/LoadingScreen.jsx";
import UserProfileModal from "../modules/ms-02-authentication/components/usuarios/UserProfileModal.jsx";

export default function SidebarLayout({ children }) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const userMenuBtnRef = useRef(null);

  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifPanelRef = useRef(null);
  const [profileModal, setProfileModal] = useState({ isOpen: false, type: "profile" });
  const [expandedSections, setExpandedSections] = useState(() => {
    const saved = localStorage.getItem('sidebarExpanded');
    return saved ? JSON.parse(saved) : [];
  });
  const [muniName, setMuniName] = useState("");
  const [muniLogo, setMuniLogo] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, connected } = useNotifications();

  // Cerrar paneles al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target)) {
        setShowNotifPanel(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target) &&
          userMenuBtnRef.current && !userMenuBtnRef.current.contains(e.target)) {
        setShowUserMenu(false);
        setShowProfileSubmenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const fetchMuniName = async () => {
      // Usar el ID del token JWT, no el user.municipalCode
      const municipalCodeFromToken = getMunicipalityId();
      const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');
      
      const setMuniData = (muni) => {
        if (isSuperAdmin) {
          setMuniName("Plataforma Administrativa");
          setMuniLogo(""); // O un logo global de SIPREB si existe
          return;
        }
        setMuniName(muni.nombre || "Municipalidad");
        sessionStorage.setItem('muniName', muni.nombre || '');
        sessionStorage.setItem('muniRuc', muni.ruc || '');
        sessionStorage.setItem('muniDireccion', muni.direccion || '');
        sessionStorage.setItem('muniEmail', muni.email || '');
        const url = muni.logoUrl || '';
        if (url) {
          setMuniLogo(url);
          sessionStorage.setItem('muniLogo', url);
        }
      };

      if (isSuperAdmin) {
        setMuniName("Plataforma Administrativa");
        setMuniLogo(""); 
        return;
      }

      if (municipalCodeFromToken) {
        try {
          const muni = await getMunicipalidadById(municipalCodeFromToken);
          setMuniData(muni);
        } catch {
          if (user?.municipalCode && user?.municipalCode !== municipalCodeFromToken) {
            try {
              const muni = await getMunicipalidadById(user.municipalCode);
              setMuniData(muni);
            } catch {
              setMuniName("Municipalidad");
            }
          } else {
            setMuniName("Municipalidad");
          }
        }
      } else if (user?.municipalCode) {
        try {
          const muni = await getMunicipalidadById(user.municipalCode);
          setMuniData(muni);
        } catch {
          setMuniName("Municipalidad");
        }
      }
    };
    fetchMuniName();
  }, [user?.municipalCode, user]); // Agregar user como dependencia para detectar cambios en el token

  const navItems = useSidebarConfig();

  const toggleSection = (key) => {
    const newExpanded = expandedSections.includes(key)
      ? expandedSections.filter(k => k !== key)
      : [...expandedSections, key];
    setExpandedSections(newExpanded);
    localStorage.setItem('sidebarExpanded', JSON.stringify(newExpanded));
  };

  const renderIcon = (iconName, size = "16", strokeColor = "white") => {
    const icons = {
      chart: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="M18 17V9M13 17v-6M8 17v-3" />
        </svg>
      ),
      box: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
      swap: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      ),
      users: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      calculator: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="16" y1="14" x2="16" y2="14" />
          <line x1="8" y1="14" x2="8" y2="14" />
          <line x1="12" y1="14" x2="12" y2="14" />
          <line x1="16" y1="18" x2="16" y2="18" />
          <line x1="8" y1="18" x2="8" y2="18" />
          <line x1="12" y1="18" x2="12" y2="18" />
        </svg>
      ),
      report: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      cog: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2" />
        </svg>
      ),
      // Iconos para submenús
      package: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
      tag: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      ),
      truck: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
      "map-pin": (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
      "arrow-right": (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      ),
      "file-text": (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      clipboard: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>
      ),
      tool: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      ),
      user: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      "user-check": (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <polyline points="17 11 19 13 23 9" />
        </svg>
      ),
      building: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
        </svg>
      ),
      briefcase: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
      "trending-down": (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
          <polyline points="17 18 23 18 23 12" />
        </svg>
      ),
      trash: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      ),
      "dollar-sign": (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      "bar-chart": (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="20" x2="12" y2="10" />
          <line x1="18" y1="20" x2="18" y2="4" />
          <line x1="6" y1="20" x2="6" y2="16" />
        </svg>
      ),
      shield: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      bell: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
      settings: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2" />
        </svg>
      ),
      lock: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      list: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      ),
      "shield-check": (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      ),
      "building-2": (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M9 8h1" />
          <path d="M9 12h1" />
          <path d="M9 16h1" />
          <path d="M14 8h1" />
          <path d="M14 12h1" />
          <path d="M14 16h1" />
          <path d="M6 3v18" />
          <path d="M18 3v18" />
          <path d="M6 3h12" />
        </svg>
      ),
      "credit-card": (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      ),
      receipt: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
          <path d="M12 17V7" />
        </svg>
      ),
      "user-plus": (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      ),
      "git-branch": (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="6" y1="3" x2="6" y2="15" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
      )
    };
    return icons[iconName] || icons.box;
  };

  // Encabezados de sección estilo iOS - Ocultos para mantener items juntos
  const renderSectionHeader = () => {
    // Retornar null para todos los headers, manteniendo items juntos
    return null;
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      // Cerrar sesión directamente sin mostrar modal
      window.location.href = `${import.meta.env.BASE_URL}login`;
    } catch {
      setIsLoggingOut(false);
      Swal.fire({
        title: "Error",
        text: "No se pudo cerrar la sesión",
        icon: "error",
        confirmButtonColor: "#dc2626"
      });
    }
  };

  // Pantalla de carga durante logout
  if (isLoggingOut) {
    return <LoadingScreen isLoading={true} message="Cerrando sesión..." />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - FIXED - Estilo iOS */}
      <aside
        className={`${isCollapsed ? "w-20" : "w-72"
          } text-slate-100 flex flex-col fixed left-0 top-0 h-screen transition-all duration-300 z-40 overflow-hidden`}
      >
        {/* Fondo con Degradado Azul Océano oscuro a Negro (por solicitud) */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, #1d334a, #1a2b3e, #172432, #141d27, #10161d, #090d12, #000000)'
          }}
        >
        </div>
        {/* Header con logo */}
        <div className="flex flex-col items-center pt-5 pb-3 px-3 flex-shrink-0 relative z-10">
          {!isCollapsed ? (
            <>
              <div className="flex items-center justify-between w-full mb-3">
                <div className="w-6" />
                <div className="relative">
                  <div className="w-16 h-16 rounded-xl bg-transparent flex items-center justify-center overflow-hidden shadow-none ring-0">
                    <img
                      src={muniLogo || "https://i.imgur.com/Rouy0lF.png"}
                      alt="SIPREB"
                      className="w-14 h-14 object-contain"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-all flex items-center justify-center opacity-60 hover:opacity-100"
                  title="Colapsar sidebar"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              </div>
              {muniName && (
                <div className="text-center max-w-full px-1">
                  <p className="text-[11px] font-semibold text-white/90 truncate">
                    {muniName}
                  </p>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-10 h-10 rounded-xl bg-white/0 flex items-center justify-center shadow-none transition-all hover:scale-105 ring-1 ring-white/10"
              title="Expandir sidebar"
            >
              <img
                src={muniLogo || "https://i.imgur.com/Rouy0lF.png"}
                alt="SIPREB"
                className="w-6 h-6 object-contain"
              />
            </button>
          )}
        </div>

        <nav className="px-3 py-3 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <React.Fragment key={item.key}>
                {renderSectionHeader(item.key)}
                <li>
                  {/* Item sin hijos (Dashboard) - Estilo iOS */}
                  {!item.children ? (
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `relative group w-full flex items-center gap-3 px-3 py-2 transition-all duration-200 [&>*]:!text-white ${isActive
                          ? "text-white bg-white/10 backdrop-blur-xl rounded-xl shadow-lg neon-active-item neon-glow"
                          : "text-white hover:bg-white/5 rounded-xl"
                        }`
                      }
                      style={{ color: 'white' }}
                    >
                      {({ isActive }) => (
                        <>
                          <span className={`inline-flex items-center justify-center flex-shrink-0 w-9 h-9 rounded-lg transition-all ${isActive
                            ? "bg-blue-500/20 text-white"
                            : "bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white"
                            }`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="7" height="7" rx="1" />
                              <rect x="14" y="3" width="7" height="7" rx="1" />
                              <rect x="14" y="14" width="7" height="7" rx="1" />
                              <rect x="3" y="14" width="7" height="7" rx="1" />
                            </svg>
                          </span>
                          {!isCollapsed && (
                            <span className="text-[15px] font-medium tracking-tight">
                              {item.label}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  ) : (
                    /* Item con hijos (secciones colapsables) - Estilo iOS */
                    <div>
                      <button
                        onClick={() => toggleSection(item.key)}
                        className={`relative group w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                          item.children?.some(child => location.pathname === child.path) 
                            ? "text-white bg-white/10 backdrop-blur-xl shadow-lg neon-active-item neon-glow" 
                            : expandedSections.includes(item.key)
                              ? "text-white bg-white/5"
                              : "text-slate-300 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <span className={`inline-flex items-center justify-center flex-shrink-0 w-9 h-9 rounded-lg transition-all ${expandedSections.includes(item.key)
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white"
                          }`}>
                          {renderIcon(item.icon, "20", "currentColor")}
                        </span>
                        {!isCollapsed && (
                          <>
                            <span className="text-[15px] font-medium flex-1 text-left tracking-tight">{item.label}</span>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`transition-transform duration-200 text-slate-400 ${expandedSections.includes(item.key) ? 'rotate-180' : ''
                                }`}
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </>
                        )}
                      </button>

                      {/* Submenú - Estilo iOS */}
                      {!isCollapsed && expandedSections.includes(item.key) && (
                        <ul className="ml-3 mt-0.5 space-y-0.5 pl-9 relative z-20">
                          {item.children.map((child) => (
                            <li key={child.key}>
                              <NavLink
                                to={child.path}
                                className={({ isActive }) =>
                                  `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 relative z-20 ${!child.implemented ? "opacity-50 cursor-not-allowed" : ""
                                  } ${isActive
                                    ? "text-white font-medium bg-white/10 neon-active-item neon-glow"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                                  }`
                                }
                                onClick={(e) => {
                                  if (!child.implemented) {
                                    e.preventDefault();
                                  }
                                }}
                              >
                                {({ isActive }) => (
                                  <>
                                    <span className={`w-1.5 h-1.5 rounded-full transition-all ${isActive ? "bg-blue-400" : "bg-slate-600"
                                      }`}></span>
                                    <span className="flex-1 tracking-tight">{child.label}</span>
                                    {child.badge && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium">
                                        {child.badge}
                                      </span>
                                    )}
                                  </>
                                )}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              </React.Fragment>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="px-4 py-5 text-slate-200 text-xs flex-shrink-0 relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-400 font-bold text-[10px] tracking-widest uppercase">Sistema</div>
                <div className="text-blue-500/80 font-black text-[12px] mt-0.5">V 2.0.0</div>
              </div>
              <div className="text-right">
                <div className="text-slate-400 text-[10px] font-bold tracking-tight">SIPREB <span className="text-blue-500">2026</span></div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main content  */}
      <div
        className={`flex-1 flex flex-col bg-slate-50 min-h-screen transition-all duration-300 ${isCollapsed ? "ml-20" : "ml-72"
          }`}
      >
        <UserProfileModal 
          isOpen={profileModal.isOpen} 
          onClose={() => setProfileModal({ ...profileModal, isOpen: false })} 
          type={profileModal.type} 
        />
        {/* Top Navbar - FIXED  */}
        <header
          className="h-16 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 border-b border-slate-300 shadow-sm fixed top-0 right-0 z-30 transition-all duration-300"
          style={{ left: isCollapsed ? "5rem" : "18rem" }}
        >
          {/* Logo + título  */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-indigo-600">
              <span className="text-white font-bold text-base tracking-tight">SL</span>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide text-slate-800" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                SIPREB
              </h1>
              <p className="text-xs font-medium text-slate-500" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Plataforma Administrativa
              </p>
            </div>
          </div>

          {/* Usuario y Notificaciones  */}
          <div className="flex items-center gap-4">
            {/* Notificaciones */}
              <div className="relative" ref={notifPanelRef}>
              <button
                className="relative w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all"
                title="Notificaciones"
                onClick={() => setShowNotifPanel(prev => !prev)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {!connected && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full" title="Reconectando..." />
                )}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Panel de notificaciones */}
              {showNotifPanel && (
                <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-800">Notificaciones</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs text-indigo-600 hover:underline">
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-400">
                        No tienes notificaciones nuevas
                      </div>
                    ) : (
                      notifications.map(n => {
                        const notifColors = {
                          SUCCESS: 'bg-green-100 text-green-600',
                          WARNING: 'bg-yellow-100 text-yellow-600',
                          ERROR: 'bg-red-100 text-red-600',
                          INFO: 'bg-indigo-100 text-indigo-600',
                        };
                        const colorClass = notifColors[n.type] || notifColors.INFO;
                        return (
                        <div
                          key={n.id}
                          className={"px-4 py-3 border-b border-gray-50 hover:bg-gray-50 flex items-start gap-3" + (n.referenceType === 'maintenance' ? ' cursor-pointer' : '')}
                          onClick={() => {
                            if (n.referenceType === 'maintenance' && n.referenceId) {
                              navigate(`/app/mantenimiento?id=${n.referenceId}`);
                              setShowNotifPanel(false);
                            }
                            if (!n.read) markAsRead(n.id);
                          }}
                        >
                          <div className={"w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 " + colorClass}>
                            {n.type === 'SUCCESS' ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : n.type === 'WARNING' ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                              </svg>
                            ) : n.type === 'ERROR' ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                              </svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            {n.title && (
                              <p className="text-xs font-semibold text-gray-700 leading-snug">{n.title}</p>
                            )}
                            <p className={"text-xs leading-snug " + (n.read ? 'text-gray-500' : 'text-gray-800 font-medium')}>{n.message}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] text-gray-400">
                                {new Date(n.createdAt || n.created_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                              </p>
                              {n.referenceType === 'maintenance' && (
                                <span className="text-[10px] text-indigo-400 font-medium">Ver orden</span>
                              )}
                            </div>
                          </div>
                          {!n.read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                              className="text-gray-300 hover:text-gray-500 flex-shrink-0 mt-0.5"
                              title="Marcar como leída"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          )}
                        </div>
                      );})
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Estado de conexión de notificaciones */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100" title={connected ? 'Notificaciones en tiempo real' : 'Reconectando...'}>
              <span className={"w-2 h-2 rounded-full " + (connected ? 'bg-green-500 animate-pulse' : 'bg-yellow-400')}></span>
              <span className="text-slate-600 text-xs font-medium">{connected ? 'En línea' : 'Conectando...'}</span>
            </div>

            {/* Separador */}
            <div className="w-px h-8 bg-slate-200"></div>

            {/* Avatar con menú desplegable */}
              <div className="relative">
                <button
                  ref={userMenuBtnRef}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-semibold hover:shadow-lg transition-all cursor-pointer"
                >
                  {(user?.nombre || user?.username || user?.email || "U").charAt(0).toUpperCase()}
                </button>

                {/* Menú desplegable */}
                {showUserMenu && (
                  <div ref={userMenuRef} className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                      {/* Header del menú */}
                      <div className="px-4 py-3 border-b border-slate-200">
                        <p className="text-sm font-semibold text-slate-900">
                          {user?.nombre || user?.username || "Usuario"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {user?.email || user?.username || "usuario@sipreb.com"}
                        </p>
                        {user?.municipalCode && (
                          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                            ENTIDAD: <span className="font-semibold text-indigo-600">{muniName || 'Cargando...'}</span>
                          </p>
                        )}
                      </div>

                      {/* Opciones del menú */}
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setProfileModal({ isOpen: true, type: "profile" });
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-3 group"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-slate-400 group-hover:text-indigo-600 transition-colors"
                          >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          <div className="flex flex-col">
                            <span className="font-medium">Editar Perfil</span>
                            <span className="text-[10px] text-slate-400">Datos personales y contacto</span>
                          </div>
                        </button>

                        <div className="border-t border-slate-200 my-2"></div>

                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            handleLogout();
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                )}
              </div>
          </div>
        </header>

        {/* Contenido principal - con padding-top para el header fijo */}
        <main className="flex-1 px-6 py-4 mt-16 overflow-ao">{children}</main>
      </div>
    </div>
  );
}
