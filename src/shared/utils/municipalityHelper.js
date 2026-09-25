/**
 * Helper para gestionar el municipalityId
 * 
 * ACTUALIZADO: Ahora obtiene el municipalityId del token JWT del usuario autenticado
 * Eliminado el uso de IDs ficticios y localStorage
 */

/**
 * Obtiene el municipalityId desde el token JWT del usuario autenticado
 * @returns {string|null} UUID del municipio o null si no está autenticado
 */
export const getMunicipalityId = () => {
  try {
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      console.warn('⚠️ No hay token de autenticación, usuario no logueado');
      return null;
    }

    // Decodificar el payload del JWT
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Buscar el ID de municipalidad en diferentes campos posibles
    const municipalityId = payload.municipal_code || 
                          payload.municipalityId || 
                          payload.municipality_id ||
                          payload.municipalCode ||
                          null;

    if (!municipalityId) {
      return null;
    }

    return municipalityId;

  } catch {
    return null;
  }
};


export const getUserId = () => {
  try {
    const token = sessionStorage.getItem('accessToken');
    if (!token) return null;

    const payload = JSON.parse(atob(token.split('.')[1]));
    
    return payload.user_id || 
           payload.userId || 
           payload.sub || 
           payload.id ||
           null;

  } catch {
    return null;
  }
};

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean} True si hay token válido
 */
export const isAuthenticated = () => {
  const token = sessionStorage.getItem('accessToken');
  if (!token) return false;

  try {
    // Verificar que el token tenga estructura válida
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Verificar que el payload no esté vacío
    const payload = JSON.parse(atob(parts[1]));
    return payload && payload.exp > Date.now() / 1000;

  } catch {
    return false;
  }
};

/**
 * Verifica que el municipalityId sea válido
 * @param {string} municipalityId 
 * @returns {boolean} True si el formato es válido
 */
export const isValidMunicipalityId = (municipalityId) => {
  if (!municipalityId) return false;
  
  // Verificar formato UUID (versión 4)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(municipalityId);
};

/**
 * Obtiene información completa del usuario desde el JWT
 * @returns {object|null} Datos del usuario o null
 */
export const getUserInfo = () => {
  try {
    const token = sessionStorage.getItem('accessToken');
    if (!token) return null;

    const payload = JSON.parse(atob(token.split('.')[1]));
    
    return {
      userId: payload.user_id || payload.userId || payload.sub || payload.id,
      municipalityId: payload.municipal_code || payload.municipalityId || payload.municipality_id,
      email: payload.email,
      name: payload.name || payload.nombre,
      role: payload.role || payload.rol,
      municipalCode: payload.municipal_code,
      exp: payload.exp
    };

  } catch {
    return null;
  }
};

// Funciones obsoletas - mantenidas para compatibilidad pero marcadas como deprecated
/**
 * @deprecated Esta función ya no se usa. El municipalityId se obtiene del JWT.
 */
export const setMunicipalityId = () => {
  console.warn('⚠️ setMunicipalityId está deprecated. El municipalityId se obtiene automáticamente del JWT.');
  // No hace nada, el ID viene del token
};

/**
 * @deprecated Esta función ya no se usa. No hay nada que limpiar.
 */
export const clearMunicipalityId = () => {
  console.warn('⚠️ clearMunicipalityId está deprecated. No hay nada que limpiar en localStorage.');
  // No hace nada, el ID viene del token
};

/**
 * @deprecated Esta función ya no se usa. La inicialización es automática.
 */
export const initializeMunicipalityId = () => {
  console.warn('⚠️ initializeMunicipalityId está deprecated. La inicialización es automática desde el JWT.');
  // No hace nada, el ID viene del token
};
