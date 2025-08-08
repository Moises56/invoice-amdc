# Implementación de Estadísticas de Usuario y Autenticación

## Resumen de Cambios

Se ha implementado el sistema de estadísticas de usuario con el nuevo rol `USER-ADMIN` y se ha agregado autenticación requerida a los endpoints de ICS y Estado de Cuenta.

## Cambios Realizados

### 1. Nuevo Rol de Usuario: USER-ADMIN

#### Actualización de Enums
- **Archivo**: `src/app/shared/enums/index.ts`
- **Cambio**: Agregado `'USER-ADMIN' = 'USER-ADMIN'` al enum `Role`

#### Campo Ubicación para USER-ADMIN
- **Archivo**: `src/app/core/interfaces/index.ts` 
- **Cambio**: Agregado campo opcional `ubicacion?: string` a la interfaz `User`

#### Actualización de Interfaces de Usuario
- **Archivos actualizados**:
  - `src/app/features/usuarios/usuario-detail/usuario-detail.page.ts`
  - `src/app/features/usuarios/usuario-form/usuario-form.page.ts`  
  - `src/app/features/usuarios/usuarios-list/usuarios-list.page.ts`
- **Cambio**: Agregado soporte para el rol `USER-ADMIN` en todos los mapeos de roles

### 2. Interfaces de Estadísticas de Usuario

#### Nuevas Interfaces
- **Archivo**: `src/app/shared/interfaces/user.interface.ts`
- **Interfaces creadas**:

```typescript
// Estadísticas del usuario actual
export interface UserStatsResponse {
  success: boolean;
  message: string;
  data: UserStats;
}

export interface UserStats {
  totalConsultas: number;
  consultasUltimos30Dias: number;
  consultasHoy: number;
  consultasPorModulo: ConsultasPorModulo;
  ultimaActividad: string;
}

// Estadísticas generales (solo USER-ADMIN)
export interface GeneralStatsResponse {
  success: boolean;
  message: string;
  data: GeneralStats;
}

export interface GeneralStats {
  totalUsuarios: number;
  usuariosActivos: number;
  consultasTotales: number;
  consultasUltimos30Dias: number;
  consultasHoy: number;
  consultasPorModulo: ConsultasPorModulo;
  usuariosPorRol: UsuariosPorRol;
  topUsuarios: TopUsuario[];
}

// Logs de actividad (solo USER-ADMIN)
export interface ActivityLogResponse {
  success: boolean;
  message: string;
  data: ActivityLog[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}
```

### 3. Servicio de Estadísticas Actualizado

#### Archivo: `src/app/shared/services/stats.service.ts`

**Nuevos métodos agregados**:

```typescript
// Estadísticas del usuario actual
getMyStats(filter?: StatsFilter): Observable<UserStatsResponse>

// Estadísticas generales (solo USER-ADMIN)
getGeneralStats(filter?: StatsFilter): Observable<GeneralStatsResponse>

// Logs de actividad (solo USER-ADMIN)  
getActivityLogs(filter?: LogsFilter): Observable<ActivityLogResponse>

// Métodos de verificación de permisos
canAccessGeneralStats(): boolean
canAccessActivityLogs(): boolean
```

### 4. Autenticación Requerida para Endpoints

#### ApiClientService Actualizado
- **Archivo**: `src/app/core/services/api-client.service.ts`
- **Cambio**: Agregado parámetro `requiresAuth` a todos los métodos HTTP
- **Funcionalidad**: Automáticamente incluye el token de autorización cuando `requiresAuth = true`

#### Servicios Actualizados para Requerir Autenticación
- **ICS Service**: `src/app/features/consulta-ics/consulta-ics.service.ts`
  - Todos los endpoints `/consultaICS` y `/consultaICS/amnistia` ahora requieren autenticación
- **Estado de Cuenta Service**: `src/app/features/estado-cuenta/estado-cuenta.service.ts`
  - Todos los endpoints de estado de cuenta ahora requieren autenticación

### 5. Dashboard de Usuario Mejorado

#### Archivo: `src/app/features/dashboard/user-dashboard/user-dashboard.page.ts`

**Nuevas funcionalidades**:
- Carga automática de estadísticas del usuario al inicializar
- Secciones especiales para usuarios `USER-ADMIN`
- Botón de refrescar estadísticas
- Navegación a estadísticas generales y logs (solo USER-ADMIN)

#### Archivo: `src/app/features/dashboard/user-dashboard/user-dashboard.page.html`

**Nuevas secciones agregadas**:
- **Sección de Estadísticas del Usuario**: Muestra total de consultas, consultas de últimos 30 días, consultas de hoy, y distribución por módulo
- **Sección de Gestión Administrativa**: Solo visible para usuarios `USER-ADMIN`, permite acceso a estadísticas generales y logs de actividad

#### Archivo: `src/app/features/dashboard/user-dashboard/user-dashboard.page.scss`

**Nuevos estilos agregados**:
- Estilos para tarjetas de estadísticas con colores distintivos
- Animaciones y efectos hover mejorados
- Diseño responsivo para las nuevas secciones
- Estilos especiales para la sección administrativa

## Endpoints Backend Requeridos

Para que la implementación funcione completamente, el backend debe proporcionar estos endpoints:

### 1. Estadísticas del Usuario Actual
```
GET /users/my-stats
Headers: Authorization: Bearer <token>
Query Params: 
- fecha_inicio (opcional)
- fecha_fin (opcional)  
- modulo (opcional): 'ics' | 'amnistia' | 'ec'

Response:
{
  "success": true,
  "message": "Estadísticas obtenidas exitosamente",
  "data": {
    "totalConsultas": 150,
    "consultasUltimos30Dias": 45,
    "consultasHoy": 5,
    "consultasPorModulo": {
      "ics": 75,
      "amnistia": 30,
      "ec": 45
    },
    "ultimaActividad": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Estadísticas Generales (solo USER-ADMIN)
```
GET /users/general
Headers: Authorization: Bearer <token>
Query Params: 
- fecha_inicio (opcional)
- fecha_fin (opcional)
- modulo (opcional)
- usuario_id (opcional)

Response:
{
  "success": true,
  "message": "Estadísticas generales obtenidas exitosamente",
  "data": {
    "totalUsuarios": 25,
    "usuariosActivos": 20,
    "consultasTotales": 3750,
    "consultasUltimos30Dias": 1125,
    "consultasHoy": 85,
    "consultasPorModulo": {
      "ics": 1875,
      "amnistia": 750,
      "ec": 1125
    },
    "usuariosPorRol": {
      "ADMIN": 2,
      "USER-ADMIN": 3,
      "MARKET": 5,
      "USER": 15
    },
    "topUsuarios": [
      {
        "id": "user123",
        "nombre": "Juan",
        "apellido": "Pérez",
        "totalConsultas": 250,
        "ultimaActividad": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

### 3. Logs de Actividad (solo USER-ADMIN)
```
GET /users/logs
Headers: Authorization: Bearer <token>
Query Params:
- fecha_inicio (opcional)
- fecha_fin (opcional)
- modulo (opcional)
- usuario_id (opcional)
- accion (opcional)
- page (opcional, default: 1)
- per_page (opcional, default: 20)

Response:
{
  "success": true,
  "message": "Logs de actividad obtenidos exitosamente",
  "data": [
    {
      "id": "log123",
      "usuario_id": "user456",
      "accion": "consulta_ics",
      "modulo": "ics",
      "detalles": {
        "dni": "12345678",
        "resultados": 3
      },
      "ip": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "fecha_creacion": "2024-01-15T10:30:00Z",
      "usuario": {
        "id": "user456",
        "nombre": "María",
        "apellido": "García",
        "correo": "maria@example.com",
        "role": "USER"
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total": 1250,
    "total_pages": 63
  }
}
```

### 4. Autenticación en Endpoints Existentes

Los siguientes endpoints ahora requieren el header de autorización:

```
GET /consultaICS
GET /consultaICS/amnistia
GET /consultaEC
GET /consultaEC/amnistia
Headers: Authorization: Bearer <token>
```

## Características Principales

1. **Seguridad Mejorada**: Todos los endpoints de consulta ahora requieren autenticación
2. **Estadísticas Personalizadas**: Cada usuario puede ver sus propias estadísticas de uso
3. **Gestión Administrativa**: Usuarios `USER-ADMIN` tienen acceso a estadísticas globales y logs
4. **Diseño Responsivo**: Las nuevas secciones se adaptan perfectamente a móviles y desktop
5. **Tiempo Real**: Las estadísticas se pueden refrescar en cualquier momento
6. **Filtros Avanzados**: Soporte para filtrar estadísticas por fechas, módulos y usuarios

## Estado de la Implementación

✅ **Completado**:
- Interfaces y tipos TypeScript
- Servicio de estadísticas con autenticación
- Actualización de servicios existentes para requerir autenticación  
- Dashboard de usuario con nuevas secciones
- Soporte completo para rol USER-ADMIN
- Compilación exitosa del proyecto

⏳ **Pendiente** (requiere backend):
- Implementación de endpoints en el servidor
- Pruebas de integración con datos reales
- Creación de páginas dedicadas para estadísticas generales y logs (opcional)

La implementación frontend está lista y esperando la disponibilidad de los endpoints backend correspondientes.
