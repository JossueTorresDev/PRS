import { useState, useEffect } from 'react';
import {
  getTiposDocumento,
  validarDocumentoPorTipo,
  validarTelefonoPeruano,
  validarNombreComercial,
  validarRazonSocial,
  validarContactoPrincipal,
  validarDireccion,
  validarSitioWeb,
  validarEmail,
  validarSinEspaciosExtremos,
  ERROR_ESPACIOS_EXTREMOS,
  obtenerErrorDocumentoPorTipo,
  verificarDocumentoExistente
} from '../../services/api';
const EMPTY_FORM = {
  documentTypesId: 1, 
  numeroDocumento: '',
  legalName: '',
  tradeName: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  mainContact: '',
  companyType: '',
  isStateProvider: false,
  classification: '',
};
const PERSONAL_DOC_TYPES = [1, 3, 4]; 
function cleanDocumentNumber(value, docTypeId) {
  if (docTypeId === 1) { 
    return value.replace(/[^\d]/g, '').slice(0, 8);
  }
  if (docTypeId === 2) { 
    return value.replace(/[^\d]/g, '').slice(0, 11);
  }
  if (docTypeId === 3) { 
    return value.replace(/[^\d]/g, '').slice(0, 9);
  }
  if (docTypeId === 4) { 
    return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 9);
  }
  return value;
}
export function useSupplierForm({ isOpen, proveedor }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [checkingDocument, setCheckingDocument] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  useEffect(() => {
    if (isOpen) {
      getTiposDocumento().then(setTiposDocumento).catch(() => {});
    }
  }, [isOpen]);
  useEffect(() => {
    if (proveedor) {
      const docTypeId = proveedor.documentTypesId || 1;
      setFormData({
        documentTypesId: docTypeId,
        numeroDocumento: cleanDocumentNumber(proveedor.numeroDocumento || '', docTypeId),
        legalName: proveedor.legalName || '',
        tradeName: proveedor.tradeName || '',
        address: proveedor.address || '',
        phone: proveedor.phone || '',
        email: proveedor.email || '',
        website: proveedor.website || '',
        mainContact: proveedor.mainContact || '',
        companyType: proveedor.companyType || '',
        isStateProvider: proveedor.isStateProvider || false,
        classification: proveedor.classification || '',
      });
    } else {
      setFormData(EMPTY_FORM);
    }
    setError(null);
    setErrors({});
  }, [proveedor, isOpen]);
  const setFieldError = (field, msg) =>
    setErrors(prev => ({ ...prev, [field]: msg }));
  const clearFieldError = (field) =>
    setErrors(prev => ({ ...prev, [field]: '' }));
  const validateForm = async () => {
    const newErrors = {};
    const { documentTypesId, numeroDocumento, legalName, tradeName, address,
      phone, email, website, mainContact, classification, companyType } = formData;
    if (!documentTypesId) newErrors.documentTypesId = 'Tipo de documento es requerido';
    if (!numeroDocumento?.trim()) {
      newErrors.numeroDocumento = obtenerErrorDocumentoPorTipo(documentTypesId, '', null);
    } else {
      const isValid = validarDocumentoPorTipo(documentTypesId, numeroDocumento, null);
      if (!isValid) {
        newErrors.numeroDocumento = obtenerErrorDocumentoPorTipo(documentTypesId, numeroDocumento, null);
      } else {
        try {
          const existe = await verificarDocumentoExistente(numeroDocumento, proveedor?.id);
          if (existe) newErrors.numeroDocumento = 'Este número de documento ya está registrado para otro proveedor';
        } catch {  }
      }
    }
    if (!legalName?.trim()) newErrors.legalName = 'Razón social es requerida';
    else if (!validarSinEspaciosExtremos(legalName)) newErrors.legalName = ERROR_ESPACIOS_EXTREMOS;
    else if (!validarRazonSocial(legalName)) newErrors.legalName = 'Razón social debe tener entre 3-100 caracteres, contener letras y solo caracteres válidos';
    if (!tradeName?.trim()) newErrors.tradeName = 'Nombre comercial es requerido';
    else if (!validarSinEspaciosExtremos(tradeName)) newErrors.tradeName = ERROR_ESPACIOS_EXTREMOS;
    else if (!validarNombreComercial(tradeName)) newErrors.tradeName = 'Nombre comercial debe tener mínimo 2 caracteres y al menos una palabra';
    if (!address?.trim()) newErrors.address = 'Dirección Legal es requerida';
    else if (!validarSinEspaciosExtremos(address)) newErrors.address = ERROR_ESPACIOS_EXTREMOS;
    else if (!validarDireccion(address)) newErrors.address = 'Dirección Legal debe tener entre 5-200 caracteres y contener letras y números';
    if (!phone?.trim()) newErrors.phone = 'Teléfono es requerido';
    else if (!validarSinEspaciosExtremos(phone)) newErrors.phone = ERROR_ESPACIOS_EXTREMOS;
    else if (!validarTelefonoPeruano(phone)) newErrors.phone = 'Teléfono inválido. Celular: 9 dígitos (ej: 987654321). Fijo Lima: 7 dígitos (ej: 4567890) o con 01 (ej: 014567890)';
    if (!email?.trim()) newErrors.email = 'Email es requerido';
    else if (!validarSinEspaciosExtremos(email)) newErrors.email = ERROR_ESPACIOS_EXTREMOS;
    else if (!validarEmail(email)) newErrors.email = 'Email debe tener un formato válido (ejemplo: usuario@dominio.com)';
    if (!mainContact?.trim()) newErrors.mainContact = 'Contacto principal es requerido';
    else if (!validarSinEspaciosExtremos(mainContact)) newErrors.mainContact = ERROR_ESPACIOS_EXTREMOS;
    else if (!validarContactoPrincipal(mainContact)) newErrors.mainContact = 'Contacto principal debe tener mínimo 3 caracteres y solo letras';
    if (website && !validarSinEspaciosExtremos(website)) newErrors.website = ERROR_ESPACIOS_EXTREMOS;
    else if (website && !validarSitioWeb(website)) newErrors.website = 'Sitio web debe ser una URL válida';
    if (!classification?.trim()) newErrors.classification = 'La clasificación es requerida';
    if (PERSONAL_DOC_TYPES.includes(documentTypesId)) {
      if (companyType && companyType !== 'PERSONA NATURAL') {
        const label = documentTypesId === 1 ? 'DNI' : documentTypesId === 3 ? 'CE' : 'Pasaporte';
        newErrors.companyType = `Con ${label} solo se permite el tipo "Persona Natural"`;
      }
    } else if (documentTypesId === 2) { 
      if (companyType === 'PERSONA NATURAL') newErrors.companyType = 'Con RUC no se permite el tipo "Persona Natural". Seleccione un tipo de empresa válido';
      if (!companyType) newErrors.companyType = 'Debe seleccionar un tipo de empresa para RUC';
    }
    return newErrors;
  };
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'documentTypesId') {
      const newDocTypeId = parseInt(value);
      const isPersonal = PERSONAL_DOC_TYPES.includes(newDocTypeId);
      setFormData(prev => ({
        ...prev,
        documentTypesId: newDocTypeId,
        numeroDocumento: '',
        companyType: isPersonal ? 'PERSONA NATURAL' : (prev.companyType === 'PERSONA NATURAL' ? '' : prev.companyType),
      }));
      setErrors(prev => ({ ...prev, numeroDocumento: '', companyType: '' }));
      return;
    }
    let finalValue = value;
    if (name === 'numeroDocumento') {
      finalValue = cleanDocumentNumber(value, formData.documentTypesId);
      const isValid = finalValue && validarDocumentoPorTipo(formData.documentTypesId, finalValue, proveedor?.numeroDocumento);
      if (finalValue && !isValid) {
        setFieldError('numeroDocumento', obtenerErrorDocumentoPorTipo(formData.documentTypesId, finalValue, proveedor?.numeroDocumento));
      } else {
        clearFieldError('numeroDocumento');
      }
    } else if (name === 'email') {
      finalValue = value;
      if (finalValue && !validarSinEspaciosExtremos(finalValue)) {
        setFieldError('email', ERROR_ESPACIOS_EXTREMOS);
      } else if (finalValue && !validarEmail(finalValue)) {
        setFieldError('email', 'Email debe tener un formato válido sin espacios (ejemplo: usuario@dominio.com)');
      } else {
        clearFieldError('email');
      }
    } else if (name === 'legalName' && value) {
      if (!validarSinEspaciosExtremos(value)) setFieldError('legalName', ERROR_ESPACIOS_EXTREMOS);
      else if (!validarRazonSocial(value)) setFieldError('legalName', 'Razón social debe tener entre 3-100 caracteres, contener letras y solo caracteres válidos');
      else clearFieldError('legalName');
    } else if (name === 'tradeName' && value) {
      if (!validarSinEspaciosExtremos(value)) setFieldError('tradeName', ERROR_ESPACIOS_EXTREMOS);
      else if (!validarNombreComercial(value)) setFieldError('tradeName', 'Nombre comercial debe tener mínimo 2 caracteres y al menos una palabra');
      else clearFieldError('tradeName');
    } else if (name === 'phone' && value) {
      if (!validarSinEspaciosExtremos(value)) setFieldError('phone', ERROR_ESPACIOS_EXTREMOS);
      else if (!validarTelefonoPeruano(value)) setFieldError('phone', 'Teléfono inválido. Celular: 9 dígitos (ej: 987654321). Fijo Lima: 7 dígitos (ej: 4567890) o con 01 (ej: 014567890)');
      else clearFieldError('phone');
    } else if (name === 'website' && value) {
      if (!validarSinEspaciosExtremos(value)) setFieldError('website', ERROR_ESPACIOS_EXTREMOS);
      else if (!validarSitioWeb(value)) setFieldError('website', 'Sitio web debe ser una URL válida');
      else clearFieldError('website');
    } else if (name === 'mainContact' && value) {
      if (!validarSinEspaciosExtremos(value)) setFieldError('mainContact', ERROR_ESPACIOS_EXTREMOS);
      else if (!validarContactoPrincipal(value)) setFieldError('mainContact', 'Contacto principal debe tener mínimo 3 caracteres y solo letras');
      else clearFieldError('mainContact');
    } else if (name === 'address' && value) {
      if (!validarSinEspaciosExtremos(value)) setFieldError('address', ERROR_ESPACIOS_EXTREMOS);
      else if (!validarDireccion(value)) setFieldError('address', 'Dirección Legal debe tener entre 5-200 caracteres y contener letras y números');
      else clearFieldError('address');
    } else if (name === 'companyType') {
      const docId = formData.documentTypesId;
      if (docId === 2 && value === 'PERSONA NATURAL') setFieldError('companyType', 'Con RUC no se permite "Persona Natural"');
      else if (PERSONAL_DOC_TYPES.includes(docId) && value !== 'PERSONA NATURAL') setFieldError('companyType', 'Solo se permite "Persona Natural" con este documento');
      else clearFieldError('companyType');
    }
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'documentTypesId' ? parseInt(finalValue) || '' : finalValue),
    }));
  };
  const handleBlur = async (e) => {
    const { name, value } = e.target;
    if (name === 'numeroDocumento') {
      if (!value?.trim()) {
        setFieldError('numeroDocumento', obtenerErrorDocumentoPorTipo(formData.documentTypesId, '', proveedor?.numeroDocumento));
        return;
      }
      const isValid = validarDocumentoPorTipo(formData.documentTypesId, value, proveedor?.numeroDocumento);
      if (!isValid) {
        setFieldError('numeroDocumento', obtenerErrorDocumentoPorTipo(formData.documentTypesId, value, proveedor?.numeroDocumento));
        return;
      }
      setCheckingDocument(true);
      try {
        const existe = await verificarDocumentoExistente(value, proveedor?.id);
        if (existe) setFieldError('numeroDocumento', 'Este número de documento ya está registrado para otro proveedor');
        else clearFieldError('numeroDocumento');
      } catch { clearFieldError('numeroDocumento'); }
      finally { setCheckingDocument(false); }
    } else if (name === 'legalName') {
      if (!value?.trim()) setFieldError('legalName', 'Razón social es requerida');
      else if (!validarSinEspaciosExtremos(value)) setFieldError('legalName', ERROR_ESPACIOS_EXTREMOS);
      else if (!validarRazonSocial(value)) setFieldError('legalName', 'Razón social debe tener entre 3-100 caracteres, contener letras y solo caracteres válidos');
      else clearFieldError('legalName');
    } else if (name === 'tradeName') {
      if (!value?.trim()) setFieldError('tradeName', 'Nombre comercial es requerido');
      else if (!validarSinEspaciosExtremos(value)) setFieldError('tradeName', ERROR_ESPACIOS_EXTREMOS);
      else if (!validarNombreComercial(value)) setFieldError('tradeName', 'Nombre comercial debe tener mínimo 2 caracteres y al menos una palabra');
      else clearFieldError('tradeName');
    } else if (name === 'address') {
      if (!value?.trim()) setFieldError('address', 'Dirección Legal es requerida');
      else if (!validarSinEspaciosExtremos(value)) setFieldError('address', ERROR_ESPACIOS_EXTREMOS);
      else if (!validarDireccion(value)) setFieldError('address', 'Dirección Legal debe tener entre 5-200 caracteres y contener letras y números');
      else clearFieldError('address');
    } else if (name === 'phone') {
      if (!value?.trim()) setFieldError('phone', 'Teléfono es requerido');
      else if (!validarSinEspaciosExtremos(value)) setFieldError('phone', ERROR_ESPACIOS_EXTREMOS);
      else if (!validarTelefonoPeruano(value)) setFieldError('phone', 'Teléfono inválido. Celular: 9 dígitos (ej: 987654321). Fijo Lima: 7 dígitos (ej: 4567890) o con 01 (ej: 014567890)');
      else clearFieldError('phone');
    } else if (name === 'email') {
      if (!value?.trim()) setFieldError('email', 'Email es requerido');
      else if (!validarSinEspaciosExtremos(value)) setFieldError('email', ERROR_ESPACIOS_EXTREMOS);
      else if (!validarEmail(value)) setFieldError('email', 'Email debe tener un formato válido sin espacios (ejemplo: usuario@dominio.com)');
      else clearFieldError('email');
    } else if (name === 'website') {
      if (value && !validarSinEspaciosExtremos(value)) setFieldError('website', ERROR_ESPACIOS_EXTREMOS);
      else if (value && !validarSitioWeb(value)) setFieldError('website', 'Sitio web debe ser una URL válida');
      else clearFieldError('website');
    } else if (name === 'mainContact') {
      if (!value?.trim()) setFieldError('mainContact', 'Contacto principal es requerido');
      else if (!validarSinEspaciosExtremos(value)) setFieldError('mainContact', ERROR_ESPACIOS_EXTREMOS);
      else if (!validarContactoPrincipal(value)) setFieldError('mainContact', 'Contacto principal debe tener mínimo 3 caracteres y solo letras');
      else clearFieldError('mainContact');
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const validationErrors = await validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      const firstField = Object.keys(validationErrors)[0];
      document.querySelector(`[name="${firstField}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setLoading(false);
    setShowConfirmation(true);
  };
  return {
    formData, loading, error, setError, errors, tiposDocumento,
    checkingDocument, showConfirmation, setShowConfirmation,
    handleChange, handleBlur, handleSubmit,
  };
}
