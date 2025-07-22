import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../../shared/enums';

export const userRoleRedirectGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.user();

  if (user) {
    if (user.role === Role.USER) {
      // Si el usuario es USER y no está ya en su dashboard, redirigir
      if (state.url !== '/dashboard/user') {
        router.navigate(['/dashboard/user']);
        return false;
      }
    } else {
      // Si el usuario es ADMIN o MARKET y está intentando acceder al dashboard de user, redirigir
      if (state.url === '/dashboard/user') {
        router.navigate(['/dashboard']);
        return false;
      }
    }
  }
  
  // Para cualquier otro caso, permitir el acceso
  return true;
};
