import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MapPinIcon,
  UserIcon,
  CalendarIcon,
  CameraIcon
} from '@heroicons/react/24/outline';


const FOUND_STATUS_OPTIONS = [
  { value: 'FOUND', label: 'Encontrado', color: 'bg-green-50 border-green-500 text-green-700', icon: CheckCircleIcon },
  { value: 'MISSING', label: 'Faltante', color: 'bg-red-50 border-red-500 text-red-700', icon: XCircleIcon },
  { value: 'SURPLUS', label: 'Sobrante', color: 'bg-blue-50 border-blue-500 text-blue-700', icon: PlusIcon },
  { value: 'DAMAGED', label: 'Dañado', color: 'bg-amber-50 border-amber-500 text-amber-700', icon: ExclamationTriangleIcon }
];


const CONSERVATION_STATUS_OPTIONS = [
  { value: 'EXCELLENT', label: 'Excelente' },
  { value: 'GOOD', label: 'Bueno' },
  { value: 'REGULAR', label: 'Regular' },
  { value: 'BAD', label: 'Malo' },
  { value: 'UNUSABLE', label: 'Inutilizable' }
];


export default function InventoryDetailFormModal({
  isOpen,
  onClose,
  onSave,
  detail,
  inventoryId,
  municipalityId,
  assets = [],
  locations = [],
  users = []
}) {
  const [formData, setFormData] = useState({
    municipalityId: '',
    inventoryId: '',
    assetId: '',
    foundStatus: 'FOUND',
    actualConservationStatus: '',
    actualLocationId: '',
    actualResponsibleId: '',
    verifiedBy: '',
    verificationDate: '',
    observations: '',
    requiresAction: false,
    requiredAction: '',
    photographs: [],
    additionalEvidence: [],
    physicalDifferences: '',
    documentDifferences: ''
  });


  const [errors, setErrors] = useState({});


  // Obtener la fecha actual en formato YYYY-MM-DD
  const getTodayDate = () => new Date().toISOString().split('T')[0];


  useEffect(() => {
    const todayDate = getTodayDate();
   
    if (detail) {
      setFormData({
        municipalityId: detail.municipalityId || municipalityId || '',
        inventoryId: detail.inventoryId || inventoryId || '',
        assetId: detail.assetId || '',
        foundStatus: detail.foundStatus || 'FOUND',
        actualConservationStatus: detail.actualConservationStatus || '',
        actualLocationId: detail.actualLocationId || '',
        actualResponsibleId: detail.actualResponsibleId || '',
        verifiedBy: detail.verifiedBy || '',
        // Mantener la última fecha de verificación si existe, sino usar hoy
        verificationDate: detail.verificationDate ? detail.verificationDate.split('T')[0] : todayDate,
        observations: detail.observations || '',
        requiresAction: detail.requiresAction || false,
        requiredAction: detail.requiredAction || '',
        photographs: detail.photographs || [],
        additionalEvidence: detail.additionalEvidence || [],
        physicalDifferences: detail.physicalDifferences || '',
        documentDifferences: detail.documentDifferences || ''
      });
    } else {
      // Nuevo registro: usar fecha actual
      setFormData({
        municipalityId: municipalityId || '',
        inventoryId: inventoryId || '',
        assetId: '',
        foundStatus: 'FOUND',
        actualConservationStatus: '',
        actualLocationId: '',
        actualResponsibleId: '',
        verifiedBy: '',
        verificationDate: todayDate,
        observations: '',
        requiresAction: false,
        requiredAction: '',
        photographs: [],
        additionalEvidence: [],
        physicalDifferences: '',
        documentDifferences: ''
      });
    }
  }, [detail, inventoryId, municipalityId, isOpen]);


  const validateField = (name, value) => {
    let error = '';
   
    // Validar campos de texto que no deben ser solo espacios
    if (['observations', 'requiredAction', 'physicalDifferences', 'documentDifferences'].includes(name)) {
      if (value && value.trim() === '') {
        error = 'No puede contener solo espacios en blanco';
      }
    }
   
    // Validar acción requerida si el checkbox está marcado
    if (name === 'requiredAction' && formData.requiresAction && value.trim() === '') {
      error = 'Debe especificar la acción requerida';
    }
   
    return error;
  };


  // Detectar cambios en cualquier campo y actualizar automáticamente la fecha de verificación
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
   
    // Obtener la fecha actual
    const todayDate = getTodayDate();
   
    // Si el usuario cambia cualquier campo (excepto verificationDate), actualizar la fecha al día actual
    const updatedFormData = {
      ...formData,
      [name]: newValue
    };
   
    if (name !== 'verificationDate') {
      updatedFormData.verificationDate = todayDate;
    }
   
    setFormData(updatedFormData);
   
    // Validación en tiempo real
    if (type !== 'checkbox') {
      const error = validateField(name, newValue);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
   
    // Limpiar error de requiredAction si se desmarca el checkbox
    if (name === 'requiresAction' && !checked) {
      setErrors(prev => ({
        ...prev,
        requiredAction: ''
      }));
    }
  };


  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB


  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const rejectedFiles = [];
    const acceptedFiles = [];


    files.forEach(file => {
      // Validar tipo de archivo
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        rejectedFiles.push({
          name: file.name,
          reason: `Tipo no permitido: ${file.type || 'desconocido'}. Solo se aceptan: JPG, PNG, GIF, WebP`
        });
        return;
      }


      // Validar tamaño
      if (file.size > MAX_IMAGE_SIZE) {
        rejectedFiles.push({
          name: file.name,
          reason: `Archivo muy grande: ${(file.size / 1024 / 1024).toFixed(2)}MB. Máximo permitido: 5MB`
        });
        return;
      }


      acceptedFiles.push(file);
    });


    // Mostrar alerta si hay archivos rechazados
    if (rejectedFiles.length > 0) {
      const rejectionMessage = rejectedFiles
        .map(f => `❌ ${f.name}\n   ${f.reason}`)
        .join('\n\n');


      Swal.fire({
        icon: 'warning',
        title: 'Archivos No Permitidos',
        html: `<div style="text-align: left; max-height: 200px; overflow-y-auto;">
          <p style="margin-bottom: 10px;"><strong>${rejectedFiles.length} archivo(s) rechazado(s):</strong></p>
          <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 12px; white-space: pre-wrap; word-wrap: break-word;">
${rejectionMessage}
          </pre>
          <p style="margin-top: 10px; font-size: 14px;"><strong>✅ Formatos permitidos:</strong> JPG, PNG, GIF, WebP</p>
          <p style="font-size: 12px; color: #666;"><strong>📊 Tamaño máximo:</strong> 5MB por archivo</p>
        </div>`,
        confirmButtonColor: '#f59e0b',
        confirmButtonText: 'Entendido'
      });
    }


    // Procesar archivos aceptados
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          photographs: [...prev.photographs, {
            name: file.name,
            data: reader.result,
            type: file.type,
            uploadedAt: new Date().toISOString()
          }]
        }));
      };
      reader.readAsDataURL(file);
    });


    // Mostrar confirmación si se agregaron archivos
    if (acceptedFiles.length > 0) {
      Swal.fire({
        icon: 'success',
        title: 'Fotografías Agregadas',
        text: `Se agregaron ${acceptedFiles.length} fotografía(s) correctamente`,
        timer: 1500,
        showConfirmButton: false
      });
    }
  };


  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photographs: prev.photographs.filter((_, i) => i !== index)
    }));
  };


  const handleSubmit = (e) => {
    e.preventDefault();
   
    // Validar todos los campos antes de enviar
    const newErrors = {};
   
    // Campos obligatorios
    if (!formData.foundStatus) {
      newErrors.foundStatus = 'Debe seleccionar el estado del bien';
    }
   
    if (!formData.actualConservationStatus) {
      newErrors.actualConservationStatus = 'Debe seleccionar el estado de conservación';
    }
   
    if (!formData.verificationDate) {
      newErrors.verificationDate = 'Debe seleccionar la fecha de verificación';
    }
   
    // Validar observaciones
    if (formData.observations && formData.observations.trim() === '') {
      newErrors.observations = 'No puede contener solo espacios en blanco';
    }
   
    // Validar acción requerida
    if (formData.requiresAction) {
      if (!formData.requiredAction || formData.requiredAction.trim() === '') {
        newErrors.requiredAction = 'Debe especificar la acción requerida';
      }
    }
   
    // Validar diferencias físicas
    if (formData.physicalDifferences && formData.physicalDifferences.trim() === '') {
      newErrors.physicalDifferences = 'No puede contener solo espacios en blanco';
    }
   
    // Validar diferencias documentales
    if (formData.documentDifferences && formData.documentDifferences.trim() === '') {
      newErrors.documentDifferences = 'No puede contener solo espacios en blanco';
    }
   
    // Si hay errores, no enviar
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
   
    const dataToSave = {
      ...formData,
      // Limpiar espacios en blanco de los campos de texto
      observations: formData.observations?.trim() || '',
      requiredAction: formData.requiredAction?.trim() || '',
      physicalDifferences: formData.physicalDifferences?.trim() || '',
      documentDifferences: formData.documentDifferences?.trim() || '',
      verificationDate: formData.verificationDate ? `${formData.verificationDate}T00:00:00` : null
    };


    console.log('📝 Datos a guardar:', dataToSave);
    console.log('📍 Ubicación ID:', dataToSave.actualLocationId);
    console.log('👤 Responsable ID:', dataToSave.actualResponsibleId);
    onSave(dataToSave);
  };


  if (!isOpen) return null;




  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 p-2 rounded-xl mr-4">
                <CheckCircleIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {detail ? 'Editar Registro' : 'Nuevo Registro de Verificación'}
                </h3>
                <p className="text-indigo-100 text-sm">
                  {detail ? 'Modifica los datos del registro' : 'Registra un bien verificado en el inventario'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-2 transition-colors duration-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>


        {/* Content */}
        <div className="max-h-[calc(95vh-140px)] overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
           
            {/* Estado del Bien */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="text-lg font-semibold text-gray-900">Estado del Bien</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {FOUND_STATUS_OPTIONS.map(option => {
                  const IconComponent = option.icon;
                  return (
                    <label
                      key={option.value}
                      className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        formData.foundStatus === option.value
                          ? `${option.color} border-2 shadow-md`
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="foundStatus"
                        value={option.value}
                        checked={formData.foundStatus === option.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <IconComponent className={`h-6 w-6 mb-2 ${formData.foundStatus === option.value ? '' : 'text-gray-400'}`} />
                      <span className="text-sm font-semibold">{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>


            {/* Información del Bien */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="text-lg font-semibold text-gray-900">Información del Bien</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bien (Asset) {detail && <span className="text-xs text-gray-500">(No editable)</span>}
                  </label>
                  {assets.length > 0 ? (
                    <select
                      name="assetId"
                      value={formData.assetId}
                      onChange={handleChange}
                      disabled={!!detail}
                      className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                        detail ? 'bg-gray-100 cursor-not-allowed text-gray-600' : 'hover:border-gray-300'
                      }`}
                    >
                      <option value="">Seleccionar bien...</option>
                      {assets.map(asset => (
                        <option key={asset.id} value={asset.id}>
                          {asset.name || asset.code || asset.id}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="assetId"
                      value={formData.assetId}
                      onChange={handleChange}
                      disabled={!!detail}
                      placeholder="ID del bien (opcional)"
                      className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                        detail ? 'bg-gray-100 cursor-not-allowed text-gray-600' : 'hover:border-gray-300'
                      }`}
                    />
                  )}
                </div>


                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estado de Conservación *
                  </label>
                  <select
                    name="actualConservationStatus"
                    value={formData.actualConservationStatus}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200 ${
                      errors.actualConservationStatus
                        ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-200 hover:border-gray-300 focus:ring-blue-500 focus:border-transparent'
                    }`}
                  >
                    <option value="">Seleccionar...</option>
                    {CONSERVATION_STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.actualConservationStatus && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.actualConservationStatus}
                    </p>
                  )}
                </div>
              </div>
            </div>


            {/* Ubicación y Responsable */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <MapPinIcon className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="text-lg font-semibold text-gray-900">Ubicación y Responsable</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ubicación Actual *
                  </label>
                  {locations.length > 0 ? (
                    <>
                      <select
                        name="actualLocationId"
                        value={formData.actualLocationId}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200 ${
                          errors.actualLocationId
                            ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-200 hover:border-gray-300 focus:ring-blue-500 focus:border-transparent'
                        }`}
                      >
                        <option value="">Seleccionar...</option>
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                      </select>
                      {errors.actualLocationId && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                          {errors.actualLocationId}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.actualLocationId}
                        disabled
                        placeholder="No hay ubicaciones disponibles"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm bg-gray-100 cursor-not-allowed text-gray-600"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Responsable Actual *
                  </label>
                  {users.length > 0 ? (
                    <>
                      <select
                        name="actualResponsibleId"
                        value={formData.actualResponsibleId}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200 ${
                          errors.actualResponsibleId
                            ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-200 hover:border-gray-300 focus:ring-blue-500 focus:border-transparent'
                        }`}
                      >
                        <option value="">Seleccionar...</option>
                        {users.map(person => (
                          <option key={person.id} value={person.id}>
                            {`${person.firstName || ''} ${person.lastName || ''}`.trim()
                              || person.fullName
                              || person.nombre
                              || person.name
                              || person.username
                              || person.personalEmail
                              || 'Sin nombre'}
                          </option>
                        ))}
                      </select>
                      {errors.actualResponsibleId && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                          {errors.actualResponsibleId}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.actualResponsibleId}
                        disabled
                        placeholder="No hay usuarios disponibles"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm bg-gray-100 cursor-not-allowed text-gray-600"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>


            {/* Verificación */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <CalendarIcon className="h-5 w-5 text-purple-600 mr-2" />
                <h4 className="text-lg font-semibold text-gray-900">Verificación</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha de Verificación * <span className="text-xs text-gray-500">(Automática - No editable)</span>
                  </label>
                  <input
                    type="date"
                    name="verificationDate"
                    value={formData.verificationDate}
                    disabled={true}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm bg-gray-100 cursor-not-allowed text-gray-600 font-semibold"
                  />
                  {errors.verificationDate && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.verificationDate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    name="observations"
                    value={formData.observations}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Observaciones sobre el bien..."
                    className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200 resize-none ${
                      errors.observations
                        ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-200 hover:border-gray-300 focus:ring-blue-500 focus:border-transparent'
                    }`}
                  />
                  {errors.observations && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.observations}
                    </p>
                  )}
                </div>
              </div>
            </div>


            {/* Acción Requerida */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mr-2" />
                <h4 className="text-lg font-semibold text-gray-900">Acción Correctiva</h4>
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="requiresAction"
                    checked={formData.requiresAction}
                    onChange={handleChange}
                    className="h-5 w-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Requiere acción correctiva
                  </span>
                </label>


                {formData.requiresAction && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Descripción de la Acción Requerida *
                    </label>
                    <textarea
                      name="requiredAction"
                      value={formData.requiredAction}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Describir la acción requerida..."
                      className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200 resize-none ${
                        errors.requiredAction
                          ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 hover:border-gray-300 focus:ring-blue-500 focus:border-transparent'
                      }`}
                    />
                    {errors.requiredAction && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                        {errors.requiredAction}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>


            {/* Diferencias */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <InformationCircleIcon className="h-5 w-5 text-gray-600 mr-2" />
                <h4 className="text-lg font-semibold text-gray-900">Diferencias Encontradas</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Diferencias Físicas
                  </label>
                  <textarea
                    name="physicalDifferences"
                    value={formData.physicalDifferences}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Diferencias encontradas..."
                    className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200 resize-none ${
                      errors.physicalDifferences
                        ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-200 hover:border-gray-300 focus:ring-blue-500 focus:border-transparent'
                    }`}
                  />
                  {errors.physicalDifferences && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.physicalDifferences}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Diferencias Documentales
                  </label>
                  <textarea
                    name="documentDifferences"
                    value={formData.documentDifferences}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Diferencias en documentos..."
                    className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200 resize-none ${
                      errors.documentDifferences
                        ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-200 hover:border-gray-300 focus:ring-blue-500 focus:border-transparent'
                    }`}
                  />
                  {errors.documentDifferences && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.documentDifferences}
                    </p>
                  )}
                </div>
              </div>
            </div>


            {/* Fotografías */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <CameraIcon className="h-5 w-5 text-cyan-600 mr-2" />
                <h4 className="text-lg font-semibold text-gray-900">Fotografías</h4>
              </div>
             
              {/* Upload area */}
              <div className="mb-4">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <CameraIcon className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Clic para subir</span> o arrastra las imágenes
                    </p>
                    <p className="text-xs text-gray-500">JPG, PNG, GIF, WebP (MAX. 5MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.gif,.webp"
                    multiple
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>


              {/* Preview de fotos */}
              {formData.photographs && formData.photographs.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.photographs.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo.data || photo}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>


            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg"
              >
                {detail ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
