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
        fileBuffer = await this.generatePdf(reporteResponse.data);
      } else {
        fileBuffer = await this.generateXlsx(reporteResponse.data);
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

  private async generatePdf(data: ReporteData): Promise<ArrayBuffer> {
    const doc = new jsPDF();
    doc.text('Reporte Financiero', 14, 16);

    const head = [['Mercado', 'Total Recaudado', 'Total Facturas', 'Facturas Pagadas']];
    const body = (data.por_mercado || []).map((m: MercadoStats) => [
      m.nombre_mercado,
      `L ${m.total_recaudado.toFixed(2)}`,
      m.total_facturas,
      m.facturas_pagadas,
    ]);

    autoTable(doc, {
      head,
      body,
      startY: 20,
    });

    return doc.output('arraybuffer');
  }

  private async generateXlsx(data: ReporteData): Promise<ArrayBuffer> {
    const worksheet = xlsx.utils.json_to_sheet(data.por_mercado || []);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Reporte');

    const buffer = xlsx.write(workbook, { type: 'array', bookType: 'xlsx' });
    return buffer;
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
