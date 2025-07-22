import { Injectable } from '@angular/core';
import { ApiClientService } from 'src/app/core/services/api-client.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EstadoCuentaService {

  constructor(private apiClient: ApiClientService) { }

  // Ejemplo de cómo se podría obtener el estado de cuenta
  getEstadoDeCuenta(): Observable<any> {
    // Este endpoint es un ejemplo y deberá ser reemplazado por el real
    return this.apiClient.get('/estado-de-cuenta');
  }

  // Ejemplo para el estado de cuenta con amnistía
  getEstadoDeCuentaConAmnistia(): Observable<any> {
    // Este endpoint es un ejemplo y deberá ser reemplazado por el real
    return this.apiClient.get('/estado-de-cuenta/amnistia');
  }
}
