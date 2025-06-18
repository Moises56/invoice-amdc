import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons,
  IonBadge, IonButton, IonSpinner, IonIcon, IonSearchbar, IonChip
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  locationOutline, businessOutline, statsChartOutline, storefrontOutline,
  checkmarkCircleOutline, closeCircleOutline, timeOutline, helpCircleOutline,
  refreshOutline, cardOutline, personOutline, callOutline, chevronForwardOutline,
  chevronBackOutline, trendingUpOutline, walletOutline, homeOutline, keyOutline, 
  searchOutline, closeOutline, ellipsisHorizontalOutline
} from 'ionicons/icons';

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
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons,
    IonBadge, IonButton, IonSpinner, IonIcon, IonSearchbar, IonChip
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
  
  // Signals para búsqueda
  searchTerm = signal<string>('');
    // Signals para paginación  
  currentPage = signal(1);
  itemsPerPage = signal(8); // 4 columnas en desktop x 2 filas, 2 columnas en tablet x 4 filas, 1 en móvil x 8 filas
  
  // Computed signals
  filteredLocales = computed(() => {
    const locales = this.mercado()?.locales || [];
    const search = this.searchTerm().toLowerCase().trim();
    
    if (!search) {
      return locales;
    }
    
    return locales.filter(local => 
      local.numero_local?.toString().includes(search) ||
      local.dni_propietario?.toLowerCase().includes(search) ||
      local.propietario?.toLowerCase().includes(search) ||
      local.nombre_local?.toLowerCase().includes(search)
    );
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
  
  // Computed para páginas visibles en la paginación
  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | string)[] = [];
    
    if (total <= 7) {
      // Si hay 7 páginas o menos, mostrar todas
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para páginas con ellipsis
      if (current <= 4) {
        // Inicio: 1, 2, 3, 4, 5, ..., total
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(total);
      } else if (current >= total - 3) {
        // Final: 1, ..., total-4, total-3, total-2, total-1, total
        pages.push(1);
        pages.push('...');
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        // Medio: 1, ..., current-1, current, current+1, ..., total
        pages.push(1);
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(total);
      }
    }
    
    return pages;
  });
  
  // Computed para páginas visibles en móvil (menos páginas)
  visiblePagesMobile = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | string)[] = [];
    
    if (total <= 3) {
      // Si hay 3 páginas o menos, mostrar todas
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Lógica simplificada para móvil
      if (current === 1) {
        // Inicio: 1, 2, 3
        pages.push(1, 2, 3);
        if (total > 3) {
          pages.push('...');
        }
      } else if (current === total) {
        // Final: ..., total-2, total-1, total
        if (total > 3) {
          pages.push('...');
        }
        pages.push(total - 2, total - 1, total);
      } else {
        // Medio: current-1, current, current+1
        if (current > 2) {
          pages.push('...');
        }
        
        const start = Math.max(1, current - 1);
        const end = Math.min(total, current + 1);
        
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
        
        if (current < total - 1) {
          pages.push('...');
        }
      }
    }
    
    return pages;
  });
  
  canGoToPrevious = computed(() => this.currentPage() > 1);
  canGoToNext = computed(() => this.currentPage() < this.totalPages());
  
  // Computed para mostrar "..." en la paginación
  showStartEllipsis = computed(() => {
    const visible = this.visiblePages();
    return visible.length > 0 && typeof visible[0] === 'number' && visible[0] > 1;
  });
  
  showEndEllipsis = computed(() => {
    const visible = this.visiblePages();
    const total = this.totalPages();
    const lastVisible = visible[visible.length - 1];
    return visible.length > 0 && typeof lastVisible === 'number' && lastVisible < total;
  });
  
  constructor() {
    addIcons({
      businessOutline, locationOutline, statsChartOutline, storefrontOutline,
      refreshOutline, cardOutline, personOutline, callOutline, chevronForwardOutline,
      chevronBackOutline, checkmarkCircleOutline, closeCircleOutline, timeOutline, 
      helpCircleOutline, trendingUpOutline, walletOutline, homeOutline, keyOutline,
      searchOutline, closeOutline, ellipsisHorizontalOutline
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

  // Métodos de paginación mejorada
  firstPage() {
    this.currentPage.set(1);
  }

  lastPage() {
    this.currentPage.set(this.totalPages());
  }

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

  // Métodos para manejar la búsqueda
  onSearchChange(event: any) {
    const searchValue = event.target.value || '';
    this.searchTerm.set(searchValue);
    // Resetear a la primera página cuando se realiza una búsqueda
    this.currentPage.set(1);
  }

  clearSearch() {
    this.searchTerm.set('');
    this.currentPage.set(1);
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

  // Exponer Math para usar en el template
  Math = Math;

  // Helper method para verificar si una página es un número
  isPageNumber(page: string | number): page is number {
    return typeof page === 'number';
  }

  // Helper method para hacer cast seguro a número
  asPageNumber(page: string | number): number {
    return page as number;
  }

  /**
   * Manejar click en página - solo si es un número
   */
  handlePageClick(page: string | number) {
    if (typeof page === 'number') {
      this.goToPage(page);
    }
  }
}
