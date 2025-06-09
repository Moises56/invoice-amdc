import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
  IonBadge, IonButton, IonSpinner, IonIcon, IonFab, IonFabButton,
  IonSearchbar, IonChip
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { locationOutline, businessOutline, calendarOutline, createOutline,
  mapOutline, listOutline, statsChartOutline, storefrontOutline, addOutline, 
  checkmarkCircleOutline, closeCircleOutline, timeOutline, helpCircleOutline, 
  refreshOutline, searchOutline, cardOutline, personOutline, callOutline, 
  chevronForwardOutline, close } from 'ionicons/icons';

import { MercadosService } from '../mercados.service';
import { Mercado, Local } from '../../../shared/interfaces';
import { EstadoLocal } from '../../../shared/enums';

@Component({
  selector: 'app-mercado-detail',
  templateUrl: './mercado-detail.page.html',
  styleUrls: ['./mercado-detail.page.scss'],
  standalone: true,  imports: [
    CommonModule,
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
    IonBadge, IonButton, IonSpinner, IonIcon, IonFab, IonFabButton,
    IonSearchbar, IonChip
  ]
})
export class MercadoDetailPage implements OnInit {
  private mercadosService = inject(MercadosService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  mercado = signal<Mercado | null>(null);
  isLoading = signal(true);
  mercadoId = signal<string>('');
  searchTerm = signal<string>('');

  // Computed signal para filtrar los locales basado en el término de búsqueda
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
  constructor() {
    addIcons({businessOutline,locationOutline,calendarOutline,statsChartOutline,storefrontOutline,searchOutline,close,refreshOutline,cardOutline,personOutline,callOutline,chevronForwardOutline,addOutline,mapOutline,listOutline,createOutline,checkmarkCircleOutline,closeCircleOutline,timeOutline,helpCircleOutline});
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.mercadoId.set(id);
      this.loadMercado(id);
    }
  }  private async loadMercado(id: string) {
    try {
      this.isLoading.set(true);
      console.log('Loading mercado with ID:', id);
      const response = await this.mercadosService.getMarketById(id).toPromise();
      console.log('API Response:', response);
      
      // Handle both response formats: direct object or wrapped in data property
      let mercadoData: any = null;
      if (response && 'data' in response && response.data) {
        // Wrapped format: { data: mercado }
        mercadoData = response.data;
        console.log('Using wrapped format - Mercado data:', mercadoData);
      } else if (response && 'id' in response) {
        // Direct format: mercado object directly
        mercadoData = response;
        console.log('Using direct format - Mercado data:', mercadoData);
      }
      
      if (mercadoData) {
        this.mercado.set(mercadoData);
        console.log('Mercado data set successfully');
        console.log('Locales count:', mercadoData.locales?.length);
        console.log('Mercado signal value after set:', this.mercado());
      } else {
        console.error('Invalid response format:', response);
        this.mercado.set(null);
      }
    } catch (error) {
      console.error('Error loading mercado:', error);
      this.mercado.set(null);
    } finally {
      this.isLoading.set(false);
      console.log('Loading finished, isLoading:', this.isLoading());
      console.log('Final mercado value:', this.mercado());
      console.log('Condition check: !isLoading() && mercado():', !this.isLoading() && !!this.mercado());
    }
  }

  editMercado() {
    if (this.mercadoId()) {
      this.router.navigate(['/mercados/editar', this.mercadoId()]);
    }
  }

  viewInMap() {
    const market = this.mercado();
    if (market) {
      const url = `https://www.google.com/maps?q=${market.latitud},${market.longitud}`;
      window.open(url, '_blank');
    }
  }

  viewLocales() {
    if (this.mercadoId()) {
      this.router.navigate(['/locales'], { 
        queryParams: { mercado: this.mercadoId() } 
      });
    }
  }

  getStatusColor(isActive: boolean): string {
    return isActive ? 'success' : 'danger';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Activo' : 'Inactivo';
  }  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Manejar cambios en el campo de búsqueda
   */
  onSearchChange(event: any) {
    this.searchTerm.set(event.target.value || '');
  }

  /**
   * Limpiar la búsqueda
   */
  clearSearch() {
    this.searchTerm.set('');
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
   * Agregar nuevo local al mercado
   */
  addLocal() {
    this.router.navigate(['/locales/nuevo'], {
      queryParams: { mercado: this.mercadoId() }
    });
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
