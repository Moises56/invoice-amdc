import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Mercado, PaginationResponse, ApiResponse } from '../../shared/interfaces';

export interface MarketFilters {
  page?: number;
  limit?: number;
  search?: string;
  estado?: boolean;
  municipio?: string;
}

export interface CreateMarketDto {
  nombre_mercado: string;
  direccion: string;
  municipio?: string;
  telefono?: string;
  email?: string;
  latitud?: number;
  longitud?: number;
  descripcion?: string;
  horario_apertura?: string;
  horario_cierre?: string;
  isActive?: boolean;
}

export interface UpdateMarketDto extends Partial<CreateMarketDto> {}

@Injectable({
  providedIn: 'root'
})
export class MercadosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/mercados`;

  /**
   * Obtener lista de mercados con paginación y filtros
   */
  getMarkets(filters: MarketFilters = {}): Observable<PaginationResponse<Mercado>> {
    let params = new HttpParams();

    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.estado !== undefined) params = params.set('estado', filters.estado.toString());
    if (filters.municipio) params = params.set('municipio', filters.municipio);

    return this.http.get<PaginationResponse<Mercado>>(this.apiUrl, { params });
  }
  /**
   * Obtener mercado por ID
   */
  getMarketById(id: string): Observable<Mercado> {
    return this.http.get<Mercado>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear nuevo mercado
   */
  createMarket(market: CreateMarketDto): Observable<ApiResponse<Mercado>> {
    return this.http.post<ApiResponse<Mercado>>(this.apiUrl, market);
  }

  /**
   * Actualizar mercado
   */
  updateMarket(id: string, market: UpdateMarketDto): Observable<ApiResponse<Mercado>> {
    return this.http.patch<ApiResponse<Mercado>>(`${this.apiUrl}/${id}`, market);
  }

  /**
   * Eliminar mercado
   */
  deleteMarket(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Cambiar estado del mercado
   */
  toggleMarketStatus(id: string): Observable<ApiResponse<Mercado>> {
    return this.http.patch<ApiResponse<Mercado>>(`${this.apiUrl}/${id}/toggle-status`, {});
  }  /**
   * Obtener estadísticas generales de todos los mercados
   */
  getAllMarketStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }
  /**
   * Obtener lista de municipios únicos
   * Nota: Se actualiza para utilizar filter en la respuesta de getMarkets ya que el endpoint /municipios no existe
   */  getUniqueMunicipios(): Observable<string[]> {
    // Usamos getMarkets con límite alto para extraer municipios únicos
    return new Observable<string[]>(observer => {
      this.getMarkets({ limit: 100 }).subscribe({
        next: (response: PaginationResponse<Mercado>) => {
          // Extraer municipios únicos de los datos
          const mercados = response.data || [];
          const uniqueMunicipios = [...new Set(mercados
            .map((mercado: any) => mercado.direccion ? mercado.direccion.split(',').pop()?.trim() : '')
            .filter((municipio: string) => municipio && municipio.trim() !== '')
          )];
          observer.next(uniqueMunicipios);
          observer.complete();
        },
        error: (error: any) => {
          console.error('Error al obtener municipios:', error);
          observer.next([]);
          observer.complete();
        }
      });
    });
  }

  /**
   * Obtener mercados por municipio
   */
  getMarketsByMunicipio(municipio: string): Observable<Mercado[]> {
    const params = new HttpParams().set('municipio', municipio);
    return this.http.get<Mercado[]>(`${this.apiUrl}/by-municipio`, { params });
  }

  /**
   * Obtener estadísticas del mercado
   */
  getMarketStats(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/stats`);
  }

  /**
   * Verificar si el nombre del mercado está disponible
   */
  checkMarketNameAvailability(nombre: string, excludeId?: string): Observable<{ available: boolean }> {
    let params = new HttpParams().set('nombre', nombre);
    if (excludeId) {
      params = params.set('excludeId', excludeId);
    }
    return this.http.get<{ available: boolean }>(`${this.apiUrl}/check-name`, { params });
  }

  /**
   * Obtener mercados cercanos por coordenadas
   */
  getNearbyMarkets(lat: number, lng: number, radius: number = 10): Observable<Mercado[]> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lng', lng.toString())
      .set('radius', radius.toString());
    
    return this.http.get<Mercado[]>(`${this.apiUrl}/nearby`, { params });
  }

  /**
   * Exportar lista de mercados
   */
  exportMarkets(filters: MarketFilters = {}): Observable<Blob> {
    let params = new HttpParams();

    if (filters.search) params = params.set('search', filters.search);
    if (filters.estado !== undefined) params = params.set('estado', filters.estado.toString());
    if (filters.municipio) params = params.set('municipio', filters.municipio);

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }
}
