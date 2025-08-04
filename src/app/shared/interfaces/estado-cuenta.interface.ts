export interface DetalleMora {
  year: string;
  impuesto: string;
  trenDeAseo: string;
  tasaBomberos: string;
  otros: string;
  recargo: string;
  total: string;
  dias: number;
  impuestoNumerico: number;
  trenDeAseoNumerico: number;
  tasaBomberosNumerico: number;
  otrosNumerico: number;
  recargoNumerico: number;
  totalNumerico: number;
  amnistiaAplicada: boolean;
}

// Nueva interfaz para propiedades individuales en consultas por DNI
export interface PropiedadDto {
  claveCatastral: string;
  colonia: string;
  nombreColonia: string;
  codigoUmaps: number;
  ruta: string;
  detallesMora: DetalleMora[];
  totalPropiedad: string;
  totalPropiedadNumerico: number;
}

// Interfaz original mantenida para compatibilidad
export interface EstadoCuentaResponse {
  nombre: string;
  identidad: string;
  claveCatastral: string;
  fecha: string;
  hora: string;
  colonia: string;
  nombreColonia: string;
  codigoUmaps: number;
  ruta: string;
  detallesMora: DetalleMora[];
  totalGeneral: string;
  totalGeneralNumerico: number;
  amnistiaVigente?: boolean;
  fechaFinAmnistia?: string;
}

// Nueva interfaz unificada que soporta tanto consultas individuales como agrupadas
export interface ConsultaECResponseNueva {
  tipoConsulta: 'dni' | 'clave_catastral';
  nombre: string;
  identidad: string;
  fecha: string;
  hora: string;
  
  // Para consultas por DNI (múltiples propiedades)
  propiedades?: PropiedadDto[];
  
  // Para consultas por clave catastral (individual) - mantener compatibilidad
  claveCatastral?: string;
  colonia?: string;
  nombreColonia?: string;
  codigoUmaps?: number;
  ruta?: string;
  detallesMora?: DetalleMora[];
  
  // Totales
  totalGeneral: string;
  totalGeneralNumerico: number;
  
  // Amnistía
  amnistiaVigente?: boolean;
  fechaFinAmnistia?: string;
}

// Parámetros de consulta mejorados
export interface ConsultaParams {
  claveCatastral?: string;
  dni?: string;
  conAmnistia?: boolean;
}

// Opciones de impresión
export interface OpcionesImpresion {
  tipo: 'individual' | 'grupal';
  propiedadIndex?: number; // Para impresión individual de una propiedad específica
  incluirAmnistia: boolean;
}
