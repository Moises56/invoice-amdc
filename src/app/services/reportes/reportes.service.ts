import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as xlsx from 'xlsx';
import { 
  ReporteRequest, 
  ReporteResponse,
  ReporteData,
  MercadoStats
} from '../../interfaces/reportes/reporte.interface';
import { ConfiguracionReportes } from '../../interfaces/reportes/mercado.interface';
import { EstadisticasGenerales, DemoResponse } from '../../interfaces/reportes/estadisticas.interface';
import { AuthService } from '../../core/services/auth.service';
import { LoadingController, ToastController } from '@ionic/angular';
import { API_CONFIG } from '../../core/constants';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  private baseUrl = API_CONFIG.BASE_URL; // Usar la configuración existente
  private reportesSubject = new BehaviorSubject<ReporteResponse | null>(null);
  public reportes$ = this.reportesSubject.asObservable();

  // 🔓 MÉTODOS PÚBLICOS (SIN AUTENTICACIÓN)
  
  /**
   * Test de conectividad público
   */
  async testConectividad(): Promise<any> {
    try {
      return await this.http.get(`${this.baseUrl}/reportes-demo/test`).toPromise();
    } catch (error) {
      await this.showError('Error de conectividad', error);
      throw error;
    }
  }

  /**
   * Obtener configuración pública para UI
   */
  async obtenerConfiguracionPublica(): Promise<DemoResponse> {
    try {
      const response = await this.http.get<DemoResponse>(`${this.baseUrl}/reportes-demo/configuracion`).toPromise();
      return response!;
    } catch (error) {
      await this.showError('Error obteniendo configuración', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas generales públicas
   */
  async obtenerEstadisticasPublicas(): Promise<any> {
    try {
      return await this.http.get(`${this.baseUrl}/reportes-demo/stats`).toPromise();
    } catch (error) {
      await this.showError('Error obteniendo estadísticas', error);
      throw error;
    }
  }

  // 🔒 MÉTODOS CON AUTENTICACIÓN

  /**
   * Generar reporte completo con autenticación usando el endpoint real
   */
  async generarReporte(request: ReporteRequest): Promise<ReporteResponse> {
    const loading = await this.loadingCtrl.create({
      message: `Generando reporte ${request.tipo}...`,
      spinner: 'dots'
    });
    
    try {
      await loading.present();
      
      // Limpiar el request eliminando propiedades undefined/null
      const cleanRequest: any = {
        tipo: request.tipo,
        periodo: request.periodo
      };

      // Solo agregar propiedades opcionales si tienen valor
      if (request.formato) {
        cleanRequest.formato = request.formato;
      }
      if (request.fechaInicio) {
        cleanRequest.fechaInicio = request.fechaInicio;
      }
      if (request.fechaFin) {
        cleanRequest.fechaFin = request.fechaFin;
      }
      if (request.mercados && request.mercados.length > 0) {
        cleanRequest.mercados = request.mercados;
      }
      if (request.locales && request.locales.length > 0) {
        cleanRequest.locales = request.locales;
      }

      console.log('Enviando request al endpoint real:', cleanRequest);
      
      // Usar el endpoint real documentado (sin duplicar /api)
      const response = await this.http.post<ReporteResponse>(
        `${this.baseUrl}/reportes/generar`, 
        cleanRequest,
        { 
          withCredentials: true,  // Para incluir cookies JWT
          headers: {
            'Content-Type': 'application/json'
          }
        }
      ).toPromise();

      this.reportesSubject.next(response!);
      await this.showSuccess(`Reporte ${request.tipo} generado exitosamente en ${response!.metadata.tiempo_procesamiento}`);
      
      return response!;
    } catch (error) {
      console.error('Error completo:', error);
      await this.showError('Error generando reporte', error);
      throw error;
    } finally {
      await loading.dismiss();
    }
  }

  /**
   * Métodos específicos para cada tipo de reporte
   */
  async generarReporteFinanciero(filtros: Partial<ReporteRequest>): Promise<ReporteResponse> {
    return this.generarReporte({
      tipo: 'FINANCIERO',
      periodo: 'MENSUAL',
      ...filtros
    });
  }

  async generarReporteOperacional(filtros: Partial<ReporteRequest>): Promise<ReporteResponse> {
    return this.generarReporte({
      tipo: 'OPERACIONAL',
      periodo: 'MENSUAL',
      ...filtros
    });
  }

  async generarReporteMercado(filtros: Partial<ReporteRequest>): Promise<ReporteResponse> {
    return this.generarReporte({
      tipo: 'MERCADO',
      periodo: 'MENSUAL',
      ...filtros
    });
  }

  async generarReporteLocal(filtros: Partial<ReporteRequest>): Promise<ReporteResponse> {
    return this.generarReporte({
      tipo: 'LOCAL',
      periodo: 'MENSUAL',
      ...filtros
    });
  }

  /**
   * Exportar reporte en formato específico
   */
  async exportarReporte(request: ReporteRequest, formato: 'PDF' | 'EXCEL'): Promise<Blob> {
    const loading = await this.loadingCtrl.create({
      message: `Exportando reporte a ${formato}...`,
      spinner: 'dots'
    });
  
    try {
      await loading.present();
  
      // Primero, obtenemos los datos en formato JSON
      const jsonRequest = { ...request, formato: 'JSON' as const };
      const reporteResponse = await this.generarReporte(jsonRequest);
  
      if (!reporteResponse.success || !reporteResponse.data) {
        throw new Error('No se pudieron obtener los datos para generar el archivo.');
      }
  
      let fileBuffer: ArrayBuffer;
  
      if (formato === 'PDF') {
        fileBuffer = await this.generatePdf(reporteResponse.data, request.tipo);
      } else {
        fileBuffer = await this.generateXlsx(reporteResponse.data, request.tipo);
      }
  
      await this.showSuccess(`Reporte exportado a ${formato} exitosamente`);
      return new Blob([fileBuffer], { 
        type: formato === 'PDF' 
          ? 'application/pdf' 
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
  
    } catch (error) {
      await this.showError(`Error exportando a ${formato}`, error);
      throw error;
    } finally {
      await loading.dismiss();
    }
  }

  private async generatePdf(data: ReporteData, tipo: string): Promise<ArrayBuffer> {
    switch (tipo) {
      case 'FINANCIERO':
        return this.generateFinancialPdf(data);
      case 'OPERACIONAL':
        return this.generateOperationalPdf(data);
      case 'MERCADO':
        return this.generateMarketPdf(data);
      case 'LOCAL':
        return this.generateLocalPdf(data);
      default:
        throw new Error(`Tipo de reporte no soportado para PDF: ${tipo}`);
    }
  }

  private async generateXlsx(data: ReporteData, tipo: string): Promise<ArrayBuffer> {
    switch (tipo) {
      case 'FINANCIERO':
        return this.generateFinancialXlsx(data);
      case 'OPERACIONAL':
        return this.generateOperationalXlsx(data);
      case 'MERCADO':
        return this.generateMarketXlsx(data);
      case 'LOCAL':
        return this.generateLocalXlsx(data);
      default:
        throw new Error(`Tipo de reporte no soportado para Excel: ${tipo}`);
    }
  }

  // --- Generadores de PDF ---

  private async generateFinancialPdf(data: ReporteData): Promise<ArrayBuffer> {
    const doc = new jsPDF();
    doc.text('Reporte Financiero', 14, 16);

    if (data.resumen) {
      autoTable(doc, {
        startY: 20,
        head: [['Resumen', 'Valor']],
        body: [
          ['Total Recaudado', `L ${data.resumen.total_recaudado.toFixed(2)}`],
          ['Total Facturas', data.resumen.total_facturas],
          ['Promedio por Factura', `L ${data.resumen.promedio_factura.toFixed(2)}`],
        ],
      });
    }

    if (data.por_estado) {
      autoTable(doc, {
        head: [['Estado', 'Cantidad', 'Monto']],
        body: Object.entries(data.por_estado).map(([estado, valores]) => [
          estado,
          valores.cantidad,
          `L ${valores.monto.toFixed(2)}`,
        ]),
      });
    }

    autoTable(doc, {
      head: [['Mercado', 'Total Recaudado', 'Total Facturas', 'Facturas Pagadas']],
      body: (data.por_mercado || []).map((m: MercadoStats) => [
        m.nombre_mercado,
        `L ${m.total_recaudado.toFixed(2)}`,
        m.total_facturas,
        m.facturas_pagadas,
      ]),
    });

    return doc.output('arraybuffer');
  }

  private async generateOperationalPdf(data: ReporteData): Promise<ArrayBuffer> {
    const doc = new jsPDF();
    doc.text('Reporte Operacional', 14, 16);

    if (data.estadisticas) {
      autoTable(doc, {
        startY: 20,
        head: [['Estadísticas', 'Valor']],
        body: [
          ['Total Facturas', data.estadisticas.total_facturas],
          ['Mercados Activos', data.estadisticas.mercados_activos],
          ['Locales Activos', data.estadisticas.locales_activos],
        ],
      });
    }

    if (data.rendimiento) {
      autoTable(doc, {
        head: [['Rendimiento', 'Valor']],
        body: [
          ['Facturas Hoy', data.rendimiento.facturas_hoy],
          ['Eficiencia', data.rendimiento.eficiencia],
        ],
      });
    }

    return doc.output('arraybuffer');
  }

  private async generateMarketPdf(data: ReporteData): Promise<ArrayBuffer> {
    const doc = new jsPDF();
    doc.text('Reporte por Mercado', 14, 16);

    autoTable(doc, {
      startY: 20,
      head: [['Mercado', 'Total Recaudado', 'Total Facturas', 'Facturas Pagadas', 'Total Locales']],
      body: (data.mercados || []).map((m: any) => [
        m.nombre_mercado,
        `L ${m.total_recaudado.toFixed(2)}`,
        m.total_facturas,
        m.facturas_pagadas,
        m.total_locales,
      ]),
    });

    return doc.output('arraybuffer');
  }

  private async generateLocalPdf(data: ReporteData): Promise<ArrayBuffer> {
    const doc = new jsPDF();
    doc.text('Reporte por Local', 14, 16);

    autoTable(doc, {
      startY: 20,
      head: [['Local', 'Número', 'Mercado', 'Total Recaudado', 'Total Facturas', 'Facturas Pagadas']],
      body: (data.locales || []).map((l: any) => [
        l.nombre_local,
        l.numero_local,
        l.mercado,
        `L ${l.total_recaudado.toFixed(2)}`,
        l.total_facturas,
        l.facturas_pagadas,
      ]),
    });

    return doc.output('arraybuffer');
  }

  // --- Generadores de Excel ---

  private async generateFinancialXlsx(data: ReporteData): Promise<ArrayBuffer> {
    const wb = xlsx.utils.book_new();
    if (data.resumen) {
      const resumen = xlsx.utils.json_to_sheet([data.resumen]);
      xlsx.utils.book_append_sheet(wb, resumen, 'Resumen');
    }
    if (data.por_estado) {
      const porEstado = xlsx.utils.json_to_sheet(Object.entries(data.por_estado).map(([estado, valores]) => ({ Estado: estado, ...valores })));
      xlsx.utils.book_append_sheet(wb, porEstado, 'Por Estado');
    }
    if (data.por_mercado) {
      const porMercado = xlsx.utils.json_to_sheet(data.por_mercado);
      xlsx.utils.book_append_sheet(wb, porMercado, 'Por Mercado');
    }
    return xlsx.write(wb, { type: 'array', bookType: 'xlsx' });
  }

  private async generateOperationalXlsx(data: ReporteData): Promise<ArrayBuffer> {
    const wb = xlsx.utils.book_new();
    if (data.estadisticas) {
      const estadisticas = xlsx.utils.json_to_sheet([data.estadisticas]);
      xlsx.utils.book_append_sheet(wb, estadisticas, 'Estadísticas');
    }
    if (data.rendimiento) {
      const rendimiento = xlsx.utils.json_to_sheet([data.rendimiento]);
      xlsx.utils.book_append_sheet(wb, rendimiento, 'Rendimiento');
    }
    return xlsx.write(wb, { type: 'array', bookType: 'xlsx' });
  }

  private async generateMarketXlsx(data: ReporteData): Promise<ArrayBuffer> {
    const wb = xlsx.utils.book_new();
    if (data.mercados) {
      const mercados = xlsx.utils.json_to_sheet(data.mercados);
      xlsx.utils.book_append_sheet(wb, mercados, 'Mercados');
    }
    return xlsx.write(wb, { type: 'array', bookType: 'xlsx' });
  }

  private async generateLocalXlsx(data: ReporteData): Promise<ArrayBuffer> {
    const wb = xlsx.utils.book_new();
    if (data.locales) {
      const locales = xlsx.utils.json_to_sheet(data.locales);
      xlsx.utils.book_append_sheet(wb, locales, 'Locales');
    }
    return xlsx.write(wb, { type: 'array', bookType: 'xlsx' });
  }

  /**
   * Obtener configuración completa con autenticación usando endpoint real
   */
  async obtenerConfiguracion(): Promise<{ success: boolean; configuracion: ConfiguracionReportes }> {
    try {
      const response = await this.http.get<{ success: boolean; configuracion: ConfiguracionReportes }>(
        `${this.baseUrl}/reportes/configuracion`,
        { withCredentials: true }
      ).toPromise();
      return response!;
    } catch (error) {
      await this.showError('Error obteniendo configuración', error);
      throw error;
    }
  }

  /**
   * Test con autenticación usando endpoint real
   */
  async testAutenticado(): Promise<any> {
    try {
      return await this.http.get(
        `${this.baseUrl}/reportes/test`, 
        { withCredentials: true }
      ).toPromise();
    } catch (error) {
      await this.showError('Error en test autenticado', error);
      throw error;
    }
  }

  // 🎯 MÉTODOS DE UTILIDAD

  /**
   * Mostrar mensaje de éxito
   */
  private async showSuccess(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color: 'success',
      position: 'top',
      icon: 'checkmark-circle'
    });
    await toast.present();
  }

  /**
   * Mostrar mensaje de error
   */
  private async showError(message: string, error: any): Promise<void> {
    console.error(message, error);
    const toast = await this.toastCtrl.create({
      message: `${message}: ${error?.error?.message || error?.message || 'Error desconocido'}`,
      duration: 5000,
      color: 'danger',
      position: 'top',
      icon: 'alert-circle'
    });
    await toast.present();
  }

  /**
   * Limpiar datos de reportes
   */
  clearReportes(): void {
    this.reportesSubject.next(null);
  }

  /**
   * Formatear números para UI
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL'
    }).format(amount);
  }

  /**
   * Formatear fechas para UI
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Descargar archivo blob
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Si es PDF, abrir en nueva pestaña
    if (filename.toLowerCase().endsWith('.pdf')) {
      window.open(url, '_blank');
      // No revocar el objeto URL inmediatamente para que el PDF se muestre
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 2000);
    } else {
      window.URL.revokeObjectURL(url);
    }
  }
}
