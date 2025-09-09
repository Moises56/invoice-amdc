import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  OnDestroy,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonIcon,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  AlertController,
  ToastController,
  ModalController,
} from '@ionic/angular/standalone';

import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { StatsService } from 'src/app/shared/services/stats.service';
import { UserStats, UserLocationHistoryResponse } from 'src/app/shared/interfaces/user.interface';
import { addIcons } from 'ionicons';
import {
  personOutline,
  analyticsOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  checkmarkCircle,
  closeCircle,
  closeOutline,
  location,
  calendarClearOutline,
  chevronUpOutline,
  chevronDownOutline,
  searchOutline,
  trendingUpOutline,
  trendingDownOutline,
  timeOutline,
  refreshOutline,
  warningOutline,
  documentTextOutline,
  barChartOutline,
  pieChartOutline,
  statsChartOutline,
  businessOutline,
  calendarOutline,
  eyeOutline,
  settingsOutline,
  shieldCheckmarkOutline,
  chevronForwardOutline,
  listOutline,
  ribbonOutline,
  bluetoothOutline,
  notificationsOutline,
  alertCircleOutline,
  arrowForwardOutline,
  arrowDownOutline,
  locationOutline, cashOutline } from 'ionicons/icons';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.page.html',
  styleUrls: ['./user-dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonButton,
    IonIcon,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
  ],
})
export class UserDashboardPage implements OnInit, OnDestroy {
  // Injected Services
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly statsService = inject(StatsService);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
  private readonly modalController = inject(ModalController);

  private readonly destroyRef = inject(DestroyRef);

  // User data signals
  userName = signal<string>('');
  lastRefreshTime = signal<Date>(new Date());

  // Stats signals
  userStats = signal<UserStats | null>(null);
  isLoadingStats = signal<boolean>(false);
  hasStatsError = signal<boolean>(false);
  statsErrorMessage = signal<string>('');

  // Location history signals
  userLocationHistory = signal<UserLocationHistoryResponse | null>(null);
  isLoadingLocationHistory = signal<boolean>(false);
  hasLocationError = signal<boolean>(false);
  locationErrorMessage = signal<string>('');

  // Auto-refresh setup using takeUntilDestroyed in injection context
  private autoRefresh$ = interval(300000).pipe(
    takeUntilDestroyed(this.destroyRef)
  );

  // Computed Properties
  canAccessGeneralStats = computed(() => {
    const user = this.authService.user();
    return user?.role === 'USER-ADMIN';
  });

  formattedStats = computed(() => {
    const stats = this.userStats();
    if (!stats) return null;

    return {
      ...stats,
      // Performance calculations
      percentageEC: this.calculatePercentage(
        stats.consultasEC,
        stats.totalConsultas
      ),
      percentageICS: this.calculatePercentage(
        stats.consultasICS,
        stats.totalConsultas
      ),
      successRate: this.calculatePercentage(
        stats.consultasExitosas,
        stats.totalConsultas
      ),
      errorRate: this.calculatePercentage(
        stats.consultasConError,
        stats.totalConsultas
      ),

      // Growth indicators
      hasActivity: stats.totalConsultas > 0,
      isActiveUser: this.isRecentActivity(stats.ultimaConsulta),

      // Data mapping for template compatibility
      consultasPorModulo: {
        ics: stats.consultasICS,
        ec: stats.consultasEC,
        amnistia: 0,
      },
      ultimaActividad: stats.ultimaConsulta,

      // User engagement metrics
      engagementLevel: this.calculateEngagementLevel(stats),
    };
  });

  constructor() {
    // Register all required icons
    addIcons({notificationsOutline,personOutline,calendarOutline,timeOutline,analyticsOutline,checkmarkCircleOutline,alertCircleOutline,refreshOutline,location,chevronForwardOutline,documentTextOutline,arrowForwardOutline,shieldCheckmarkOutline,barChartOutline,trendingUpOutline,locationOutline,bluetoothOutline,eyeOutline,cashOutline,warningOutline,settingsOutline,checkmarkCircle,closeCircle,closeOutline,calendarClearOutline,chevronUpOutline,chevronDownOutline,searchOutline,statsChartOutline,closeCircleOutline,pieChartOutline,businessOutline,listOutline,ribbonOutline,trendingDownOutline,arrowDownOutline,});
  }

  async ngOnInit() {
    await this.initializeComponent();
    this.setupAutoRefresh();
  }

  ngOnDestroy() {
    // DestroyRef handles cleanup automatically
  }

  /**
   * Initialize component with user data and stats
   */
  private async initializeComponent(): Promise<void> {
    try {
      // Set user name
      const name = this.authService.userName();
      this.userName.set(name && name.trim() ? name : 'Usuario');

      // Load initial stats and location history
      await Promise.all([
        this.loadUserStats(),
        this.loadUserLocationHistory()
      ]);

      // Show welcome message for first-time users
      if (!this.userStats()?.totalConsultas) {
        await this.showWelcomeMessage();
      }
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      await this.showErrorToast('Error al inicializar el dashboard');
    }
  }

  /**
   * Setup automatic refresh every 5 minutes
   */
  private setupAutoRefresh(): void {
    this.autoRefresh$.subscribe(() => {
      this.loadUserStats(true); // Silent refresh
      this.loadUserLocationHistory(true); // Silent refresh
    });
  }

  /**
   * Load user statistics with enhanced error handling
   */
  async loadUserStats(silentRefresh: boolean = false): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      this.handleAuthError();
      return;
    }

    if (!silentRefresh) {
      this.isLoadingStats.set(true);
    }

    this.hasStatsError.set(false);
    this.statsErrorMessage.set('');

    try {
      // console.log('Loading user statistics...');
      const response = await new Promise<UserStats>((resolve, reject) => {
        this.statsService.getMyStats().subscribe({
          next: (data) => resolve(data),
          error: (error) => reject(error),
        });
      });

      if (response && response.userId) {
        this.userStats.set(response);
        this.lastRefreshTime.set(new Date());
        // console.log('Statistics loaded successfully:', response);

        if (!silentRefresh) {
          await this.showSuccessToast('Datos actualizados');
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Error loading user statistics:', error);
      this.hasStatsError.set(true);
      this.handleStatsError(error, silentRefresh);
    } finally {
      this.isLoadingStats.set(false);
    }
  }

  /**
   * Load user location history with consultation statistics
   */
  async loadUserLocationHistory(silentRefresh: boolean = false): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      this.handleAuthError();
      return;
    }

    if (!silentRefresh) {
      this.isLoadingLocationHistory.set(true);
    }

    this.hasLocationError.set(false);
    this.locationErrorMessage.set('');

    try {
      // console.log('Loading user location history...');
      const response = await new Promise<UserLocationHistoryResponse>((resolve, reject) => {
        this.statsService.getMyLocationHistory().subscribe({
          next: (data) => resolve(data),
          error: (error) => reject(error),
        });
      });

      if (response && response.userId) {
        this.userLocationHistory.set(response);
        // console.log('Location history loaded successfully:', response);
        // console.log('TypeConsultaHistory in response:', response.typeConsultaHistory);
        // console.log('TypeConsultaHistory length:', response.typeConsultaHistory?.length || 0);
        // console.log('Full response structure:', JSON.stringify(response, null, 2));

        if (!silentRefresh) {
          await this.showSuccessToast('Historial de ubicaciones actualizado');
        }
      } else {
        throw new Error('Invalid location history response format');
      }
    } catch (error: any) {
      console.error('Error loading user location history:', error);
      this.hasLocationError.set(true);
      this.handleLocationError(error, silentRefresh);
    } finally {
      this.isLoadingLocationHistory.set(false);
    }
  }

  /**
   * Handle location history errors
   */
  private handleLocationError(error: any, silentRefresh: boolean): void {
    let errorMessage = 'Error desconocido al cargar ubicaciones';

    switch (error.status) {
      case 0:
        errorMessage = 'Sin conexión a internet';
        break;
      case 401:
        errorMessage = 'Sesión expirada';
        this.handleAuthError();
        return;
      case 403:
        errorMessage = 'Sin permisos para ver ubicaciones';
        break;
      case 404:
        errorMessage = 'Servicio de ubicaciones no disponible';
        break;
      case 500:
        errorMessage = 'Error del servidor de ubicaciones';
        break;
      default:
        errorMessage = `Error ${error.status}: ${
          error.message || 'Error del servidor de ubicaciones'
        }`;
    }

    this.locationErrorMessage.set(errorMessage);

    if (!silentRefresh) {
      this.showErrorToast(errorMessage);
    }
  }

  /**
   * Handle different types of errors
   */
  private handleStatsError(error: any, silentRefresh: boolean): void {
    let errorMessage = 'Error desconocido';

    switch (error.status) {
      case 0:
        errorMessage = 'Sin conexión a internet';
        break;
      case 401:
        errorMessage = 'Sesión expirada';
        this.handleAuthError();
        return;
      case 403:
        errorMessage = 'Sin permisos suficientes';
        break;
      case 404:
        errorMessage = 'Servicio no disponible';
        break;
      case 500:
        errorMessage = 'Error del servidor';
        break;
      default:
        errorMessage = `Error ${error.status}: ${
          error.message || 'Error del servidor'
        }`;
    }

    this.statsErrorMessage.set(errorMessage);

    if (!silentRefresh) {
      this.showErrorToast(errorMessage);
    }
  }

  /**
   * Handle authentication errors
   */
  private async handleAuthError(): Promise<void> {
    await this.showAuthErrorAlert();
    this.router.navigate(['/login']);
  }

  /**
   * Navigation methods with loading states
   */
  async goTo(path: string): Promise<void> {
    try {
      await this.router.navigate([path]);
    } catch (error) {
      console.error(`Navigation error to ${path}:`, error);
      await this.showErrorToast('Error de navegación');
    }
  }

  async goToGeneralStats(): Promise<void> {
    if (!this.canAccessGeneralStats()) {
      await this.showErrorToast(
        'No tienes permisos para acceder a esta sección'
      );
      return;
    }
    await this.goTo('/general-stats');
  }

  async goToActivityLogs(): Promise<void> {
    if (!this.canAccessGeneralStats()) {
      await this.showErrorToast(
        'No tienes permisos para acceder a esta sección'
      );
      return;
    }
    await this.goTo('/activity-logs');
  }

  async goToRecaudacionStats(): Promise<void> {
    if (!this.canAccessGeneralStats()) {
      await this.showErrorToast(
        'No tienes permisos para acceder a esta sección'
      );
      return;
    }
    await this.goTo('/recaudacion-stats');
  }

  async goToAllUsersLocations(): Promise<void> {
    if (!this.canAccessGeneralStats()) {
      await this.showErrorToast(
        'No tienes permisos para acceder a esta sección'
      );
      return;
    }
    await this.goTo('/all-users-locations');
  }

  /**
   * Open location history modal
   */
  /**
   * Navigate to location history page with tabs
   */
  async openMyLocationHistoryModal(): Promise<void> {
    try {
      await this.router.navigate(['/mi-historial-ubicacion']);
    } catch (error) {
      console.error('Error navigating to location history page:', error);
      await this.showErrorToast('Error al navegar al historial de ubicaciones');
    }
  }

  /**
   * Navigate to all users locations page (USER-ADMIN only)
   */
  async goToLocationHistory(): Promise<void> {
    try {
      await this.router.navigate(['/all-users-locations']);
    } catch (error) {
      console.error('Error navigating to all users locations:', error);
      await this.showErrorToast('Error al navegar al historial de ubicaciones');
    }
  }

  /**
   * Refresh stats with pull-to-refresh
   */
  async refreshStats(event?: any): Promise<void> {
    try {
      await Promise.all([
        this.loadUserStats(),
        this.loadUserLocationHistory()
      ]);
    } finally {
      event?.target?.complete?.();
    }
  }

  /**
   * Utility methods
   */
  private calculatePercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  private isRecentActivity(dateString: string | undefined): boolean {
    if (!dateString) return false;

    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    return diffHours <= 24; // Active if last activity was within 24 hours
  }

  private calculateEngagementLevel(
    stats: UserStats
  ): 'low' | 'medium' | 'high' {
    const totalConsultas = stats.totalConsultas || 0;
    const successRate = this.calculatePercentage(
      stats.consultasExitosas,
      totalConsultas
    );

    if (totalConsultas === 0) return 'low';
    if (totalConsultas >= 50 && successRate >= 80) return 'high';
    if (totalConsultas >= 20 || successRate >= 60) return 'medium';
    return 'low';
  }

  /**
   * Date formatting utilities
   */
  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'No disponible';

    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getRelativeTime(dateString: string | undefined): string {
    if (!dateString) return 'Sin actividad';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Ahora mismo';
    if (diffMinutes < 60)
      return `Hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
    if (diffHours < 24)
      return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    if (diffDays < 30)
      return `Hace ${Math.floor(diffDays / 7)} semana${
        Math.floor(diffDays / 7) > 1 ? 's' : ''
      }`;

    return date.toLocaleDateString('es-ES');
  }

  /**
   * Chart visualization utility
   */
  getBarHeight(field: keyof UserStats): number {
    const stats = this.formattedStats();
    if (!stats) return 15;

    const value = (stats[field] as number) || 0;

    // Find maximum value for normalization
    const maxValue = Math.max(
      stats.totalConsultas || 0,
      stats.consultasEC || 0,
      stats.consultasICS || 0,
      stats.consultasExitosas || 0
    );

    if (maxValue === 0) return 15;
    if (value === 0) return 15;

    // Calculate percentage with min 20% and max 100%
    const percentage = Math.max(20, Math.min(100, (value / maxValue) * 100));
    return percentage;
  }

  /**
   * UI Feedback methods
   */
  private async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
      color: 'success',
      cssClass: 'custom-toast',
    });
    await toast.present();
  }

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'danger',
      cssClass: 'custom-toast',
    });
    await toast.present();
  }

  private async showWelcomeMessage(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Bienvenido',
      message: `Hola ${this.userName()}, este es tu panel de control. Aquí podrás acceder a todos los servicios disponibles.`,
      buttons: ['Entendido'],
      cssClass: 'custom-alert',
    });
    await alert.present();
  }

  private async showAuthErrorAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Sesión Expirada',
      message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
      buttons: ['OK'],
      cssClass: 'custom-alert',
    });
    await alert.present();
  }

  /**
   * Performance monitoring
   */
  getStatsHealthStatus(): 'excellent' | 'good' | 'warning' | 'critical' {
    const stats = this.formattedStats();
    if (!stats) return 'critical';

    const successRate = stats.successRate || 0;
    const hasRecentActivity = stats.isActiveUser;

    if (successRate >= 90 && hasRecentActivity) return 'excellent';
    if (successRate >= 75 && hasRecentActivity) return 'good';
    if (successRate >= 50 || hasRecentActivity) return 'warning';
    return 'critical';
  }

  getHealthStatusColor(): string {
    const status = this.getStatsHealthStatus();
    const colors = {
      excellent: 'var(--color-success)',
      good: 'var(--color-info)',
      warning: 'var(--color-warning)',
      critical: 'var(--color-error)',
    };
    return colors[status];
  }

  getHealthStatusMessage(): string {
    const status = this.getStatsHealthStatus();
    const messages = {
      excellent: 'Excelente rendimiento',
      good: 'Buen rendimiento',
      warning: 'Rendimiento regular',
      critical: 'Requiere atención',
    };
    return messages[status];
  }

  /**
   * Accessibility helpers
   */
  getStatCardAriaLabel(title: string, value: number | string): string {
    return `${title}: ${value}`;
  }

  getServiceCardAriaLabel(title: string, description: string): string {
    return `Servicio ${title}: ${description}`;
  }

  /**
   * Debug helpers (development only)
   */
  logCurrentStats(): void {
    if (
      typeof window !== 'undefined' &&
      (window as any).location?.hostname === 'localhost'
    ) {
      console.table(this.formattedStats());
    }
  }
}
