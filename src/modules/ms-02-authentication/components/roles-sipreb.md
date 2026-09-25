# 🔐 Roles del Sistema SIPREB
## Sistema Multi-Tenant de Control Patrimonial para Municipalidades

---

## 📋 Índice

- [Estrategia General](#estrategia-general)
- [Roles Globales (is_system = true)](#roles-globales)
- [Roles por Nivel de Acceso](#roles-por-nivel-de-acceso)
  - [Super-Admin (Cross-Tenant)](#super-admin-cross-tenant)
  - [Administración del Tenant](#administración-del-tenant)
  - [Patrimonio](#patrimonio)
  - [Movimientos](#movimientos)
  - [Inventario](#inventario)
  - [Mantenimiento](#mantenimiento)
  - [Reportes y Auditoría](#reportes-y-auditoría)
- [Asignación de Roles por Cargo y Área](#asignación-de-roles-por-cargo-y-área)
  - [Modelo de la tabla](#modelo-de-la-tabla)
  - [Flujo de asignación](#flujo-de-asignación)
  - [Defaults de onboarding](#defaults-de-onboarding)
- [Resolución de Permisos (sin JWT inflado)](#resolución-de-permisos)
- [Mapeo de Permisos por Rol](#mapeo-de-permisos-por-rol)
- [Áreas y Cargos según la SBN](#áreas-y-cargos-según-la-sbn)

---

## Estrategia General

Los roles siguen un modelo **híbrido**:

- **Roles globales** (`is_system = true`): se definen una vez y se replican automáticamente en cada tenant durante el onboarding. No pueden eliminarse, solo extenderse.
- **Roles custom** (`is_system = false`): cada municipalidad puede crear los suyos según sus necesidades particulares (ej. comisiones temporales, veedores externos).

El campo `expiration_date` en `users_roles` permite asignar roles temporales sin necesidad de crear lógica adicional.

---

## Roles Globales

Estos roles son candidatos a `is_system = true` porque su comportamiento es idéntico en **todas las municipalidades**. Se replican al crear un nuevo tenant.

| Rol | Motivo para ser global |
|-----|------------------------|
| `TENANT_ADMIN` | Toda municipalidad necesita un administrador local con las mismas capacidades |
| `PATRIMONIO_GESTOR` | El flujo de gestión de bienes es estándar en todas las municipalidades peruanas |
| `PATRIMONIO_VIEWER` | Acceso de solo lectura universal, sin variación entre tenants |
| `MOVIMIENTOS_SOLICITANTE` | Crear solicitudes de movimiento es una operación base sin variaciones |
| `MOVIMIENTOS_APROBADOR` | El flujo de aprobación sigue la misma lógica en todas las municipalidades |
| `INVENTARIO_COORDINADOR` | La coordinación de inventarios físicos responde a normativa peruana estándar |
| `INVENTARIO_VERIFICADOR` | Rol de uso temporal para comisiones, igual en todos los tenants |
| `MANTENIMIENTO_GESTOR` | Gestión de mantenimiento preventivo/correctivo es igual en todos lados |
| `REPORTES_VIEWER` | Acceso a reportes regulatorios estándar |
| `AUDITORIA_VIEWER` | Solo lectura de logs de auditoría, sin variación posible |

> **Roles que NO deberían ser globales**: roles que dependan de la estructura organizacional interna de cada municipalidad, como `JEFE_ALMACEN_CENTRAL` o `COMISION_INVENTARIO_2025`. Estos se crean como roles custom por tenant.

---

## Roles por Nivel de Acceso

### Super-Admin (Cross-Tenant)

Estos roles operan sobre la `master_tenant` y se gestionan directamente en Keycloak (realm master). No están en la base de datos de ningún tenant.

| Rol | Descripción | Nivel de riesgo |
|-----|-------------|-----------------|
| `SUPER_ADMIN` | Acceso total al sistema y a todos los tenants. Solo para el equipo core de la plataforma. | 🔴 Crítico |
| `PLATFORM_SUPPORT` | Soporte técnico: lectura de logs globales y estado de tenants. Sin acceso a datos de negocio. | 🟡 Medio |
| `BILLING_MANAGER` | Gestión de suscripciones, planes y facturación de municipalidades. Sin acceso operativo. | 🟡 Medio |
| `ONBOARDING_MANAGER` | Creación y configuración de nuevos tenants. Sin acceso a datos operativos de tenants existentes. | 🟡 Medio |

---

### Administración del Tenant

| Rol | `is_system` | Descripción |
|-----|-------------|-------------|
| `TENANT_ADMIN` | ✅ true | Administrador de la municipalidad. Gestiona usuarios, asigna roles, configura el tenant. Es el único que puede crear roles custom. |
| `TENANT_CONFIG_MANAGER` | ✅ true | Gestión de configuración operativa: áreas, categorías de bienes, cargos, tipos de documento, ubicaciones físicas y proveedores. Sin acceso a usuarios. |

---

### Patrimonio

| Rol | `is_system` | Descripción |
|-----|-------------|-------------|
| `PATRIMONIO_GESTOR` | ✅ true | CRUD completo sobre bienes patrimoniales. Puede registrar, actualizar, calcular depreciaciones y tramitar bajas. |
| `PATRIMONIO_OPERARIO` | ✅ true | Puede registrar nuevos bienes y actualizar su estado. No puede tramitar bajas ni recalcular depreciaciones. Ideal para personal de campo. |
| `PATRIMONIO_VIEWER` | ✅ true | Solo lectura sobre el catálogo completo de bienes patrimoniales. |

---

### Movimientos

| Rol | `is_system` | Descripción |
|-----|-------------|-------------|
| `MOVIMIENTOS_SOLICITANTE` | ✅ true | Crea y edita solicitudes de movimiento; puede cancelar las propias. |
| `MOVIMIENTOS_APROBADOR` | ✅ true | Aprueba o rechaza movimientos y genera actas de entrega-recepción. Rol crítico para el flujo de aprobación. Se asigna típicamente a jefes de área. |
| `MOVIMIENTOS_EJECUTOR` | ✅ true | Marca movimientos en proceso, los completa, sincroniza bienes en actas y firma actas de entrega-recepción. |
| `MOVIMIENTOS_VIEWER` | ✅ true | Solo lectura del historial de movimientos y estado de solicitudes. |

> **Nota**: El campo `direct_manager_id` en la tabla `users` es el que determina a quién escala un movimiento. El rol `MOVIMIENTOS_APROBADOR` solo habilita la acción; el enrutamiento lo decide ese campo.

---

### Inventario

| Rol | `is_system` | Descripción |
|-----|-------------|-------------|
| `INVENTARIO_COORDINADOR` | ✅ true | Programa y coordina inventarios físicos, asigna verificadores, concilia diferencias y cierra el proceso. |
| `INVENTARIO_VERIFICADOR` | ✅ true | Solo puede verificar ítems durante un inventario activo. Pensado para asignación temporal con `expiration_date`. Ideal para comisiones externas o personal rotativo. |

---

### Mantenimiento

| Rol | `is_system` | Descripción |
|-----|-------------|-------------|
| `MANTENIMIENTO_GESTOR` | ✅ true | Programa, ejecuta y cierra órdenes de mantenimiento preventivo y correctivo. Gestiona costos, garantías y alertas de vencimiento. |
| `MANTENIMIENTO_VIEWER` | ✅ true | Solo lectura del historial de mantenimientos y calendario de vencimientos. |

---

### Reportes y Auditoría

| Rol | `is_system` | Descripción |
|-----|-------------|-------------|
| `REPORTES_VIEWER` | ✅ true | Acceso a dashboards, generación de reportes regulatorios y exportación de datos. Solo lectura. |
| `REPORTES_SCHEDULER` | ✅ true | Puede configurar reportes programados automáticos. Extensión de `REPORTES_VIEWER`. |
| `AUDITORIA_VIEWER` | ✅ true | Solo lectura de logs de auditoría (`auditoria_cambios`, `auditoria_accesos`). Fundamental para fiscalizaciones internas y externas. |

---

## Asignación de Roles por Cargo y Área

El cargo (`position_id`) y el área (`area_id`) de un usuario **no reemplazan** la asignación de roles, sino que actúan como filtros y disparadores que hacen el proceso más inteligente.

El modelo funciona en dos niveles:

1. **Filtro**: al momento de asignar roles a un usuario, el sistema solo muestra los roles compatibles con su cargo y área.
2. **Automatización**: los roles marcados como `is_default = true` se asignan automáticamente al crear el usuario, sin intervención del `TENANT_ADMIN`.

Esto preserva la trazabilidad completa en `users_roles` (quién asignó, cuándo, con expiración) y mantiene la flexibilidad para casos especiales como comisiones temporales.

### Modelo de la tabla

```sql
CREATE TABLE position_allowed_roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id     UUID NOT NULL,       -- cargo (viene de Config Service)
    area_id         UUID,                -- NULL = aplica a cualquier área
    role_id         UUID NOT NULL,
    is_default      BOOLEAN DEFAULT false,  -- se asigna automáticamente al crear usuario
    municipal_code  UUID NOT NULL,
    created_by      UUID NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT uk_position_area_role UNIQUE (position_id, area_id, role_id, municipal_code)
);
```

> `area_id = NULL` significa que el rol es permitido para ese cargo sin importar en qué área esté. Útil para roles transversales como `REPORTES_VIEWER` o `AUDITORIA_VIEWER`.

### Flujo de asignación

```
TENANT_ADMIN crea un usuario
        ↓
Usuario tiene position_id = "Técnico Patrimonio" y area_id = "Área de Patrimonio"
        ↓
Sistema consulta position_allowed_roles
        ↓
Retorna roles permitidos:
  - PATRIMONIO_GESTOR     (is_default: true)   → se asigna automáticamente
  - PATRIMONIO_OPERARIO   (is_default: false)   → disponible para asignar
  - PATRIMONIO_VIEWER     (is_default: false)   → disponible para asignar
  - REPORTES_VIEWER       (is_default: false)   → disponible para asignar (area_id NULL)
        ↓
TENANT_ADMIN puede asignar roles adicionales SOLO del conjunto permitido
        ↓
Todo se registra en users_roles con assigned_by, assigned_at y expiration_date opcional
```

### Defaults de onboarding

Al crear un nuevo tenant, el Config Service semilla la tabla `position_allowed_roles` con los defaults del sistema. El `TENANT_ADMIN` puede ajustarlos después.

| Cargo (ejemplo) | Área | Roles permitidos | Default |
|-----------------|------|-----------------|---------|
| Técnico Patrimonio | Patrimonio | `PATRIMONIO_GESTOR`, `PATRIMONIO_OPERARIO`, `PATRIMONIO_VIEWER`, `REPORTES_VIEWER` | `PATRIMONIO_OPERARIO` |
| Jefe de Almacén | Patrimonio | `PATRIMONIO_GESTOR`, `MOVIMIENTOS_APROBADOR`, `INVENTARIO_COORDINADOR`, `REPORTES_VIEWER` | `PATRIMONIO_GESTOR`, `MOVIMIENTOS_APROBADOR` |
| Técnico Inventario | Cualquier área | `INVENTARIO_VERIFICADOR`, `INVENTARIO_COORDINADOR`, `PATRIMONIO_VIEWER` | `INVENTARIO_VERIFICADOR` |
| Técnico Mantenimiento | Cualquier área | `MANTENIMIENTO_GESTOR`, `MANTENIMIENTO_VIEWER` | `MANTENIMIENTO_GESTOR` |
| Analista | Cualquier área | `REPORTES_VIEWER`, `REPORTES_SCHEDULER`, `AUDITORIA_VIEWER` | `REPORTES_VIEWER` |
| Administrador | Cualquier área | Todos los roles del sistema | `TENANT_ADMIN` |

> **Caso especial — roles temporales**: roles como `INVENTARIO_VERIFICADOR` para comisiones externas pueden asignarse manualmente desde `users_roles` con `expiration_date`, aunque el cargo del usuario no lo tenga en `position_allowed_roles`. El `TENANT_ADMIN` siempre puede hacer override explícito con trazabilidad.

---

## Resolución de Permisos

El JWT **no lleva permisos**, solo roles. Los permisos se resuelven en tiempo de request mediante un endpoint cacheado en Redis.

```
Request → API Gateway
              ↓ valida JWT (roles)
         Microservicio
              ↓ necesita verificar permiso granular
         GET auth-service/auth/permissions/{userId}
              ↓ Auth Service consulta Redis
              ↓ (si no está en cache → consulta DB → guarda en Redis con TTL 60s)
         { permissions: ["patrimonio:read", "patrimonio:write"] }
              ↓
         Microservicio aplica la lógica fina
```

**Ventajas de este enfoque:**
- El JWT se mantiene liviano (solo `sub`, `municipal_code`, `roles`, `area_id`, `position_id`)
- Cambios de permisos por parte del `TENANT_ADMIN` tienen efecto máximo en 60 segundos (TTL del cache)
- No es necesario revocar tokens cuando cambian los permisos de un rol
- Cada microservicio puede cachear localmente los permisos del usuario durante una request

---

## Mapeo de Permisos por Rol

Referencia de los permisos base que se asignan a cada rol del sistema. Usados en la tabla `permissions` con el formato `module:action:resource`.

| Rol | Permisos base |
|-----|---------------|
| `PATRIMONIO_GESTOR` | `patrimonio:create`, `patrimonio:read`, `patrimonio:update`, `patrimonio:delete`, `patrimonio:depreciation`, `patrimonio:baja` |
| `PATRIMONIO_OPERARIO` | `patrimonio:create`, `patrimonio:read`, `patrimonio:update:status` |
| `PATRIMONIO_VIEWER` | `patrimonio:read` |
| `MOVIMIENTOS_SOLICITANTE` | `movimientos:movement:submit`, `movimientos:movement:cancel`, `movimientos:read:own` |
| `MOVIMIENTOS_APROBADOR` | `movimientos:movement:approve`, `movimientos:receipt:generate`, `movimientos:read:*` |
| `MOVIMIENTOS_EJECUTOR` | `movimientos:movement:execute`, `movimientos:receipt:generate`, `movimientos:receipt:sign`, `movimientos:read:*` |
| `MOVIMIENTOS_VIEWER` | `movimientos:read:*` |
| `INVENTARIO_COORDINADOR` | `inventario:create`, `inventario:read`, `inventario:update`, `inventario:conciliate`, `inventario:close` |
| `INVENTARIO_VERIFICADOR` | `inventario:read:active`, `inventario:verify:item` |
| `MANTENIMIENTO_GESTOR` | `mantenimiento:create`, `mantenimiento:read`, `mantenimiento:update`, `mantenimiento:close`, `mantenimiento:alert:configure` |
| `MANTENIMIENTO_VIEWER` | `mantenimiento:read` |
| `REPORTES_VIEWER` | `reportes:read`, `reportes:generate`, `reportes:export` |
| `REPORTES_SCHEDULER` | `reportes:read`, `reportes:generate`, `reportes:export`, `reportes:schedule` |
| `AUDITORIA_VIEWER` | `auditoria:read` |
| `TENANT_CONFIG_MANAGER` | `config:read`, `config:update`, `config:areas:manage`, `config:categories:manage`, `config:locations:manage` |
| `TENANT_ADMIN` | Todos los permisos anteriores + `users:manage`, `roles:manage`, `roles:assign` |

---

*Última actualización: 2025 — Versión 1.2*  
*Compatible con arquitectura Keycloak — Realm único `sipreb`*  
*Áreas y cargos basados en: Ley N° 29151, D.S. N° 007-2008-VIVIENDA, Directiva N° 001-2015/SBN y Ley N° 27972*

---

## Áreas y Cargos según la SBN — Gestión de Bienes Municipales

> **Nota importante**: La entidad rectora para gestión de bienes en municipalidades peruanas es la **SBN** (Superintendencia Nacional de Bienes Estatales), no la SBS. La SBN emite las directivas que regulan altas, bajas, inventarios y disposición de bienes muebles e inmuebles estatales, bajo la Ley N° 29151 — Ley General del Sistema Nacional de Bienes Estatales, su reglamento D.S. N° 007-2008-VIVIENDA, y la Directiva N° 001-2015/SBN.

---

### Marco normativo aplicable

| Norma | Descripción |
|---|---|
| Ley N° 29151 | Ley General del Sistema Nacional de Bienes Estatales |
| D.S. N° 007-2008-VIVIENDA | Reglamento de la Ley N° 29151 |
| Directiva N° 001-2015/SBN | Procedimientos de Gestión de Bienes Muebles Estatales |
| Ley N° 27972 | Ley Orgánica de Municipalidades |
| D.S. N° 154-2001-EF | Reglamento General de Procedimientos Administrativos de los Bienes de Prop. Estatal |

---

### Áreas orgánicas de una municipalidad (vinculadas a gestión de bienes)

Basadas en la estructura típica definida por la SBN y la Ley Orgánica de Municipalidades, las áreas que intervienen directamente en la gestión del patrimonio municipal son:

| Área | Sigla usual | Rol principal en gestión patrimonial |
|---|---|---|
| Gerencia Municipal | GM | Aprueba actos de disposición de bienes, coordina con alcaldía |
| Oficina General de Administración | OGA | Órgano rector interno del patrimonio; aprueba altas, bajas y expedientes |
| Unidad de Control Patrimonial | UCP | Ejecuta el registro, codificación, inventario y disposición de bienes muebles |
| Unidad de Abastecimiento / Logística | UAL | Gestiona adquisiciones, almacén y entrada de bienes al patrimonio |
| Oficina de Contabilidad | OC | Concilia el inventario físico con el registro contable (cuentas 1501, 1502, 1503) |
| Unidad de Asesoría Jurídica | UAJ | Emite informes técnico-legales para altas, bajas y saneamiento |
| Gerencia de Infraestructura y Obras | GIO | Administra bienes inmuebles, vehículos pesados y maquinaria |
| Gerencia de Servicios a la Ciudad | GSC | Usa bienes para servicios de limpieza, parques, serenazgo |
| Unidad de Recursos Humanos | URH | Gestiona asignación de bienes a personas y cambios de responsable |
| Oficina de Tecnologías de la Información | OTI | Administra bienes TI (equipos, licencias, servidores) |
| Comisión de Inventario | CI | Comisión temporal designada para el inventario físico anual |

---

### Cargos por área y su rol en SIPREB

#### Oficina General de Administración (OGA)

| Cargo | Rol en SIPREB | Roles del sistema sugeridos |
|---|---|---|
| Gerente / Jefe de OGA | Aprueba expedientes de alta y baja; autoriza disposición de bienes | `TENANT_ADMIN`, `MOVIMIENTOS_APROBADOR` |
| Especialista Administrativo | Revisa expedientes, coordina con UCP y Contabilidad | `PATRIMONIO_GESTOR`, `MOVIMIENTOS_APROBADOR` |

#### Unidad de Control Patrimonial (UCP)

Esta es la unidad más crítica. El responsable de la Unidad de Control Patrimonial elabora los expedientes administrativos para alta y baja de bienes, dirige la subasta restringida, organiza el proceso de venta y está obligado a dar facilidades en los inventarios.

| Cargo | Rol en SIPREB | Roles del sistema sugeridos |
|---|---|---|
| Jefe de Control Patrimonial | Dirige toda la gestión de bienes muebles; firma actas de inventario | `PATRIMONIO_GESTOR`, `INVENTARIO_COORDINADOR`, `MOVIMIENTOS_APROBADOR`, `REPORTES_SCHEDULER` |
| Técnico Patrimonial | Registra altas y bajas, codifica bienes, actualiza SINABIP | `PATRIMONIO_GESTOR`, `INVENTARIO_VERIFICADOR` |
| Técnico de Inventario | Verifica físicamente los bienes durante el inventario anual | `INVENTARIO_VERIFICADOR`, `PATRIMONIO_VIEWER` |
| Asistente Patrimonial | Apoya el registro y archivo de expedientes patrimoniales | `PATRIMONIO_OPERARIO` |

#### Unidad de Abastecimiento / Logística (UAL)

| Cargo | Rol en SIPREB | Roles del sistema sugeridos |
|---|---|---|
| Jefe de Abastecimiento | Coordina entrada de bienes al almacén y su transferencia a patrimonio | `PATRIMONIO_GESTOR`, `MOVIMIENTOS_SOLICITANTE` |
| Almacenero / Técnico de Almacén | Recibe bienes adquiridos, emite PECOSA (Pedido Comprobante de Salida) | `PATRIMONIO_OPERARIO`, `MOVIMIENTOS_SOLICITANTE` |
| Asistente de Logística | Apoya el registro de órdenes de compra y notas de entrada | `PATRIMONIO_OPERARIO` |

#### Oficina de Contabilidad (OC)

| Cargo | Rol en SIPREB | Roles del sistema sugeridos |
|---|---|---|
| Contador General | Concilia patrimonio físico con cuentas contables; aprueba depreciaciones | `REPORTES_VIEWER`, `AUDITORIA_VIEWER`, `PATRIMONIO_VIEWER` |
| Asistente Contable | Registra comprobantes de pago de adquisiciones patrimoniales | `PATRIMONIO_VIEWER`, `REPORTES_VIEWER` |

#### Unidad de Asesoría Jurídica (UAJ)

| Cargo | Rol en SIPREB | Roles del sistema sugeridos |
|---|---|---|
| Asesor Legal | Emite informes técnico-legales para alta, baja, saneamiento y subasta | `AUDITORIA_VIEWER`, `PATRIMONIO_VIEWER`, `REPORTES_VIEWER` |

#### Gerencia de Infraestructura y Obras (GIO)

| Cargo | Rol en SIPREB | Roles del sistema sugeridos |
|---|---|---|
| Gerente de Infraestructura | Solicita asignación de maquinaria, vehículos e inmuebles | `MOVIMIENTOS_SOLICITANTE`, `PATRIMONIO_VIEWER` |
| Técnico de Mantenimiento | Ejecuta y registra mantenimientos de bienes muebles e inmuebles | `MANTENIMIENTO_GESTOR`, `MOVIMIENTOS_SOLICITANTE` |
| Operador de Maquinaria / Vehículos | Tiene bienes asignados en uso | `PATRIMONIO_VIEWER` |

#### Gerencia de Servicios a la Ciudad (GSC)

| Cargo | Rol en SIPREB | Roles del sistema sugeridos |
|---|---|---|
| Gerente de Servicios | Solicita transferencia y asignación de bienes a sus áreas | `MOVIMIENTOS_SOLICITANTE`, `PATRIMONIO_VIEWER` |
| Supervisor de Serenazgo | Administra bienes asignados a serenazgo (vehículos, equipos) | `MOVIMIENTOS_SOLICITANTE`, `PATRIMONIO_VIEWER` |

#### Comisión de Inventario (CI) — rol temporal

El inventario es el procedimiento que consiste en verificar físicamente, codificar y registrar los bienes muebles con que cuenta cada entidad a una determinada fecha, con el fin de verificar la existencia de los bienes y contrastar su resultado con el registro contable. La comisión es designada por resolución de alcaldía.

| Cargo | Rol en SIPREB | Roles del sistema sugeridos |
|---|---|---|
| Presidente de Comisión | Coordina y supervisa el inventario físico anual | `INVENTARIO_COORDINADOR` |
| Miembro Verificador | Verifica físicamente los bienes en cada ambiente | `INVENTARIO_VERIFICADOR` |
| Miembro de Contabilidad | Cruza información con registros contables | `INVENTARIO_VERIFICADOR`, `PATRIMONIO_VIEWER` |

> Estos roles deben asignarse con `expiration_date` en `users_roles` — duran únicamente el período del inventario (típicamente 30-60 días al cierre del año fiscal).

---

### Resumen de asignación de roles por area y cargo (actualizado)

| Cargo | Área | Roles sugeridos en SIPREB | Default |
|---|---|---|---|
| Jefe OGA | Administración | `TENANT_ADMIN`, `MOVIMIENTOS_APROBADOR` | `MOVIMIENTOS_APROBADOR` |
| Jefe Control Patrimonial | UCP | `PATRIMONIO_GESTOR`, `INVENTARIO_COORDINADOR`, `MOVIMIENTOS_APROBADOR`, `REPORTES_SCHEDULER` | `PATRIMONIO_GESTOR`, `MOVIMIENTOS_APROBADOR` |
| Técnico Patrimonial | UCP | `PATRIMONIO_GESTOR`, `INVENTARIO_VERIFICADOR` | `PATRIMONIO_GESTOR` |
| Técnico de Inventario | UCP / CI | `INVENTARIO_VERIFICADOR`, `PATRIMONIO_VIEWER` | `INVENTARIO_VERIFICADOR` |
| Asistente Patrimonial | UCP | `PATRIMONIO_OPERARIO` | `PATRIMONIO_OPERARIO` |
| Jefe de Abastecimiento | UAL | `PATRIMONIO_GESTOR`, `MOVIMIENTOS_SOLICITANTE` | `MOVIMIENTOS_SOLICITANTE` |
| Almacenero | UAL | `PATRIMONIO_OPERARIO`, `MOVIMIENTOS_SOLICITANTE` | `PATRIMONIO_OPERARIO` |
| Contador General | Contabilidad | `REPORTES_VIEWER`, `AUDITORIA_VIEWER`, `PATRIMONIO_VIEWER` | `PATRIMONIO_VIEWER` |
| Asesor Legal | UAJ | `AUDITORIA_VIEWER`, `PATRIMONIO_VIEWER` | `AUDITORIA_VIEWER` |
| Técnico de Mantenimiento | GIO | `MANTENIMIENTO_GESTOR`, `MOVIMIENTOS_SOLICITANTE` | `MANTENIMIENTO_GESTOR` |
| Gerente de área usuaria | GSC, GIO u otra | `MOVIMIENTOS_SOLICITANTE`, `PATRIMONIO_VIEWER` | `MOVIMIENTOS_SOLICITANTE` |
| Presidente Comisión Inventario | CI (temporal) | `INVENTARIO_COORDINADOR` | `INVENTARIO_COORDINADOR` |
| Miembro Verificador | CI (temporal) | `INVENTARIO_VERIFICADOR` | `INVENTARIO_VERIFICADOR` |
| Analista de Reportes | Planificación / OGA | `REPORTES_VIEWER`, `REPORTES_SCHEDULER`, `AUDITORIA_VIEWER` | `REPORTES_VIEWER` |

> **Sobre los roles de Comisión**: asignar siempre con `expiration_date`. El campo ya existe en `users_roles` para este propósito exacto.

