import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiClientService } from 'src/app/core/services/api-client.service';
import {
  ConsultaICSParams,
  ConsultaICSResponse,
  ConsultaICSResponseMultiple,
  ConsultaICSResponseReal,
  SearchICSParams
} from 'src/app/shared/interfaces/consulta-ics.interface';

@Injectable({
  providedIn: 'root'
})
export class ConsultaIcsService {

  constructor(private apiClient: ApiClientService) { }

  /**
   * Consulta ICS unificada que soporta DNI, RTN o código ICS
   * @param consultaParams Parámetros de consulta
   * @returns Observable con la respuesta de consulta ICS
   */
  consultarICS(consultaParams: ConsultaICSParams): Observable<ConsultaICSResponseReal> {
    let params = new HttpParams();
    
    // Agregar parámetros de búsqueda
    // Según la documentación, tanto DNI como RTN se envían como parámetro 'dni'
    if (consultaParams.dni) {
      params = params.set('dni', consultaParams.dni);
    }
    
    if (consultaParams.rtn) {
      params = params.set('dni', consultaParams.rtn);
    }
    
    if (consultaParams.ics) {
      params = params.set('ics', consultaParams.ics);
    }
    
    // Determinar endpoint según si incluye amnistía
    const endpoint = consultaParams.conAmnistia ? '/consultaICS/amnistia' : '/consultaICS';
    
    return this.apiClient.get<ConsultaICSResponseReal>(endpoint, params);
  }

  /**
   * Consulta ICS sin amnistía
   * @param searchParams Parámetros de búsqueda
   * @returns Observable con la respuesta
   */
  consultarICSSinAmnistia(searchParams: SearchICSParams): Observable<ConsultaICSResponseReal> {
    let params = new HttpParams();
    
    // Agregar parámetros de búsqueda
    // Según la documentación, tanto DNI como RTN se envían como parámetro 'dni'
    if (searchParams.dni) {
      params = params.set('dni', searchParams.dni);
    }
    
    if (searchParams.rtn) {
      params = params.set('dni', searchParams.rtn);
    }
    
    if (searchParams.ics) {
      params = params.set('ics', searchParams.ics);
    }
    
    return this.apiClient.get<ConsultaICSResponseReal>('/consultaICS', params);
  }

  /**
   * Consulta ICS con amnistía
   * @param searchParams Parámetros de búsqueda
   * @returns Observable con la respuesta
   */
  consultarICSConAmnistia(searchParams: SearchICSParams): Observable<ConsultaICSResponseReal> {
    let params = new HttpParams();
    
    // Agregar parámetros de búsqueda
    // Según la documentación, tanto DNI como RTN se envían como parámetro 'dni'
    if (searchParams.dni) {
      params = params.set('dni', searchParams.dni);
    }
    
    if (searchParams.rtn) {
      params = params.set('dni', searchParams.rtn);
    }
    
    if (searchParams.ics) {
      params = params.set('ics', searchParams.ics);
    }
    
    return this.apiClient.get<ConsultaICSResponseReal>('/consultaICS/amnistia', params);
  }

  /**
   * Consulta ICS por DNI
   * @param dni DNI del propietario
   * @param conAmnistia Si incluye amnistía
   * @returns Observable con la respuesta
   */
  consultarICSPorDNI(dni: string, conAmnistia: boolean = false): Observable<ConsultaICSResponseReal> {
    return this.consultarICS({ dni, conAmnistia });
  }

  /**
   * Consulta ICS por RTN
   * @param rtn RTN del propietario
   * @param conAmnistia Si incluye amnistía
   * @returns Observable con la respuesta
   */
  consultarICSPorRTN(rtn: string, conAmnistia: boolean = false): Observable<ConsultaICSResponseReal> {
    return this.consultarICS({ rtn, conAmnistia });
  }

  /**
   * Consulta ICS por código ICS
   * @param ics Código ICS (formato: ICS-XXXXXX)
   * @param conAmnistia Si incluye amnistía
   * @returns Observable con la respuesta
   */
  consultarICSPorCodigo(ics: string, conAmnistia: boolean = false): Observable<ConsultaICSResponseReal> {
    return this.consultarICS({ ics, conAmnistia });
  }

  /**
   * Valida el formato de DNI hondureño
   * @param dni DNI a validar
   * @returns true si es válido
   */
  validarDNI(dni: string): boolean {
    const dniPattern = /^[0-9]{13}$/;
    return dniPattern.test(dni.trim());
  }

  /**
   * Valida el formato de RTN hondureño
   * @param rtn RTN a validar
   * @returns true si es válido
   */
  validarRTN(rtn: string): boolean {
    const rtnPattern = /^[0-9]{14}$/;
    return rtnPattern.test(rtn.trim());
  }

  /**
   * Valida el formato de código ICS
   * @param ics Código ICS a validar
   * @returns true si es válido
   */
  validarICS(ics: string): boolean {
    const icsPattern = /^ICS-[0-9]{6}$/;
    return icsPattern.test(ics.trim().toUpperCase());
  }

  /**
   * Normaliza el código ICS a formato estándar
   * @param ics Código ICS
   * @returns Código ICS normalizado
   */
  normalizarICS(ics: string): string {
    return ics.trim().toUpperCase();
  }

  /**
   * Determina el tipo de búsqueda basado en el valor ingresado
   * @param valor Valor de búsqueda
   * @returns Tipo de búsqueda detectado
   */
  detectarTipoBusqueda(valor: string): 'dni' | 'rtn' | 'ics' | 'invalid' {
    const valorLimpio = valor.trim();
    
    if (this.validarDNI(valorLimpio)) {
      return 'dni';
    }
    
    if (this.validarRTN(valorLimpio)) {
      return 'rtn';
    }
    
    if (this.validarICS(valorLimpio)) {
      return 'ics';
    }
    
    return 'invalid';
  }

  /**
   * Obtiene el mensaje de error apropiado para validación
   * @param tipo Tipo de validación
   * @returns Mensaje de error
   */
  obtenerMensajeError(tipo: 'dni' | 'rtn' | 'ics'): string {
    switch (tipo) {
      case 'dni':
        return 'El DNI debe contener exactamente 13 dígitos';
      case 'rtn':
        return 'El RTN debe contener exactamente 14 dígitos';
      case 'ics':
        return 'El código ICS debe tener el formato ICS-XXXXXX (ej: ICS-006454)';
      default:
        return 'Formato inválido';
    }
  }

  /**
   * Formatea un valor para mostrar en la interfaz
   * @param valor Valor a formatear
   * @param tipo Tipo de valor
   * @returns Valor formateado
   */
  formatearValor(valor: string, tipo: 'dni' | 'rtn' | 'ics'): string {
    if (!valor) return '';
    
    switch (tipo) {
      case 'dni':
        // Formato: XXXX-XXXX-XXXXX
        return valor.replace(/(\d{4})(\d{4})(\d{5})/, '$1-$2-$3');
      case 'rtn':
        // Formato: XXXX-XXXX-XXXXXX
        return valor.replace(/(\d{4})(\d{4})(\d{6})/, '$1-$2-$3');
      case 'ics':
        return this.normalizarICS(valor);
      default:
        return valor;
    }
  }
}