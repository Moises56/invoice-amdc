import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../../shared/enums';

export const userRoleRedirectGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  console.log('🔄 UserRoleRedirectGuard: Verificando redirección para:', state.url);
  
  // Esperar a que la inicialización de auth esté completa
  let attempts = 0;
  const maxAttempts = 50; // 5 segundos máximo
  
  while (!authService.authCheckComplete() && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  // Si no se completó la inicialización, permitir acceso (el AuthGuard se encargará)
  if (attempts >= maxAttempts) {
    console.log('⚠️ UserRoleRedirectGuard: Timeout esperando inicialización, permitiendo acceso');
    return true;
  }
  
  const user = authService.user();
  
  // Si no hay usuario autenticado, permitir que AuthGuard maneje la redirección
  if (!user) {
    console.log('ℹ️ UserRoleRedirectGuard: No hay usuario autenticado, permitiendo acceso');
    return true;
  }
  
  console.log('👤 UserRoleRedirectGuard: Usuario encontrado con rol:', user.role);
  
  if (user.role === Role.USER) {
    // Si el usuario es USER y no está ya en su dashboard, redirigir
    if (state.url !== '/dashboard/user') {
      console.log('🔄 Redirigiendo USER a /dashboard/user desde:', state.url);
      router.navigate(['/dashboard/user'], { replaceUrl: true });
      return false;
    }
    console.log('✅ USER ya está en su dashboard correcto');
  } else {
    // Si el usuario es ADMIN o MARKET y está intentando acceder al dashboard de user, redirigir
    if (state.url === '/dashboard/user') {
      console.log('🔄 Redirigiendo', user.role, 'a /dashboard desde /dashboard/user');
      router.navigate(['/dashboard'], { replaceUrl: true });
      return false;
    }
    console.log('✅', user.role, 'accediendo a ruta permitida:', state.url);
  }
  
  // Para cualquier otro caso, permitir el acceso
  return true;
};
