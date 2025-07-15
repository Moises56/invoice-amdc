// Interfaces para el endpoint mejorado de dashboard statistics
// Corresponde a la respuesta del endpoint: GET /api/dashboard/statistics

export interface DashboardStatistics {
  financial: FinancialMetrics;
  invoices: InvoiceMetrics;
  entities: EntityMetrics;
}

export interface FinancialMetrics {
  monthlyRevenue: number;
  annualRevenue: number;
  totalRevenue: number;
  expectedMonthlyRevenue: number;           // Nuevo: Ingresos esperados mensuales
  expectedAnnualRevenue: number;            // Nuevo: Ingresos esperados anuales
  revenueByMarket: MarketRevenue[];
  revenueByLocal: LocalRevenue[];
}

export interface MarketRevenue {
  marketId: string;
  marketName: string;
  total: number;
  monthly: number;
  annual: number;
  totalLocals: number;
  paidInvoices: number;
  averageRevenuePerLocal: number;
  percentageOfTotalRevenue: number;
}

export interface LocalRevenue {
  localId: string;
  localName: string;
  total: number;
}

export interface InvoiceMetrics {
  overdue: number;                          // Facturas vencidas
  paid: number;                             // Facturas pagadas
  pending: number;                          // Facturas pendientes
  cancelled: number;                        // Facturas anuladas
  generated: number;                        // Total generadas
  paymentRate: number;                      // % de pago
  overdueRate: number;                      // % de morosidad
  collectionEfficiency: number;             // Eficiencia cobranza %
  pendingAmount: number;                    // Monto pendiente
  overdueAmount: number;                    // Monto vencido
}

export interface EntityMetrics {
  totalMarkets: number;                     // Total mercados
  activeMarkets: number;                    // Mercados activos
  totalLocals: number;                      // Total locales
  activeLocals: number;                     // Locales activos
  totalUsers: number;                       // Total usuarios
  activeUsers: number;                      // Usuarios activos
  occupancyRate: number;                    // Tasa ocupación %
  averageLocalsPerMarket: number;           // Promedio locales/mercado
  localsWithPaymentsThisMonth: number;      // Locales con pagos mes actual
}

// Interfaces auxiliares para componentes
export interface DashboardKPI {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  trend?: number;
  percentage?: number;
}

export interface TopItem {
  id: string;
  name: string;
  value: number;
  subtitle?: string;
  percentage?: number;
  rank?: number;
}

// Interfaces para charts y visualizaciones
export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string[];
  borderColor?: string;
  borderWidth?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

// Tipos para performance colors
export type PerformanceLevel = 'excellent' | 'good' | 'warning' | 'poor';
export type ColorType = 'success' | 'primary' | 'warning' | 'danger';

// Interface para configuración de métricas
export interface MetricConfig {
  key: keyof InvoiceMetrics | keyof EntityMetrics;
  label: string;
  icon: string;
  color: ColorType;
  format: 'number' | 'currency' | 'percentage';
  thresholds?: {
    excellent: number;
    good: number;
    warning: number;
  };
}

// Cache interface
export interface DashboardCache {
  data: DashboardStatistics;
  timestamp: number;
  expiresIn: number; // milliseconds
}
