import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env.js';

const API_BASE_URL = `${getEnv('VITE_GATEWAY_API_URL', 'http://localhost:5004')}/suppliers`;

export const getProveedores = async () => {
  const response = await httpClient.get(API_BASE_URL);
  return response.data;
};

export const getProveedoresInactivos = async () => {
  const response = await httpClient.get(`${API_BASE_URL}/inactive`);
  return response.data;
};

export const getProveedorById = async (id) => {
  const response = await httpClient.get(`${API_BASE_URL}/${id}`);
  return response.data;
};

export const createProveedor = async (data) => {
  try {
    const response = await httpClient.post(API_BASE_URL, data);
    return response.data;
  } catch (error) {
    if (error.status === 409) {
      throw new Error('Ya existe un proveedor registrado con ese número de documento.');
    }
    throw new Error(error.message || `Error ${error.status} al crear el proveedor`);
  }
};

export const updateProveedor = async (id, data) => {
  try {
    const response = await httpClient.put(`${API_BASE_URL}/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.message || `Error ${error.status} al actualizar el proveedor`);
  }
};

export const deleteProveedor = async (id) => {
  const response = await httpClient.delete(`${API_BASE_URL}/${id}`);
  const contentType = response.headers?.['content-type'];
  if (contentType && contentType.includes('application/json')) return response.data;
  return { success: true, message: 'Proveedor eliminado correctamente' };
};

export const restaurarProveedor = async (id) => {
  const response = await httpClient.patch(`${API_BASE_URL}/${id}/restore`);
  const contentType = response.headers?.['content-type'];
  if (contentType && contentType.includes('application/json')) return response.data;
  return { success: true, message: 'Proveedor restaurado correctamente' };
};

export const getTiposDocumento = async () => {
  try {
    const baseUrl = getEnv('VITE_GATEWAY_API_URL', 'http://localhost:5004');
    const response = await httpClient.get(`${baseUrl}/document-types`);
    return response.data;
  } catch {
    return [
      { id: 1, name: 'DNI', description: 'Documento Nacional de Identidad' },
      { id: 2, name: 'RUC', description: 'Registro Único de Contribuyentes' },
      { id: 3, name: 'CE', description: 'Carnet de Extranjería' },
      { id: 4, name: 'Pasaporte', description: 'Pasaporte' },
    ];
  }
};

export const validarRUC = (ruc, strict = true, rucOriginal = null) => {
  if (!ruc) return false;
  const rucLimpio = ruc.replace(/\D/g, '');
  if (rucLimpio.length !== 11) return false;
  if (!/^\d{11}$/.test(rucLimpio)) return false;
  if (rucOriginal && rucLimpio === rucOriginal.replace(/\D/g, '')) {
    return true;
  }
  if (!strict) return true;
  const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const rucArray = rucLimpio.split('').map(Number);
  const digitoVerificador = rucArray[10];
  let suma = 0;
  for (let i = 0; i < 10; i++) {
    suma += rucArray[i] * multiplicadores[i];
  }
  const resto = suma % 11;
  const digitoCalculado = resto < 2 ? resto : 11 - resto;
  return digitoCalculado === digitoVerificador;
};

export const formatearRUC = (ruc) => {
  if (!ruc) return '';
  const rucLimpio = ruc.replace(/\D/g, '');
  if (rucLimpio.length === 11) {
    return `${rucLimpio.slice(0, 2)}-${rucLimpio.slice(2, 9)}-${rucLimpio.slice(9)}`;
  }
  return ruc;
};

export const validarDNI = (dni) => {
  if (!dni) return false;
  if (!/^\d+$/.test(dni)) return false;
  if (dni.length !== 8) return false;
  if (dni === '00000000') return false;
  return true;
};

export const obtenerErrorDNI = (dni) => {
  if (!dni || !dni.trim()) return 'DNI es requerido';
  if (!/^\d*$/.test(dni)) return 'DNI debe contener solo números';
  if (dni.length < 8) return `DNI debe tener exactamente 8 dígitos (faltan ${8 - dni.length})`;
  if (dni.length > 8) return 'DNI debe tener exactamente 8 dígitos';
  if (dni === '00000000') return 'DNI inválido (no puede ser 00000000)';
  return '';
};

export const obtenerErrorRUC = (ruc, rucOriginal = null) => {
  if (!ruc) return 'RUC es requerido';
  const rucLimpio = ruc.replace(/\D/g, '');
  if (rucLimpio.length !== ruc.replace(/\s/g, '').length) {
    return 'RUC debe contener solo números';
  }
  if (rucLimpio.length === 0) return 'RUC es requerido';
  if (rucLimpio.length < 11) return `RUC debe tener exactamente 11 dígitos (faltan ${11 - rucLimpio.length})`;
  if (rucLimpio.length > 11) return 'RUC debe tener exactamente 11 dígitos';
  if (rucOriginal && rucLimpio === rucOriginal.replace(/\D/g, '')) {
    return '';
  }
  if (!validarRUC(ruc, true, rucOriginal)) {
    return 'RUC inválido (dígito verificador incorrecto)';
  }
  return 'RUC inválido';
};

export const obtenerErrorCE = (ce) => {
  if (!ce || !ce.trim()) return 'CE es requerido';
  const ceLimpio = ce.replace(/\s/g, '');
  if (!/^\d*$/.test(ceLimpio)) {
    return 'CE debe contener solo números';
  }
  if (ceLimpio.length < 9) return `CE debe tener exactamente 9 dígitos (faltan ${9 - ceLimpio.length})`;
  if (ceLimpio.length > 9) return 'CE debe tener exactamente 9 dígitos';
  return '';
};

export const obtenerErrorPasaporte = (pasaporte) => {
  if (!pasaporte || !pasaporte.trim()) return 'Pasaporte es requerido';
  const pasaporteLimpio = pasaporte.replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z0-9]*$/.test(pasaporteLimpio)) {
    return 'Pasaporte debe contener solo letras y números';
  }
  if (pasaporteLimpio.length < 9) return `Pasaporte debe tener exactamente 9 caracteres (faltan ${9 - pasaporteLimpio.length})`;
  if (pasaporteLimpio.length > 9) return 'Pasaporte debe tener exactamente 9 caracteres';
  return '';
};

export const validarCE = (ce) => {
  if (!ce) return false;
  const ceLimpio = ce.replace(/\s/g, '');
  return /^\d{9}$/.test(ceLimpio);
};

export const validarPasaporte = (pasaporte) => {
  if (!pasaporte) return false;
  const pasaporteLimpio = pasaporte.replace(/\s/g, '').toUpperCase();
  return /^[A-Z0-9]{9}$/.test(pasaporteLimpio);
};

export const validarDocumentoPorTipo = (documentTypeId, numeroDocumento, documentoOriginal = null) => {
  if (!numeroDocumento) return false;
  switch (documentTypeId) {
    case 1: return validarDNI(numeroDocumento);
    case 2: return /^\d{11}$/.test(numeroDocumento);
    case 3: return validarCE(numeroDocumento);
    case 4: return validarPasaporte(numeroDocumento);
    default: return true;
  }
};

export const obtenerErrorDocumentoPorTipo = (documentTypeId, numeroDocumento, documentoOriginal = null) => {
  if (!numeroDocumento || !numeroDocumento.trim()) {
    switch (documentTypeId) {
      case 1: return 'DNI es requerido';
      case 2: return 'RUC es requerido';
      case 3: return 'CE es requerido';
      case 4: return 'Pasaporte es requerido';
      default: return 'Número de documento es requerido';
    }
  }
  switch (documentTypeId) {
    case 1: return obtenerErrorDNI(numeroDocumento);
    case 2: if (!/^\d{11}$/.test(numeroDocumento)) return 'RUC debe tener exactamente 11 dígitos'; return '';
    case 3: return obtenerErrorCE(numeroDocumento);
    case 4: return obtenerErrorPasaporte(numeroDocumento);
    default: return 'Documento inválido';
  }
};

export const ERROR_ESPACIOS_EXTREMOS = 'No se permiten espacios al inicio o al final';

export const validarSinEspaciosExtremos = (valor) => {
  if (!valor) return true;
  return !/^\s/.test(valor) && !/\s$/.test(valor);
};

export const validarTelefonoPeruano = (telefono) => {
  if (!telefono) return true;
  if (!validarSinEspaciosExtremos(telefono)) return false;
  const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');
  if (telefonoLimpio.startsWith('+51') || telefonoLimpio.startsWith('+')) return false;
  if (/^9\d{8}$/.test(telefonoLimpio)) return true;
  if (/^01\d{7}$/.test(telefonoLimpio) || /^[1-9]\d{6}$/.test(telefonoLimpio)) return true;
  return false;
};

export const validarNombreComercial = (nombreComercial) => {
  if (!nombreComercial) return true;
  if (!validarSinEspaciosExtremos(nombreComercial)) return false;
  const nombreLimpio = nombreComercial.trim();
  if (nombreLimpio.length < 2) return false;
  if (/^\d+$/.test(nombreLimpio)) return false;
  return /[a-zA-Z]/.test(nombreLimpio);
};

export const validarRazonSocial = (razonSocial) => {
  if (!razonSocial) return false;
  if (!validarSinEspaciosExtremos(razonSocial)) return false;
  const razonLimpia = razonSocial.trim();
  if (razonLimpia.length < 3 || razonLimpia.length > 100) return false;
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9&.,()\- ]+$/;
  if (!regex.test(razonLimpia)) return false;
  const tieneLetras = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(razonLimpia);
  return tieneLetras;
};

export const validarContactoPrincipal = (contacto) => {
  if (!contacto) return true;
  if (!validarSinEspaciosExtremos(contacto)) return false;
  const contactoLimpio = contacto.trim();
  if (contactoLimpio.length < 3) return false;
  return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(contactoLimpio);
};

export const validarDireccion = (direccion) => {
  if (!direccion) return true;
  if (!validarSinEspaciosExtremos(direccion)) return false;
  const direccionLimpia = direccion.trim();
  if (direccionLimpia.length < 5 || direccionLimpia.length > 200) return false;
  const regex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-.,#/]+$/;
  if (!regex.test(direccionLimpia)) return false;
  const tieneNumeros = /\d/.test(direccionLimpia);
  if (!tieneNumeros) return false;
  const tieneLetras = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(direccionLimpia);
  return tieneLetras;
};

export const validarSitioWeb = (sitioWeb) => {
  if (!sitioWeb) return true;
  if (!validarSinEspaciosExtremos(sitioWeb)) return false;
  const sitioLimpio = sitioWeb.trim();
  if (/^\d+$/.test(sitioLimpio)) return false;
  try {
    const urlCompleta = sitioLimpio.startsWith('http') ? sitioLimpio : `https://${sitioLimpio}`;
    new URL(urlCompleta);
    return true;
  } catch {
    return false;
  }
};

export const validarEmail = (email) => {
  if (!email) return true;
  if (!validarSinEspaciosExtremos(email)) return false;
  const emailLimpio = email.trim();
  if (/\s/.test(emailLimpio)) return false;
  if (emailLimpio.length > 254) return false;
  if (!emailLimpio.includes('@')) return false;
  if (emailLimpio.startsWith('.') || emailLimpio.endsWith('.')) return false;
  if (emailLimpio.includes('..')) return false;
  const partes = emailLimpio.split('@');
  if (partes.length !== 2) return false;
  const [usuario, dominio] = partes;
  if (!usuario || usuario.length === 0) return false;
  if (usuario.length > 64) return false;
  if (!dominio || dominio.length === 0) return false;
  if (dominio.length > 253) return false;
  if (!dominio.includes('.')) return false;
  if (dominio.startsWith('.') || dominio.endsWith('.') || dominio.startsWith('-') || dominio.endsWith('-')) return false;
  const regexUsuario = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
  if (!regexUsuario.test(usuario)) return false;
  const regexDominio = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!regexDominio.test(dominio)) return false;
  const extensionDominio = dominio.split('.').pop();
  if (!extensionDominio || extensionDominio.length < 2) return false;
  return true;
};

export const verificarDocumentoExistente = async (numeroDocumento, proveedorId = null) => false;

export const obtenerPlaceholderDocumento = (documentTypeId) => {
  switch (documentTypeId) {
    case 1: return "12345678";
    case 2: return "20123456789";
    case 3: return "001234567";
    case 4: return "123456789";
    default: return "Número de documento";
  }
};
