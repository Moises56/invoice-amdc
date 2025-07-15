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
  IonFab,
  IonFabButton,
  IonSelect,
  IonSelectOption,
  IonItem
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  addOutline, 
  searchOutline,
  receiptOutline,
  timeOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  closeCircleOutline,
  documentTextOutline,
  businessOutline,
  refreshOutline,
  filterOutline,
  eyeOutline,
  cardOutline,
  calendarOutline, personOutline } from 'ionicons/icons';
import { FacturasService, FacturaFilters } from '../facturas.service';
import { Factura } from '../../../shared/interfaces';
import { ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-facturas-list',
  templateUrl: './facturas-list.page.html',
  styleUrls: ['./facturas-list.page.scss'],
  encapsulation: ViewEncapsulation.None,
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
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonGrid,
    IonRow,
    IonCol,
    IonFab,
    IonFabButton,
    IonSelect,
    IonSelectOption,
    IonItem
  ]
})
export class FacturasListPage implements OnInit {
  private facturasService = inject(FacturasService);
  private router = inject(Router);

  // Signals
  facturas = signal<Factura[]>([]);
  loading = signal(false);
  searchTerm = signal('');
  currentPage = signal(1);
  totalPages = signal(0);
  totalItems = signal(0);
  selectedEstado = signal('');
  selectedMes = signal('');
  selectedAnio = signal(new Date().getFullYear());
  
  // Responsive grid configuration
  gridCols = computed(() => {
    const width = window.innerWidth;
    if (width < 768) return 1; // Mobile: 1 column
    if (width < 1200) return 2; // Tablet: 2 columns
    return 4; // Desktop: 4 columns
  });

  // Filter options
  estadoOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'PENDIENTE', label: 'Pendientes' },
    { value: 'PAGADA', label: 'Pagadas' },
    { value: 'VENCIDA', label: 'Vencidas' },
    { value: 'ANULADA', label: 'Anuladas' }
  ];

  mesOptions = [
    { value: '', label: 'Todos los meses' },
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
  ];

  anioOptions = computed(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push({ value: i, label: i.toString() });
    }
    return years;
  });

  constructor() {
    addIcons({addOutline,receiptOutline,checkmarkCircleOutline,timeOutline,closeCircleOutline,refreshOutline,businessOutline,personOutline,calendarOutline,cardOutline,documentTextOutline,eyeOutline,searchOutline,alertCircleOutline,filterOutline});
  }

  ngOnInit() {
    this.loadFacturas();
  }

  /**
   * Cargar facturas
   */
  async loadFacturas(refresh = false): Promise<void> {
    this.loading.set(true);
    
    const params: FacturaFilters = {
      page: refresh ? 1 : this.currentPage(),
      limit: 12 // 4 cols x 3 rows o 1 col x 12 rows
    };
    
    if (this.searchTerm()) {
      params.search = this.searchTerm();
    }
    
    if (this.selectedEstado()) {
      params.estado = this.selectedEstado();
    }
    
    if (this.selectedMes()) {
      params.mes = this.selectedMes();
    }
    
    if (this.selectedAnio()) {
      params.anio = this.selectedAnio();
    }
    
    try {
      const response = await this.facturasService.getFacturas(params).toPromise();
      if (response) {
        this.facturas.set(response.data);
        this.totalPages.set(response.pagination.total_pages);
        this.totalItems.set(response.pagination.total);
        this.currentPage.set(response.pagination.current_page);
      }
    } catch (error) {
      console.error('Error loading facturas:', error);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Buscar facturas
   */
  async onSearch(event: any): Promise<void> {
    const searchTerm = event.target.value?.toLowerCase() || '';
    this.searchTerm.set(searchTerm);
    this.currentPage.set(1);
    await this.loadFacturas(true);
  }

  /**
   * Filtrar por estado
   */
  async onEstadoChange(event: any): Promise<void> {
    this.selectedEstado.set(event.detail.value);
    this.currentPage.set(1);
    await this.loadFacturas(true);
  }

  /**
   * Filtrar por mes
   */
  async onMesChange(event: any): Promise<void> {
    this.selectedMes.set(event.detail.value);
    this.currentPage.set(1);
    await this.loadFacturas(true);
  }

  /**
   * Filtrar por año
   */
  async onAnioChange(event: any): Promise<void> {
    this.selectedAnio.set(event.detail.value);
    this.currentPage.set(1);
    await this.loadFacturas(true);
  }

  /**
   * Refrescar datos
   */
  async doRefresh(event: any): Promise<void> {
    await this.loadFacturas(true);
    event.target.complete();
  }

  /**
   * Cargar más datos (infinite scroll)
   */
  async loadMore(event: any): Promise<void> {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      
      const params: FacturaFilters = {
        page: this.currentPage(),
        limit: 12
      };
      
      if (this.searchTerm()) {
        params.search = this.searchTerm();
      }
      
      if (this.selectedEstado()) {
        params.estado = this.selectedEstado();
      }
      
      if (this.selectedMes()) {
        params.mes = this.selectedMes();
      }
      
      if (this.selectedAnio()) {
        params.anio = this.selectedAnio();
      }
      
      try {
        const response = await this.facturasService.getFacturas(params).toPromise();
        if (response) {
          // Append new data to existing
          const currentFacturas = this.facturas();
          this.facturas.set([...currentFacturas, ...response.data]);
          this.totalPages.set(response.pagination.total_pages);
        }
      } catch (error) {
        console.error('Error loading more facturas:', error);
      }
    }
    
    event.target.complete();
  }

  /**
   * Ver detalle de la factura
   */
  viewFactura(factura: Factura): void {
    this.router.navigate(['/facturas', factura.id]);
  }

  /**
   * Navegar a crear nueva factura
   */
  createFactura(): void {
    this.router.navigate(['/facturas/nueva']);
  }

  /**
   * Formatear monto
   */
  formatMonto(monto: string | number): string {
    return this.facturasService.formatMonto(monto);
  }

  /**
   * Obtener color del estado
   */
  getEstadoColor(estado: string): string {
    return this.facturasService.getEstadoColor(estado);
  }

  /**
   * Obtener ícono del estado
   */
  getEstadoIcon(estado: string): string {
    return this.facturasService.getEstadoIcon(estado);
  }

  /**
   * Formatear fecha
   */
  formatFecha(fecha: string | Date): string {
    return this.facturasService.formatFecha(fecha);
  }

  /**
   * Obtener nombre del mes
   */
  getMesNombre(mes: string): string {
    return this.facturasService.getMesNombre(mes);
  }

  /**
   * Limpiar filtros
   */
  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedEstado.set('');
    this.selectedMes.set('');
    this.selectedAnio.set(new Date().getFullYear());
    this.currentPage.set(1);
    this.loadFacturas(true);
  }

  /**
   * Filtrar facturas por estado
   */
  filteredByEstado(estado: string): Factura[] {
    const estadoUpper = estado.toUpperCase();
    return this.facturas().filter(f => f.estado === estadoUpper);
  }

  /**
   * Obtener años disponibles
   */
  availableYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(i);
    }
    return years;
  }

  /**
   * Track by function para optimizar renderizado
   */
  trackByFactura(index: number, factura: Factura): string {
    return factura.id;
  }
}
