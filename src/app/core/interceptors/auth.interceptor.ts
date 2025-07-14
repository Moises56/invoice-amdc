import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { catchError, switchMap, filter, take, finalize, retry, delay } from 'rxjs/operators';
import { throwError, BehaviorSubject, Observable, timer, EMPTY } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Capacitor } from '@capacitor/core';

// Estado global mejorado para el manejo del refresh token
let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

// Cola de peticiones pendientes durante el refresh
let pendingRequests: Array<{
  request: HttpRequest<any>;
  next: HttpHandlerFn;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  // No interceptar requests que no sean de la API
  if (!req.url.includes('/api/')) {
    return next(req);
  }

  // Configuración mejorada para móvil y web
  const isMobile = Capacitor.isNativePlatform();
  
  // Clonar request con configuración optimizada
  const authRequest = req.clone({
    setHeaders: {
      'Content-Type': 'application/json',
      ...(isMobile && {
        'Access-Control-Allow-Credentials': 'true'
      })
    },
    withCredentials: true // Crucial para HTTP-only cookies
  });

  return next(authRequest).pipe(
    retry({
      count: 1,
      delay: (error, retryCount) => {
        // Solo retry para errores de red, no para 401
        if (error.status === 0 || error.status >= 500) {
          console.log(`🔄 Retrying request ${retryCount}/1 due to network error`);
          return timer(1000);
        }
        throw error;
      }
    }),
    catchError((error: HttpErrorResponse) => {
      // Solo manejar errores 401 que no sean de endpoints de auth
      if (error.status === 401 && !isAuthEndpoint(req.url)) {
        console.log('🔄 Token expirado, intentando renovar...');
        return handle401Error(authRequest, next, authService);
      }

      return throwError(() => error);
    })
  );
};

/**
 * Manejar errores 401 (token expirado) con sistema de cola mejorado
 */
function handle401Error(request: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);
    
    console.log('🔄 Iniciando renovación de token...');

    return authService.refreshToken().pipe(
      switchMap(() => {
        console.log('✅ Token renovado exitosamente en interceptor');
        isRefreshing = false;
        refreshTokenSubject.next(true);
        
        // Procesar cola de peticiones pendientes
        processPendingRequests();
        
        // Reintentar la petición original con el nuevo token
        return next(request.clone({
          withCredentials: true
        }));
      }),
      catchError((error: HttpErrorResponse) => {
        console.log('❌ Error al renovar token en interceptor:', error);
        isRefreshing = false;
        refreshTokenSubject.next(null);
        
        // Rechazar todas las peticiones pendientes
        rejectPendingRequests(error);
        
        // Si el refresh token también expiró, forzar logout
        if (error.status === 401) {
          console.log('🚫 Refresh token expirado, forzando logout');
          authService.forceLogout();
        }
        
        return throwError(() => error);
      }),
      finalize(() => {
        isRefreshing = false;
      })
    );
  } else {
    // Si ya está renovando, agregar a la cola
    console.log('⏳ Agregando petición a la cola de espera...');
    
    return new Observable(observer => {
      pendingRequests.push({
        request: request.clone({ withCredentials: true }),
        next,
        resolve: (result) => {
          observer.next(result);
          observer.complete();
        },
        reject: (error) => {
          observer.error(error);
        }
      });
    });
  }
}

/**
 * Procesar todas las peticiones pendientes después de renovar el token
 */
function processPendingRequests(): void {
  console.log(`🔄 Procesando ${pendingRequests.length} peticiones pendientes...`);
  
  pendingRequests.forEach(({ request, next, resolve, reject }) => {
    next(request).subscribe({
      next: resolve,
      error: reject
    });
  });
  
  pendingRequests = [];
}

/**
 * Rechazar todas las peticiones pendientes en caso de error
 */
function rejectPendingRequests(error: any): void {
  console.log(`❌ Rechazando ${pendingRequests.length} peticiones pendientes...`);
  
  pendingRequests.forEach(({ reject }) => {
    reject(error);
  });
  
  pendingRequests = [];
}

/**
 * Verificar si es un endpoint de autenticación
 */
function isAuthEndpoint(url: string): boolean {
  return url.includes('/auth/login') || 
         url.includes('/auth/refresh') ||
         url.includes('/auth/profile') ||
         url.includes('/auth/logout');
}
