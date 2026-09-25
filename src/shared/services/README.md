# 📁 Servicio de Almacenamiento (vg-ms-storage)

## Ubicación

```
src/shared/services/storageService.js    → Llamadas HTTP al Storage MS
src/shared/hooks/useFileUpload.js        → Hook con estado (recomendado)
src/shared/components/FileUploader.jsx   → Componente UI rápido
```

---

## 🏆 Forma recomendada: Hook `useFileUpload`

### Importar

```js
import { useFileUpload } from '../../../shared/hooks/useFileUpload';
```

### Usar

```jsx
function MiComponente() {
  const { files, uploading, error, addFiles, removeFile, reset } = useFileUpload({
    maxFiles: 5,
    onUploaded: (file) => console.log('Archivo subido:', file),
  });

  return (
    <div>
      <input type="file" multiple onChange={(e) => addFiles(e.target.files)} />

      {uploading && <p>Subiendo...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {files.map(f => (
        <div key={f.id}>
          <span>{f.fileName}</span>
          <button onClick={() => removeFile(f.id)}>Eliminar</button>
        </div>
      ))}
    </div>
  );
}
```

### API del hook

| Propiedad     | Tipo       | Descripción                              |
|---------------|------------|------------------------------------------|
| `files`       | `Array`    | Archivos subidos `[{ id, fileName, fileSize, fileType, url, storageFileName }]` |
| `uploading`   | `boolean`  | `true` mientras sube                     |
| `error`       | `string`   | Mensaje de error o `null`                |
| `addFiles`    | `fn(FileList)` | Sube uno o varios archivos           |
| `removeFile`  | `fn(id)`   | Elimina archivo del storage y del estado |
| `reset`       | `fn()`     | Limpia todo                              |

---

## ⚡ Forma rápida: Componente `<FileUploader>`

```jsx
import FileUploader from '../../../shared/components/FileUploader';

<FileUploader
  accept=".pdf,.jpg,.png"
  maxFiles={3}
  maxSizeMB={5}
  onUploaded={(file) => setUrl(file.url)}
/>
```

Props: `accept`, `maxFiles`, `maxSizeMB`, `multiple`, `label`, `hint`, `onUploaded`, `className`

---

## 🔧 Forma directa: `storageService`

```js
import { uploadFile, deleteFile, getFileUrl, getFileInfo, uploadMultipleFiles } from '../../../shared/services/storageService';

// Subir
const { success, url, fileName } = await uploadFile(file);

// Eliminar
await deleteFile(fileName);

// Obtener URL firmada (renovar cuando expire)
const { url: freshUrl } = await getFileUrl(fileName);

// Obtener info del archivo
const { info } = await getFileInfo(fileName);
```

---

## 📦 Módulos que ya lo usan

- **Patrimonio** (`ms-04-patrimonio`): `uploadService.js` → importa `storageService`
- **Movements** (`ms-05-movements`): `movementDocumentStorage.js` → importa `storageService`
- **Inventario** (`ms-06-inventario`): Usa `supabaseStorage.js` (pendiente de migrar)

Para migrar cualquiera de esos, solo reemplaza:
```js
// ANTES (Supabase)
import { uploadFile } from '../../shared/utils/supabaseStorage';
await uploadFile(file, 'carpeta');

// DESPUÉS (Storage MS)
import { uploadFile } from '../../shared/services/storageService';
const { url, fileName } = await uploadFile(file);
```
