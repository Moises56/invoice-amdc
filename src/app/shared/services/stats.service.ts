import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LocalesStats {
  total_locales: number;
  locales_activos: number;
  locales_inactivos: number;
  locales_suspendidos: number;
  locales_pendientes: number;
  porcentaje_activos: number;
  estadisticas_por_tipo: Record<string, number>;
  monto_promedio: string;
}

export interface FacturasStats {
  total_facturas: number;
  facturas_pendientes: number;
  facturas_pagadas: number;
  facturas_vencidas: number;
  facturas_anuladas: number;
  monto_total: number;
  monto_recaudado: number;
  porcentaje_recaudacion: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Obtener estadísticas de locales
   */
  getLocalesStats(): Observable<LocalesStats> {
    return this.http.get<LocalesStats>(`${this.apiUrl}/locales/stats`);
  }

  /**
   * Obtener estadísticas de facturas
   */
  getFacturasStats(): Observable<FacturasStats> {
    return this.http.get<FacturasStats>(`${this.apiUrl}/facturas/stats`);
  }
}
