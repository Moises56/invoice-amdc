# CONFIGURACIÓN DE PERMISOS PARA ROL USER-ADMIN

## Resumen de Permisos Implementados

El rol **USER-ADMIN** ha sido configurado para tener acceso a **EXACTAMENTE LO MISMO** que el rol **USER** más las funcionalidades administrativas de estadísticas.

## ✅ Endpoints de Estadísticas Configurados

### 1. `/api/user-stats/my-stats` 
- **Permisos**: USER y USER-ADMIN
- **Descripción**: Estadísticas personales del usuario autenticado
- **Estado**: ❌ **PENDIENTE EN BACKEND** (Error 403)

### 2. `/api/user-stats/general`
- **Permisos**: USER-ADMIN únicamente  
- **Descripción**: Estadísticas generales del sistema
- **Estado**: ❌ **PENDIENTE EN BACKEND** (Error 403)

### 3. `/api/user-stats/logs`
- **Permisos**: USER-ADMIN únicamente
- **Descripción**: Logs de actividad de usuarios
- **Estado**: ❌ **PENDIENTE EN BACKEND** (Error 403)

## ✅ Permisos en Rutas (app.routes.ts) - CORREGIDO

### Rutas accesibles para USER-ADMIN (SIN acceso a locales/facturas):
- ✅ `/dashboard/user` - Dashboard de usuario
- ✅ `/estado-cuenta` - Estado de cuenta
- ✅ `/estado-cuenta-amnistia` - Cuenta con amnistía  
- ✅ `/consulta-ics` - Consulta ICS
- ✅ `/consulta-ics-amnistia` - ICS con amnistía
- ❌ `/locales` - **REMOVIDO** (solo ADMIN, MARKET, USER)
- ❌ `/facturas` - **REMOVIDO** (solo ADMIN, MARKET, USER)
- ✅ `/general-stats` - Estadísticas generales (exclusivo USER-ADMIN)
- ✅ `/activity-logs` - Logs de actividad (exclusivo USER-ADMIN)
- ✅ `/bluetooth` - Configuración Bluetooth
- ✅ `/perfil` - Perfil de usuario

## ✅ Menú Lateral (app.component.ts) - CORREGIDO

### Menú USER-ADMIN (SIN locales/facturas):
- ✅ Mi Dashboard
- ✅ Estado de Cuenta
- ✅ Cuenta con Amnistía
- ✅ Consulta ICS
- ✅ ICS con Amnistía
- ✅ Estadísticas Generales (exclusivo USER-ADMIN)
- ✅ Logs de Actividad (exclusivo USER-ADMIN)
- ✅ Config. Bluetooth

## 🚨 **ESPECIFICACIONES PARA EL BACKEND**

### Endpoints que deben implementarse:

#### 1. GET `/api/user-stats/my-stats`
```typescript
// Permisos: USER y USER-ADMIN
// Headers: Authorization: Bearer <token>
// Response esperado:
{
  "success": true,
  "data": {
    "totalConsultas": number,
    "consultasHoy": number,
    "consultasUltimos30Dias": number,
    "consultasPorModulo": {
      "ics": number,
      "amnistia": number,
      "ec": number
    },
    "ultimaActividad": string // ISO date
  }
}
```

#### 2. GET `/api/user-stats/general`  
```typescript
// Permisos: USER-ADMIN únicamente
// Headers: Authorization: Bearer <token>
// Response esperado:
{
  "success": true,
  "data": {
    "totalUsuarios": number,
    "usuariosActivos": number,
    "consultasHoy": number,
    "consultasTotal": number,
    "usuariosPorRol": {
      "USER": number,
      "USER-ADMIN": number,
      "ADMIN": number,
      "MARKET": number
    },
    "topUsuarios": [
      {
        "usuario_id": string,
        "nombre": string,
        "apellido": string,
        "correo": string,
        "totalConsultas": number
      }
    ]
  }
}
```

#### 3. GET `/api/user-stats/logs`
```typescript
// Permisos: USER-ADMIN únicamente  
// Headers: Authorization: Bearer <token>
// Query params: page, per_page, fecha_inicio, fecha_fin, modulo, usuario_id, accion
// Response esperado:
{
  "success": true,
  "data": [
    {
      "id": string,
      "accion": string,
      "modulo": string,
      "fecha": string, // ISO date
      "usuario": {
        "id": string,
        "nombre": string,
        "apellido": string,
        "correo": string
      },
      "detalles": object
    }
  ],
  "pagination": {
    "current_page": number,
    "total_pages": number,
    "per_page": number,
    "total_items": number
  }
}
```

## ❌ **ERRORES ACTUALES**

### Error 403 en endpoints:
- `http://localhost:3000/api/user-stats/my-stats` → 403 Forbidden
- `http://localhost:3000/api/user-stats/general` → 403 Forbidden

**Posibles causas:**
1. Los endpoints no existen en el backend
2. Los permisos no están configurados correctamente en el backend
3. El token de autenticación no es válido
4. La ruta está mal (verificar si es `/users/` vs `/user-stats/`)

## 🔧 **PRÓXIMOS PASOS**

1. **Backend**: Implementar los 3 endpoints con sus permisos
2. **Backend**: Verificar que el rol USER-ADMIN existe y tiene permisos
3. **Frontend**: Probar endpoints una vez implementados
4. **Testing**: Verificar que USER no puede acceder a endpoints de USER-ADMIN

---
**Fecha**: 2025-08-05  
**Estado**: ✅ Frontend Completo | ❌ Backend Pendiente
