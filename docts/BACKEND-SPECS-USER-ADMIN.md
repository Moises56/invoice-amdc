# ESPECIFICACIONES BACKEND - ENDPOINTS DE ESTADÍSTICAS USER-ADMIN

## 🚨 **ENDPOINTS PENDIENTES** (Retornando Error 403)

Los siguientes endpoints necesitan ser implementados en el backend:

---

## 1. **GET** `/api/user-stats/my-stats`

### Permisos:
- ✅ **USER**
- ✅ **USER-ADMIN**

### Headers requeridos:
```http
Authorization: Bearer <token>
Content-Type: application/json
```

### Query Parameters (opcionales):
```typescript
interface StatsFilter {
  fecha_inicio?: string;  // YYYY-MM-DD
  fecha_fin?: string;     // YYYY-MM-DD
  modulo?: string;        // 'ics' | 'amnistia' | 'ec'
}
```

### Response Schema:
```typescript
interface UserStatsResponse {
  success: boolean;
  data: {
    totalConsultas: number;
    consultasHoy: number;
    consultasUltimos30Dias: number;
    consultasPorModulo: {
      ics: number;
      amnistia: number;
      ec: number;
    };
    ultimaActividad: string; // ISO 8601 date
  };
}
```

### Ejemplo de Response:
```json
{
  "success": true,
  "data": {
    "totalConsultas": 150,
    "consultasHoy": 5,
    "consultasUltimos30Dias": 45,
    "consultasPorModulo": {
      "ics": 80,
      "amnistia": 40,
      "ec": 30
    },
    "ultimaActividad": "2025-08-05T14:30:00.000Z"
  }
}
```

---

## 2. **GET** `/api/user-stats/general`

### Permisos:
- ❌ **USER** (No acceso)
- ✅ **USER-ADMIN** (Únicamente)

### Headers requeridos:
```http
Authorization: Bearer <token>
Content-Type: application/json
```

### Query Parameters (opcionales):
```typescript
interface StatsFilter {
  fecha_inicio?: string;
  fecha_fin?: string;
  modulo?: string;
  usuario_id?: string;
}
```

### Response Schema:
```typescript
interface GeneralStatsResponse {
  success: boolean;
  data: {
    totalUsuarios: number;
    usuariosActivos: number;
    consultasHoy: number;
    consultasTotal: number;
    usuariosPorRol: {
      USER: number;
      "USER-ADMIN": number;
      ADMIN: number;
      MARKET: number;
    };
    topUsuarios: Array<{
      usuario_id: string;
      nombre: string;
      apellido: string;
      correo: string;
      totalConsultas: number;
    }>;
    estadisticasPorModulo: {
      ics: number;
      amnistia: number;
      ec: number;
    };
  };
}
```

### Ejemplo de Response:
```json
{
  "success": true,
  "data": {
    "totalUsuarios": 250,
    "usuariosActivos": 45,
    "consultasHoy": 120,
    "consultasTotal": 5000,
    "usuariosPorRol": {
      "USER": 200,
      "USER-ADMIN": 10,
      "ADMIN": 5,
      "MARKET": 35
    },
    "topUsuarios": [
      {
        "usuario_id": "123",
        "nombre": "Juan",
        "apellido": "Pérez",
        "correo": "juan@example.com",
        "totalConsultas": 200
      }
    ],
    "estadisticasPorModulo": {
      "ics": 3000,
      "amnistia": 1500,
      "ec": 500
    }
  }
}
```

---

## 3. **GET** `/api/user-stats/logs`

### Permisos:
- ❌ **USER** (No acceso)
- ✅ **USER-ADMIN** (Únicamente)

### Headers requeridos:
```http
Authorization: Bearer <token>
Content-Type: application/json
```

### Query Parameters:
```typescript
interface LogsFilter {
  page?: number;          // Default: 1
  per_page?: number;      // Default: 20
  fecha_inicio?: string;  // YYYY-MM-DD
  fecha_fin?: string;     // YYYY-MM-DD
  modulo?: string;        // 'ics' | 'amnistia' | 'ec' | 'login' | 'logout'
  usuario_id?: string;
  accion?: string;
}
```

### Response Schema:
```typescript
interface ActivityLogResponse {
  success: boolean;
  data: Array<{
    id: string;
    accion: string;
    modulo: string;
    fecha: string; // ISO 8601 date
    usuario: {
      id: string;
      nombre: string;
      apellido: string;
      correo: string;
    };
    detalles?: object; // Información adicional del log
  }>;
  pagination: {
    current_page: number;
    total_pages: number;
    per_page: number;
    total_items: number;
  };
}
```

### Ejemplo de Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "log_123",
      "accion": "consulta_ics",
      "modulo": "ics",
      "fecha": "2025-08-05T14:30:00.000Z",
      "usuario": {
        "id": "user_456",
        "nombre": "María",
        "apellido": "García",
        "correo": "maria@example.com"
      },
      "detalles": {
        "ip": "192.168.1.100",
        "user_agent": "Mozilla/5.0..."
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 15,
    "per_page": 20,
    "total_items": 300
  }
}
```

---

## 🔐 **IMPLEMENTACIÓN DE PERMISOS EN BACKEND**

### Middleware de Autenticación:
1. Verificar token JWT válido
2. Extraer información del usuario (ID, rol)
3. Validar que el token no haya expirado

### Middleware de Autorización:
```javascript
// Para /my-stats
const allowedRoles = ['USER', 'USER-ADMIN'];

// Para /general y /logs  
const allowedRoles = ['USER-ADMIN'];
```

### Validación de Roles:
```javascript
function checkUserPermissions(endpoint, userRole) {
  const permissions = {
    '/api/user-stats/my-stats': ['USER', 'USER-ADMIN'],
    '/api/user-stats/general': ['USER-ADMIN'],
    '/api/user-stats/logs': ['USER-ADMIN']
  };
  
  return permissions[endpoint]?.includes(userRole) || false;
}
```

---

## 🚀 **NOTAS DE IMPLEMENTACIÓN**

### Base de Datos:
- Crear tabla `user_activity_logs` si no existe
- Registrar automáticamente logs en acciones importantes
- Optimizar consultas para estadísticas (considerar índices)

### Seguridad:
- **IMPORTANTE**: Los endpoints `/general` y `/logs` son sensibles
- Solo usuarios con rol `USER-ADMIN` deben tener acceso
- Implementar rate limiting para evitar abuso

### Performance:
- Considerar caché para estadísticas generales (5-10 minutos)
- Paginación obligatoria en logs de actividad
- Limitar resultados por defecto

---

## ✅ **CHECKLIST DE IMPLEMENTACIÓN**

- [ ] **Endpoint** `/api/user-stats/my-stats`
  - [ ] Permisos: USER y USER-ADMIN
  - [ ] Response schema correcta
  - [ ] Filtros por fecha y módulo
  
- [ ] **Endpoint** `/api/user-stats/general`  
  - [ ] Permisos: Solo USER-ADMIN
  - [ ] Estadísticas del sistema completas
  - [ ] Top usuarios funcional
  
- [ ] **Endpoint** `/api/user-stats/logs`
  - [ ] Permisos: Solo USER-ADMIN
  - [ ] Paginación implementada
  - [ ] Filtros múltiples funcionando
  
- [ ] **Middleware de Autenticación**
  - [ ] Validación de tokens JWT
  - [ ] Extracción de información de usuario
  
- [ ] **Middleware de Autorización**
  - [ ] Validación de roles por endpoint
  - [ ] Respuesta 403 para accesos no autorizados

---

**Estado Actual**: ❌ Endpoints retornando 403 Forbidden  
**Requerido**: Implementación completa en backend con permisos correctos
