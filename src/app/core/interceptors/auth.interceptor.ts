import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { Capacitor } from '@capacitor/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // No agregar headers a requests que no sean de la API
  if (!req.url.includes('/api/')) {
    return next(req);
  }

  // Configuración específica para móvil
  const isMobile = Capacitor.isNativePlatform();
  
  // Clonar request para agregar withCredentials y headers apropiados
  const authRequest = req.clone({
    setHeaders: {
      'Content-Type': 'application/json',
      ...(isMobile && {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*'
      })
    },
    withCredentials: true
  });

  return next(authRequest);
};
