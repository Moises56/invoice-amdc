import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, timer } from 'rxjs';
import { retry, catchError, shareReplay, map, switchMap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { 
  DashboardStatistics, 
  DashboardCache, 
  ColorType, 
  PerformanceLevel,
  DashboardKPI,
  TopItem,
  ChartData
} from '../../shared/interfaces';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;
  private readonly CACHE_KEY = 'dashboard_statistics';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milliseconds
  
  private dashboardCache: DashboardCache | null = null;

  /**
   * Obtener estadísticas del dashboard desde el endpoint mejorado
   */
  getDashboardStatistics(): Observable<DashboardStatistics> {
    // Verificar cache primero
    if (this.isCacheValid()) {
      console.log('📊 Dashboard: Usando datos del cache');
      return of(this.dashboardCache!.data);
    }

    console.log('📊 Dashboard: Solicitando datos del servidor');
    return this.http.get<DashboardStatistics>(`${this.baseUrl}/statistics`)
      .pipe(
        retry(2),
        map(data => this.processStatisticsData(data)),
        shareReplay(1),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Refresh forzado de datos (ignora cache)
   */
  refreshDashboardStatistics(): Observable<DashboardStatistics> {
    this.clearCache();
    return this.getDashboardStatistics();
  }

  /**
   * Procesar y enriquecer los datos del backend
   */
  private processStatisticsData(data: DashboardStatistics): DashboardStatistics {
    // Procesar y validar datos
    const processedData = {
      ...data,
      financial: {
        ...data.financial,
        revenueByMarket: data.financial.revenueByMarket.sort(
          (a, b) => b.total - a.total
        ),
        revenueByLocal: data.financial.revenueByLocal
          .sort((a, b) => b.total - a.total)
          .slice(0, 10) // Top 10 locales
      }
    };

    // Actualizar cache
    this.updateCache(processedData);
    
    return processedData;
  }

  /**
   * Formatear moneda con separadores de miles
   */
  formatCurrency(amount: number): string {
    if (amount === 0) return 'L 0.00';
    
    return `L ${amount.toLocaleString('es-HN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }

  /**
   * Formatear moneda de manera compacta para dashboards
   */
  formatCurrencyCompact(amount: number): string {
    if (amount >= 1000000) {
      return `L ${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `L ${(amount / 1000).toFixed(1)}K`;
    }
    return this.formatCurrency(amount);
  }

  /**
   * Formatear porcentaje con decimales
   */
  formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  }

  /**
   * Formatear números con separadores de miles
   */
  formatNumber(value: number): string {
    return value.toLocaleString('es-HN');
  }

  /**
   * Obtener color según el rendimiento de un porcentaje
   */
  getPerformanceColor(percentage: number): ColorType {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'primary';
    if (percentage >= 40) return 'warning';
    return 'danger';
  }

  /**
   * Obtener nivel de rendimiento
   */
  getPerformanceLevel(percentage: number): PerformanceLevel {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 70) return 'good';
    if (percentage >= 50) return 'warning';
    return 'poor';
  }

  /**
   * Obtener color para tasa de morosidad (invertido)
   */
  getOverdueRateColor(percentage: number): ColorType {
    if (percentage <= 10) return 'success';
    if (percentage <= 25) return 'primary';
    if (percentage <= 40) return 'warning';
    return 'danger';
  }

  /**
   * Generar datos para gráfico de ingresos por mercado
   */
  generateMarketRevenueChartData(markets: any[]): ChartData {
    const sortedMarkets = markets
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // Top 8 mercados

    return {
      labels: sortedMarkets.map(m => m.marketName),
      datasets: [{
        label: 'Ingresos por Mercado',
        data: sortedMarkets.map(m => m.total),
        backgroundColor: [
          '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
          '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
        ],
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    };
  }

  /**
   * Generar datos para gráfico donut de facturas
   */
  generateInvoiceStatusChartData(invoices: any): ChartData {
    return {
      labels: ['Pagadas', 'Pendientes', 'Vencidas', 'Anuladas'],
      datasets: [{
        label: 'Estado de Facturas',
        data: [
          invoices.paid,
          invoices.pending,
          invoices.overdue,
          invoices.cancelled
        ],
        backgroundColor: [
          '#10B981', // Verde - Pagadas
          '#F59E0B', // Amarillo - Pendientes
          '#EF4444', // Rojo - Vencidas
          '#6B7280'  // Gris - Anuladas
        ],
        borderWidth: 0
      }]
    };
  }

  /**
   * Crear KPIs principales del dashboard
   */
  createMainKPIs(stats: DashboardStatistics): DashboardKPI[] {
    return [
      {
        label: 'Ingresos Totales',
        value: this.formatCurrencyCompact(stats.financial.totalRevenue),
        subtitle: 'Recaudación histórica',
        icon: 'wallet-outline',
        color: 'success'
      },
      {
        label: 'Ingresos Mensuales',
        value: this.formatCurrencyCompact(stats.financial.monthlyRevenue),
        subtitle: 'Del mes actual',
        icon: 'calendar-outline',
        color: 'primary'
      },
      {
        label: 'Tasa de Pago',
        value: this.formatPercentage(stats.invoices.paymentRate),
        subtitle: 'Facturas pagadas',
        icon: 'checkmark-circle-outline',
        color: this.getPerformanceColor(stats.invoices.paymentRate),
        percentage: stats.invoices.paymentRate
      },
      {
        label: 'Ocupación',
        value: this.formatPercentage(stats.entities.occupancyRate),
        subtitle: 'Locales ocupados',
        icon: 'business-outline',
        color: this.getPerformanceColor(stats.entities.occupancyRate),
        percentage: stats.entities.occupancyRate
      }
    ];
  }

  /**
   * Crear lista de top mercados
   */
  createTopMarkets(markets: any[]): TopItem[] {
    return markets
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((market, index) => ({
        id: market.marketId,
        name: market.marketName,
        value: market.total,
        subtitle: `${market.totalLocals} locales`,
        percentage: market.percentageOfTotalRevenue,
        rank: index + 1
      }));
  }

  /**
   * Crear lista de top locales
   */
  createTopLocals(locals: any[]): TopItem[] {
    return locals
      .filter(local => local.localName !== 'no se encontró')
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((local, index) => ({
        id: local.localId,
        name: local.localName,
        value: local.total,
        rank: index + 1
      }));
  }

  /**
   * Cache management
   */
  private isCacheValid(): boolean {
    if (!this.dashboardCache) return false;
    
    const now = Date.now();
    return now < (this.dashboardCache.timestamp + this.dashboardCache.expiresIn);
  }

  private updateCache(data: DashboardStatistics): void {
    this.dashboardCache = {
      data,
      timestamp: Date.now(),
      expiresIn: this.CACHE_DURATION
    };
    
    // Opcional: Persistir en localStorage para supervivencia de reloads
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.dashboardCache));
    } catch (error) {
      console.warn('No se pudo guardar cache en localStorage:', error);
    }
  }

  private clearCache(): void {
    this.dashboardCache = null;
    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      console.warn('No se pudo limpiar cache de localStorage:', error);
    }
  }

  /**
   * Cargar cache desde localStorage al inicializar
   */
  private loadCacheFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DashboardCache;
        if (Date.now() < (parsed.timestamp + parsed.expiresIn)) {
          this.dashboardCache = parsed;
        } else {
          localStorage.removeItem(this.CACHE_KEY);
        }
      }
    } catch (error) {
      console.warn('Error cargando cache desde localStorage:', error);
    }
  }

  /**
   * Manejo robusto de errores
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido al cargar estadísticas';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error de cliente: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 401:
          errorMessage = 'No autorizado. Por favor, inicie sesión nuevamente.';
          break;
        case 403:
          errorMessage = 'No tiene permisos para acceder a estas estadísticas.';
          break;
        case 404:
          errorMessage = 'Endpoint de estadísticas no encontrado.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Intente nuevamente.';
          break;
        case 0:
          errorMessage = 'Sin conexión a internet. Verifique su conectividad.';
          break;
        default:
          errorMessage = `Error del servidor: ${error.status} - ${error.statusText}`;
      }
    }

    console.error('❌ Dashboard Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  constructor() {
    // Cargar cache al inicializar el servicio
    this.loadCacheFromStorage();
  }
}
