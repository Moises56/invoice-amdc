export interface Mercado {
  id: string;
  nombre_mercado: string;
  direccion: string;
  _count?: {
    locales: number;
  };
}

export interface TipoReporte {
  value: string;
  label: string;
  icon: string;
}

export interface Periodo {
  value: string;
  label: string;
}

export interface FormatoExport {
  value: string;
  label: string;
  icon: string;
}

export interface ConfiguracionReportes {
  tipos_reporte: TipoReporte[];
  periodos: Periodo[];
  formatos: FormatoExport[];
  mercados_disponibles: Mercado[];
  tipos_local: string[];
}
