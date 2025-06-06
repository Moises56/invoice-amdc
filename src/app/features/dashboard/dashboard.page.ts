import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonCard, 
  IonCardContent, 
  IonCardHeader, 
  IonCardTitle,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonBadge,
  IonSpinner,
  IonText,
  IonButtons,
  IonMenuButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  homeOutline, 
  businessOutline, 
  storefrontOutline, 
  receiptOutline, 
  peopleOutline,
  statsChartOutline,
  settingsOutline,
  logOutOutline,
  refreshOutline,
  addOutline, chevronForwardOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../shared/enums';

interface DashboardCard {
  title: string;
  count: number;
  subtitle: string;
  icon: string;
  color: string;
  route: string;
  roles: Role[];
}

interface QuickStat {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
  color: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonSpinner,
    IonButtons,
    IonMenuButton,
    IonBadge
  ]
})
export class DashboardPage implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signals
  isLoading = signal<boolean>(true);
  dashboardCards = signal<DashboardCard[]>([]);
  quickStats = signal<QuickStat[]>([]);

  // Computed signals
  user = this.authService.user;
  userRole = this.authService.userRole;
  userName = this.authService.userName;

  constructor() {
    addIcons({refreshOutline,logOutOutline,chevronForwardOutline,addOutline,statsChartOutline,settingsOutline,homeOutline,businessOutline,storefrontOutline,receiptOutline,peopleOutline});
  }

  ngOnInit() {
    this.initializeDashboard();
  }

  /**
   * Inicializar dashboard
   */
  private async initializeDashboard(): Promise<void> {
    this.isLoading.set(true);
    
    try {
      await this.loadDashboardData();
      this.setupDashboardCards();
      this.setupQuickStats();
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Cargar datos del dashboard
   */
  private async loadDashboardData(): Promise<void> {
    // Aquí cargaríamos las estadísticas desde los servicios
    // Por ahora usaremos datos simulados
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Configurar cards del dashboard según el rol
   */
  private setupDashboardCards(): void {
    const allCards: DashboardCard[] = [
      {
        title: 'Mercados',
        count: 12,
        subtitle: '8 activos',
        icon: 'business-outline',
        color: 'primary',
        route: '/mercados',
        roles: [Role.ADMIN, Role.MARKET]
      },
      {
        title: 'Locales',
        count: 245,
        subtitle: '198 ocupados',
        icon: 'storefront-outline',
        color: 'secondary',
        route: '/locales',
        roles: [Role.ADMIN, Role.MARKET, Role.USER]
      },
      {
        title: 'Facturas',
        count: 1856,
        subtitle: '125 pendientes',
        icon: 'receipt-outline',
        color: 'warning',
        route: '/facturas',
        roles: [Role.ADMIN, Role.MARKET, Role.USER]
      },
      {
        title: 'Usuarios',
        count: 28,
        subtitle: '25 activos',
        icon: 'people-outline',
        color: 'success',
        route: '/usuarios',
        roles: [Role.ADMIN]
      }
    ];

    // Filtrar cards según el rol del usuario
    const userRole = this.userRole();
    const filteredCards = allCards.filter(card => 
      !userRole || card.roles.includes(userRole)
    );

    this.dashboardCards.set(filteredCards);
  }

  /**
   * Configurar estadísticas rápidas
   */
  private setupQuickStats(): void {
    const stats: QuickStat[] = [
      {
        label: 'Recaudación Mensual',
        value: 'S/. 45,280',
        trend: 'up',
        color: 'success'
      },
      {
        label: 'Ocupación',
        value: '80.8%',
        trend: 'up',
        color: 'primary'
      },
      {
        label: 'Facturas Vencidas',
        value: '15',
        trend: 'down',
        color: 'danger'
      },
      {
        label: 'Nuevos Registros',
        value: '+8',
        trend: 'neutral',
        color: 'medium'
      }
    ];

    this.quickStats.set(stats);
  }

  /**
   * Navegar a una sección
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.authService.logout().subscribe();
  }

  /**
   * Refrescar dashboard
   */
  async refresh(): Promise<void> {
    await this.initializeDashboard();
  }

  /**
   * Verificar si el usuario tiene acceso a una función
   */
  hasAccess(roles: Role[]): boolean {
    const userRole = this.userRole();
    return !userRole || roles.includes(userRole);
  }

  /**
   * Obtener color de badge según tendencia
   */
  getTrendColor(trend?: string): string {
    switch (trend) {
      case 'up': return 'success';
      case 'down': return 'danger';
      default: return 'medium';
    }
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
