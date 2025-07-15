import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  Factura, 
  PaginationResponse, 
  ApiResponse, 
  CreateFacturaRequest, 
  UpdateFacturaRequest,
  MassiveFacturaRequest,
  FacturaStats
} from '../../shared/interfaces';

export interface FacturaFilters {
  page?: number;
  limit?: number;
  search?: string;
  estado?: string;
  localId?: string;
  mercadoId?: string;
  mes?: string;
  anio?: number;
  startDate?: string;
  endDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FacturasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/facturas`;
  
  // Estado local
  private facturasSubject = new BehaviorSubject<Factura[]>([]);
  facturas$ = this.facturasSubject.asObservable();

  /**
   * Obtener lista de facturas con paginación y filtros
   */
  getFacturas(filters: FacturaFilters = {}): Observable<PaginationResponse<Factura>> {
    let params = new HttpParams();

    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.localId) params = params.set('localId', filters.localId);
    if (filters.mercadoId) params = params.set('mercadoId', filters.mercadoId);
    if (filters.mes) params = params.set('mes', filters.mes);
    if (filters.anio) params = params.set('anio', filters.anio.toString());
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);

    return this.http.get<PaginationResponse<Factura>>(this.apiUrl, { params });
  }

  /**
   * Obtener factura por ID
   */
  getFacturaById(id: string): Observable<ApiResponse<Factura>> {
    return this.http.get<ApiResponse<Factura>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear nueva factura
   */
  createFactura(factura: CreateFacturaRequest): Observable<ApiResponse<Factura>> {
    return this.http.post<ApiResponse<Factura>>(this.apiUrl, factura).pipe(
      tap(response => {
        if (response.data) {
          const currentFacturas = this.facturasSubject.value;
          this.facturasSubject.next([...currentFacturas, response.data]);
        }
      })
    );
  }

  /**
   * Actualizar factura
   */
  updateFactura(id: string, factura: UpdateFacturaRequest): Observable<ApiResponse<Factura>> {
    return this.http.patch<ApiResponse<Factura>>(`${this.apiUrl}/${id}`, factura).pipe(
      tap(response => {
        if (response.data) {
          const currentFacturas = this.facturasSubject.value;
          const index = currentFacturas.findIndex(f => f.id === id);
          if (index !== -1) {
            currentFacturas[index] = response.data;
            this.facturasSubject.next([...currentFacturas]);
          }
        }
      })
    );
  }

  /**
   * Eliminar factura
   */
  deleteFactura(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentFacturas = this.facturasSubject.value;
        this.facturasSubject.next(currentFacturas.filter(f => f.id !== id));
      })
    );
  }

  /**
   * Marcar factura como pagada
   */
  payFactura(id: string, fechaPago?: string): Observable<ApiResponse<Factura>> {
    const body = fechaPago ? { fecha_pago: fechaPago } : {};
    return this.http.patch<ApiResponse<Factura>>(`${this.apiUrl}/${id}/pay`, body).pipe(
      tap(response => {
        if (response.data) {
          const currentFacturas = this.facturasSubject.value;
          const index = currentFacturas.findIndex(f => f.id === id);
          if (index !== -1) {
            currentFacturas[index] = response.data;
            this.facturasSubject.next([...currentFacturas]);
          }
        }
      })
    );
  }

  /**
   * Anular factura
   */
  anularFactura(id: string, observaciones?: string): Observable<ApiResponse<Factura>> {
    const body = observaciones ? { observaciones } : {};
    return this.http.delete<ApiResponse<Factura>>(`${this.apiUrl}/${id}`, { body }).pipe(
      tap(response => {
        // Remover la factura de la lista local cuando se anule/elimine
        const currentFacturas = this.facturasSubject.value;
        const filteredFacturas = currentFacturas.filter(f => f.id !== id);
        this.facturasSubject.next(filteredFacturas);
      })
    );
  }

  /**
   * Obtener facturas por local
   */
  getFacturasByLocal(localId: string, page = 1, limit = 10): Observable<PaginationResponse<Factura>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('localId', localId);

    return this.http.get<PaginationResponse<Factura>>(this.apiUrl, { params });
  }

  /**
   * Crear facturas masivas
   */
  createMassiveFacturas(request: MassiveFacturaRequest): Observable<ApiResponse<{ created: number; errors: any[] }>> {
    return this.http.post<ApiResponse<{ created: number; errors: any[] }>>(`${this.apiUrl}/massive`, request);
  }

  /**
   * Obtener estadísticas de facturas
   */
  getFacturaStats(filters?: FacturaFilters): Observable<FacturaStats> {
    let params = new HttpParams();

    if (filters?.mercadoId) params = params.set('mercadoId', filters.mercadoId);
    if (filters?.localId) params = params.set('localId', filters.localId);
    if (filters?.mes) params = params.set('mes', filters.mes);
    if (filters?.anio) params = params.set('anio', filters.anio.toString());

    return this.http.get<FacturaStats>(`${this.apiUrl}/stats`, { params });
  }

  /**
   * Obtener facturas vencidas
   */
  getFacturasVencidas(page = 1, limit = 10): Observable<PaginationResponse<Factura>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginationResponse<Factura>>(`${this.apiUrl}/vencidas`, { params });
  }

  /**
   * Obtener facturas pendientes
   */
  getFacturasPendientes(page = 1, limit = 10): Observable<PaginationResponse<Factura>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginationResponse<Factura>>(`${this.apiUrl}/pendientes`, { params });
  }

  /**
   * Enviar recordatorio de pago
   */
  sendPaymentReminder(facturaId: string): Observable<ApiResponse<{ sent: boolean }>> {
    return this.http.post<ApiResponse<{ sent: boolean }>>(`${this.apiUrl}/${facturaId}/reminder`, {});
  }

  /**
   * Generar reporte de facturas
   */
  generateReport(filters: FacturaFilters = {}, format: 'pdf' | 'csv' = 'pdf'): Observable<Blob> {
    let params = new HttpParams().set('format', format);

    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.localId) params = params.set('localId', filters.localId);
    if (filters.mercadoId) params = params.set('mercadoId', filters.mercadoId);
    if (filters.mes) params = params.set('mes', filters.mes);
    if (filters.anio) params = params.set('anio', filters.anio.toString());
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);

    return this.http.get(`${this.apiUrl}/report`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Exportar facturas
   */
  exportFacturas(filters: FacturaFilters = {}): Observable<Blob> {
    let params = new HttpParams();

    if (filters.search) params = params.set('search', filters.search);
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.localId) params = params.set('localId', filters.localId);
    if (filters.mercadoId) params = params.set('mercadoId', filters.mercadoId);
    if (filters.mes) params = params.set('mes', filters.mes);
    if (filters.anio) params = params.set('anio', filters.anio.toString());

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Validar si se puede crear factura para un local en un mes específico
   */
  validateFacturaCreation(localId: string, mes: string, anio: number): Observable<{ canCreate: boolean; message?: string }> {
    const params = new HttpParams()
      .set('localId', localId)
      .set('mes', mes)
      .set('anio', anio.toString());

    return this.http.get<{ canCreate: boolean; message?: string }>(`${this.apiUrl}/validate`, { params });
  }

  /**
   * Formatear monto de factura
   */
  formatMonto(monto: string | number): string {
    if (!monto) return 'L. 0.00';
    const amount = parseFloat(monto.toString());
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Obtener color según estado de la factura
   */
  getEstadoColor(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'PAGADA':
        return 'success';
      case 'PENDIENTE':
        return 'warning';
      case 'VENCIDA':
        return 'danger';
      case 'ANULADA':
        return 'medium';
      default:
        return 'primary';
    }
  }

  /**
   * Obtener ícono según estado de la factura
   */
  getEstadoIcon(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'PAGADA':
        return 'checkmark-circle-outline';
      case 'PENDIENTE':
        return 'time-outline';
      case 'VENCIDA':
        return 'alert-circle-outline';
      case 'ANULADA':
        return 'close-circle-outline';
      default:
        return 'document-text-outline';
    }
  }

  /**
   * Formatear fecha
   */
  formatFecha(fecha: string | Date): string {
    if (!fecha) return 'N/A';
    const date = new Date(fecha);
    return new Intl.DateTimeFormat('es-HN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  /**
   * Obtener nombre del mes en español
   */
  getMesNombre(mes: string): string {
    const meses = {
      '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
      '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
      '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
    };
    return meses[mes as keyof typeof meses] || mes;
  }
}
