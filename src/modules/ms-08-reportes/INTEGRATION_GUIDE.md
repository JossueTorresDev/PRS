# MS-08-REPORTES - Guía de Integración

## 🎯 Qué es este módulo

Este es el módulo **ms-08-reportes** del frontend SIPREB que se conecta con el backend `vg-ms-reports`.

**Funciones:**
- ✅ Mostrar resumen de reportes (totales, activos, completados)
- ✅ Listar activos con paginación
- ✅ Filtrar activos por categoría o ubicación
- ✅ Exportar reportes en Excel, PDF y CSV
- ✅ Correlación de requests para tracing distribuido

---

## 📊 Flujo de datos

```
┌──────────────────────────────────────────┐
│         PÁGINA DE REPORTES               │
│  (src/modules/ms-08-reportes/pages/)     │
└──────────────┬───────────────────────────┘
               │
      ┌────────┴─────────┐
      ↓                   ↓
┌───────────────┐  ┌──────────────────┐
│ useReports() │──→│ reportService.js │
│  (Hook)      │  │  (Llamadas HTTP) │
└───────────────┘  └────────┬─────────┘
      ↑                      │
      │                      ↓
      └──────────────────────────────────────┐
                                  │
                    ┌─────────────┴──────────────┐
                    ↓                             ↓
            ┌──────────────────────┐    ┌──────────────────────┐
            │   BACKEND (Java)     │    │   COMPONENTES REACT  │
            │ vg-ms-reports:5008   │    │ ReportSummary        │
            ├──────────────────────┤    │ AssetsList           │
            │ GET /api/reports/... │    │ AssetFilters         │
            │ GET /api/reports/... │    │ ExportButtons        │
            │ GET /api/reports/... │    └──────────────────────┘
            └──────────────────────┘
```

---

## 📁 Estructura de archivos

```
ms-08-reportes/
│
├── pages/
│   └── index.jsx                    → Página principal (integra todo)
│
├── hooks/
│   └── useReports.js                → Hook personalizado (estado + acciones)
│
├── components/
│   ├── ReportSummary.jsx            → Tarjetas de estadísticas
│   ├── AssetsList.jsx               → Tabla de activos con paginación
│   ├── AssetFilters.jsx             → Filtros por categoría/ubicación
│   └── ExportButtons.jsx            → Botones Excel/PDF/CSV
│
├── services/
│   └── reportService.js             → Llamadas HTTP al backend
│
└── README.md                        → Este archivo
```

---

## 🔄 Cómo funciona

### **1. Página Principal (index.jsx)**
```jsx
// Usa el hook useReports
const { summary, assets, loading, error, getSummary, getAssets, ... } = useReports();

// Al cargar, obtiene datos iniciales
useEffect(() => {
  getSummary();        // Obtiene estadísticas
  getAssets();         // Obtiene lista de activos
}, []);
```

### **2. Hook useReports (useReports.js)**
```jsx
// Funciones disponibles:
- getSummary()                           // GET /api/reports/summary
- getAssets(category, page, size)        // GET /api/reports/assets
- getAssetsByLocation(location, page)    // GET /api/reports/assets/location
- getReportPreview(reportId)             // GET /api/reports/preview
- downloadExcel(reportId)                // GET /api/reports/export/excel
- downloadPdf(reportId)                  // GET /api/reports/export/pdf
- downloadCsv(reportId)                  // GET /api/reports/export/csv

// Estado disponible:
- summary                  // Datos de resumen
- assets                   // Lista de activos
- currentPage             // Página actual
- totalPages              // Total de páginas
- total                   // Total de registros
- loading                 // ¿Cargando?
- error                   // Mensaje de error (si hay)
```

### **3. Service (reportService.js)**
```jsx
// Hace las llamadas HTTP reales
- fetchReportsSummary()
- fetchAssets(category, page, size)
- fetchAssetsByLocation(location, page, size)
- fetchReportPreview(reportId)
- downloadReportExcel(reportId)
- downloadReportPdf(reportId)
- downloadReportCsv(reportId)

// Características:
✅ Genera Correlation IDs automáticamente
✅ Maneja errores HTTP
✅ Descarga archivos binarios
```

### **4. Componentes (components/)**

#### **ReportSummary.jsx**
```jsx
<ReportSummary 
  summary={summary}      // {totalReports, activeReports, completedReports}
  loading={loading}      // Muestra skeleton while loading
  error={error}          // Muestra error si falla
/>
```

#### **AssetsList.jsx**
```jsx
<AssetsList
  assets={assets}        // Array de activos a mostrar
  loading={loading}      // Skeleton loading
  error={error}          // Mensaje de error
  currentPage={page}     // Página actual
  totalPages={pages}     // Total de páginas
  onPageChange={fn}      // Callback cuando cambia página
/>
```

#### **AssetFilters.jsx**
```jsx
<AssetFilters
  onCategoryChange={fn}   // Callback: (category, page) => ...
  onLocationChange={fn}   // Callback: (location, page) => ...
  onFilterReset={fn}      // Callback: () => ... (limpiar filtros)
/>
```

#### **ExportButtons.jsx**
```jsx
<ExportButtons
  reportId={id}              // ID del reporte a exportar
  onDownloadExcel={fn}       // Callback: (reportId) => ...
  onDownloadPdf={fn}         // Callback: (reportId) => ...
  onDownloadCsv={fn}         // Callback: (reportId) => ...
  loading={loading}          // Desactiva botones mientras carga
/>
```

---

## 🚀 Cómo iniciar

### **1. Asegurate que el Backend esté corriendo:**
```bash
cd /home/erikyalli/PRS/vg-ms-reports
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"
```

El backend debe estar en: `http://localhost:5008`

### **2. Inicia el Frontend:**
```bash
cd /home/erikyalli/PRS/vg-web-sipreb
npm run dev
```

El frontend estará en: `http://localhost:5173` (o el puerto que uses)

### **3. Navega al módulo de Reportes:**
- En la interfaz, haz clic en "Reportes" o navega a `/reportes`

---

## 🔌 Endpoints del Backend

| Endpoint | Método | Parámetros | Response |
|----------|--------|-----------|----------|
| `/api/reports/summary` | GET | — | `{totalReports, activeReports, completedReports}` |
| `/api/reports/preview` | GET | `reportId` | `{id, name, data, status, ...}` |
| `/api/reports/assets` | GET | `category`, `page`, `size` | `{data, page, total, totalPages}` |
| `/api/reports/assets/location` | GET | `location`, `page`, `size` | `{data, page, total, totalPages}` |
| `/api/reports/export/excel` | GET | `reportId` | Archivo .xlsx (blob) |
| `/api/reports/export/pdf` | GET | `reportId` | Archivo .pdf (blob) |
| `/api/reports/export/csv` | GET | `reportId` | Archivo .csv (blob) |

**Ver documentación completa en:** `/home/erikyalli/PRS/vg-ms-reports/API_DOCUMENTATION.md`

---

## 🔍 Debugging

### **Ver qué se está llamando:**
```javascript
// En reportService.js, descomenta para ver las llamadas:
console.log('Llamando a:', url.toString());
console.log('Headers:', getHeaders());
```

### **Ver el estado del hook:**
```jsx
console.log('Loading:', loading);
console.log('Error:', error);
console.log('Assets:', assets);
console.log('Summary:', summary);
```

### **Verificar CORS:**
Si obtienes errores de CORS, el backend debe estar configurado para permitir el frontend:
```properties
# En application-dev.properties del backend
spring.web.cors.allowed-origins=http://localhost:5173,http://localhost:3000
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
```

---

## 📝 Ejemplos de Uso

### **Obtener resumen en un componente personalizado:**
```jsx
import { useReports } from './hooks/useReports';

function MiComponente() {
  const { summary, loading, getSummary } = useReports();
  
  useEffect(() => {
    getSummary();
  }, []);
  
  return (
    <div>
      Total: {summary?.totalReports}
    </div>
  );
}
```

### **Exportar reporte:**
```jsx
const { downloadExcel } = useReports();

const handleExport = async () => {
  try {
    await downloadExcel('report-id-123');
    // El archivo se descarga automáticamente
  } catch (error) {
    console.error('Error:', error);
  }
};

return <button onClick={handleExport}>Descargar Excel</button>;
```

### **Filtrar activos:**
```jsx
const { getAssets } = useReports();

const handleFilterByCategory = async (category) => {
  await getAssets(category, 0, 20);  // Página 0, 20 resultados
};
```

---

## ⚙️ Configuración

### **Variable de entorno (Vite):**
En `.env`:
```
VITE_REPORTS_API_URL=http://localhost:5008
```

O usa el valor por defecto en `reportService.js`:
```javascript
const REPORTS_BASE_URL = 
  import.meta.env.VITE_REPORTS_API_URL || "http://localhost:5008";
```

---

## 🐛 Errores comunes

### **"Error 404 obteniendo resumen de reportes"**
- ✅ Verifica que el backend está corriendo en `http://localhost:5008`
- ✅ Verifica que la URL es correcta (sin `/api/v1/`)

### **"CORS error"**
- ✅ Configura CORS en el backend (ver arriba)
- ✅ Verifica que la URL de origen coincide con el frontend

### **"Correlation ID header error"**
- ✅ Es normal, el header es generado automáticamente por el service
- ✅ Solo es para tracing distribuido, no es requerido

### **Botones de exportación no funcionan**
- ✅ Verifica que tienes un `reportId` válido
- ✅ Verifica que el backend está respondiendo a `/api/reports/export/excel`

---

## 🎨 Personalización

### **Cambiar colores:**
Todos los componentes usan Tailwind CSS. Busca `bg-blue-500`, `text-green-700`, etc.

### **Agregar más filtros:**
Edita `AssetFilters.jsx` y agrega más opciones a `categories` o `locations`.

### **Cambiar tamaño de página:**
En `index.jsx`, cambia el `20` por otro número:
```jsx
await getAssets(null, 0, 50);  // Mostrar 50 activos por página
```

---

## ✅ Checklist Final

- [ ] Backend corriendo en `http://localhost:5008`
- [ ] Frontend corriendo en `http://localhost:5173`
- [ ] Página de Reportes accesible desde la navegación
- [ ] Resumen de reportes se carga (muestra números)
- [ ] Lista de activos se muestra en tabla
- [ ] Filtros funcionan (cambiar categoría recarga tabla)
- [ ] Botones de exportación descargan archivos
- [ ] No hay errores en consola

---

## 📞 Soporte

Para problemas:
1. Revisa consola del navegador (F12 → Console)
2. Revisa logs del backend: `tail -f logs/application.log`
3. Verifica que `http://localhost:5008/actuator/health` responde
4. Verifica URLs en Swagger: `http://localhost:5008/swagger-ui.html`

---

**¡Listo para usar!** 🚀
