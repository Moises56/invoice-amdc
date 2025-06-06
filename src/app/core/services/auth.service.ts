import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, tap, catchError } from 'rxjs';
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

  // Signals para el estado de autenticación
  private _user = signal<User | null>(null);
  private _isAuthenticated = signal<boolean>(false);
  private _isLoading = signal<boolean>(false);

  // Computed signals
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly userRole = computed(() => this._user()?.role || null);
  readonly userName = computed(() => {
    const user = this._user();
    return user ? `${user.nombre} ${user.apellido}` : '';
  });

  constructor() {
    this.checkAuthStatus();
  }

  /**
   * Verificar el estado de autenticación al inicializar
   */
  private async checkAuthStatus(): Promise<void> {
    try {
      this._isLoading.set(true);
      const profile = await this.getProfile().toPromise();
      if (profile?.user) {
        this._user.set(profile.user);
        this._isAuthenticated.set(true);
      }
    } catch (error) {
      this._user.set(null);
      this._isAuthenticated.set(false);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Iniciar sesión
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    this._isLoading.set(true);
    
    return this.http.post<AuthResponse>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`, credentials, {
      withCredentials: true
    }).pipe(
      tap(response => {
        this._user.set(response.user);
        this._isAuthenticated.set(true);
        this._isLoading.set(false);
        this.showToast('Inicio de sesión exitoso', 'success');
      }),
      catchError(error => {
        this._isLoading.set(false);
        this.handleAuthError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cerrar sesión
   */
  logout(): Observable<ApiResponse<any>> {
    this._isLoading.set(true);
    
    return this.http.post<ApiResponse<any>>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGOUT}`, {}, {
      withCredentials: true
    }).pipe(
      tap(() => {
        this._user.set(null);
        this._isAuthenticated.set(false);
        this._isLoading.set(false);
        this.router.navigate(['/login']);
        this.showToast('Sesión cerrada exitosamente', 'success');
      }),
      catchError(error => {
        // Aun si hay error, limpiar la sesión local
        this._user.set(null);
        this._isAuthenticated.set(false);
        this._isLoading.set(false);
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
   * Renovar token
   */
  refreshToken(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`, {}, {
      withCredentials: true
    });
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
    this._user.set(null);
    this._isAuthenticated.set(false);
    this._isLoading.set(false);
    this.router.navigate(['/login']);
    this.showToast('Sesión expirada. Por favor, inicie sesión nuevamente.', 'warning');
  }

  /**
   * Manejo de errores de autenticación
   */
  private handleAuthError(error: HttpErrorResponse): void {
    let message = 'Error desconocido';
    
    if (error.error?.message) {
      message = error.error.message;
    } else if (error.status === 401) {
      message = 'Credenciales inválidas';
    } else if (error.status === 403) {
      message = 'No tiene permisos para realizar esta acción';
    } else if (error.status === 0) {
      message = 'Error de conexión. Verifique su conexión a internet.';
    }

    this.showToast(message, 'danger');
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
}
