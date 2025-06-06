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
  IonButton,
  IonIcon,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonChip,
  IonBadge,
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
  mailOutline, checkmarkOutline, closeOutline, documentTextOutline } from 'ionicons/icons';
import { MercadosService, MarketFilters } from '../mercados.service';
import { Mercado } from '../../../shared/interfaces';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../shared/enums';

@Component({
  selector: 'app-mercados-list',
  templateUrl: './mercados-list.page.html',
  styleUrls: ['./mercados-list.page.scss'],
  standalone: true,  imports: [
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
    IonActionSheet
  ]
})
export class MercadosListPage implements OnInit {
  private mercadosService = inject(MercadosService);
  private router = inject(Router);
  private actionSheetController = inject(ActionSheetController);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private authService = inject(AuthService);

  // Signals
  mercados = signal<Mercado[]>([]);
  loading = signal(false);
  searchText = signal('');
  currentPage = signal(1);
  totalPages = signal(1);
  isInfiniteDisabled = signal(false);
  showFilters = signal(false);
  
  // Filter signals
  selectedEstado = signal<boolean | undefined>(undefined);
  selectedMunicipio = signal<string>('');
  
  // Filter options
  availableMunicipios = signal<string[]>([]);
  
  // Toast
  isToastOpen = signal(false);
  toastMessage = signal('');
  toastColor = signal('');

  // Action sheet
  isActionSheetOpen = signal(false);
  selectedMercado = signal<Mercado | null>(null);

  // Computed
  filteredMercados = computed(() => {
    const search = this.searchText().toLowerCase();
    if (!search) return this.mercados();
    
    return this.mercados().filter(mercado => 
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
   * Manejar búsqueda
   */
  onSearchChange(event: any) {
    this.searchText.set(event.detail.value);
    this.currentPage.set(1);
    this.loadMercados(true);
  }

  /**
   * Aplicar filtros
   */
  applyFilters() {
    this.currentPage.set(1);
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
    this.currentPage.set(1);
    this.loadMercados(true);
    this.showFilters.set(false);
    this.showToast('Filtros limpiados', 'success');
  }

  /**
   * Refrescar datos
   */
  async onRefresh(event: RefresherCustomEvent) {
    await this.loadMercados(true);
    event.target.complete();
  }

  /**
   * Cargar más datos (infinite scroll)
   */
  async onLoadMore(event: InfiniteScrollCustomEvent) {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(page => page + 1);
      await this.loadMercados();
    }
    event.target.complete();
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
   * Mostrar opciones de mercado
   */
  async showMercadoOptions(mercado: Mercado) {
    this.selectedMercado.set(mercado);
    this.isActionSheetOpen.set(true);
  }

  /**
   * Manejar acción seleccionada del action sheet
   */
  async onActionSelected(action: string) {
    const mercado = this.selectedMercado();
    if (!mercado) return;

    this.isActionSheetOpen.set(false);

    switch (action) {
      case 'view':
        this.viewMercado(mercado);
        break;
      case 'edit':
        this.editMercado(mercado);
        break;
      case 'toggle':
        await this.toggleMercadoStatus(mercado);
        break;
      case 'delete':
        await this.deleteMercado(mercado);
        break;
      case 'map':
        this.showOnMap(mercado);
        break;
    }
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
  async toggleMercadoStatus(mercado: Mercado) {
    try {
      await this.mercadosService.toggleMarketStatus(mercado.id).toPromise();
      await this.loadMercados(true);
      await this.showToast(
        `Mercado ${mercado.isActive ? 'desactivado' : 'activado'} correctamente`,
        'success'
      );
    } catch (error) {
      await this.showToast('Error al cambiar estado del mercado', 'danger');
    }
  }

  /**
   * Eliminar mercado
   */
  async deleteMercado(mercado: Mercado) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de que desea eliminar el mercado "${mercado.nombre_mercado}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.mercadosService.deleteMarket(mercado.id).toPromise();
              await this.loadMercados(true);
              await this.showToast('Mercado eliminado correctamente', 'success');
            } catch (error) {
              await this.showToast('Error al eliminar mercado', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Mostrar mercado en el mapa
   */
  showOnMap(mercado: Mercado) {
    if (mercado.latitud && mercado.longitud) {
      const url = `https://www.google.com/maps?q=${mercado.latitud},${mercado.longitud}`;
      window.open(url, '_blank');
    } else {
      this.showToast('El mercado no tiene coordenadas disponibles', 'warning');
    }
  }

  /**
   * Exportar mercados
   */
  async exportMercados() {
    try {
      this.loading.set(true);
      
      const filters: MarketFilters = {
        search: this.searchText() || undefined,
        estado: this.selectedEstado(),
        municipio: this.selectedMunicipio() || undefined
      };

      const blob = await this.mercadosService.exportMarkets(filters).toPromise();
      
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `mercados-${new Date().getTime()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.showToast('Mercados exportados correctamente', 'success');
      }
    } catch (error) {
      this.showToast('Error al exportar mercados', 'danger');
    } finally {
      this.loading.set(false);
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
