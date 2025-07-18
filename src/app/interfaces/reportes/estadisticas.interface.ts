import { Mercado } from './mercado.interface';
import { ConfiguracionReportes } from './mercado.interface';

export interface EstadisticasGenerales {
  total_mercados: number;
  total_locales: number;
  total_facturas: number;
  total_recaudado: number;
  promedio_factura: number;
}

export interface EstadisticasDemo {
  total_mercados: number;
  total_facturas: number;
  total_recaudado: number;
  mercados_sample: Mercado[];
  tipos_local_disponibles: string[];
  configuracion_ui: ConfiguracionReportes;
}

export interface DemoResponse {
  success: boolean;
  demo_data: EstadisticasDemo;
  timestamp: string;
  note: string;
}
