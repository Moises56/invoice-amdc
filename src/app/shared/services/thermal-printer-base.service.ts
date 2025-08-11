// thermal-printer-base.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export abstract class ThermalPrinterBaseService {

  // Configuración optimizada para impresoras térmicas
  protected readonly CONFIG = {
    PAPER_WIDTH: 54,           // Caracteres por línea
    FONT_SIZE: '1.0pt',        // (informativo)
    LINE_HEIGHT: 0.4,          // (informativo)
    PADDING: '0.02mm',         // (informativo)
    BORDER: '0.1px solid #333',// (informativo)
    USE_ESC_POS: true,         // si false, no enviará comandos ESC/POS
    LINE_SPACING_DOTS: 6      // n en ESC 3 n -> prueba valores 6..14 para compactar
  };

  /* ---------------- ESC/POS helpers ---------------- */

  // ESC 3 n -> set line spacing to n dots
  protected escSetLineSpacing(n: number): string {
    if (!this.CONFIG.USE_ESC_POS) return '';
    const nByte = Math.max(0, Math.min(255, Math.round(n)));
    return '\x1B\x33' + String.fromCharCode(nByte);
  }

  // ESC 2 -> restore default line spacing
  protected escResetLineSpacing(): string {
    if (!this.CONFIG.USE_ESC_POS) return '';
    return '\x1B\x32';
  }

  // Optional: center using ESC/POS justification (0 left, 1 center, 2 right)
  protected escJustifyCenter(): string {
    if (!this.CONFIG.USE_ESC_POS) return '';
    return '\x1B\x61\x01';
  }

  protected escJustifyLeft(): string {
    if (!this.CONFIG.USE_ESC_POS) return '';
    return '\x1B\x61\x00';
  }

  /* ---------------- utilidades de formato ---------------- */

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

  protected createLine(char: string = '-', width: number = this.CONFIG.PAPER_WIDTH): string {
    return char.repeat(width);
  }

  protected alignRight(text: string, width: number = this.CONFIG.PAPER_WIDTH): string {
    const cleanText = this.normalizeText(text);
    if (cleanText.length >= width) {
      return cleanText.substring(0, width);
    }

    const padding = width - cleanText.length;
    return ' '.repeat(padding) + cleanText;
  }

  protected alignLeft(text: string, width: number = this.CONFIG.PAPER_WIDTH): string {
    const cleanText = this.normalizeText(text);
    if (cleanText.length >= width) {
      return cleanText.substring(0, width);
    }

    const padding = width - cleanText.length;
    return cleanText + ' '.repeat(padding);
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-HN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
    }).format(value);
  }

  protected formatFullCurrency(value: number): string {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2
    }).format(value);
  }

  protected normalizeText(text: string): string {
    if (!text) return '';

    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^\w\s\.\-\,]/g, '') // letras, números, espacios, puntos, guiones, comas
      .trim();
  }

  /* ---------------- HEADER / FOOTER / INFO ---------------- */

  /**
   * Crea el encabezado estándar con interlineado compacto.
   * Usa ESC/POS para reducir el espaciado entre líneas si está habilitado.
   */
  protected createHeader(title: string, subtitle?: string): string {
    let header = '';

    // set line spacing compact (en puntos)
    header += this.escSetLineSpacing(this.CONFIG.LINE_SPACING_DOTS);

    // Si tu impresora admite justification, podrías usarlo en lugar de centrar con espacios.
    // Aquí usamos centrar por texto para mantener compatibilidad.
    header += this.centerText('ALCALDIA MUNICIPAL DEL DISTRITO CENTRAL') + '\n';
    header += this.centerText('TEGUCIGALPA, HONDURAS, C.A.') + '\n';
    header += this.centerText('GERENCIA DE RECAUDACION Y ') + '\n';
    header += this.centerText('CONTROL FINANCIERO') + '\n';
    header += this.centerText(title) + '\n';
    if (subtitle) {
      header += this.centerText(subtitle) + '\n';
    }

    // RESTAURAR el interlineado al valor por defecto (por si la tabla necesita más separación)
    header += this.escResetLineSpacing();

    // NOTA: eliminé saltos de línea extra innecesarios para que quede compacto.
    // Si necesitas 1 línea de separación antes de los datos, descomenta la siguiente:
    // header += '\n';

    return header;
  }

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

  protected createPersonalInfo(nombre: string, identidad: string, fecha: string, hora: string, claveCatastral?: string): string {
    let info = '';

    info += `Nombre: ${this.normalizeText(nombre)}\n`;
    info += `Identidad: ${identidad}\n`;
    if (claveCatastral) {
      info += `Clave Catastral: ${claveCatastral}\n`;
    }
    info += `Fecha y hora: ${fecha} ${hora}\n`;

    // Sin salto extra grande — la tabla seguirá inmediatamente
    return info;
  }

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

  protected createTableSeparator(columnWidths: number[]): string {
    return columnWidths.map(width => '-'.repeat(width)).join('');
  }

  protected formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-HN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  protected formatTime(time: string | Date): string {
    const t = typeof time === 'string' ? new Date(time) : time;
    return t.toLocaleTimeString('es-HN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  protected truncateText(text: string, maxWidth: number): string {
    const cleanText = this.normalizeText(text);
    if (cleanText.length <= maxWidth) {
      return cleanText;
    }
    return cleanText.substring(0, maxWidth - 3) + '...';
  }

  protected createSpacing(lines: number = 1): string {
    return '\n'.repeat(lines);
  }
}
