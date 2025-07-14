# 🧪 Guía de Pruebas - Autenticación con Cookies HTTP-Only

## 🔬 **Casos de Prueba para Validar la Implementación**

### **1. Prueba de Inicio de Aplicación**
```
✅ CASO: Carga inicial sin cookies
1. Abrir aplicación en navegador nuevo/incógnito
2. Esperar carga completa
3. ESPERADO: Redirige automáticamente a /login
4. VERIFICAR: Console muestra "❌ No hay sesión activa o token expirado"

✅ CASO: Carga inicial con cookies válidas
1. Login exitoso en una pestaña
2. Abrir nueva pestaña con la misma URL
3. ESPERADO: Mantiene sesión, acceso directo al dashboard
4. VERIFICAR: Console muestra "✅ Usuario autenticado automáticamente"
```

### **2. Prueba de Login**
```
✅ CASO: Login exitoso
1. Ir a /login
2. Ingresar credenciales válidas
3. Enviar formulario
4. ESPERADO: Redirección a dashboard
5. VERIFICAR: Console muestra "✅ Login exitoso" y "⏰ Timer de renovación iniciado"

✅ CASO: Login con credenciales inválidas
1. Ingresar credenciales incorrectas
2. ESPERADO: Mensaje de error
3. VERIFICAR: No se establecen cookies
```

### **3. Prueba de Auto-Refresh Token**
```
✅ CASO: Renovación automática
1. Login exitoso
2. Esperar 13+ minutos (o modificar timer para testing)
3. ESPERADO: Renovación automática invisible
4. VERIFICAR: Console muestra "🔄 Renovando token..." y "✅ Token renovado automáticamente"

✅ CASO: Fallo en renovación
1. Invalidar refresh_token desde backend
2. Esperar ciclo de renovación
3. ESPERADO: Logout automático
4. VERIFICAR: Console muestra "🚫 Forzando logout por sesión expirada"
```

### **4. Prueba de Interceptor HTTP**
```
✅ CASO: Token expirado durante navegación
1. Login exitoso
2. Invalidar access_token (backend)
3. Hacer cualquier acción que requiera API
4. ESPERADO: Renovación transparente
5. VERIFICAR: Console muestra "🔄 Token expirado, intentando renovar..."

✅ CASO: Ambos tokens expirados
1. Invalidar access_token y refresh_token
2. Hacer acción que requiera API
3. ESPERADO: Logout automático
4. VERIFICAR: Redirección a login
```

### **5. Prueba de Navegación y Guards**
```
✅ CASO: Acceso a rutas protegidas sin auth
1. Ir directamente a /dashboard sin login
2. ESPERADO: Redirección a /login
3. VERIFICAR: Console muestra "🚫 Usuario no autenticado, redirigiendo al login"

✅ CASO: Acceso a login estando autenticado
1. Estar logueado
2. Ir a /login
3. ESPERADO: Redirección automática a dashboard
4. VERIFICAR: Console muestra "✅ Usuario ya autenticado, redirigiendo al dashboard"
```

### **6. Prueba de Logout**
```
✅ CASO: Logout normal
1. Estar logueado
2. Hacer logout
3. ESPERADO: Limpieza completa de estado
4. VERIFICAR: Console muestra "✅ Logout exitoso" y "⏹️ Timer de renovación detenido"

✅ CASO: Logout con error de backend
1. Simular error 500 en endpoint logout
2. Hacer logout
3. ESPERADO: Limpieza local de todos modos
4. VERIFICAR: Estado limpio localmente
```

### **7. Prueba de Recarga de Página**
```
✅ CASO: Recarga con sesión válida
1. Login exitoso
2. Navegar por la app
3. Presionar F5 (recarga completa)
4. ESPERADO: Mantiene sesión sin pedir login
5. VERIFICAR: Acceso inmediato al contenido

✅ CASO: Recarga con sesión expirada
1. Login exitoso
2. Invalidar cookies desde backend/DevTools
3. Presionar F5
4. ESPERADO: Redirige a login
5. VERIFICAR: Estado limpio
```

---

## 🐛 **Debugging y Monitoreo**

### **Console Logs a Buscar:**
```javascript
// Autenticación exitosa
"✅ Usuario autenticado automáticamente: {user data}"
"✅ Login exitoso: {user data}"

// Sistema de renovación
"⏰ Timer de renovación de token iniciado (cada 13 minutos)"
"🔄 Renovando token..."
"✅ Token renovado exitosamente"
"⏹️ Timer de renovación detenido"

// Errores y fallos
"❌ No hay sesión activa o token expirado"
"❌ Error al renovar token: {error}"
"🚫 Forzando logout por sesión expirada"

// Navegación
"✅ Usuario autenticado, permitiendo acceso"
"🚫 Usuario no autenticado, redirigiendo al login"

// Interceptor
"🔄 Token expirado, intentando renovar..."
"✅ Token renovado exitosamente en interceptor"
"❌ Error al renovar token en interceptor: {error}"
```

### **DevTools - Application Tab:**
```
Verificar cookies:
- access_token: Presente, HttpOnly: ✅
- refresh_token: Presente, HttpOnly: ✅
- Secure: ✅ (en HTTPS)
- SameSite: Strict ✅
```

### **Network Tab:**
```
Verificar requests:
- withCredentials: true en todas las peticiones /api/*
- Cookies enviadas automáticamente
- Responses 401 seguidos de /auth/refresh
- Reintentos automáticos después de refresh
```

---

## 🚀 **Comandos de Testing Rápido**

### **En Console del Browser:**
```javascript
// Verificar estado actual
console.log('Auth Status:', window.angular?.getComponent?.('app-root')?.authService?.isAuthenticated());

// Forzar refresh (para testing)
window.angular?.getComponent?.('app-root')?.authService?.refreshToken().subscribe();

// Forzar logout (para testing)
window.angular?.getComponent?.('app-root')?.authService?.forceLogout();

// Verificar cookies
document.cookie.split('; ').filter(c => c.includes('token'));
```

### **Para Backend Testing:**
```bash
# Verificar endpoint de refresh
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Cookie: refresh_token=YOUR_REFRESH_TOKEN" \
  -v

# Verificar endpoint de profile
curl -X POST http://localhost:3000/api/auth/profile \
  -H "Cookie: access_token=YOUR_ACCESS_TOKEN" \
  -v
```

---

## ✅ **Checklist de Validación Final**

- [ ] **Inicio sin cookies**: Redirige a login ✅
- [ ] **Inicio con cookies**: Mantiene sesión ✅
- [ ] **Login exitoso**: Establece estado correcto ✅
- [ ] **Auto-refresh**: Funciona cada 13 minutos ✅
- [ ] **Interceptor 401**: Maneja tokens expirados ✅
- [ ] **Guards**: Protegen rutas correctamente ✅
- [ ] **Logout**: Limpia estado completamente ✅
- [ ] **Recarga**: Mantiene sesión válida ✅
- [ ] **Cookies HTTP-only**: No accesibles por JS ✅
- [ ] **Console logs**: Informativos y claros ✅

---

## 🎯 **Resultado Esperado**

Con estas pruebas completadas exitosamente, el sistema de autenticación con cookies HTTP-only estará **100% funcional** y listo para producción, ofreciendo:

- **🔒 Máxima seguridad** - Cookies HTTP-only inmunes a XSS
- **🔄 Experiencia fluida** - Renovación automática transparente  
- **📱 Compatibilidad total** - Funciona en web y móvil
- **🛡️ Manejo robusto** - Recuperación automática de errores
- **📊 Debugging fácil** - Logs detallados para desarrollo

**Estado: LISTO PARA TESTING** ✅
