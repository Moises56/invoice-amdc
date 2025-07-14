import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, timer, race } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  private readonly AUTH_CHECK_TIMEOUT = 5000; // 5 segundos timeout

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.checkAuth();
  }

  private async checkAuth(): Promise<boolean | UrlTree> {
    console.log('🛡️ AuthGuard: Verificando autenticación...');
    
    // Esperar a que se complete la verificación inicial con timeout
    let attempts = 0;
    const maxAttempts = 50; // 5 segundos máximo (50 * 100ms)

    while (!this.authService.authCheckComplete() && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    // Si tomó mucho tiempo, usar fallback
    if (attempts >= maxAttempts) {
      console.log('⚠️ AuthGuard: Timeout en verificación inicial, usando fallback');
      return await this.checkAuthWithFallback();
    }

    // Verificar si está autenticado
    if (this.authService.isAuthenticated()) {
      console.log('✅ Usuario autenticado, permitiendo acceso');
      return true;
    }

    // Si no está autenticado, intentar verificar una vez más con timeout
    try {
      const isAuthWithTimeout = await this.checkAuthWithTimeout();
      if (isAuthWithTimeout) {
        console.log('✅ Usuario autenticado después de verificación con timeout');
        return true;
      }
    } catch (error) {
      console.log('❌ Error en verificación de autenticación con timeout:', error);
    }

    // Redirigir al login
    console.log('🚫 Usuario no autenticado, redirigiendo al login');
    return this.router.createUrlTree(['/login']);
  }

  /**
   * Verificar autenticación con timeout
   */
  private checkAuthWithTimeout(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const timeout = timer(this.AUTH_CHECK_TIMEOUT);
      const authCheck = this.authService.checkAuthStatus();

      // Carrera entre el check de auth y el timeout
      race(
        authCheck,
        timeout.pipe(map(() => { throw new Error('Timeout'); }))
      ).subscribe({
        next: (isAuth: boolean) => resolve(isAuth),
        error: (error) => {
          if (error.message === 'Timeout') {
            console.log('⏰ Timeout en verificación de autenticación');
            resolve(false);
          } else {
            reject(error);
          }
        }
      });
    });
  }

  /**
   * Estrategia de fallback para verificación de autenticación
   */
  private async checkAuthWithFallback(): Promise<boolean | UrlTree> {
    try {
      // Intentar verificación directa una última vez
      const isAuth = await this.authService.checkAuthStatus();
      if (isAuth) {
        console.log('✅ Usuario autenticado en fallback');
        return true;
      }
    } catch (error) {
      console.log('❌ Error en fallback de verificación:', error);
    }

    // Si todo falla, asumir no autenticado
    console.log('🚫 Fallback: Usuario no autenticado');
    return this.router.createUrlTree(['/login']);
  }
}
