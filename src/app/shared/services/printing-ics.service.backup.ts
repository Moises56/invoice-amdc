import { Injectable } from '@angular/core';
import { 
  ConsultaICSResponseReal, 
  EmpresaICS, 
  SearchICSParams,
  DetalleMoraReal
} from '../interfaces/consulta-ics.interface';

@Injectable({
  providedIn: 'root'
})
export class PrintingIcsService {

  constructor() { }

  /**
   * Formatea consulta ICS para impresión (sin amnistía)
   */
  formatConsultaICS(data: ConsultaICSResponseReal, searchParams?: SearchICSParams): string {
    let receipt = '';
    
    // Encabezado centrado
    receipt += this.centerText(this.normalizeText('ALCALDIA MUNICIPAL DEL DISTRITO CENTRAL')) + '\n';
    receipt += this.centerText('TEGUCIGALPA, HONDURAS, C.A.') + '\n';
    receipt += this.centerText(this.normalizeText('GERENCIA DE RECAUDACION Y CONTROL FINANCIERO')) + '\n';
    receipt += this.centerText(this.normalizeText('VOLUMEN DE VENTAS ANUALES - ICS')) + '\n\n';

    // Información Personal
    receipt += this.normalizeText('-- Informacion Personal --') + '\n';
    receipt += `Nombre: ${data.nombre}\n`;
    receipt += `Identidad: ${data.identidad}\n\n`;
    
    receipt += this.normalizeText('-- Fecha de Consulta --') + '\n';
    receipt += `Fecha: ${data.fecha} ${data.hora}\n\n`;

    // Procesar cada empresa
    if (data.empresas && data.empresas.length > 0) {
      data.empresas.forEach((empresa, index) => {
        if (data.empresas!.length > 1) {
          receipt += this.createLine() + '\n';
          receipt += this.centerText(`EMPRESA ${index + 1} DE ${data.empresas!.length}`) + '\n';
          receipt += this.createLine() + '\n';
        }
        
        receipt += `Numero de Empresa: ${empresa.numeroEmpresa}\n`;
        
        
        // Tabla de detalles de mora
        if (empresa.detallesMora && empresa.detallesMora.length > 0) {
          receipt += this.createLine() + '\n';
          receipt += this.createRowICS([
            this.normalizeText('Año'), 
            'Impuesto', 
            'T.Aseo', 
            'Bomberos', 
            'Otros', 
            'Recargo', 
            'Total'
          ]) + '\n';
          receipt += this.createLine() + '\n';

          empresa.detallesMora.forEach(detalle => {
            receipt += this.createRowICS([
              (detalle.anio || detalle.year || '').toString(),
              this.formatCurrencyWithSeparators(detalle.impuestoNumerico || 0),
              this.formatCurrencyWithSeparators(detalle.trenDeAseoNumerico || 0),
              this.formatCurrencyWithSeparators(detalle.tasaBomberosNumerico || 0),
              this.formatCurrencyWithSeparators(detalle.otrosNumerico || 0),
              this.formatCurrencyWithSeparators(detalle.recargoNumerico || 0),
              this.formatCurrencyWithSeparators(detalle.totalNumerico || detalle.total || 0)
            ]) + '\n';
          });
          
          receipt += this.createLine() + '\n';
          receipt += this.alignRight(`Subtotal Empresa: ${this.formatCurrencyWithSeparators(empresa.totalPropiedadNumerico)}`) + '\n\n';
        }
      });
     }

    // Total general
    receipt += this.createLine('=') + '\n';
    receipt += this.setBold(true);
    receipt += this.centerText(`Total General: ${this.formatCurrencyWithSeparators(data.totalGeneralNumerico)}`) + '\n';
    receipt += this.centerText(`Descuento Pronto Pago: -${this.formatCurrencyWithSeparators(data.descuentoProntoPagoNumerico || 0)}`) + '\n';
    receipt += this.centerText(`TOTAL A PAGAR: ${this.formatCurrencyWithSeparators(data.totalAPagarNumerico || data.totalGeneralNumerico)} LPS`) + '\n';
    receipt += this.setBold(false);
    receipt += this.createLine('=') + '\n\n';

    // Pie de página
    receipt += this.centerText('Datos actualizados al 15 de junio del 2025.') + '\n';
    receipt += this.centerText(this.normalizeText('Para mayor información llamar al 2220-6088')) + '\n';
    receipt += this.centerText('RECUERDA QUE EL PAGO DE VOLUMEN DE VENTAS') + '\n';
    receipt += this.centerText('VENCE EL 31 DE AGOSTO DEL 2025') + '\n';

    return receipt;
  }

  /**
   * Formatea consulta ICS para impresión (con amnistía)
   */
  formatConsultaICSAmnistia(data: ConsultaICSResponseReal, searchParams?: SearchICSParams): string {
    let receipt = '';
    
    // Encabezado centrado
    receipt += this.centerText(this.normalizeText('ALCALDIA MUNICIPAL DEL DISTRITO CENTRAL')) + '\n';
    receipt += this.centerText('TEGUCIGALPA, HONDURAS, C.A.') + '\n';
    receipt += this.centerText(this.normalizeText('GERENCIA DE RECAUDACION Y CONTROL FINANCIERO')) + '\n';
    receipt += this.centerText(this.normalizeText('VOLUMEN DE VENTAS ANUALES - ICS CON AMNISTIA')) + '\n\n';

    // Información Personal
    receipt += this.normalizeText('-- Informacion Personal --') + '\n';
    receipt += `Nombre: ${data.nombre}\n`;
    receipt += `Identidad: ${data.identidad}\n\n`;
    
    receipt += this.normalizeText('-- Fecha de Consulta --') + '\n';
    receipt += `Fecha: ${data.fecha} ${data.hora}\n\n`;

    // Indicador de amnistía
    if (data.amnistiaVigente) {
      receipt += this.createLine() + '\n';
      receipt += this.centerText(this.normalizeText('*** AMNISTIA APLICADA ***')) + '\n';
      if (data.fechaFinAmnistia) {
        receipt += this.centerText(`Valida hasta: ${data.fechaFinAmnistia}`) + '\n';
      }
      receipt += this.createLine() + '\n\n';
    }

    // Procesar cada empresa
    if (data.empresas && data.empresas.length > 0) {
      data.empresas.forEach((empresa, index) => {
        if (data.empresas!.length > 1) {
          receipt += this.createLine() + '\n';
          receipt += this.centerText(`EMPRESA ${index + 1} DE ${data.empresas!.length}`) + '\n';
          receipt += this.createLine() + '\n';
        }
        
        receipt += `Numero de Empresa: ${empresa.numeroEmpresa}\n`;
        
        
        // Tabla de detalles de mora
        if (empresa.detallesMora && empresa.detallesMora.length > 0) {
          receipt += this.createLine() + '\n';
          receipt += this.createRowICS([
            this.normalizeText('Año'), 
            'Impuesto', 
            'T.Aseo', 
            'Bomberos', 
            'Otros', 
            'Recargo', 
            'Total'
          ]) + '\n';
          receipt += this.createLine() + '\n';

          empresa.detallesMora.forEach(detalle => {
            receipt += this.createRowICS([
              (detalle.anio || detalle.year || '').toString(),
              this.formatCurrencyWithSeparators(detalle.impuestoNumerico || 0),
              this.formatCurrencyWithSeparators(detalle.trenDeAseoNumerico || 0),
              this.formatCurrencyWithSeparators(detalle.tasaBomberosNumerico || 0),
              this.formatCurrencyWithSeparators(detalle.otrosNumerico || 0),
              this.formatCurrencyWithSeparators(detalle.recargoNumerico || 0),
              this.formatCurrencyWithSeparators(detalle.totalNumerico || detalle.total || 0)
            ]) + '\n';
          });
          
          receipt += this.createLine() + '\n';
          receipt += this.alignRight(`Subtotal Empresa: ${this.formatCurrencyWithSeparators(empresa.totalPropiedadNumerico)}`) + '\n\n';
        }
      });
    }

    // Resumen financiero con amnistía
    receipt += this.createLine('=') + '\n';
    receipt += this.alignRight(`Total General: ${this.formatCurrencyWithSeparators(data.totalGeneralNumerico)}`) + '\n';
    
    if (data.descuentoProntoPagoNumerico && data.descuentoProntoPagoNumerico > 0) {
      receipt += this.alignRight(`Descuento Pronto Pago: -${this.formatCurrencyWithSeparators(data.descuentoProntoPagoNumerico)}`) + '\n';
      const subtotal = data.totalGeneralNumerico - data.descuentoProntoPagoNumerico;
      receipt += this.alignRight(`Subtotal: ${this.formatCurrencyWithSeparators(subtotal)}`) + '\n';
    }
    
    if (data.descuentoAmnistiaNumerico && data.descuentoAmnistiaNumerico > 0) {
      receipt += this.alignRight(`Descuento Amnistia: -${this.formatCurrencyWithSeparators(data.descuentoAmnistiaNumerico)}`) + '\n';
    }
    
    receipt += this.setBold(true);
    receipt += this.centerText(`TOTAL A PAGAR CON AMNISTIA: ${this.formatCurrencyWithSeparators(data.totalAPagarNumerico)} LPS`) + '\n';
    receipt += this.setBold(false);
    receipt += this.createLine('=') + '\n\n';

    // Pie de página
    receipt += this.centerText('Datos actualizados al 15 de junio del 2025.') + '\n';
    receipt += this.centerText(this.normalizeText('Para mayor información llamar al 2220-6088')) + '\n';
    receipt += this.centerText('RECUERDA QUE EL PAGO DE VOLUMEN DE VENTAS') + '\n';
    receipt += this.centerText('VENCE EL 31 DE AGOSTO DEL 2025') + '\n';

    return receipt;
  }

  /**
   * Formatea múltiples empresas ICS para impresión grupal (sin amnistía)
   */
  formatConsultaICSGrupal(
    empresas: EmpresaICS[], 
    data: ConsultaICSResponseReal, 
    searchParams?: SearchICSParams
  ): string {
    let receipt = '';
    
    // Encabezado principal
    receipt += this.centerText(this.normalizeText('ALCALDIA MUNICIPAL DEL DISTRITO CENTRAL')) + '\n';
    receipt += this.centerText('TEGUCIGALPA, HONDURAS, C.A.') + '\n';
    receipt += this.centerText(this.normalizeText('GERENCIA DE RECAUDACION Y CONTROL FINANCIERO')) + '\n';
    receipt += this.centerText(this.normalizeText('VOLUMEN DE VENTAS ANUALES - ICS GRUPAL')) + '\n\n';
    
    // Información Personal
    receipt += this.normalizeText('-- Informacion Personal --') + '\n';
    receipt += `Nombre: ${data.nombre}\n`;
    receipt += `Identidad: ${data.identidad}\n`;
    
    // Información de búsqueda
    if (searchParams?.dni) {
      receipt += this.normalizeText('-- Parametros de Busqueda --') + '\n';
      receipt += `Busqueda por DNI: ${searchParams.dni}\n`;
      receipt += `Empresas encontradas: ${empresas.length}\n\n`;
    }
    
    receipt += this.normalizeText('-- Fecha de Consulta --') + '\n';
    receipt += `Fecha: ${data.fecha} ${data.hora}\n\n`;

    // Procesar cada empresa
    empresas.forEach((empresa, index) => {
      receipt += this.createLine() + '\n';
      receipt += this.centerText(`EMPRESA ${index + 1} DE ${empresas.length}`) + '\n';
      receipt += this.createLine() + '\n';
      
      receipt += `Numero de Empresa: ${empresa.numeroEmpresa}\n`;
      
      
      // Tabla de detalles de mora para esta empresa
      if (empresa.detallesMora && empresa.detallesMora.length > 0) {
        receipt += this.createLine() + '\n';
        receipt += this.createRowICS([
          this.normalizeText('Año'), 
          'Impuesto', 
          'T.Aseo', 
          'Bomberos', 
          'Otros', 
          'Recargo', 
          'Total'
        ]) + '\n';
        receipt += this.createLine() + '\n';

        empresa.detallesMora.forEach(detalle => {
          receipt += this.createRowICS([
            (detalle.anio || detalle.year || '').toString(),
            this.formatCurrencyWithSeparators(detalle.impuestoNumerico || 0),
            this.formatCurrencyWithSeparators(detalle.trenDeAseoNumerico || 0),
            this.formatCurrencyWithSeparators(detalle.tasaBomberosNumerico || 0),
            this.formatCurrencyWithSeparators(detalle.otrosNumerico || 0),
            this.formatCurrencyWithSeparators(detalle.recargoNumerico || 0),
            this.formatCurrencyWithSeparators(detalle.totalNumerico || detalle.total || 0)
          ]) + '\n';
        });
        
        receipt += this.createLine() + '\n';
        receipt += this.alignRight(`Subtotal Empresa: ${this.formatCurrencyWithSeparators(empresa.totalPropiedadNumerico)}`) + '\n\n';
      }
    });
    
    // Total general grupal
    const totalGrupal = empresas.reduce((sum, empresa) => sum + empresa.totalPropiedadNumerico, 0);
    const descuentoProntoPagoGrupal = totalGrupal * 0.05; // 5% de descuento por pronto pago
    const totalAPagarGrupal = totalGrupal - descuentoProntoPagoGrupal;
    
    receipt += this.createLine('=') + '\n';
    receipt += this.setBold(true);
    receipt += this.centerText(`Total General Grupal: ${this.formatCurrencyWithSeparators(totalGrupal)}`) + '\n';
    receipt += this.centerText(`Descuento Pronto Pago Grupal: -${this.formatCurrencyWithSeparators(descuentoProntoPagoGrupal)}`) + '\n';
    receipt += this.centerText(`TOTAL GRUPAL A PAGAR: ${this.formatCurrencyWithSeparators(totalAPagarGrupal)} LPS`) + '\n';
    receipt += this.setBold(false);
    receipt += this.createLine('=') + '\n\n';
    
    // Pie de página
    receipt += this.centerText('Datos actualizados al 15 de junio del 2025.') + '\n';
    receipt += this.centerText(this.normalizeText('Para mayor información llamar al 2220-6088')) + '\n';
    receipt += this.centerText('RECUERDA QUE EL PAGO DE VOLUMEN DE VENTAS') + '\n';
    receipt += this.centerText('VENCE EL 31 DE AGOSTO DEL 2025') + '\n';
    
    return receipt;
  }

  /**
   * Formatea múltiples empresas ICS para impresión grupal (con amnistía)
   */
  formatConsultaICSGrupalAmnistia(
    empresas: EmpresaICS[], 
    data: ConsultaICSResponseReal, 
    searchParams?: SearchICSParams
  ): string {
    let receipt = '';
    
    // Encabezado principal
    receipt += this.centerText(this.normalizeText('ALCALDIA MUNICIPAL DEL DISTRITO CENTRAL')) + '\n';
    receipt += this.centerText('TEGUCIGALPA, HONDURAS, C.A.') + '\n';
    receipt += this.centerText(this.normalizeText('GERENCIA DE RECAUDACION Y CONTROL FINANCIERO')) + '\n';
    receipt += this.centerText(this.normalizeText('VOLUMEN DE VENTAS ANUALES - ICS GRUPAL CON AMNISTIA')) + '\n\n';
    
    // Información Personal
    receipt += this.normalizeText('-- Informacion Personal --') + '\n';
    receipt += `Nombre: ${data.nombre}\n`;
    receipt += `Identidad: ${data.identidad}\n`;
    
    // Información de búsqueda
    if (searchParams?.dni) {
      receipt += this.normalizeText('-- Parametros de Busqueda --') + '\n';
      receipt += `Busqueda por DNI: ${searchParams.dni}\n`;
      receipt += `Empresas encontradas: ${empresas.length}\n\n`;
    }
    
    receipt += this.normalizeText('-- Fecha de Consulta --') + '\n';
    receipt += `Fecha: ${data.fecha} ${data.hora}\n\n`;

    // Indicador de amnistía
    if (data.amnistiaVigente) {
      receipt += this.createLine() + '\n';
      receipt += this.centerText(this.normalizeText('*** AMNISTIA APLICADA ***')) + '\n';
      if (data.fechaFinAmnistia) {
        receipt += this.centerText(`Valida hasta: ${data.fechaFinAmnistia}`) + '\n';
      }
      receipt += this.createLine() + '\n\n';
    }

    // Procesar cada empresa
    empresas.forEach((empresa, index) => {
      receipt += this.createLine() + '\n';
      receipt += this.centerText(`EMPRESA ${index + 1} DE ${empresas.length}`) + '\n';
      receipt += this.createLine() + '\n';
      
      receipt += `Numero de Empresa: ${empresa.numeroEmpresa}\n`;
      
      
      // Tabla de detalles de mora para esta empresa
      if (empresa.detallesMora && empresa.detallesMora.length > 0) {
        receipt += this.createLine() + '\n';
        receipt += this.createRowICS([
          this.normalizeText('Año'), 
          'Impuesto', 
          'T.Aseo', 
          'Bomberos', 
          'Otros', 
          'Recargo', 
          'Total'
        ]) + '\n';
        receipt += this.createLine() + '\n';

        empresa.detallesMora.forEach(detalle => {
          receipt += this.createRowICS([
            (detalle.anio || detalle.year || '').toString(),
            this.formatCurrencyWithSeparators(detalle.impuestoNumerico || 0),
            this.formatCurrencyWithSeparators(detalle.trenDeAseoNumerico || 0),
            this.formatCurrencyWithSeparators(detalle.tasaBomberosNumerico || 0),
            this.formatCurrencyWithSeparators(detalle.otrosNumerico || 0),
            this.formatCurrencyWithSeparators(detalle.recargoNumerico || 0),
            this.formatCurrencyWithSeparators(detalle.totalNumerico || detalle.total || 0)
          ]) + '\n';
        });
        
        receipt += this.createLine() + '\n';
        receipt += this.alignRight(`Subtotal Empresa: ${this.formatCurrencyWithSeparators(empresa.totalPropiedadNumerico)}`) + '\n\n';
      }
    });
    
    // Total general grupal con amnistía
    const totalGrupal = empresas.reduce((sum, empresa) => sum + empresa.totalPropiedadNumerico, 0);
    const descuentoProntoPagoGrupal = totalGrupal * 0.05; // 5% de descuento por pronto pago
    const subtotalGrupal = totalGrupal - descuentoProntoPagoGrupal;
    const descuentoAmnistiaGrupal = totalGrupal * 0.13; // 13% de descuento por amnistía (ejemplo)
    const totalFinalGrupal = subtotalGrupal - descuentoAmnistiaGrupal;
    
    receipt += this.createLine('=') + '\n';
    receipt += this.alignRight(`Total General Grupal: ${this.formatCurrencyWithSeparators(totalGrupal)}`) + '\n';
    receipt += this.alignRight(`Descuento Pronto Pago Grupal: -${this.formatCurrencyWithSeparators(descuentoProntoPagoGrupal)}`) + '\n';
    receipt += this.alignRight(`Subtotal: ${this.formatCurrencyWithSeparators(subtotalGrupal)}`) + '\n';
    receipt += this.alignRight(`Descuento Amnistia: -${this.formatCurrencyWithSeparators(descuentoAmnistiaGrupal)}`) + '\n';
    
    receipt += this.setBold(true);
    receipt += this.centerText(`TOTAL GRUPAL CON AMNISTIA: ${this.formatCurrencyWithSeparators(totalFinalGrupal)} LPS`) + '\n';
    receipt += this.setBold(false);
    receipt += this.createLine('=') + '\n\n';
    
    // Pie de página
    receipt += this.centerText('Datos actualizados al 15 de junio del 2025.') + '\n';
    receipt += this.centerText(this.normalizeText('Para mayor información llamar al 2220-6088')) + '\n';
    receipt += this.centerText('RECUERDA QUE EL PAGO DE VOLUMEN DE VENTAS') + '\n';
    receipt += this.centerText('VENCE EL 31 DE AGOSTO DEL 2025') + '\n';
    
    return receipt;
  }

  // ========== MÉTODOS AUXILIARES ==========

  private setBold(enable: boolean): string {
    return enable ? '\x1B\x45\x01' : '\x1B\x45\x00';
  }

  private normalizeText(text: string): string {
    const charMap: { [key: string]: string } = {
      'á': String.fromCharCode(160), 'é': String.fromCharCode(130), 
      'í': String.fromCharCode(161), 'ó': String.fromCharCode(162), 
      'ú': String.fromCharCode(163), 'Á': String.fromCharCode(181), 
      'É': String.fromCharCode(144), 'Í': String.fromCharCode(214), 
      'Ó': String.fromCharCode(224), 'Ú': String.fromCharCode(233), 
      'ñ': String.fromCharCode(164), 'Ñ': String.fromCharCode(165), 
      'ü': String.fromCharCode(129), 'Ü': String.fromCharCode(154)
    };
    
    return text.replace(/[áéíóúÁÉÍÓÚñÑüÜ]/g, (match) => charMap[match] || match);
  }

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

  private createRowICS(columns: string[], colWidths: number[] = [4, 6, 6, 7, 5, 6, 8]): string {
    let row = '';
    columns.forEach((col, index) => {
      if (colWidths[index]) {
        row += col.substring(0, colWidths[index]).padEnd(colWidths[index]);
      }
    });
    return row;
  }

  /**
   * Formatea tabla ICS para móviles - Versión compacta
   */
  private formatTableMobile(empresa: any): string {
    let table = '';
    
    if (empresa.detallesMora && empresa.detallesMora.length > 0) {
      // Formato móvil - Información por año en bloques
      empresa.detallesMora.forEach((detalle: any, index: number) => {
        table += this.createLine('-', 48) + '\n';
        table += this.centerText(`DETALLE ${index + 1} - AÑO ${detalle.anio || detalle.year}`) + '\n';
        table += this.createLine('-', 48) + '\n';
        
        table += `Impuesto........: ${this.formatCurrencyWithSeparators(detalle.impuestoNumerico || 0)}\n`;
        table += `Tasa Aseo.......: ${this.formatCurrencyWithSeparators(detalle.trenDeAseoNumerico || 0)}\n`;
        table += `Tasa Bomberos...: ${this.formatCurrencyWithSeparators(detalle.tasaBomberosNumerico || 0)}\n`;
        table += `Otros...........: ${this.formatCurrencyWithSeparators(detalle.otrosNumerico || 0)}\n`;
        table += `Recargo.........: ${this.formatCurrencyWithSeparators(detalle.recargoNumerico || 0)}\n`;
        table += this.createLine('.', 48) + '\n';
        table += this.setBold(true);
        table += `TOTAL AÑO.......: ${this.formatCurrencyWithSeparators(detalle.totalNumerico || detalle.total || 0)}\n`;
        table += this.setBold(false);
        
        if (index < empresa.detallesMora.length - 1) {
          table += '\n';
        }
      });
    }
    
    return table;
  }

  /**
   * Formatea tabla ICS modo compacto (alternativa)
   */
  private formatTableCompact(empresa: any): string {
    let table = '';
    
    if (empresa.detallesMora && empresa.detallesMora.length > 0) {
      // Encabezado compacto
      table += this.createLine() + '\n';
      table += 'Año   Impuesto   T.Aseo   Bomberos    Total\n';
      table += this.createLine() + '\n';
      
      empresa.detallesMora.forEach((detalle: any) => {
        const año = (detalle.anio || detalle.year || '').toString().substring(0, 4);
        const impuesto = this.formatCompactCurrency(detalle.impuestoNumerico || 0);
        const aseo = this.formatCompactCurrency(detalle.trenDeAseoNumerico || 0);
        const bomberos = this.formatCompactCurrency(detalle.tasaBomberosNumerico || 0);
        const total = this.formatCompactCurrency(detalle.totalNumerico || detalle.total || 0);
        
        table += `${año.padEnd(4)} ${impuesto.padStart(9)} ${aseo.padStart(8)} ${bomberos.padStart(10)} ${total.padStart(9)}\n`;
      });
      
      table += this.createLine() + '\n';
    }
    
    return table;
  }

  /**
   * Formatea moneda de forma compacta (K para miles, M para millones)
   */
  private formatCompactCurrency(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'K';
    } else {
      return value.toFixed(0);
    }
  }

  private alignRight(text: string, width: number = 48): string {
    return text.padStart(width);
  }
}
