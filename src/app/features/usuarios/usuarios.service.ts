import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { User, CreateUserDto, UpdateUserDto, PaginatedResponse, Role } from '../../shared/interfaces';
import { API_CONFIG } from '../../shared/constants';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private http = inject(HttpClient);
  private baseUrl = `${API_CONFIG.BASE_URL}/users`;
  
  // Estado local
  private usuariosSubject = new BehaviorSubject<User[]>([]);
  usuarios$ = this.usuariosSubject.asObservable();

  /**
   * Obtener todos los usuarios con paginación
   */
  getUsers(page: number = 1, limit: number = 10, filters?: any): Observable<PaginatedResponse<User>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });

    return this.http.get<PaginatedResponse<User>>(`${this.baseUrl}?${params}`).pipe(
      tap(response => {
        // Actualizar estado local si es la primera página
        if (page === 1) {
          this.usuariosSubject.next(response.data);
        }
      })
    );
  }

  /**
   * Obtener usuario por ID
   */
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crear nuevo usuario
   */
  createUser(userData: CreateUserDto): Observable<User> {
    return this.http.post<User>(this.baseUrl, userData).pipe(
      tap(newUser => {
        const currentUsers = this.usuariosSubject.value;
        this.usuariosSubject.next([...currentUsers, newUser]);
      })
    );
  }

  /**
   * Actualizar usuario
   */
  updateUser(id: string, userData: UpdateUserDto): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${id}`, userData).pipe(
      tap(updatedUser => {
        const currentUsers = this.usuariosSubject.value;
        const index = currentUsers.findIndex(u => u.id === id);
        if (index !== -1) {
          currentUsers[index] = updatedUser;
          this.usuariosSubject.next([...currentUsers]);
        }
      })
    );
  }

  /**
   * Eliminar usuario
   */
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        const currentUsers = this.usuariosSubject.value;
        this.usuariosSubject.next(currentUsers.filter(u => u.id !== id));
      })
    );
  }

  /**
   * Activar usuario
   */
  activateUser(id: string): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${id}/activate`, {}).pipe(
      tap(updatedUser => {
        const currentUsers = this.usuariosSubject.value;
        const index = currentUsers.findIndex(u => u.id === id);
        if (index !== -1) {
          currentUsers[index] = updatedUser;
          this.usuariosSubject.next([...currentUsers]);
        }
      })
    );
  }

  /**
   * Cambiar estado de usuario (activar/desactivar)
   */
  toggleUserStatus(id: string, isActive: boolean): Observable<User> {
    const endpoint = isActive ? 'activate' : 'deactivate';
    return this.http.patch<User>(`${this.baseUrl}/${id}/${endpoint}`, {}).pipe(
      tap(updatedUser => {
        const currentUsers = this.usuariosSubject.value;
        const index = currentUsers.findIndex(u => u.id === id);
        if (index !== -1) {
          currentUsers[index] = updatedUser;
          this.usuariosSubject.next([...currentUsers]);
        }
      })
    );
  }

  /**
   * Cambiar contraseña de usuario
   */
  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${API_CONFIG.BASE_URL}/auth/change-password`, {
      currentPassword,
      newPassword
    });
  }

  /**
   * Cambiar contraseña de usuario (admin) - CORREGIDO
   */
  changeUserPassword(id: string, newPassword: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/reset-password`, { 
      newPassword 
    });
  }

  /**
   * Obtener roles disponibles
   */
  getAvailableRoles(): Role[] {
    return Object.values(Role);
  }

  /**
   * Resetear password del usuario
   */
  resetPassword(id: string): Observable<{ tempPassword: string }> {
    return this.http.post<{ tempPassword: string }>(`${this.baseUrl}/${id}/reset-password`, {});
  }

  /**
   * Buscar usuarios por texto
   */
  searchUsers(query: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
  }

  /**
   * Obtener estadísticas de usuarios
   */
  getUserStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/stats`);
  }

  // Helper methods para UI
  /**
   * Obtener avatar inicial del usuario
   */
  getAvatarInitials(user: User): string {
    const firstName = user.nombre?.charAt(0) || '';
    const lastName = user.apellido?.charAt(0) || '';
    return (firstName + lastName).toUpperCase() || user.username?.charAt(0).toUpperCase() || 'U';
  }

  /**
   * Obtener color del rol
   */
  getRoleColor(role: Role): string {
    switch (role) {
      case Role.ADMIN:
        return 'danger';
      case Role.MARKET:
        return 'warning';
      case Role.USER:
        return 'primary';
      default:
        return 'medium';
    }
  }

  /**
   * Obtener texto del rol
   */
  getRoleText(role: Role): string {
    switch (role) {
      case Role.ADMIN:
        return 'Administrador';
      case Role.MARKET:
        return 'Gerente de Mercado';
      case Role.USER:
        return 'Usuario';
      default:
        return role;
    }
  }

  /**
   * Formatear nombre completo
   */
  getFullName(user: User): string {
    return `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.username;
  }

  /**
   * Formatear fecha de último login
   */
  formatLastLogin(date: Date | null | undefined): string {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const loginDate = new Date(date);
    const diffMs = now.getTime() - loginDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return loginDate.toLocaleDateString('es-ES');
    }
  }

  /**
   * Obtener estado del usuario
   */
  getUserStatus(user: User): { text: string; color: string } {
    if (user.isActive) {
      return { text: 'Activo', color: 'success' };
    } else {
      return { text: 'Inactivo', color: 'danger' };
    }
  }

  /**
   * Actualizar estado de usuario (activo/inactivo)
   */
  updateUserStatus(userId: string, isActive: boolean): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${userId}/status`, { isActive });
  }
}
