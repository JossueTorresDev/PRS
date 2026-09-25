import { supabase } from './supabaseClient';

/**
 * Sube un archivo a Supabase Storage
 * @param {File} file - Archivo a subir
 * @param {string} folder - Carpeta destino (ej: 'mantenimiento', 'patrimonio')
 * @returns {Promise<{url: string, path: string}>} URL pública y path del archivo
 */
export const uploadFile = async (file, folder = 'mantenimiento') => {
  try {
    if (!supabase) {
      console.error('❌ Supabase client no está inicializado. Verifica las variables de entorno.');
      throw new Error('Error de configuración: Supabase no está disponible. Verifica VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
    }

    if (!file) {
      throw new Error('No se proporcionó ningún archivo');
    }

    // Validar tipo de archivo (imágenes y PDFs)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, GIF, WEBP) y PDF');
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('El archivo es demasiado grande. Tamaño máximo: 5MB');
    }

    // Generar nombre único
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    console.log('📤 Subiendo archivo:', fileName);

    // Subir archivo a Supabase Storage
    const { data, error } = await supabase.storage
      .from('urls-sipreb')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('❌ Error al subir archivo:', error);
      throw new Error(`Error al subir archivo: ${error.message}`);
    }

    console.log('✅ Archivo subido exitosamente:', data.path);

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('urls-sipreb')
      .getPublicUrl(filePath);

    console.log('🔗 URL pública generada:', publicUrl);

    return {
      url: publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error('❌ Error en uploadFile:', error);
    throw error;
  }
};

/**
 * Elimina un archivo de Supabase Storage
 * @param {string} filePath - Path del archivo a eliminar
 * @returns {Promise<boolean>} True si se eliminó correctamente
 */
export const deleteFile = async (filePath) => {
  try {
    if (!filePath) {
      throw new Error('No se proporcionó la ruta del archivo');
    }

    console.log('🗑️ Eliminando archivo:', filePath);

    const { error } = await supabase.storage
      .from('urls-sipreb')
      .remove([filePath]);

    if (error) {
      console.error('❌ Error al eliminar archivo:', error);
      throw new Error(`Error al eliminar archivo: ${error.message}`);
    }

    console.log('✅ Archivo eliminado exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error en deleteFile:', error);
    throw error;
  }
};

/**
 * Obtiene la URL pública de un archivo
 * @param {string} filePath - Path del archivo
 * @returns {string} URL pública
 */
export const getPublicUrl = (filePath) => {
  if (!filePath) return '';

  const { data: { publicUrl } } = supabase.storage
    .from('urls-sipreb')
    .getPublicUrl(filePath);

  return publicUrl;
};
