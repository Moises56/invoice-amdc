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
  IonBackButton,
  IonIcon,
  IonButton,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  analyticsOutline,
  peopleOutline,
  trendingUpOutline,
  calendarOutline,
  refreshOutline,
  arrowBackOutline,
  filterOutline,
  statsChartOutline,
  businessOutline,
  personOutline,
  timeOutline,
  eyeOutline, shieldCheckmarkOutline, documentTextOutline, warningOutline, cashOutline, personCircleOutline, serverOutline } from 'ionicons/icons';

import { StatsService } from '../../../shared/services/stats.service';
import { 
  UserStats,
  GeneralStats, 
  StatsFilter, 
  TopUsuario 
} from '../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-general-stats',
  templateUrl: './general-stats.page.html',
  styleUrls: ['./general-stats.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonButton,
    IonSpinner,
    IonRefresher,
    IonRefresherContent
  ]
})
export class GeneralStatsPage implements OnInit {
  private statsService = inject(StatsService);
  private router = inject(Router);
  private loadingController = inject(LoadingController);
  private toastController = inject(ToastController);

  // Signals
  userStats = signal<UserStats | null>(null);
  generalStats = signal<GeneralStats | null>(null);
  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');
  lastUpdated = signal<string>('');

  // Filtros
  currentFilter = signal<StatsFilter>({});
  isFilterModalOpen = signal<boolean>(false);

  // Computed para estadísticas del usuario con formato
  formattedUserStats = computed(() => {
    const stats = this.userStats();
    if (!stats) return null;
    
    return {
      ...stats,
      successRate: stats.totalConsultas > 0 
        ? Math.round((stats.consultasExitosas / stats.totalConsultas) * 100) 
        : 0,
      errorRate: stats.totalConsultas > 0 
        ? Math.round((stats.consultasConError / stats.totalConsultas) * 100) 
        : 0,
      // Para compatibilidad con el template
      consultasPorTipo: {
        EC: stats.consultasEC,
        ICS: stats.consultasICS,
        AMNISTIA: 0 // No disponible en stats personales
      }
    };
  });

  constructor() {
    addIcons({refreshOutline,analyticsOutline,timeOutline,warningOutline,peopleOutline,personOutline,statsChartOutline,trendingUpOutline,businessOutline,shieldCheckmarkOutline,documentTextOutline,personCircleOutline,serverOutline,cashOutline,calendarOutline,filterOutline,arrowBackOutline,eyeOutline});
  }

  ngOnInit() {
    this.loadGeneralStats();
  }

  /**
   * Cargar estadísticas generales del sistema
   */
  async loadGeneralStats() {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.errorMessage.set('');
    
    try {
      console.log('🔄 Cargando estadísticas generales...');
      
      // Simular un pequeño delay mínimo para mostrar el loading
      const [response] = await Promise.all([
        this.statsService.getGeneralStats().toPromise(),
        new Promise(resolve => setTimeout(resolve, 800)) // Mínimo 800ms para UX
      ]);
      
      console.log('📊 Respuesta del servidor (estadísticas generales):', response);
      
      // El backend devuelve los datos directamente
      if (response && response.totalUsuarios !== undefined) {
        this.generalStats.set(response);
        this.lastUpdated.set(new Date().toISOString());
        console.log('✅ Estadísticas generales cargadas exitosamente:', response);
      } else {
        console.warn('⚠️ Respuesta sin datos válidos:', response);
        this.hasError.set(true);
        this.errorMessage.set('No se pudieron obtener las estadísticas generales');
      }
    } catch (error: any) {
      console.error('❌ Error al cargar estadísticas generales:', error);
      this.hasError.set(true);
      
      // Mensaje de error más específico
      if (error.status === 403) {
        this.errorMessage.set('No tienes permisos para ver las estadísticas');
      } else if (error.status === 404) {
        this.errorMessage.set('Endpoint de estadísticas no encontrado');
      } else if (error.status === 0) {
        this.errorMessage.set('No se puede conectar con el servidor');
      } else {
        this.errorMessage.set(`Error del servidor: ${error.status || 'Desconocido'}`);
      }
    } finally {
      // Pequeño delay adicional para suavizar la transición
      setTimeout(() => {
        this.isLoading.set(false);
      }, 200);
    }
  }

  /**
   * Refrescar estadísticas
   */
  async refreshStats(event?: any) {
    // Si es un refresh manual (pull-to-refresh), no mostrar loading overlay
    if (event) {
      try {
        const response = await this.statsService.getGeneralStats().toPromise();
        if (response && response.totalUsuarios !== undefined) {
          this.generalStats.set(response);
          this.lastUpdated.set(new Date().toISOString());
        }
      } catch (error) {
        console.error('Error al refrescar:', error);
      } finally {
        event.target.complete();
      }
    } else {
      // Refresh normal con loading
      await this.loadGeneralStats();
    }
  }

  /**
   * Aplicar filtros
   */
  async applyFilters() {
    this.isFilterModalOpen.set(false);
    await this.loadGeneralStats();
  }

  /**
   * Limpiar filtros
   */
  async clearFilters() {
    this.currentFilter.set({});
    await this.loadGeneralStats();
  }

  /**
   * Obtener tasa de éxito global
   */
  getTasaExito(): number {
    const stats = this.generalStats();
    if (!stats || stats.totalConsultas === 0) return 0;
    
    return Math.round((stats.consultasPorResultado.SUCCESS / stats.totalConsultas) * 100);
  }

  /**
   * Obtener porcentaje de usuarios activos
   */
  getActiveUsersPercentage(): number {
    const stats = this.generalStats();
    if (!stats || stats.totalUsuarios === 0) return 0;
    
    return Math.round((stats.usuariosActivos / stats.totalUsuarios) * 100);
  }

  /**
   * Obtener color del rol
   */
  getRoleColor(role: string): string {
    const colors: { [key: string]: string } = {
      'ADMIN': 'danger',
      'USER-ADMIN': 'success',
      'MARKET': 'warning',
      'USER': 'primary'
    };
    return colors[role] || 'medium';
  }

  /**
   * Obtener nombre del rol
   */
  getRoleName(role: string): string {
    const names: { [key: string]: string } = {
      'ADMIN': 'Administrador',
      'USER-ADMIN': 'Super Usuario',
      'MARKET': 'Mercado',
      'USER': 'Usuario'
    };
    return names[role] || role;
  }

  /**
   * Obtener cantidad de usuarios por rol
   */
  getUserCountByRole(role: string): number {
    const stats = this.generalStats();
    if (!stats) return 0;
    
    // Los roles ya no están separados en el backend, mostramos el total
    switch (role) {
      case 'USER':
        return stats.totalUsuarios;
      case 'ADMIN':
      case 'USER-ADMIN':
      case 'MARKET':
      default:
        return 0;
    }
  }

  /**
   * Formatear fecha de última actividad
   */
  formatLastActivity(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Volver al dashboard
   */
  goBack() {
    this.router.navigate(['/dashboard/user']);
  }

  /**
   * Obtener iniciales del nombre
   */
  getInitials(username: string): string {
    if (!username) return '?';
    
    // Si el username contiene espacios, usar las primeras letras de cada palabra
    const parts = username.split(' ');
    if (parts.length > 1) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    
    // Si no tiene espacios, usar las primeras dos letras
    return username.substring(0, 2).toUpperCase();
  }

  /**
   * Track by function para ngFor
   */
  trackByUserId(index: number, usuario: TopUsuario): string {
    return usuario.userId || index.toString();
  }

  /**
   * Mostrar toast
   */
  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
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
   * Formatear moneda
   */
  formatCurrency(amount: number | undefined): string {
    if (!amount) return '0.00';
    return new Intl.NumberFormat('es-HN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}
