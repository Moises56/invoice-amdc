import { Component, OnInit, Input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardContent,
  IonIcon,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonButton,
  IonRippleEffect
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  trendingUpOutline,
  trendingDownOutline,
  businessOutline,
  storefrontOutline,
  cashOutline,
  documentTextOutline,
  peopleOutline,
  analyticsOutline,
  refreshOutline,
  arrowUpOutline,
  arrowDownOutline
} from 'ionicons/icons';
import { EstadisticasGenerales } from '../../../interfaces/reportes/estadisticas.interface';

@Component({
  selector: 'app-dashboard-stats',
  templateUrl: './dashboard-stats.component.html',
  styleUrls: ['./dashboard-stats.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardContent,
    IonIcon,
    IonBadge,
    IonGrid,
    IonRow,
    IonCol,
    IonSpinner,
    IonButton,
    IonRippleEffect
  ]
})
export class DashboardStatsComponent implements OnInit {
  @Input() estadisticas: EstadisticasGenerales | null = null;
  @Input() isLoading = false;

  // Señales para animaciones y estados
  showStats = signal(false);
  refreshing = signal(false);

  // Estadísticas computadas con formato
  statsComputadas = computed(() => {
    if (!this.estadisticas) return null;
    return {
      totalFacturas: {
        valor: this.estadisticas.total_facturas,
        label: 'Total Facturas',
        icon: 'document-text-outline',
        color: '#5ccedf',
        bg: 'linear-gradient(120deg, #e0f7fa 0%, #b2ebf2 100%)',
        change: '+12%',
        trending: 'up'
      },
      totalRecaudado: {
        valor: this.estadisticas.total_recaudado,
        label: 'Total Recaudado',
        icon: 'cash-outline',
        color: '#1976d2',
        bg: 'linear-gradient(120deg, #b2ebf2 0%, #e3f2fd 100%)',
        change: '+8%',
        trending: 'up',
        isMoney: true
      }
    };
  });

  constructor() {
    this.addAllIcons();
  }

  ngOnInit() {
    // Mostrar estadísticas con animación después de un breve delay
    setTimeout(() => {
      this.showStats.set(true);
    }, 300);
  }

  // Refrescar estadísticas
  async refreshStats() {
    this.refreshing.set(true);
    
    // Simular recarga
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    this.refreshing.set(false);
  }

  // Formatear números
  formatNumber(value: number): string {
    return value.toLocaleString('es-HN');
  }

  // Formatear moneda
  formatCurrency(value: number): string {
    // Formato Lempira: L 1,234,567
    return 'L ' + value.toLocaleString('es-HN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  // Obtener color de tendencia
  getTrendingColor(trending: string): string {
    return trending === 'up' ? 'success' : 'danger';
  }

  // Obtener icono de tendencia
  getTrendingIcon(trending: string): string {
    return trending === 'up' ? 'arrow-up-outline' : 'arrow-down-outline';
  }

  private addAllIcons() {
    addIcons({
      trendingUpOutline,
      trendingDownOutline,
      businessOutline,
      storefrontOutline,
      cashOutline,
      documentTextOutline,
      peopleOutline,
      analyticsOutline,
      refreshOutline,
      arrowUpOutline,
      arrowDownOutline
    });
  }
}
