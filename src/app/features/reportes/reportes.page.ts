import { Component, OnInit, signal, computed } from '@angular/core';
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
  flashOutline, calendarOutline } from 'ionicons/icons';

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
  // Señales para el estado de la página
  private _isLoading = signal(false);
  private _selectedPeriod = signal('');
  private _selectedType = signal('');
  private _selectedMarket = signal('all');
  private _availableMarkets = signal<Market[]>([]);
  private _recentReports = signal<ReportHistoryItem[]>([]);

  // Propiedades computadas
  isLoading = computed(() => this._isLoading());
  totalReports = computed(() => 4);
  lastGenerated = computed(() => '2 horas');

  // Getters y setters para two-way binding
  get selectedPeriod() { return this._selectedPeriod(); }
  set selectedPeriod(value: string) { this._selectedPeriod.set(value); }

  get selectedType() { return this._selectedType(); }
  set selectedType(value: string) { this._selectedType.set(value); }

  get selectedMarket() { return this._selectedMarket(); }
  set selectedMarket(value: string) { this._selectedMarket.set(value); }

  availableMarkets = computed(() => this._availableMarkets());
  recentReports = computed(() => this._recentReports());

  constructor(
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {
    this.addAllIcons();
  }

  ngOnInit() {
    this.loadInitialData();
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

  private async loadInitialData() {
    this._isLoading.set(true);
    
    try {
      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Cargar mercados disponibles
      this._availableMarkets.set([
        { id: '1', name: 'Mercado Central' },
        { id: '2', name: 'Mercado Norte' },
        { id: '3', name: 'Mercado Sur' },
        { id: '4', name: 'Mercado Este' }
      ]);

      // Cargar historial de reportes
      this._recentReports.set([
        {
          id: '1',
          title: 'Recaudación Mensual - Diciembre 2024',
          type: 'revenue',
          date: 'Hace 2 horas',
          size: '2.4 MB',
          format: 'PDF'
        },
        {
          id: '2',
          title: 'Análisis por Mercado - Q4 2024',
          type: 'market',
          date: 'Ayer',
          size: '3.1 MB',
          format: 'Excel'
        },
        {
          id: '3',
          title: 'Reporte Anual 2024',
          type: 'yearly',
          date: 'Hace 3 días',
          size: '5.8 MB',
          format: 'PDF'
        },
        {
          id: '4',
          title: 'Análisis por Local - Noviembre',
          type: 'local',
          date: 'Hace 1 semana',
          size: '1.9 MB',
          format: 'Excel'
        }
      ]);

    } catch (error) {
      console.error('Error loading initial data:', error);
      await this.showErrorToast('Error al cargar datos iniciales');
    } finally {
      this._isLoading.set(false);
    }
  }

  async refresh() {
    await this.loadInitialData();
    await this.showSuccessToast('Datos actualizados correctamente');
  }

  async generateReport() {
    if (!this.selectedPeriod || !this.selectedType) {
      await this.showErrorToast('Por favor selecciona período y tipo de reporte');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Generando reporte...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Simular generación de reporte
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await loading.dismiss();
      await this.showSuccessToast('Reporte generado exitosamente');
      
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
      
    } catch (error) {
      await loading.dismiss();
      await this.showErrorToast('Error al generar reporte');
    }
  }

  async exportReport(reportType: string, format: string) {
    const loading = await this.loadingController.create({
      message: `Exportando a ${format.toUpperCase()}...`,
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Simular exportación
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await loading.dismiss();
      await this.showSuccessToast(`Reporte exportado a ${format.toUpperCase()} exitosamente`);
      
    } catch (error) {
      await loading.dismiss();
      await this.showErrorToast('Error al exportar reporte');
    }
  }

  async viewReport(reportType: string) {
    await this.showInfoToast(`Abriendo vista del reporte: ${this.getReportTypeLabel(reportType)}`);
    // Aquí se implementaría la navegación a la vista del reporte
  }

  async downloadReport(report: ReportHistoryItem) {
    await this.showSuccessToast(`Descargando: ${report.title}`);
    // Implementar descarga
  }

  async shareReport(report: ReportHistoryItem) {
    const alert = await this.alertController.create({
      header: 'Compartir Reporte',
      message: `¿Cómo deseas compartir "${report.title}"?`,
      buttons: [
        {
          text: 'Email',
          handler: () => {
            this.showInfoToast('Compartiendo por email...');
          }
        },
        {
          text: 'WhatsApp',
          handler: () => {
            this.showInfoToast('Compartiendo por WhatsApp...');
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

  getReportIcon(type: string): string {
    const icons = {
      revenue: 'trending-up-outline',
      yearly: 'calendar-outline',
      market: 'business-outline',
      local: 'storefront-outline'
    };
    return icons[type as keyof typeof icons] || 'document-text-outline';
  }

  getReportColor(type: string): string {
    const colors = {
      revenue: 'success',
      yearly: 'warning',
      market: 'tertiary',
      local: 'medium'
    };
    return colors[type as keyof typeof colors] || 'primary';
  }

  private getReportTypeLabel(type: string): string {
    const labels = {
      revenue: 'Recaudación',
      invoices: 'Facturas',
      markets: 'Por Mercado',
      locals: 'Por Local',
      comparative: 'Comparativo'
    };
    return labels[type as keyof typeof labels] || type;
  }

  private getPeriodLabel(period: string): string {
    const labels = {
      monthly: 'Mensual',
      quarterly: 'Trimestral',
      yearly: 'Anual',
      custom: 'Personalizado'
    };
    return labels[period as keyof typeof labels] || period;
  }

  private async showSuccessToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'success',
      icon: 'checkmark-circle-outline'
    });
    await toast.present();
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 4000,
      position: 'top',
      color: 'danger',
      icon: 'alert-circle-outline'
    });
    await toast.present();
  }

  private async showInfoToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
      color: 'primary',
      icon: 'information-circle-outline'
    });
    await toast.present();
  }
}
