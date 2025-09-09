import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
  IonIcon,
  IonButton,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
  IonInput,
  IonAccordion,
  IonAccordionGroup,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  analyticsOutline,
  cashOutline,
  trendingUpOutline,
  calendarOutline,
  refreshOutline,
  arrowBackOutline,
  filterOutline,
  statsChartOutline,
  cardOutline,
  walletOutline,
  checkmarkCircleOutline,
  timeOutline,
  eyeOutline,
  chevronDownOutline,
  chevronUpOutline,
  closeOutline,
  documentTextOutline
} from 'ionicons/icons';

import { StatsService } from '../../../shared/services/stats.service';
import { 
  MatchStatsResponse,
  MatchFilters,
  MatchStatsFilter,
  ComputedMatchStats,
  FilterPreset
} from '../../../shared/interfaces/match-stats.interface';

@Component({
  selector: 'app-recaudacion-stats',
  templateUrl: './recaudacion-stats.page.html',
  styleUrls: ['./recaudacion-stats.page.scss'],
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
    IonIcon,
    IonButton,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonSelect,
    IonSelectOption,
    IonItem,
    IonLabel,
    IonInput,
    IonAccordion,
    IonAccordionGroup
  ]
})
export class RecaudacionStatsPage implements OnInit {
  private statsService = inject(StatsService);
  private router = inject(Router);
  private loadingController = inject(LoadingController);
  private toastController = inject(ToastController);

  // Signals para estado reactivo
  matchStats = signal<MatchStatsResponse | null>(null);
  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');
  lastUpdated = signal<string>('');

  // Signals para filtros
  currentFilter = signal<MatchStatsFilter>({});
  isFilterOpen = signal<boolean>(false);
  selectedPreset = signal<string>('current_year');

  // Señales para formulario de filtros
  tempConsultaType = signal<'EC' | 'ICS' | ''>('');
  tempConsultaStartDate = signal<string>('');
  tempConsultaEndDate = signal<string>('');
  tempStartDate = signal<string>('');
  tempEndDate = signal<string>('');
  tempYear = signal<number>(new Date().getFullYear());

  // Presets de filtros
  filterPresets: FilterPreset[] = [
    {
      key: 'current_year',
      label: 'Año Actual',
      description: 'Desde agosto hasta ahora, pagos del año actual',
      filters: {
        year: new Date().getFullYear()
      }
    },
    {
      key: 'last_month',
      label: 'Último Mes',
      description: 'Consultas y pagos del último mes',
      filters: {
        consultaStartDate: this.getDateString(-30),
        consultaEndDate: this.getDateString(0),
        startDate: this.getDateString(-30),
        endDate: this.getDateString(0)
      }
    },
    {
      key: 'last_3_months',
      label: 'Últimos 3 Meses',
      description: 'Consultas y pagos de los últimos 3 meses',
      filters: {
        consultaStartDate: this.getDateString(-90),
        consultaEndDate: this.getDateString(0),
        startDate: this.getDateString(-90),
        endDate: this.getDateString(0)
      }
    },
    {
      key: 'custom',
      label: 'Personalizado',
      description: 'Define tu propio rango de fechas',
      filters: {}
    }
  ];

  // Computed para estadísticas procesadas
  computedStats = computed<ComputedMatchStats | null>(() => {
    const stats = this.matchStats();
    if (!stats) return null;

    const tasaMatch = stats.totalConsultasAnalizadas > 0 
      ? (stats.totalMatches / stats.totalConsultasAnalizadas) * 100 
      : 0;

    const tasaPagoApp = stats.totalMatches > 0 
      ? (stats.totalPagosMedianteApp / stats.totalMatches) * 100 
      : 0;

    const tasaPagoPrevio = stats.totalMatches > 0 
      ? (stats.totalPagosPrevios / stats.totalMatches) * 100 
      : 0;

    const efectividadRecaudo = stats.sumaTotalEncontrado > 0 
      ? (stats.sumaTotalPagado / stats.sumaTotalEncontrado) * 100 
      : 0;

    const promedioMontoPagado = stats.totalMatches > 0 
      ? stats.sumaTotalPagado / stats.totalMatches 
      : 0;

    const promedioMontoEncontrado = stats.totalConsultasAnalizadas > 0 
      ? stats.sumaTotalEncontrado / stats.totalConsultasAnalizadas 
      : 0;

    return {
      ...stats,
      tasaMatch,
      tasaPagoApp,
      tasaPagoPrevio,
      efectividadRecaudo,
      promedioMontoPagado,
      promedioMontoEncontrado
    };
  });

  constructor() {
    addIcons({
      refreshOutline,
      analyticsOutline,
      cashOutline,
      trendingUpOutline,
      calendarOutline,
      arrowBackOutline,
      filterOutline,
      statsChartOutline,
      cardOutline,
      walletOutline,
      checkmarkCircleOutline,
      timeOutline,
      eyeOutline,
      chevronDownOutline,
      chevronUpOutline,
      closeOutline,
      documentTextOutline
    });
  }

  ngOnInit() {
    this.loadDefaultData();
  }

  /**
   * Cargar datos con el preset por defecto
   */
  async loadDefaultData() {
    const defaultPreset = this.filterPresets.find(p => p.key === this.selectedPreset());
    if (defaultPreset) {
      await this.loadMatchStats(defaultPreset.filters);
    }
  }

  /**
   * Cargar estadísticas de recaudación
   */
  async loadMatchStats(filters?: MatchFilters) {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.errorMessage.set('');
    
    try {
      console.log('🔄 Cargando estadísticas de recaudación...', filters);
      
      const [response] = await Promise.all([
        this.statsService.getMatchStats(filters).toPromise(),
        new Promise(resolve => setTimeout(resolve, 800)) // Mínimo 800ms para UX
      ]);

      console.log('📊 Respuesta del servidor (match stats):', response);
      
      if (response) {
        this.matchStats.set(response);
        this.lastUpdated.set(new Date().toISOString());
        console.log('✅ Estadísticas de recaudación cargadas exitosamente');
      } else {
        console.warn('⚠️ Respuesta sin datos válidos:', response);
        this.hasError.set(true);
        this.errorMessage.set('No se pudieron obtener las estadísticas de recaudación');
      }
    } catch (error: any) {
      console.error('❌ Error al cargar estadísticas de recaudación:', error);
      this.hasError.set(true);
      
      if (error.status === 403) {
        this.errorMessage.set('No tienes permisos para ver las estadísticas de recaudación');
      } else if (error.status === 404) {
        this.errorMessage.set('Endpoint de estadísticas de recaudación no encontrado');
      } else if (error.status === 0) {
        this.errorMessage.set('No se puede conectar con el servidor');
      } else {
        this.errorMessage.set(`Error del servidor: ${error.status || 'Desconocido'}`);
      }
    } finally {
      setTimeout(() => {
        this.isLoading.set(false);
      }, 200);
    }
  }

  /**
   * Refrescar estadísticas
   */
  async refreshStats(event?: any) {
    if (event) {
      // Pull to refresh - sin mostrar loading
      await this.loadMatchStats(this.currentFilter());
      event.target.complete();
    } else {
      // Refresh normal con loading
      await this.loadMatchStats(this.currentFilter());
    }
  }

  /**
   * Aplicar preset de filtro
   */
  async applyPreset(presetKey: string) {
    const preset = this.filterPresets.find(p => p.key === presetKey);
    if (!preset) return;

    this.selectedPreset.set(presetKey);

    if (presetKey === 'custom') {
      this.isFilterOpen.set(true);
    } else {
      this.currentFilter.set(preset.filters);
      await this.loadMatchStats(preset.filters);
    }
  }

  /**
   * Abrir/cerrar panel de filtros
   */
  toggleFilters() {
    this.isFilterOpen.set(!this.isFilterOpen());
    
    // Si se abre el panel de filtros, cargar valores actuales
    if (this.isFilterOpen()) {
      const current = this.currentFilter();
      this.tempConsultaType.set((current.consultaType as any) || '');
      this.tempConsultaStartDate.set(current.consultaStartDate || '');
      this.tempConsultaEndDate.set(current.consultaEndDate || '');
      this.tempStartDate.set(current.startDate || '');
      this.tempEndDate.set(current.endDate || '');
      this.tempYear.set(current.year || new Date().getFullYear());
    }
  }

  /**
   * Aplicar filtros personalizados
   */
  async applyCustomFilters() {
    const filters: MatchFilters = {};

    if (this.tempConsultaType()) {
      filters.consultaType = this.tempConsultaType() as 'EC' | 'ICS';
    }
    if (this.tempConsultaStartDate()) {
      filters.consultaStartDate = this.tempConsultaStartDate();
    }
    if (this.tempConsultaEndDate()) {
      filters.consultaEndDate = this.tempConsultaEndDate();
    }
    if (this.tempStartDate()) {
      filters.startDate = this.tempStartDate();
    }
    if (this.tempEndDate()) {
      filters.endDate = this.tempEndDate();
    }
    if (this.tempYear() && this.tempYear() !== new Date().getFullYear()) {
      filters.year = this.tempYear();
    }

    this.currentFilter.set(filters);
    this.selectedPreset.set('custom');
    this.isFilterOpen.set(false);
    
    await this.loadMatchStats(filters);
  }

  /**
   * Limpiar filtros
   */
  async clearFilters() {
    this.currentFilter.set({});
    this.selectedPreset.set('current_year');
    this.isFilterOpen.set(false);
    
    // Limpiar campos temporales
    this.tempConsultaType.set('');
    this.tempConsultaStartDate.set('');
    this.tempConsultaEndDate.set('');
    this.tempStartDate.set('');
    this.tempEndDate.set('');
    this.tempYear.set(new Date().getFullYear());
    
    await this.loadDefaultData();
  }

  /**
   * Formatear moneda
   */
  formatCurrency(amount: number): string {
    if (amount === 0) return 'L. 0.00';
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Formatear porcentaje
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  /**
   * Formatear número entero
   */
  formatNumber(value: number): string {
    return new Intl.NumberFormat('es-HN').format(value);
  }

  /**
   * Obtener cadena de fecha para filtros
   */
  private getDateString(daysOffset: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
  }

  /**
   * Mostrar toast
   */
  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
