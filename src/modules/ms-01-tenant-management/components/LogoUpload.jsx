import React, { useState, useEffect, useRef } from 'react';
import { uploadLogo } from '../services/municipalidadService';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

const LogoUpload = ({ initialLogoUrl, onUploadComplete }) => {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const blobUrlRef = useRef(null);

  const revokeBlobUrl = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  };

  useEffect(() => {
    setLogoUrl(initialLogoUrl || null);
    return revokeBlobUrl;
  }, [initialLogoUrl]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Solo se permiten imágenes JPG, PNG o WEBP');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('La imagen no debe superar los 5MB');
      return;
    }

    revokeBlobUrl();
    const previewUrl = URL.createObjectURL(file);
    blobUrlRef.current = previewUrl;
    setLogoUrl(previewUrl);

    setError(null);
    setUploading(true);

    try {
      const publicUrl = await uploadLogo(file);
      if (onUploadComplete) onUploadComplete(publicUrl);
    } catch (err) {
      setLogoUrl(null);
      setError(err.message || 'Error al subir el logo');
    } finally {
      setUploading(false);
    }
  };

  const inputRef = useRef(null);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-sky-400 transition-colors relative"
        onClick={() => inputRef.current?.click()}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
        ) : (
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
            <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="text-xs text-sky-600 hover:text-sky-800 font-medium disabled:opacity-50"
      >
        {uploading ? 'Subiendo...' : logoUrl ? 'Cambiar logo' : 'Subir logo'}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default LogoUpload;
