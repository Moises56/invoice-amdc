import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButtons, 
  IonBackButton,
  IonButton,
  IonIcon,
  IonSpinner,
  IonSelect,
  IonSelectOption,
  ToastController,
  LoadingController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  analytics,
  analyticsOutline,
  refreshOutline,
  filterOutline,
  libraryOutline,
  barChartOutline,
  timeOutline,
  trendingUp,
  calendar,
  business,
  storefront,
  playOutline,
  documentTextOutline,
  gridOutline,
  eyeOutline,
  trophyOutline,
  statsChartOutline,
  pieChartOutline,
  locationOutline,
  peopleOutline,
  cashOutline,
  trendingUpOutline,
  downloadOutline,
  shareOutline,
  flashOutline, 
  calendarOutline 
} from 'ionicons/icons';

// Importar los nuevos servicios e interfaces
import { ReportesService } from '../../services/reportes/reportes.service';
import { ReportesConfigService } from '../../services/reportes/reportes-config.service';
import { 
  ReporteRequest, 
  ReporteResponse 
} from '../../interfaces/reportes/reporte.interface';
import { ConfiguracionReportes } from '../../interfaces/reportes/mercado.interface';
import { EstadisticasGenerales, DemoResponse } from '../../interfaces/reportes/estadisticas.interface';

interface Market {
  id: string;
  name: string;
}

interface ReportHistoryItem {
  id: string;
  title: string;
  type: string;
  date: string;
  size: string;
  format: string;
}

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.page.html',
  styleUrls: ['./reportes.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonSpinner,
    IonSelect,
    IonSelectOption
  ]
})
export class ReportesPage implements OnInit {
  // Inyección de servicios
  private reportesService = inject(ReportesService);
  private configService = inject(ReportesConfigService);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private alertController = inject(AlertController);
  private router = inject(Router);

  // Señales para el estado de la aplicación
  isLoading = signal(false);
  isConnected = signal(false);
  error = signal<string | null>(null);

  // Configuración de reportes desde el backend
  configuracion = signal<ConfiguracionReportes | null>(null);
  
  // Datos de reportes reales
  reportesData = signal<ReporteResponse[]>([]);
  reporteActual = signal<ReporteResponse | null>(null);

  // Estado de la UI (manteniendo compatibilidad con el template existente)
  private _selectedPeriod = signal('HOY');
  private _selectedType = signal('TODOS');
  private _selectedMarket = signal('all');
  private _availableMarkets = signal<Market[]>([]);
  private _recentReports = signal<ReportHistoryItem[]>([]);

  // Estadísticas generales
  estadisticasGenerales = signal<EstadisticasGenerales | null>(null);

  // Propiedades computadas para compatibilidad
  totalReports = computed(() => this.reportesData().length || 4);
  lastGenerated = computed(() => {
    const reports = this.reportesData();
    if (reports.length > 0) {
      const latest = reports[0];
      const now = new Date();
      const reportDate = new Date(latest.timestamp);
      const diffHours = Math.floor((now.getTime() - reportDate.getTime()) / (1000 * 60 * 60));
      return diffHours > 0 ? `${diffHours} horas` : 'Recién generado';
    }
    return '2 horas';
  });

  // Getters y setters para two-way binding (compatibilidad con template)
  get selectedPeriod() { return this._selectedPeriod(); }
  set selectedPeriod(value: string) { this._selectedPeriod.set(value); }

  get selectedType() { return this._selectedType(); }
  set selectedType(value: string) { this._selectedType.set(value); }

  get selectedMarket() { return this._selectedMarket(); }
  set selectedMarket(value: string) { this._selectedMarket.set(value); }

  availableMarkets = computed(() => this._availableMarkets());
  recentReports = computed(() => this._recentReports());

  constructor() {
    this.addAllIcons();
  }

  async ngOnInit() {
    await this.inicializarDatos();
  }

  // Inicialización de datos con servicios reales
  private async inicializarDatos() {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      // Paso 1: Verificar conectividad
      const conectividad = await this.reportesService.testConectividad();
      this.isConnected.set(conectividad.success);

      if (!conectividad.success) {
        this.error.set('No se pudo conectar con el servidor de reportes');
        await this.mostrarToast(conectividad.message, 'warning');
        return;
      }

      // Paso 2: Obtener configuración pública
      const config = await this.reportesService.obtenerConfiguracionPublica();
      
      if (config.success && config.demo_data) {
        this.configuracion.set(config.demo_data.configuracion_ui);

        // Paso 3: Cargar mercados disponibles desde la configuración
        if (config.demo_data.mercados_sample) {
          const markets: Market[] = config.demo_data.mercados_sample.map(m => ({
            id: m.id,
            name: m.nombre_mercado
          }));
          this._availableMarkets.set(markets);
        }
      }

      // Paso 4: Cargar estadísticas demo
      await this.cargarEstadisticasPublicas();

    } catch (error) {
      console.error('Error al inicializar datos:', error);
      this.error.set('Error al cargar la configuración inicial');
      await this.mostrarToast('Error al cargar la configuración inicial', 'danger');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Cargar estadísticas públicas
  private async cargarEstadisticasPublicas() {
    try {
      const stats = await this.reportesService.obtenerEstadisticasPublicas();
      if (stats.success && stats.estadisticas) {
        // Crear una estadística general basada en los datos públicos
        const estadisticasGenerales: EstadisticasGenerales = {
          total_mercados: stats.estadisticas.total_mercados || 0,
          total_locales: stats.estadisticas.total_locales || 0,
          total_facturas: stats.estadisticas.total_facturas || 0,
          total_recaudado: stats.estadisticas.total_recaudado || 0,
          promedio_factura: stats.estadisticas.promedio_factura || 0
        };
        
        this.estadisticasGenerales.set(estadisticasGenerales);
        
        // Crear reportes mock para el historial
        const reportesMock: ReportHistoryItem[] = [
          {
            id: '1',
            title: 'Reporte Financiero - Demo',
            type: 'FINANCIERO',
            date: new Date().toLocaleDateString(),
            size: '2.3 MB',
            format: 'PDF'
          },
          {
            id: '2', 
            title: 'Reporte Operacional - Demo',
            type: 'OPERACIONAL',
            date: new Date().toLocaleDateString(),
            size: '1.8 MB',
            format: 'PDF'
          }
        ];
        
        this._recentReports.set(reportesMock);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas públicas:', error);
      // Cargar datos mock si hay error
      this.cargarDatosMock();
    }
  }

  // Cargar datos mock como fallback
  private cargarDatosMock() {
    const estadisticasMock: EstadisticasGenerales = {
      total_mercados: 4,
      total_locales: 150,
      total_facturas: 1250,
      total_recaudado: 125000,
      promedio_factura: 100
    };
    
    this.estadisticasGenerales.set(estadisticasMock);
    
    const reportesMock: ReportHistoryItem[] = [
      {
        id: '1',
        title: 'Reporte Financiero - Mock',
        type: 'FINANCIERO',
        date: new Date().toLocaleDateString(),
        size: '2.3 MB',
        format: 'PDF'
      },
      {
        id: '2', 
        title: 'Reporte Operacional - Mock',
        type: 'OPERACIONAL',
        date: new Date().toLocaleDateString(),
        size: '1.8 MB',
        format: 'PDF'
      }
    ];
    
    this._recentReports.set(reportesMock);
  }

  // Método auxiliar para calcular tamaño del reporte
  private calcularTamanoReporte(reporte: ReporteResponse): string {
    const baseSize = 1.5; // MB base
    const factorType = 1.2; // Factor base
    const calculatedSize = (baseSize * factorType).toFixed(1);
    return `${calculatedSize} MB`;
  }

  // Método para mostrar toast messages
  private async mostrarToast(message: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  // Método para refrescar datos
  async refresh() {
    await this.inicializarDatos();
    await this.mostrarToast('Datos actualizados correctamente', 'success');
  }

  // Generar reporte usando el servicio real
  async generateReport() {
    if (!this.selectedPeriod || !this.selectedType) {
      await this.mostrarToast('Por favor selecciona período y tipo de reporte', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Generando reporte...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Crear request para el reporte
      const request: ReporteRequest = {
        tipo: this.selectedType as 'FINANCIERO' | 'OPERACIONAL' | 'MERCADO' | 'LOCAL',
        periodo: 'MENSUAL',
        formato: 'PDF',
        fechaInicio: this.calcularFechaInicio(this.selectedPeriod),
        fechaFin: new Date().toISOString(),
        mercados: this.selectedMarket !== 'all' ? [this.selectedMarket] : undefined
      };

      // Generar reporte con el servicio
      const resultado = await this.reportesService.generarReporte(request);
      
      await loading.dismiss();

      if (resultado.success && resultado.data) {
        this.reporteActual.set(resultado);
        await this.mostrarToast('Reporte generado exitosamente', 'success');
        
        // Agregar al historial
        const newReport: ReportHistoryItem = {
          id: Date.now().toString(),
          title: `${this.getReportTypeLabel(this.selectedType)} - ${this.getPeriodLabel(this.selectedPeriod)}`,
          type: this.selectedType,
          date: 'Ahora',
          size: '2.1 MB',
          format: 'PDF'
        };
        
        this._recentReports.update(reports => [newReport, ...reports]);
      } else {
        await this.mostrarToast(resultado.error || 'Error al generar reporte', 'danger');
      }
      
    } catch (error) {
      await loading.dismiss();
      console.error('Error al generar reporte:', error);
      await this.mostrarToast('Error al generar reporte', 'danger');
    }
  }

  // Calcular fecha de inicio basada en el período seleccionado
  private calcularFechaInicio(periodo: string): string {
    const now = new Date();
    let fechaInicio = new Date();

    switch (periodo) {
      case 'HOY':
        fechaInicio.setHours(0, 0, 0, 0);
        break;
      case 'AYER':
        fechaInicio.setDate(now.getDate() - 1);
        fechaInicio.setHours(0, 0, 0, 0);
        break;
      case 'ESTA_SEMANA':
        const dayOfWeek = now.getDay();
        fechaInicio.setDate(now.getDate() - dayOfWeek);
        fechaInicio.setHours(0, 0, 0, 0);
        break;
      case 'ESTE_MES':
        fechaInicio.setDate(1);
        fechaInicio.setHours(0, 0, 0, 0);
        break;
      case 'ULTIMO_MES':
        fechaInicio.setMonth(now.getMonth() - 1);
        fechaInicio.setDate(1);
        fechaInicio.setHours(0, 0, 0, 0);
        break;
      case 'ESTE_ANNO':
        fechaInicio.setMonth(0, 1);
        fechaInicio.setHours(0, 0, 0, 0);
        break;
      default:
        fechaInicio.setDate(now.getDate() - 7);
    }

    return fechaInicio.toISOString();
  }

  // Exportar reporte en diferentes formatos
  async exportReport(reportType: string, format: string) {
    const loading = await this.loadingController.create({
      message: `Exportando a ${format.toUpperCase()}...`,
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Simular exportación por ahora
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await loading.dismiss();
      await this.mostrarToast(`Reporte exportado a ${format.toUpperCase()} exitosamente`, 'success');
      
    } catch (error) {
      await loading.dismiss();
      console.error('Error al exportar reporte:', error);
      await this.mostrarToast('Error al exportar reporte', 'danger');
    }
  }

  // Ver reporte en modal (se implementará más adelante)
  async viewReport(reportType: string) {
    await this.mostrarToast(`Abriendo vista del reporte: ${this.getReportTypeLabel(reportType)}`, 'success');
    // TODO: Abrir modal con ReporteModalComponent
  }

  // Descargar reporte del historial
  async downloadReport(report: ReportHistoryItem) {
    const loading = await this.loadingController.create({
      message: 'Descargando reporte...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Simular descarga
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.mostrarToast(`Descarga iniciada: ${report.title}`, 'success');
      
    } catch (error) {
      console.error('Error al descargar reporte:', error);
      await this.mostrarToast('Error al descargar reporte', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  // Compartir reporte
  async shareReport(report: ReportHistoryItem) {
    const alert = await this.alertController.create({
      header: 'Compartir Reporte',
      message: `¿Cómo deseas compartir "${report.title}"?`,
      buttons: [
        {
          text: 'Email',
          handler: () => {
            this.mostrarToast('Compartiendo por email...', 'success');
          }
        },
        {
          text: 'WhatsApp',
          handler: () => {
            this.mostrarToast('Compartiendo por WhatsApp...', 'success');
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  // Métodos auxiliares para el template
  getReportIcon(type: string): string {
    const icons = {
      'FINANCIERO': 'trending-up-outline',
      'OPERACIONAL': 'bar-chart-outline',
      'MERCADO': 'business-outline',
      'LOCAL': 'storefront-outline',
      'revenue': 'trending-up-outline',
      'yearly': 'calendar-outline',
      'market': 'business-outline',
      'local': 'storefront-outline'
    };
    return icons[type as keyof typeof icons] || 'document-text-outline';
  }

  getReportColor(type: string): string {
    const colors = {
      'FINANCIERO': 'success',
      'OPERACIONAL': 'primary',
      'MERCADO': 'tertiary', 
      'LOCAL': 'warning',
      'revenue': 'success',
      'yearly': 'warning',
      'market': 'tertiary',
      'local': 'medium'
    };
    return colors[type as keyof typeof colors] || 'primary';
  }

  private getReportTypeLabel(type: string): string {
    const labels = {
      'FINANCIERO': 'Reporte Financiero',
      'OPERACIONAL': 'Reporte Operacional',
      'MERCADO': 'Reporte por Mercado',
      'LOCAL': 'Reporte por Local',
      'TODOS': 'Todos los Reportes',
      'revenue': 'Recaudación',
      'invoices': 'Facturas',
      'markets': 'Por Mercado',
      'locals': 'Por Local',
      'comparative': 'Comparativo'
    };
    return labels[type as keyof typeof labels] || type;
  }

  private getPeriodLabel(period: string): string {
    const labels = {
      'HOY': 'Hoy',
      'AYER': 'Ayer', 
      'ESTA_SEMANA': 'Esta Semana',
      'ESTE_MES': 'Este Mes',
      'ULTIMO_MES': 'Último Mes',
      'ESTE_ANNO': 'Este Año',
      'monthly': 'Mensual',
      'quarterly': 'Trimestral',
      'yearly': 'Anual',
      'custom': 'Personalizado'
    };
    return labels[period as keyof typeof labels] || period;
  }

  private addAllIcons() {
    addIcons({
      analytics,
      analyticsOutline,
      refreshOutline,
      filterOutline,
      libraryOutline,
      barChartOutline,
      timeOutline,
      trendingUp,
      calendar,
      business,
      storefront,
      playOutline,
      documentTextOutline,
      gridOutline,
      eyeOutline,
      trophyOutline,
      statsChartOutline,
      pieChartOutline,
      locationOutline,
      peopleOutline,
      cashOutline,
      trendingUpOutline,
      downloadOutline,
      shareOutline,
      flashOutline
    });
  }
}
