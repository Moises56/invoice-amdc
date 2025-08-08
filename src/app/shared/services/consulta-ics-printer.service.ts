import { Injectable } from '@angular/core';
import { ThermalPrinterBaseService } from './thermal-printer-base.service';
import { 
  ConsultaICSResponseReal, 
  EmpresaICS, 
  DetalleMoraReal, 
  SearchICSParams 
} from '../interfaces/consulta-ics.interface';

@Injectable({
  providedIn: 'root'
})
export class ConsultaICSPrinterService extends ThermalPrinterBaseService {

  // Configuración específica para Consulta ICS
  private readonly ICS_CONFIG = {
    TABLE_COLUMNS: [4, 8, 8, 8, 8, 8, 10], // Total: 54 caracteres para números completos
    TABLE_HEADERS: ['Año', 'Impto.', 'T.Aseo', 'Bombero', 'Otros', 'Recargo', 'Total'],
    TABLE_WIDTH: 54
  };

  /**
   * Formatea Consulta ICS Individual (una empresa específica)
   */
  formatConsultaICSIndividual(data: ConsultaICSResponseReal, empresaIndex: number, params?: SearchICSParams): string {
    let ticket = '';
    
    // Encabezado
    ticket += this.createHeader('CONSULTA ICS', 'INDIVIDUAL');
    
    // Información personal
    ticket += this.createPersonalInfo(
      data.nombre || 'N/A',
      data.identidad || 'N/A',
      data.fecha || this.formatDate(new Date()),
      data.hora || this.formatTime(new Date())
    );
    
    // Información de la empresa específica
    const empresa = data.empresas?.[empresaIndex];
    if (empresa) {
      ticket += `Empresa No: ${empresa.numeroEmpresa || 'N/A'}\n`;
      ticket += this.createLine('-') + '\n';
      
      // Tabla de detalles de la empresa
      ticket += this.createICSTable(empresa);
      
      // Subtotal de la empresa
      ticket += this.createICSSubtotal(empresa);
    }
    
    // Información de descuentos si aplica
    if (data.descuentoProntoPagoNumerico && data.descuentoProntoPagoNumerico > 0) {
      ticket += this.createDiscountInfo(data.descuentoProntoPagoNumerico, data.totalAPagarNumerico);
    }
    
    // Información de amnistía si aplica
    if (data.amnistiaVigente) {
      ticket += this.createAmnistiaNotice();
    }
    
    // Pie de página
    ticket += this.createFooter('RECUERDE QUE EL PAGO DE VUELTAS\nVENCE EL 31 DE AGOSTO DEL 2025');
    
    return ticket;
  }

  /**
   * Formatea Consulta ICS Grupal (todas las empresas)
   */
  formatConsultaICSGrupal(data: ConsultaICSResponseReal, params?: SearchICSParams): string {
    let ticket = '';
    
    // Encabezado
    ticket += this.createHeader('CONSULTA ICS', 'GRUPAL');
    
    // Información personal
    ticket += this.createPersonalInfo(
      data.nombre || 'N/A',
      data.identidad || 'N/A',
      data.fecha || this.formatDate(new Date()),
      data.hora || this.formatTime(new Date())
    );
    
    // Procesar cada empresa
    data.empresas?.forEach((empresa, index) => {
      ticket += `\n${this.centerText(`EMPRESA ${index + 1}`, this.ICS_CONFIG.TABLE_WIDTH)}\n`;
      ticket += `No: ${empresa.numeroEmpresa || 'N/A'}\n`;
      ticket += this.createLine('-', this.ICS_CONFIG.TABLE_WIDTH) + '\n';
      
      // Tabla de detalles de la empresa
      ticket += this.createICSTable(empresa);
      
      // Subtotal de la empresa
      ticket += this.createICSSubtotal(empresa);
    });
    
    // Total general
    ticket += this.createICSGrandTotal(data.totalGeneralNumerico || 0);
    
    // Información de descuentos si aplica
    if (data.descuentoProntoPagoNumerico && data.descuentoProntoPagoNumerico > 0) {
      ticket += this.createDiscountInfo(data.descuentoProntoPagoNumerico, data.totalAPagarNumerico);
    }
    
    // Información de amnistía si aplica
    if (data.amnistiaVigente) {
      ticket += this.createAmnistiaNotice();
    }
    
    // Pie de página
    ticket += this.createFooter('RECUERDE QUE EL PAGO DE VUELTAS\nVENCE EL 31 DE AGOSTO DEL 2025');
    
    return ticket;
  }

  /**
   * Formatea Consulta ICS Individual con Amnistía
   */
  formatConsultaICSConAmnistia(data: ConsultaICSResponseReal, empresaIndex: number, params?: SearchICSParams): string {
    let ticket = this.formatConsultaICSIndividual(data, empresaIndex, params);
    
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
   * Formatea Consulta ICS Grupal con Amnistía
   */
  formatConsultaICSGrupalConAmnistia(data: ConsultaICSResponseReal, params?: SearchICSParams): string {
    let ticket = this.formatConsultaICSGrupal(data, params);
    
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
   * Crea la tabla de ICS para una empresa
   */
  private createICSTable(empresa: EmpresaICS): string {
    let table = '';
    
    // Encabezado de la tabla
    table += this.createICSHeader();
    table += this.createTableSeparator(this.ICS_CONFIG.TABLE_COLUMNS) + '\n';
    
    // Filas de datos
    empresa.detallesMora?.forEach(detalle => {
      table += this.createICSRow(detalle) + '\n';
    });
    
    table += this.createTableSeparator(this.ICS_CONFIG.TABLE_COLUMNS) + '\n';
    
    return table;
  }

  /**
   * Crea el encabezado de la tabla ICS con espaciado adecuado
   */
  private createICSHeader(): string {
    let header = '';
    header += this.alignLeft(this.ICS_CONFIG.TABLE_HEADERS[0], this.ICS_CONFIG.TABLE_COLUMNS[0]); // Año
    header += ' '; // Espacio separador
    header += this.alignRight(this.ICS_CONFIG.TABLE_HEADERS[1], this.ICS_CONFIG.TABLE_COLUMNS[1]); // Impto.
    header += ' '; // Espacio separador
    header += this.alignRight(this.ICS_CONFIG.TABLE_HEADERS[2], this.ICS_CONFIG.TABLE_COLUMNS[2]); // T.Aseo
    header += ' '; // Espacio separador
    header += this.alignRight(this.ICS_CONFIG.TABLE_HEADERS[3], this.ICS_CONFIG.TABLE_COLUMNS[3]); // Bombero
    header += ' '; // Espacio separador
    header += this.alignRight(this.ICS_CONFIG.TABLE_HEADERS[4], this.ICS_CONFIG.TABLE_COLUMNS[4]); // Otros
    header += ' '; // Espacio separador
    header += this.alignRight(this.ICS_CONFIG.TABLE_HEADERS[5], this.ICS_CONFIG.TABLE_COLUMNS[5]); // Recargo
    header += ' '; // Espacio separador
    header += this.alignRight(this.ICS_CONFIG.TABLE_HEADERS[6], this.ICS_CONFIG.TABLE_COLUMNS[6]); // Total
    
    return header;
  }

  /**
   * Crea una fila de la tabla ICS con espaciado adecuado
   */
  private createICSRow(detalle: DetalleMoraReal): string {
    const year = detalle.anio?.toString() || '????';
    const impuesto = this.formatCurrency(detalle.impuestoNumerico || 0);
    const aseo = this.formatCurrency(detalle.trenDeAseoNumerico || 0);
    const bomberos = this.formatCurrency(detalle.tasaBomberosNumerico || 0);
    const otros = this.formatCurrency(detalle.otrosNumerico || 0);
    const recargo = this.formatCurrency(detalle.recargoNumerico || 0);
    const total = this.formatCurrency(detalle.totalNumerico || 0);
    
    // Crear fila con espaciado entre columnas como en las imágenes
    let row = '';
    row += this.alignLeft(year, this.ICS_CONFIG.TABLE_COLUMNS[0]);
    row += ' '; // Espacio separador
    row += this.alignRight(impuesto, this.ICS_CONFIG.TABLE_COLUMNS[1]);
    row += ' '; // Espacio separador
    row += this.alignRight(aseo, this.ICS_CONFIG.TABLE_COLUMNS[2]);
    row += ' '; // Espacio separador
    row += this.alignRight(bomberos, this.ICS_CONFIG.TABLE_COLUMNS[3]);
    row += ' '; // Espacio separador
    row += this.alignRight(otros, this.ICS_CONFIG.TABLE_COLUMNS[4]);
    row += ' '; // Espacio separador
    row += this.alignRight(recargo, this.ICS_CONFIG.TABLE_COLUMNS[5]);
    row += ' '; // Espacio separador
    row += this.alignRight(total, this.ICS_CONFIG.TABLE_COLUMNS[6]);
    
    return row;
  }

  /**
   * Crea el subtotal de una empresa
   */
  private createICSSubtotal(empresa: EmpresaICS): string {
    let subtotal = '';
    
    subtotal += this.createLine('-', this.ICS_CONFIG.TABLE_WIDTH) + '\n';
    subtotal += this.alignRight(`Subtotal: ${this.formatFullCurrency(empresa.totalPropiedadNumerico || 0)}`, this.ICS_CONFIG.TABLE_WIDTH) + '\n';
    subtotal += this.createLine('-', this.ICS_CONFIG.TABLE_WIDTH) + '\n';
    
    return subtotal;
  }

  /**
   * Crea el total general de todas las empresas
   */
  private createICSGrandTotal(total: number): string {
    let grandTotal = '';
    
    grandTotal += this.createLine('=', this.ICS_CONFIG.TABLE_WIDTH) + '\n';
    grandTotal += this.alignRight(`TOTAL GENERAL: ${this.formatFullCurrency(total)}`, this.CONFIG.PAPER_WIDTH) + '\n';
    grandTotal += this.createLine('=', this.ICS_CONFIG.TABLE_WIDTH) + '\n';
    
    return grandTotal;
  }

  /**
   * Crea información de descuentos
   */
  private createDiscountInfo(descuento?: number, totalFinal?: number): string {
    let discountInfo = '';
    
    if (descuento && descuento > 0) {
      discountInfo += this.createSpacing(1);
      discountInfo += this.centerText('DESCUENTO PRONTO PAGO') + '\n';
      discountInfo += this.createLine('*') + '\n';
      discountInfo += this.alignRight(`Descuento: ${this.formatFullCurrency(descuento)}`, this.CONFIG.PAPER_WIDTH) + '\n';
      
      if (totalFinal) {
        discountInfo += this.alignRight(`Total a Pagar: ${this.formatFullCurrency(totalFinal)}`, this.CONFIG.PAPER_WIDTH) + '\n';
      }
      
      discountInfo += this.createLine('*') + '\n';
    }
    
    return discountInfo;
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
  private createAmnistiaDetails(data: ConsultaICSResponseReal): string {
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