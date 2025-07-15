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
  IonMenuButton,
  IonButton, 
  IonIcon, 
  IonSearchbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonLabel,
  IonFab,
  IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  addOutline, 
  searchOutline,
  locationOutline,
  personOutline,
  cardOutline,
  businessOutline,
  refreshOutline,
  filterOutline,
  eyeOutline,
  leafOutline,
  storefrontOutline,
  restaurantOutline,
  iceCreamOutline,
  cafeOutline,
  basketOutline,
  nutritionOutline
} from 'ionicons/icons';
import { LocalesService, LocalFilters } from '../locales.service';
import { Local } from '../../../shared/interfaces';

@Component({
  selector: 'app-locales-list',
  templateUrl: './locales-list.page.html',
  styleUrls: ['./locales-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonButtons, 
    IonMenuButton,
    IonButton, 
    IonIcon, 
    IonSearchbar,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonBadge,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonGrid,
    IonRow,
    IonCol,
    IonChip,
    IonLabel,
    IonFab,
    IonFabButton
  ]
})
export class LocalesListPage implements OnInit {
  private localesService = inject(LocalesService);
  private router = inject(Router);

  // Signals
  locales = signal<Local[]>([]);
  loading = signal(false);
  searchTerm = signal('');
  currentPage = signal(1);
  totalPages = signal(0);
  totalItems = signal(0);
  
  // Responsive grid configuration
  gridCols = computed(() => {
    const width = window.innerWidth;
    if (width < 768) return 1; // Mobile: 1 column
    if (width < 1200) return 2; // Tablet: 2 columns
    return 4; // Desktop: 4 columns
  });

  constructor() {
    addIcons({ 
      addOutline, 
      searchOutline,
      locationOutline,
      personOutline,
      cardOutline,
      businessOutline,
      refreshOutline,
      filterOutline,
      eyeOutline,
      leafOutline,
      storefrontOutline,
      restaurantOutline,
      iceCreamOutline,
      cafeOutline,
      basketOutline,
      nutritionOutline
    });
  }

  ngOnInit() {
    this.loadLocales();
  }

  /**
   * Cargar locales
   */
  async loadLocales(refresh = false): Promise<void> {
    this.loading.set(true);
    
    const params: LocalFilters = {
      page: refresh ? 1 : this.currentPage(),
      limit: 12 // 4 cols x 3 rows o 1 col x 12 rows
    };
    
    if (this.searchTerm()) {
      params.search = this.searchTerm();
    }
    
    try {
      const response = await this.localesService.getLocales(params).toPromise();
      if (response) {
        this.locales.set(response.data);
        this.totalPages.set(response.pagination.total_pages);
        this.totalItems.set(response.pagination.total);
        this.currentPage.set(response.pagination.current_page);
      }
    } catch (error) {
      console.error('Error loading locales:', error);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Buscar locales
   */
  async onSearch(event: any): Promise<void> {
    const searchTerm = event.target.value?.toLowerCase() || '';
    this.searchTerm.set(searchTerm);
    this.currentPage.set(1);
    await this.loadLocales(true);
  }

  /**
   * Refrescar datos
   */
  async doRefresh(event: any): Promise<void> {
    await this.loadLocales(true);
    event.target.complete();
  }

  /**
   * Cargar más datos (infinite scroll)
   */
  async loadMore(event: any): Promise<void> {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      
      const params: LocalFilters = {
        page: this.currentPage(),
        limit: 12
      };
      
      if (this.searchTerm()) {
        params.search = this.searchTerm();
      }
      
      try {
        const response = await this.localesService.getLocales(params).toPromise();
        if (response) {
          // Append new data to existing
          const currentLocales = this.locales();
          this.locales.set([...currentLocales, ...response.data]);
          this.totalPages.set(response.pagination.total_pages);
        }
      } catch (error) {
        console.error('Error loading more locales:', error);
      }
    }
    
    event.target.complete();
  }

  /**
   * Ver detalle del local
   */
  viewLocal(local: Local): void {
    this.router.navigate(['/locales', local.id]);
  }

  /**
   * Navegar a crear nuevo local
   */
  createLocal(): void {
    this.router.navigate(['/locales/nuevo']);
  }

  /**
   * Formatear monto
   */
  formatMonto(monto: string): string {
    return this.localesService.formatMontoMensual(monto);
  }

  /**
   * Obtener color del estado
   */
  getEstadoColor(estado: string): string {
    return this.localesService.getEstadoColor(estado);
  }

  /**
   * Obtener ícono del tipo de local
   */
  getTipoIcon(tipo: string): string {
    return this.localesService.getTipoLocalIcon(tipo);
  }

  /**
   * Formatear DNI
   */
  formatDNI(dni: string): string {
    if (!dni || dni === 'NO DISPONIBLE') return 'N/A';
    return dni;
  }

  /**
   * Formatear teléfono
   */
  formatTelefono(telefono: string): string {
    if (!telefono || telefono === 'NO DISPONIBLE') return 'N/A';
    return telefono;
  }

  /**
   * Obtener nombre del mercado
   */
  getMercadoNombre(local: Local): string {
    return local.mercado?.nombre_mercado || 'Mercado no disponible';
  }

  /**
   * Obtener número de facturas
   */
  getNumeroFacturas(local: Local): number {
    return local._count?.facturas || 0;
  }
}
