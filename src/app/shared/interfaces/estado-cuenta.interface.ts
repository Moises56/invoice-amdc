export interface DetalleMora {
  year: string;
  impuesto: string;
  trenDeAseo: string;
  tasaBomberos: string;
  recargo: string;
  total: string;
  dias: number;
  impuestoNumerico: number;
  trenDeAseoNumerico: number;
  tasaBomberosNumerico: number;
  recargoNumerico: number;
  totalNumerico: number;
  amnistiaAplicada: boolean;
}

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
