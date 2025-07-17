import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, tap, catchError, interval, timer, EMPTY, from } from 'rxjs';
import { switchMap, takeWhile, filter, share, retry, delay } from 'rxjs/operators';
import { User, LoginRequest, AuthResponse, ApiResponse } from '../interfaces';
import { API_CONFIG } from '../constants';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toastController = inject(ToastController);

  // Signals para el estado de autenticación con mayor granularidad
  private _user = signal<User | null>(null);
  private _isAuthenticated = signal<boolean>(false);
  private _isLoading = signal<boolean>(true);
  private _authCheckComplete = signal<boolean>(false);
  private _initializationState = signal<'checking' | 'success' | 'failed'>('checking');

  // Control robusto de refresh token
  private refreshInProgress = false;
  private tokenRefreshTimer?: any;
  private readonly REFRESH_INTERVAL = 13 * 60 * 1000; // 13 minutos
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private retryAttempts = 0;

  // Computed signals
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly authCheckComplete = this._authCheckComplete.asReadonly();
  readonly initializationState = this._initializationState.asReadonly();
  readonly userRole = computed(() => this._user()?.role || null);
  readonly userName = computed(() => {
    const user = this._user();
    return user ? `${user.nombre} ${user.apellido}` : '';
  });

  constructor() {
    console.log('🔧 AuthService: Inicializando...');
    this.initializeAuth();
  }

  /**
   * Inicializar autenticación de manera robusta al cargar la aplicación
   */
  private async initializeAuth(): Promise<void> {
    console.log('🔧 AuthService: Iniciando verificación de autenticación...');
    this._initializationState.set('checking');
    this._isLoading.set(true);
    this.retryAttempts = 0;

    try {
      await this.attemptAuthInitialization();
    } catch (error) {
      console.error('❌ AuthService: Error crítico en inicialización:', error);
      this._initializationState.set('failed');
      this.clearAuthState();
    }
  }

  /**
   * Intentar inicialización con retry automático
   */
  private async attemptAuthInitialization(): Promise<void> {
    while (this.retryAttempts < this.MAX_RETRY_ATTEMPTS) {
      try {
        console.log(`🔄 AuthService: Intento ${this.retryAttempts + 1}/${this.MAX_RETRY_ATTEMPTS} de verificación...`);
        
        // Verificar si hay cookies de autenticación válidas
        const profile = await this.getProfile().toPromise();
        
        if (profile?.user) {
          // ✅ Usuario autenticado exitosamente
          this._user.set(profile.user);
          this._isAuthenticated.set(true);
          this._initializationState.set('success');
          this.startTokenRefreshTimer();
          console.log('✅ Usuario autenticado automáticamente:', profile.user);
          break;
        } else {
          // No hay sesión válida
          console.log('ℹ️ No hay sesión activa válida');
          this.clearAuthState();
          break;
        }
      } catch (error: any) {
        this.retryAttempts++;
        console.log(`❌ Intento ${this.retryAttempts} falló:`, error.message);
        
        if (this.retryAttempts >= this.MAX_RETRY_ATTEMPTS) {
          console.log('❌ No hay sesión activa o token expirado después de todos los intentos');
          this.clearAuthState();
          break;
        }
        
        // Esperar antes del siguiente intento (backoff exponencial)
        const delay = Math.pow(2, this.retryAttempts) * 1000;
        console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    this._isLoading.set(false);
    this._authCheckComplete.set(true);
    console.log('🏁 AuthService: Inicialización completada');
  }

  /**
   * Verificar el estado de autenticación
   */
  async checkAuthStatus(): Promise<boolean> {
    try {
      const profile = await this.getProfile().toPromise();
      if (profile?.user) {
        this._user.set(profile.user);
        this._isAuthenticated.set(true);
        return true;
      }
      return false;
    } catch (error) {
      this.clearAuthState();
      return false;
    }
  }

  /**
   * Iniciar sesión con manejo robusto
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    console.log('🔐 Iniciando login...');
    this._isLoading.set(true);
    
    return this.http.post<AuthResponse>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`, credentials, {
      withCredentials: true // Importante para cookies HTTP-only
    }).pipe(
      tap(response => {
        console.log('✅ Login exitoso:', response.user);
        this._user.set(response.user);
        this._isAuthenticated.set(true);
        this._isLoading.set(false);
        this._initializationState.set('success');
        this._authCheckComplete.set(true);
        this.startTokenRefreshTimer();
        this.showToast('Inicio de sesión exitoso', 'success');
      }),
      catchError(error => {
        console.error('❌ Error en login:', error);
        this._isLoading.set(false);
        this.handleAuthError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cerrar sesión con limpieza completa
   */
  logout(): Observable<ApiResponse<any>> {
    console.log('🚪 Cerrando sesión...');
    this._isLoading.set(true);
    this.stopTokenRefreshTimer();
    
    return this.http.post<ApiResponse<any>>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGOUT}`, {}, {
      withCredentials: true
    }).pipe(
      tap(() => {
        console.log('✅ Logout exitoso');
        this.clearAuthState();
        this.router.navigate(['/login']);
        this.showToast('Sesión cerrada exitosamente', 'success');
      }),
      catchError(error => {
        console.log('⚠️ Error en logout pero limpiando sesión local:', error);
        // Aun si hay error en el servidor, limpiar la sesión local
        this.clearAuthState();
        this.router.navigate(['/login']);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener perfil del usuario
   */
  getProfile(): Observable<{ user: User }> {
    return this.http.post<{ user: User }>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.PROFILE}`, {}, {
      withCredentials: true
    });
  }

  /**
   * Renovar token de acceso de manera robusta
   */
  refreshToken(): Observable<ApiResponse<any>> {
    if (this.refreshInProgress) {
      console.log('🔄 Refresh ya en progreso, evitando duplicación');
      return EMPTY;
    }

    this.refreshInProgress = true;
    console.log('🔄 Renovando token...');

    return this.http.post<ApiResponse<any>>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`, {}, {
      withCredentials: true
    }).pipe(
      retry({
        count: 2,
        delay: (error, retryCount) => {
          console.log(`🔄 Retry ${retryCount} para refresh token...`);
          return timer(1000 * retryCount);
        }
      }),
      tap(response => {
        console.log('✅ Token renovado exitosamente');
        this.refreshInProgress = false;
      }),
      catchError(error => {
        console.log('❌ Error al renovar token:', error);
        this.refreshInProgress = false;
        
        // Si el refresh token también expiró, cerrar sesión
        if (error.status === 401) {
          console.log('🚫 Refresh token expirado, forzando logout');
          this.forceLogout();
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Iniciar timer robusto para renovación automática de tokens
   */
  private startTokenRefreshTimer(): void {
    this.stopTokenRefreshTimer(); // Limpiar timer anterior si existe

    console.log('⏰ Timer de renovación de token iniciado (cada 13 minutos)');
    
    // Usar setInterval en lugar de RxJS interval para mayor persistencia
    this.tokenRefreshTimer = setInterval(() => {
      if (this._isAuthenticated() && !this.refreshInProgress) {
        console.log('🔄 Renovando token automáticamente...');
        
        this.refreshToken().subscribe({
          next: () => {
            console.log('✅ Token renovado automáticamente');
          },
          error: (error) => {
            console.error('❌ Error en renovación automática:', error);
            if (error.status === 401) {
              console.log('🚫 Forzando logout por sesión expirada');
              this.forceLogout();
            }
          }
        });
      }
    }, this.REFRESH_INTERVAL);
  }

  /**
   * Detener timer de renovación de tokens
   */
  private stopTokenRefreshTimer(): void {
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer);
      this.tokenRefreshTimer = undefined;
      console.log('⏹️ Timer de renovación detenido');
    }
  }

  /**
   * Limpiar estado de autenticación de manera completa
   */
  private clearAuthState(): void {
    console.log('🧹 Limpiando estado de autenticación...');
    this._user.set(null);
    this._isAuthenticated.set(false);
    this._isLoading.set(false);
    this._initializationState.set('failed');
    this._authCheckComplete.set(true); // Importante: marcar como completado
    this.stopTokenRefreshTimer();
    this.refreshInProgress = false;
    this.retryAttempts = 0;
    
    // Limpiar cualquier almacenamiento local residual
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.clear();
    } catch (error) {
      console.log('⚠️ Error limpiando localStorage:', error);
    }
  }

  /**
   * Cambiar contraseña
   */
  changePassword(currentPassword: string, newPassword: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD}`, {
      currentPassword,
      newPassword
    }, {
      withCredentials: true
    }).pipe(
      tap(() => {
        this.showToast('Contraseña cambiada exitosamente', 'success');
      }),
      catchError(error => {
        this.handleAuthError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    return this._user()?.role === role;
  }

  /**
   * Verificar si el usuario tiene alguno de los roles especificados
   */
  hasAnyRole(roles: string[]): boolean {
    const userRole = this._user()?.role;
    return userRole ? roles.includes(userRole) : false;
  }

  /**
   * Forzar cierre de sesión (para casos de error de autenticación)
   */
  forceLogout(): void {
    console.log('🚫 Forzando logout por sesión expirada');
    this.clearAuthState();
    this.router.navigate(['/login']);
    this.showToast('Sesión expirada. Por favor, inicie sesión nuevamente.', 'warning');
  }

  /**
   * Intentar renovar token si está próximo a expirar
   */
  async attemptTokenRefresh(): Promise<boolean> {
    try {
      await this.refreshToken().toPromise();
      return true;
    } catch (error: any) {
      console.error('❌ Error al intentar renovar token:', error);
      if (error.status === 401) {
        this.forceLogout();
      }
      return false;
    }
  }

  /**
   * Manejo de errores de autenticación
   */
  private handleAuthError(error: HttpErrorResponse): void {
    let message = 'Error desconocido';
    
    if (error.error?.message) {
      message = error.error.message;
    } else if (error.status === 401) {
      message = 'Credenciales inválidas o sesión expirada';
    } else if (error.status === 403) {
      message = 'No tiene permisos para realizar esta acción';
    } else if (error.status === 0) {
      message = 'Error de conexión. Verifique su conexión a internet.';
    } else if (error.status >= 500) {
      message = 'Error interno del servidor. Intente nuevamente.';
    }

    this.showToast(message, 'danger');
    console.error('❌ Error de autenticación:', error);
  }

  /**
   * Mostrar toast de notificación
   */
  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color
    });
    toast.present();
  }

  /**
   * Método para uso en interceptores HTTP
   */
  isTokenExpiredError(error: HttpErrorResponse): boolean {
    return error.status === 401 && !error.url?.includes('/auth/login');
  }

  /**
   * Limpiar completamente la autenticación (útil para desarrollo)
   */
  clearAuth(): void {
    this.clearAuthState();
    this.router.navigate(['/login']);
  }
}
