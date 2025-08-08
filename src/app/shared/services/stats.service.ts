import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiClientService } from 'src/app/core/services/api-client.service';
import { 
  UserStats, 
  GeneralStats, 
  ActivityLog,
  ActivityLogResponse, 
  StatsFilter, 
  LogsFilter 
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
}
