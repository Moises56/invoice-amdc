import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  Local, 
  PaginationResponse, 
  ApiResponse, 
  CreateLocalRequest, 
  UpdateLocalRequest,
  LocalStats,
  Mercado
} from '../../shared/interfaces';

export interface LocalFilters {
  page?: number;
  limit?: number;
  search?: string;
  estado?: string;
  mercadoId?: string;
  tipo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocalesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/locales`;
  
  // Estado local
  private localesSubject = new BehaviorSubject<Local[]>([]);
  locales$ = this.localesSubject.asObservable();

  /**
   * Obtener lista de locales con paginación y filtros
   */
  getLocales(filters: LocalFilters = {}): Observable<PaginationResponse<Local>> {
    let params = new HttpParams();

    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.mercadoId) params = params.set('mercadoId', filters.mercadoId);
    if (filters.tipo) params = params.set('tipo', filters.tipo);

    return this.http.get<PaginationResponse<Local>>(this.apiUrl, { params });
  }
  /**
   * Obtener local por ID
   */
  getLocalById(id: string): Observable<Local> {
    return this.http.get<Local>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener el mercado de un local específico
   */
  getMercadoByLocal(id: string): Observable<Mercado> {
    return this.http.get<Mercado>(`${this.apiUrl}/${id}/mercado`);
  }

  /**
   * Crear nuevo local
   */
  createLocal(local: CreateLocalRequest): Observable<ApiResponse<Local>> {
    return this.http.post<ApiResponse<Local>>(this.apiUrl, local).pipe(
      tap(response => {
        if (response.data) {
          const currentLocales = this.localesSubject.value;
          this.localesSubject.next([...currentLocales, response.data]);
        }
      })
    );
  }

  /**
   * Actualizar local
   */
  updateLocal(id: string, local: UpdateLocalRequest): Observable<ApiResponse<Local>> {
    return this.http.patch<ApiResponse<Local>>(`${this.apiUrl}/${id}`, local).pipe(
      tap(response => {
        if (response.data) {
          const currentLocales = this.localesSubject.value;
          const index = currentLocales.findIndex(l => l.id === id);
          if (index !== -1) {
            currentLocales[index] = response.data;
            this.localesSubject.next([...currentLocales]);
          }
        }
      })
    );
  }

  /**
   * Eliminar local
   */
  deleteLocal(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentLocales = this.localesSubject.value;
        this.localesSubject.next(currentLocales.filter(l => l.id !== id));
      })
    );
  }

  /**
   * Cambiar estado del local
   */
  changeLocalStatus(id: string, estado: string): Observable<ApiResponse<Local>> {
    return this.http.patch<ApiResponse<Local>>(`${this.apiUrl}/${id}/status`, { estado }).pipe(
      tap(response => {
        if (response.data) {
          const currentLocales = this.localesSubject.value;
          const index = currentLocales.findIndex(l => l.id === id);
          if (index !== -1) {
            currentLocales[index] = response.data;
            this.localesSubject.next([...currentLocales]);
          }
        }
      })
    );
  }

  /**
   * Obtener locales por mercado
   */
  getLocalesByMercado(mercadoId: string): Observable<Local[]> {
    const params = new HttpParams().set('mercadoId', mercadoId);
    return this.http.get<Local[]>(`${this.apiUrl}/by-mercado`, { params });
  }

  /**
   * Activar local
   */
  activateLocal(id: string): Observable<ApiResponse<Local>> {
    return this.http.patch<ApiResponse<Local>>(`${this.apiUrl}/${id}/activate`, {});
  }

  /**
   * Desactivar local
   */
  deactivateLocal(id: string): Observable<ApiResponse<Local>> {
    return this.http.patch<ApiResponse<Local>>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  /**
   * Suspender local
   */
  suspendLocal(id: string): Observable<ApiResponse<Local>> {
    return this.http.patch<ApiResponse<Local>>(`${this.apiUrl}/${id}/suspend`, {});
  }

  /**
   * Obtener estadísticas del local
   */
  getLocalStats(id: string): Observable<LocalStats> {
    return this.http.get<LocalStats>(`${this.apiUrl}/${id}/stats`);
  }

  /**
   * Verificar disponibilidad del número de local
   */
  checkLocalNumberAvailability(numeroLocal: string, mercadoId: string, excludeId?: string): Observable<{ available: boolean }> {
    let params = new HttpParams()
      .set('numeroLocal', numeroLocal)
      .set('mercadoId', mercadoId);
    
    if (excludeId) {
      params = params.set('excludeId', excludeId);
    }
    
    return this.http.get<{ available: boolean }>(`${this.apiUrl}/check-number`, { params });
  }
  /**
   * Obtener facturas de un local específico
   * Nota: Este método usa el endpoint de facturas con filtro de localId
   */
  getLocalFacturas(localId: string, page = 1, limit = 10): Observable<PaginationResponse<any>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('localId', localId);

    // Usar el endpoint de facturas con filtro de localId
    return this.http.get<PaginationResponse<any>>(`${environment.apiUrl}/facturas`, { params });
  }

  /**
   * Exportar lista de locales
   */
  exportLocales(filters: LocalFilters = {}): Observable<Blob> {
    let params = new HttpParams();

    if (filters.search) params = params.set('search', filters.search);
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.mercadoId) params = params.set('mercadoId', filters.mercadoId);
    if (filters.tipo) params = params.set('tipo', filters.tipo);

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }
}
