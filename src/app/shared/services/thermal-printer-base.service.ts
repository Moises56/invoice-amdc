// thermal-printer-base.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export abstract class ThermalPrinterBaseService {
  // Configuración basada en especificaciones reales: 72mm, 8 puntos/mm, 576 puntos/fila
  protected readonly CONFIG = {
    PAPER_WIDTH: 48, // Caracteres por línea con fuente condensada (72mm)
    PAPER_WIDTH_NORMAL: 24, // Caracteres por línea con fuente normal (72mm)
    FONT_SIZE: 'GB18030', // Fuente estándar de la impresora
    RESOLUTION: 203, // 203 ppp (8 puntos/mm)
    PAPER_WIDTH_MM: 72, // Ancho real del papel en mm
    USE_ESC_POS: true, // Compatible con comandos ESC/POS
    LINE_SPACING_DOTS: 6, // Espaciado compacto para 576 puntos/fila
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

  // ESC/POS Font size commands
  protected escSmallFont(): string {
    if (!this.CONFIG.USE_ESC_POS) return '';
    return '\x1B\x21\x01'; // ESC ! 1 -> Small font
  }

  protected escNormalFont(): string {
    if (!this.CONFIG.USE_ESC_POS) return '';
    return '\x1B\x21\x00'; // ESC ! 0 -> Normal font
  }

  protected escCondensedFont(): string {
    if (!this.CONFIG.USE_ESC_POS) return '';
    return '\x0F'; // SI -> Condensed font (more characters per line)
  }

  protected escNormalWidth(): string {
    if (!this.CONFIG.USE_ESC_POS) return '';
    return '\x12'; // DC2 -> Cancel condensed font
  }

  /* ---------------- utilidades de formato ---------------- */

  /**
   * Centra una o varias líneas de texto en el ancho del papel
   * Si el texto es más largo que width, lo recorta.
   * Si es multilinea (array), centra cada línea.
   */
  protected centerText(
    text: string | string[],
    width: number = this.CONFIG.PAPER_WIDTH
  ): string {
    const lines = Array.isArray(text) ? text : [text];
    return lines
      .map((line) => {
        const cleanText = this.normalizeText(line);
        if (cleanText.length >= width) {
          return cleanText.substring(0, width);
        }

        const padding = Math.floor((width - cleanText.length) / 2);
        return ' '.repeat(padding) + cleanText;
      })
      .join('\n');
  }

  protected createLine(
    char: string = '-',
    width: number = this.CONFIG.PAPER_WIDTH
  ): string {
    return char.repeat(width);
  }

  protected alignRight(
    text: string,
    width: number = this.CONFIG.PAPER_WIDTH
  ): string {
    const cleanText = this.normalizeText(text);
    if (cleanText.length >= width) {
      return cleanText.substring(0, width);
    }

    const padding = width - cleanText.length;
    return ' '.repeat(padding) + cleanText;
  }

  protected alignLeft(
    text: string,
    width: number = this.CONFIG.PAPER_WIDTH
  ): string {
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
      useGrouping: true,
    }).format(value);
  }

  protected formatFullCurrency(value: number): string {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2,
    }).format(value);
  }

  /**
   * Formatea moneda con prefijo "Lps." para impresión térmica
   * Evita problemas de codificación con símbolos de moneda
   */
  protected formatCurrencyForPrint(value: number): string {
    const formatted = new Intl.NumberFormat('es-HN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    }).format(value);
    return `Lps. ${formatted}`;
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

  /**
   * Versión de normalización que preserva acentos y caracteres especiales
   * Útil para encabezados y texto que debe mantener su formato original
   */
  protected preserveText(text: string): string {
    if (!text) return '';

    // Para impresoras térmicas, es mejor mantener el texto original
    // y solo eliminar caracteres problemáticos específicos
    return text
      .toString()
      .replace(/[^\u0020-\u007E\u00A0-\u00FF]/g, '') // Mantener ASCII extendido y Latin-1
      .trim();
  }

  /**
   * Versión más simple que mantiene caracteres españoles básicos
   */
  protected preserveSpanishText(text: string): string {
    if (!text) return '';
    
    // Lista específica de caracteres permitidos para español
    const allowedChars = /[a-zA-Z0-9\s\.\-\,ñÑáéíóúÁÉÍÓÚüÜ¿¡]/g;
    return text.match(allowedChars)?.join('') || text;
  }

  /* ---------------- HEADER / FOOTER / INFO ---------------- */

  /**
   * Crea el encabezado profesional estándar centrado.
   * Implementa el mismo formato que printing.service.ts pero con interlineado optimizado.
   */
  protected createHeader(title: string, subtitle?: string): string {
    let header = '';

    // Configurar interlineado compacto para el encabezado
    header += this.escSetLineSpacing(this.CONFIG.LINE_SPACING_DOTS);

    // Encabezado profesional centrado (igual que printing.service.ts)
    header +=
      this.centerText([
        'ALCALDIA MUNICIPAL DEL DISTRITO CENTRAL',
        'TEGUCIGALPA HONDURAS C.A.',
        'GERENCIA DE RECAUDACION Y CONTROL FINANCIERO',
        title,
      ]) + '\n';

    if (subtitle) {
      header += this.centerText(subtitle) + '\n';
    }

    // Línea separadora
    header += this.createLine('=') + '\n';

    // Restaurar interlineado por defecto
    header += this.escResetLineSpacing();

    return header;
  }

  /**
   * Crea un encabezado simplificado para casos específicos
   */
  protected createSimpleHeader(title: string, subtitle?: string): string {
    let header = '';

    header += this.escSetLineSpacing(this.CONFIG.LINE_SPACING_DOTS);
    header += this.centerText('ALCALDIA MUNICIPAL DEL DISTRITO CENTRAL') + '\n';
    header += this.centerText('TEGUCIGALPA, HONDURAS, C.A.') + '\n';
    header += this.centerText('GERENCIA DE RECAUDACION Y ') + '\n';
    header += this.centerText('CONTROL FINANCIERO') + '\n';
    header += this.centerText(title) + '\n';
    if (subtitle) {
      header += this.centerText(subtitle) + '\n';
    }
    header += this.escResetLineSpacing();

    return header;
  }

  protected createFooter(additionalInfo?: string): string {
    let footer = '';

    footer += this.createLine('=') + '\n';
    footer += this.centerText('Datos actualizados a la fecha') + '\n';
    footer += this.centerText('de la consulta.') + '\n';
    footer += this.centerText('Amnistia vence el 31 de agosto de 2025') + '\n';
    footer += this.centerText('31 de agosto de 2025') + '\n';

    if (additionalInfo) {
      footer += this.createLine('-') + '\n';
      footer += this.centerText(additionalInfo) + '\n';
    }

    footer += this.createLine('=') + '\n';

    return footer;
  }

  protected createPersonalInfo(
    nombre: string,
    identidad: string,
    fecha: string,
    hora: string,
    claveCatastral?: string
  ): string {
    let info = '';

    // Preservar acentos en nombres propios
    info += `Nombre: ${this.preserveText(nombre)}\n`;
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
      throw new Error(
        'El número de valores debe coincidir con el número de columnas'
      );
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
   * Crea una fila de tabla preservando caracteres especiales
   * Útil para encabezados que contienen acentos, ñ, etc.
   */
  protected createTableRowPreserved(
    values: string[],
    columnWidths: number[]
  ): string {
    if (values.length !== columnWidths.length) {
      throw new Error(
        'El número de valores debe coincidir con el número de columnas'
      );
    }

    let row = '';
    for (let i = 0; i < values.length; i++) {
      const value = this.preserveText(values[i]);
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
    return columnWidths.map((width) => '-'.repeat(width)).join('');
  }

  protected formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-HN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  protected formatTime(time: string | Date): string {
    const t = typeof time === 'string' ? new Date(time) : time;
    return t.toLocaleTimeString('es-HN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  protected truncateText(text: string, maxWidth: number): string {
    const cleanText = this.normalizeText(text);
    if (cleanText.length <= maxWidth) {
      return cleanText;
    }
    return cleanText.substring(0, maxWidth - 3) + '...';
  }

  /**
   * Trunca texto preservando acentos y caracteres especiales
   */
  protected truncateTextPreserved(text: string, maxWidth: number): string {
    const cleanText = this.preserveText(text);
    if (cleanText.length <= maxWidth) {
      return cleanText;
    }
    return cleanText.substring(0, maxWidth - 3) + '...';
  }

  protected createSpacing(lines: number = 1): string {
    return '\n'.repeat(lines);
  }

  /**
   * Métodos de alineación que preservan acentos y caracteres especiales
   * Útiles para encabezados de tabla y texto que debe mantener su formato
   */
  protected alignLeftPreserved(
    text: string,
    width: number = this.CONFIG.PAPER_WIDTH
  ): string {
    const cleanText = this.preserveSpanishText(text);
    if (cleanText.length >= width) {
      return cleanText.substring(0, width);
    }

    const padding = width - cleanText.length;
    return cleanText + ' '.repeat(padding);
  }

  protected alignRightPreserved(
    text: string,
    width: number = this.CONFIG.PAPER_WIDTH
  ): string {
    const cleanText = this.preserveSpanishText(text);
    if (cleanText.length >= width) {
      return cleanText.substring(0, width);
    }

    const padding = width - cleanText.length;
    return ' '.repeat(padding) + cleanText;
  }

  protected centerTextPreserved(
    text: string | string[],
    width: number = this.CONFIG.PAPER_WIDTH
  ): string {
    const lines = Array.isArray(text) ? text : [text];
    return lines
      .map((line) => {
        const cleanText = this.preserveSpanishText(line);
        if (cleanText.length >= width) {
          return cleanText.substring(0, width);
        }

        const padding = Math.floor((width - cleanText.length) / 2);
        return ' '.repeat(padding) + cleanText;
      })
      .join('\n');
  }

  /**
   * Envuelve contenido de tabla con fuente condensada
   * Útil para tablas que necesitan más espacio horizontal
   */
  protected wrapWithCondensedFont(content: string): string {
    return this.escCondensedFont() + content + this.escNormalWidth();
  }

  /**
   * Crea un encabezado completo con formato de factura/recibo
   * Compatible con el formato usado en printing.service.ts
   */
  protected createInvoiceHeader(
    documentType: string = 'ESTADO DE CUENTA TES'
  ): string {
    let header = '';

    // Encabezado profesional centrado (formato exacto de printing.service.ts)
    header +=
      this.centerText([
        'ALCALDIA MUNICIPAL DEL DISTRITO CENTRAL',
        'TEGUCIGALPA HONDURAS C.A.',
        'GERENCIA DE RECAUDACION Y CONTROL FINANCIERO',
        'CONTROL FINANCIERO',
        documentType,
      ]) + '\n';

    header += this.createLine('=') + '\n';

    return header;
  }

  /**
   * Crea el pie de página para facturas/recibos
   */
  protected createInvoiceFooter(
    thankYouMessage: string = 'Gracias por su pago'
  ): string {
    let footer = '';

    footer += this.createLine('=') + '\n';
    footer += this.centerText(thankYouMessage) + '\n';
    footer += this.createSpacing(3); // Espaciado para corte de papel

    return footer;
  }
}
