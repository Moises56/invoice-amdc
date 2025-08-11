import { Injectable } from '@angular/core';

export interface Invoice {
  id: string | number;
  date: Date;
  customerName: string;
  items: {
    quantity: number;
    description: string;
    price: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class PrintingService {
  private readonly PAPER_WIDTH = 40;

  constructor() {}

  /**
   * Formatea una factura para impresión térmica
   */
  formatInvoiceForPrinting(invoice: Invoice): string {
    let receipt = '';
    
    // Encabezado profesional centrado
    receipt += this.centerText([
      'ALCALDIA MUNICIPAL DEL DISTRITO CENTRAL',
      'TEGUCIGALPA HONDURAS C.A.',
      'GERENCIA DE RECAUDACION Y',
      'CONTROL FINANCIERO',
      'ESTADO DE CUENTA'
    ]) + '\n';
    receipt += this.createLine('=') + '\n';
    
    // Información de la factura
    receipt += `Factura: ${invoice.id}\n`;
    receipt += `Fecha: ${this.formatDate(invoice.date)}\n`;
    receipt += `Cliente: ${invoice.customerName}\n`;
    receipt += this.createLine('-') + '\n';
    
    // Items
    invoice.items.forEach(item => {
      receipt += `${item.quantity}x ${item.description}\n`;
      receipt += this.alignRight(`L. ${this.formatCurrency(item.price)}`, this.PAPER_WIDTH) + '\n';
    });
    
    receipt += this.createLine('-') + '\n';
    
    // Totales
    receipt += this.alignRight(`Subtotal: L. ${this.formatCurrency(invoice.subtotal)}`, this.PAPER_WIDTH) + '\n';
    if (invoice.tax > 0) {
      receipt += this.alignRight(`Impuesto: L. ${this.formatCurrency(invoice.tax)}`, this.PAPER_WIDTH) + '\n';
    }
    receipt += this.alignRight(`TOTAL: L. ${this.formatCurrency(invoice.total)}`, this.PAPER_WIDTH) + '\n';
    
    receipt += this.createLine('=') + '\n';
    receipt += this.centerText('Gracias por su pago') + '\n';
    receipt += '\n\n\n';
    
    return receipt;
  }

  /**
   * Centra el texto en el ancho del papel
   */
  /**
   * Centra una o varias líneas de texto en el ancho del papel
   * Si el texto es más largo que PAPER_WIDTH, lo recorta.
   * Si es multilinea, centra cada línea.
   */
  private centerText(text: string | string[]): string {
    const lines = Array.isArray(text) ? text : text.split('\n');
    return lines.map(line => {
      let l = line.trim();
      if (l.length > this.PAPER_WIDTH) {
        l = l.slice(0, this.PAPER_WIDTH);
      }
      const padding = Math.max(0, Math.floor((this.PAPER_WIDTH - l.length) / 2));
      return ' '.repeat(padding) + l;
    }).join('\n');
  }

  /**
   * Alinea el texto a la derecha
   */
  private alignRight(text: string, width: number): string {
    const padding = Math.max(0, width - text.length);
    return ' '.repeat(padding) + text;
  }

  /**
   * Crea una línea de caracteres
   */
  private createLine(char: string): string {
    return char.repeat(this.PAPER_WIDTH);
  }

  /**
   * Formatea la fecha
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-HN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formatea moneda
   */
  private formatCurrency(amount: number): string {
    return amount.toLocaleString('es-HN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}