import { Injectable } from '@angular/core';
import { ThermalPrinterBaseService } from './thermal-printer-base.service';
import { EstadoCuentaResponse, DetalleMora, ConsultaECResponseNueva, ConsultaParams } from '../interfaces/estado-cuenta.interface';

@Injectable({
  providedIn: 'root'
})
export class EstadoCuentaPrinterService extends ThermalPrinterBaseService {

  // Configuración específica para Estado de Cuenta
  private readonly EC_CONFIG = {
    TABLE_COLUMNS: [4, 8, 7, 8, 7, 8], // Total: 42 caracteres para números completos
    TABLE_HEADERS: ['Año', 'Impto', 'T.Aseo', 'Bomberos', 'Recargo', 'Total'],
    TABLE_WIDTH: 42
  };

  /**
   * Formatea Estado de Cuenta Individual
   */
  formatEstadoCuentaIndividual(data: EstadoCuentaResponse, params?: ConsultaParams): string {
    let ticket = '';
    
    // Encabezado
    ticket += this.createHeader('ESTADO DE CUENTA');
    
    // Información personal
    ticket += this.createPersonalInfo(
      data.nombre || 'N/A',
      data.identidad || 'N/A',
      data.fecha || this.formatDate(new Date()),
      data.hora || this.formatTime(new Date()),
      data.claveCatastral
    );
    
    // Tabla de detalles
    ticket += this.createECTable(data.detallesMora || []);
    
    // Total general
    ticket += this.createECTotal(data.totalGeneralNumerico || 0);
    
    // Mensaje final
    ticket += this.centerText('Datos Actualizados a la fecha de consulta.') + '\n';
    
    return ticket;
  }

  /**
   * Formatea Estado de Cuenta Grupal
   */
  formatEstadoCuentaGrupal(data: ConsultaECResponseNueva, params?: ConsultaParams): string {
    let ticket = '';
    
    // Encabezado
    ticket += this.createHeader('ESTADO DE CUENTA', 'GRUPAL');
    
    // Información del contribuyente
    ticket += this.createPersonalInfo(
      data.nombre || 'N/A',
      data.identidad || 'N/A',
      data.fecha || this.formatDate(new Date()),
      data.hora || this.formatTime(new Date())
    );
    
    // Procesar cada propiedad
    data.propiedades?.forEach((propiedad, index) => {
      ticket += `\n${this.centerText(`PROPIEDAD ${index + 1}`, this.EC_CONFIG.TABLE_WIDTH)}\n`;
      
      if (propiedad.claveCatastral) {
        ticket += `Clave: ${propiedad.claveCatastral}\n`;
      }
      if (propiedad.colonia) {
        ticket += `Colonia: ${this.truncateText(propiedad.colonia, 20)}\n`;
      }
      
      ticket += this.createLine('-', this.EC_CONFIG.TABLE_WIDTH) + '\n';
      ticket += this.createECTable(propiedad.detallesMora || []);
      ticket += this.createECTotal(propiedad.totalPropiedadNumerico || 0);
    });
    
    // Total general de todas las propiedades
    const totalGeneral = data.propiedades?.reduce((sum, propiedad) => 
      sum + (propiedad.totalPropiedadNumerico || 0), 0) || data.totalGeneralNumerico || 0;
    
    ticket += this.createLine('=', this.EC_CONFIG.TABLE_WIDTH) + '\n';
    ticket += this.alignRight(`TOTAL GENERAL: ${this.formatFullCurrency(totalGeneral)}`, this.CONFIG.PAPER_WIDTH) + '\n';
    ticket += this.createLine('=', this.EC_CONFIG.TABLE_WIDTH) + '\n';
    
    // Información de amnistía si aplica
    if (data.amnistiaVigente) {
      ticket += this.createAmnistiaNotice();
    }
    
    // Pie de página
    ticket += this.createFooter('RECUERDE QUE EL PAGO DE VUELTAS\nVENCE EL 31 DE AGOSTO DEL 2025');
    
    return ticket;
  }

  /**
   * Formatea Estado de Cuenta Individual con Amnistía
   */
  formatEstadoCuentaConAmnistia(data: EstadoCuentaResponse, params?: ConsultaParams): string {
    let ticket = '';
    
    // Encabezado
    ticket += this.createHeader('ESTADO DE CUENTA');
    
    // Información personal
    ticket += this.createPersonalInfo(
      data.nombre || 'N/A',
      data.identidad || 'N/A',
      data.fecha || this.formatDate(new Date()),
      data.hora || this.formatTime(new Date()),
      data.claveCatastral
    );
    
    // Tabla de detalles
    ticket += this.createECTable(data.detallesMora || []);
    
    // Total general
    ticket += this.createECTotal(data.totalGeneralNumerico || 0);
    
    // Mensaje final con amnistía
     ticket += this.centerText('Amnistia aplicada') + '\n';
     ticket += this.centerText('Amnistia vence el 31 de agosto del 2025') + '\n';
     ticket += this.centerText('Datos Actualizados a la fecha de consulta.') + '\n';
    
    return ticket;
  }

  /**
   * Formatea Estado de Cuenta Grupal con Amnistía
   */
  formatEstadoCuentaGrupalConAmnistia(data: ConsultaECResponseNueva, params?: ConsultaParams): string {
    let ticket = this.formatEstadoCuentaGrupal(data, params);
    
    // Agregar información específica de amnistía
    if (data.amnistiaVigente) {
      const amnistiaInfo = this.createAmnistiaDetails(data);
      // Insertar antes del pie de página
      const footerIndex = ticket.lastIndexOf('Datos actualizados');
      if (footerIndex > -1) {
        ticket = ticket.substring(0, footerIndex) + amnistiaInfo + ticket.substring(footerIndex);
      } else {
        ticket += amnistiaInfo;
      }
    }
    
    return ticket;
  }

  /**
   * Crea la tabla de Estado de Cuenta
   */
  private createECTable(detalles: DetalleMora[]): string {
    let table = '';
    
    // Encabezado de la tabla
    table += this.createECHeader();
    table += this.createTableSeparator(this.EC_CONFIG.TABLE_COLUMNS) + '\n';
    
    // Filas de datos
    detalles.forEach(detalle => {
      table += this.createECRow(detalle) + '\n';
    });
    
    table += this.createTableSeparator(this.EC_CONFIG.TABLE_COLUMNS) + '\n';
    
    return table;
  }

  /**
   * Crea el encabezado de la tabla con espaciado adecuado
   */
  private createECHeader(): string {
    let header = '';
    header += this.alignLeft(this.EC_CONFIG.TABLE_HEADERS[0], this.EC_CONFIG.TABLE_COLUMNS[0]); // Año
    header += ' '; // Espacio separador
    header += this.alignRight(this.EC_CONFIG.TABLE_HEADERS[1], this.EC_CONFIG.TABLE_COLUMNS[1]); // Impto
    header += ' '; // Espacio separador
    header += this.alignRight(this.EC_CONFIG.TABLE_HEADERS[2], this.EC_CONFIG.TABLE_COLUMNS[2]); // T.Aseo
    header += ' '; // Espacio separador
    header += this.alignRight(this.EC_CONFIG.TABLE_HEADERS[3], this.EC_CONFIG.TABLE_COLUMNS[3]); // Bomberos
    header += ' '; // Espacio separador
    header += this.alignRight(this.EC_CONFIG.TABLE_HEADERS[4], this.EC_CONFIG.TABLE_COLUMNS[4]); // Recargo
    header += ' '; // Espacio separador
    header += this.alignRight(this.EC_CONFIG.TABLE_HEADERS[5], this.EC_CONFIG.TABLE_COLUMNS[5]); // Total
    
    return header;
  }

  /**
   * Crea una fila de la tabla con espaciado adecuado
   */
  private createECRow(detalle: DetalleMora): string {
    const year = detalle.year || '????';
    const impuesto = this.formatCurrency(detalle.impuestoNumerico || 0);
    const aseo = this.formatCurrency(detalle.trenDeAseoNumerico || 0);
    const bomberos = this.formatCurrency(detalle.tasaBomberosNumerico || 0);
    const recargo = this.formatCurrency(detalle.recargoNumerico || 0);
    const total = this.formatCurrency(detalle.totalNumerico || 0);
    
    // Crear fila con espaciado entre columnas como en las imágenes
    let row = '';
    row += this.alignLeft(year, this.EC_CONFIG.TABLE_COLUMNS[0]);
    row += ' '; // Espacio separador
    row += this.alignRight(impuesto, this.EC_CONFIG.TABLE_COLUMNS[1]);
    row += ' '; // Espacio separador
    row += this.alignRight(aseo, this.EC_CONFIG.TABLE_COLUMNS[2]);
    row += ' '; // Espacio separador
    row += this.alignRight(bomberos, this.EC_CONFIG.TABLE_COLUMNS[3]);
    row += ' '; // Espacio separador
    row += this.alignRight(recargo, this.EC_CONFIG.TABLE_COLUMNS[4]);
    row += ' '; // Espacio separador
    row += this.alignRight(total, this.EC_CONFIG.TABLE_COLUMNS[5]);
    
    return row;
  }

  /**
   * Crea la línea de total
   */
  private createECTotal(total: number): string {
    let totalSection = '';
    
    totalSection += this.createLine('-', this.EC_CONFIG.TABLE_WIDTH) + '\n';
    const formattedTotal = new Intl.NumberFormat('es-HN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
    }).format(total);
    totalSection += this.alignRight(`Total a pagar L. ${formattedTotal}`, this.EC_CONFIG.TABLE_WIDTH) + '\n';
    totalSection += '\n';
    
    return totalSection;
  }

  /**
   * Crea el aviso de amnistía
   */
  private createAmnistiaNotice(fechaFin?: string): string {
    let notice = '';
    
    notice += this.createSpacing(1);
    notice += this.centerText('*** AMNISTIA VIGENTE ***') + '\n';
    notice += this.centerText('Aplican descuentos especiales') + '\n';
    
    if (fechaFin) {
      notice += this.centerText(`Vigente hasta: ${fechaFin}`) + '\n';
    }
    
    notice += this.createLine('*') + '\n';
    
    return notice;
  }

  /**
   * Crea detalles específicos de amnistía
   */
  private createAmnistiaDetails(data: EstadoCuentaResponse | ConsultaECResponseNueva): string {
    let details = '';
    
    details += this.createSpacing(1);
    details += this.centerText('DETALLES DE AMNISTIA') + '\n';
    details += this.createLine('*') + '\n';
    
    // Aquí se pueden agregar más detalles específicos de la amnistía
    // según los campos disponibles en la interfaz
    
    details += this.centerText('Consulte condiciones y') + '\n';
    details += this.centerText('requisitos en ventanilla') + '\n';
    details += this.createLine('*') + '\n';
    
    return details;
  }
}