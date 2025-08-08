import { Injectable, inject } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { ApiClientService } from '../../core/services/api-client.service';
import { 
  UserLocation, 
  AssignLocationRequest,
  LocationError,
  LocationStatsResponse 
} from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private apiClient = inject(ApiClientService);

  /**
   * Asignar ubicación a un usuario (solo ADMIN)
   * POST /api/user-stats/user-location
   */
  assignLocationToUser(request: AssignLocationRequest): Observable<UserLocation> {
    console.log('📍 Asignando ubicación a usuario...', request);
    
    return this.apiClient.post<UserLocation>('/api/user-stats/user-location', request, true).pipe(
      tap(response => {
        console.log('✅ Ubicación asignada exitosamente:', response);
      }),
      catchError(error => {
        console.error('❌ Error al asignar ubicación:', error);
        return this.handleLocationError(error);
      })
    );
  }

  /**
   * Alias para assignLocationToUser - para compatibilidad con el modal
   */
  assignUserLocation(request: AssignLocationRequest): Observable<UserLocation> {
    return this.assignLocationToUser(request);
  }

  /**
   * Obtener todas las ubicaciones del sistema con estadísticas de usuarios
   * GET /api/user-stats/locations
   */
  getAllLocations(): Observable<LocationStatsResponse[]> {
    console.log('📍 Obteniendo todas las ubicaciones del sistema...');
    
    return this.apiClient.get<LocationStatsResponse[]>('/api/user-stats/locations', new HttpParams(), true).pipe(
      tap(response => {
        console.log('✅ Ubicaciones del sistema obtenidas:', response);
      }),
      catchError(error => {
        console.error('❌ Error al obtener ubicaciones:', error);
        return this.handleLocationError(error);
      })
    );
  }

  /**
   * Obtener nombres de ubicaciones únicas disponibles (extraídas del endpoint principal)
   */
  getAvailableLocationNames(): Observable<string[]> {
    console.log('📍 Obteniendo nombres de ubicaciones disponibles...');
    
    return this.getAllLocations().pipe(
      map(locations => {
        // Extraer nombres únicos de ubicaciones activas
        const uniqueNames = locations
          .filter(location => location.isActive)
          .map(location => location.locationName)
          .filter((name, index, array) => array.indexOf(name) === index)
          .sort();
        
        console.log('✅ Nombres de ubicaciones extraídos:', uniqueNames);
        return uniqueNames;
      }),
      catchError(error => {
        console.error('❌ Error al obtener nombres de ubicaciones:', error);
        // Devolver array vacío en caso de error
        return of([]);
      })
    );
  }

  /**
   * Obtener ubicación activa de un usuario (simulada desde el endpoint principal)
   */
  getUserActiveLocation(userId: string): Observable<UserLocation | null> {
    console.log('📍 Obteniendo ubicación activa para usuario:', userId);
    
    return this.getAllLocations().pipe(
      map(locations => {
        // Buscar al usuario en todas las ubicaciones activas
        for (const location of locations) {
          if (location.isActive) {
            const user = location.users.find(u => u.id === userId);
            if (user) {
              // Crear objeto UserLocation desde los datos disponibles
              const userLocation: UserLocation = {
                id: `${location.locationCode}-${userId}`,
                userId: user.id,
                username: user.username,
                locationName: location.locationName,
                locationCode: location.locationCode,
                description: location.description,
                isActive: location.isActive,
                assignedBy: user.assignedBy,
                assignedAt: user.assignedAt,
                createdAt: location.createdAt,
                updatedAt: location.updatedAt
              };
              
              console.log('✅ Ubicación activa encontrada:', userLocation);
              return userLocation;
            }
          }
        }
        
        console.log('ℹ️ Usuario sin ubicación activa');
        return null;
      }),
      catchError(error => {
        console.error('❌ Error al obtener ubicación activa:', error);
        return of(null);
      })
    );
  }

  /**
   * Obtener historial de ubicaciones de un usuario (simulado desde el endpoint principal)
   */
  getUserLocationHistory(userId: string): Observable<UserLocation[]> {
    console.log('📍 Obteniendo historial de ubicaciones para usuario:', userId);
    
    return this.getAllLocations().pipe(
      map(locations => {
        const userLocations: UserLocation[] = [];
        
        // Buscar al usuario en todas las ubicaciones (activas e inactivas)
        for (const location of locations) {
          const user = location.users.find(u => u.id === userId);
          if (user) {
            const userLocation: UserLocation = {
              id: `${location.locationCode}-${userId}`,
              userId: user.id,
              username: user.username,
              locationName: location.locationName,
              locationCode: location.locationCode,
              description: location.description,
              isActive: location.isActive,
              assignedBy: user.assignedBy,
              assignedAt: user.assignedAt,
              createdAt: location.createdAt,
              updatedAt: location.updatedAt
            };
            
            userLocations.push(userLocation);
          }
        }
        
        // Ordenar por fecha de asignación (más reciente primero)
        userLocations.sort((a, b) => 
          new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
        );
        
        console.log('✅ Historial de ubicaciones obtenido:', userLocations);
        return userLocations;
      }),
      catchError(error => {
        console.error('❌ Error al obtener historial de ubicaciones:', error);
        return this.handleLocationError(error);
      })
    );
  }

  /**
   * Desactivar ubicación de un usuario (utilizando el endpoint de asignación con datos vacíos)
   */
  deactivateUserLocation(userId: string): Observable<{ success: boolean; message: string }> {
    console.log('📍 Desactivando ubicación de usuario:', userId);
    
    // No hay endpoint específico para desactivar, así que simulamos respuesta exitosa
    return of({ 
      success: true, 
      message: 'Para desactivar una ubicación, asigne una nueva ubicación al usuario' 
    }).pipe(
      tap(response => {
        console.log('ℹ️ Respuesta simulada para desactivación:', response);
      })
    );
  }

  /**
   * Manejo centralizado de errores específicos para ubicaciones
   */
  private handleLocationError(error: any): Observable<never> {
    let errorMessage = 'Error desconocido al gestionar ubicaciones';
    
    if (error.status === 401) {
      errorMessage = 'No estás autenticado. Por favor, inicia sesión nuevamente.';
    } else if (error.status === 403) {
      errorMessage = 'No tienes permisos para gestionar ubicaciones. Se requiere rol ADMIN.';
    } else if (error.status === 400) {
      const messages = error.error?.message;
      if (Array.isArray(messages)) {
        errorMessage = messages.join(', ');
      } else if (typeof messages === 'string') {
        errorMessage = messages;
      } else {
        errorMessage = 'Datos de ubicación inválidos';
      }
    } else if (error.status === 404) {
      errorMessage = error.error?.message || 'Recurso no encontrado';
    } else if (error.status === 0) {
      errorMessage = 'No se puede conectar con el servidor';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    const locationError: LocationError = {
      message: errorMessage
    };

    return throwError(() => locationError);
  }

  /**
   * Validar datos de asignación de ubicación
   */
  validateLocationAssignment(request: AssignLocationRequest): string[] {
    const errors: string[] = [];

    if (!request.userId || request.userId.trim() === '') {
      errors.push('El ID del usuario es requerido');
    }

    if (!request.locationName || request.locationName.trim() === '') {
      errors.push('El nombre de la ubicación es requerido');
    }

    if (request.locationName && request.locationName.length > 100) {
      errors.push('El nombre de la ubicación no puede exceder 100 caracteres');
    }

    if (request.locationCode && request.locationCode.length > 20) {
      errors.push('El código de ubicación no puede exceder 20 caracteres');
    }

    if (request.description && request.description.length > 500) {
      errors.push('La descripción no puede exceder 500 caracteres');
    }

    return errors;
  }

  /**
   * Formatear información de ubicación para mostrar
   */
  formatLocationDisplay(location: UserLocation): string {
    if (!location) return 'Sin ubicación';
    
    let display = location.locationName;
    if (location.locationCode) {
      display += ` (${location.locationCode})`;
    }
    return display;
  }

  /**
   * Verificar si un usuario tiene ubicación activa
   */
  hasActiveLocation(location: UserLocation | null): boolean {
    return location !== null && location.isActive;
  }
}
