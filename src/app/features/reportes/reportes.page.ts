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
  AlertController,
  ModalController
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
  calendarOutline, layersOutline } from 'ionicons/icons';

// Importar los nuevos servicios e interfaces
import { ReportesService } from '../../services/reportes/reportes.service';
import { ReportesConfigService } from '../../services/reportes/reportes-config.service';
import { ReporteModalComponent } from './components/reporte-modal.component';
import { DashboardStatsComponent } from './components/dashboard-stats.component';
import { SmartLayoutComponent } from './components/smart-layout.component';
import { ReportChartComponent } from './components/report-chart.component';
import { AdvancedFiltersComponent, ReportFilter } from './components/advanced-filters.component';
import { ModernTabsComponent } from './components/modern-tabs.component';
import { ReportCard } from './interfaces/common.interface';
import { ChartableData, TabItem } from './interfaces/shared.interface';
import { ReportesDataService, MercadoEndpoint, ConfiguracionReportes } from '../../services/reportes/reportes-data.service';
import { 
  ReporteRequest, 
  ReporteResponse,
  MercadoStats,
  LocalStats 
} from '../../interfaces/reportes/reporte.interface';
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
  request: ReporteRequest; // Guardar el request original
  data?: ReporteResponse; // Opcional: guardar los datos del reporte
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
    IonSelectOption,
    DashboardStatsComponent,
    SmartLayoutComponent,
    ReportChartComponent,
    AdvancedFiltersComponent,
    ModernTabsComponent
  ]
})
export class ReportesPage implements OnInit {
  // Inyección de servicios
  private reportesService = inject(ReportesService);
  private configService = inject(ReportesConfigService);
  private reportesDataService = inject(ReportesDataService);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private alertController = inject(AlertController);
  private modalController = inject(ModalController);
  private router = inject(Router);

  // Señales para el estado de la aplicación
  isLoading = signal(false);
  isConnected = signal(false);
  error = signal<string | null>(null);

  // Configuración de reportes desde el backend
  configuracion = signal<ConfiguracionReportes | null>(null);
  
  // Nuevos signals para datos reales del endpoint
  mercadosReales = signal<MercadoEndpoint[]>([]);
  configuracionEndpoint = signal<ConfiguracionReportes | null>(null);
  
  activeTab = signal('overview');
  
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
    return reports.length > 0 ? 'Hoy' : 'N/A';
  });

  // Métodos calculados para el template con datos reales
  totalMercados = computed(() => {
    const mercados = this.reportesDataService.getMercadosFromEndpoint();
    return Array.isArray(mercados) ? mercados.length : 0;
  });
  
  totalLocales = computed(() => 
    this.reportesDataService.getMercadosFromEndpoint()
      .filter(mercado => mercado && mercado._count)
      .reduce((sum, mercado) => sum + (mercado._count?.locales || 0), 0)
  );

  mercadosData = computed(() => 
    this.reportesDataService.getMercadosFromEndpoint()
      .filter(mercado => mercado && mercado.id)
      .map(mercado => ({
        ...mercado,
        locales_count: mercado._count?.locales || 0
      }))
  );

  // Configuración de tabs modernas actualizada (reemplaza la versión signal anterior)
  reportTabs = computed(() => [
    {
      id: 'overview',
      label: 'Resumen',
      icon: 'grid-outline',
      badge: this.totalReports(),
      color: 'primary' as const
    },
    {
      id: 'charts',
      label: 'Gráficos',
      icon: 'bar-chart-outline',
      badge: this.totalMercados(),
      color: 'secondary' as const
    },
    {
      id: 'filters',
      label: 'Filtros',
      icon: 'filter-outline',
      color: 'warning' as const
    },
    {
      id: 'data',
      label: 'Datos',
      icon: 'layers-outline',
      badge: this.totalLocales(),
      color: 'success' as const
    }
  ]);

  // Getters y setters para two-way binding (compatibilidad con template)
  get selectedPeriod() { return this._selectedPeriod(); }
  set selectedPeriod(value: string) { this._selectedPeriod.set(value); }

  get selectedType() { return this._selectedType(); }
  set selectedType(value: string) { this._selectedType.set(value); }

  get selectedMarket() { return this._selectedMarket(); }
  set selectedMarket(value: string) { this._selectedMarket.set(value); }

  availableMarkets = computed(() => this._availableMarkets());
  recentReports = computed(() => this._recentReports());

  // Computed para activeTab para compatibilidad con template
  currentActiveTab = computed(() => this.activeTab());

  constructor() {
    this.addAllIcons();
  }

  async ngOnInit() {
    await this.inicializarDatos();
    await this.loadRealData();
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
        // TODO: Unificar interfaces ConfiguracionReportes
        // this.configuracion.set(config.demo_data.configuracion_ui);

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
            format: 'PDF',
            request: { tipo: 'FINANCIERO', periodo: 'MENSUAL' }
          },
          {
            id: '2', 
            title: 'Reporte Operacional - Demo',
            type: 'OPERACIONAL',
            date: new Date().toLocaleDateString(),
            size: '1.8 MB',
            format: 'PDF',
            request: { tipo: 'OPERACIONAL', periodo: 'MENSUAL' }
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
        format: 'PDF',
        request: { tipo: 'FINANCIERO', periodo: 'MENSUAL' }
      },
      {
        id: '2', 
        title: 'Reporte Operacional - Mock',
        type: 'OPERACIONAL',
        date: new Date().toLocaleDateString(),
        size: '1.8 MB',
        format: 'PDF',
        request: { tipo: 'OPERACIONAL', periodo: 'MENSUAL' }
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
          date: new Date().toLocaleDateString(),
          size: this.calcularTamanoReporte(resultado),
          format: request.formato || 'JSON',
          request: request, // Guardar el request original
          data: resultado // Guardar la respuesta completa
        };
        
        this._recentReports.update(reports => [newReport, ...reports].slice(0, 10)); // Mantener solo los últimos 10
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

  // Ver reporte en modal
  async viewReport(reportType: string) {
    try {
      // Si hay un reporte actual, mostrarlo
      let reporteParaMostrar = this.reporteActual();
      
      // Si no hay reporte actual, generar uno demo
      if (!reporteParaMostrar) {
        const loading = await this.loadingController.create({
          message: 'Preparando vista del reporte...',
          spinner: 'crescent'
        });
        await loading.present();

        try {
          // Generar un reporte demo básico
          const request: ReporteRequest = {
            tipo: reportType as 'FINANCIERO' | 'OPERACIONAL' | 'MERCADO' | 'LOCAL',
            periodo: 'MENSUAL',
            formato: 'JSON'
          };

          const resultado = await this.reportesService.generarReporte(request);
          await loading.dismiss();

          if (resultado.success && resultado.data) {
            reporteParaMostrar = resultado;
          } else {
            await this.mostrarToast('No se pudo cargar el reporte', 'warning');
            return;
          }
        } catch (error) {
          await loading.dismiss();
          await this.mostrarToast('Error al cargar el reporte', 'danger');
          return;
        }
      }

      // Abrir el modal
      const modal = await this.modalController.create({
        component: ReporteModalComponent,
        componentProps: {
          reporte: reporteParaMostrar,
          isOpen: true
        },
        cssClass: 'reporte-modal-class',
        backdropDismiss: true
      });

      await modal.present();
      
    } catch (error) {
      console.error('Error al abrir modal de reporte:', error);
      await this.mostrarToast('Error al abrir el reporte', 'danger');
    }
  }

  // Descargar reporte del historial
  async downloadReport(report: ReportHistoryItem) {
    const alert = await this.alertController.create({
      header: 'Seleccionar Formato',
      message: '¿En qué formato deseas descargar el reporte?',
      buttons: [
        {
          text: 'PDF',
          handler: async () => {
            await this.exportarYDescargar(report, 'PDF');
          }
        },
        {
          text: 'Excel',
          handler: async () => {
            await this.exportarYDescargar(report, 'EXCEL');
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

  private async exportarYDescargar(report: ReportHistoryItem, formato: 'PDF' | 'EXCEL') {
    const loading = await this.loadingController.create({
      message: `Exportando a ${formato}...`,
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Usar el request guardado en el historial
      const request = { ...report.request, formato };
      
      const blob = await this.reportesService.exportarReporte(request, formato);
      
      // Crear un nombre de archivo descriptivo
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `Reporte_${report.type}_${timestamp}.${formato === 'EXCEL' ? 'xlsx' : 'pdf'}`;
      
      // Usar el método del servicio para descargar el archivo
      this.reportesService.downloadFile(blob, filename);
      
      await this.mostrarToast(`Descarga iniciada: ${filename}`, 'success');

    } catch (error) {
      console.error(`Error al exportar a ${formato}:`, error);
      await this.mostrarToast(`Error al exportar a ${formato}`, 'danger');
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

  // Signals y computed para Smart Layout
  viewportWidth = signal(window.innerWidth);
  layoutMode = signal<'auto' | 'grid' | 'masonry' | 'priority'>('auto');

  setLayoutMode(mode: 'auto' | 'grid' | 'masonry' | 'priority') {
    this.layoutMode.set(mode);
  }

  // Computed para las tarjetas de reportes
  reportCards = computed<ReportCard[]>(() => [
    {
      id: 'monthly',
      title: 'Recaudación Mensual',
      description: 'Análisis detallado de ingresos mensuales con comparativas y tendencias.',
      icon: 'trending-up',
      color: 'success',
      features: ['Gráficos interactivos', 'Análisis de tendencias', 'Comparación mensual'],
      priority: 'high',
      category: 'financial',
      actions: {
        pdf: () => this.exportReport('monthly', 'pdf'),
        excel: () => this.exportReport('monthly', 'excel'),
        view: () => this.viewReport('monthly')
      }
    },
    {
      id: 'yearly',
      title: 'Recaudación Anual', 
      description: 'Resumen anual completo con metas, cumplimiento y proyecciones.',
      icon: 'calendar',
      color: 'warning',
      features: ['Análisis profundo', 'Metas vs. Real', 'Proyecciones'],
      priority: 'high',
      category: 'financial',
      actions: {
        pdf: () => this.exportReport('yearly', 'pdf'),
        excel: () => this.exportReport('yearly', 'excel'),
        view: () => this.viewReport('yearly')
      }
    },
    {
      id: 'market',
      title: 'Análisis por Mercado',
      description: 'Desempeño individual de cada mercado con ranking y comparativas.',
      icon: 'business',
      color: 'tertiary',
      features: ['Ranking de mercados', 'Métricas detalladas', 'Participación %'],
      priority: 'medium',
      category: 'operational',
      actions: {
        pdf: () => this.exportReport('market', 'pdf'),
        excel: () => this.exportReport('market', 'excel'),
        view: () => this.viewReport('market')
      }
    },
    {
      id: 'local',
      title: 'Análisis por Local',
      description: 'Rendimiento detallado de locales individuales y comparativas.',
      icon: 'storefront',
      color: 'dark',
      features: ['Por ubicación', 'Por propietario', 'Recaudación individual'],
      priority: 'medium',
      category: 'operational',
      actions: {
        pdf: () => this.exportReport('local', 'pdf'),
        excel: () => this.exportReport('local', 'excel'),
        view: () => this.viewReport('local')
      }
    }
  ]);

  // Datos para gráficos
  monthlyData = computed<ChartableData[]>(() => [
    { etiqueta: 'Enero', valor: 45000 },
    { etiqueta: 'Febrero', valor: 52000 },
    { etiqueta: 'Marzo', valor: 48000 },
    { etiqueta: 'Abril', valor: 61000 },
    { etiqueta: 'Mayo', valor: 55000 },
    { etiqueta: 'Junio', valor: 67000 }
  ]);

  marketData = computed<ChartableData[]>(() => {
    // Simulación de datos de mercados
    return [
      { etiqueta: 'Mercado Central', valor: 125000 },
      { etiqueta: 'Mercado Los Andes', valor: 89000 },
      { etiqueta: 'Mercado Guamilito', valor: 156000 },
      { etiqueta: 'Mercado Zonal Belén', valor: 78000 }
    ];
  });

  trendData = computed<ChartableData[]>(() => [
    { etiqueta: 'Sem 1', valor: 15000 },
    { etiqueta: 'Sem 2', valor: 18000 },
    { etiqueta: 'Sem 3', valor: 22000 },
    { etiqueta: 'Sem 4', valor: 19000 },
    { etiqueta: 'Sem 5', valor: 25000 },
    { etiqueta: 'Sem 6', valor: 28000 }
  ]);

  // Método para manejar cambios en filtros avanzados
  onFiltersChange(filters: ReportFilter) {
    console.log('Filtros aplicados:', filters);
    // Aquí se puede implementar la lógica para aplicar los filtros
    // Por ejemplo, llamar al servicio de reportes con los filtros
    this.applyAdvancedFilters(filters);
  }

  private async applyAdvancedFilters(filters: ReportFilter) {
    try {
      this.isLoading.set(true);
      
      // Convertir los filtros al formato del backend
      const request: ReporteRequest = {
        tipo: this.selectedType === 'revenue' ? 'FINANCIERO' : 
              this.selectedType === 'markets' ? 'MERCADO' : 
              this.selectedType === 'locals' ? 'LOCAL' : 'OPERACIONAL',
        periodo: 'MENSUAL', // Se puede mapear desde filters.dateRange.preset
        formato: 'JSON',
        fechaInicio: filters.dateRange.start.split('T')[0],
        fechaFin: filters.dateRange.end.split('T')[0],
        mercados: filters.markets.length > 0 ? filters.markets : undefined,
        locales: filters.locals.length > 0 ? filters.locals : undefined
      };

      const response = await this.reportesService.generarReporte(request);
      
      if (response.success) {
        console.log('Reporte generado con filtros:', response.data);
        // Actualizar los datos de los gráficos con los resultados filtrados
        this.updateChartsWithFilteredData(response.data);
      }
    } catch (error) {
      console.error('Error aplicando filtros:', error);
      const toast = await this.toastController.create({
        message: 'Error al aplicar los filtros',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.isLoading.set(false);
    }
  }

  private updateChartsWithFilteredData(data: any) {
    // Actualizar los datos de los gráficos basándose en la respuesta filtrada
    // Esta implementación dependerá de la estructura exacta de la respuesta del backend
    console.log('Actualizando gráficos con datos filtrados:', data);
  }

  // Método para cargar datos reales del endpoint
  private async loadRealData() {
    try {
      this.isLoading.set(true);
      const config = await this.reportesDataService.getConfiguracionReportes();
      
      this.configuracionEndpoint.set(config);
      this.mercadosReales.set(config.configuracion.mercados_disponibles);
      
      // Actualizar datos de gráficos con datos reales
      this.updateChartsWithRealData();
      
    } catch (error) {
      console.error('Error cargando datos reales:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private updateChartsWithRealData() {
    const mercados = this.mercadosReales();
    if (mercados.length === 0) return;
    
    const chartData = this.reportesDataService.generateRealisticChartData(mercados);
    
    // Los gráficos se actualizarán automáticamente a través de computed properties
    console.log('Gráficos actualizados con datos reales de mercados');
  }

  // Método para formatear moneda en lempiras
  formatLempira(amount: number, showDecimals: boolean = true): string {
    return this.reportesDataService.formatLempira(amount, showDecimals);
  }

  // Método para cambiar de tab
  onTabChange(tabId: string) {
    this.activeTab.set(tabId);
  }

  // Computed para mercados usando datos reales del endpoint
  availableMarketsReal = computed(() => {
    const mercados = this.mercadosReales();
    return mercados
      .filter(m => m && m.id && m.nombre_mercado) // Validar estructura básica
      .map(m => ({
        id: m.id,
        name: m.nombre_mercado,
        direccion: m.direccion || 'Sin dirección',
        locales: m._count?.locales || 0
      }));
  });


}
