# Sistema de Gestión de Facturas - Anulación vs Eliminación

## 🎯 Objetivo
Implementar un sistema dual para la gestión de facturas con **dos niveles de autorización**:
- **Anulación**: Cambio de estado a `ANULADA` (ADMIN + MARKET)
- **Eliminación**: Borrado físico permanente (Solo ADMIN)

## 🔒 Matriz de Permisos

| Acción | ADMIN | MARKET | USER | Método | Endpoint |
|--------|-------|--------|------|--------|----------|
| **Crear factura** | ✅ | ✅ | ✅ | POST | `/api/facturas` |
| **Leer facturas** | ✅ | ✅ | ✅ | GET | `/api/facturas` |
| **Editar factura** | ✅ | ❌ | ❌ | PATCH | `/api/facturas/{id}` |
| **Anular factura** | ✅ | ✅ | ❌ | PATCH | `/api/facturas/{id}/anular` |
| **Eliminar factura** | ✅ | ❌ | ❌ | DELETE | `/api/facturas/{id}` |
| **Pagar factura** | ✅ | ✅ | ❌ | PATCH | `/api/facturas/{id}/pay` |

## 📋 Especificación de Endpoints

### 1. Anular Factura (NUEVO) - ADMIN y MARKET
```
PATCH /api/facturas/{id}/anular
```

**Autorización**: `ADMIN`, `MARKET`
**Acción**: Cambia estado a `ANULADA`, mantiene registro para auditoría

#### Request Body
```typescript
{
  "razon_anulacion": string,     // REQUERIDO - Razón de la anulación
  "observaciones"?: string       // OPCIONAL - Observaciones adicionales
}
```

#### Response Body (Success)
```typescript
{
  "success": true,
  "message": "Factura anulada exitosamente",
  "data": {
    "id": "uuid",
    "numero_factura": "FACT-2024-001",
    "estado": "ANULADA",
    "fecha_anulacion": "2024-01-15T10:30:00Z",
    "razon_anulacion": "Error en el monto facturado",
    "anulada_por": "uuid-admin-user",
    // ... resto de campos de factura
  }
}
```

### 2. Eliminar Factura (EXISTENTE) - Solo ADMIN
```
DELETE /api/facturas/{id}
```

**Autorización**: Solo `ADMIN`
**Acción**: Eliminación física permanente del registro

#### Validaciones Adicionales
- Confirmación explícita requerida (escribir "ELIMINAR")
- Motivo obligatorio para auditoría
- Doble confirmación en la UI

## 🔒 Validaciones de Negocio

### Anulación (PATCH)
1. **Estado válido**: Solo facturas `PENDIENTE` o `VENCIDA`
2. **Autorización**: Usuario debe ser `ADMIN` o `MARKET`
3. **Campos requeridos**: `razon_anulacion` (10-500 caracteres)
4. **Auditoría**: Registro completo de la operación

### Eliminación (DELETE)
1. **Solo ADMIN**: Verificación estricta de rol
2. **Confirmación doble**: Código de confirmación + motivo obligatorio
3. **Auditoría crítica**: Registro detallado con justificación
4. **Advertencias**: Múltiples avisos de irreversibilidad

## 📊 Campos de Base de Datos

### Para Anulación
```sql
ALTER TABLE facturas ADD COLUMN fecha_anulacion DATETIME NULL;
ALTER TABLE facturas ADD COLUMN razon_anulacion VARCHAR(500) NULL;
ALTER TABLE facturas ADD COLUMN anulada_por VARCHAR(36) NULL;
```

### Para Auditoría de Eliminación
```sql
-- Registro en tabla de auditoría antes de eliminar
INSERT INTO auditoria (
  tabla, operacion, registro_id, usuario_id, 
  valores_anteriores, motivo, ip_address, timestamp
) VALUES (
  'facturas', 'DELETE_PERMANENT', @factura_id, @user_id,
  @factura_data, @motivo, @ip, GETDATE()
);
```

## � Integración Frontend - Permisos Actualizados

### 1. Definición de Permisos
```typescript
// local-detail.page.ts
canAnularFactura = computed(() => {
  const user = this.authService.user();
  return user && [Role.ADMIN, Role.MARKET].includes(user.role);
});

canDeleteFactura = computed(() => {
  const user = this.authService.user();
  return user && user.role === Role.ADMIN;
});
```

### 2. Métodos Actualizados
```typescript
// Anular factura (ADMIN + MARKET)
async anularFactura(factura: Factura) {
  // Modal con validación de razón
  // Usa facturasService.anularFactura() o anularFacturaPatch()
}

// Eliminar factura (Solo ADMIN)
async eliminarFactura(factura: Factura) {
  // Modal con doble confirmación
  // Requiere escribir "ELIMINAR" + motivo obligatorio
  // Usa facturasService.deleteFactura()
}
```

### 3. UI Condicional
```html
<!-- Botón Anular - ADMIN y MARKET -->
<ion-button 
  *ngIf="canAnularFactura()"
  (click)="anularFactura(factura)"
  color="warning">
  <ion-icon name="close-circle-outline"></ion-icon>
  Anular
</ion-button>

<!-- Botón Eliminar - Solo ADMIN -->
<ion-button 
  *ngIf="canDeleteFactura()"
  (click)="eliminarFactura(factura)"
  color="danger">
  <ion-icon name="trash-outline"></ion-icon>
  Eliminar
</ion-button>
```

## ⚠️ Consideraciones de Seguridad

### Backend
1. **Validación de roles en cada endpoint**
2. **Rate limiting** para operaciones destructivas
3. **Logs de auditoría** obligatorios
4. **Confirmación doble** para eliminación física

### Frontend
1. **Guards de navegación** por rol
2. **Validación condicional** de permisos
3. **Confirmaciones múltiples** con UX claro
4. **Indicadores visuales** de nivel de peligro

## � Errores Específicos

| Código | Escenario | Usuario | Response |
|--------|-----------|---------|----------|
| 403 | Anular factura | USER | `"No autorizado para anular facturas"` |
| 403 | Eliminar factura | MARKET | `"Solo administradores pueden eliminar facturas"` |
| 409 | Anular factura PAGADA | ADMIN | `"No se puede anular factura con estado PAGADA"` |
| 400 | Razón anulación vacía | ADMIN | `"Razón de anulación es requerida"` |

## ✅ Beneficios del Sistema Dual

### Para el Negocio
1. **Trazabilidad completa**: Facturas anuladas se mantienen para auditoría
2. **Flexibilidad operativa**: MARKET puede anular errores comunes
3. **Control administrativo**: Solo ADMIN puede eliminar permanentemente
4. **Cumplimiento legal**: Registros contables se preservan

### Para los Usuarios
1. **UX clara**: Distinción visual entre anular y eliminar
2. **Seguridad**: Confirmaciones apropiadas por nivel de riesgo
3. **Eficiencia**: MARKET no necesita escalar anulaciones simples
4. **Responsabilidad**: Cada acción tiene el nivel de autorización correcto

---

**Estado de Implementación**: 
- ✅ Frontend: Permisos y métodos actualizados
- ✅ Interfaces: AnularFacturaRequest definida
- 🔄 Backend: Pendiente implementación de PATCH /api/facturas/{id}/anular
- 📋 Testing: Pendiente validación integral

**Prioridad**: Alta - Requerido para operación diaria de mercados
