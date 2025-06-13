import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonChip,
  IonSelect,
  IonSelectOption,
  IonRefresher,
  IonRefresherContent,
  IonMenuButton,
  IonSkeletonText,
  IonToast,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonFab,
  IonFabButton,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonActionSheet,
  RefresherCustomEvent,
  InfiniteScrollCustomEvent,
  ActionSheetController,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  searchOutline,
  addOutline,
  locationOutline,
  businessOutline,
  eyeOutline,
  createOutline,
  trashOutline,
  downloadOutline,
  filterOutline,
  refreshOutline,
  checkmarkCircle,
  closeCircle,
  menuOutline,
  ellipsisVertical,
  mapOutline,
  callOutline,
  mailOutline, 
  checkmarkOutline, 
  closeOutline, 
  documentTextOutline 
} from 'ionicons/icons';
import { MercadosService, MarketFilters } from '../mercados.service';
import { Mercado } from '../../../shared/interfaces';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../shared/enums';
import { EventService } from '../../../shared/services/event.service';

@Component({
  selector: 'app-mercados-list',
  templateUrl: './mercados-list.page.html',
  styleUrls: ['./mercados-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonChip,
    IonSelect,
    IonSelectOption,
    IonRefresher,
    IonRefresherContent,
    IonMenuButton,
    IonSkeletonText,
    IonToast,
    IonCard,
    IonCardContent,    IonCardHeader,
    IonCardTitle,
    IonGrid,
    IonRow,
    IonCol,
    IonFab,
    IonFabButton,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonActionSheet,
  ]
})
export class MercadosListPage implements OnInit, OnDestroy {
  private mercadosService = inject(MercadosService);
  private router = inject(Router);
  private actionSheetController = inject(ActionSheetController);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private authService = inject(AuthService);
  private eventService = inject(EventService);
  
  // Subscripción para eventos
  private eventSubscription: Subscription | null = null;

  // Signals
  mercados = signal<Mercado[]>([]);
  loading = signal(false);
  isInfiniteDisabled = signal(false);
  selectedMercado = signal<Mercado | null>(null);
  searchText = signal('');
  currentPage = signal(1);
  totalPages = signal(1);
  selectedEstado = signal<boolean | undefined>(undefined);
  selectedMunicipio = signal<string>('');
  availableMunicipios = signal<string[]>([]);
  showFilters = signal(false);
  isActionSheetOpen = signal(false);
  toastMessage = signal('');
  toastColor = signal('');
  isToastOpen = signal(false);

  // Computed properties
  filteredMercados = computed(() => {
    let filtered = this.mercados();
    const search = this.searchText().toLowerCase().trim();

    if (this.selectedEstado() !== undefined) {
      filtered = filtered.filter(m => m.isActive === this.selectedEstado());
    }

    if (this.selectedMunicipio()) {
      filtered = filtered.filter(m => 
        m.direccion.toLowerCase().includes(this.selectedMunicipio().toLowerCase())
      );
    }

    if (!search) return filtered;

    return filtered.filter(mercado => 
      mercado.nombre_mercado.toLowerCase().includes(search) ||
      mercado.direccion.toLowerCase().includes(search) ||
      mercado.descripcion?.toLowerCase().includes(search)
    );
  });

  hasActiveFilters = computed(() => {
    return this.selectedEstado() !== undefined || 
           this.selectedMunicipio();
  });
  // Role-based permissions
  canCreate = computed(() => {
    const user = this.authService.user();
    return user && [Role.ADMIN].includes(user.role);
  });

  canEdit = computed(() => {
    const user = this.authService.user();
    return user && [Role.ADMIN].includes(user.role);
  });

  canDelete = computed(() => {
    const user = this.authService.user();
    return user && [Role.ADMIN].includes(user.role);
  });

  constructor() {
    addIcons({filterOutline,downloadOutline,checkmarkOutline,closeOutline,businessOutline,addOutline,ellipsisVertical,locationOutline,documentTextOutline,mapOutline,eyeOutline,createOutline,searchOutline,trashOutline,refreshOutline,checkmarkCircle,closeCircle,menuOutline,callOutline,mailOutline});
  }

  ngOnInit() {
    this.loadMercados();
    this.loadFilterOptions();
    
    // Suscribirse a eventos de mercados
    this.eventSubscription = this.eventService.events$.subscribe(event => {      if (event.type === 'mercado:created') {
        // Cuando se crea un nuevo mercado
        if (event.payload) {
          // Opción 1: Agregar el nuevo mercado al inicio de la lista
          this.mercados.update(mercados => [event.payload as Mercado, ...mercados] as Mercado[]);
          this.showToast('Nuevo mercado agregado', 'success');
        }
      } else if (event.type === 'mercado:updated') {
        // Cuando se actualiza un mercado existente
        if (event.payload) {
          const updatedMercado = event.payload as Mercado;
          // Actualizar el mercado en la lista actual
          this.mercados.update(mercados => 
            mercados.map(m => m.id === updatedMercado.id ? updatedMercado : m) as Mercado[]
          );
          this.showToast('Mercado actualizado', 'success');
        }
      }
    });
  }
  
  /**
   * Limpiar suscripciones al destruir el componente
   */
  ngOnDestroy() {
    if (this.eventSubscription) {
      this.eventSubscription.unsubscribe();
      this.eventSubscription = null;
    }
  }

  /**
   * Cargar mercados
   */
  async loadMercados(refresh = false) {
    this.loading.set(true);
    
    try {
      const page = refresh ? 1 : this.currentPage();
      const filters: MarketFilters = {
        page,
        search: this.searchText() || undefined,
        estado: this.selectedEstado(),
        municipio: this.selectedMunicipio() || undefined
      };

      const response = await this.mercadosService.getMarkets(filters).toPromise();
      
      if (response) {
        if (refresh) {
          this.mercados.set(response.data);
          this.currentPage.set(1);
        } else {
          this.mercados.update(mercados => [...mercados, ...response.data]);
        }
        
        this.totalPages.set(response.pagination.total_pages);
        this.isInfiniteDisabled.set(this.currentPage() >= response.pagination.total_pages);
      }
    } catch (error) {
      console.error('Error loading mercados:', error);
      await this.showToast('Error al cargar mercados', 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Cargar opciones para filtros
   */
  async loadFilterOptions() {
    try {
      const municipios = await this.mercadosService.getUniqueMunicipios().toPromise();
      if (municipios) this.availableMunicipios.set(municipios);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  }

  /**
   * Manejar evento de refresh
   */
  async onRefresh(event: RefresherCustomEvent) {
    await this.loadMercados(true);
    event.target.complete();
  }

  /**
   * Manejar evento de carga infinita
   */
  async onLoadMore(event: InfiniteScrollCustomEvent) {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(page => page + 1);
      await this.loadMercados();
    }
    event.target.complete();
  }

  /**
   * Manejar cambio en la búsqueda
   */
  onSearchChange(event: any) {
    this.searchText.set(event.detail.value);
  }

  /**
   * Aplicar filtros
   */
  applyFilters() {
    this.loadMercados(true);
    this.showFilters.set(false);
    this.showToast('Filtros aplicados', 'success');
  }

  /**
   * Limpiar filtros
   */
  clearFilters() {
    this.selectedEstado.set(undefined);
    this.selectedMunicipio.set('');
    this.searchText.set('');
    this.loadMercados(true);
    this.showFilters.set(false);
    this.showToast('Filtros limpiados', 'success');
  }

  /**
   * Crear nuevo mercado
   */
  createMercado() {
    this.router.navigate(['/mercados/nuevo']);
  }

  /**
   * Ver detalles del mercado
   */
  viewMercado(mercado: Mercado) {
    this.router.navigate(['/mercados', mercado.id]);
  }

  /**
   * Editar mercado
   */
  editMercado(mercado: Mercado) {
    this.router.navigate(['/mercados/editar', mercado.id]);
  }
  /**
   * Cambiar estado del mercado
   */
  async toggleMercadoState(mercado: Mercado) {
    try {
      const updatedMercado = await this.mercadosService
        .toggleMarketStatus(mercado.id)
        .toPromise();
      
      if (updatedMercado?.data) {
        this.mercados.update(mercados =>
          mercados.map(m => m.id === mercado.id ? updatedMercado.data : m) as Mercado[]
        );
        await this.showToast(
          `Mercado ${updatedMercado.data.isActive ? 'activado' : 'desactivado'} exitosamente`,
          'success'
        );
      }
    } catch (error) {
      console.error('Error toggling market state:', error);
      await this.showToast('Error al cambiar estado del mercado', 'danger');
    }
  }

  /**
   * Mostrar opciones del mercado
   */
  showMercadoOptions(mercado: Mercado) {
    this.selectedMercado.set(mercado);
    this.isActionSheetOpen.set(true);
  }

  /**
   * Manejar acción seleccionada
   */
  async onActionSelected(action: string) {
    const mercado = this.selectedMercado();
    if (!mercado) return;

    switch (action) {
      case 'view':
        this.viewMercado(mercado);
        break;
      case 'edit':
        this.editMercado(mercado);
        break;
      case 'toggle':
        this.toggleMercadoState(mercado);
        break;
      case 'delete':
        const alert = await this.alertController.create({
          header: 'Confirmar eliminación',
          message: `¿Está seguro que desea eliminar el mercado "${mercado.nombre_mercado}"?`,
          buttons: [
            { text: 'Cancelar', role: 'cancel' },
            {
              text: 'Eliminar',
              role: 'destructive',
              handler: async () => {
                try {                  await this.mercadosService.deleteMarket(mercado.id).toPromise();
                  this.mercados.update(mercados => mercados.filter(m => m.id !== mercado.id) as Mercado[]);
                  await this.showToast('Mercado eliminado correctamente', 'success');
                } catch (error) {
                  console.error('Error deleting market:', error);
                  await this.showToast('Error al eliminar mercado', 'danger');
                }
              }
            }
          ]
        });
        await alert.present();
        break;
      case 'map':
        this.showLocationOnMap(mercado);
        break;
    }
  }

  /**
   * Mostrar ubicación en el mapa
   */
  showLocationOnMap(mercado: Mercado) {
    if (mercado.latitud && mercado.longitud) {
      window.open(`https://www.google.com/maps?q=${mercado.latitud},${mercado.longitud}`, '_blank');
    } else {
      this.showToast('El mercado no tiene coordenadas disponibles', 'warning');
    }
  }

  /**
   * Método para mostrar en el mapa (alias para compatibilidad con la UI)
   */
  showOnMap(mercado: Mercado) {
    this.showLocationOnMap(mercado);
  }

  /**
   * Exportar lista de mercados
   */
  async exportMercados() {
    try {
      // Aquí iría la lógica para exportar los mercados
      // Por ejemplo, generar un CSV y descargarlo
      console.log('Exportando mercados...');
      this.showToast('Mercados exportados correctamente', 'success');
    } catch (error) {
      console.error('Error exporting markets:', error);
      this.showToast('Error al exportar mercados', 'danger');
    }
  }

  /**
   * Mostrar toast
   */
  async showToast(message: string, color: string) {
    this.toastMessage.set(message);
    this.toastColor.set(color);
    this.isToastOpen.set(true);
  }
  /**
   * Obtener color del chip por estado
   */
  getStatusColor(isActive: boolean): string {
    return isActive ? 'success' : 'danger';
  }

  /**
   * Obtener ícono del estado
   */
  getStatusIcon(isActive: boolean): string {
    return isActive ? 'checkmark-circle' : 'close-circle';
  }

  /**
   * Obtener botones del action sheet
   */
  getActionSheetButtons() {
    return [
      {
        text: 'Ver Detalles',
        icon: 'eye-outline',
        handler: () => this.onActionSelected('view')
      },
      {
        text: 'Editar',
        icon: 'create-outline',
        handler: () => this.onActionSelected('edit'),
        cssClass: this.canEdit() ? '' : 'hidden'
      },
      {
        text: this.selectedMercado()?.isActive ? 'Desactivar' : 'Activar',
        icon: this.selectedMercado()?.isActive ? 'close-circle-outline' : 'checkmark-circle-outline',
        handler: () => this.onActionSelected('toggle'),
        cssClass: this.canEdit() ? '' : 'hidden'
      },
      {
        text: 'Ver en Mapa',
        icon: 'map-outline',
        handler: () => this.onActionSelected('map')
      },
      {
        text: 'Eliminar',
        role: 'destructive',
        icon: 'trash-outline',
        handler: () => this.onActionSelected('delete'),
        cssClass: this.canDelete() ? '' : 'hidden'
      },
      {
        text: 'Cancelar',
        role: 'cancel'
      }
    ];
  }
  /**
   * Track by function para optimizar el renderizado
   */
  trackByFn(index: number, item: Mercado): string {
    return item.id;
  }
}
