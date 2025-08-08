import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
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
  settings,
  logOutOutline,
  refreshOutline,
  addOutline,
  chevronForwardOutline,
  trendingUpOutline,
  trendingDownOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  cashOutline,
  walletOutline, 
  timeOutline, 
  trophyOutline, 
  flagOutline, 
  calendarOutline, 
  documentText,
  alertCircle,
  time,
  checkmarkCircle,
  business,
  storefront,
  atOutline,
  documentTextOutline, 
  analyticsOutline,
  analytics,
  trendingUp, flashOutline, barChartOutline, arrowForward, bluetoothOutline, cogOutline, colorPaletteOutline, ban, banOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../shared/enums';
import { MercadosService } from '../mercados/mercados.service';
import { DashboardService } from './dashboard.service';
import { 
  DashboardStatistics, 
  DashboardKPI, 
  TopItem, 
  FinancialMetrics,
  InvoiceMetrics,
  EntityMetrics
} from '../../shared/interfaces';
// import { LocationStatsWidgetComponent } from '../../components/location-stats-widget/location-stats-widget.component';

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
  standalone: true,
  imports: [
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
    IonBadge,
    IonSkeletonText,
    
  ]
})
export class DashboardPage implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private mercadosService = inject(MercadosService);
  private dashboardService = inject(DashboardService);
  private toastController = inject(ToastController);

  // Signals principales
  isLoading = signal<boolean>(true);
  dashboardCards = signal<DashboardCard[]>([]);
  quickStats = signal<QuickStat[]>([]);
  
  // Nuevas statistics signals para el endpoint mejorado
  dashboardStats = signal<DashboardStatistics | null>(null);
  statsLoading = signal(true);
  statsError = signal<string | null>(null);
  lastUpdated = signal<Date | null>(null);

  // Computed signals para métricas específicas
  financialStats = computed(() => this.dashboardStats()?.financial);
  invoiceStats = computed(() => this.dashboardStats()?.invoices);
  entityStats = computed(() => this.dashboardStats()?.entities);

  // Legacy computed para compatibilidad
  mercadosStats = computed(() => ({
    total_mercados: this.entityStats()?.totalMarkets || 0,
    locales_ocupados: Math.round((this.entityStats()?.totalLocals || 0) * (this.entityStats()?.occupancyRate || 0) / 100),
    ocupacion_percentage: this.entityStats()?.occupancyRate || 0
  }));
  
  localesStats = computed(() => ({
    total_locales: this.entityStats()?.totalLocals || 0,
    locales_activos: this.entityStats()?.activeLocals || 0
  }));

  facturasStats = computed(() => ({
    total_facturas: this.invoiceStats()?.generated || 0,
    monto_total: this.financialStats()?.totalRevenue || 0,
    facturas_vencidas: this.invoiceStats()?.overdue || 0,
    facturas_pendientes: this.invoiceStats()?.pending || 0,
    facturas_pagadas: this.invoiceStats()?.paid || 0,
    facturas_anuladas: this.invoiceStats()?.cancelled || 0,
    monto_pendiente: this.invoiceStats()?.pendingAmount || 0,
    monto_vencido: this.invoiceStats()?.overdueAmount || 0
  }));

  // Computed para top 3 mercados por recaudación
  topMarketsByRevenue = computed(() => {
    const markets = this.financialStats()?.revenueByMarket;
    if (!markets) return [];
    
    return markets
      .slice(0, 3)
      .map(market => ({
        id: market.marketId,
        name: market.marketName,
        total: market.total,
        percentage: market.percentageOfTotalRevenue,
        averagePerLocal: market.averageRevenuePerLocal,
        totalLocals: market.totalLocals
      }));
  });

  // Estadísticas adicionales importantes
  additionalStats = computed(() => {
    const stats = this.dashboardStats();
    if (!stats) return null;
    
    return {
      localesConPagos: stats.entities.localsWithPaymentsThisMonth,
      promedioLocalesPorMercado: stats.entities.averageLocalsPerMarket,
      eficienciaCobranza: stats.invoices.collectionEfficiency,
      ingresoMensual: stats.financial.monthlyRevenue,
      ingresoAnual: stats.financial.annualRevenue,
      ingresoTotal: stats.financial.totalRevenue,
      // Nuevos campos de ingresos esperados
      ingresoMensualEsperado: stats.financial.expectedMonthlyRevenue,
      ingresoAnualEsperado: stats.financial.expectedAnnualRevenue,
      // Cálculos de cumplimiento
      cumplimientoMensual: (stats.financial.monthlyRevenue / stats.financial.expectedMonthlyRevenue) * 100,
      cumplimientoAnual: (stats.financial.annualRevenue / stats.financial.expectedAnnualRevenue) * 100
    };
  });

  // KPIs principales computados
  mainKPIs = computed(() => {
    const stats = this.dashboardStats();
    if (!stats) return [];
    return this.dashboardService.createMainKPIs(stats);
  });

  // Top markets y locales computados
  topMarkets = computed(() => {
    const markets = this.financialStats()?.revenueByMarket;
    if (!markets) return [];
    return this.dashboardService.createTopMarkets(markets);
  });

  topLocals = computed(() => {
    const locals = this.financialStats()?.revenueByLocal;
    if (!locals) return [];
    return this.dashboardService.createTopLocals(locals);
  });

  // Métricas de rendimiento computadas
  paymentRateColor = computed(() => {
    const rate = this.invoiceStats()?.paymentRate || 0;
    return this.dashboardService.getPerformanceColor(rate);
  });

  overdueRateColor = computed(() => {
    const rate = this.invoiceStats()?.overdueRate || 0;
    return this.dashboardService.getOverdueRateColor(rate);
  });

  occupancyRateColor = computed(() => {
    const rate = this.entityStats()?.occupancyRate || 0;
    return this.dashboardService.getPerformanceColor(rate);
  });

  // Legacy computed signals
  user = this.authService.user;
  userRole = this.authService.userRole;
  userName = this.authService.userName;

  constructor() {
    addIcons({refreshOutline,logOutOutline,analyticsOutline,trendingUp,flagOutline,walletOutline,business,storefrontOutline,businessOutline,storefront,peopleOutline,analytics,calendarOutline,receiptOutline,alertCircle,cashOutline,alertCircleOutline,time,timeOutline,checkmarkCircle,trendingUpOutline,checkmarkCircleOutline,documentText,ban,documentTextOutline,banOutline,trophyOutline,chevronForwardOutline,flashOutline,barChartOutline,arrowForward,settings,bluetoothOutline,cogOutline,colorPaletteOutline,settingsOutline,addOutline,statsChartOutline,homeOutline,trendingDownOutline,atOutline});
  }

  ngOnInit() {
    this.initializeDashboard();
  }

  /**
   * Inicializar dashboard con el nuevo endpoint
   */
  private async initializeDashboard(): Promise<void> {
    this.isLoading.set(true);
    this.statsLoading.set(true);
    
    try {
      // Initialize dashboard cards
      this.setupDashboardCards();
      
      // Load stats from new endpoint
      await this.loadDashboardStats();
      
      // Update cards with real data
      this.updateCardCounts();
      
      // Initialize quick stats based on new data
      this.setupQuickStats();
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      this.statsError.set('Error al cargar datos del dashboard');
    } finally {
      this.isLoading.set(false);
      this.statsLoading.set(false);
    }
  }

  /**
   * Cargar estadísticas desde el nuevo endpoint
   */
  async loadDashboardStats(): Promise<void> {
    try {
      this.statsLoading.set(true);
      this.statsError.set(null);
      
      const stats = await this.dashboardService.getDashboardStatistics().toPromise();
      
      if (stats) {
        this.dashboardStats.set(stats);
        this.lastUpdated.set(new Date());
        console.log('✅ Dashboard statistics loaded successfully:', stats);
      } else {
        throw new Error('No data received from dashboard endpoint');
      }
      
    } catch (error: any) {
      console.error('❌ Error loading dashboard statistics:', error);
      this.statsError.set(error.message || 'Error al cargar estadísticas del dashboard');
      
      // Intentar cargar datos del cache como fallback
      const cachedData = this.getCachedFallbackData();
      if (cachedData) {
        this.dashboardStats.set(cachedData);
        this.statsError.set('Mostrando datos en caché - Sin conexión');
      }
    } finally {
      this.statsLoading.set(false);
    }
  }

  /**
   * Refresh de datos con mejor UX y manejo de errores
   */
  async refresh(): Promise<void> {
    console.log('🔄 Refreshing dashboard data...');
    
    // Activar estado de carga
    this.statsLoading.set(true);
    this.statsError.set(null);
    
    try {
      // Usar Promise.race para timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );
      
      const statsPromise = this.dashboardService.refreshDashboardStatistics().toPromise();
      
      const stats = await Promise.race([statsPromise, timeoutPromise]) as DashboardStatistics;
      
      if (stats) {
        this.dashboardStats.set(stats);
        this.lastUpdated.set(new Date());
        this.statsError.set(null);
        console.log('✅ Dashboard refreshed successfully');
        
        // Feedback visual de éxito
        this.showSuccessToast('Datos actualizados correctamente');
      }
      
    } catch (error: any) {
      console.error('❌ Error refreshing dashboard:', error);
      
      let errorMessage = 'Error al actualizar datos';
      if (error.message === 'Timeout') {
        errorMessage = 'Tiempo de espera agotado. Verifique su conexión.';
      } else if (error.status === 0) {
        errorMessage = 'Sin conexión a internet';
      } else if (error.status >= 500) {
        errorMessage = 'Error del servidor. Intente más tarde.';
      }
      
      this.statsError.set(errorMessage);
      this.showErrorToast(errorMessage);
    } finally {
      this.statsLoading.set(false);
    }
  }

  /**
   * Mostrar toast de éxito
   */
  private async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
      color: 'success',
      icon: 'checkmark-circle-outline'
    });
    await toast.present();
  }

  /**
   * Mostrar toast de error
   */
  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'danger',
      icon: 'alert-circle-outline'
    });
    await toast.present();
  }

  /**
   * Datos de fallback desde cache o valores por defecto
   */
  private getCachedFallbackData(): DashboardStatistics | null {
    // Implementar lógica de fallback si es necesario
    return null;
  }

  /**
   * Métodos de formateo utilizando el service
   */
  formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined || amount === null) return 'L. 0.00';
    return this.dashboardService.formatCurrency(amount);
  };

  formatCurrencyCompact = (amount: number | undefined): string => {
    if (amount === undefined || amount === null) return 'L. 0';
    return this.dashboardService.formatCurrencyCompact(amount);
  };

  formatPercentage = (value: number | undefined, decimals = 1): string => {
    if (value === undefined || value === null) return '0%';
    return this.dashboardService.formatPercentage(value, decimals);
  };

  formatNumber = (value: number | undefined): string => {
    if (value === undefined || value === null) return '0';
    return this.dashboardService.formatNumber(value);
  };
  
  /**
   * Actualizar contadores de las cards con datos reales
   */
  private updateCardCounts(): void {
    const dashStats = this.dashboardStats();
    if (!dashStats) return;

    const cards = this.dashboardCards();
    
    // Actualizar card de Mercados
    const mercadoCard = cards.find(card => card.title === 'Mercados');
    if (mercadoCard) {
      mercadoCard.count = dashStats.entities.totalMarkets;
      mercadoCard.subtitle = `${dashStats.entities.activeMarkets} activos`;
    }

    // Actualizar card de Locales
    const localCard = cards.find(card => card.title === 'Locales');
    if (localCard) {
      localCard.count = dashStats.entities.totalLocals;
      const ocupados = Math.round(dashStats.entities.totalLocals * dashStats.entities.occupancyRate / 100);
      localCard.subtitle = `${ocupados} ocupados`;
    }

    // Actualizar card de Facturas
    const facturaCard = cards.find(card => card.title === 'Facturas');
    if (facturaCard) {
      facturaCard.count = dashStats.invoices.generated;
      facturaCard.subtitle = `${dashStats.invoices.paid} pagadas, ${dashStats.invoices.pending} pendientes`;
    }

    // Actualizar card de Usuarios
    const usuarioCard = cards.find(card => card.title === 'Usuarios');
    if (usuarioCard) {
      usuarioCard.count = dashStats.entities.totalUsers;
      usuarioCard.subtitle = `${dashStats.entities.activeUsers} activos`;
    }

    this.dashboardCards.set([...cards]); // Trigger change detection
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
        roles: [Role.ADMIN, Role.MARKET]
      },
      {
        title: 'Facturas',
        count: 1856,
        subtitle: '125 pendientes',
        icon: 'receipt-outline',
        color: 'warning',
        route: '/facturas',
        roles: [Role.ADMIN, Role.MARKET]
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
   * Configurar estadísticas rápidas basadas en datos reales
   */
  private setupQuickStats(): void {
    const dashStats = this.dashboardStats();
    if (!dashStats) {
      this.quickStats.set([]);
      return;
    }

    const stats: QuickStat[] = [
      {
        label: 'Recaudación Mensual',
        value: this.formatCurrency(dashStats.financial.monthlyRevenue),
        trend: 'up',
        color: 'success'
      },
      {
        label: 'Recaudación Anual',
        value: this.formatCurrency(dashStats.financial.annualRevenue),
        trend: 'up',
        color: 'primary'
      },
      {
        label: 'Facturas Vencidas',
        value: dashStats.invoices.overdue.toString(),
        trend: dashStats.invoices.overdue <= 10 ? 'up' : dashStats.invoices.overdue <= 25 ? 'neutral' : 'down',
        color: dashStats.invoices.overdue <= 10 ? 'success' : dashStats.invoices.overdue <= 25 ? 'warning' : 'danger'
      },
      {
        label: 'Facturas Pagadas',
        value: dashStats.invoices.paid.toString(),
        trend: 'up',
        color: 'success'
      },
      {
        label: 'Facturas Pendientes',
        value: dashStats.invoices.pending.toString(),
        trend: dashStats.invoices.pending <= 15 ? 'up' : dashStats.invoices.pending <= 30 ? 'neutral' : 'down',
        color: dashStats.invoices.pending <= 15 ? 'success' : dashStats.invoices.pending <= 30 ? 'warning' : 'danger'
      },
      {
        label: 'Locales con Pagos',
        value: dashStats.entities.localsWithPaymentsThisMonth.toString(),
        trend: 'up',
        color: 'secondary'
      },
      {
        label: 'Monto Pendiente',
        value: this.formatCurrency(dashStats.invoices.pendingAmount),
        trend: 'neutral',
        color: 'warning'
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
   * Navegar al detalle de un mercado específico
   */
  navigateToMarket(marketId: string): void {
    this.router.navigate(['/mercados', marketId]);
  }

  /**
   * Navegar al detalle de un local específico
   */
  navigateToLocal(localId: string): void {
    this.router.navigate(['/locales', localId]);
  }

  /**
   * Navegar a la gestión de facturas con filtros
   */
  navigateToInvoices(filter?: 'pending' | 'overdue' | 'paid'): void {
    const route = ['/facturas'];
    if (filter) {
      route.push({ queryParams: { status: filter } } as any);
    }
    this.router.navigate(route);
  }

  /**
   * Cerrar sesión de manera robusta
   */
  logout(): void {
    console.log('🚪 Iniciando logout desde dashboard...');
    
    // Suscribirse al observable del logout para manejo correcto
    this.authService.logout().subscribe({
      next: () => {
        console.log('✅ Logout completado exitosamente');
        // La navegación ya se maneja en el AuthService
      },
      error: (error) => {
        console.error('❌ Error en logout:', error);
        // Forzar navegación incluso si hay error
        this.router.navigate(['/login'], { replaceUrl: true });
      }
    });
  }

  /**
   * Obtener fecha formateada de última actualización
   */
  getLastUpdated(): string {
    const date = this.lastUpdated();
    if (!date) return 'Nunca';
    
    return date.toLocaleString('es-HN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  /**
   * Obtener fecha actual formateada
   */
  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Obtener ícono según tendencia
   */
  getTrendIcon(trend?: string): string {
    switch (trend) {
      case 'up': return 'trending-up-outline';
      case 'down': return 'trending-down-outline';
      default: return 'remove-outline';
    }
  }

  /**
   * Manejar click en KPI card
   */
  onKPIClick(kpi: DashboardKPI): void {
    // Navegar a la sección correspondiente según el tipo de KPI
    switch (kpi.label) {
      case 'Ingresos Totales':
      case 'Ingresos Mensuales':
        this.navigateTo('/facturas');
        break;
      case 'Tasa de Pago':
        this.navigateToInvoices('paid');
        break;
      case 'Ocupación':
        this.navigateTo('/locales');
        break;
      default:
        console.log('KPI clicked:', kpi.label);
    }
  }

  /**
   * Manejar click en top market item
   */
  onTopMarketClick(market: TopItem): void {
    this.navigateToMarket(market.id);
  }

  /**
   * Manejar click en top local item
   */
  onTopLocalClick(local: TopItem): void {
    this.navigateToLocal(local.id);
  }

  /**
   * Verificar si el usuario actual es ADMIN
   */
  isAdmin(): boolean {
    return this.authService.hasAnyRole(['ADMIN']);
  }
}
