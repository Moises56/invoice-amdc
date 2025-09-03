import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { ApiClientService } from 'src/app/core/services/api-client.service';
import { 
  UserStats, 
  GeneralStats, 
  ActivityLogResponse, 
  StatsFilter, 
  LogsFilter,
  UserLocationHistoryResponse,
  AssignUserLocationRequest,
  AssignUserLocationResponse,
  LocationHistoryFilter
} from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private apiClient = inject(ApiClientService);

  /**
   * Obtener estadísticas del usuario actual
   */
  getMyStats(): Observable<UserStats> {
    console.log('📡 Solicitando estadísticas del usuario...');
    return this.apiClient.get<UserStats>('/api/user-stats/my-stats', new HttpParams(), true);
  }

  /**
   * Obtener historial de ubicaciones del usuario actual con estadísticas de consultas
   */
  getMyLocationHistory(): Observable<UserLocationHistoryResponse> {
    console.log('📡 Solicitando historial de ubicaciones del usuario con estadísticas...');
    const params = new HttpParams().set('includeConsultationStats', 'true');
    return this.apiClient.get<UserLocationHistoryResponse>('/api/user-stats/my-location-history', params, true);
  }

  /**
   * Obtener estadísticas generales del sistema (solo USER-ADMIN)
   */
  getGeneralStats(filter?: StatsFilter): Observable<GeneralStats> {
    console.log('📡 Solicitando estadísticas generales...', filter);
    
    let params = new HttpParams();
    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = (filter as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }
    
    return this.apiClient.get<GeneralStats>('/api/user-stats/general', params, true);
  }

  /**
   * Obtener logs de actividad (solo USER-ADMIN)
   */
  getActivityLogs(filter?: LogsFilter): Observable<ActivityLogResponse> {
    console.log('📡 Solicitando logs de actividad...', filter);
    
    let params = new HttpParams();
    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = (filter as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }
    
    console.log('📡 URL completa:', '/api/user-stats/logs');
    console.log('📡 Parámetros:', params.toString());
    console.log('📡 Enviando petición con credenciales HTTP-only...');
    
    return this.apiClient.get<ActivityLogResponse>('/api/user-stats/logs', params, true);
  }

  /**
   * Mock data for location history (temporary - remove when backend is ready)
   */
  private getMockLocationHistory(filter?: LocationHistoryFilter): Observable<UserLocationHistoryResponse> {
    console.log('🔄 Using mock data for location history');
    
    const mockData: UserLocationHistoryResponse = {
      userId: '123',
      username: 'testuser',
      nombre: 'Usuario',
      apellido: 'Prueba',
      currentLocation: {
        id: '1',
        locationName: 'Mercado Central',
        locationCode: 'MER001',
        description: 'Mercado Central - Zona A',
        isActive: true,
        assignedAt: '2024-01-15T10:30:00.000Z',
        assignedBy: '789',
        assignedByUsername: 'admin_user',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
        durationDays: 17,
        consultationStats: {
          icsNormal: 5,
          icsAmnistia: 3,
          ecNormal: 12,
          ecAmnistia: 8,
          totalExitosas: 25,
          totalErrores: 3,
          totalConsultas: 28,
          promedioDuracionMs: 1500,
          totalAcumulado: 125000.50
        }
      },
      locationHistory: [
        {
          id: '1',
          locationName: 'Mercado Central',
          locationCode: 'MER001',
          description: 'Mercado Central - Zona A',
          assignedAt: '2024-01-15T10:30:00.000Z',
          durationDays: 17,
          assignedBy: '789',
          assignedByUsername: 'admin_user',
          isActive: true,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
          consultationStats: {
            icsNormal: 5,
            icsAmnistia: 3,
            ecNormal: 12,
            ecAmnistia: 8,
            totalExitosas: 25,
            totalErrores: 3,
            totalConsultas: 28,
            promedioDuracionMs: 1500,
            totalAcumulado: 125000.50
          }
        },
        {
          id: '2',
          locationName: 'Mercado Norte',
          locationCode: 'MER002',
          description: 'Mercado Norte - Zona B',
          assignedAt: '2023-12-01T08:15:00.000Z',
          deactivatedAt: '2024-01-15T10:30:00.000Z',
          durationDays: 45,
          assignedBy: '789',
          assignedByUsername: 'admin_user',
          isActive: false,
          createdAt: '2023-12-01T08:15:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
          consultationStats: {
            icsNormal: 2,
            icsAmnistia: 1,
            ecNormal: 8,
            ecAmnistia: 5,
            totalExitosas: 14,
            totalErrores: 2,
            totalConsultas: 16,
            promedioDuracionMs: 1200,
            totalAcumulado: 75000.25
          }
        }
      ],
      totalLocations: 2,
      firstAssignedAt: '2023-12-01T08:15:00.000Z',
      lastAssignedAt: '2024-01-15T10:30:00.000Z',
      consultationStats: {
        icsNormal: 7,
        icsAmnistia: 4,
        ecNormal: 20,
        ecAmnistia: 13,
        totalExitosas: 39,
        totalErrores: 5,
        totalConsultas: 44,
        promedioDuracionMs: 1350,
        totalAcumulado: 200000.75
      }
    };

    return new Observable(observer => {
      setTimeout(() => {
        console.log('✅ Mock data delivered successfully');
        observer.next(mockData);
        observer.complete();
      }, 800); // Simulate realistic network delay
    });
  }

  /**
   * Obtener historial de ubicaciones de un usuario específico (solo USER-ADMIN)
   */
  getUserLocationHistory(userId: string, filter?: LocationHistoryFilter): Observable<UserLocationHistoryResponse> {
    console.log('📡 Solicitando historial de ubicaciones para usuario:', userId, filter);
    
    let params = new HttpParams().set('includeConsultationStats', 'true');
    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = (filter as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }
    
    return this.apiClient.get<UserLocationHistoryResponse>(`/api/user-stats/user/${userId}/location-history`, params, true);
  }

  /**
   * Obtener historial de ubicaciones de todos los usuarios (solo USER-ADMIN)
   */
  getAllUsersLocationHistory(filter?: LocationHistoryFilter): Observable<UserLocationHistoryResponse[]> {
    console.log('📡 Solicitando historial de ubicaciones de todos los usuarios...', filter);
    
    let params = new HttpParams().set('includeConsultationStats', 'true');
    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = (filter as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }
    
    return this.apiClient.get<UserLocationHistoryResponse[]>('/api/user-stats/users/location-history', params, true);
  }

  /**
   * Asignar ubicación a un usuario (solo USER-ADMIN)
   */
  assignUserLocation(request: AssignUserLocationRequest): Observable<AssignUserLocationResponse> {
    console.log('📡 Asignando ubicación a usuario...', request);
    
    return this.apiClient.post<AssignUserLocationResponse>('/api/user-stats/user-location', request, true);
  }
}
