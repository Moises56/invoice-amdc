import { 
  Component, 
  OnInit, 
  inject, 
  signal, 
  computed, 
  DestroyRef 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController, ModalController } from '@ionic/angular';
import { UserDetailsModalComponent } from './user-details-modal.component';
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
  searchOutline,
  filterOutline,
  alertCircleOutline,
  chevronForwardOutline,
  listOutline,
  layersOutline,
} from 'ionicons/icons';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-all-users-location-history',
  templateUrl: './all-users-location-history.component.html',
  styleUrls: ['./all-users-location-history.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class AllUsersLocationHistoryComponent implements OnInit {
  // Injected Services
  private readonly statsService = inject(StatsService);
  private readonly authService = inject(AuthService);
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);
  private readonly modalController = inject(ModalController);
  private readonly destroyRef = inject(DestroyRef);

  // Component State
  allUsersData = signal<UserLocationHistoryResponse[]>([]);
  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Filter State
  currentFilter = signal<LocationHistoryFilter>({
    page: 1,
    limit: 50,
    sortBy: 'assignedAt',
    sortOrder: 'desc',
  });

  // Search State
  searchTerm = signal<string>('');
  isSearching = signal<boolean>(false);

  // Computed Properties
  hasData = computed(() => {
    return this.allUsersData().length > 0;
  });

  isAdmin = computed(() => {
    const user = this.authService.user();
    return user?.role === 'USER-ADMIN';
  });

  canViewLocationHistory = computed(() => {
    const user = this.authService.user();
    // Allow all authenticated users to view location history
    return !!user;
  });

  totalUsers = computed(() => {
    return this.allUsersData().length;
  });

  totalActiveLocations = computed(() => {
    return this.allUsersData().filter(user => user.currentLocation?.isActive).length;
  });

  totalLocationsAssigned = computed(() => {
    return this.allUsersData().reduce((total, user) => total + user.totalLocations, 0);
  });

  filteredUsersData = computed(() => {
    const users = this.allUsersData();
    const search = this.searchTerm().toLowerCase();
    
    if (!search) return users;
    
    return users.filter(user => 
      user.username.toLowerCase().includes(search) ||
      user.nombre.toLowerCase().includes(search) ||
      user.apellido.toLowerCase().includes(search) ||
      user.currentLocation?.locationName.toLowerCase().includes(search)
    );
  });

  constructor() {
    // console.log('🏗️ AllUsersLocationHistoryComponent constructor called');
    
    // Register icons
    addIcons({
      locationOutline,
      timeOutline,
      calendarOutline,
      personOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      refreshOutline,
      searchOutline,
      filterOutline,
      alertCircleOutline,
      chevronForwardOutline,
      listOutline,
      layersOutline,
    });
  }

  async ngOnInit() {
    // console.log('🔄 AllUsersLocationHistory ngOnInit started');
    const user = this.authService.user();
    // console.log('👤 Current user:', user);
    // console.log('🔐 Can view location history:', this.canViewLocationHistory());
    
    if (!this.canViewLocationHistory()) {
      // console.log('❌ User does not have permission to view location history');
      await this.showErrorToast('No tienes permisos para acceder a esta información');
      return;
    }
    
    // console.log('✅ Loading all users location history...');
    await this.loadAllUsersLocationHistory();
  }

  /**
   * Load all users location history data
   */
  async loadAllUsersLocationHistory(append: boolean = false): Promise<void> {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.hasError.set(false);

    try {
      const filter = this.currentFilter();
      // console.log('🔄 Loading all users location history with filter:', filter);

      this.statsService
        .getAllUsersLocationHistory(filter)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            // console.log('📡 Raw response received:', response);
            this.processAllUsersLocationHistoryResponse(response, append);
          },
          error: (error) => {
            console.error('❌ Error in subscription:', error);
            this.hasError.set(true);
            this.handleError(error);
            this.isLoading.set(false);
          },
        });
    } catch (error: any) {
      console.error('❌ Error in loadAllUsersLocationHistory:', error);
      this.hasError.set(true);
      this.handleError(error);
      this.isLoading.set(false);
    }
  }

  /**
   * Process the all users location history response
   */
  private processAllUsersLocationHistoryResponse(response: any, append: boolean): void {
    try {
      // console.log('🔍 Processing all users response:', response);
      
      // Validate response structure
      if (!response) {
        throw new Error('Respuesta vacía del servidor');
      }

      // The API returns an array of UserLocationHistoryResponse directly
      let usersData: UserLocationHistoryResponse[];
      
      if (Array.isArray(response)) {
        // Direct array response (expected format)
        usersData = response;
      } else if (response.success && response.data && Array.isArray(response.data)) {
        // Wrapped response format
        usersData = response.data;
      } else {
        console.warn('⚠️ Unexpected response format, trying to adapt:', response);
        usersData = Array.isArray(response) ? response : [response];
      }

      // console.log('📋 Processing users data:', usersData.length, 'users');
      // console.log('📋 Sample user data:', usersData[0]);

      if (append) {
        // Append new data (not typically used for this endpoint)
        const currentData = this.allUsersData();
        this.allUsersData.set([...currentData, ...usersData]);
        // console.log('📋 Appended data, total users now:', this.allUsersData().length);
      } else {
        // Replace data for refresh
        this.allUsersData.set(usersData);
        // console.log('📋 Set new data, total users:', this.allUsersData().length);
      }

      // console.log('✅ All users location history processed successfully:', {
      //   totalUsers: this.totalUsers(),
      //   totalActiveLocations: this.totalActiveLocations(),
      //   totalLocationsAssigned: this.totalLocationsAssigned(),
      //   hasData: this.hasData(),
      //   filteredUsersCount: this.filteredUsersData().length
      // });
    } catch (error: any) {
      console.error('❌ Error processing all users response:', error);
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
    try {
      await this.loadAllUsersLocationHistory(false);
      await this.showSuccessToast('Datos actualizados');
    } finally {
      event?.target?.complete?.();
    }
  }

  /**
   * Search functionality
   */
  onSearchInput(event: any): void {
    const value = event.target.value || '';
    this.searchTerm.set(value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
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
   * Get current time for header
   */
  getCurrentTime(): string {
    return new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
        message = 'Datos no encontrados';
        break;
      case 500:
        message = 'Error del servidor';
        break;
      default:
        message = error.message || 'Error al cargar datos';
    }

    this.errorMessage.set(message);
    this.showErrorToast(message);
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
   * Show user details in a modern modal
   */
  async showUserDetails(user: UserLocationHistoryResponse): Promise<void> {
    const modal = await this.modalController.create({
      component: UserDetailsModalComponent,
      componentProps: {
        user: user
      },
      cssClass: 'user-details-modal',
      breakpoints: [0, 0.5, 0.8, 1],
      initialBreakpoint: 0.8
    });
    
    await modal.present();
  }

  /**
   * Create modern HTML for user details modal
   */
  private createUserDetailsHTML(user: UserLocationHistoryResponse): string {
    const currentLoc = user.currentLocation;
    
    return `
      <div class="user-details-container">
        <!-- User Avatar and Basic Info -->
        <div class="user-header-section">
          <div class="user-avatar-large">
            ${(user.nombre.charAt(0) || '') + (user.apellido.charAt(0) || '')}
          </div>
          <div class="user-basic-info">
            <h3 class="user-full-name">${user.nombre} ${user.apellido}</h3>
            <p class="user-username">@${user.username}</p>
            <div class="user-status-badge ${currentLoc?.isActive ? 'active' : 'inactive'}">
              ${currentLoc?.isActive ? '🟢 Activo' : '🔴 Inactivo'}
            </div>
          </div>
        </div>

        <!-- Current Location Section -->
        <div class="details-section">
          <div class="section-header">
            <ion-icon name="location-outline"></ion-icon>
            <h4>Ubicación Actual</h4>
          </div>
          <div class="section-content">
            ${currentLoc ? `
              <div class="current-location-card">
                <div class="location-name">${currentLoc.locationName}</div>
                ${currentLoc.locationCode ? `<div class="location-code">Código: ${currentLoc.locationCode}</div>` : ''}
                ${currentLoc.description ? `<div class="location-description">${currentLoc.description}</div>` : ''}
                <div class="location-meta">
                  <div class="meta-item">
                    <span class="meta-label">📅 Asignada:</span>
                    <span class="meta-value">${this.formatDateTime(currentLoc.assignedAt)}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">⏱️ Duración:</span>
                    <span class="meta-value">${this.getDurationText(currentLoc.durationDays)}</span>
                  </div>
                  ${currentLoc.assignedByUsername ? `
                    <div class="meta-item">
                      <span class="meta-label">👤 Asignada por:</span>
                      <span class="meta-value">${currentLoc.assignedByUsername}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            ` : `
              <div class="no-location-card">
                <ion-icon name="location-outline"></ion-icon>
                <p>Sin ubicación asignada actualmente</p>
              </div>
            `}
          </div>
        </div>

        <!-- Statistics Section -->
        <div class="details-section">
          <div class="section-header">
            <ion-icon name="stats-chart-outline"></ion-icon>
            <h4>Estadísticas</h4>
          </div>
          <div class="section-content">
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-number">${user.totalLocations}</div>
                <div class="stat-label">Total Ubicaciones</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${user.locationHistory.filter(loc => loc.isActive).length}</div>
                <div class="stat-label">Activas</div>
              </div>
            </div>
            <div class="date-range">
              <div class="date-item">
                <span class="date-label">Primera asignación:</span>
                <span class="date-value">${this.formatDate(user.firstAssignedAt)}</span>
              </div>
              <div class="date-item">
                <span class="date-label">Última asignación:</span>
                <span class="date-value">${this.formatDate(user.lastAssignedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- History Section -->
        ${user.locationHistory.length > 0 ? `
          <div class="details-section">
            <div class="section-header">
              <ion-icon name="time-outline"></ion-icon>
              <h4>Historial Completo (${user.locationHistory.length})</h4>
            </div>
            <div class="section-content">
              <div class="history-list">
                ${user.locationHistory.map(loc => `
                  <div class="history-item ${loc.isActive ? 'active' : 'inactive'}">
                    <div class="history-header">
                      <span class="history-name">${loc.locationName}</span>
                      <span class="history-status ${loc.isActive ? 'active' : 'inactive'}">
                        ${loc.isActive ? 'Activa' : 'Finalizada'}
                      </span>
                    </div>
                    ${loc.locationCode ? `<div class="history-code">Código: ${loc.locationCode}</div>` : ''}
                    <div class="history-meta">
                      <span class="history-duration">${this.getDurationText(loc.durationDays)}</span>
                      <span class="history-date">${this.formatDate(loc.assignedAt)}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByUserId(_index: number, user: UserLocationHistoryResponse): string {
    return user.userId;
  }
}