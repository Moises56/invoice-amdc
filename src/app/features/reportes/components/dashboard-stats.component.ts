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
      totalMercados: {
        valor: this.estadisticas.total_mercados,
        label: 'Total Mercados',
        icon: 'business-outline',
        color: 'tertiary',
        change: '+2%',
        trending: 'up'
      },
      totalLocales: {
        valor: this.estadisticas.total_locales,
        label: 'Total Locales',
        icon: 'storefront-outline',
        color: 'warning',
        change: '+5%',
        trending: 'up'
      },
      totalFacturas: {
        valor: this.estadisticas.total_facturas,
        label: 'Total Facturas',
        icon: 'document-text-outline',
        color: 'primary',
        change: '+12%',
        trending: 'up'
      },
      totalRecaudado: {
        valor: this.estadisticas.total_recaudado,
        label: 'Total Recaudado',
        icon: 'cash-outline',
        color: 'success',
        change: '+8%',
        trending: 'up',
        isMoney: true
      },
      promedioFactura: {
        valor: this.estadisticas.promedio_factura,
        label: 'Promedio Factura',
        icon: 'analytics-outline',
        color: 'secondary',
        change: '-2%',
        trending: 'down',
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
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toLocaleString('es-ES');
  }

  // Formatear moneda
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
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
