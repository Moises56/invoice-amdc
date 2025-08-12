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

  /**
   * Reemplaza caracteres problemáticos para impresoras térmicas
   * Solución específica para el problema de ñ → ±
   */
  protected fixThermalPrinterChars(text: string): string {
    if (!text) return '';

    return text
      .replace(/ñ/g, 'n') // ñ → n
      .replace(/Ñ/g, 'N') // Ñ → N
      .replace(/á/g, 'a') // á → a
      .replace(/é/g, 'e') // é → e
      .replace(/í/g, 'i') // í → i
      .replace(/ó/g, 'o') // ó → o
      .replace(/ú/g, 'u') // ú → u
      .replace(/Á/g, 'A') // Á → A
      .replace(/É/g, 'E') // É → E
      .replace(/Í/g, 'I') // Í → I
      .replace(/Ó/g, 'O') // Ó → O
      .replace(/Ú/g, 'U') // Ú → U
      .replace(/ü/g, 'u') // ü → u
      .replace(/Ü/g, 'U'); // Ü → U
  }

  /**
   * Reemplaza caracteres especiales por equivalentes compatibles
   * con impresoras térmicas usando múltiples enfoques
   */
  protected sanitizeTextForThermalPrinter(text: string): string {
    if (!text) return '';

    // Enfoque 1: Códigos de escape ESC/POS específicos
    let sanitized = text
      .replace(/ñ/g, '\x1B\x74\x0C\xA4') // ESC t 12 + código ñ
      .replace(/Ñ/g, '\x1B\x74\x0C\xA5') // ESC t 12 + código Ñ
      .replace(/á/g, '\x1B\x74\x0C\xA0') // ESC t 12 + código á
      .replace(/é/g, '\x1B\x74\x0C\x82') // ESC t 12 + código é
      .replace(/í/g, '\x1B\x74\x0C\xA1') // ESC t 12 + código í
      .replace(/ó/g, '\x1B\x74\x0C\xA2') // ESC t 12 + código ó
      .replace(/ú/g, '\x1B\x74\x0C\xA3') // ESC t 12 + código ú
      .replace(/Á/g, '\x1B\x74\x0C\xB5') // ESC t 12 + código Á
      .replace(/É/g, '\x1B\x74\x0C\x90') // ESC t 12 + código É
      .replace(/Í/g, '\x1B\x74\x0C\xD6') // ESC t 12 + código Í
      .replace(/Ó/g, '\x1B\x74\x0C\xE0') // ESC t 12 + código Ó
      .replace(/Ú/g, '\x1B\x74\x0C\xE9'); // ESC t 12 + código Ú

    return sanitized;
  }

  /**
   * Método de normalización para impresoras térmicas/POS
   * Múltiples enfoques para diferentes tipos de impresoras
   */
  protected normalizeTextForThermalPrinter(text: string): string {
    if (!text) return '';

    // Usar códigos CP850 directos - enfoque más simple y directo
    const charMap: { [key: string]: string } = {
      ñ: String.fromCharCode(164), // ñ en CP850 (0xA4)
      Ñ: String.fromCharCode(165), // Ñ en CP850 (0xA5)
      á: String.fromCharCode(160), // á en CP850 (0xA0)
      é: String.fromCharCode(130), // é en CP850 (0x82)
      í: String.fromCharCode(161), // í en CP850 (0xA1)
      ó: String.fromCharCode(162), // ó en CP850 (0xA2)
      ú: String.fromCharCode(163), // ú en CP850 (0xA3)
      Á: String.fromCharCode(181), // Á en CP850 (0xB5)
      É: String.fromCharCode(144), // É en CP850 (0x90)
      Í: String.fromCharCode(214), // Í en CP850 (0xD6)
      Ó: String.fromCharCode(224), // Ó en CP850 (0xE0)
      Ú: String.fromCharCode(233), // Ú en CP850 (0xE9)
      ü: String.fromCharCode(129), // ü en CP850 (0x81)
      Ü: String.fromCharCode(154), // Ü en CP850 (0x9A)
    };

    return text.replace(
      /[áéíóúÁÉÍÓÚñÑüÜ]/g,
      (match) => charMap[match] || match
    );
  }

  /**
   * Enfoque alternativo: usar códigos UTF-8 a CP850
   */
  protected normalizeTextForThermalPrinterUTF8(text: string): string {
    if (!text) return '';

    // Convertir usando Buffer si está disponible (Node.js style)
    try {
      // Intentar conversión directa
      const bytes = new TextEncoder().encode(text);
      const cp850Bytes = new Uint8Array(bytes.length);

      for (let i = 0; i < bytes.length; i++) {
        const char = String.fromCharCode(bytes[i]);
        switch (char) {
          case 'ñ':
            cp850Bytes[i] = 164;
            break;
          case 'Ñ':
            cp850Bytes[i] = 165;
            break;
          case 'á':
            cp850Bytes[i] = 160;
            break;
          case 'é':
            cp850Bytes[i] = 130;
            break;
          case 'í':
            cp850Bytes[i] = 161;
            break;
          case 'ó':
            cp850Bytes[i] = 162;
            break;
          case 'ú':
            cp850Bytes[i] = 163;
            break;
          default:
            cp850Bytes[i] = bytes[i];
            break;
        }
      }

      return new TextDecoder('latin1').decode(cp850Bytes);
    } catch (error) {
      // Fallback a método simple
      return this.removeAccentsForThermalPrinter(text);
    }
  }

  /**
   * Método alternativo: remover acentos completamente
   * Para impresoras que no soportan CP850
   */
  protected removeAccentsForThermalPrinter(text: string): string {
    if (!text) return '';

    const charMap: { [key: string]: string } = {
      á: 'a',
      é: 'e',
      í: 'i',
      ó: 'o',
      ú: 'u',
      Á: 'A',
      É: 'E',
      Í: 'I',
      Ó: 'O',
      Ú: 'U',
      ñ: 'n',
      Ñ: 'N',
      ü: 'u',
      Ü: 'U',
    };

    return text.replace(
      /[áéíóúÁÉÍÓÚñÑüÜ]/g,
      (match) => charMap[match] || match
    );
  }

  /**
   * Versión alternativa que usa reemplazos ASCII simples
   * Para impresoras que no soportan CP850
   */
  protected sanitizeTextForThermalPrinterASCII(text: string): string {
    if (!text) return '';

    const asciiReplacements: { [key: string]: string } = {
      ñ: 'n', // ñ → n
      Ñ: 'N', // Ñ → N
      á: 'a', // á → a
      é: 'e', // é → e
      í: 'i', // í → i
      ó: 'o', // ó → o
      ú: 'u', // ú → u
      ü: 'u', // ü → u
      Á: 'A', // Á → A
      É: 'E', // É → E
      Í: 'I', // Í → I
      Ó: 'O', // Ó → O
      Ú: 'U', // Ú → U
      Ü: 'U', // Ü → U
    };

    let sanitized = text;
    for (const [char, replacement] of Object.entries(asciiReplacements)) {
      sanitized = sanitized.replace(new RegExp(char, 'g'), replacement);
    }

    return sanitized;
  }

  /**
   * Comando para configurar la impresora con la tabla de caracteres correcta
   * Múltiples comandos para asegurar compatibilidad
   */
  protected getThermalPrinterSetup(): string {
    let setup = '';

    // Configuración simple y efectiva para impresoras ASCII
    // Ya no necesitamos configuraciones complejas porque usamos "Per." en lugar de "Año"

    // Configurar fuente ASCII Font A (12x24) para mejor legibilidad
    setup += '\x1B\x21\x00'; // ESC ! 0 - Font A (12x24)

    // Configurar tabla de caracteres ASCII estándar
    setup += '\x1B\x74\x00'; // ESC t 0 - ASCII table

    return setup;
  }

  /**
   * Versión mejorada de normalización que usa múltiples enfoques
   */
  protected normalizeTextForThermalPrinterAdvanced(text: string): string {
    if (!text) return '';

    // Enfoque específico para impresoras ASCII (basado en especificaciones)
    // Tu impresora usa ASCII Font A/B, no soporta CP850 nativamente
    const asciiExtendedMap: { [key: string]: string } = {
      ñ: String.fromCharCode(241), // ñ en ASCII extendido (Latin-1: 0xF1)
      Ñ: String.fromCharCode(209), // Ñ en ASCII extendido (Latin-1: 0xD1)
      á: String.fromCharCode(225), // á en ASCII extendido (0xE1)
      é: String.fromCharCode(233), // é en ASCII extendido (0xE9)
      í: String.fromCharCode(237), // í en ASCII extendido (0xED)
      ó: String.fromCharCode(243), // ó en ASCII extendido (0xF3)
      ú: String.fromCharCode(250), // ú en ASCII extendido (0xFA)
      Á: String.fromCharCode(193), // Á en ASCII extendido (0xC1)
      É: String.fromCharCode(201), // É en ASCII extendido (0xC9)
      Í: String.fromCharCode(205), // Í en ASCII extendido (0xCD)
      Ó: String.fromCharCode(211), // Ó en ASCII extendido (0xD3)
      Ú: String.fromCharCode(218), // Ú en ASCII extendido (0xDA)
      ü: String.fromCharCode(252), // ü en ASCII extendido (0xFC)
      Ü: String.fromCharCode(220), // Ü en ASCII extendido (0xDC)
    };

    return text.replace(
      /[áéíóúÁÉÍÓÚñÑüÜ]/g,
      (match) => asciiExtendedMap[match] || match
    );
  }

  /**
   * Método experimental: usar comandos ESC/POS específicos para cada carácter
   */
  protected normalizeTextWithESCCommands(text: string): string {
    if (!text) return '';

    // Enfoque: insertar comandos ESC/POS antes de cada carácter especial
    let result = text;

    // Para ñ: cambiar temporalmente la tabla de caracteres
    result = result.replace(/ñ/g, '\x1B\x74\x03\xF1\x1B\x74\x00'); // ESC t 3 + ñ + ESC t 0
    result = result.replace(/Ñ/g, '\x1B\x74\x03\xD1\x1B\x74\x00'); // ESC t 3 + Ñ + ESC t 0

    // Para otros acentos
    result = result.replace(/á/g, '\x1B\x74\x03\xE1\x1B\x74\x00');
    result = result.replace(/é/g, '\x1B\x74\x03\xE9\x1B\x74\x00');
    result = result.replace(/í/g, '\x1B\x74\x03\xED\x1B\x74\x00');
    result = result.replace(/ó/g, '\x1B\x74\x03\xF3\x1B\x74\x00');
    result = result.replace(/ú/g, '\x1B\x74\x03\xFA\x1B\x74\x00');

    return result;
  }

  /**
   * Método de codificación directa de bytes
   */
  protected normalizeTextWithDirectBytes(text: string): string {
    if (!text) return '';

    // Convertir a bytes y reemplazar directamente
    const encoder = new TextEncoder();
    const decoder = new TextDecoder('iso-8859-1');

    try {
      // Convertir texto a UTF-8 bytes
      const utf8Bytes = encoder.encode(text);

      // Crear array de bytes para ISO-8859-1
      const latin1Bytes = new Uint8Array(utf8Bytes.length);

      for (let i = 0; i < utf8Bytes.length; i++) {
        const byte = utf8Bytes[i];

        // Mapear UTF-8 a ISO-8859-1 para caracteres especiales
        if (byte === 0xc3) {
          // Prefijo UTF-8 para caracteres latinos
          const nextByte = utf8Bytes[i + 1];
          switch (nextByte) {
            case 0xb1:
              latin1Bytes[i] = 0xf1;
              i++;
              break; // ñ
            case 0x91:
              latin1Bytes[i] = 0xd1;
              i++;
              break; // Ñ
            case 0xa1:
              latin1Bytes[i] = 0xe1;
              i++;
              break; // á
            case 0xa9:
              latin1Bytes[i] = 0xe9;
              i++;
              break; // é
            case 0xad:
              latin1Bytes[i] = 0xed;
              i++;
              break; // í
            case 0xb3:
              latin1Bytes[i] = 0xf3;
              i++;
              break; // ó
            case 0xba:
              latin1Bytes[i] = 0xfa;
              i++;
              break; // ú
            default:
              latin1Bytes[i] = byte;
              break;
          }
        } else {
          latin1Bytes[i] = byte;
        }
      }

      return decoder.decode(latin1Bytes);
    } catch (error) {
      // Fallback al método anterior
      return this.normalizeTextForThermalPrinterAdvanced(text);
    }
  }

  /**
   * Método alternativo para impresoras ASCII muy estrictas
   */
  protected normalizeTextForStrictASCII(text: string): string {
    if (!text) return '';

    // Enfoque 1: Usar caracteres ASCII básicos que se parezcan
    const strictASCIIMap: { [key: string]: string } = {
      ñ: String.fromCharCode(126) + 'n', // ~ + n (ASCII 126)
      Ñ: String.fromCharCode(126) + 'N', // ~ + N
      á: 'a', // Remover acentos para otros
      é: 'e',
      í: 'i',
      ó: 'o',
      ú: 'u',
      Á: 'A',
      É: 'E',
      Í: 'I',
      Ó: 'O',
      Ú: 'U',
      ü: 'u',
      Ü: 'U',
    };

    return text.replace(
      /[áéíóúÁÉÍÓÚñÑüÜ]/g,
      (match) => strictASCIIMap[match] || match
    );
  }

  /**
   * Método experimental: usar caracteres ASCII alternativos
   */
  protected normalizeTextForASCIIAlternative(text: string): string {
    if (!text) return '';

    // Probar con otros caracteres ASCII que podrían funcionar
    const altASCIIMap: { [key: string]: string } = {
      ñ: String.fromCharCode(164), // ¤ (símbolo de moneda genérico)
      Ñ: String.fromCharCode(165), // ¥ (yen)
      á: 'a',
      é: 'e',
      í: 'i',
      ó: 'o',
      ú: 'u',
      Á: 'A',
      É: 'E',
      Í: 'I',
      Ó: 'O',
      Ú: 'U',
      ü: 'u',
      Ü: 'U',
    };

    return text.replace(
      /[áéíóúÁÉÍÓÚñÑüÜ]/g,
      (match) => altASCIIMap[match] || match
    );
  }

  /**
   * Método profesional: usar palabras claras sin caracteres especiales
   */
  protected normalizeTextForProfessionalPrinting(text: string): string {
    if (!text) return '';

    // Reemplazos profesionales que evitan caracteres problemáticos
    const professionalMap: { [key: string]: string } = {
      Año: 'ANIO', // Año → ANIO (mayúsculas, profesional)
      año: 'anio', // año → anio
      Años: 'ANIOS', // Años → ANIOS
      años: 'anios', // años → anios
      Niño: 'NINO', // Niño → NINO
      niño: 'nino', // niño → nino
      Niña: 'NINA', // Niña → NINA
      niña: 'nina', // niña → nina
      Señor: 'SENOR', // Señor → SENOR
      señor: 'senor', // señor → senor
      Señora: 'SENORA', // Señora → SENORA
      señora: 'senora', // señora → senora
    };

    let result = text;

    // Aplicar reemplazos específicos de palabras primero
    for (const [word, replacement] of Object.entries(professionalMap)) {
      result = result.replace(new RegExp(word, 'g'), replacement);
    }

    // Luego remover acentos de caracteres restantes
    const accentMap: { [key: string]: string } = {
      ñ: 'n',
      Ñ: 'N',
      á: 'a',
      é: 'e',
      í: 'i',
      ó: 'o',
      ú: 'u',
      Á: 'A',
      É: 'E',
      Í: 'I',
      Ó: 'O',
      Ú: 'U',
      ü: 'u',
      Ü: 'U',
    };

    result = result.replace(
      /[áéíóúÁÉÍÓÚñÑüÜ]/g,
      (match) => accentMap[match] || match
    );

    return result;
  }

  /**
   * Métodos específicos para alineación con caracteres térmicos
   * Múltiples versiones para probar diferentes enfoques
   */

  // Versión 1: Códigos hexadecimales directos (por defecto)
  protected alignLeftThermal(text: string, width: number): string {
    const normalized = this.normalizeTextForThermalPrinterAdvanced(text);
    return this.alignLeft(normalized, width);
  }

  protected alignRightThermal(text: string, width: number): string {
    const normalized = this.normalizeTextForThermalPrinterAdvanced(text);
    return this.alignRight(normalized, width);
  }

  protected centerTextThermal(
    text: string,
    width: number = this.CONFIG.PAPER_WIDTH
  ): string {
    const normalized = this.normalizeTextForThermalPrinterAdvanced(text);
    return this.centerText(normalized, width);
  }

  // Versión 2: UTF-8 a CP850
  protected alignLeftThermalUTF8(text: string, width: number): string {
    const normalized = this.normalizeTextForThermalPrinterUTF8(text);
    return this.alignLeft(normalized, width);
  }

  protected alignRightThermalUTF8(text: string, width: number): string {
    const normalized = this.normalizeTextForThermalPrinterUTF8(text);
    return this.alignRight(normalized, width);
  }

  // Versión 3: ASCII extendido (recomendado para tu impresora)
  protected alignLeftThermalASCII(text: string, width: number): string {
    const normalized = this.normalizeTextForThermalPrinterAdvanced(text);
    return this.alignLeft(normalized, width);
  }

  protected alignRightThermalASCII(text: string, width: number): string {
    const normalized = this.normalizeTextForThermalPrinterAdvanced(text);
    return this.alignRight(normalized, width);
  }

  // Versión 4: ASCII estricto (si ASCII extendido no funciona)
  protected alignLeftThermalStrict(text: string, width: number): string {
    const normalized = this.normalizeTextForStrictASCII(text);
    return this.alignLeft(normalized, width);
  }

  protected alignRightThermalStrict(text: string, width: number): string {
    const normalized = this.normalizeTextForStrictASCII(text);
    return this.alignRight(normalized, width);
  }

  // Versión 5: Comandos ESC/POS específicos (experimental)
  protected alignLeftThermalESC(text: string, width: number): string {
    const normalized = this.normalizeTextWithESCCommands(text);
    return this.alignLeft(normalized, width);
  }

  protected alignRightThermalESC(text: string, width: number): string {
    const normalized = this.normalizeTextWithESCCommands(text);
    return this.alignRight(normalized, width);
  }

  // Versión 6: Codificación directa de bytes
  protected alignLeftThermalBytes(text: string, width: number): string {
    const normalized = this.normalizeTextWithDirectBytes(text);
    return this.alignLeft(normalized, width);
  }

  protected alignRightThermalBytes(text: string, width: number): string {
    const normalized = this.normalizeTextWithDirectBytes(text);
    return this.alignRight(normalized, width);
  }

  // Versión 7: Profesional (recomendado para impresoras ASCII estrictas)
  protected alignLeftThermalProfessional(text: string, width: number): string {
    const normalized = this.normalizeTextForProfessionalPrinting(text);
    return this.alignLeft(normalized, width);
  }

  protected alignRightThermalProfessional(text: string, width: number): string {
    const normalized = this.normalizeTextForProfessionalPrinting(text);
    return this.alignRight(normalized, width);
  }

  // Versión 6: Sin caracteres especiales (fallback seguro)
  protected alignLeftThermalSafe(text: string, width: number): string {
    // Reemplazar "Año" específicamente por algo que no se malinterprete
    const safeText = text.replace(/Año/g, 'Year').replace(/año/g, 'year');
    const normalized = this.removeAccentsForThermalPrinter(safeText);
    return this.alignLeft(normalized, width);
  }

  protected alignRightThermalSafe(text: string, width: number): string {
    const safeText = text.replace(/Año/g, 'Year').replace(/año/g, 'year');
    const normalized = this.removeAccentsForThermalPrinter(safeText);
    return this.alignRight(normalized, width);
  }

  /**
   * Métodos alternativos que usan remoción de acentos
   * Para impresoras que no soportan CP850
   */
  protected alignLeftThermalSimple(text: string, width: number): string {
    const normalized = this.removeAccentsForThermalPrinter(text);
    return this.alignLeft(normalized, width);
  }

  protected alignRightThermalSimple(text: string, width: number): string {
    const normalized = this.removeAccentsForThermalPrinter(text);
    return this.alignRight(normalized, width);
  }

  protected centerTextThermalSimple(
    text: string,
    width: number = this.CONFIG.PAPER_WIDTH
  ): string {
    const normalized = this.removeAccentsForThermalPrinter(text);
    return this.centerText(normalized, width);
  }

  /* ---------------- HEADER / FOOTER / INFO ---------------- */

  /**
   * Crea el encabezado profesional estándar centrado.
   * Implementa el mismo formato que printing.service.ts pero con interlineado optimizado.
   */
  protected createHeader(title: string, subtitle?: string): string {
    let header = '';

    // Configurar impresora para caracteres especiales al inicio
    header += this.getThermalPrinterSetup();

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

    // Usar método específico para impresoras térmicas en nombres
    info += `Nombre: ${this.fixThermalPrinterChars(nombre)}\n`;
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
