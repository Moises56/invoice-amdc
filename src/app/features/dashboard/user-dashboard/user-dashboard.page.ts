import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonRefresher,
  IonRefresherContent,
  IonAvatar
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { StatsService } from 'src/app/shared/services/stats.service';
import { UserStats } from 'src/app/shared/interfaces/user.interface';
import { addIcons } from 'ionicons';
import {
  personOutline,
  analyticsOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
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
  menuOutline,
  notificationsOutline
} from 'ionicons/icons';

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
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSpinner,
    IonGrid,
    IonRow,
    IonCol,
    IonChip,
    IonRefresher,
    IonRefresherContent,
    IonAvatar
  ]
})

export class UserDashboardPage implements OnInit {
  userName = '';
  private statsService = inject(StatsService);
  
  // Señales para las estadísticas del usuario
  userStats = signal<UserStats | null>(null);
  isLoadingStats = signal<boolean>(false);
  hasStatsError = signal<boolean>(false);
  statsErrorMessage = signal<string>('');
  
  // Computed para determinar si se pueden mostrar estadísticas generales
  canAccessGeneralStats = computed(() => {
    const user = this.authService.user();
    return user?.role === 'USER-ADMIN';
  });

  // Computed para estadísticas con formato
  formattedStats = computed(() => {
    const stats = this.userStats();
    if (!stats) return null;
    
    return {
      ...stats,
      // Cálculos básicos basados en los datos disponibles
      percentageEC: stats.totalConsultas > 0 
        ? Math.round((stats.consultasEC / stats.totalConsultas) * 100) 
        : 0,
      percentageICS: stats.totalConsultas > 0 
        ? Math.round((stats.consultasICS / stats.totalConsultas) * 100) 
        : 0,
      successRate: stats.totalConsultas > 0 
        ? Math.round((stats.consultasExitosas / stats.totalConsultas) * 100) 
        : 0,
      errorRate: stats.totalConsultas > 0 
        ? Math.round((stats.consultasConError / stats.totalConsultas) * 100) 
        : 0,
      // Mapeo de campos para compatibilidad con el template
      consultasPorModulo: {
        ics: stats.consultasICS,
        ec: stats.consultasEC,
        amnistia: 0 // No tenemos este dato en la nueva estructura
      },
      ultimaActividad: stats.ultimaConsulta
    };
  });

  constructor(private router: Router, private authService: AuthService) {
    addIcons({notificationsOutline,personOutline,calendarOutline,searchOutline,documentTextOutline,statsChartOutline,eyeOutline,barChartOutline,warningOutline,refreshOutline,analyticsOutline,trendingUpOutline,checkmarkCircleOutline,closeCircleOutline,timeOutline,pieChartOutline,businessOutline,shieldCheckmarkOutline,chevronForwardOutline,listOutline,ribbonOutline,bluetoothOutline,trendingDownOutline,settingsOutline});
  }

  ngOnInit() {
    const name = this.authService.userName();
    this.userName = name && name.trim() ? name : '';
    this.loadUserStats();
  }

  /**
   * Cargar estadísticas del usuario
   */
  async loadUserStats() {
    if (!this.authService.isAuthenticated()) return;
    
    this.isLoadingStats.set(true);
    this.hasStatsError.set(false);
    this.statsErrorMessage.set('');
    
    try {
      console.log('🔄 Cargando estadísticas del usuario...');
      const response = await this.statsService.getMyStats().toPromise() as UserStats;
      
      console.log('📊 Respuesta del servidor (my-stats):', response);
      
      // El backend devuelve los datos directamente, no en un wrapper con success/data
      if (response && response.userId) {
        this.userStats.set(response);
        console.log('✅ Estadísticas cargadas exitosamente:', response);
      } else {
        console.warn('⚠️ Respuesta sin datos válidos:', response);
        this.hasStatsError.set(true);
        this.statsErrorMessage.set('No se pudieron obtener las estadísticas');
      }
    } catch (error: any) {
      console.error('❌ Error al cargar estadísticas del usuario:', error);
      this.hasStatsError.set(true);
      
      // Mensaje de error más específico
      if (error.status === 403) {
        this.statsErrorMessage.set('No tienes permisos para ver las estadísticas');
      } else if (error.status === 404) {
        this.statsErrorMessage.set('Endpoint de estadísticas no encontrado');
      } else if (error.status === 0) {
        this.statsErrorMessage.set('No se puede conectar con el servidor');
      } else {
        this.statsErrorMessage.set(`Error del servidor: ${error.status || 'Desconocido'}`);
      }
    } finally {
      this.isLoadingStats.set(false);
    }
  }

  /**
   * Navegar a una ruta específica
   */
  goTo(path: string) {
    this.router.navigate([path]);
  }

  /**
   * Navegar a estadísticas generales (solo para USER-ADMIN)
   */
  goToGeneralStats() {
    if (this.canAccessGeneralStats()) {
      this.router.navigate(['/general-stats']);
    }
  }

  /**
   * Navegar a estadísticas del usuario actual
   */
  goToUserStats() {
    // Navegar a la página de estadísticas personales que consume /api/user-stats/my-stats
    this.router.navigate(['/general-stats']);
  }

  /**
   * Navegar a logs de actividad (solo para USER-ADMIN)
   */
  goToActivityLogs() {
    if (this.canAccessGeneralStats()) {
      this.router.navigate(['/activity-logs']);
    }
  }

  /**
   * Refrescar estadísticas
   */
  async refreshStats() {
    await this.loadUserStats();
  }

  /**
   * Obtener fecha actual formateada
   */
  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-ES');
  }

  /**
   * Formatear fecha
   */
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'No disponible';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtener tiempo relativo
   */
  getRelativeTime(dateString: string | undefined): string {
    if (!dateString) return 'No disponible';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `Hace ${diffMinutes}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString();
  }

  /**
   * Calcular altura de barra para el gráfico basado en proporción
   */
  getBarHeight(field: keyof UserStats): number {
    const stats = this.formattedStats();
    if (!stats) return 5; // Altura mínima si no hay datos
    
    const value = stats[field] as number || 0;
    const total = stats.totalConsultas || 1;
    
    if (value === 0) return 5; // Altura mínima para mostrar la barra
    
    // Calcular porcentaje con altura mínima de 10% y máxima de 100%
    const percentage = Math.max(10, Math.min(100, (value / total) * 100));
    return percentage;
  }
}
