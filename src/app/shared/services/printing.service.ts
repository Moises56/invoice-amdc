import { Injectable } from '@angular/core';
import { EstadoCuentaResponse } from '../interfaces/estado-cuenta.interface';

@Injectable({
  providedIn: 'root'
})
export class PrintingService {

  constructor() { }

  formatEstadoCuenta(data: EstadoCuentaResponse): string {
    let receipt = '';
    
    // Configuración para impresoras térmicas - descomenta la línea que funcione:
    // receipt += '\x1B\x74\x00'; // Codificación PC437
    // receipt += '\x1B\x74\x02'; // Codificación PC850 
    // receipt += '\x1B\x74\x03'; // Codificación PC860
    // receipt += '\x1B\x74\x0A'; // Codificación ISO8859-1

    // Encabezado con tildes y acentos - usando método de normalización
    receipt += this.centerText(this.normalizeText('Alcaldía Municipal del Distrito Central')) + '\n';
    receipt += this.centerText('Tegucigalpa, Honduras, C.A.') + '\n';
    receipt += this.centerText(this.normalizeText('GERENCIA DE RECAUDACIÓN Y CONTROL FINANCIERO')) + '\n';
    receipt += this.centerText('ESTADO DE CUENTA') + '\n\n';

    // Información Personal y Fecha
    receipt += this.normalizeText('Información Personal') + '\n';
    receipt += `Nombre: ${data.nombre}\n`;
    receipt += `Identidad: ${data.identidad}\n`;
    receipt += `Clave Catastral: ${data.claveCatastral}\n\n`;
    receipt += this.normalizeText('Fecha y Ubicación') + '\n';
    receipt += `Colonia: ${data.nombreColonia}\n`;
    receipt += `Fecha: ${data.fecha} ${data.hora}\n\n`;

    // Tabla de Mora
    receipt += this.createLine() + '\n';
    receipt += this.createRow([this.normalizeText('Año'), 'Impto', 'T.Aseo', 'Bomberos', 'Total']) + '\n';
    receipt += this.createLine() + '\n';

    data.detallesMora.forEach(detalle => {
      receipt += this.createRow([
        detalle.year,
        this.formatCurrencyWithSeparators(detalle.impuestoNumerico),
        this.formatCurrencyWithSeparators(detalle.trenDeAseoNumerico),
        this.formatCurrencyWithSeparators(detalle.tasaBomberosNumerico),
        this.formatCurrencyWithSeparators(detalle.totalNumerico)
      ]) + '\n';
    });

    receipt += this.createLine() + '\n';
    receipt += this.alignRight(`Total: ${this.formatCurrencyWithSeparators(data.totalGeneralNumerico)}`) + '\n\n';

    // Total a Pagar
    receipt += this.centerText('Total a Pagar: ' + this.formatCurrencyWithSeparators(data.totalGeneralNumerico) + ' LPS') + '\n\n';

    // Pie de página
    receipt += 'Datos actualizados al 15 de junio del 2025.\n';
    receipt += this.normalizeText('Para mayor información llamar al 2220-6088') + '\n';
    receipt += 'RECUERDA QUE EL PAGO DE BIENES INMUEBLES\n';
    receipt += 'VENCE EL 31 DE AGOSTO DEL 2025\n';

    return receipt;
  }

  // Método de normalización para impresoras térmicas/POS
  private normalizeText(text: string): string {
    // Mapeo específico para impresoras que usan codificación CP850/CP437
    const charMap: { [key: string]: string } = {
      'á': String.fromCharCode(160), // á en CP850
      'é': String.fromCharCode(130), // é en CP850
      'í': String.fromCharCode(161), // í en CP850
      'ó': String.fromCharCode(162), // ó en CP850
      'ú': String.fromCharCode(163), // ú en CP850
      'Á': String.fromCharCode(181), // Á en CP850
      'É': String.fromCharCode(144), // É en CP850
      'Í': String.fromCharCode(214), // Í en CP850
      'Ó': String.fromCharCode(224), // Ó en CP850
      'Ú': String.fromCharCode(233), // Ú en CP850
      'ñ': String.fromCharCode(164), // ñ en CP850
      'Ñ': String.fromCharCode(165), // Ñ en CP850
      'ü': String.fromCharCode(129), // ü en CP850
      'Ü': String.fromCharCode(154)  // Ü en CP850
    };
    
    return text.replace(/[áéíóúÁÉÍÓÚñÑüÜ]/g, (match) => charMap[match] || match);
  }

  // Método alternativo: remover acentos completamente
  private removeAccents(text: string): string {
    const charMap: { [key: string]: string } = {
      'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
      'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
      'ñ': 'n', 'Ñ': 'N', 'ü': 'u', 'Ü': 'U'
    };
    
    return text.replace(/[áéíóúÁÉÍÓÚñÑüÜ]/g, (match) => charMap[match] || match);
  }

  // Formatea números con separadores de miles y decimales
  private formatCurrencyWithSeparators(value: number): string {
    return value.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private centerText(text: string, width: number = 48): string {
    const padding = Math.floor((width - text.length) / 2);
    return ' '.repeat(padding) + text;
  }

  private createLine(width: number = 48): string {
    return '-'.repeat(width);
  }

  private createRow(columns: string[], colWidths: number[] = [5, 11, 10, 10, 12]): string {
    let row = '';
    columns.forEach((col, index) => {
      row += col.padEnd(colWidths[index]);
    });
    return row;
  }

  private alignRight(text: string, width: number = 48): string {
    return text.padStart(width);
  }

  private formatCurrency(value: number): string {
    return value.toFixed(2);
  }
  
  // Método genérico para facturas simples
  formatInvoiceForPrinting(invoice: any): string {
    let receipt = '';
    receipt += this.centerText('RECIBO DE FACTURA') + '\n';
    receipt += `Cliente: ${invoice.cliente || ''}\n`;
    receipt += `Fecha: ${invoice.fecha || ''}\n`;
    receipt += this.createLine() + '\n';
    if (invoice.detalles && Array.isArray(invoice.detalles)) {
      invoice.detalles.forEach((item: any) => {
        receipt += `${item.descripcion || ''}  ${this.formatCurrency(item.monto || 0)}\n`;
      });
    }
    receipt += this.createLine() + '\n';
    receipt += this.alignRight(`Total: ${this.formatCurrency(invoice.total || 0)}`) + '\n';
    return receipt;
  }
  
  // Método para facturas detalladas
  formatDetailedInvoice(invoice: any): string {
    let receipt = '';
    receipt += this.centerText('FACTURA DETALLADA') + '\n';
    receipt += `Cliente: ${invoice.cliente || ''}\n`;
    receipt += `Fecha: ${invoice.fecha || ''}\n`;
    receipt += this.createLine() + '\n';
    if (invoice.detalles && Array.isArray(invoice.detalles)) {
      receipt += this.normalizeText('Descripción')+ '         Cantidad   Precio   Subtotal\n';
      invoice.detalles.forEach((item: any) => {
        receipt += `${item.descripcion || ''}`.padEnd(18) + `${item.cantidad || 0}`.toString().padEnd(10) + `${this.formatCurrency(item.precio || 0)}`.padEnd(10) + `${this.formatCurrency(item.subtotal || 0)}\n`;
      });
    }
    receipt += this.createLine() + '\n';
    receipt += this.alignRight(`Total: ${this.formatCurrency(invoice.total || 0)}`) + '\n';
    return receipt;
  }
}