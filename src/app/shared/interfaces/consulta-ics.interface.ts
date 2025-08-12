// Interfaces para Consulta ICS (Impuesto de Construcción y Solvencia)

export interface ConsultaICSParams {
  dni?: string;
  rtn?: string;
  ics?: string; // Formato: ICS-006454
  conAmnistia: boolean;
}

export interface SearchICSParams {
  dni?: string;
  rtn?: string;
  ics?: string;
}

export interface DetalleMoraICS {
  anio: number;
  mes: string;
  monto: number;
  interes: number;
  total: number;
  fechaVencimiento: string;
  estado: 'PENDIENTE' | 'PAGADO' | 'VENCIDO';
  diasVencido?: number;
  montoConAmnistia?: number;
  descuentoAmnistia?: number;
}

export interface PropiedadICS {
  ics: string;
  direccion: string;
  zona: string;
  tipoPropiedad: string;
  areaTerreno?: number;
  areaConstruccion?: number;
  valorCatastral: number;
  impuestoAnual: number;
  estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
}

export interface ConsultaICSResponse {
  success: boolean;
  message: string;
  data: {
    propietario: {
      nombre: string;
      dni?: string;
      rtn?: string;
      telefono?: string;
      email?: string;
      direccion?: string;
    };
    propiedad: PropiedadICS;
    detallesMora: DetalleMoraICS[];
    resumen: {
      totalDeuda: number;
      totalInteres: number;
      totalGeneral: number;
      cantidadCuotas: number;
      ultimoPago?: {
        fecha: string;
        monto: number;
        recibo: string;
      };
      // Información de amnistía (si aplica)
      amnistia?: {
        aplicable: boolean;
        descuentoTotal: number;
        totalConAmnistia: number;
        fechaVencimientoAmnistia?: string;
        porcentajeDescuento: number;
      };
    };
    fechaConsulta: string;
    tipoConsulta: 'dni' | 'rtn' | 'ics';
    conAmnistia: boolean;
  };
}

// Interfaz para los detalles de mora en la respuesta real

export interface DetalleMoraReal {
  // Campos principales según el endpoint real
  year?: string;
  impuesto?: string;
  trenDeAseo?: string;
  tasaBomberos?: string;
  otros?: string;
  recargo?: string;
  total?: string;
  dias?: number;
  impuestoNumerico?: number;
  trenDeAseoNumerico?: number;
  tasaBomberosNumerico?: number;
  otrosNumerico?: number;
  recargoNumerico?: number;
  totalNumerico?: number;
  amnistiaAplicada?: boolean;
  
  // Campos alternativos para compatibilidad
  anio?: number;
  mes?: string;
  monto?: number;
  interes?: number;
  fechaVencimiento?: string;
  estado?: 'PENDIENTE' | 'PAGADO' | 'VENCIDO';
  diasVencido?: number;
  montoConAmnistia?: number;
  descuentoAmnistia?: number;
}

// Interfaz para las empresas en la respuesta real
export interface EmpresaICS {
  numeroEmpresa: string;
  mes: string;
  detallesMora: DetalleMoraReal[];
  totalPropiedad: string;
  totalPropiedadNumerico: number;
}

// Nueva interfaz para la respuesta real del servidor
export interface ConsultaICSResponseReal {
  nombre: string;
  identidad: string;
  fecha: string;
  hora: string;
  empresas: EmpresaICS[];
  totalGeneral: string;
  totalGeneralNumerico: number;
  descuentoProntoPago?: string;
  descuentoProntoPagoNumerico?: number;
  descuentoAmnistia?: string;
  descuentoAmnistiaNumerico?: number;
  totalAPagar: string;
  totalAPagarNumerico: number;
  amnistiaVigente: boolean;
  fechaFinAmnistia?: string | null;
  tipoConsulta: string;
  ubicacionConsulta: string;
}

export interface ConsultaICSResponseMultiple {
  success: boolean;
  message: string;
  data: {
    propietario: {
      nombre: string;
      dni?: string;
      rtn?: string;
      telefono?: string;
      email?: string;
      direccion?: string;
    };
    propiedades: Array<{
      propiedad: PropiedadICS;
      detallesMora: DetalleMoraICS[];
      resumen: {
        totalDeuda: number;
        totalInteres: number;
        totalGeneral: number;
        cantidadCuotas: number;
        ultimoPago?: {
          fecha: string;
          monto: number;
          recibo: string;
        };
        amnistia?: {
          aplicable: boolean;
          descuentoTotal: number;
          totalConAmnistia: number;
          fechaVencimientoAmnistia?: string;
          porcentajeDescuento: number;
        };
      };
    }>;
    resumenGeneral: {
      totalPropiedades: number;
      totalDeudaGeneral: number;
      totalInteresGeneral: number;
      totalGeneralConsolidado: number;
      totalConAmnistiaGeneral?: number;
    };
    fechaConsulta: string;
    tipoConsulta: 'dni' | 'rtn' | 'ics';
    conAmnistia: boolean;
  };
}

export interface OpcionesImpresionICS {
  tipo: 'individual' | 'grupal';
  empresaIndex?: number; // Para impresión individual de una empresa específica
  incluirAmnistia: boolean;
  incluirDetalleMora: boolean;
  formatoTermico: boolean;
  mostrarResumenConsolidado: boolean;
}

// Interfaz para datos de impresión ICS
export interface ICSPrintData {
  consultaResponse: ConsultaICSResponseReal;
  empresaSeleccionada?: EmpresaICS;
  searchParams?: SearchICSParams;
  tipoImpresion: 'individual' | 'grupal';
  conAmnistia: boolean;
}

// Tipos de error específicos para ICS
export interface ErrorICSResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// Constantes para validación
export const ICS_VALIDATION = {
  DNI: {
    PATTERN: /^[0-9]{13}$/,
    LENGTH: 13,
    MESSAGE: 'El DNI debe contener exactamente 13 dígitos'
  },
  RTN: {
    PATTERN: /^[0-9]{14}$/,
    LENGTH: 14,
    MESSAGE: 'El RTN debe contener exactamente 14 dígitos'
  },
  ICS: {
    PATTERN: /^ICS-[0-9]{6}$/,
    MESSAGE: 'El código ICS debe tener el formato ICS-XXXXXX (ej: ICS-006454)'
  }
};