// Match Statistics Interfaces for Recaudación
export interface MatchStatsResponse {
  totalConsultasAnalizadas: number;
  totalMatches: number;
  totalPagosMedianteApp: number;
  totalPagosPrevios: number;
  sumaTotalEncontrado: number;
  sumaTotalPagado: number;
  sumaTotalPagadoMedianteApp: number;
  sumaTotalPagosPrevios: number;
  periodoConsultado: string;
  matches: MatchItem[];
  estadisticasDuplicados: DuplicateStats;
}

export interface DuplicateStats {
  totalArticulosUnicos: number;
  totalArticulosDuplicados: number;
  totalArticulosConMultiplesPagos: number;
  detalleArticulosDuplicados: DuplicateDetail[];
}

export interface DuplicateDetail {
  articulo: string;
  vecesConsultado: number;
  numerosPagosEncontrados: number;
  totalPagadoAcumulado: number;
}

export interface MatchItem {
  consultaId: string;
  recaudoId: string;
  dni: string;
  totalEncontrado: number;
  totalPagado: number;
  fechaConsulta: string;
  fechaPago: string;
  consultaType: 'EC' | 'ICS';
  tipoPago: 'pago_mediante_app' | 'pago_previo_consulta';
  esPagoMedianteApp: boolean;
}

export interface MatchFilters {
  consultaType?: 'EC' | 'ICS';
  consultaStartDate?: string; // YYYY-MM-DD
  consultaEndDate?: string;   // YYYY-MM-DD
  startDate?: string;         // YYYY-MM-DD for payments
  endDate?: string;           // YYYY-MM-DD for payments
  year?: number;
}

export interface MatchStatsFilter extends MatchFilters {
  preset?: 'last_month' | 'last_3_months' | 'current_year' | 'custom';
}

// Computed statistics for UI
export interface ComputedMatchStats {
  totalConsultasAnalizadas: number;
  totalMatches: number;
  totalPagosMedianteApp: number;
  totalPagosPrevios: number;
  sumaTotalEncontrado: number;
  sumaTotalPagado: number;
  sumaTotalPagadoMedianteApp: number;
  sumaTotalPagosPrevios: number;
  periodoConsultado: string;
  
  // Duplicate statistics
  totalArticulosUnicos: number;
  totalArticulosDuplicados: number;
  totalArticulosConMultiplesPagos: number;
  matchesUnicos: number;        // totalMatches - totalArticulosDuplicados
  
  // Computed metrics
  tasaMatch: number;              // (totalMatches / totalConsultasAnalizadas) * 100
  tasaPagoApp: number;            // (totalPagosMedianteApp / totalMatches) * 100
  tasaPagoPrevio: number;         // (totalPagosPrevios / totalMatches) * 100
  efectividadRecaudo: number;     // (sumaTotalPagado / sumaTotalEncontrado) * 100
  promedioMontoPagado: number;    // sumaTotalPagado / totalMatches
  promedioMontoEncontrado: number; // sumaTotalEncontrado / totalConsultasAnalizadas
  tasaDuplicados: number;         // (totalArticulosDuplicados / totalMatches) * 100
}

// Filter preset definitions
export interface FilterPreset {
  key: string;
  label: string;
  description: string;
  filters: MatchFilters;
}
