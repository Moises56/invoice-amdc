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
    console.log('🛡️ AuthGuard: Verificando autenticación...');
    console.log('🔍 AuthGuard: Estado inicial - authCheckComplete:', this.authService.authCheckComplete(), 'isAuthenticated:', this.authService.isAuthenticated());
    
    // Esperar máximo 3 segundos para la inicialización
    let attempts = 0;
    const maxAttempts = 30; // 3 segundos máximo (30 * 100ms)

    while (!this.authService.authCheckComplete() && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
      
      if (attempts % 10 === 0) {
        console.log(`⏳ AuthGuard: Esperando inicialización... intento ${attempts}/${maxAttempts}`);
      }
    }

    console.log('🔍 AuthGuard: Después de espera - authCheckComplete:', this.authService.authCheckComplete(), 'isAuthenticated:', this.authService.isAuthenticated());
    console.log('🔍 AuthGuard: Usuario actual:', this.authService.user());
    console.log('🔍 AuthGuard: Estado de inicialización:', this.authService.initializationState());

    // Verificar estado actual
    if (this.authService.isAuthenticated()) {
      console.log('✅ Usuario autenticado, permitiendo acceso');
      return true;
    }

    // Si la inicialización no se completó, intentar una verificación manual
    if (!this.authService.authCheckComplete()) {
      console.log('⚠️ AuthGuard: Inicialización no completada, intentando verificación manual...');
      try {
        const isAuth = await this.authService.checkAuthStatus();
        if (isAuth) {
          console.log('✅ Verificación manual exitosa, permitiendo acceso');
          return true;
        }
      } catch (error) {
        console.log('❌ Verificación manual falló:', error);
      }
    }

    // Si no está autenticado, redirigir al login
    console.log('🚫 Usuario no autenticado, redirigiendo al login');
    return this.router.createUrlTree(['/login']);
  }


}
