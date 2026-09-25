
# Sistema Multi-Tenant de Control Patrimonial

## Frontend - Arquitectura de Microservicios

Sistema de gestión patrimonial para municipalidades con arquitectura multi-tenant basada en 9 microservicios.

---

## 📁 Estructura del Proyecto

```
src/
├── api/                    # Cliente HTTP y configuración de APIs
├── assets/                 # Recursos estáticos
├── layouts/                # Layouts principales de la aplicación
├── modules/                # Módulos por microservicio (9 módulos)
├── pages/                  # Páginas globales
├── router/                 # Configuración de rutas
├── shared/                 # Código compartido entre módulos
└── store/                  # Estado global de la aplicación
```

---

## 📂 Descripción de Carpetas

### 🌐 `/api` - Cliente HTTP

Configuración centralizada para comunicación con los microservicios del backend.

**Contiene:**

- `apiClient.js` - Cliente HTTP configurado (Axios/Fetch) con configuración base
- `interceptors.js` - Interceptores para agregar tenant, autenticación, manejo de errores
- `endpoints.js` - URLs de los 9 microservicios (puertos 5001-5009)

**Propósito:** Centralizar toda la comunicación HTTP y aplicar lógica común (headers, tokens, tenant ID).

---

### 🎨 `/assets` - Recursos Estáticos

Archivos estáticos como imágenes, iconos y estilos globales.

**Contiene:**

- `images/` - Imágenes, logos, ilustraciones
- `icons/` - Iconos SVG, fuentes de iconos
- `styles/` - CSS/SCSS globales, variables, temas

**Propósito:** Organizar recursos estáticos separados del código lógico.

---

### 🏗️ `/layouts` - Layouts Principales

Estructuras de página reutilizables que envuelven el contenido.

**Contiene:**

- `MainLayout.jsx` - Layout principal con sidebar y header (para usuarios autenticados)
- `AuthLayout.jsx` - Layout para páginas de autenticación (login, registro)
- `DashboardLayout.jsx` - Layout específico para dashboards con widgets

**Subcarpeta `/components`:**

- `Sidebar.jsx` - Menú lateral de navegación con enlaces a los 9 módulos
- `Header.jsx` - Barra superior con notificaciones, usuario, tenant actual
- `Footer.jsx` - Pie de página
- `Breadcrumb.jsx` - Migas de pan para navegación

**Propósito:** Definir la estructura visual común de la aplicación y evitar repetir código de layout.

---

### 🧩 `/modules` - Módulos por Microservicio

**Cada módulo representa un microservicio del backend.** Contiene toda la lógica, vistas y componentes específicos.

#### Estructura de cada módulo:

```
ms-XX-nombre/
├── pages/          # Páginas/vistas del módulo
├── components/     # Componentes específicos del módulo
├── services/       # Llamadas a la API del microservicio
└── hooks/          # Custom hooks del módulo
```

#### 📋 Los 9 Módulos:

**MS-01: Tenant Management** (`ms-01-tenant-management/`)

- Gestión de municipalidades (alta, baja, configuración)
- Onboarding de nuevos tenants
- Planes y suscripciones

**MS-02: Authentication** (`ms-02-authentication/`)

- Login, registro, recuperación de contraseña
- Gestión de sesiones y tokens JWT
- Control de acceso basado en roles (RBAC)

**MS-03: Configuration** (`ms-03-configuration/`)

- Configuraciones del sistema por tenant
- Gestión de áreas, cargos, categorías
- Ubicaciones físicas y proveedores

**MS-04: Patrimonio** (`ms-04-patrimonio/`)

- CRUD de bienes patrimoniales
- Depreciación y valorización
- Baja de bienes

**MS-05: Movimientos** (`ms-05-movements/`)

- Trazabilidad de movimientos de bienes
- Actas de entrega-recepción
- Flujos de aprobación

**MS-06: Inventario** (`ms-06-inventario/`)

- Inventarios físicos programados
- Control de diferencias (faltantes/sobrantes)
- Conciliación de inventarios

**MS-07: Mantenimiento** (`ms-07-mantenimiento/`)

- Mantenimientos preventivos y correctivos
- Programación y alertas
- Control de costos y garantías

**MS-08: Reportes** (`ms-08-reportes/`)

- Dashboards analíticos
- Reportes personalizados
- Exportación de datos (PDF, Excel)

**MS-09: Notificaciones** (`ms-09-notificaciones/`)

- Sistema de alertas en tiempo real
- Notificaciones por email/SMS
- Configuración de preferencias

**Propósito:** Aislar la lógica de cada microservicio en módulos independientes para facilitar mantenimiento y escalabilidad.

---

### 📄 `/pages` - Páginas Globales

Páginas que no pertenecen a un módulo específico.

**Contiene:**

- `Dashboard.jsx` - Dashboard principal con widgets de todos los microservicios
- `Home.jsx` - Página de inicio
- `NotFound.jsx` - Página 404

**Propósito:** Páginas compartidas o de nivel superior de la aplicación.

---

### 🛣️ `/router` - Configuración de Rutas

Definición de todas las rutas de la aplicación.

**Contiene:**

- `index.jsx` - Configuración principal del router (React Router)
- `routes.js` - Definición de rutas por módulo
- `PrivateRoute.jsx` - Componente para proteger rutas que requieren autenticación

**Propósito:** Centralizar la configuración de navegación y protección de rutas.

---

### 🔄 `/shared` - Código Compartido

Componentes, hooks y utilidades reutilizables entre todos los módulos.

**Estructura:**

```
shared/
├── components/     # Componentes UI reutilizables
├── hooks/          # Custom hooks compartidos
├── utils/          # Funciones utilitarias
└── constants/      # Constantes globales
```

**Componentes comunes:**

- `Button.jsx`, `Table.jsx`, `Modal.jsx`, `Loading.jsx`
- `Form/` - Componentes de formulario reutilizables

**Hooks compartidos:**

- `useApi.js` - Hook para llamadas HTTP
- `useTenant.js` - Hook para obtener información del tenant actual

**Utils:**

- `formatters.js` - Formateo de fechas, monedas, números
- `validators.js` - Validaciones de formularios

**Constants:**

- `routes.js` - Constantes de rutas

**Propósito:** Evitar duplicación de código y mantener consistencia en toda la aplicación.

---

### 💾 `/store` - Estado Global

Gestión del estado global de la aplicación (Redux, Zustand, Context API).

**Contiene:**

- `authStore.js` - Estado de autenticación (usuario, token, permisos)
- `tenantStore.js` - Información del tenant actual
- `notificationsStore.js` - Notificaciones en tiempo real

**Propósito:** Compartir estado entre componentes sin prop drilling.

---

## 🚀 Flujo de Trabajo

1. **Usuario accede** → `AuthLayout` → Login (`ms-02-authentication`)
2. **Usuario autenticado** → `MainLayout` (Sidebar + Header)
3. **Navega a módulo** → Ejemplo: Patrimonio (`ms-04-patrimonio`)
4. **Componente llama API** → `services/patrimonioService.js` → `api/apiClient.js`
5. **API responde** → Datos se muestran en componentes
6. **Estado global** → `store/` mantiene usuario, tenant, notificaciones

---

## 🔧 Tecnologías

- **React 19** - Framework UI
- **Vite** - Build tool
- **React Router** - Navegación
- **Axios** - Cliente HTTP
- **Zustand/Redux** - Estado global

---

## 📦 Instalación

```bash
npm install
npm run dev
```

---

## 🏛️ Arquitectura Multi-Tenant

Cada request incluye el `tenantId` en headers para aislar datos por municipalidad:

```javascript
// Interceptor automático
headers: {
  'X-Tenant-ID': 'municipalidad_san_luis',
  'Authorization': 'Bearer token...'
}
```

---

## 📝 Convenciones

- **Componentes:** PascalCase (`BienesList.jsx`)
- **Servicios:** camelCase (`patrimonioService.js`)
- **Hooks:** prefijo `use` (`useAuth.js`)
- **Constantes:** UPPER_SNAKE_CASE

---

**Versión:** 1.0.0  
**Última actualización:** Octubre 2025

