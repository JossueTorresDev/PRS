/**
 * Validaciones para el formulario de creación de municipalidades
 */

// Validar RUC - Solo formato (11 dígitos exactos, no ceros)
// La validación de duplicados y existencia la hace el backend/BD
export const validateRUCFormat = (ruc) => {
  if (!ruc) return true; // Campo opcional
  
  const rucClean = ruc.toString().trim();
  
  // Debe tener exactamente 11 dígitos
  if (!/^\d{11}$/.test(rucClean)) {
    return 'RUC debe tener exactamente 11 dígitos';
  }
  
  // No puede ser todo ceros
  if (/^0+$/.test(rucClean)) {
    return 'RUC no puede ser todo ceros';
  }
  
  return true;
};

// Validar UBIGEO (6 dígitos exactos)
export const validateUBIGEOFormat = (ubigeo) => {
  if (!ubigeo) return 'UBIGEO es obligatorio';
  
  const ubigeoClean = ubigeo.toString().trim();
  
  if (!/^\d{6}$/.test(ubigeoClean)) {
    return 'UBIGEO debe tener exactamente 6 dígitos';
  }
  
  return true;
};

// Validar formato de email
export const validateEmailFormat = (email) => {
  if (!email) return true; // Campo opcional en nivel básico
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Ingresa un email válido (ejemplo: usuario@empresa.com)';
  }
  
  return true;
};

// Validar que sea solo números (para teléfono/celular)
export const validatePhoneFormat = (phone) => {
  if (!phone) return true; // Campo opcional
  
  const phoneClean = phone.toString().replace(/[^0-9]/g, '').trim();
  
  if (!/^[0-9]{9,10}$/.test(phoneClean)) {
    return 'Teléfono debe tener 9 o 10 dígitos';
  }
  
  return true;
};

// Validar que sea solo números para celular (exactamente 9 dígitos)
export const validateCellularFormat = (phone) => {
  if (!phone) return true; // Campo opcional
  
  const phoneClean = phone.toString().replace(/[^0-9]/g, '').trim();
  
  if (!/^[0-9]{9}$/.test(phoneClean)) {
    return 'Celular debe tener exactamente 9 dígitos';
  }
  
  return true;
};

// Validar DNI (8 dígitos)
export const validateDNIFormat = (dni) => {
  if (!dni) return true; // Campo opcional
  
  const dniClean = dni.toString().trim();
  
  if (!/^\d{8}$/.test(dniClean)) {
    return 'DNI debe tener exactamente 8 dígitos';
  }
  
  // No puede ser todo ceros
  if (/^0+$/.test(dniClean)) {
    return 'DNI no puede ser todo ceros';
  }
  
  return true;
};

// Validar contraseña (mínimo 8 caracteres, mayúscula, minúscula, número, carácter especial)
export const validatePasswordStrength = (password) => {
  if (!password) return true; // Se valida en required
  
  const passwordStr = password.toString();
  
  const requirements = [];
  
  if (passwordStr.length < 8) {
    requirements.push('mínimo 8 caracteres');
  }
  if (!/[A-Z]/.test(passwordStr)) {
    requirements.push('una mayúscula');
  }
  if (!/[a-z]/.test(passwordStr)) {
    requirements.push('una minúscula');
  }
  if (!/\d/.test(passwordStr)) {
    requirements.push('un número');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};:'",.<>?/\\|`~]/.test(passwordStr)) {
    requirements.push('un carácter especial (!@#$%^&* etc)');
  }
  
  if (requirements.length > 0) {
    return `Contraseña debe contener: ${requirements.join(', ')}`;
  }
  
  return true;
};

// Validar nombre de usuario (4+ caracteres, sin espacios, alfanuméricos + guion bajo)
export const validateUsernameFormat = (username) => {
  if (!username) return true; // Se valida en required
  
  const usernameStr = username.toString().trim();
  
  if (usernameStr.length < 4) {
    return 'Usuario debe tener mínimo 4 caracteres';
  }
  
  if (/\s/.test(usernameStr)) {
    return 'Usuario no puede contener espacios';
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(usernameStr)) {
    return 'Usuario solo puede contener letras, números, guion y guion bajo';
  }
  
  return true;
};

// Validar que sea solo letras (para nombres y apellidos)
export const validateNameFormat = (name) => {
  if (!name) return true; // Se valida en required
  
  const nameStr = name.toString().trim();
  
  if (nameStr.length < 3) {
    return 'Debe tener mínimo 3 caracteres';
  }
  
  if (!/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s'-]+$/.test(nameStr)) {
    return 'Solo se permiten letras, espacios, apóstrofes y guiones';
  }
  
  return true;
};

// Validar URL
export const validateURLFormat = (url) => {
  if (!url) return true; // Campo opcional
  
  const urlStr = url.toString().trim();
  
  // URL simple válida
  const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
  
  if (!urlRegex.test(urlStr)) {
    return 'Ingresa una URL válida (ejemplo: https://www.ejemplo.com)';
  }
  
  return true;
};

// Crear objeto de validación para react-hook-form
export const createValidationRules = (fieldName, isRequired = false) => {
  const baseRule = isRequired
    ? { required: `Este campo es obligatorio` }
    : {};

  switch (fieldName) {
    case 'nombre':
      return {
        ...baseRule,
        validate: validateNameFormat
      };
    
    case 'apellidos':
      return {
        ...baseRule,
        validate: validateNameFormat
      };
    
    case 'ruc':
      return {
        validate: validateRUCFormat
      };
    
    case 'email':
      return {
        validate: validateEmailFormat
      };
    
    case 'personaEmail':
      return {
        ...baseRule,
        validate: validateEmailFormat
      };
    
    case 'telefono':
      return {
        validate: validatePhoneFormat
      };
    
    case 'celular':
      return {
        validate: validatePhoneFormat
      };
    
    case 'personaDni':
      return {
        ...baseRule,
        validate: validateDNIFormat
      };
    
    case 'adminPassword':
      return isRequired
        ? {
            required: 'Contraseña es obligatoria',
            validate: validatePasswordStrength
          }
        : {
            validate: (value) => !value || validatePasswordStrength(value)
          };
    
    case 'adminUsername':
      return {
        ...baseRule,
        validate: validateUsernameFormat
      };
    
    case 'website':
      return {
        validate: validateURLFormat
      };
    
    default:
      return baseRule;
  }
};

// Validar que el campo sea requerido con mensaje personalizado
export const requiredField = (fieldName) => ({
  required: `${fieldName} es requerido`
});
