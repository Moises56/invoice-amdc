import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
  IonBadge, IonButton, IonSpinner, IonIcon, IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  locationOutline, businessOutline, statsChartOutline, storefrontOutline,
  checkmarkCircleOutline, closeCircleOutline, timeOutline, helpCircleOutline,
  refreshOutline, cardOutline, personOutline, callOutline, chevronForwardOutline,
  chevronBackOutline, trendingUpOutline, walletOutline, homeOutline, keyOutline, searchOutline, addOutline, mapOutline, listOutline, createOutline } from 'ionicons/icons';

import { MercadosService } from '../mercados.service';
import { Mercado, Local } from '../../../shared/interfaces';
import { EstadoLocal } from '../../../shared/enums';

// Interface para las estadísticas del mercado
interface MercadoStats {
  total_mercados: number;
  total_locales: number;
  locales_ocupados: number;
  locales_libres: number;
  ocupacion_percentage: number;
  total_recaudado: number;
}

@Component({
  selector: 'app-mercado-detail',
  templateUrl: './mercado-detail.page.html',
  styleUrls: ['./mercado-detail.page.scss'],
  standalone: true,  imports: [
    CommonModule,
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons,
    IonBadge, IonButton, IonSpinner, IonIcon
  ]
})
export class MercadoDetailPage implements OnInit {
  private mercadosService = inject(MercadosService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  // Signals principales
  mercado = signal<Mercado | null>(null);
  isLoading = signal(true);
  mercadoId = signal<string>('');
  
  // Signals para estadísticas
  stats = signal<MercadoStats | null>(null);
  isLoadingStats = signal(false);
  
  // Signals para paginación
  currentPage = signal(1);
  itemsPerPage = signal(8); // 4 columnas en desktop x 2 filas = 8 items
  
  // Computed signals
  filteredLocales = computed(() => {
    const locales = this.mercado()?.locales || [];
    return locales;
  });
  
  paginatedLocales = computed(() => {
    const locales = this.filteredLocales();
    const page = this.currentPage();
    const perPage = this.itemsPerPage();
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    return locales.slice(startIndex, endIndex);
  });
  
  totalPages = computed(() => {
    const locales = this.filteredLocales();
    const perPage = this.itemsPerPage();
    return Math.ceil(locales.length / perPage);
  });
    constructor() {
    addIcons({
      businessOutline, locationOutline, statsChartOutline, storefrontOutline,
      refreshOutline, cardOutline, personOutline, callOutline, chevronForwardOutline,
      chevronBackOutline, checkmarkCircleOutline, closeCircleOutline, timeOutline, 
      helpCircleOutline, trendingUpOutline, walletOutline, homeOutline, keyOutline
    });
  }
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.mercadoId.set(id);
      this.loadMercado(id);
      this.loadStats(id);
    }
  }

  private async loadMercado(id: string) {
    try {
      this.isLoading.set(true);
      const response = await this.mercadosService.getMarketById(id).toPromise();
      
      if (response && response.id) {
        this.mercado.set(response);
      } else {
        this.mercado.set(null);
      }
    } catch (error) {
      console.error('Error loading mercado:', error);
      this.mercado.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }
  private async loadStats(id: string) {
    try {
      this.isLoadingStats.set(true);
      
      // Llamada real a la API
      const response = await this.mercadosService.getMarketStats(id).toPromise();
      this.stats.set(response);
      
    } catch (error) {
      console.error('Error loading stats:', error);
      // En caso de error, usar datos simulados
      const defaultStats: MercadoStats = {
        total_mercados: 1,
        total_locales: this.mercado()?.locales?.length || 0,
        locales_ocupados: 0,
        locales_libres: this.mercado()?.locales?.length || 0,
        ocupacion_percentage: 0,
        total_recaudado: 0
      };
      this.stats.set(defaultStats);
    } finally {
      this.isLoadingStats.set(false);
    }
  }

  getStatusColor(isActive: boolean): string {
    return isActive ? 'success' : 'danger';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Activo' : 'Inactivo';
  }
  // Métodos de paginación
  nextPage() {
    const current = this.currentPage();
    const total = this.totalPages();
    if (current < total) {
      this.currentPage.set(current + 1);
    }
  }

  prevPage() {
    const current = this.currentPage();
    if (current > 1) {
      this.currentPage.set(current - 1);
    }
  }

  goToPage(page: number) {
    const total = this.totalPages();
    if (page >= 1 && page <= total) {
      this.currentPage.set(page);
    }
  }

  /**
   * Track by function para la lista de locales
   */
  trackByLocalId(index: number, local: Local): string {
    return local.id;
  }

  /**
   * Ver detalles de un local específico
   */
  viewLocal(local: Local) {
    this.router.navigate(['/locales', local.id]);
  }

  /**
   * Obtener el color del ícono según el estado del local
   */
  getLocalStatusColor(estado: EstadoLocal): string {
    switch (estado) {
      case EstadoLocal.OCUPADO:
        return 'success';
      case EstadoLocal.LIBRE:
        return 'warning';
      case EstadoLocal.ACTIVO:
        return 'primary';
      case EstadoLocal.INACTIVO:
        return 'danger';
      case EstadoLocal.SUSPENDIDO:
        return 'danger';
      case EstadoLocal.PENDIENTE:
        return 'medium';
      default:
        return 'medium';
    }
  }

  /**
   * Obtener el ícono según el estado del local
   */
  getLocalStatusIcon(estado: EstadoLocal): string {
    switch (estado) {
      case EstadoLocal.OCUPADO:
        return 'checkmark-circle-outline';
      case EstadoLocal.LIBRE:
        return 'time-outline';
      case EstadoLocal.ACTIVO:
        return 'checkmark-circle-outline';
      case EstadoLocal.INACTIVO:
        return 'close-circle-outline';
      case EstadoLocal.SUSPENDIDO:
        return 'close-circle-outline';
      case EstadoLocal.PENDIENTE:
        return 'time-outline';
      default:
        return 'help-circle-outline';
    }
  }

  /**
   * Obtener el texto descriptivo del estado del local
   */
  getLocalStatusText(estado: EstadoLocal): string {
    switch (estado) {
      case EstadoLocal.OCUPADO:
        return 'Ocupado';
      case EstadoLocal.LIBRE:
        return 'Disponible';
      case EstadoLocal.ACTIVO:
        return 'Activo';
      case EstadoLocal.INACTIVO:
        return 'Inactivo';
      case EstadoLocal.SUSPENDIDO:
        return 'Suspendido';
      case EstadoLocal.PENDIENTE:
        return 'Pendiente';
      default:
        return 'Sin estado';
    }
  }
}
