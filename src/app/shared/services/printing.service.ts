import { Injectable } from '@angular/core';
import { EstadoCuentaResponse, ConsultaECResponseNueva } from '../interfaces/estado-cuenta.interface';
import { SearchParams } from '../../features/estado-cuenta/estado-cuenta.service';

@Injectable({
  providedIn: 'root'
})
export class PrintingService {

  constructor() { }

  formatEstadoCuenta(data: EstadoCuentaResponse, searchParams?: SearchParams, isAmnesty: boolean = false): string {
    let receipt = '';
    
    // Configuración para impresoras térmicas - descomenta la línea que funcione:
    // receipt += '\x1B\x74\x00'; // Codificación PC437
    // receipt += '\x1B\x74\x02'; // Codificación PC850 
    // receipt += '\x1B\x74\x03'; // Codificación PC860
    // receipt += '\x1B\x74\x0A'; // Codificación ISO8859-1

    // Encabezado centrado con tildes y acentos - usando método de normalización
    receipt += this.centerText(this.normalizeText('ALCALDIA MUNICIPAL DEL DISTRITO CENTRAL')) + '\n';
    receipt += this.centerText('TEGUCIGALPA, HONDURAS, C.A.') + '\n';
    receipt += this.centerText(this.normalizeText('GERENCIA DE RECAUDACION Y CONTROL FINANCIERO')) + '\n';
    
    // Título específico según el tipo de consulta
    if (isAmnesty) {
      receipt += this.centerText(this.normalizeText('ESTADO DE CUENTA CON AMNISTIA')) + '\n\n';
    } else {
      receipt += this.centerText('ESTADO DE CUENTA') + '\n\n';
    }

    // Información de búsqueda
    // if (searchParams) {
    //   receipt += this.normalizeText('-- Parametros de Busqueda --') + '\n';
    //   if (searchParams.dni) {
    //     receipt += `Busqueda por DNI: ${searchParams.dni}\n`;
    //   } else if (searchParams.claveCatastral) {
    //     receipt += `Busqueda por Clave Catastral: ${searchParams.claveCatastral}\n`;
    //   }
    //   receipt += '\n';
    // }

    // Información Personal y Fecha
    receipt += this.normalizeText('-- Informacion Personal --') + '\n';
    receipt += `Nombre: ${data.nombre}\n`;
    receipt += `Identidad: ${data.identidad}\n`;
    receipt += `Clave Catastral: ${data.claveCatastral}\n\n`;
    receipt += this.normalizeText('-- Fecha y Ubicacion --') + '\n';
    receipt += `Colonia: ${data.nombreColonia}\n`;
    receipt += `Fecha: ${data.fecha} ${data.hora}\n\n`;

    // Indicador de amnistía si aplica
    if (isAmnesty) {
      receipt += this.createLine() + '\n';
      receipt += this.centerText(this.normalizeText('*** AMNISTIA APLICADA ***')) + '\n';
      // receipt += this.centerText(this.normalizeText('Recargos reducidos segun articulo')) + '\n';
      receipt += this.createLine() + '\n\n';
    }

    // Tabla de Mora
    receipt += this.createLine() + '\n';
    receipt += this.createRow([this.normalizeText('Año'), 'Impto', 'T.Aseo', 'Bomberos', 'Recargo', 'Total']) + '\n';
    receipt += this.createLine() + '\n';

    data.detallesMora.forEach(detalle => {
      receipt += this.createRow([
        detalle.year,
        this.formatCurrencyWithSeparators(detalle.impuestoNumerico),
        this.formatCurrencyWithSeparators(detalle.trenDeAseoNumerico),
        this.formatCurrencyWithSeparators(detalle.tasaBomberosNumerico),
        this.formatCurrencyWithSeparators(detalle.recargoNumerico),
        this.formatCurrencyWithSeparators(detalle.totalNumerico)
      ]) + '\n';
    });

    receipt += this.createLine() + '\n';
    receipt += this.alignRight(`Total: ${this.formatCurrencyWithSeparators(data.totalGeneralNumerico)}`) + '\n\n';

    // Total a Pagar en negrita y centrado
    receipt += this.setBold(true);
    receipt += this.centerText('Total a Pagar: ' + this.formatCurrencyWithSeparators(data.totalGeneralNumerico) + ' LPS') + '\n';
    receipt += this.setBold(false);
    receipt += '\n';

    // Pie de página centrado
    receipt += this.centerText('Datos actualizados al 15 de junio del 2025.') + '\n';
    receipt += this.centerText(this.normalizeText('Para mayor información llamar al 2220-6088')) + '\n';
    receipt += this.centerText('RECUERDA QUE EL PAGO DE BIENES INMUEBLES') + '\n';
    receipt += this.centerText('VENCE EL 31 DE AGOSTO DEL 2025') + '\n';

    return receipt;
  }

  // Método para activar/desactivar texto en negrita
  private setBold(enable: boolean): string {
    return enable ? '\x1B\x45\x01' : '\x1B\x45\x00'; // ESC E 1 = Bold ON, ESC E 0 = Bold OFF
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
    return ' '.repeat(Math.max(0, padding)) + text;
  }

  private createLine(char: string = '-', width: number = 48): string {
    return char.repeat(width);
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
  
  // Método genérico para facturas simples - MEJORADO
  formatInvoiceForPrinting(invoice: any): string {
    let receipt = '';
    
    // Encabezado centrado
    receipt += this.centerText('RECIBO DE FACTURA') + '\n\n';
    
    receipt += `Cliente: ${invoice.cliente || ''}\n`;
    receipt += `Fecha: ${invoice.fecha || ''}\n`;
    receipt += this.createLine() + '\n';
    
    if (invoice.detalles && Array.isArray(invoice.detalles)) {
      invoice.detalles.forEach((item: any) => {
        receipt += `${item.descripcion || ''}  ${this.formatCurrency(item.monto || 0)}\n`;
      });
    }
    
    receipt += this.createLine() + '\n';
    
    // Total en negrita
    receipt += this.setBold(true);
    receipt += this.alignRight(`Total: ${this.formatCurrency(invoice.total || 0)}`) + '\n';
    receipt += this.setBold(false);
    
    return receipt;
  }
  
  // Método para facturas detalladas - MEJORADO
  formatDetailedInvoice(invoice: any): string {
    let receipt = '';
    
    // Encabezado centrado
    receipt += this.centerText('FACTURA DETALLADA') + '\n\n';
    
    receipt += `Cliente: ${invoice.cliente || ''}\n`;
    receipt += `Fecha: ${invoice.fecha || ''}\n`;
    receipt += this.createLine() + '\n';
    
    if (invoice.detalles && Array.isArray(invoice.detalles)) {
      receipt += this.normalizeText('Descripción')+ '         Cantidad   Precio   Subtotal\n';
      invoice.detalles.forEach((item: any) => {
        receipt += `${item.descripcion || ''}`.padEnd(18) + 
                  `${item.cantidad || 0}`.toString().padEnd(10) + 
                  `${this.formatCurrency(item.precio || 0)}`.padEnd(10) + 
                  `${this.formatCurrency(item.subtotal || 0)}\n`;
      });
    }
    
    receipt += this.createLine() + '\n';
    
    // Total en negrita
    receipt += this.setBold(true);
    receipt += this.alignRight(`Total: ${this.formatCurrency(invoice.total || 0)}`) + '\n';
    receipt += this.setBold(false);
    
    return receipt;
  }

  // ========== MÉTODOS PARA IMPRESIÓN GRUPAL ==========
  
  /**
   * Formatea múltiples estados de cuenta para impresión grupal (sin amnistía)
   */
  formatEstadoCuentaGrupal(
    estadosCuenta: EstadoCuentaResponse[], 
    consultaResponse: ConsultaECResponseNueva,
    searchParams?: SearchParams
  ): string {
    let receipt = '';
    
    // Encabezado principal
    receipt += this.centerText(this.normalizeText('ALCALDIA MUNICIPAL DEL DISTRITO CENTRAL')) + '\n';
    receipt += this.centerText('TEGUCIGALPA, HONDURAS, C.A.') + '\n';
    receipt += this.centerText(this.normalizeText('GERENCIA DE RECAUDACION Y CONTROL FINANCIERO')) + '\n';
    receipt += this.centerText('ESTADO DE CUENTA GRUPAL') + '\n\n';
    
    // Información de búsqueda
    if (searchParams?.dni) {
      receipt += this.normalizeText('-- Parametros de Busqueda --') + '\n';
      receipt += `Busqueda por DNI: ${searchParams.dni}\n`;
      receipt += `Propiedades encontradas: ${estadosCuenta.length}\n\n`;
    }
    
    // Procesar cada propiedad
    estadosCuenta.forEach((estadoCuenta, index) => {
      receipt += this.createLine() + '\n';
      receipt += this.centerText(`PROPIEDAD ${index + 1} DE ${estadosCuenta.length}`) + '\n';
      receipt += this.createLine() + '\n\n';
      
      // Información de la propiedad
      receipt += this.normalizeText('-- Informacion Personal --') + '\n';
      receipt += `Nombre: ${estadoCuenta.nombre}\n`;
      receipt += `Identidad: ${estadoCuenta.identidad}\n`;
      receipt += `Clave Catastral: ${estadoCuenta.claveCatastral}\n\n`;
      receipt += this.normalizeText('-- Fecha y Ubicacion --') + '\n';
      receipt += `Colonia: ${estadoCuenta.nombreColonia}\n`;
      receipt += `Fecha: ${estadoCuenta.fecha} ${estadoCuenta.hora}\n\n`;
      
      // Tabla de mora para esta propiedad
      receipt += this.createLine() + '\n';
      receipt += this.createRow([this.normalizeText('Año'), 'Impto', 'T.Aseo', 'Bomberos', 'Recargo', 'Total']) + '\n';
      receipt += this.createLine() + '\n';
      
      estadoCuenta.detallesMora.forEach(detalle => {
        receipt += this.createRow([
          detalle.year,
          this.formatCurrencyWithSeparators(detalle.impuestoNumerico),
          this.formatCurrencyWithSeparators(detalle.trenDeAseoNumerico),
          this.formatCurrencyWithSeparators(detalle.tasaBomberosNumerico),
          this.formatCurrencyWithSeparators(detalle.recargoNumerico),
          this.formatCurrencyWithSeparators(detalle.totalNumerico)
        ]) + '\n';
      });
      
      receipt += this.createLine() + '\n';
      receipt += this.alignRight(`Subtotal Propiedad: ${this.formatCurrencyWithSeparators(estadoCuenta.totalGeneralNumerico)}`) + '\n\n';
    });
    
    // Total general grupal
    const totalGrupal = estadosCuenta.reduce((sum, estado) => sum + estado.totalGeneralNumerico, 0);
    
    receipt += this.createLine('=') + '\n';
    receipt += this.setBold(true);
    receipt += this.centerText(`TOTAL GENERAL: ${this.formatCurrencyWithSeparators(totalGrupal)} LPS`) + '\n';
    receipt += this.setBold(false);
    receipt += this.createLine('=') + '\n\n';
    
    // Pie de página
    receipt += this.centerText('Datos actualizados al 15 de junio del 2025.') + '\n';
    receipt += this.centerText(this.normalizeText('Para mayor información llamar al 2220-6088')) + '\n';
    receipt += this.centerText('RECUERDA QUE EL PAGO DE BIENES INMUEBLES') + '\n';
    receipt += this.centerText('VENCE EL 31 DE AGOSTO DEL 2025') + '\n';
    
    return receipt;
  }
  
  /**
   * Formatea múltiples estados de cuenta para impresión grupal con amnistía
   */
  formatEstadoCuentaGrupalAmnistia(
    estadosCuenta: EstadoCuentaResponse[], 
    consultaResponse: ConsultaECResponseNueva,
    searchParams?: SearchParams
  ): string {
    let receipt = '';
    
    // Encabezado principal
    receipt += this.centerText(this.normalizeText('ALCALDIA MUNICIPAL DEL DISTRITO CENTRAL')) + '\n';
    receipt += this.centerText('TEGUCIGALPA, HONDURAS, C.A.') + '\n';
    receipt += this.centerText(this.normalizeText('GERENCIA DE RECAUDACION Y CONTROL FINANCIERO')) + '\n';
    receipt += this.centerText(this.normalizeText('ESTADO DE CUENTA GRUPAL CON AMNISTIA')) + '\n\n';
    
    // Información de búsqueda
    if (searchParams?.dni) {
      receipt += this.normalizeText('-- Parametros de Busqueda --') + '\n';
      receipt += `Busqueda por DNI: ${searchParams.dni}\n`;
      receipt += `Propiedades encontradas: ${estadosCuenta.length}\n\n`;
    }
    
    // Procesar cada propiedad
    estadosCuenta.forEach((estadoCuenta, index) => {
      receipt += this.createLine() + '\n';
      receipt += this.centerText(`PROPIEDAD ${index + 1} DE ${estadosCuenta.length}`) + '\n';
      receipt += this.createLine() + '\n\n';
      
      // Información de la propiedad
      receipt += this.normalizeText('-- Informacion Personal --') + '\n';
      receipt += `Nombre: ${estadoCuenta.nombre}\n`;
      receipt += `Identidad: ${estadoCuenta.identidad}\n`;
      receipt += `Clave Catastral: ${estadoCuenta.claveCatastral}\n\n`;
      receipt += this.normalizeText('-- Fecha y Ubicacion --') + '\n';
      receipt += `Colonia: ${estadoCuenta.nombreColonia}\n`;
      receipt += `Fecha: ${estadoCuenta.fecha} ${estadoCuenta.hora}\n\n`;
      
      // Indicador de amnistía
      receipt += this.createLine() + '\n';
      receipt += this.centerText(this.normalizeText('*** AMNISTIA APLICADA ***')) + '\n';
      receipt += this.createLine() + '\n\n';
      
      // Tabla de mora para esta propiedad
      receipt += this.createLine() + '\n';
      receipt += this.createRow([this.normalizeText('Año'), 'Impto', 'T.Aseo', 'Bomberos', 'Recargo', 'Total']) + '\n';
      receipt += this.createLine() + '\n';
      
      estadoCuenta.detallesMora.forEach(detalle => {
        receipt += this.createRow([
          detalle.year,
          this.formatCurrencyWithSeparators(detalle.impuestoNumerico),
          this.formatCurrencyWithSeparators(detalle.trenDeAseoNumerico),
          this.formatCurrencyWithSeparators(detalle.tasaBomberosNumerico),
          this.formatCurrencyWithSeparators(detalle.recargoNumerico),
          this.formatCurrencyWithSeparators(detalle.totalNumerico)
        ]) + '\n';
      });
      
      receipt += this.createLine() + '\n';
      receipt += this.alignRight(`Subtotal Propiedad: ${this.formatCurrencyWithSeparators(estadoCuenta.totalGeneralNumerico)}`) + '\n\n';
    });
    
    // Total general grupal
    const totalGrupal = estadosCuenta.reduce((sum, estado) => sum + estado.totalGeneralNumerico, 0);
    
    receipt += this.createLine('=') + '\n';
    receipt += this.setBold(true);
    receipt += this.centerText(`TOTAL GENERAL CON AMNISTIA: ${this.formatCurrencyWithSeparators(totalGrupal)} LPS`) + '\n';
    receipt += this.setBold(false);
    receipt += this.createLine('=') + '\n\n';
    
    // Pie de página
    receipt += this.centerText('Datos actualizados al 15 de junio del 2025.') + '\n';
    receipt += this.centerText(this.normalizeText('Para mayor información llamar al 2220-6088')) + '\n';
    receipt += this.centerText('RECUERDA QUE EL PAGO DE BIENES INMUEBLES') + '\n';
    receipt += this.centerText('VENCE EL 31 DE AGOSTO DEL 2025') + '\n';
    
    return receipt;
  }
  

}