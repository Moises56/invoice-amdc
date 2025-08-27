# Script de Testing - Recuperación Bluetooth

## 🚀 **Comandos de Testing Inmediato**

### 1. **Verificar Build y Deploy**
```bash
# Compilar (debe ser exitoso)
npm run build

# Sincronizar con Capacitor
npx cap sync

# Ejecutar en dispositivo Android
npx cap run android
```

### 2. **Testing Manual en Dispositivo**

#### **Paso 1: Navegación**
1. Abrir app en dispositivo
2. Ir a **Configuración Bluetooth** (desde menú principal)
3. **VERIFICAR**: Header no superpuesto con iconos nativos

#### **Paso 2: Safe Area**
- **Samsung A56**: ¿Header respeta barra de estado?
- **Honor**: ¿Header respeta notch?
- **Samsung S21**: ¿Header respeta punch hole?

#### **Paso 3: Permisos**
1. Tocar **\"Escanear Dispositivos\"**
2. **VERIFICAR**: Se solicitan permisos correctamente
3. **VERIFICAR**: Permisos se conceden sin errores

#### **Paso 4: Funcionalidad Bluetooth**
1. **VERIFICAR**: Escaneo encuentra dispositivos
2. **VERIFICAR**: Lista de dispositivos se muestra
3. Seleccionar impresora térmica
4. **VERIFICAR**: Conexión exitosa
5. Tocar **\"Imprimir Prueba\"**
6. **VERIFICAR**: Impresión funciona

## 📊 **Checklist de Resultados**

### Samsung A56 (Referencia):
- [ ] Safe area: Header no superpuesto
- [ ] Permisos: Se conceden correctamente
- [ ] Escaneo: Encuentra dispositivos
- [ ] Conexión: Se conecta a impresora
- [ ] Impresión: Funciona correctamente

### Honor:
- [ ] Safe area: Header respeta notch
- [ ] Permisos: Se conceden correctamente
- [ ] Escaneo: Encuentra dispositivos
- [ ] Conexión: Se conecta a impresora
- [ ] Impresión: Funciona correctamente

### Samsung S21:
- [ ] Safe area: Header respeta punch hole
- [ ] Permisos: Se conceden correctamente
- [ ] Escaneo: Encuentra dispositivos
- [ ] Conexión: Se conecta a impresora
- [ ] Impresión: Funciona correctamente

## 🔍 **Diagnóstico de Problemas**

### Si Safe Area falla:
```scss
// Verificar en DevTools del dispositivo
.manual-header .safe-area-spacer {
  height: env(safe-area-inset-top, 24px); // ¿Se aplica correctamente?
}
```

### Si Permisos fallan:
```typescript
// Verificar en consola del dispositivo
console.log('Permisos solicitados:', permissions);
console.log('Resultado:', result.hasPermission);
```

### Si Bluetooth falla:
```javascript
// Verificar en consola
console.log('Cordova disponible:', window.cordova);
console.log('Bluetooth plugin:', window.bluetoothSerial);
```

## 📱 **Testing por Dispositivo**

### **Orden de Testing**:
1. **Samsung A56 PRIMERO** (debe funcionar como referencia)
2. **Honor** (si A56 funciona)
3. **Samsung S21** (si Honor funciona)

### **Si algún dispositivo falla**:
1. **PARAR** testing en otros dispositivos
2. **IDENTIFICAR** problema específico
3. **CORREGIR** solo ese problema
4. **RE-PROBAR** solo en ese dispositivo
5. **CONTINUAR** con otros dispositivos

## 🎯 **Criterios de Éxito Total**

### ✅ **Éxito Completo**:
- Todos los dispositivos pasan todos los tests
- Funcionalidad básica restaurada
- UI correcta en todos los dispositivos

### ⚠️ **Éxito Parcial**:
- Samsung A56 funciona (mínimo requerido)
- Otros dispositivos tienen problemas específicos identificados

### ❌ **Fallo**:
- Samsung A56 no funciona
- Regresión de funcionalidad básica

## 📝 **Documentar Resultados**

### Crear archivo: `RESULTADOS-TESTING-[FECHA].md`
```markdown
# Resultados Testing - [FECHA]

## Samsung A56:
- Safe Area: ✅/❌
- Permisos: ✅/❌
- Escaneo: ✅/❌
- Conexión: ✅/❌
- Impresión: ✅/❌

## Honor:
- Safe Area: ✅/❌
- Permisos: ✅/❌
- Escaneo: ✅/❌
- Conexión: ✅/❌
- Impresión: ✅/❌

## Samsung S21:
- Safe Area: ✅/❌
- Permisos: ✅/❌
- Escaneo: ✅/❌
- Conexión: ✅/❌
- Impresión: ✅/❌

## Problemas Identificados:
[Describir problemas específicos]

## Próximos Pasos:
[Acciones requeridas]
```

## 🚨 **IMPORTANTE**

**Este testing es CRÍTICO para confirmar que la recuperación fue exitosa.**

**NO implementar mejoras adicionales hasta confirmar que la funcionalidad básica está restaurada en todos los dispositivos objetivo.**