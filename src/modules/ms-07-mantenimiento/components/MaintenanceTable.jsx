import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  TYPE_LABELS,
  TYPE_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  STATUS_TRANSITIONS,
} from "../constants/maintenance.constants";

function ActionsMenu({
  maintenance,
  onEdit,
  onStatusAction,
  onDownload,
  onDownloadConformityAct,
  allowedActions = [],
  canEdit = false,
}) {
  const [open, setOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const [openLeft, setOpenLeft] = useState(true);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
  });
  const menuRef = useRef(null);
  const menuPortalRef = useRef(null);
  const status = maintenance.maintenanceStatus;

  const transitions = useMemo(() => {
    return allowedActions.map((action) => {
      const defaultT = (STATUS_TRANSITIONS[status] || []).find(
        (d) => d.action === action,
      );
      return (
        defaultT || {
          action,
          label: action.charAt(0).toUpperCase() + action.slice(1),
          color: "#64748b",
        }
      );
    });
  }, [allowedActions, status]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedTrigger =
        menuRef.current && menuRef.current.contains(e.target);
      const clickedMenu =
        menuPortalRef.current && menuPortalRef.current.contains(e.target);
      if (!clickedTrigger && !clickedMenu) setOpen(false);
    };
    const handleScroll = () => setOpen(false);
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("wheel", handleScroll, { passive: true });
      if (menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect();
        const viewH = window.innerHeight;
        const menuW = 220;
        const estimatedH = Math.min(transitions.length * 44 + 120, 300);

        const openToLeft = rect.right >= menuW + 8;

        // Preferir abrir hacia arriba; solo abrir hacia abajo si no hay espacio arriba
        const enoughSpaceAbove = rect.top >= estimatedH + 16;
        const openUp = enoughSpaceAbove;

        let top = openUp
          ? rect.top - 8                // menu bottom alineado con button top
          : rect.bottom + 8;            // menu top alineado con button bottom

        // Clampear para mantener dentro del viewport
        top = Math.max(8, Math.min(top, viewH - estimatedH - 8));

        setOpenUpwards(openUp);
        setOpenLeft(openToLeft);
        setMenuPosition({
          top,
          left: openToLeft ? rect.right : rect.left,
        });
      }
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleScroll);
    };
  }, [open, transitions.length]);

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
        title="Acciones"
      >
        <svg
          className="w-5 h-5 text-gray-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            ref={menuPortalRef}
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
              transform: openLeft
                ? openUpwards
                  ? "translate(-100%, -100%)"
                  : "translate(-100%, 0)"
                : openUpwards
                  ? "translate(0, -100%)"
                  : "translate(0, 0)",
              minWidth: "220px",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              boxShadow:
                "0 10px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid #e5e7eb",
              zIndex: 99999,
              overflow: "hidden",
            }}
          >
            {canEdit && (
              <button
                onClick={() => {
                  onEdit(maintenance);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <svg
                  className="w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Editar
              </button>
            )}
            <div
              style={{
                height: "1px",
                backgroundColor: "#f1f5f9",
                margin: "4px 0",
              }}
            />
            <button
              onClick={() => {
                onDownload(maintenance);
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Descargar Ficha
            </button>
            {maintenance.maintenanceStatus === "CONFIRMED" && (
              <button
                onClick={() => {
                  onDownloadConformityAct(maintenance);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 transition-colors font-bold"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Acta SBN (Conformidad)
              </button>
            )}
            {transitions.length > 0 && (
              <div
                style={{
                  height: "1px",
                  backgroundColor: "#f1f5f9",
                  margin: "4px 0",
                }}
              />
            )}
            {transitions.map((t) => (
              <button
                key={t.action}
                onClick={() => {
                  onStatusAction(maintenance, t.action);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors"
                style={{ color: t.color }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: t.color,
                    flexShrink: 0,
                  }}
                />
                {t.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || {
    bg: "#f1f5f9",
    text: "#64748b",
    dot: "#94a3b8",
  };
  const label = STATUS_LABELS[status] || status;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: colors.dot }}
      />
      {label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const colors = PRIORITY_COLORS[priority] || {
    bg: "#f1f5f9",
    text: "#64748b",
  };
  const label = PRIORITY_LABELS[priority] || priority;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {label}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-8">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-6 py-4 border-b border-gray-100 last:border-0 animate-pulse"
        >
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-3 bg-gray-200 rounded w-48" />
          <div className="h-3 bg-gray-200 rounded w-20" />
          <div className="h-5 bg-gray-200 rounded w-16" />
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-6 bg-gray-200 rounded w-28" />
          <div className="h-8 bg-gray-200 rounded w-8 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export default function MaintenanceTable({
  maintenances = [],
  loading = false,
  getAssetName,
  getUserName,
  getPersonName,
  onView,
  onEdit,
  onStatusAction,
  onDownload,
  onDownloadConformityAct,
  canUpdate = false,
  canExecute = false,
  canConfirm = false,
  page = 0,
  setPage,
  size = 10,
  setSize,
  totalPages = 0,
}) {
  const formatDate = (date) => {
    if (!date) return "—";
    if (typeof date === "string" && date.length === 10) {
      const parts = date.split("-");
      if (parts.length !== 3) return date;
      const [, month, day] = parts;
      const months = [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic",
      ];
      return `${day} ${months[parseInt(month) - 1]}`;
    }
    return new Date(date).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
    });
  };

  if (loading) return <TableSkeleton />;

  if (maintenances.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-700 mb-2">
          Bandeja de Entrada Vacía
        </h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
          No hay órdenes de mantenimiento activas en este momento. Las nuevas
          solicitudes aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-blue-600">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                Identificador
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                Activo Crítico
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                Nivel
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                Ejecución
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                Técnico
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {maintenances.map((m) => (
              <tr
                key={m.id}
                className="cursor-pointer"
                onClick={() => onView(m)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onView(m); } }}
              >
                <td className="px-4 py-3">
                  <span className="text-sm font-semibold text-slate-900">
                    {m.maintenanceCode || "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span
                      className="text-sm font-medium text-slate-800 max-w-[180px] truncate"
                      title={getAssetName(m.assetId, m)}
                    >
                      {getAssetName(m.assetId, m)}
                    </span>
                    <span className="text-xs text-slate-500 mt-0.5">
                      Cod: {m.assetCode || "Pendiente"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {(() => {
                    const tc = TYPE_COLORS[m.maintenanceType] || {
                      bg: "#f1f5f9",
                      text: "#64748b",
                    };
                    return (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold"
                        style={{ backgroundColor: tc.bg, color: tc.text }}
                      >
                        {TYPE_LABELS[m.maintenanceType] || m.maintenanceType}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={m.priority} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-3.5 h-3.5 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-sm text-slate-600">
                      {formatDate(m.scheduledDate)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-sm text-slate-600 truncate max-w-[100px] block"
                    title={(getPersonName || getUserName)(
                      m.technicalResponsibleId,
                    )}
                  >
                    {(getPersonName || getUserName)(m.technicalResponsibleId)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={m.maintenanceStatus} />
                </td>
                <td
                  className="px-4 py-3 text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ActionsMenu
                    maintenance={m}
                    onEdit={onEdit}
                    onStatusAction={onStatusAction}
                    onDownload={onDownload}
                    onDownloadConformityAct={onDownloadConformityAct}
                    allowedActions={(
                      STATUS_TRANSITIONS[m.maintenanceStatus] || []
                    )
                      .map((t) => t.action)
                      .filter((action) => {
                        if (action === "confirm") return canConfirm;
                        if (action === "cancel" || action === "suspend" || action === "reschedule") return canExecute;
                        return canExecute;
                      })}
                    canEdit={
                      canUpdate &&
                      (m.maintenanceStatus === "SCHEDULED" ||
                        m.maintenanceStatus === "SUSPENDED")
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">
                {maintenances.length} registro
                {maintenances.length !== 1 ? "s" : ""}
              </span>
              <span className="text-slate-400">en esta página</span>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <label className="text-slate-600 font-medium">Mostrar:</label>
              <select
                value={size}
                onChange={(e) => {
                  setSize(Number(e.target.value));
                  setPage(0);
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-slate-900 font-medium text-sm bg-white"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className={`p-2 rounded-lg ${page === 0 ? "text-slate-300 cursor-not-allowed" : "text-slate-600"}`}
              title="Página anterior"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="flex items-center bg-white px-3 py-1.5 rounded-lg border border-gray-200">
              <span className="text-sm font-semibold text-slate-700">
                Página {page + 1}
              </span>
            </div>
            <button
              onClick={() => setPage(page + 1)}
              disabled={totalPages > 0 ? page + 1 >= totalPages : maintenances.length < size}
              className={`p-2 rounded-lg ${totalPages > 0 ? (page + 1 >= totalPages ? "text-slate-300 cursor-not-allowed" : "text-slate-600") : (maintenances.length < size ? "text-slate-300 cursor-not-allowed" : "text-slate-600")}`}
              title="Página siguiente"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
