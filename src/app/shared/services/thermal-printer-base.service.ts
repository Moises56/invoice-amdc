import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export abstract class ThermalPrinterBaseService {

  // Configuración optimizada para impresoras térmicas
  protected readonly CONFIG = {
    PAPER_WIDTH: 54,           // Caracteres por línea (ajustado para números completos)
    FONT_SIZE: '1.0pt',        // Tamaño ultra-compacto
    LINE_HEIGHT: 0.4,          // Espaciado mínimo
    PADDING: '0.02mm',         // Padding mínimo
    BORDER: '0.1px solid #333' // Bordes finos
  };

  /**
   * Centra un texto en el ancho especificado
   */
  protected centerText(text: string, width: number = this.CONFIG.PAPER_WIDTH): string {
    const cleanText = this.normalizeText(text);
    if (cleanText.length >= width) {
      return cleanText.substring(0, width);
    }
    
    const padding = Math.floor((width - cleanText.length) / 2);
    const leftPad = ' '.repeat(padding);
    const rightPad = ' '.repeat(width - cleanText.length - padding);
    
    return leftPad + cleanText + rightPad;
  }

  /**
   * Crea una línea de separación
   */
  protected createLine(char: string = '-', width: number = this.CONFIG.PAPER_WIDTH): string {
    return char.repeat(width);
  }

  /**
   * Alinea texto a la derecha
   */
  protected alignRight(text: string, width: number = this.CONFIG.PAPER_WIDTH): string {
    const cleanText = this.normalizeText(text);
    if (cleanText.length >= width) {
      return cleanText.substring(0, width);
    }
    
    const padding = width - cleanText.length;
    return ' '.repeat(padding) + cleanText;
  }

  /**
   * Alinea texto a la izquierda
   */
  protected alignLeft(text: string, width: number = this.CONFIG.PAPER_WIDTH): string {
    const cleanText = this.normalizeText(text);
    if (cleanText.length >= width) {
      return cleanText.substring(0, width);
    }
    
    const padding = width - cleanText.length;
    return cleanText + ' '.repeat(padding);
  }

  /**
   * Formatea un número como moneda para tablas (números completos con separadores de miles)
   */
  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-HN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
    }).format(value);
  }

  /**
   * Formatea un número como moneda completa
   */
  protected formatFullCurrency(value: number): string {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2
    }).format(value);
  }

  /**
   * Normaliza texto removiendo caracteres especiales
   */
  protected normalizeText(text: string): string {
    if (!text) return '';
    
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^\w\s.-]/g, '') // Solo letras, números, espacios, puntos y guiones
      .trim();
  }

  /**
   * Crea el encabezado estándar
   */
  protected createHeader(title: string, subtitle?: string): string {
    let header = '';
    // Encabezado institucional con espaciado compacto y líneas centradas
    header += this.centerText('ALCALDIA MUNICIPAL DEL DISTRITO CENTRAL') + '\n';
    header += this.centerText('TEGUCIGALPA, HONDURAS, CA.') + '\n';
    header += this.centerText('GERENCIA DE RECAUDACION Y ') + '\n';
    header += this.centerText('CONTROL FINANCIERO') + '\n';
    header += this.centerText(title) + '\n';
    if (subtitle) {
      header += this.centerText(subtitle) + '\n';
    }
    header += '\n'; // Un espacio antes de la información personal
    return header;
  }

  /**
   * Crea el pie de página estándar
   */
  protected createFooter(additionalInfo?: string): string {
    let footer = '';
    
    footer += this.createLine('=') + '\n';
    footer += this.centerText('Datos actualizados a la fecha') + '\n';
    footer += this.centerText('de la consulta.') + '\n';
    footer += this.centerText('Para mayor informacion llamar') + '\n';
    footer += this.centerText('al 2220-6508') + '\n';
    
    if (additionalInfo) {
      footer += this.createLine('-') + '\n';
      footer += this.centerText(additionalInfo) + '\n';
    }
    
    footer += this.createLine('=') + '\n';
    
    return footer;
  }

  /**
   * Crea información personal del contribuyente
   */
  protected createPersonalInfo(nombre: string, identidad: string, fecha: string, hora: string, claveCatastral?: string): string {
    let info = '';
    
    info += `Nombre: ${this.normalizeText(nombre)}\n`;
    info += `Identidad: ${identidad}\n`;
    if (claveCatastral) {
      info += `Clave Catastral: ${claveCatastral}\n`;
    }
    info += `Fecha y hora: ${fecha} ${hora}\n`;
    info += '\n'; // Espacio antes de la tabla
    
    return info;
  }

  /**
   * Crea una fila de tabla con columnas específicas
   */
  protected createTableRow(values: string[], columnWidths: number[]): string {
    if (values.length !== columnWidths.length) {
      throw new Error('El número de valores debe coincidir con el número de columnas');
    }
    
    let row = '';
    for (let i = 0; i < values.length; i++) {
      const value = this.normalizeText(values[i]);
      const width = columnWidths[i];
      
      if (value.length > width) {
        row += value.substring(0, width);
      } else {
        const padding = width - value.length;
        row += value + ' '.repeat(padding);
      }
    }
    
    return row;
  }

  /**
   * Crea el separador de tabla
   */
  protected createTableSeparator(columnWidths: number[]): string {
    return columnWidths.map(width => '-'.repeat(width)).join('');
  }

  /**
   * Formatea fecha en formato legible
   */
  protected formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-HN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Formatea hora en formato legible
   */
  protected formatTime(time: string | Date): string {
    const t = typeof time === 'string' ? new Date(time) : time;
    return t.toLocaleTimeString('es-HN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Trunca texto si excede el ancho máximo
   */
  protected truncateText(text: string, maxWidth: number): string {
    const cleanText = this.normalizeText(text);
    if (cleanText.length <= maxWidth) {
      return cleanText;
    }
    return cleanText.substring(0, maxWidth - 3) + '...';
  }

  /**
   * Crea espaciado vertical
   */
  protected createSpacing(lines: number = 1): string {
    return '\n'.repeat(lines);
  }
}