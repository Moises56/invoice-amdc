import { Injectable } from '@angular/core';
import { ApiClientService } from 'src/app/core/services/api-client.service';
import { Observable } from 'rxjs';
import { EstadoCuentaResponse } from 'src/app/shared/interfaces/estado-cuenta.interface';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class EstadoCuentaService {

  constructor(private apiClient: ApiClientService) { }

  getEstadoDeCuenta(claveCatastral: string): Observable<EstadoCuentaResponse> {
    const params = new HttpParams().set('claveCatastral', claveCatastral);
    return this.apiClient.get<EstadoCuentaResponse>('/estado-cuenta', params);
  }

  getEstadoDeCuentaConAmnistia(claveCatastral: string): Observable<EstadoCuentaResponse> {
    const params = new HttpParams().set('claveCatastral', claveCatastral);
    return this.apiClient.get<EstadoCuentaResponse>('/estado-cuenta/con-amnistia', params);
  }
}
