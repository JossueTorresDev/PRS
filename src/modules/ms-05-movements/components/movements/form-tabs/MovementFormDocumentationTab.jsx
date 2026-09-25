import {
  TagIcon,
  DocumentDuplicateIcon,
  SparklesIcon,
  CloudArrowUpIcon,
  TrashIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { getFileIcon, formatFileSize, ALLOWED_FILE_ACCEPT, ALLOWED_FILE_TYPES_LABEL } from '../../../services/movementDocumentService';
import { SectionTitle, SubSectionTitle, FieldLabel, BRAND, ACCENT, ACCENT_LIGHT } from './formTabUi';

const fieldClass = (hasError, readOnly = false) =>
  `w-full px-4 py-3 border rounded-lg text-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-[#283447]/15 focus:border-[#283447] ${
    readOnly
      ? 'bg-gray-50 cursor-default border-gray-200 text-gray-600'
      : hasError
        ? 'border-red-400 bg-red-50/40'
        : 'border-gray-200 bg-white hover:border-gray-300'
  }`;

function FileRow({ icon, name, size, url, onRemove, disabled }) {
  return (
    <div className="group flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm hover:shadow-md hover:border-gray-200 transition-all">
      <span className="text-xl flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#283447] hover:underline truncate block"
          >
            {name}
          </a>
        ) : (
          <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">{size}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all flex-shrink-0 disabled:opacity-40"
        title="Eliminar archivo"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function MovementFormDocumentationTab({
  formData, errors, handleChange, checkingDocumentDuplicate,
  suggestedDocumentNumber, loadingSuggestedDoc, applySuggestedDocumentNumber, isEditing,
  selectedFiles, uploadedDocuments, uploadingFiles, uploadError, isDragging,
  fileInputRef, handleFileChange, handleDragEnter, handleDragLeave, handleDragOver, handleDrop,
  removeSelectedFile, removeUploadedDocument, saving,
}) {
  const totalFiles = selectedFiles.length + uploadedDocuments.length;
  const uploadDisabled = uploadingFiles || saving || totalFiles >= 10;

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gray-50/70 ring-1 ring-gray-200/80 p-5">
        <SectionTitle>Documentos de soporte</SectionTitle>

        <div className="rounded-xl bg-white ring-1 ring-gray-200/80 p-5 shadow-sm mb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel icon={TagIcon} required>
                Número de documento de soporte
              </FieldLabel>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="supportingDocumentNumber"
                  value={formData.supportingDocumentNumber}
                  onChange={handleChange}
                  maxLength={14}
                  className={fieldClass(errors.supportingDocumentNumber)}
                  placeholder="SI-2026-0001"
                />
                {!isEditing && suggestedDocumentNumber && (
                  <button
                    type="button"
                    onClick={applySuggestedDocumentNumber}
                    disabled={loadingSuggestedDoc || saving || !suggestedDocumentNumber}
                    title={loadingSuggestedDoc ? 'Calculando…' : `Usar ${suggestedDocumentNumber}`}
                    aria-label={loadingSuggestedDoc ? 'Calculando número sugerido' : `Usar número sugerido ${suggestedDocumentNumber}`}
                    className="shrink-0 px-3 rounded-lg border border-[#4a6fa5]/30 text-[#4a6fa5] hover:bg-[#e8eef5] disabled:opacity-40 transition-colors"
                  >
                    <SparklesIcon className={`h-4 w-4 ${loadingSuggestedDoc ? 'animate-pulse' : ''}`} />
                  </button>
                )}
              </div>
              {checkingDocumentDuplicate && (
                <p className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#283447] border-t-transparent" />
                  Verificando disponibilidad del número...
                </p>
              )}
              {errors.supportingDocumentNumber && (
                <p className="mt-1.5 text-sm text-red-600">{errors.supportingDocumentNumber}</p>
              )}
            </div>
            <div>
              <FieldLabel icon={DocumentDuplicateIcon} required>
                Tipo de documento de soporte
              </FieldLabel>
              <input
                type="text"
                name="supportingDocumentType"
                value={formData.supportingDocumentType}
                onChange={handleChange}
                maxLength={50}
                readOnly
                className={fieldClass(errors.supportingDocumentType, true)}
              />
              {errors.supportingDocumentType && (
                <p className="mt-1.5 text-sm text-red-600">{errors.supportingDocumentType}</p>
              )}
            </div>
          </div>
        </div>

        <SubSectionTitle>Archivos adjuntos</SubSectionTitle>

        <label
          className={`flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed cursor-pointer transition-all ${
            isDragging
              ? 'border-[#283447]/40 bg-[#283447]/5'
              : 'border-gray-300 bg-white/60 hover:bg-white hover:border-gray-400'
          } ${uploadDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: ACCENT_LIGHT }}>
              <CloudArrowUpIcon className="h-6 w-6" style={{ color: ACCENT }} />
            </div>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-800">Click para subir</span> o arrastra archivos
            </p>
            <p className="text-xs text-gray-400 mt-1">{ALLOWED_FILE_TYPES_LABEL} · Máx. 10 archivos, 10 MB c/u</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_FILE_ACCEPT}
            onChange={handleFileChange}
            disabled={uploadDisabled}
            className="hidden"
          />
        </label>

        {uploadingFiles && (
          <div className="mt-4 flex items-center gap-2.5 text-sm text-gray-600 py-1">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#283447] border-t-transparent" />
            Subiendo archivos...
          </div>
        )}

        {uploadError && (
          <p className="mt-4 text-sm text-red-600">{uploadError}</p>
        )}

        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <SubSectionTitle>Seleccionados ({selectedFiles.length})</SubSectionTitle>
            {selectedFiles.map((file, i) => (
              <FileRow
                key={i}
                icon={getFileIcon(file.type)}
                name={file.name}
                size={formatFileSize(file.size)}
                onRemove={() => removeSelectedFile(i)}
                disabled={uploadingFiles || saving}
              />
            ))}
          </div>
        )}

        {uploadedDocuments.length > 0 && (
          <div className={`space-y-2 ${selectedFiles.length > 0 ? 'mt-4' : 'mt-4'}`}>
            <SubSectionTitle>Subidos ({uploadedDocuments.length}/10)</SubSectionTitle>
            {uploadedDocuments.map((doc, i) => {
              const url = doc.fileUrl || doc.url;
              const name = doc.fileName || doc.name || 'Documento sin nombre';
              return (
                <FileRow
                  key={i}
                  icon={getFileIcon(doc.fileType || doc.type)}
                  name={name}
                  size={formatFileSize(doc.fileSize || doc.size || 0)}
                  url={url}
                  onRemove={() => removeUploadedDocument(i)}
                  disabled={uploadingFiles || saving}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl bg-gray-50/70 ring-1 ring-gray-200/80 p-5">
        <SectionTitle accent={ACCENT}>Configuración</SectionTitle>
        <label className="flex items-start gap-4 rounded-xl bg-white ring-1 ring-gray-200/80 p-4 shadow-sm cursor-pointer hover:ring-gray-300 transition-all">
          <input
            type="checkbox"
            name="requiresApproval"
            checked={formData.requiresApproval}
            onChange={handleChange}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#283447] focus:ring-[#283447]/20 cursor-pointer"
          />
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${BRAND}12` }}
            >
              <Cog6ToothIcon className="h-4 w-4" style={{ color: BRAND }} />
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-800">Requiere aprobación</span>
              <span className="block text-xs text-gray-500 mt-0.5">
                El movimiento necesitará ser aprobado antes de ejecutarse
              </span>
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
