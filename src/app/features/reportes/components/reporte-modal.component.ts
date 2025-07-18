import { Component, OnInit, Input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonItem,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonProgressBar,
  IonChip,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonFab,
  IonFabButton,
  IonActionSheet,
  ModalController,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  downloadOutline,
  shareOutline,
  printOutline,
  refreshOutline,
  analyticsOutline,
  barChartOutline,
  pieChartOutline,
  trendingUpOutline,
  trendingDownOutline,
  businessOutline,
  storefrontOutline,
  cashOutline,
  documentTextOutline,
  timeOutline,
  locationOutline,
  peopleOutline,
  statsChartOutline,
  calendarOutline,
  checkmarkCircleOutline,
  warningOutline,
  informationCircleOutline, ellipsisHorizontalOutline, speedometerOutline, stopwatchOutline } from 'ionicons/icons';
import { ReporteResponse, MercadoStats, LocalStats } from '../../../interfaces/reportes/reporte.interface';

@Component({
  selector: 'app-reporte-modal',
  templateUrl: './reporte-modal.component.html',
  styleUrls: ['./reporte-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonItem,
    IonBadge,
    IonGrid,
    IonRow,
    IonCol,
    IonProgressBar,
    IonChip,
    IonList,
    IonRefresher,
    IonRefresherContent,
    IonFab,
    IonFabButton,
    IonActionSheet
  ]
})
export class ReporteModalComponent implements OnInit {
  @Input() reporte: ReporteResponse | null = null;
  @Input() isOpen = false;

  private modalController = inject(ModalController);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  // Estado del modal
  currentTab = signal('resumen');
  isLoading = signal(false);
  showActionSheet = signal(false);

  // Datos computados del reporte
  tipoReporte = computed(() => this.reporte?.metadata?.tipo || 'DESCONOCIDO');
  fechaGeneracion = computed(() => {
    if (!this.reporte?.timestamp) return 'No disponible';
    return new Date(this.reporte.timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  });

  // Estadísticas principales
  estadisticasPrincipales = computed(() => {
    if (!this.reporte?.data) return null;

    const data = this.reporte.data;
    
    switch (this.tipoReporte()) {
      case 'FINANCIERO':
        return {
          totalRecaudado: data.resumen?.total_recaudado || 0,
          totalFacturas: data.resumen?.total_facturas || 0,
          promedioFactura: data.resumen?.promedio_factura || 0,
          mercadosActivos: data.por_mercado?.length || 0
        };
      case 'OPERACIONAL':
        return {
          totalFacturas: data.estadisticas?.total_facturas || 0,
          mercadosActivos: data.estadisticas?.mercados_activos || 0,
          localesActivos: data.estadisticas?.locales_activos || 0,
          eficiencia: data.rendimiento?.eficiencia || 'BAJA'
        };
      case 'MERCADO':
        return {
          totalMercados: data.mercados?.length || 0,
          totalRecaudado: data.mercados?.reduce((sum, m) => sum + m.total_recaudado, 0) || 0,
          totalFacturas: data.mercados?.reduce((sum, m) => sum + m.total_facturas, 0) || 0,
          totalLocales: data.mercados?.reduce((sum, m) => sum + m.total_locales, 0) || 0
        };
      case 'LOCAL':
        return {
          totalLocales: data.locales?.length || 0,
          totalRecaudado: data.locales?.reduce((sum, l) => sum + l.total_recaudado, 0) || 0,
          totalFacturas: data.locales?.reduce((sum, l) => sum + l.total_facturas, 0) || 0,
          promedioLocal: data.locales?.length ? 
            (data.locales.reduce((sum, l) => sum + l.total_recaudado, 0) / data.locales.length) : 0
        };
      default:
        return null;
    }
  });

  // Datos para gráficos y tablas
  mercadosData = computed(() => this.reporte?.data?.mercados || this.reporte?.data?.por_mercado || []);
  localesData = computed(() => this.reporte?.data?.locales || []);

  // Botones para el action sheet
  actionSheetButtons = [
    {
      text: 'Exportar PDF',
      icon: 'document-text-outline',
      handler: () => this.exportarReporte('PDF')
    },
    {
      text: 'Exportar Excel',
      icon: 'grid-outline',
      handler: () => this.exportarReporte('EXCEL')
    },
    {
      text: 'Exportar CSV',
      icon: 'download-outline',
      handler: () => this.exportarReporte('CSV')
    },
    {
      text: 'Compartir',
      icon: 'share-outline',
      handler: () => this.compartirReporte()
    },
    {
      text: 'Imprimir',
      icon: 'print-outline',
      handler: () => this.imprimirReporte()
    },
    {
      text: 'Cancelar',
      role: 'cancel',
      icon: 'close-outline'
    }
  ];
  
  constructor() {
    this.addAllIcons();
  }

  ngOnInit() {
    // Inicialización adicional si es necesaria
  }

  // Cerrar modal
  async cerrarModal() {
    await this.modalController.dismiss();
  }

  // Cambiar tab activo
  cambiarTab(tab: string) {
    this.currentTab.set(tab);
  }

  // Refrescar datos del reporte
  async refrescarReporte() {
    this.isLoading.set(true);
    
    try {
      // Simular recarga de datos
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.mostrarToast('Reporte actualizado', 'success');
    } catch (error) {
      await this.mostrarToast('Error al actualizar reporte', 'danger');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Mostrar opciones de acción
  mostrarOpciones() {
    this.showActionSheet.set(true);
  }

  // Exportar reporte
  async exportarReporte(formato: 'PDF' | 'EXCEL' | 'CSV') {
    const loading = await this.loadingController.create({
      message: `Exportando a ${formato}...`,
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Simular exportación
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.mostrarToast(`Reporte exportado a ${formato}`, 'success');
    } catch (error) {
      await this.mostrarToast('Error al exportar', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  // Compartir reporte
  async compartirReporte() {
    await this.mostrarToast('Compartiendo reporte...', 'success');
    // TODO: Implementar compartir nativo
  }

  // Imprimir reporte
  async imprimirReporte() {
    await this.mostrarToast('Preparando para imprimir...', 'success');
    // TODO: Implementar impresión
    if (window.print) {
      window.print();
    }
  }

  // Obtener icono según tipo de reporte
  getIconoTipo(): string {
    switch (this.tipoReporte()) {
      case 'FINANCIERO': return 'trending-up-outline';
      case 'OPERACIONAL': return 'bar-chart-outline';
      case 'MERCADO': return 'business-outline';
      case 'LOCAL': return 'storefront-outline';
      default: return 'document-text-outline';
    }
  }

  // Obtener color según tipo de reporte
  getColorTipo(): string {
    switch (this.tipoReporte()) {
      case 'FINANCIERO': return 'success';
      case 'OPERACIONAL': return 'primary';
      case 'MERCADO': return 'tertiary';
      case 'LOCAL': return 'warning';
      default: return 'medium';
    }
  }

  // Obtener etiqueta del tipo de reporte
  getReportTypeLabel(tipo: string): string {
    const labels = {
      'FINANCIERO': 'Reporte Financiero',
      'OPERACIONAL': 'Reporte Operacional',
      'MERCADO': 'Reporte por Mercado',
      'LOCAL': 'Reporte por Local',
      'DESCONOCIDO': 'Tipo Desconocido'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  }

  // Formatear moneda
  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(valor);
  }

  // Formatear número
  formatearNumero(valor: number): string {
    return new Intl.NumberFormat('es-ES').format(valor);
  }

  // Calcular porcentaje de progreso
  calcularPorcentaje(valor: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((valor / total) * 100);
  }

  // Obtener color de badge según estado
  getColorEstado(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'alta': case 'activo': case 'completado': return 'success';
      case 'media': case 'pendiente': return 'warning';
      case 'baja': case 'inactivo': case 'cancelado': return 'danger';
      default: return 'medium';
    }
  }

  // Mostrar toast
  private async mostrarToast(message: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  // Añadir iconos
  private addAllIcons() {
    addIcons({
      closeOutline,
      downloadOutline,
      shareOutline,
      printOutline,
      refreshOutline,
      analyticsOutline,
      barChartOutline,
      pieChartOutline,
      trendingUpOutline,
      trendingDownOutline,
      businessOutline,
      storefrontOutline,
      cashOutline,
      documentTextOutline,
      timeOutline,
      locationOutline,
      peopleOutline,
      statsChartOutline,
      calendarOutline,
      checkmarkCircleOutline,
      warningOutline,
      informationCircleOutline
    });
  }
}
