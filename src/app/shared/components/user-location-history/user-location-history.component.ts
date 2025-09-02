import {
  Component,
  OnInit,
  Input,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { StatsService } from '../../services/stats.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  UserLocationHistoryResponse,
  UserLocationHistoryItem,
  LocationHistoryFilter,
} from '../../interfaces/user.interface';
import { addIcons } from 'ionicons';
import {
  locationOutline,
  timeOutline,
  calendarOutline,
  personOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  refreshOutline,
  chevronForwardOutline,
  eyeOutline,
} from 'ionicons/icons';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-user-location-history',
  templateUrl: './user-location-history.component.html',
  styleUrls: ['./user-location-history.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class UserLocationHistoryComponent implements OnInit {
  // Injected Services
  private readonly statsService = inject(StatsService);
  private readonly authService = inject(AuthService);
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);
  private readonly destroyRef = inject(DestroyRef);

  // Input properties
  @Input() userId?: string;
  @Input() showHeader: boolean = true;
  @Input() maxItems?: number; // Para mostrar solo las últimas N ubicaciones
  @Input() compact: boolean = false; // Modo compacto para dashboard

  // Component State
  locationHistory = signal<UserLocationHistoryItem[]>([]);
  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Pagination State
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  totalRecords = signal<number>(0);
  hasMoreData = signal<boolean>(false);

  // Filter State
  currentFilter = signal<LocationHistoryFilter>({
    page: 1,
    limit: this.maxItems || 10,
    sortBy: 'assignedAt',
    sortOrder: 'desc',
  });

  // Computed Properties
  canLoadMore = computed(() => {
    return this.hasMoreData() && !this.isLoading() && !this.maxItems;
  });

  hasData = computed(() => {
    return this.locationHistory().length > 0;
  });

  isCurrentUser = computed(() => {
    const user = this.authService.user();
    return !this.userId || this.userId === user?.id;
  });

  activeLocationsCount = computed(() => {
    return this.locationHistory().filter((l) => l.isActive).length;
  });

  // Store the current location from API response
  currentLocationData = signal<any>(null);

  currentLocation = computed(() => {
    // First try to get from the stored current location data
    const currentLoc = this.currentLocationData();
    if (currentLoc) return currentLoc;

    // Fallback to finding active location in history
    return this.locationHistory().find((l) => l.isActive);
  });

  recentLocations = computed(() => {
    const history = this.locationHistory();
    if (this.compact) {
      return history.slice(0, 3); // Solo las 3 más recientes en modo compacto
    }
    return history;
  });

  constructor() {
    // Register icons
    addIcons({
      locationOutline,
      timeOutline,
      calendarOutline,
      personOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      refreshOutline,
      chevronForwardOutline,
      eyeOutline,
    });
  }

  async ngOnInit() {
    await this.loadLocationHistory();
  }

  /**
   * Load location history data
   */
  async loadLocationHistory(append: boolean = false): Promise<void> {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.hasError.set(false);

    try {
      const filter = this.currentFilter();
      console.log('🔄 Loading location history with filter:', filter);

      if (this.isCurrentUser()) {
        // Load current user's history
        const currentUser = this.authService.user();
        if (!currentUser?.id) {
          throw new Error('Usuario no autenticado');
        }

        console.log('👤 Loading history for current user:', currentUser.id);

        this.statsService
          .getMyLocationHistory(currentUser.id, filter)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (response) => {
              console.log('📡 Raw response received:', response);
              this.processLocationHistoryResponse(response, append);
            },
            error: (error) => {
              console.error('❌ Error in subscription:', error);
              this.hasError.set(true);
              this.handleError(error);
              this.isLoading.set(false);
            },
          });
      } else if (this.userId) {
        // Load specific user's history (admin only)
        console.log('👥 Loading history for user:', this.userId);

        this.statsService
          .getUserLocationHistory(this.userId!, filter)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (response) => {
              console.log('📡 Raw response received:', response);
              this.processLocationHistoryResponse(response, append);
            },
            error: (error) => {
              console.error('❌ Error in subscription:', error);
              this.hasError.set(true);
              this.handleError(error);
              this.isLoading.set(false);
            },
          });
      } else {
        throw new Error('No user ID provided');
      }
    } catch (error: any) {
      console.error('❌ Error in loadLocationHistory:', error);
      this.hasError.set(true);
      this.handleError(error);
      this.isLoading.set(false);
    }
  }

  /**
   * Process the location history response
   */
  private processLocationHistoryResponse(response: any, append: boolean): void {
    try {
      console.log('🔍 Processing response:', response);

      // Validate response structure
      if (!response) {
        throw new Error('Respuesta vacía del servidor');
      }

      // Handle different response formats
      let processedResponse: UserLocationHistoryResponse;

      if (response.userId && response.locationHistory) {
        // Direct API response format (UserLocationHistoryResponse)
        processedResponse = response as UserLocationHistoryResponse;
      } else if (response.success && response.data) {
        // Wrapped response format
        processedResponse = response.data as UserLocationHistoryResponse;
      } else if (Array.isArray(response)) {
        // Direct array response - create a UserLocationHistoryResponse
        processedResponse = {
          userId: this.userId || this.authService.user()?.id || '',
          username: '',
          nombre: '',
          apellido: '',
          currentLocation: null,
          locationHistory: response,
          totalLocations: response.length,
          firstAssignedAt: '',
          lastAssignedAt: '',
          consultationStats: {
            icsNormal: 0,
            icsAmnistia: 0,
            ecNormal: 0,
            ecAmnistia: 0,
            totalExitosas: 0,
            totalErrores: 0,
            totalConsultas: 0,
            promedioDuracionMs: 0,
            totalAcumulado: 0
          }
        };
      } else {
        console.warn(
          '⚠️ Unexpected response format, trying to adapt:',
          response
        );
        processedResponse = response as UserLocationHistoryResponse;
      }

      if (processedResponse && processedResponse.locationHistory) {
        const newHistory = processedResponse.locationHistory || [];
        console.log('📋 Processing history items:', newHistory.length);

        // Store current location data separately
        if (processedResponse.currentLocation) {
          this.currentLocationData.set(processedResponse.currentLocation);
        }

        if (append) {
          // Append new data for infinite scroll
          const currentHistory = this.locationHistory();
          this.locationHistory.set([...currentHistory, ...newHistory]);
        } else {
          // Replace data for refresh
          this.locationHistory.set(newHistory);
        }

        // Update pagination info (simplified since API doesn't provide pagination for individual user)
        this.currentPage.set(1);
        this.totalPages.set(1);
        this.totalRecords.set(
          processedResponse.totalLocations || newHistory.length
        );
        this.hasMoreData.set(false); // No pagination for individual user history

        // Apply maxItems limit if specified
        if (this.maxItems && this.locationHistory().length > this.maxItems) {
          this.locationHistory.set(
            this.locationHistory().slice(0, this.maxItems)
          );
          this.hasMoreData.set(false);
        }

        console.log('✅ Location history processed successfully:', {
          totalItems: this.locationHistory().length,
          totalRecords: this.totalRecords(),
          currentPage: this.currentPage(),
          totalPages: this.totalPages(),
          hasMoreData: this.hasMoreData(),
          currentLocation: this.currentLocationData(),
          userInfo: {
            userId: processedResponse.userId,
            username: processedResponse.username,
            nombre: processedResponse.nombre,
            apellido: processedResponse.apellido,
          },
        });
      } else {
        throw new Error(
          'Formato de respuesta inválido: no se encontró locationHistory'
        );
      }
    } catch (error: any) {
      console.error('❌ Error processing response:', error);
      this.hasError.set(true);
      this.handleError(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Refresh data
   */
  async refreshData(event?: any): Promise<void> {
    this.currentFilter.update((filter) => ({ ...filter, page: 1 }));
    this.currentPage.set(1);

    try {
      await this.loadLocationHistory(false);
      if (!this.compact) {
        await this.showSuccessToast('Datos actualizados');
      }
    } finally {
      event?.target?.complete?.();
    }
  }

  /**
   * Load more data for infinite scroll
   */
  async loadMoreData(event?: any): Promise<void> {
    if (!this.canLoadMore()) {
      event?.target?.complete?.();
      return;
    }

    const nextPage = this.currentPage() + 1;
    this.currentFilter.update((filter) => ({ ...filter, page: nextPage }));

    try {
      await this.loadLocationHistory(true);
    } finally {
      event?.target?.complete?.();
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  /**
   * Format datetime for display
   */
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Get relative time
   */
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
    return `Hace ${Math.floor(diffDays / 365)} años`;
  }

  /**
   * Get duration text
   */
  getDurationText(days: number): string {
    if (days === 0) return 'Menos de 1 día';
    if (days === 1) return '1 día';
    if (days < 30) return `${days} días`;
    if (days < 365) {
      const months = Math.floor(days / 30);
      return `${months} mes${months > 1 ? 'es' : ''}`;
    }
    const years = Math.floor(days / 365);
    return `${years} año${years > 1 ? 's' : ''}`;
  }

  /**
   * Get status color
   */
  getStatusColor(isActive: boolean): string {
    return isActive ? 'success' : 'medium';
  }

  /**
   * Get status text
   */
  getStatusText(isActive: boolean): string {
    return isActive ? 'Activa' : 'Inactiva';
  }

  /**
   * Handle errors
   */
  private handleError(error: any): void {
    let message = 'Error desconocido';

    switch (error.status) {
      case 0:
        message = 'Sin conexión a internet';
        break;
      case 401:
        message = 'Sesión expirada';
        break;
      case 403:
        message = 'Sin permisos suficientes';
        break;
      case 404:
        message = 'Historial no encontrado';
        break;
      case 500:
        message = 'Error del servidor';
        break;
      default:
        message = error.message || 'Error al cargar historial';
    }

    this.errorMessage.set(message);
    if (!this.compact) {
      this.showErrorToast(message);
    }
  }

  /**
   * Show success toast
   */
  private async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
      color: 'success',
    });
    await toast.present();
  }

  /**
   * Show error toast
   */
  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'danger',
    });
    await toast.present();
  }

  /**
   * Show location details
   */
  async showLocationDetails(location: UserLocationHistoryItem): Promise<void> {
    const locationName =
      location.locationName || location.description || 'Sin nombre';
    const locationCode = location.locationCode || 'Sin código';

    const alert = await this.alertController.create({
      header: 'Detalles de Ubicación',
      message: `
        <strong>Ubicación:</strong> ${locationName}<br>
        ${
          location.locationCode
            ? `<strong>Código:</strong> ${locationCode}<br>`
            : ''
        }
        <strong>Asignada:</strong> ${this.formatDateTime(
          location.assignedAt
        )}<br>
        ${
          location.deactivatedAt
            ? `<strong>Desactivada:</strong> ${this.formatDateTime(
                location.deactivatedAt
              )}<br>`
            : ''
        }
        <strong>Duración:</strong> ${this.getDurationText(
          location.durationDays
        )}<br>
        <strong>Asignada por:</strong> ${location.assignedByUsername}<br>
        <strong>Estado:</strong> ${this.getStatusText(location.isActive)}
      `,
      buttons: ['Cerrar'],
    });
    await alert.present();
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByLocationId(_index: number, location: UserLocationHistoryItem): string {
    return location.id;
  }
}
