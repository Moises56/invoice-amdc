import { Injectable } from '@angular/core';
import { ThermalPrinterBaseService } from './thermal-printer-base.service';
import {
  ConsultaICSResponseReal,
  EmpresaICS,
  DetalleMoraReal,
  SearchICSParams,
} from '../interfaces/consulta-ics.interface';

@Injectable({
  providedIn: 'root',
})
export class ConsultaICSPrinterService extends ThermalPrinterBaseService {
  // Configuración específica para Consulta ICS - Optimizada para legibilidad
  private readonly ICS_CONFIG = {
    // Configuración COMPACTA para evitar que el Total se vaya abajo
    TABLE_COLUMNS: [4, 6, 6, 6, 6, 6, 7],
    // Encabezados ultra-cortos para que todo quepa en una línea
    TABLE_HEADERS: ['Per.', 'Impto', 'Aseo', 'Bomb', 'Otros', 'Rec', 'Total'],
    TABLE_WIDTH: 41, // Reducido para que el Total no se desborde
    // Método térmico: usando 'default' ya que ahora usamos "Per." (sin caracteres especiales)
    THERMAL_METHOD: 'default' as 'default' | 'utf8' | 'safe' | 'ascii' | 'strict' | 'professional' | 'esc_commands' | 'direct_bytes',
  };

  /**
   * Formatea Consulta ICS Individual (una empresa específica)
   */
  formatConsultaICSIndividual(
    data: ConsultaICSResponseReal,
    empresaIndex: number,
    params?: SearchICSParams
  ): string {
    let ticket = '';

    // Encabezado
    ticket += this.createHeader('ESTADO DE CUENTA', 'VOLUMEN DE VENTA ANUAL');

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
    if (
      data.descuentoProntoPagoNumerico &&
      data.descuentoProntoPagoNumerico > 0
    ) {
      ticket += this.createDiscountInfo(
        data.descuentoProntoPagoNumerico,
        data.totalAPagarNumerico
      );
    }

    // Información de amnistía si aplica
    if (data.amnistiaVigente) {
      ticket += this.createAmnistiaNotice();
    }

    // Pie de página
    ticket +=
      this.centerText('Datos actualizados a la fecha de la consulta') + '\n';

    return ticket;
  }

  /**
   * Formatea Consulta ICS Grupal (todas las empresas)
   */
  formatConsultaICSGrupal(
    data: ConsultaICSResponseReal,
    params?: SearchICSParams
  ): string {
    let ticket = '';

    // Encabezado
    ticket += this.createHeader('ESTADO DE CUENTA', 'VOLUMEN DE VENTA ANUAL');

    // Información personal
    ticket += this.createPersonalInfo(
      data.nombre || 'N/A',
      data.identidad || 'N/A',
      data.fecha || this.formatDate(new Date()),
      data.hora || this.formatTime(new Date())
    );

    // Procesar cada empresa
    data.empresas?.forEach((empresa, index) => {
      ticket += `\n${this.centerText(`EMPRESA ${index + 1}`)}\n`;
      ticket += `No: ${empresa.numeroEmpresa || 'N/A'}\n`;
      ticket += this.createLine('-') + '\n';

      // Tabla de detalles de la empresa
      ticket += this.createICSTable(empresa);

      // Subtotal de la empresa
      ticket += this.createICSSubtotal(empresa);
    });

    // Total general
    ticket += this.createICSGrandTotal(data.totalGeneralNumerico || 0);

    // Información de descuentos si aplica
    if (
      data.descuentoProntoPagoNumerico &&
      data.descuentoProntoPagoNumerico > 0
    ) {
      ticket += this.createDiscountInfo(
        data.descuentoProntoPagoNumerico,
        data.totalAPagarNumerico
      );
    }

    // Información de amnistía si aplica
    if (data.amnistiaVigente) {
      ticket += this.createAmnistiaNotice();
    }

    // Pie de página
    ticket +=
      this.centerText('Datos actualizados a la fecha de la consulta') + '\n';

    return ticket;
  }

  /**
   * Formatea Consulta ICS Individual con Amnistía
   */
  formatConsultaICSConAmnistia(
    data: ConsultaICSResponseReal,
    empresaIndex: number,
    params?: SearchICSParams
  ): string {
    let ticket = this.formatConsultaICSIndividual(data, empresaIndex, params);

    // Agregar información específica de amnistía
    if (data.amnistiaVigente) {
      const amnistiaInfo = this.createAmnistiaDetails(data);
      // Insertar antes del pie de página
      const footerIndex = ticket.lastIndexOf('Datos actualizados');
      if (footerIndex > -1) {
        ticket =
          ticket.substring(0, footerIndex) +
          amnistiaInfo +
          ticket.substring(footerIndex);
      } else {
        ticket += amnistiaInfo;
      }
    }

    return ticket;
  }

  /**
   * Formatea Consulta ICS Grupal con Amnistía
   */
  formatConsultaICSGrupalConAmnistia(
    data: ConsultaICSResponseReal,
    params?: SearchICSParams
  ): string {
    let ticket = this.formatConsultaICSGrupal(data, params);

    // Agregar información específica de amnistía
    if (data.amnistiaVigente) {
      const amnistiaInfo = this.createAmnistiaDetails(data);
      // Insertar antes del pie de página
      const footerIndex = ticket.lastIndexOf('Datos actualizados');
      if (footerIndex > -1) {
        ticket =
          ticket.substring(0, footerIndex) +
          amnistiaInfo +
          ticket.substring(footerIndex);
      } else {
        ticket += amnistiaInfo;
      }
    }

    return ticket;
  }

  /**
   * Crea la tabla de ICS para una empresa
   * Aplicando fuente condensada a toda la tabla como en la imagen
   */
  private createICSTable(empresa: EmpresaICS): string {
    let table = '';

    // Activar fuente condensada para toda la tabla (como en la imagen)
    table += this.escCondensedFont();

    // Encabezado con fuente condensada
    table += this.createICSHeader();
    table += this.createTableSeparator(this.ICS_CONFIG.TABLE_COLUMNS) + '\n';

    // Filas de datos con fuente condensada
    empresa.detallesMora?.forEach((detalle) => {
      table += this.createICSRow(detalle) + '\n';
    });

    table += this.createTableSeparator(this.ICS_CONFIG.TABLE_COLUMNS) + '\n';

    // Restaurar fuente normal después de la tabla
    table += this.escNormalWidth();

    return table;
  }

  /**
   * Crea el encabezado de la tabla ICS COMPACTO
   * Optimizado para impresoras térmicas con múltiples enfoques
   */
  private createICSHeader(): string {
    let header = '';

    // Seleccionar método según configuración
    const alignLeftMethod = this.getAlignLeftMethod();
    const alignRightMethod = this.getAlignRightMethod();

    header += alignLeftMethod(
      this.ICS_CONFIG.TABLE_HEADERS[0],
      this.ICS_CONFIG.TABLE_COLUMNS[0]
    ); // Año
    header += ' '; // Espacio separador
    header += alignRightMethod(
      this.ICS_CONFIG.TABLE_HEADERS[1],
      this.ICS_CONFIG.TABLE_COLUMNS[1]
    ); // Impto
    header += ' '; // Espacio separador
    header += alignRightMethod(
      this.ICS_CONFIG.TABLE_HEADERS[2],
      this.ICS_CONFIG.TABLE_COLUMNS[2]
    ); // Aseo
    header += ' '; // Espacio separador
    header += alignRightMethod(
      this.ICS_CONFIG.TABLE_HEADERS[3],
      this.ICS_CONFIG.TABLE_COLUMNS[3]
    ); // Bomb
    header += ' '; // Espacio separador
    header += alignRightMethod(
      this.ICS_CONFIG.TABLE_HEADERS[4],
      this.ICS_CONFIG.TABLE_COLUMNS[4]
    ); // Otros
    header += ' '; // Espacio separador
    header += alignRightMethod(
      this.ICS_CONFIG.TABLE_HEADERS[5],
      this.ICS_CONFIG.TABLE_COLUMNS[5]
    ); // Rec
    header += ' '; // Espacio separador
    header += alignRightMethod(
      this.ICS_CONFIG.TABLE_HEADERS[6],
      this.ICS_CONFIG.TABLE_COLUMNS[6]
    ); // Total

    return header + '\n';
  }

  /**
   * Crea una fila de la tabla ICS con formato compacto
   * Optimizada para caber exactamente en 40 caracteres
   */
  private createICSRow(detalle: DetalleMoraReal): string {
    // Asegurar que el año se muestre completo (4 dígitos)
    let year = detalle.year || detalle.anio?.toString() || '????';
    // Si el año viene truncado, intentar completarlo
    if (year.length === 2 && !isNaN(Number(year))) {
      const yearNum = Number(year);
      year = yearNum > 50 ? `19${year}` : `20${year}`;
    }
    // Truncar a 4 caracteres máximo
    year = year.substring(0, 4);

    // Usar formato compacto para que quepa en las columnas
    const impuesto = this.formatCompactCurrency(detalle.impuestoNumerico || 0);
    const aseo = this.formatCompactCurrency(detalle.trenDeAseoNumerico || 0);
    const bomberos = this.formatCompactCurrency(
      detalle.tasaBomberosNumerico || 0
    );
    const otros = this.formatCompactCurrency(detalle.otrosNumerico || 0);
    const recargo = this.formatCompactCurrency(detalle.recargoNumerico || 0);
    const total = this.formatCompactCurrency(detalle.totalNumerico || 0);

    // Crear fila con espaciado optimizado para legibilidad
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
   * Formatea moneda ULTRA COMPACTA para columnas de 6-7 caracteres
   * Específicamente para evitar que el Total se desborde en consulta ICS
   */
  private formatCompactCurrency(value: number): string {
    if (value === 0) return '0.00';

    // Para valores muy grandes, usar formato sin comas y sin decimales si es entero
    if (value >= 100000) {
      return value % 1 === 0 ? Math.round(value).toString() : value.toFixed(2);
    }
    // Para valores grandes, formato sin comas
    else if (value >= 10000) {
      return value.toFixed(2);
    }
    // Para valores medianos, con comas solo si cabe en 6 caracteres
    else if (value >= 1000) {
      const withCommas = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
      }).format(value);

      // Si cabe en 6 caracteres, usar comas, sino sin comas
      return withCommas.length <= 6 ? withCommas : value.toFixed(2);
    }
    // Para valores pequeños, formato normal
    else {
      return value.toFixed(2);
    }
  }

  /**
   * Crea el total de una empresa
   */
  private createICSSubtotal(empresa: EmpresaICS): string {
    let subtotal = '';

    subtotal += this.createLine('-') + '\n';
    subtotal +=
      this.alignRight(
        `Total: ${this.formatCurrencyForPrint(
          empresa.totalPropiedadNumerico || 0
        )}`,
        this.CONFIG.PAPER_WIDTH
      ) + '\n';
    subtotal += this.createLine('-') + '\n';

    return subtotal;
  }

  /**
   * Crea el total general de todas las empresas
   */
  private createICSGrandTotal(total: number): string {
    let grandTotal = '';

    grandTotal += this.createLine('=') + '\n';
    grandTotal +=
      this.alignRight(
        `TOTAL GENERAL: ${this.formatCurrencyForPrint(total)}`,
        this.CONFIG.PAPER_WIDTH
      ) + '\n';
    grandTotal += this.createLine('=') + '\n';

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
      discountInfo +=
        this.alignRight(
          `Descuento: ${this.formatCurrencyForPrint(descuento)}`,
          this.CONFIG.PAPER_WIDTH
        ) + '\n';

      if (totalFinal) {
        discountInfo +=
          this.alignRight(
            `Total a Pagar: ${this.formatCurrencyForPrint(totalFinal)}`,
            this.CONFIG.PAPER_WIDTH
          ) + '\n';
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
    notice += this.centerText('Vence el 31 de agosto de 2025') + '\n';

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

    // details += this.createSpacing(1);
    details += this.centerText('AMDC') + '\n';
    details += this.createLine('*') + '\n';

    // Aquí se pueden agregar más detalles específicos de la amnistía
    // según los campos disponibles en la interfaz

    // details += this.centerText('Datos actualizados') + '\n';
    // details += this.centerText('a la fecha de la consulta') + '\n';
    // details += this.createLine('*') + '\n';

    return details;
  }

  /**
   * Métodos auxiliares para seleccionar el enfoque térmico
   */
  private getAlignLeftMethod(): (text: string, width: number) => string {
    switch (this.ICS_CONFIG.THERMAL_METHOD) {
      case 'esc_commands':
        return (text, width) => this.alignLeftThermalESC(text, width);
      case 'direct_bytes':
        return (text, width) => this.alignLeftThermalBytes(text, width);
      case 'professional':
        return (text, width) => this.alignLeftThermalProfessional(text, width);
      case 'ascii':
        return (text, width) => this.alignLeftThermalASCII(text, width);
      case 'strict':
        return (text, width) => this.alignLeftThermalStrict(text, width);
      case 'utf8':
        return (text, width) => this.alignLeftThermalUTF8(text, width);
      case 'safe':
        return (text, width) => this.alignLeftThermalSafe(text, width);
      default:
        return (text, width) => this.alignLeftThermal(text, width);
    }
  }

  private getAlignRightMethod(): (text: string, width: number) => string {
    switch (this.ICS_CONFIG.THERMAL_METHOD) {
      case 'esc_commands':
        return (text, width) => this.alignRightThermalESC(text, width);
      case 'direct_bytes':
        return (text, width) => this.alignRightThermalBytes(text, width);
      case 'professional':
        return (text, width) => this.alignRightThermalProfessional(text, width);
      case 'ascii':
        return (text, width) => this.alignRightThermalASCII(text, width);
      case 'strict':
        return (text, width) => this.alignRightThermalStrict(text, width);
      case 'utf8':
        return (text, width) => this.alignRightThermalUTF8(text, width);
      case 'safe':
        return (text, width) => this.alignRightThermalSafe(text, width);
      default:
        return (text, width) => this.alignRightThermal(text, width);
    }
  }

  /**
   * Método para cambiar el enfoque térmico dinámicamente
   * Útil para pruebas
   */
  public setThermalMethod(method: 'default' | 'utf8' | 'safe'): void {
    (this.ICS_CONFIG as any).THERMAL_METHOD = method;
  }
}
