import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // No agregar headers a requests que no sean de la API
  if (!req.url.includes('/api/')) {
    return next(req);
  }

  // Clonar request para agregar withCredentials
  const authRequest = req.clone({
    setHeaders: {
      'Content-Type': 'application/json'
    },
    withCredentials: true
  });

  return next(authRequest);
};
