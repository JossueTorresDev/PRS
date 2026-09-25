import React, { useRef } from 'react';
import { useFileUpload } from '../hooks/useFileUpload';

const FILE_ICONS = {
  pdf: '📄',
  doc: '📝',
  docx: '📝',
  xls: '📊',
  xlsx: '📊',
  image: '🖼️',
};

const getIcon = (fileType) => {
  if (!fileType) return '📎';
  if (fileType.includes('pdf')) return FILE_ICONS.pdf;
  if (fileType.includes('word') || fileType.includes('doc')) return FILE_ICONS.doc;
  if (fileType.includes('excel') || fileType.includes('sheet')) return FILE_ICONS.xls;
  if (fileType.includes('image')) return FILE_ICONS.image;
  return '📎';
};

const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function FileUploader({
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  maxFiles = 5,
  maxSizeMB = 5,
  multiple = true,
  label = 'Adjuntar archivos',
  hint = null,
  onUploaded = null,
  className = '',
}) {
  const inputRef = useRef(null);
  const { files, uploading, error, addFiles, removeFile, setError } = useFileUpload({ maxFiles, onUploaded });

  const handleChange = async (e) => {
    const selected = Array.from(e.target.files);
    const oversized = selected.filter(f => f.size > maxSizeMB * 1024 * 1024);
    if (oversized.length > 0) {
      setError(`Archivos muy grandes. Tamaño máximo: ${maxSizeMB}MB`);
      e.target.value = '';
      return;
    }
    await addFiles(selected);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    handleChange({ target: { files: dropped } });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleChange}
          className="hidden"
          disabled={uploading}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-blue-600 font-medium">Subiendo archivo...</p>
          </div>
        ) : (
          <>
            <svg className="mx-auto h-10 w-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-sm text-slate-600">{label}</p>
            {hint ? (
              <p className="text-xs text-slate-500 mt-1">{hint}</p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">
                {accept.replace(/,/g, ', ')} (máx. {maxSizeMB}MB por archivo)
              </p>
            )}
          </>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 border border-slate-200"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">{getIcon(file.fileType)}</span>
                <span className="text-sm text-slate-700 truncate">{file.fileName}</span>
                <span className="text-xs text-slate-400">{formatSize(file.fileSize)}</span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                className="text-red-500 hover:text-red-700 transition p-1 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
