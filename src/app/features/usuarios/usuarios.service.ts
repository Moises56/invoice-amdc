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
   * Cambiar estado de usuario (activar/desactivar)
   */
  toggleUserStatus(id: string, isActive: boolean): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${id}/status`, { isActive }).pipe(
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
  changePassword(id: string, newPassword: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/password`, { password: newPassword });
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
}
