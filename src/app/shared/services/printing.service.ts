import { Injectable } from '@angular/core';
import { Invoice } from '../../core/interfaces';

// ESC/POS Commands
const ESC = '\x1B';
const GS = '\x1D';
const LF = '\x0A';

@Injectable({
  providedIn: 'root',
})
export class PrintingService {
  constructor() {}

  formatDetailedInvoice(data: any): string {
    let receipt = '';

    // Initialize printer
    receipt += this._initializePrinter();

    // Header
    receipt += this._setJustification('center');
    receipt += this._setBold(true);
    receipt += `${data.nombre_mercado}\n`;
    receipt += this._setBold(false);
    receipt += `${data.direccion_mercado}\n`;
    receipt += '--------------------------------\n';
    receipt += LF;

    // Invoice Info
    receipt += this._setJustification('left');
    receipt += `Factura #: ${data.numero_factura}\n`;
    receipt += `Fecha: ${new Date(data.fecha).toLocaleString('es-HN')}\n`;
    receipt += `Estado: ${data.estado_factura}\n`;
    receipt += LF;

    // Customer Info
    receipt += `Local: ${data.nombre_local} (#${data.numero_local})\n`;
    receipt += `Propietario: ${data.propietario_nombre}\n`;
    receipt += `DNI: ${data.propietario_dni}\n`;
    receipt += '--------------------------------\n';
    receipt += LF;

    // Items Header
    receipt += this._setJustification('center');
    receipt += this._setBold(true);
    receipt += '--- DETALLE DE FACTURA ---\n';
    receipt += this._setBold(false);
    receipt += LF;

    // Items
    receipt += this._setJustification('left');
    receipt += `Concepto: Cuota de ${data.mes}/${data.anio}\n`;
    receipt += LF;

    // Totals
    receipt += this._setJustification('right');
    receipt += this._setBold(true);
    receipt += `Monto a Pagar: L. ${Number(data.monto).toFixed(2)}\n`;
    receipt += this._setBold(false);
    receipt += '--------------------------------\n';
    receipt += LF;

    // Footer
    receipt += this._setJustification('center');
    receipt += 'Presente este recibo en caja\n';
    receipt += 'Gracias por su pago\n';
    receipt += LF;
    receipt += LF;
    receipt += LF;

    // Cut paper
    receipt += this._cutPaper();

    return receipt;
  }

  formatInvoiceForPrinting(invoice: Invoice): string {
    let receipt = '';

    // Initialize printer
    receipt += this._initializePrinter();

    // Header
    receipt += this._setJustification('center');
    receipt += this._setBold(true);
    receipt += 'Mi Empresa S.A.\n';
    receipt += this._setBold(false);
    receipt += 'Dirección de la Empresa\n';
    receipt += 'Tel: 123-456-7890\n';
    receipt += LF;

    // Invoice Info
    receipt += this._setJustification('left');
    receipt += `Factura: ${invoice.id}\n`;
    receipt += `Fecha: ${invoice.date.toLocaleString()}\n`;
    receipt += `Cliente: ${invoice.customerName}\n`;
    receipt += '-'.repeat(32) + LF;

    // Items Header
    receipt += this._padEnd('Cant.', 5);
    receipt += this._padEnd('Desc.', 17);
    receipt += this._padStart('Total', 10);
    receipt += LF;
    receipt += '-'.repeat(32) + LF;

    // Items
    invoice.items.forEach((item) => {
      const itemTotal = (item.quantity * item.price).toFixed(2);
      receipt += this._padEnd(item.quantity.toString(), 5);
      receipt += this._padEnd(item.description, 17);
      receipt += this._padStart(`$${itemTotal}`, 10);
      receipt += LF;
    });
    receipt += '-'.repeat(32) + LF;

    // Totals
    receipt += this._setJustification('right');
    receipt += `Subtotal: ${this._padStart('$' + invoice.subtotal.toFixed(2), 10)}\n`;
    receipt += `ISV:      ${this._padStart('$' + invoice.tax.toFixed(2), 10)}\n`;
    receipt += this._setBold(true);
    receipt += `Total:    ${this._padStart('$' + invoice.total.toFixed(2), 10)}\n`;
    receipt += this._setBold(false);
    receipt += LF;

    // Footer
    receipt += this._setJustification('center');
    receipt += '¡Gracias por su compra!\n';
    receipt += LF;
    receipt += LF;

    // Cut paper
    receipt += this._cutPaper();

    return receipt;
  }

  private _initializePrinter(): string {
    return ESC + '@';
  }

  private _setJustification(align: 'left' | 'center' | 'right'): string {
    let code: number;
    switch (align) {
      case 'center':
        code = 1;
        break;
      case 'right':
        code = 2;
        break;
      default:
        code = 0;
        break;
    }
    return ESC + 'a' + String.fromCharCode(code);
  }

  private _setBold(bold: boolean): string {
    return ESC + 'E' + (bold ? '\x01' : '\x00');
  }

  private _cutPaper(): string {
    return GS + 'V' + String.fromCharCode(1);
  }

  private _padEnd(str: string, length: number): string {
    return str.padEnd(length, ' ');
  }

  private _padStart(str: string, length: number): string {
    return str.padStart(length, ' ');
  }
}
