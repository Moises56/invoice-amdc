import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Interfaces para manejar las respuestas del backend
export interface AuditLog {
  id: string;
  action: string;
  user_id: string;
  user_name?: string;
  timestamp: string;
  ip_address?: string;
  details?: any;
  resource_type?: string;
  resource_id?: string;
}

export interface UserActivity {
  userId: string;
  userName: string;
  actions: number;
  lastActivity: string;
}

export interface OperationCount {
  [key: string]: number;
}

export interface AuditStats {
  total_logs: number;
  logs_today: number;
  logs_this_week?: number;
  logs_this_month?: number;
  logs_by_action: OperationCount;
  logs_by_table?: OperationCount;
  most_active_users: UserActivity[];
  
  // Propiedades alternativas para compatibilidad
  totalLogs?: number;
  todayLogs?: number;
  thisWeekLogs?: number;
  thisMonthLogs?: number;
  operationCounts?: OperationCount;
  userActivity?: UserActivity[];
}

export interface RecentActivity {
  logs: AuditLog[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {
  private readonly baseUrl = `${environment.apiUrl}/audit`;
  private readonly httpOptions = {
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  constructor(private http: HttpClient) {}

  /**
   * Obtener estadísticas de auditoría
   */
  getStats(): Observable<AuditStats> {
    return this.http.get<any>(`${this.baseUrl}/stats`, this.httpOptions)
      .pipe(
        map(response => {
          console.log('📊 Response from /stats:', response);
          
          // Mapear los usuarios más activos al formato correcto
          const mappedUsers = response.most_active_users?.map((user: any) => ({
            userId: user.userId,
            userName: user.user?.nombre || 'Usuario',
            userEmail: user.user?.correo || '',
            actions: user._count?.id || 0,
            lastActivity: new Date().toISOString()
          })) || [];
          
          // Mapear la respuesta del backend al formato esperado
          const mappedResponse: AuditStats = {
            total_logs: response.total_logs || 0,
            logs_today: response.logs_today || 0,
            logs_this_week: response.logs_this_week || response.total_logs, // Usar total como fallback
            logs_this_month: response.logs_this_month || response.total_logs, // Usar total como fallback
            logs_by_action: response.logs_by_action || {},
            logs_by_table: response.logs_by_table || {},
            most_active_users: mappedUsers,
            
            // Mapear también a las propiedades alternativas para compatibilidad
            totalLogs: response.total_logs || 0,
            todayLogs: response.logs_today || 0,
            thisWeekLogs: response.logs_this_week || response.total_logs,
            thisMonthLogs: response.logs_this_month || response.total_logs,
            operationCounts: response.logs_by_action || {},
            userActivity: mappedUsers
          };
          
          console.log('📊 Mapped stats:', mappedResponse);
          return mappedResponse;
        }),
        catchError(error => {
          console.error('❌ Error getting stats:', error);
          return of(this.getMockStats());
        })
      );
  }

  /**
   * Obtener logs de auditoría
   */
  getLogs(limit: number = 50, offset: number = 0): Observable<RecentActivity> {
    return this.http.get<any>(`${this.baseUrl}/logs?limit=${limit}&offset=${offset}`, this.httpOptions)
      .pipe(
        map(response => {
          console.log('📋 Response from /logs:', response);
          
          const mappedResponse: RecentActivity = {
            logs: response.data || response.logs || [],
            total: response.pagination?.total || response.total || response.data?.length || 0
          };
          
          console.log('📋 Mapped logs:', mappedResponse);
          return mappedResponse;
        }),
        catchError(error => {
          console.error('❌ Error getting logs:', error);
          return of(this.getMockRecentActivity());
        })
      );
  }

  /**
   * Obtener actividad reciente (usando endpoint /logs con limit)
   */
  getRecentActivity(limit: number = 10): Observable<RecentActivity> {
    return this.http.get<any>(`${this.baseUrl}/logs?limit=${limit}`, this.httpOptions)
      .pipe(
        map(response => {
          console.log('🕒 Response from /logs (recent):', response);
          
          const mappedResponse: RecentActivity = {
            logs: response.data || response.logs || [],
            total: response.pagination?.total || response.total || response.data?.length || 0
          };
          
          console.log('🕒 Mapped recent activity:', mappedResponse);
          return mappedResponse;
        }),
        catchError(error => {
          console.error('❌ Error getting recent activity:', error);
          return of(this.getMockRecentActivity());
        })
      );
  }

  /**
   * Obtener logs por usuario
   */
  getUserLogs(userId: string, limit: number = 50): Observable<RecentActivity> {
    return this.http.get<any>(`${this.baseUrl}/users/${userId}?limit=${limit}`, this.httpOptions)
      .pipe(
        map(response => {
          console.log('👤 Response from /users logs:', response);
          
          const mappedResponse: RecentActivity = {
            logs: response.data || response.logs || [],
            total: response.pagination?.total || response.total || response.data?.length || 0
          };
          
          console.log('👤 Mapped user logs:', mappedResponse);
          return mappedResponse;
        }),
        catchError(error => {
          console.error('❌ Error getting user logs:', error);
          return of(this.getMockRecentActivity());
        })
      );
  }

  /**
   * Obtener detalles de un log específico
   */
  getLogDetails(logId: string): Observable<AuditLog | null> {
    return this.http.get<AuditLog>(`${this.baseUrl}/logs/${logId}`, this.httpOptions)
      .pipe(
        map(response => {
          console.log('🔍 Response from /log details:', response);
          return response;
        }),
        catchError(error => {
          console.error('❌ Error getting log details:', error);
          return of(null);
        })
      );
  }

  /**
   * Obtener estadísticas por operación (derivado de /stats)
   */
  getOperationStats(): Observable<OperationCount> {
    return this.getStats().pipe(
      map(stats => {
        console.log('📈 Getting operation stats from stats:', stats.logs_by_action);
        return stats.logs_by_action || {};
      }),
      catchError(error => {
        console.error('❌ Error getting operation stats:', error);
        return of({});
      })
    );
  }

  // Métodos de fallback con datos mock
  private getMockStats(): AuditStats {
    return {
      total_logs: 1250,
      logs_today: 45,
      logs_this_week: 156,
      logs_this_month: 432,
      logs_by_action: {
        'LOGIN': 324,
        'LOGOUT': 298,
        'CREATE_INVOICE': 89,
        'UPDATE_INVOICE': 67,
        'DELETE_INVOICE': 12,
        'VIEW_REPORT': 156
      },
      most_active_users: [
        {
          userId: 'user_1',
          userName: 'Juan Pérez',
          actions: 89,
          lastActivity: new Date().toISOString()
        },
        {
          userId: 'user_2',
          userName: 'María García',
          actions: 76,
          lastActivity: new Date(Date.now() - 3600000).toISOString()
        }
      ],
      // Propiedades alternativas
      totalLogs: 1250,
      todayLogs: 45,
      thisWeekLogs: 156,
      thisMonthLogs: 432,
      operationCounts: {
        'LOGIN': 324,
        'LOGOUT': 298,
        'CREATE_INVOICE': 89,
        'UPDATE_INVOICE': 67,
        'DELETE_INVOICE': 12,
        'VIEW_REPORT': 156
      },
      userActivity: [
        {
          userId: 'user_1',
          userName: 'Juan Pérez',
          actions: 89,
          lastActivity: new Date().toISOString()
        },
        {
          userId: 'user_2',
          userName: 'María García',
          actions: 76,
          lastActivity: new Date(Date.now() - 3600000).toISOString()
        }
      ]
    };
  }

  private getMockRecentActivity(): RecentActivity {
    return {
      logs: [
        {
          id: '1',
          action: 'LOGIN',
          user_id: 'user_1',
          user_name: 'Juan Pérez',
          timestamp: new Date().toISOString(),
          ip_address: '192.168.1.100'
        },
        {
          id: '2',
          action: 'CREATE_INVOICE',
          user_id: 'user_2',
          user_name: 'María García',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          ip_address: '192.168.1.101'
        }
      ],
      total: 2
    };
  }
}
