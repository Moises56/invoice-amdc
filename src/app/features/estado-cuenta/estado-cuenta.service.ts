import { Injectable } from '@angular/core';
import { ApiClientService } from 'src/app/core/services/api-client.service';
import { Observable } from 'rxjs';
import { 
  EstadoCuentaResponse, 
  ConsultaECResponseNueva, 
  ConsultaParams 
} from 'src/app/shared/interfaces/estado-cuenta.interface';
import { HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';

export interface SearchParams {
  claveCatastral?: string;
  dni?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EstadoCuentaService {

  constructor(private apiClient: ApiClientService) { }

  // ========== MÉTODOS ORIGINALES MANTENIDOS PARA COMPATIBILIDAD ==========
  
  getEstadoDeCuenta(claveCatastral: string): Observable<EstadoCuentaResponse> {
    const params = new HttpParams().set('claveCatastral', claveCatastral);
    return this.apiClient.get<EstadoCuentaResponse>('/estado-cuenta', params);
  }

  getEstadoDeCuentaConAmnistia(claveCatastral: string): Observable<EstadoCuentaResponse> {
    const params = new HttpParams().set('claveCatastral', claveCatastral);
    return this.apiClient.get<EstadoCuentaResponse>('/estado-cuenta/con-amnistia', params);
  }

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

  // ========== NUEVOS MÉTODOS PARA ENDPOINTS ACTUALIZADOS ==========

  /**
   * Método unificado para consultar estado de cuenta
   * Soporta tanto consultas por DNI (múltiples propiedades) como por clave catastral (individual)
   */
  consultarEstadoCuenta(consultaParams: ConsultaParams): Observable<ConsultaECResponseNueva> {
    let params = new HttpParams();
    
    if (consultaParams.claveCatastral) {
      params = params.set('claveCatastral', consultaParams.claveCatastral);
    }
    
    if (consultaParams.dni) {
      params = params.set('dni', consultaParams.dni);
    }

    const endpoint = consultaParams.conAmnistia ? '/consultaEC/amnistia' : '/consultaEC';
    
    return this.apiClient.get<any>(endpoint, params).pipe(
      map(response => this.mapearRespuestaConsulta(response, consultaParams))
    );
  }

  /**
   * Mapea la respuesta del backend al formato unificado
   */
  private mapearRespuestaConsulta(response: any, consultaParams: ConsultaParams): ConsultaECResponseNueva {
    // Determinar tipo de consulta
    const tipoConsulta = consultaParams.dni ? 'dni' : 'clave_catastral';
    
    const baseResponse: ConsultaECResponseNueva = {
      tipoConsulta,
      nombre: response.nombre,
      identidad: response.identidad,
      fecha: response.fecha,
      hora: response.hora,
      totalGeneral: response.totalGeneral,
      totalGeneralNumerico: response.totalGeneralNumerico,
      amnistiaVigente: response.amnistiaVigente,
      fechaFinAmnistia: response.fechaFinAmnistia
    };

    if (tipoConsulta === 'dni' && response.propiedades) {
      // Consulta por DNI - múltiples propiedades
      baseResponse.propiedades = response.propiedades;
    } else {
      // Consulta por clave catastral - individual
      baseResponse.claveCatastral = response.claveCatastral;
      baseResponse.colonia = response.colonia;
      baseResponse.nombreColonia = response.nombreColonia;
      baseResponse.codigoUmaps = response.codigoUmaps;
      baseResponse.ruta = response.ruta;
      baseResponse.detallesMora = response.detallesMora;
    }

    return baseResponse;
  }

  /**
   * Convierte ConsultaECResponseNueva a EstadoCuentaResponse para compatibilidad
   */
  convertirAFormatoLegacy(consulta: ConsultaECResponseNueva, propiedadIndex?: number): EstadoCuentaResponse {
    if (consulta.tipoConsulta === 'dni' && consulta.propiedades) {
      // Para consultas por DNI, usar la propiedad especificada o la primera
      const propiedad = consulta.propiedades[propiedadIndex || 0];
      
      return {
        nombre: consulta.nombre,
        identidad: consulta.identidad,
        claveCatastral: propiedad.claveCatastral,
        fecha: consulta.fecha,
        hora: consulta.hora,
        colonia: propiedad.colonia,
        nombreColonia: propiedad.nombreColonia,
        codigoUmaps: propiedad.codigoUmaps,
        ruta: propiedad.ruta,
        detallesMora: propiedad.detallesMora,
        totalGeneral: propiedad.totalPropiedad,
        totalGeneralNumerico: propiedad.totalPropiedadNumerico,
        amnistiaVigente: consulta.amnistiaVigente,
        fechaFinAmnistia: consulta.fechaFinAmnistia
      };
    } else {
      // Para consultas por clave catastral, usar datos directos
      return {
        nombre: consulta.nombre,
        identidad: consulta.identidad,
        claveCatastral: consulta.claveCatastral!,
        fecha: consulta.fecha,
        hora: consulta.hora,
        colonia: consulta.colonia!,
        nombreColonia: consulta.nombreColonia!,
        codigoUmaps: consulta.codigoUmaps!,
        ruta: consulta.ruta!,
        detallesMora: consulta.detallesMora!,
        totalGeneral: consulta.totalGeneral,
        totalGeneralNumerico: consulta.totalGeneralNumerico,
        amnistiaVigente: consulta.amnistiaVigente,
        fechaFinAmnistia: consulta.fechaFinAmnistia
      };
    }
  }
}
