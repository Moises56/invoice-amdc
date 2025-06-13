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
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonBadge,
  IonSpinner,
  IonButtons,
  IonMenuButton,
  IonSkeletonText
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
  addOutline,
  chevronForwardOutline,
  trendingUpOutline,
  trendingDownOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  cashOutline,
  walletOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../shared/enums';
import { MercadosService } from '../mercados/mercados.service';
import { StatsService, LocalesStats, FacturasStats } from '../../shared/services/stats.service';

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
  standalone: true,  imports: [    CommonModule,
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
    IonBadge,
    IonSkeletonText
  ]
})
export class DashboardPage implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private mercadosService = inject(MercadosService);
  private statsService = inject(StatsService);

  // Signals
  isLoading = signal<boolean>(true);
  dashboardCards = signal<DashboardCard[]>([]);
  quickStats = signal<QuickStat[]>([]);
  
  // Statistics Signals
  mercadosStats = signal<any>(null);
  localesStats = signal<LocalesStats | null>(null);
  facturasStats = signal<FacturasStats | null>(null);
  statsLoading = signal(true);
  statsError = signal<string | null>(null);

  // Computed signals
  user = this.authService.user;
  userRole = this.authService.userRole;
  userName = this.authService.userName;
  constructor() {
    addIcons({
      refreshOutline, logOutOutline, chevronForwardOutline, addOutline,
      statsChartOutline, settingsOutline, homeOutline, businessOutline,
      storefrontOutline, receiptOutline, peopleOutline, trendingUpOutline, 
      trendingDownOutline, alertCircleOutline, checkmarkCircleOutline,
      cashOutline, walletOutline
    });
  }

  ngOnInit() {
    this.initializeDashboard();
  }  /**
   * Inicializar dashboard
   */
  private async initializeDashboard(): Promise<void> {
    this.isLoading.set(true);
    this.statsLoading.set(true);
    
    try {
      // Initialize dashboard cards
      this.setupDashboardCards();
      
      // Load stats from API
      await this.loadStats();
      
      // Initialize quick stats
      this.setupQuickStats();
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      this.statsError.set('Error al cargar datos del dashboard');
    } finally {
      this.isLoading.set(false);
      this.statsLoading.set(false);
    }try {
      // Inicializar tarjetas del dashboard
      this.setupDashboardCards();
      
      // Cargar estadísticas
      await this.loadStats();
      
      // Setupear quick stats
      this.setupQuickStats();
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      this.statsError.set('Error al cargar estadísticas');
    } finally {
      this.isLoading.set(false);
      this.statsLoading.set(false);
    }
  }
  
  /**
   * Cargar estadísticas
   */
  private async loadStats(): Promise<void> {
    try {
      // Fetch all stats in parallel      // Only use for demo - replace with real API calls and proper error handling
      try {
        const mercadosStats = await this.mercadosService.getAllMarketStats().toPromise();
        this.mercadosStats.set(mercadosStats);
      } catch (error) {
        console.error('Error fetching mercados stats:', error);
      }
      
      try {
        const localesStats = await this.statsService.getLocalesStats().toPromise();
        this.localesStats.set(localesStats || null);
      } catch (error) {
        console.error('Error fetching locales stats:', error);
      }
      
      try {
        const facturasStats = await this.statsService.getFacturasStats().toPromise();
        this.facturasStats.set(facturasStats || null);
      } catch (error) {
        console.error('Error fetching facturas stats:', error);
      }
      
      // Update cards with real statistics
      this.updateCardCounts();
      
      // Setup quick stats based on real data
      this.setupQuickStats();
    } catch (error) {
      console.error('Error loading stats:', error);
      this.statsError.set('Error al cargar estadísticas');
    }
  }
  
  /**
   * Update card counts with real statistics
   */
  private updateCardCounts(): void {
    const cards = [...this.dashboardCards()];
    
    // Update Mercados card
    if (this.mercadosStats()) {
      const mercadoCard = cards.find(card => card.title === 'Mercados');
      if (mercadoCard) {
        mercadoCard.count = this.mercadosStats().total_mercados || 0;
        mercadoCard.subtitle = `${this.mercadosStats().locales_ocupados || 0} ocupados`;
      }
    }
      // Update Locales card
    if (this.localesStats()) {
      const localCard = cards.find(card => card.title === 'Locales');
      if (localCard) {
        localCard.count = this.localesStats()?.total_locales || 0;
        localCard.subtitle = `${this.localesStats()?.locales_activos || 0} activos`;
      }
    }
    
    // Update Facturas card
    if (this.facturasStats()) {
      const facturaCard = cards.find(card => card.title === 'Facturas');
      if (facturaCard) {
        facturaCard.count = this.facturasStats()?.total_facturas || 0;
        facturaCard.subtitle = `${this.facturasStats()?.facturas_pendientes || 0} pendientes`;
      }
    }
      this.dashboardCards.set(cards);
  }
  /**
   * Cargar datos del dashboard de forma simulada (para desarrollo)
   */
  private async loadDashboardData(): Promise<void> {
    // Simular carga para propósitos de desarrollo
    await new Promise(resolve => setTimeout(resolve, 500));
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
