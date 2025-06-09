import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
  IonBadge, IonButton, IonSpinner, IonIcon, IonFab, IonFabButton,
  IonSearchbar, IonInfiniteScroll, IonInfiniteScrollContent,
  IonSelect, IonSelectOption, IonItemSliding, IonItemOptions, IonItemOption,
  AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  businessOutline, locationOutline, calendarOutline, cardOutline, 
  personOutline, callOutline, mailOutline, checkmarkCircleOutline,
  closeCircleOutline, timeOutline, helpCircleOutline, documentTextOutline,
  addOutline, createOutline, trashOutline, eyeOutline, searchOutline,
  closeSharp, refreshOutline, receiptOutline, statsChartOutline, downloadOutline, 
  alertCircleOutline, filterOutline, documentOutline, checkmarkOutline, 
  closeOutline, add, pauseOutline, playOutline
} from 'ionicons/icons';

import { LocalesService } from '../locales.service';
import { FacturasService } from '../../facturas/facturas.service';
import { AuthService } from '../../../core/services/auth.service';
import { 
  Local, Factura, EstadoLocal, EstadoFactura, 
  TipoLocal, Role, User 
} from '../../../shared/interfaces';

@Component({
  selector: 'app-local-detail',
  templateUrl: './local-detail.page.html',
  styleUrls: ['./local-detail.page.scss'],
  standalone: true,  imports: [
    CommonModule,
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
    IonBadge, IonButton, IonSpinner, IonIcon, IonFab, IonFabButton,
    IonSearchbar, IonInfiniteScroll, IonInfiniteScrollContent,
    IonSelect, IonSelectOption, IonItemSliding, IonItemOptions, IonItemOption
  ]
})
export class LocalDetailPage implements OnInit {
  private localesService = inject(LocalesService);
  private facturasService = inject(FacturasService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  // Signals
  local = signal<Local | null>(null);
  facturas = signal<Factura[]>([]);
  isLoading = signal(true);
  isLoadingFacturas = signal(false);
  localId = signal<string>('');
  searchTerm = signal<string>('');
  currentPage = signal(1);
  totalPages = signal(1);
  isInfiniteDisabled = signal(false);

  // Signals adicionales
  error = signal<string | null>(null);
  mercadoId = signal<string>('');
  estadisticasFacturas = signal<any>({
    total: 0,
    pagadas: 0,
    pendientes: 0,
    vencidas: 0
  });
  
  // Filtros
  filtroEstado = '';
  filtroMes = '';
  filtroAnio = '';

  // Computed signals adicionales
  canEditLocal = computed(() => this.canEdit());
  canEditFactura = computed(() => this.canEdit());
  hasMoreFacturas = computed(() => this.currentPage() < this.totalPages());

  // Computed signals
  filteredFacturas = computed(() => {
    const facturasArray = this.facturas();
    const search = this.searchTerm().toLowerCase().trim();
    
    if (!search) {
      return facturasArray;
    }
    
    return facturasArray.filter(factura => 
      factura.numero_factura?.toLowerCase().includes(search) ||
      factura.concepto?.toLowerCase().includes(search) ||
      factura.mes?.toLowerCase().includes(search) ||
      factura.anio?.toString().includes(search)
    );
  });

  // Permisos
  canEdit = computed(() => {
    const user = this.authService.user();
    return user && [Role.ADMIN, Role.MARKET].includes(user.role);
  });

  canDelete = computed(() => {
    const user = this.authService.user();
    return user && [Role.ADMIN].includes(user.role);
  });

  canCreateFactura = computed(() => {
    const user = this.authService.user();
    return user && [Role.ADMIN, Role.MARKET, Role.USER].includes(user.role);
  });  constructor() {
    addIcons({
      createOutline, refreshOutline, alertCircleOutline, documentTextOutline, 
      checkmarkCircleOutline, timeOutline, closeCircleOutline, addOutline, 
      filterOutline, documentOutline, calendarOutline, checkmarkOutline, 
      closeOutline, add, businessOutline, locationOutline, closeSharp, 
      cardOutline, personOutline, callOutline, mailOutline, helpCircleOutline, 
      trashOutline, eyeOutline, searchOutline, receiptOutline, statsChartOutline, 
      downloadOutline, pauseOutline, playOutline
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.localId.set(id);
      this.loadLocal(id);
      this.loadFacturas(true);
    }
  }  /**
   * Cargar datos del local
   */
  private async loadLocal(id: string) {
    try {
      this.isLoading.set(true);
      const local = await this.localesService.getLocalById(id).toPromise();
      
      if (local) {
        this.local.set(local);
      } else {
        this.local.set(null);
        this.showToast('Local no encontrado', 'danger');
      }
    } catch (error) {
      console.error('Error loading local:', error);
      this.local.set(null);
      this.showToast('Error al cargar los datos del local', 'danger');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Cargar facturas del local
   */
  async loadFacturas(refresh = false) {
    if (refresh) {
      this.isLoadingFacturas.set(true);
      this.currentPage.set(1);
    }

    try {
      const page = refresh ? 1 : this.currentPage();
      const response = await this.facturasService.getFacturasByLocal(
        this.localId(), 
        page, 
        10
      ).toPromise();
      
      if (response) {
        if (refresh) {
          this.facturas.set(response.data);
        } else {
          this.facturas.update(facturas => [...facturas, ...response.data]);
        }
        
        this.totalPages.set(response.pagination.total_pages);
        this.isInfiniteDisabled.set(this.currentPage() >= response.pagination.total_pages);
      }
    } catch (error) {
      console.error('Error loading facturas:', error);
      this.showToast('Error al cargar las facturas', 'danger');
    } finally {
      this.isLoadingFacturas.set(false);
    }
  }

  /**
   * Manejar refresh
   */
  async onRefresh(event: any) {
    await Promise.all([
      this.loadLocal(this.localId()),
      this.loadFacturas(true)
    ]);
    event.target.complete();
  }

  /**
   * Cargar más facturas
   */
  async onLoadMore(event: any) {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(page => page + 1);
      await this.loadFacturas();
    }
    event.target.complete();
  }

  /**
   * Refrescar local
   */
  refrescarLocal() {
    this.loadLocal(this.localId());
    this.loadFacturas(true);
  }
  /**
   * Editar local
   */
  editarLocal() {
    // Navegar a la página de edición del local
    this.router.navigate(['/mercados', this.mercadoId(), 'locales', this.localId(), 'edit']);
  }

  /**
   * Cargar local
   */
  cargarLocal() {
    this.loadLocal(this.localId());
  }

  /**
   * Toggle estado del local
   */
  async toggleEstadoLocal() {
    const local = this.local();
    if (!local) return;    const nuevoEstado = local.estado_local === EstadoLocal.ACTIVO ? EstadoLocal.INACTIVO : EstadoLocal.ACTIVO;
    
    try {
      await this.localesService.updateLocal(local.id, { estado_local: nuevoEstado }).toPromise();
      this.showToast(`Local ${nuevoEstado.toLowerCase()}`, 'success');
      this.loadLocal(this.localId());
    } catch (error) {
      this.showToast('Error al cambiar estado del local', 'danger');
    }
  }
  /**
   * Crear nueva factura
   */
  crearFactura() {
    // Navegar a la página de creación de factura
    this.router.navigate(['/facturas/crear'], { 
      queryParams: { localId: this.localId() } 
    });
  }

  /**
   * Ver detalle de factura
   */
  verDetalleFactura(factura: Factura) {
    // Navegar al detalle de la factura
    this.router.navigate(['/facturas', factura.id]);
  }  /**
   * Marcar como pagada
   */
  async marcarComoPagada(factura: Factura) {
    try {
      await this.facturasService.payFactura(factura.id).toPromise();
      this.showToast('Factura marcada como pagada', 'success');
      this.loadFacturas(true);
    } catch (error) {
      this.showToast('Error al marcar factura como pagada', 'danger');
    }
  }

  /**
   * Editar factura
   */
  editarFactura(factura: Factura) {
    this.router.navigate(['/facturas/editar', factura.id]);
  }

  /**
   * Anular factura
   */
  async anularFactura(factura: Factura) {
    const alert = await this.alertController.create({
      header: 'Confirmar anulación',
      message: `¿Está seguro de que desea anular la factura ${factura.numero_factura}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Anular',
          role: 'destructive',          handler: async () => {
            try {
              await this.facturasService.anularFactura(factura.id).toPromise();
              this.showToast('Factura anulada correctamente', 'success');
              this.loadFacturas(true);
            } catch (error) {
              this.showToast('Error al anular factura', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Aplicar filtros
   */
  aplicarFiltros() {
    // Implementar lógica de filtros
    this.loadFacturas(true);
  }

  /**
   * Limpiar filtros
   */
  limpiarFiltros() {
    this.filtroEstado = '';
    this.filtroMes = '';
    this.filtroAnio = '';
    this.searchTerm.set('');
    this.loadFacturas(true);
  }

  /**
   * Cargar más facturas para infinite scroll
   */
  cargarMasFacturas(event: any) {
    this.onLoadMore(event);
  }

  /**
   * Obtener color del estado
   */
  getEstadoColor(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'ACTIVO':
        return 'success';
      case 'INACTIVO':
        return 'danger';
      case 'SUSPENDIDO':
        return 'warning';
      default:
        return 'medium';
    }
  }

  /**
   * Obtener color del estado de factura
   */
  getEstadoFacturaColor(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'PAGADA':
        return 'success';
      case 'PENDIENTE':
        return 'warning';
      case 'VENCIDA':
        return 'danger';
      case 'ANULADA':
        return 'medium';
      default:
        return 'medium';
    }
  }

  /**
   * Obtener color del estado del local
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
   * Obtener color del estado de la factura
   */
  getFacturaStatusColor(estado: EstadoFactura): string {
    switch (estado) {
      case EstadoFactura.PAGADA:
        return 'success';
      case EstadoFactura.PENDIENTE:
        return 'warning';
      case EstadoFactura.VENCIDA:
        return 'danger';
      case EstadoFactura.ANULADA:
        return 'medium';
      default:
        return 'medium';
    }
  }

  /**
   * Obtener texto del estado del local
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

  /**
   * Obtener texto del tipo de local
   */
  getTipoLocalText(tipo: TipoLocal): string {
    switch (tipo) {
      case TipoLocal.COMIDA:
        return 'Comida';
      case TipoLocal.ROPA:
        return 'Ropa';
      case TipoLocal.ELECTRODOMESTICOS:
        return 'Electrodomésticos';
      case TipoLocal.FARMACIA:
        return 'Farmacia';
      case TipoLocal.SERVICIOS:
        return 'Servicios';
      case TipoLocal.CARNICERIA:
        return 'Carnicería';
      case TipoLocal.OTROS:
        return 'Otros';
      default:
        return 'No especificado';
    }
  }

  /**
   * Formatear fecha
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-HN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Formatear moneda
   */
  formatCurrency(amount: number): string {
    return `L ${amount.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`;
  }

  /**
   * Track by function para facturas
   */
  trackByFacturaId(index: number, factura: Factura): string {
    return factura.id;
  }

  /**
   * Mostrar toast
   */
  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  /**
   * Manejar cambio en la búsqueda
   */
  onSearchChange(event: any) {
    const query = event.target.value;
    this.searchTerm.set(query);
  }
}
