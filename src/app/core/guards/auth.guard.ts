import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);
  


  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.checkAuth();
  }

  private async checkAuth(): Promise<boolean | UrlTree> {
    // console.log('🛡️ AuthGuard: Verificando autenticación...');
    // console.log('🔍 AuthGuard: Estado inicial - authCheckComplete:', this.authService.authCheckComplete(), 'isAuthenticated:', this.authService.isAuthenticated());
    
    // Esperar máximo 2 segundos para la inicialización (reducido para mejor UX)
    let attempts = 0;
    const maxAttempts = 20; // 2 segundos máximo (20 * 100ms)

    while (!this.authService.authCheckComplete() && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
      
      if (attempts % 10 === 0) {
        console.log(`⏳ AuthGuard: Esperando inicialización... intento ${attempts}/${maxAttempts}`);
      }
    }

    // console.log('🔍 AuthGuard: Después de espera - authCheckComplete:', this.authService.authCheckComplete(), 'isAuthenticated:', this.authService.isAuthenticated());
    // console.log('🔍 AuthGuard: Usuario actual:', this.authService.user());
    // console.log('🔍 AuthGuard: Estado de inicialización:', this.authService.initializationState());

    // Verificar estado actual
    if (this.authService.isAuthenticated()) {
      // console.log('✅ Usuario autenticado, permitiendo acceso');
      return true;
    }

    // Si la inicialización no se completó después del timeout, asumir no autenticado
    if (!this.authService.authCheckComplete()) {
      // console.log('⚠️ AuthGuard: Timeout en inicialización, asumiendo no autenticado');
    }

    // Si no está autenticado, redirigir al login
    // console.log('🚫 Usuario no autenticado, redirigiendo al login');
    return this.router.createUrlTree(['/login']);
  }


}
