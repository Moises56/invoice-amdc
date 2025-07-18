import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { 
  ReporteRequest, 
  ReporteResponse 
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
   * Generar reporte completo con autenticación
   */
  async generarReporte(request: ReporteRequest): Promise<ReporteResponse> {
    const loading = await this.loadingCtrl.create({
      message: 'Generando reporte...',
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

      console.log('Enviando request limpio:', cleanRequest);
      
      const headers = await this.getAuthHeaders();
      const response = await this.http.post<ReporteResponse>(
        `${this.baseUrl}/reportes/generar`, 
        cleanRequest, 
        { headers }
      ).toPromise();

      this.reportesSubject.next(response!);
      await this.showSuccess(`Reporte ${request.tipo} generado exitosamente`);
      
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
   * Obtener configuración completa con autenticación
   */
  async obtenerConfiguracion(): Promise<{ success: boolean; configuracion: ConfiguracionReportes }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await this.http.get<{ success: boolean; configuracion: ConfiguracionReportes }>(
        `${this.baseUrl}/reportes/configuracion`, 
        { headers }
      ).toPromise();
      return response!;
    } catch (error) {
      await this.showError('Error obteniendo configuración', error);
      throw error;
    }
  }

  /**
   * Test con autenticación
   */
  async testAutenticado(): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      return await this.http.get(`${this.baseUrl}/reportes/test`, { headers }).toPromise();
    } catch (error) {
      await this.showError('Error en test autenticado', error);
      throw error;
    }
  }

  // 🎯 MÉTODOS DE UTILIDAD

  /**
   * Obtener headers con autenticación
   */
  private async getAuthHeaders(): Promise<HttpHeaders> {
    // Usar el token del AuthService existente
    const token = localStorage.getItem('authToken'); // O usar el método del AuthService
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

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
}
