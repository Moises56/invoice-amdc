import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditLog, PaginationResponse, ApiResponse, AuditStats } from '../../shared/interfaces';
import { API_CONFIG } from '../../shared/constants';

export interface AuditFilters {
  search?: string;
  accion?: string;
  tabla?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUDIT.BASE}`;

  /**
   * Obtener logs de auditoría con filtros y paginación
   */
  getAuditLogs(filters: AuditFilters = {}): Observable<PaginationResponse<AuditLog>> {
    let params = new HttpParams();

    if (filters.search) params = params.set('search', filters.search);
    if (filters.accion) params = params.set('accion', filters.accion);
    if (filters.tabla) params = params.set('tabla', filters.tabla);
    if (filters.userId) params = params.set('userId', filters.userId);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<PaginationResponse<AuditLog>>(this.baseUrl, { params });
  }

  /**
   * Obtener log de auditoría por ID
   */
  getAuditLogById(id: string): Observable<AuditLog> {
    return this.http.get<AuditLog>(`${this.baseUrl}/${id}`);
  }

  /**
   * Obtener logs por usuario específico
   */
  getAuditLogsByUser(userId: string, page = 1, limit = 10): Observable<PaginationResponse<AuditLog>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginationResponse<AuditLog>>(
      API_CONFIG.ENDPOINTS.AUDIT.BY_USER(userId),
      { params }
    );
  }

  /**
   * Obtener estadísticas de auditoría
   */
  getAuditStats(): Observable<AuditStats> {
    return this.http.get<AuditStats>(`${this.baseUrl}/stats`);
  }

  /**
   * Obtener acciones únicas disponibles
   */
  getUniqueActions(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/actions`);
  }

  /**
   * Obtener tablas únicas disponibles
   */
  getUniqueTables(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/tables`);
  }

  /**
   * Exportar logs de auditoría
   */
  exportAuditLogs(filters: AuditFilters = {}): Observable<Blob> {
    let params = new HttpParams();

    if (filters.search) params = params.set('search', filters.search);
    if (filters.accion) params = params.set('accion', filters.accion);
    if (filters.tabla) params = params.set('tabla', filters.tabla);
    if (filters.userId) params = params.set('userId', filters.userId);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);

    return this.http.get(`${this.baseUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }
}
