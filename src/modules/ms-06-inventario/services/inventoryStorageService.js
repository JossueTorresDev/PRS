import { uploadFile as sharedUpload } from '../../../shared/services/storageService';


/**
 * Convierte base64 a Blob
 * @param {string} base64 - Data URL (data:image/jpeg;base64,...)
 * @returns {Blob}
 */
const base64ToBlob = (base64) => {
  try {
    const parts = base64.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(parts[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    return new Blob([u8arr], { type: mimeType });
  } catch (error) {
    console.error('Error al convertir base64 a blob:', error);
    throw new Error('No se pudo procesar la fotografía');
  }
};


/**
 * Sube una foto individual
 * @param {string} photoBase64 - Data URL o string base64
 * @param {string} inventoryId - ID del inventario
 * @param {string} detailId - ID del detalle
 * @param {number} photoIndex - Índice de la foto
 * @returns {Promise<{success: boolean, url: string | null, error: string | null}>}
 */
export const uploadInventoryPhoto = async (photoBase64, inventoryId, detailId, photoIndex) => {
  try {
    // Si ya es una URL (no es base64), no subir
    if (photoBase64.startsWith('http://') || photoBase64.startsWith('https://')) {
      console.log(`      ℹ️  Foto ya está en URL (no requiere upload)`);
      return { success: true, url: photoBase64, error: null };
    }


    console.log(`      ⏳ Procesando fotografía...`);


    // Convertir base64 a blob
    const blob = base64ToBlob(photoBase64);
    console.log(`      📊 Tamaño del archivo: ${(blob.size / 1024).toFixed(2)} KB`);
   
    // Generar nombre único
    const timestamp = Date.now();
    const fileName = `inventory_${inventoryId}_detail_${detailId}_photo_${photoIndex}_${timestamp}.jpg`;
    console.log(`      📝 Nombre del archivo: ${fileName}`);
   
    // Crear archivo File para subir
    const file = new File([blob], fileName, { type: 'image/jpeg' });


    console.log(`      🚀 Iniciando upload al storage...`);


    // Subir a storage
    const result = await sharedUpload(file);


    if (result.success) {
      console.log(`      ✅ Upload exitoso`);
      return { success: true, url: result.url, error: null };
    } else {
      console.log(`      ❌ Upload fallido: ${result.error}`);
      return { success: false, url: null, error: result.error || 'Error al subir fotografía' };
    }
  } catch (error) {
    console.error(`      ❌ Error en uploadInventoryPhoto:`, error);
    return { success: false, url: null, error: error.message || 'Error al procesar fotografía' };
  }
};


/**
 * Sube todas las fotos de todos los detalles de un inventario
 * @param {Array} details - Array de detalles con fotografías
 * @param {string} inventoryId - ID del inventario
 * @returns {Promise<{successCount: number, failedCount: number, detailsUpdated: Array, errors: Array, uploadSummary: Array}>}
 */
export const uploadAllInventoryPhotos = async (details, inventoryId) => {
  let successCount = 0;
  let failedCount = 0;
  const detailsUpdated = [];
  const errors = [];
  const uploadSummary = []; // Registro de cada foto subida


  console.log(`\n${'='.repeat(60)}`);
  console.log(`📷 INICIANDO SUBIDA DE FOTOS - Inventario: ${inventoryId}`);
  console.log(`📦 Total de detalles con fotos: ${details.length}`);
  console.log(`${'='.repeat(60)}\n`);


  for (const detail of details) {
    try {
      if (!detail.photographs || detail.photographs.length === 0) {
        console.log(`⏭️  Detalle ${detail.id}: Sin fotos (saltado)`);
        detailsUpdated.push({
          id: detail.id,
          photographs: []
        });
        continue;
      }


      console.log(`\n📋 Detalle: ${detail.id}`);
      console.log(`   Total de fotos: ${detail.photographs.length}`);


      const updatedPhotographs = [];


      for (let i = 0; i < detail.photographs.length; i++) {
        const photo = detail.photographs[i];
        const photoData = photo.data || photo;
        const photoName = photo.name || `photo_${i + 1}.jpg`;


        console.log(`   📸 Foto ${i + 1}/${detail.photographs.length}: ${photoName}`);


        // Subir foto
        const uploadResult = await uploadInventoryPhoto(
          photoData,
          inventoryId,
          detail.id,
          i
        );


        if (uploadResult.success) {
          console.log(`      ✅ ÉXITO`);
          console.log(`      🔗 URL: ${uploadResult.url.substring(0, 80)}...`);
         
          updatedPhotographs.push({
            name: photoName,
            data: uploadResult.url, // Ahora es una URL real
            type: photo.type || 'image/jpeg',
            uploadedAt: photo.uploadedAt || new Date().toISOString(),
            uploadedToStorageAt: new Date().toISOString()
          });


          uploadSummary.push({
            detailId: detail.id,
            photoIndex: i,
            photoName: photoName,
            status: 'SUCCESS',
            url: uploadResult.url,
            timestamp: new Date().toISOString()
          });


          successCount++;
        } else {
          console.log(`      ❌ FALLO: ${uploadResult.error}`);
         
          failedCount++;
          errors.push({
            detailId: detail.id,
            photoIndex: i,
            photoName: photoName,
            error: uploadResult.error
          });


          uploadSummary.push({
            detailId: detail.id,
            photoIndex: i,
            photoName: photoName,
            status: 'FAILED',
            error: uploadResult.error,
            timestamp: new Date().toISOString()
          });


          // Mantener la foto en base64 si falla
          updatedPhotographs.push(photo);
        }
      }


      detailsUpdated.push({
        id: detail.id,
        photographs: updatedPhotographs
      });
    } catch (error) {
      console.error(`❌ Error procesando detalle ${detail.id}:`, error);
      failedCount += (detail.photographs?.length || 0);
      errors.push({
        detailId: detail.id,
        error: error.message
      });
      // Mantener detalles sin cambios si hay error
      detailsUpdated.push({
        id: detail.id,
        photographs: detail.photographs || []
      });
    }
  }


  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 RESUMEN DE SUBIDA`);
  console.log(`✅ Exitosas: ${successCount}`);
  console.log(`❌ Fallidas: ${failedCount}`);
  console.log(`📦 Total procesadas: ${successCount + failedCount}`);
  console.log(`${'='.repeat(60)}\n`);


  // Log del resumen completo
  console.log(`📋 DETALLE COMPLETO DE UPLOADS:\n`);
  console.table(uploadSummary);
  console.log(`\n`);


  return {
    successCount,
    failedCount,
    detailsUpdated,
    errors,
    uploadSummary // Nuevo: registro detallado de cada upload
  };
};


