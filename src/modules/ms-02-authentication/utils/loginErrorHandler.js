import Swal from "sweetalert2";

export const parseLoginError = (error, username = "") => {
  const errorData = error.errorData || error.details || {};
  const message = (error.message || "").trim();
  if (error.isNetworkError || message.toLowerCase().includes("conexión") || message.toLowerCase().includes("conectar")) {
    return {
      type: "network_error",
      title: "Servidor no disponible",
      message: "No pudimos conectar con el servidor en este momento.",
      details: "Revisa tu conexión a internet y vuelve a intentarlo. Si el problema persiste, contacta al Departamento de TI.",
      icon: "network"
    };
  }
  if (errorData.blockedUntil || message.toLowerCase().includes("bloqueado")) {
    const blockedUntil = errorData.blockedUntil ? new Date(errorData.blockedUntil) : null;

    let timeDetails = "";
    if (blockedUntil) {
      const now = new Date();
      const diffMs = blockedUntil - now;
      if (diffMs > 0) {
        let diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        let diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        timeDetails = `Su acceso se habilitará en ${diffHours}h ${diffMinutes}m`;
      }
    }

    return {
      type: "blocked",
      title: "Cuenta bloqueada temporalmente",
      message: `El usuario <strong>${username}</strong> ha sido bloqueado por múltiples intentos fallidos.`,
      details: timeDetails,
      blockedUntil: blockedUntil ? blockedUntil.toLocaleString("es-ES", {
        year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
      }) : null,
      blockReason: "Protectión automática de seguridad",
      icon: "lock"
    };
  }
  if (errorData.status === "SUSPENDED" || errorData.suspendedUntil || message.toLowerCase().includes("suspendido")) {
    const suspensionEnd = errorData.suspendedUntil ? new Date(errorData.suspendedUntil) : null;

    return {
      type: "suspended",
      title: "Cuenta suspendida",
      message: `El usuario <strong>${username}</strong> se encuentra suspendido por resolución administrativa.`,
      details: errorData.suspensionReason || "Comunícate con el Departamento de TI para más información.",
      suspensionEnd: suspensionEnd ? suspensionEnd.toLocaleString("es-ES", {
        year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
      }) : null,
      icon: "suspended"
    };
  }
  if (message.toLowerCase().includes("roles") || message.toLowerCase().includes("permisos")) {
    return {
      type: "no_roles",
      title: "Sin permisos de acceso",
      message: "Tu usuario fue validado correctamente, pero no tienes permisos asignados para ingresar a esta plataforma.",
      details: "Solicita los permisos necesarios a tu administrador de sistema.",
      icon: "forbidden"
    };
  }
  if (errorData.status === "INACTIVE" || message.toLowerCase().includes("inactivo")) {
    return {
      type: "inactive",
      title: "Cuenta inactiva",
      message: `El usuario <strong>${username}</strong> se encuentra en estado inactivo.`,
      details: "Para restablecer tu acceso, contacta con soporte técnico.",
      icon: "alert"
    };
  }
  if (errorData.remainingAttempts !== undefined) {
    return {
      type: "invalid_attempts",
      title: "Credenciales incorrectas",
      message: "El usuario o la contraseña ingresados no son correctos.",
      details: `Te quedan <strong>${errorData.remainingAttempts}</strong> ${errorData.remainingAttempts === 1 ? 'intento' : 'intentos'} antes de que tu cuenta se bloquee temporalmente.`,
      remainingAttempts: errorData.remainingAttempts,
      icon: "warning"
    };
  }
  return {
    type: "invalid",
    title: "Credenciales incorrectas",
    message: "El usuario o la contraseña ingresados no son correctos.",
    details: "Revisa que no tengas Bloq Mayús activado y vuelve a intentarlo.",
    icon: "warning"
  };
};

const LOGIN_ICONS = {
  lock: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
  suspended: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  forbidden: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>`,
  alert: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  error: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  warning: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  network: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.56 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`
};

const getIconBg = (type) => {
  switch (type) {
    case "blocked":
      return "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)";
    case "suspended":
    case "invalid_attempts":
    case "invalid":
      return "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
    case "inactive":
    case "no_roles":
    case "network_error":
      return "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)";
    default:
      return "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
  }
};

const buildDetailsHTML = (config) => {
  const { type, details, blockedUntil, suspensionEnd, remainingAttempts, blockReason } = config;

  if (type === "blocked" && blockedUntil) {
    return `
      <div style="margin-top: 16px; padding: 14px; background: #fee2e2; border-radius: 10px; border-left: 4px solid #dc2626;">
        <p style="font-size: 12px; color: #7f1d1d; margin: 0 0 8px 0; font-weight: 600; display: flex; align-items: center; gap: 6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          Desbloqueado: <br/><strong>${blockedUntil}</strong>
        </p>
        ${blockReason ? `<p style="font-size: 11px; color: #991b1b; margin: 0; font-weight: 500;">${blockReason}</p>` : ''}
      </div>
    `;
  }

  if (type === "suspended") {
    return `
      <div style="margin-top: 16px; padding: 14px; background: #fef3c7; border-radius: 10px; border-left: 4px solid #f59e0b;">
        ${suspensionEnd ? `<p style="font-size: 12px; color: #92400e; margin: 0 0 8px 0; font-weight: 600; display: flex; align-items: center; gap: 6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Suspensión hasta: <br/><strong>${suspensionEnd}</strong>
        </p>` : ''}
        <p style="font-size: 11px; color: #78350f; margin: 0; font-weight: 500;">${details}</p>
      </div>
    `;
  }

  if (type === "invalid_attempts" && remainingAttempts !== undefined) {
    const bgColor = remainingAttempts === 1 ? "#fee2e2" : "#fef3c7";
    const borderColor = remainingAttempts === 1 ? "#ef4444" : "#f59e0b";
    const textColor = remainingAttempts === 1 ? "#7f1d1d" : "#92400e";
    return `
      <div style="margin-top: 16px; padding: 14px; background: ${bgColor}; border-radius: 10px; border-left: 4px solid ${borderColor};">
        <p style="font-size: 12px; color: ${textColor}; margin: 0; font-weight: 600; display: flex; align-items: center; gap: 6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          Intentos restantes: <strong>${remainingAttempts}</strong>
        </p>
      </div>
    `;
  }

  if (type === "no_roles") {
    return `
      <div style="margin-top: 16px; padding: 14px; background: #f8fafc; border-radius: 12px; border-left: 4px solid #64748b; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
        <p style="font-size: 13px; color: #334155; margin: 0 0 6px 0; font-weight: 700; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>
          Acceso no autorizado
        </p>
        <p style="font-size: 12px; color: #64748b; margin: 0; font-weight: 500; line-height: 1.5;">
          El sistema ha detectado que su usuario no posee los privilegios administrativos necesarios.
        </p>
      </div>
    `;
  }

  return "";
};

export const showLoginAlert = (config) => {
  const { type, title, message, details } = config;
  const iconBg = getIconBg(type);
  const detailsHTML = buildDetailsHTML(config);

  const showDetailsInline = type !== "suspended" && type !== "no_roles" && type !== "invalid_attempts";

  Swal.fire({
    html: `
      <div style="padding: 32px 24px;">
        <div style="display: flex; justify-content: center; margin-bottom: 20px;">
          <div style="width: 64px; height: 64px; background: ${iconBg}; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);">
            ${LOGIN_ICONS[config.icon] || LOGIN_ICONS.warning}
          </div>
        </div>
        <h2 style="font-size: 22px; font-weight: 700; color: #1e293b; margin: 0 0 12px 0; text-align: center; letter-spacing: -0.5px;">
          ${title}
        </h2>
        <p style="font-size: 15px; color: #475569; margin: 0 0 16px 0; text-align: center; line-height: 1.6; font-weight: 400;">
          ${message}
        </p>
        ${showDetailsInline ? `<p style="font-size: 13px; color: #64748b; margin: 0 0 4px 0; text-align: center; font-weight: 500;">${details}</p>` : ''}
        ${detailsHTML}
      </div>
    `,
    showConfirmButton: true,
    confirmButtonText: 'OK',
    confirmButtonColor: '#4f46e5',
    showCancelButton: false,
    showDenyButton: false,
    allowOutsideClick: false,
    allowEscapeKey: true,
    background: '#ffffff',
    backdrop: 'rgba(0, 0, 0, 0.4)',
    customClass: {
      popup: 'rounded-3xl shadow-2xl',
      confirmButton: 'ios-confirm-button'
    },
    didOpen: (modal) => {
      const confirmButton = modal.querySelector('.swal2-confirm');
      if (confirmButton) {
        confirmButton.style.cssText = `
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px 32px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
          transition: all 0.3s ease;
          margin-top: 20px;
        `;
        confirmButton.addEventListener('mouseenter', () => {
          confirmButton.style.transform = 'scale(1.05)';
          confirmButton.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.4)';
        });
        confirmButton.addEventListener('mouseleave', () => {
          confirmButton.style.transform = 'scale(1)';
          confirmButton.style.boxShadow = '0 4px 15px rgba(79, 70, 229, 0.3)';
        });
      }
    }
  });
};
