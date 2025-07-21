export interface ReporteRequest {
  tipo: 'FINANCIERO' | 'OPERACIONAL' | 'MERCADO' | 'LOCAL';
  periodo: 'MENSUAL' | 'ANUAL';
  formato?: 'JSON' | 'PDF' | 'EXCEL';
  fechaInicio?: string;    // ISO Date string (opcional)
  fechaFin?: string;       // ISO Date string (opcional)
  mercados?: string[];     // Array de IDs de mercados (opcional)
  locales?: string[];      // Array de IDs de locales (opcional)
}

export interface ReporteResponse {
  success: boolean;
  data: ReporteData;
  metadata: ReporteMetadata;
  filtros_aplicados: FiltrosAplicados;
  error?: string;
  timestamp?: string;
}

// Interfaces específicas para cada tipo de reporte
export interface ReporteFinancieroResponse {
  success: true;
  data: ReporteFinancieroData;
  metadata: ReporteMetadata;
  filtros_aplicados: FiltrosAplicados;
}

export interface ReporteOperacionalResponse {
  success: true;
  data: ReporteOperacionalData;
  metadata: ReporteMetadata;
  filtros_aplicados: FiltrosAplicados;
}

export interface ReporteMercadoResponse {
  success: true;
  data: ReporteMercadoData;
  metadata: ReporteMetadata;
  filtros_aplicados: FiltrosAplicados;
}

export interface ReporteLocalResponse {
  success: true;
  data: ReporteLocalData;
  metadata: ReporteMetadata;
  filtros_aplicados: FiltrosAplicados;
}

// Datos específicos por tipo de reporte
export interface ReporteFinancieroData {
  resumen: {
    total_recaudado: number;     // Total en dinero recaudado
    total_facturas: number;      // Cantidad total de facturas
    promedio_factura: number;    // Promedio por factura
  };
  por_estado: {
    [estado: string]: {
      cantidad: number;          // Cantidad de facturas
      monto: number;            // Monto total del estado
    }
  };
  por_mercado: MercadoStats[];
}

export interface ReporteOperacionalData {
  estadisticas: {
    total_facturas: number;      // Total de facturas en el período
    mercados_activos: number;    // Mercados con actividad
    locales_activos: number;     // Locales con actividad
  };
  rendimiento: {
    facturas_hoy: number;        // Facturas creadas hoy
    eficiencia: 'ALTA' | 'MEDIA' | 'BAJA'; // Clasificación de eficiencia
  };
}

export interface ReporteMercadoData {
  mercados: MercadoStats[];
}

export interface ReporteLocalData {
  locales: LocalStats[];
}

export interface ReporteData {
  // Mantener compatibilidad con código existente
  // Para tipo FINANCIERO
  resumen?: {
    total_recaudado: number;
    total_facturas: number;
    promedio_factura: number;
  };
  por_estado?: {
    [estado: string]: {
      cantidad: number;
      monto: number;
    };
  };
  por_mercado?: MercadoStats[];
  
  // Para tipo OPERACIONAL
  estadisticas?: {
    total_facturas: number;
    mercados_activos: number;
    locales_activos: number;
  };
  rendimiento?: {
    facturas_hoy: number;
    eficiencia: 'ALTA' | 'MEDIA' | 'BAJA';
  };
  
  // Para tipo MERCADO
  mercados?: MercadoStats[];
  
  // Para tipo LOCAL
  locales?: LocalStats[];
}

export interface MercadoStats {
  mercado_id: string;
  nombre_mercado: string;
  total_recaudado: number;
  total_facturas: number;
  facturas_pagadas: number;
  total_locales: number;
}

export interface LocalStats {
  id: string;
  numero_local: string;
  nombre_local: string;
  mercado: string;
  total_facturas: number;
  total_recaudado: number;
  facturas_pagadas: number;
}

export interface ReporteMetadata {
  tipo: 'FINANCIERO' | 'OPERACIONAL' | 'MERCADO' | 'LOCAL';
  periodo: {
    inicio: string;              // ISO Date string
    fin: string;                 // ISO Date string
  };
  formato: 'JSON' | 'PDF' | 'EXCEL';
  tiempo_procesamiento: string; // Ej: "125ms"
  timestamp: string;            // ISO Date string
  usuario: string;              // Username del usuario autenticado
}

export interface FiltrosAplicados {
  mercados: string[];
  locales: string[];
}
