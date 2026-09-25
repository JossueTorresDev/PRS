# 📄 Estándar SBN — Reportes PDF

> **`src/shared/reports/index.jsx`** es el archivo de estándar institucional para la generación de reportes PDF.
> No debe ser modificado sin autorización del equipo core.

---

## Índice

1. [¿Qué es y para qué sirve?](#1-qué-es-y-para-qué-sirve)
2. [Instalación / Importación](#2-instalación--importación)
3. [API Completa de Exportaciones](#3-api-completa-de-exportaciones)
   - [Componentes](#31-componentes)
   - [Colores (COLORS)](#32-colores-colors)
   - [Utilidades](#33-utilidades)
4. [Guía Rápida: Crear un Reporte Nuevo](#4-guía-rápida-crear-un-reporte-nuevo)
5. [Patrones de Diseño por Tipo de Reporte](#5-patrones-de-diseño-por-tipo-de-reporte)
   - [A. Reporte tipo Tabla (lista de registros)](#a-reporte-tipo-tabla-lista-de-registros)
   - [B. Reporte tipo Ficha / Acta (registro individual)](#b-reporte-tipo-ficha--acta-registro-individual)
   - [C. Reporte tipo Tarjeta (card-list agrupado)](#c-reporte-tipo-tarjeta-card-list-agrupado)
6. [Ejemplos Reales en el Proyecto](#6-ejemplos-reales-en-el-proyecto)
7. [Reglas del Estándar](#7-reglas-del-estándar)
8. [Carga del Logo](#8-carga-del-logo)
9. [Resolución de Datos (Data Fetching)](#9-resolución-de-datos-data-fetching)
10. [Errores Comunes y Soluciones](#10-errores-comunes-y-soluciones)
11. [Checklist de Integración](#11-checklist-de-integración)

---

## 1. ¿Qué es y para qué sirve?

`ReportPage` es un **wrapper estándar** que inyecta automáticamente en todo PDF:

-   **Watermark**: Marca de agua del logo municipal al 6% de opacidad.
-   **ReportHeader**: Logo a la izquierda, título + municipalidad a la derecha, línea inferior.
-   **ReportFooter**: Texto legal y copyright, posicionado al pie de página.

El desarrollador solo coloca el **contenido específico del módulo** (tablas, campos, firmas).

---

## 2. Instalación / Importación

```jsx
// Importar solo lo que necesitas
import { ReportPage } from '../../../shared/reports';

// Si necesitas colores o utilidades adicionales
import { ReportPage, COLORS, loadCompressedLogo, formatDate, formatCurrency } from '../../../shared/reports';
```

> Ruta base desde cualquier módulo: `../../../shared/reports`

---

## 3. API Completa de Exportaciones

### 3.1 Componentes

| Componente | Props | Descripción |
|---|---|---|
| **`ReportPage`** | `logo`, `title`, `subtitle`, `muniName`, `year?`, `size?`, `orientation?` | **Wrapper completo** — watermark + header + footer automáticos |
| `Watermark` | `logo` | Marca de agua (solo si usas Page manual, poco común) |
| `ReportHeader` | `logo`, `title`, `subtitle`, `muniName` | Encabezado del reporte |
| `ReportFooter` | `muniName`, `year` | Pie de página |

#### Props de `ReportPage` en detalle

| Prop | Tipo | Requerido | Default | Descripción |
|---|---|---|---|---|
| `logo` | `string` (base64) | ✅ Sí | — | Logo municipal optimizado (usar `loadCompressedLogo()`) |
| `title` | `string` | ✅ Sí | — | Título del reporte (ej: "Reporte General de Usuarios") |
| `subtitle` | `string` | ✅ Sí | — | Subtítulo (nombre de municipalidad o sistema) |
| `muniName` | `string` | ✅ Sí | — | Nombre de la municipalidad para el footer legal |
| `year` | `number` | ❌ No | `new Date().getFullYear()` | Año para el copyright |
| `size` | `string` | ❌ No | `"A4"` | Tamaño de página |
| `orientation` | `string` | ❌ No | — | `"portrait"` o `"landscape"` |

### 3.2 Colores (`COLORS`)

Para mantener coherencia visual entre todos los reportes del sistema:

```jsx
import { COLORS } from '../../../shared/reports';
```

| Variable | Valor | Uso típico |
|---|---|---|
| `COLORS.NAVY` | `#1a365d` | Headers de tabla, fondo de badges, títulos de sección |
| `COLORS.BRAND` | `#283447` | Bordes, texto secundario |
| `COLORS.SLATE_800` | `#1e293b` | Texto principal (valores de campo) |
| `COLORS.SLATE_600` | `#475569` | Texto secundario, descripciones |
| `COLORS.SLATE_400` | `#94a3b8` | Labels de campo (uppercase gris), placeholders |
| `COLORS.SLATE_200` | `#e2e8f0` | Bordes de tabla, separadores, fondos alternos |
| `COLORS.CYAN` | `#0891b2` | Acentos, enlaces |
| `COLORS.WHITE` | `#ffffff` | Fondo de tarjetas, texto sobre fondo oscuro |

### 3.3 Utilidades

| Función | Entrada | Salida | Descripción |
|---|---|---|---|
| `loadCompressedLogo(maxSize = 80)` | `number` (opcional) | `Promise<string>` | Carga el logo desde `sessionStorage`, lo redimensiona a `maxSize` px y devuelve base64 PNG |
| `formatDate(date)` | `Date \| string` | `"24 de mayo de 2026, 14:30"` | Fecha larga con hora |
| `formatShortDate(date)` | `Date \| string` | `"24 may. 2026"` | Fecha corta |
| `formatDateTime(date)` | `Date \| string` | `"24 de mayo de 2026, 14:30"` | Fecha + hora |
| `formatCurrency(value)` | `number` | `"S/ 150.00"` | Moneda soles peruanos |

---

## 4. Guía Rápida: Crear un Reporte Nuevo

### Paso 1: Crear archivo del reporte

Crea tu archivo dentro de la carpeta `reports/` de tu módulo:

```
src/modules/ms-XX-mi-modulo/reports/MiReporte.jsx
```

### Paso 2: Estructura base

```jsx
import { Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { ReportPage, COLORS } from '../../../shared/reports';

const styles = StyleSheet.create({
  // Tus estilos específicos del módulo
});

const MiReporte = ({ data = [], municipalityLogo, municipalityName }) => {
  return (
    <Document>
      <ReportPage
        logo={municipalityLogo}
        title="Título del Reporte"
        subtitle={municipalityName}
        muniName={municipalityName}
      >
        {/* Aquí va tu contenido: metadatos, tablas, tarjetas, firmas */}
      </ReportPage>
    </Document>
  );
};

export default MiReporte;
```

### Paso 3: Conectar desde la página del módulo

```jsx
import { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { loadCompressedLogo } from '../../../shared/reports';
import MiReporte from '../reports/MiReporte';

const MiPage = () => {
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    loadCompressedLogo(80).then(setLogo);
  }, []);

  return (
    <PDFDownloadLink
      document={
        <MiReporte
          data={miData}
          municipalityLogo={logo}
          municipalityName={municipalityName}
        />
      }
      fileName="reporte.pdf"
    >
      {({ loading }) => (loading ? 'Cargando...' : 'Descargar PDF')}
    </PDFDownloadLink>
  );
};
```

---

## 5. Patrones de Diseño por Tipo de Reporte

### A. Reporte tipo Tabla (lista de registros)

**Cuándo usarlo:** Listados nominales con muchos registros (usuarios, personas, activos, movimientos).

**Ejemplo:** `UserReport.jsx`, `PersonReport.jsx`, `AssetReport.jsx`

```jsx
import { Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { ReportPage, COLORS } from '../../../shared/reports';

const styles = StyleSheet.create({
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.SLATE_200,
  },
  metaLabel: {
    fontSize: 7,
    color: COLORS.SLATE_400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
    color: COLORS.SLATE_800,
    fontWeight: 'bold',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.NAVY,
    paddingVertical: 6,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    paddingHorizontal: 6,
    color: '#ffffff',
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.SLATE_200,
    minHeight: 26,
    alignItems: 'center',
    paddingVertical: 3,
  },
  tableCell: {
    paddingHorizontal: 6,
    fontSize: 7,
    color: COLORS.SLATE_800,
  },
  signatureSection: {
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  signatureBox: {
    width: 170,
    borderTopWidth: 1,
    borderTopColor: COLORS.SLATE_800,
    paddingTop: 8,
    textAlign: 'center',
  },
  signatureLabel: {
    fontSize: 9,
    color: COLORS.SLATE_800,
    fontWeight: 'bold',
  },
  signatureRole: {
    fontSize: 7.5,
    color: COLORS.SLATE_600,
    marginTop: 2,
  },
});

const MiTableReport = ({ data = [], municipalityLogo, municipalityName }) => (
  <Document>
    <ReportPage
      logo={municipalityLogo}
      title="Reporte de Ejemplo"
      subtitle={municipalityName}
      muniName={municipalityName}
    >
      {/* Meta */}
      <View style={styles.metaSection}>
        <View>
          <Text style={styles.metaLabel}>Módulo</Text>
          <Text style={styles.metaValue}>Nombre del Módulo</Text>
        </View>
        <View>
          <Text style={styles.metaLabel}>Registros</Text>
          <Text style={styles.metaValue}>{data.length}</Text>
        </View>
      </View>

      {/* Tabla */}
      <View>
        <View style={styles.tableHeader}>
          <View style={{ width: '25%' }}><Text style={styles.tableHeaderCell}>Columna 1</Text></View>
          <View style={{ width: '50%' }}><Text style={styles.tableHeaderCell}>Columna 2</Text></View>
          <View style={{ width: '25%' }}><Text style={styles.tableHeaderCell}>Columna 3</Text></View>
        </View>
        {data.map((item, i) => (
          <View key={item.id} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' }]}>
            <View style={{ width: '25%' }}><Text style={styles.tableCell}>{item.field1}</Text></View>
            <View style={{ width: '50%' }}><Text style={styles.tableCell}>{item.field2}</Text></View>
            <View style={{ width: '25%' }}><Text style={styles.tableCell}>{item.field3}</Text></View>
          </View>
        ))}
      </View>

      {/* Firmas */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Resp. de Sistemas</Text>
          <Text style={styles.signatureRole}>SIPREB — {municipalityName}</Text>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Jefe de Área</Text>
          <Text style={styles.signatureRole}>Área Correspondiente</Text>
        </View>
      </View>
    </ReportPage>
  </Document>
);

export default MiTableReport;
```

**Reglas para tablas:**
-   Máximo **7 columnas** en portrait, **12 columnas** en landscape.
-   Usar `fontSize: 7` para celdas, `fontSize: 6.5-7` para headers.
-   Alternar color de filas: `i % 2 === 0 ? '#ffffff' : '#f8fafc'`.
-   Header con `COLORS.NAVY` y texto blanco.
-   Cabecera de tabla: sumar los width a **100%**.

### B. Reporte tipo Ficha / Acta (registro individual)

**Cuándo usarlo:** Detalle de un solo registro (ficha de mantenimiento, acta de conformidad, detalle de activo).

**Ejemplo:** `SingleMaintenanceReport.jsx`, `ConformityActReport.jsx`

```jsx
import { Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { ReportPage, COLORS } from '../../../shared/reports';

const styles = StyleSheet.create({
  section: { marginBottom: 10 },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.NAVY,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    backgroundColor: '#f1f5f9',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 3,
    marginBottom: 10,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  fieldBlock: {
    flex: 1,
    paddingRight: 8,
  },
  fieldLabel: {
    fontSize: 6.5,
    color: COLORS.SLATE_400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 9,
    color: COLORS.SLATE_800,
  },
});

const MiFichaReport = ({ item, municipalityLogo, municipalityName }) => (
  <Document>
    <ReportPage
      logo={municipalityLogo}
      title={`Ficha de ${item.code || ''}`}
      subtitle={municipalityName}
      muniName={municipalityName}
    >
      {/* Sección 1 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Principal</Text>
        <View style={styles.fieldRow}>
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Campo 1</Text>
            <Text style={styles.fieldValue}>{item.field1}</Text>
          </View>
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Campo 2</Text>
            <Text style={styles.fieldValue}>{item.field2}</Text>
          </View>
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Campo 3</Text>
            <Text style={styles.fieldValue}>{item.field3}</Text>
          </View>
        </View>
      </View>
    </ReportPage>
  </Document>
);
```

### C. Reporte tipo Tarjeta (card-list agrupado)

**Cuándo usarlo:** Lista de registros donde cada uno tiene varios campos que no caben en una tabla tradicional o se necesita mostrar descripciones.

**Ejemplo:** `MaintenanceReport.jsx` (versión actualizada)

```jsx
import { Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { ReportPage, COLORS } from '../../../shared/reports';

const styles = StyleSheet.create({
  recordCard: {
    borderWidth: 1,
    borderColor: COLORS.SLATE_200,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: COLORS.NAVY,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  cardHeaderText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  cardBody: {
    padding: 10,
  },
  fieldBlock: {
    flex: 1,
    paddingRight: 8,
  },
  fieldLabel: {
    fontSize: 6.5,
    color: COLORS.SLATE_400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  fieldValue: {
    fontSize: 8.5,
    color: COLORS.SLATE_800,
  },
  descriptionBox: {
    borderWidth: 1,
    borderColor: COLORS.SLATE_200,
    borderRadius: 4,
    padding: 6,
    backgroundColor: '#fafbfc',
    minHeight: 18,
  },
  descriptionText: {
    fontSize: 7,
    color: COLORS.SLATE_600,
    lineHeight: 1.4,
  },
  signatureSection: {
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  signatureBox: {
    width: 170,
    borderTopWidth: 1,
    borderTopColor: COLORS.SLATE_800,
    paddingTop: 8,
    textAlign: 'center',
  },
  signatureLabel: {
    fontSize: 9,
    color: COLORS.SLATE_800,
    fontWeight: 'bold',
  },
  signatureRole: {
    fontSize: 7.5,
    color: COLORS.SLATE_600,
    marginTop: 2,
  },
});

const MiCardReport = ({ data = [], municipalityLogo, municipalityName }) => {
  const fmtDate = (d) => { /* ... */ };
  const fmtCurrency = (v) => `S/ ${(parseFloat(v) || 0).toFixed(2)}`;

  return (
    <Document>
      <ReportPage
        logo={municipalityLogo}
        title="Reporte de Ejemplo en Tarjetas"
        subtitle={municipalityName}
        muniName={municipalityName}
      >
        {/* Metadatos */}
        <View style={styles.metaSection}>
          <View>
            <Text style={styles.metaLabel}>Total Registros</Text>
            <Text style={styles.metaValue}>{data.length}</Text>
          </View>
        </View>

        {/* Tarjetas */}
        {data.map((item, i) => (
          <View key={item.id} style={styles.recordCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderText}>{item.code || 'S/C'} — {item.name}</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Campo 1</Text>
                  <Text style={styles.fieldValue}>{item.field1}</Text>
                </View>
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Campo 2</Text>
                  <Text style={styles.fieldValue}>{item.field2}</Text>
                </View>
              </View>
              {item.description && (
                <View style={{ marginTop: 5 }}>
                  <Text style={styles.fieldLabel}>Descripción</Text>
                  <View style={styles.descriptionBox}>
                    <Text style={styles.descriptionText}>{item.description}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        ))}

        {/* Firmas */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Resp. de Sistemas</Text>
            <Text style={styles.signatureRole}>SIPREB — {municipalityName}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Jefe de Área</Text>
            <Text style={styles.signatureRole}>Área Correspondiente</Text>
          </View>
        </View>
      </ReportPage>
    </Document>
  );
};

export default MiCardReport;
```

---

## 6. Ejemplos Reales en el Proyecto

| Archivo | Tipo | Descripción |
|---|---|---|
| `ms-02-authentication/reports/UserReport.jsx` | Tabla | Listado de usuarios del sistema |
| `ms-02-authentication/reports/PersonReport.jsx` | Tabla | Listado de personas |
| `ms-04-patrimonio/reports/AssetReport.jsx` | Tabla | Listado de bienes patrimoniales |
| `ms-05-movements/reports/MovementReport.jsx` | Tabla | Listado de movimientos |
| `ms-07-mantenimiento/reports/SingleMaintenanceReport.jsx` | Ficha / Acta | Detalle individual de mantenimiento |
| `ms-07-mantenimiento/reports/ConformityActReport.jsx` | Ficha / Acta | Acta de conformidad SBN |
| `ms-07-mantenimiento/reports/MaintenanceReport.jsx` | Tarjetas | Listado de mantenimientos con descripciones |

Estudia estos archivos como referencia antes de crear un reporte nuevo.

---

## 7. Reglas del Estándar

### ✅ Sí — Hacer

1.  **Usar `ReportPage` como wrapper** — siempre, nunca usar `Page` directamente.
2.  **Cada módulo crea su propio archivo** de reporte dentro de `modulo/reports/`.
3.  **Importar `COLORS`** desde `shared/reports` para mantener la paleta institucional.
4.  **Usar `loadCompressedLogo()`** para cargar el logo desde la página del módulo.
5.  **Usar `municipalityName` dinámico** — nunca hardcodear nombres de municipalidad.
6.  **Firmas estándar**: `"SIPREB — {municipalityName}"`.
7.  **Alternar colores de fila** en tablas: `#ffffff` / `#f8fafc`.
8.  **Header de tabla** con `COLORS.NAVY` y texto blanco.
9.  **Agrupar columnas** con `width: 'X%'` sumando siempre **100%**.
10. **Exportar el componente** como `export default`.

### ❌ No — Evitar

1.  **No editar `shared/reports/index.jsx`** — es estándar institucional.
2.  **No repetir header, footer, watermark** — `ReportPage` ya los incluye.
3.  **No repetir "Entidad:" / "Municipalidad:"** — el header de `ReportPage` ya lo muestra.
4.  **No hardcodear "San Luis"** — siempre usar `{municipalityName}`.
5.  **No usar Tailwind** — `@react-pdf/renderer` no lo soporta. Usar `StyleSheet.create()`.
6.  **No mezclar patrones** — elige tabla, ficha o tarjeta según el caso; no combines sin criterio.
7.  **No usar inline `color` repetido** — define colores en constantes o en `StyleSheet`.

---

## 8. Carga del Logo

El logo se almacena en `sessionStorage` con la key `muniLogo`.

```jsx
import { loadCompressedLogo } from '../../../shared/reports';

const MiComponente = () => {
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    loadCompressedLogo(80).then(setLogo);
  }, []);

  // Pasar logo como prop al reporte
  return (
    <PDFDownloadLink
      document={<MiReporte logo={logo} municipalityLogo={logo} municipalityName={nombreMuni} />}
      fileName="reporte.pdf"
    >
      {({ loading }) => (loading ? 'Preparando...' : 'Descargar PDF')}
    </PDFDownloadLink>
  );
};
```

> **Nota:** La prop del ReportPage se llama `logo`, pero por convención en los reportes existentes se pasa también como `municipalityLogo`. Ambas funcionan.

---

## 9. Resolución de Datos (Data Fetching)

Dado que diferentes APIs pueden nombrar los mismos campos de forma distinta, usa estos patrones:

```js
// Búsqueda type-safe por ID
const item = list.find(x =>
  String(x.id) === String(id) ||
  x._id === id ||
  x.userId === id
);

// Búsqueda de persona/proveedor con fallbacks
const person = people.find(x =>
  String(x.id) === String(id) ||
  String(x.documentNumber) === String(id) ||
  String(x.dni) === String(id)
);

// Costos con múltiples nombres de campo
const pickCost = (obj, ...keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== '') return parseFloat(v);
  }
  return 0;
};
pickCost(item, 'laborCost', 'costoManoObra', 'manoDeObra');
pickCost(item, 'totalCost', 'costoTotal', 'total');
```

---

## 10. Errores Comunes y Soluciones

| Error | Causa | Solución |
|---|---|---|
| `Text strings must be rendered within a <Text> component` | Texto suelto dentro de `<View>` | Envolver todo texto en `<Text>` |
| `View child must be a Text or another View` | Elemento no válido dentro de `<Text>` | Usar `<Text>` solo para texto plano o `<Text>` anidados con estilo |
| El logo no aparece en el PDF | Logo `null` o cadena vacía | Verificar que `loadCompressedLogo()` se ejecute y resuelva antes de renderizar |
| Tabla desborda el ancho de página | Columnas suman más de 100% | Verificar que `width` de todas las columnas sume exactamente 100% |
| Texto cortado en celda | Columna muy angosta | Aumentar `width` de la columna o reducir `fontSize` |
| `ReportPage` no existe | Import incorrecto | Verificar ruta: `'../../../shared/reports'` |
| Paginación corta contenido | Contenido excede una página | `@react-pdf` maneja paginación automática; si se corta, verificar que no haya `height` fijo |
| Estilos no se aplican | Usando propiedades CSS no soportadas | `@react-pdf` soporta subset de CSS. NO usar: `gap`, `row-gap`, `column-gap`, `aspect-ratio`, `transition`, `animation`, `box-shadow` |
| Imagen no se muestra | Ruta incorrecta o base64 inválido | Usar solo base64 o URI absoluta; no rutas relativas del proyecto |
| Los acentos/tildes no se ven | Fuente no soporta caracteres | Usar fuente estándar (Helvetica) que soporta latín básico |

---

## 11. Checklist de Integración

Antes de entregar un reporte nuevo, verifica:

- [ ] ¿Usa `ReportPage` como wrapper? (nunca `Page` directo)
- [ ] ¿Importa `COLORS` desde `shared/reports`?
- [ ] ¿El logo se carga con `loadCompressedLogo()`?
- [ ] ¿No hay texto "San Luis" hardcodeado? (usar `municipalityName`)
- [ ] ¿No hay header, footer ni watermark repetidos?
- [ ] ¿Las columnas de tabla suman 100%?
- [ ] ¿Las filas alternan color (`#ffffff` / `#f8fafc`)?
- [ ] ¿Los headers de tabla usan `COLORS.NAVY`?
- [ ] ¿Las firmas usan `"SIPREB — {municipalityName}"`?
- [ ] ¿El build pasa sin errores? (`npm run build`)
- [ ] ¿Se eligió el patrón correcto? (tabla / ficha / tarjetas)

---

> *Última actualización: Mayo 2026 — Equipo Core SIPREB*
