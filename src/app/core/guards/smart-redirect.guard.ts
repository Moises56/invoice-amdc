import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../../shared/enums';

/**
 * Guard que maneja redirecciones inteligentes basadas en el rol del usuario
 * Evita que los usuarios USER sean redirigidos incorrectamente a /dashboard
 */
export const smartRedirectGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  console.log('🧠 SmartRedirectGuard: Manejando redirección inteligente para:', state.url);
  
  // Esperar a que la inicialización de auth esté completa
  let attempts = 0;
  const maxAttempts = 50; // 5 segundos máximo
  
  while (!authService.authCheckComplete() && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  // Si no se completó la inicialización, usar redirección por defecto
  if (attempts >= maxAttempts) {
    console.log('⚠️ SmartRedirectGuard: Timeout esperando inicialización, usando redirección por defecto');
    return true; // Permitir la redirección por defecto
  }
  
  const user = authService.user();
  
  // Si no hay usuario autenticado, permitir redirección por defecto (AuthGuard manejará)
  if (!user) {
    console.log('ℹ️ SmartRedirectGuard: No hay usuario autenticado, permitiendo redirección por defecto');
    return true;
  }
  
  console.log('👤 SmartRedirectGuard: Usuario encontrado con rol:', user.role);
  
  // Verificar si ya está en la ruta correcta para evitar bucles
  if (user.role === Role.USER) {
    if (state.url === '/dashboard/user' || state.url.startsWith('/dashboard/user/')) {
      console.log('✅ SmartRedirectGuard: Usuario USER ya está en la ruta correcta');
      return true;
    }
    console.log('🔄 SmartRedirectGuard: Redirigiendo USER a /dashboard/user');
    router.navigate(['/dashboard/user'], { replaceUrl: true });
    return false;
  } else if (user.role === Role.ADMIN || user.role === Role.MARKET) {
    if (state.url === '/dashboard' || (state.url.startsWith('/dashboard') && !state.url.includes('/user'))) {
      console.log('✅ SmartRedirectGuard: Usuario', user.role, 'ya está en la ruta correcta');
      return true;
    }
    console.log('🔄 SmartRedirectGuard: Redirigiendo', user.role, 'a /dashboard');
    router.navigate(['/dashboard'], { replaceUrl: true });
    return false;
  }
  
  // Para cualquier otro caso, permitir la redirección por defecto
  console.log('✅ SmartRedirectGuard: Permitiendo redirección por defecto');
  return true;
};