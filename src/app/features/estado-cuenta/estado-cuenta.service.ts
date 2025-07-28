import { Injectable } from '@angular/core';
import { ApiClientService } from 'src/app/core/services/api-client.service';
import { Observable } from 'rxjs';
import { EstadoCuentaResponse } from 'src/app/shared/interfaces/estado-cuenta.interface';
import { HttpParams } from '@angular/common/http';

export interface SearchParams {
  claveCatastral?: string;
  dni?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EstadoCuentaService {

  constructor(private apiClient: ApiClientService) { }

  // Método original mantenido para compatibilidad
  getEstadoDeCuenta(claveCatastral: string): Observable<EstadoCuentaResponse> {
    const params = new HttpParams().set('claveCatastral', claveCatastral);
    return this.apiClient.get<EstadoCuentaResponse>('/estado-cuenta', params);
  }

  // Método original mantenido para compatibilidad
  getEstadoDeCuentaConAmnistia(claveCatastral: string): Observable<EstadoCuentaResponse> {
    const params = new HttpParams().set('claveCatastral', claveCatastral);
    return this.apiClient.get<EstadoCuentaResponse>('/estado-cuenta/con-amnistia', params);
  }

  // Nuevos métodos que soportan búsqueda por DNI o clave catastral
  getEstadoDeCuentaBySearch(searchParams: SearchParams): Observable<EstadoCuentaResponse> {
    let params = new HttpParams();
    
    if (searchParams.claveCatastral) {
      params = params.set('claveCatastral', searchParams.claveCatastral);
    }
    
    if (searchParams.dni) {
      params = params.set('dni', searchParams.dni);
    }
    
    return this.apiClient.get<EstadoCuentaResponse>('/RecEC', params);
  }

  getEstadoDeCuentaConAmnistiaBySearch(searchParams: SearchParams): Observable<EstadoCuentaResponse> {
    let params = new HttpParams();
    
    if (searchParams.claveCatastral) {
      params = params.set('claveCatastral', searchParams.claveCatastral);
    }
    
    if (searchParams.dni) {
      params = params.set('dni', searchParams.dni);
    }
    
    return this.apiClient.get<EstadoCuentaResponse>('/RecECA', params);
  }
}
