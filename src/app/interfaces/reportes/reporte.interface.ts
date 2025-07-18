export interface ReporteRequest {
  tipo: 'FINANCIERO' | 'OPERACIONAL' | 'MERCADO' | 'LOCAL';
  periodo: 'MENSUAL' | 'TRIMESTRAL' | 'ANUAL';
  formato?: 'JSON' | 'PDF' | 'EXCEL' | 'CSV';
  fechaInicio?: string;
  fechaFin?: string;
  mercados?: string[];
  locales?: string[];
}

export interface ReporteResponse {
  success: boolean;
  data: ReporteData;
  metadata: ReporteMetadata;
  filtros_aplicados?: FiltrosAplicados;
  error?: string;
  timestamp: string;
}

export interface ReporteData {
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
    eficiencia: 'ALTA' | 'BAJA';
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
  tipo: string;
  periodo: {
    inicio: string;
    fin: string;
  };
  formato: string;
  tiempo_procesamiento: string;
  timestamp: string;
  usuario?: string;
}

export interface FiltrosAplicados {
  mercados: string[];
  locales: string[];
}
