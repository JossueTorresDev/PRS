# Reportes de Municipalidades - ms-01-tenant-management

## Estructura

```
ms-01-tenant-management/
├── reports/
│   └── MunicipalidadesReport.jsx          # Componentes de reportes
├── hooks/
│   └── useMunicipalidadReports.js         # Hook personalizado
└── ...
```

## Uso

### 1. En un componente React

```jsx
import { useMunicipalidadReports } from './hooks/useMunicipalidadReports';

function MunicipalidadesList({ municipalidades }) {
  const { generateListReport } = useMunicipalidadReports();

  return (
    <div>
      <button>
        {generateListReport(municipalidades, {
          title: 'Reporte de Municipalidades',
          subtitle: 'Listado general del sistema',
          entity: 'Municipalidad de San Luis',
          office: 'Gestión de Tenientes'
        })}
      </button>
    </div>
  );
}
```

### 2. Reporte detallado de una municipalidad

```jsx
import { useMunicipalidadReports } from './hooks/useMunicipalidadReports';

function MunicipalidadDetailModal({ municipalidad }) {
  const { generateDetailReport } = useMunicipalidadReports();

  return (
    <button>
      {generateDetailReport(municipalidad, {
        title: 'Ficha de Municipalidad',
        subtitle: 'Información completa'
      })}
    </button>
  );
}
```

### 3. Uso directo del componente de PDF

```jsx
import { MunicipalidadesReportDocument } from './reports/MunicipalidadesReport';
import { PDFViewer } from '@react-pdf/renderer';

function ReportPreview({ municipalidades }) {
  return (
    <PDFViewer width="100%" height="600">
      <MunicipalidadesReportDocument 
        municipalidades={municipalidades}
        meta={{ title: 'Mi Reporte' }}
      />
    </PDFViewer>
  );
}
```

## Componentes Disponibles

### `MunicipalidadesReportDocument`
- **Tipo:** Listado general de municipalidades
- **Props:**
  - `municipalidades` (array): Lista de municipalidades
  - `meta` (object): Metadatos del reporte (title, subtitle, entity, office)

### `MunicipalidadDetailReportDocument`
- **Tipo:** Ficha detallada de una municipalidad
- **Props:**
  - `municipalidad` (object): Datos de la municipalidad
  - `meta` (object): Metadatos del reporte

## Estructura de Datos

### Municipalidad
```javascript
{
  id: string,
  nombre: string,
  ruc: string,
  tipo: string,
  ubigeo: string,
  departamento: string,
  provincia: string,
  distrito: string,
  direccion: string,
  telefono: string,
  celular: string,
  email: string,
  website: string,
  alcalde: string,
  activo: boolean
}
```

## Optimizaciones Aplicadas

✅ Font: `Times` (más liviano que Helvetica)
✅ Paddings reducidos (máximo peso)
✅ Colores sólidos sin gradientes
✅ Tamaños de fuente optimizados

**Peso esperado por reporte:** 20-50 KB

## Personalización

Para cambiar estilos, edita `localStyles` en `MunicipalidadesReport.jsx`.

Para cambiar colores institucionales, usa la paleta en `@/shared/reports`:
```javascript
import { COLORS } from '@/shared/reports';
```

Los colores disponibles son:
- `COLORS.NAVY` - Azul oscuro principal
- `COLORS.BRAND` - Azul secundario
- `COLORS.SLATE_*` - Grises variados
- `COLORS.CYAN` - Cian
- `COLORS.WHITE` - Blanco
