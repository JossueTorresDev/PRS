import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import userService from "../../services/userService";

export default function UserActionsMenu({ user, onSuccess }) {
    const [isOpen, setIsOpen] = useState(false);
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [actionType, setActionType] = useState(null);
    const [reason, setReason] = useState("");
    const [dateValue, setDateValue] = useState(""); // Para blockedUntil o suspensionEnd
    const [durationHours, setDurationHours] = useState(""); // Para bloqueo por horas
    const [isIndefinite, setIsIndefinite] = useState(false); // Para suspensión indefinida
    const [blockMode, setBlockMode] = useState("hours"); // 'hours' | 'date'

    const menuRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const resetForm = () => {
        setReason("");
        setDateValue("");
        setDurationHours("");
        setIsIndefinite(false);
        setBlockMode("hours");
        setActionType(null);
        setShowReasonModal(false);
    };

    const handleSuspend = () => {
        setActionType("suspend");
        setIsIndefinite(false); // Por defecto temporal
        setShowReasonModal(true);
        setIsOpen(false);
    };

    const handleUnsuspend = () => {
        setActionType("unsuspend");
        setShowReasonModal(true);
        setIsOpen(false);
    };

    const handleBlock = () => {
        setActionType("block");
        setBlockMode("hours"); // Por defecto horas (24h)
        setDurationHours("24");
        setShowReasonModal(true);
        setIsOpen(false);
    };

    const handleUnblock = () => {
        setActionType("unblock");
        setShowReasonModal(true);
        setIsOpen(false);
    };

    const executeAction = async () => {
        if (!reason.trim() && (actionType === "suspend" || actionType === "block")) {
            Swal.fire({
                title: "Motivo Requerido",
                text: "Debe proporcionar un motivo para esta acción",
                icon: "warning",
                customClass: { confirmButton: 'btn-confirm-danger' },
            });
            return;
        }
        if (actionType === "block") {
            if (blockMode === "date" && !dateValue) {
                Swal.fire({
                    title: "Fecha Requerida",
                    text: "Debe especificar hasta cuándo estará bloqueado el usuario",
                    icon: "warning",
                    customClass: { confirmButton: 'btn-confirm-danger' },
                });
                return;
            }
            if (blockMode === "hours" && (!durationHours || parseInt(durationHours) <= 0)) {
                Swal.fire({
                    title: "Duración Requerida",
                    text: "Debe especificar una duración válida en horas",
                    icon: "warning",
                    customClass: { confirmButton: 'btn-confirm-danger' },
                });
                return;
            }
        }
        if (actionType === "suspend" && !isIndefinite && !dateValue) {
            Swal.fire({
                title: "Fecha Requerida",
                text: "Debe especificar la fecha de fin de suspensión o marcarla como indefinida",
                icon: "warning",
                customClass: { confirmButton: 'btn-confirm-danger' },
            });
            return;
        }

        try {
            let successMessage = "";

            switch (actionType) {
                case "suspend":
                    await userService.suspendUser(user.id, reason, isIndefinite ? null : dateValue);
                    successMessage = isIndefinite
                        ? "Usuario suspendido indefinidamente"
                        : "Usuario suspendido temporalmente";
                    break;
                case "unsuspend":
                    await userService.unsuspendUser(user.id);
                    successMessage = "Suspensión levantada correctamente";
                    break;
                case "block": {
                    const options = {};
                    if (blockMode === "date") {
                        options.blockedUntil = dateValue;
                    } else {
                        options.durationHours = parseInt(durationHours);
                    }
                    await userService.blockUser(user.id, reason, options);
                    successMessage = "Usuario bloqueado correctamente";
                    break;
                }
                case "unblock":
                    await userService.unblockUser(user.id);
                    successMessage = "Usuario desbloqueado correctamente";
                    break;
                default:
                    throw new Error("Acción no válida");
            }

            await Swal.fire({
                title: "¡Éxito!",
                text: successMessage,
                icon: "success",
                timer: 2000,
                showConfirmButton: false,
            });

            resetForm();
            setTimeout(() => {
                onSuccess();
            }, 500);
        } catch (error) {
            Swal.fire({
                title: "Error",
                text: error.message || "No se pudo completar la acción",
                icon: "error",
                customClass: { confirmButton: 'btn-confirm-danger' },
            });
        }
    };

    const getActionTitle = () => {
        switch (actionType) {
            case "suspend": return "Suspender Usuario";
            case "unsuspend": return "Levantar Suspensión";
            case "block": return "Bloquear Usuario";
            case "unblock": return "Desbloquear Usuario";
            default: return "";
        }
    };

    const getActionDescription = () => {
        switch (actionType) {
            case "suspend":
                return "El usuario no podrá acceder al sistema. Puede definir una fecha de reactivación automática o hacerlo indefinido.";
            case "unsuspend":
                return "El usuario podrá volver a acceder al sistema inmediatamente.";
            case "block":
                return "Bloqueo temporal por seguridad. El usuario no podrá hacer login durante el tiempo establecido.";
            case "unblock":
                return "El usuario será desbloqueado y podrá acceder nuevamente al sistema.";
            default:
                return "";
        }
    };

    const getActionIcon = () => {
        switch (actionType) {
            case "suspend":
                return (
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                );
            case "unsuspend":
                return (
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case "block":
                return (
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                );
            case "unblock":
                return (
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2.5 text-slate-600 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200 border border-slate-200 hover:border-slate-700 hover:shadow-md"
                    title="Más acciones"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </button>

                {isOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                        <div className="py-1">
                            {}
                            {user.status !== "SUSPENDED" ? (
                                <button
                                    onClick={handleSuspend}
                                    className="w-full px-4 py-3 text-left text-sm hover:bg-orange-50 transition-colors flex items-center gap-3 border-l-4 border-transparent hover:border-orange-500"
                                >
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-orange-700">Suspender</div>
                                        <div className="text-xs text-orange-600">Bloqueo administrativo</div>
                                    </div>
                                </button>
                            ) : (
                                <button
                                    onClick={handleUnsuspend}
                                    className="w-full px-4 py-3 text-left text-sm hover:bg-green-50 transition-colors flex items-center gap-3 border-l-4 border-transparent hover:border-green-500"
                                >
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-green-700">Levantar Suspensión</div>
                                        <div className="text-xs text-green-600">Reactivar acceso</div>
                                    </div>
                                </button>
                            )}

                            {}
                            {user.status !== "BLOCKED" ? (
                                <button
                                    onClick={handleBlock}
                                    className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 transition-colors flex items-center gap-3 border-l-4 border-transparent hover:border-red-500"
                                >
                                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-red-700">Bloquear</div>
                                        <div className="text-xs text-red-600">Bloqueo temporal</div>
                                    </div>
                                </button>
                            ) : (
                                <button
                                    onClick={handleUnblock}
                                    className="w-full px-4 py-3 text-left text-sm hover:bg-cyan-50 transition-colors flex items-center gap-3 border-l-4 border-transparent hover:border-cyan-500"
                                >
                                    <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-cyan-700">Desbloquear</div>
                                        <div className="text-xs text-cyan-600">Restaurar acceso</div>
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {}
            {showReasonModal && (
                <div className="fixed inset-0 bg-gray-900/75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-gray-100 animate-fadeInScale">
                        {}
                        <div className={`text-white px-6 py-5 rounded-t-3xl relative ${actionType === "suspend"
                            ? "bg-orange-600"
                            : actionType === "unsuspend"
                                ? "bg-green-600"
                                : actionType === "block"
                                    ? "bg-red-600"
                                    : "bg-cyan-600"
                            }`}>
                            <button
                                onClick={resetForm}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-all duration-200"
                                title="Cerrar"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <div className="flex items-center gap-3 pr-8">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner bg-white/20 backdrop-blur-sm`}>
                                    {getActionIcon()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold tracking-tight">{getActionTitle()}</h3>
                                    <p className={`text-sm mt-0.5 ${actionType === "suspend"
                                        ? "text-orange-100"
                                        : actionType === "unsuspend"
                                            ? "text-green-100"
                                            : actionType === "block"
                                                ? "text-red-100"
                                                : "text-cyan-100"
                                        }`}>Usuario: {user.username}</p>
                                </div>
                            </div>
                        </div>

                        {}
                        <div className="p-6 space-y-5 bg-white">
                            <p className="text-slate-600 text-sm leading-relaxed">{getActionDescription()}</p>

                            {}
                            {actionType === "suspend" && (
                                <div className="bg-white rounded-2xl p-5 border-l-4 border-l-orange-500 border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <input
                                            type="checkbox"
                                            id="indefiniteCheck"
                                            checked={isIndefinite}
                                            onChange={(e) => setIsIndefinite(e.target.checked)}
                                            className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                        />
                                        <label htmlFor="indefiniteCheck" className="text-sm font-semibold text-slate-900">
                                            Suspensión Indefinida
                                        </label>
                                    </div>

                                    {!isIndefinite && (
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                                                Suspender hasta
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={dateValue}
                                                onChange={(e) => setDateValue(e.target.value)}
                                                min={new Date().toISOString().slice(0, 16)}
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {}
                            {actionType === "block" && (
                                <div className="bg-white rounded-2xl p-5 border-l-4 border-l-red-500 border border-gray-100 shadow-sm">
                                    <div className="flex gap-4 mb-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="blockMode"
                                                value="hours"
                                                checked={blockMode === "hours"}
                                                onChange={() => setBlockMode("hours")}
                                                className="text-red-600 focus:ring-red-500"
                                            />
                                            <span className="text-sm font-semibold text-slate-900">Por Horas</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="blockMode"
                                                value="date"
                                                checked={blockMode === "date"}
                                                onChange={() => setBlockMode("date")}
                                                className="text-red-600 focus:ring-red-500"
                                            />
                                            <span className="text-sm font-semibold text-slate-900">Hasta Fecha</span>
                                        </label>
                                    </div>

                                    {blockMode === "hours" ? (
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                                                Duración (Horas)
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={durationHours}
                                                onChange={(e) => setDurationHours(e.target.value)}
                                                placeholder="Ej: 24"
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-red-500/20 transition-all text-sm"
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                                                Bloquear hasta
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={dateValue}
                                                onChange={(e) => setDateValue(e.target.value)}
                                                min={new Date().toISOString().slice(0, 16)}
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-red-500/20 transition-all text-sm"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {}
                            {(actionType === "suspend" || actionType === "block") && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                                        Motivo <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Describa el motivo de esta acción..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm resize-none"
                                    />
                                </div>
                            )}
                        </div>

                        {}
                        <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 rounded-b-3xl flex gap-4">
                            <button
                                onClick={resetForm}
                                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancelar
                            </button>
                            <button
                                onClick={executeAction}
                                className={`flex-1 px-6 py-3 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${actionType === "suspend"
                                    ? "bg-orange-600 hover:bg-orange-700 shadow-orange-600/20"
                                    : actionType === "unsuspend"
                                        ? "bg-green-600 hover:bg-green-700 shadow-green-600/20"
                                        : actionType === "block"
                                            ? "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                                            : "bg-cyan-600 hover:bg-cyan-700 shadow-cyan-600/20"
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

