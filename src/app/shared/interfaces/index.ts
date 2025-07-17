import { Role, EstadoFactura, EstadoLocal, TipoLocal, BluetoothConnectionState, BluetoothError } from '../enums';

// Export Role and other enums
export { Role, EstadoFactura, EstadoLocal, TipoLocal, BluetoothConnectionState, BluetoothError };

// Export dashboard interfaces
export * from './dashboard.interface';

// Interfaces base
export interface User {
  id: string;
  correo: string;
  username: string;
  nombre: string;
  apellido: string;
  role: Role;
  telefono?: string;
  dni: string;
  gerencia?: string;
  numero_empleado?: number;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Add missing properties needed by the UI components
  name?: string;  // Alias for nombre + apellido
  email?: string; // Alias for correo
  phone?: string; // Alias for telefono
  address?: string;
  marketId?: string;
  market?: Mercado;
}

export interface Mercado {
  id: string;
  nombre_mercado: string;
  direccion: string;
  latitud: number;
  longitud: number;
  descripcion?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  locales?: Local[];
  _count?: {
    locales: number;
  };
}

export interface Local {
  id: string;
  nombre_local?: string;
  numero_local?: string;
  permiso_operacion?: string;
  tipo_local?: TipoLocal;
  direccion_local?: string;
  estado_local: EstadoLocal;
  monto_mensual?: number;
  propietario?: string;
  dni_propietario?: string;
  telefono?: string;
  email?: string;
  latitud?: number;
  longitud?: number;
  mercadoId: string;
  mercado?: Mercado;
  facturas?: Factura[];
  _count?: {
    facturas: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Factura {
  id: string;
  numero_factura: string;
  correlativo: string;
  concepto: string;
  mes: string;
  anio: number;
  monto: number;
  estado: EstadoFactura;
  fecha_vencimiento: Date;
  fecha_pago?: Date;
  observaciones?: string;
  mercado_nombre: string;
  local_nombre?: string;
  local_numero?: string;
  propietario_nombre?: string;
  propietario_dni?: string;
  localId: string;
  local?: Local;
  createdBy?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  accion: string;
  tabla: string;
  registroId?: string | null;
  datosAntes?: object | null;
  datosDespues?: object | null;
  ip?: string;
  userAgent?: string;
  userId: string;
  user?: User;
  createdAt: Date;
  // Mantener compatibilidad con nombres anteriores
  registro_id?: string;
  datos_anteriores?: object;
  datos_nuevos?: object;
  ip_address?: string;
  user_agent?: string;
}

// Interfaces para paginación
export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// Interfaces para requests
export interface LoginRequest {
  correo?: string;
  username?: string;
  contrasena: string;
}

// DTO Interfaces for user management
export interface CreateUserDto {
  correo: string;
  nombre: string;
  apellido: string;
  contrasena: string;
  telefono?: string;
  dni: string;
  gerencia?: string;
  numero_empleado?: number;
  role?: Role;
  username: string;
}

export interface UpdateUserDto {
  correo?: string;
  nombre?: string;
  apellido?: string;
  contrasena?: string;
  telefono?: string;
  dni?: string;
  gerencia?: string;
  numero_empleado?: number;
  role?: Role;
  username?: string;
  isActive?: boolean;
}

export interface CreateUserDto {
  correo: string;
  nombre: string;
  apellido: string;
  contrasena: string;
  telefono?: string;
  dni: string;
  gerencia?: string;
  numero_empleado?: number;
  role?: Role;
  username: string;
  name?: string; // For UI compatibility
}

// Alias for compatibility
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface CreateMercadoRequest {
  nombre_mercado: string;
  direccion: string;
  latitud: number;
  longitud: number;
  descripcion?: string;
}

export interface UpdateMercadoRequest {
  nombre_mercado?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  descripcion?: string;
  activo?: boolean;
}

export interface CreateLocalRequest {
  nombre_local?: string;
  numero_local?: string;
  permiso_operacion?: string;
  tipo_local?: TipoLocal;
  direccion_local?: string;
  estado_local?: EstadoLocal;
  monto_mensual?: number;
  propietario?: string;
  dni_propietario?: string;
  telefono?: string;
  email?: string;
  latitud?: number;
  longitud?: number;
  mercadoId: string;
}

export interface UpdateLocalRequest {
  nombre_local?: string;
  numero_local?: string;
  permiso_operacion?: string;
  tipo_local?: TipoLocal;
  direccion_local?: string;
  estado_local?: EstadoLocal;
  monto_mensual?: number;
  propietario?: string;
  dni_propietario?: string;
  telefono?: string;
  email?: string;
  latitud?: number;
  longitud?: number;
}

export interface CreateFacturaRequest {
  concepto: string;
  mes: string;
  anio: number;
  monto: number;
  estado?: EstadoFactura;
  fecha_vencimiento: string;
  fecha_pago?: string;
  observaciones?: string;
  localId: string;
  createdByUserId: string;
}

export interface UpdateFacturaRequest {
  concepto?: string;
  mes?: string;
  anio?: number;
  monto?: number;
  estado?: EstadoFactura;
  fecha_vencimiento?: string;
  fecha_pago?: string;
  observaciones?: string;
}

export interface AnularFacturaRequest {
  razon_anulacion: string;
  observaciones?: string;
}

export interface MassiveFacturaRequest {
  mercadoId: string;
  mes: string;
  anio: number;
}

// Interfaces para estadísticas
export interface MercadoStats {
  mercado_id: string;
  mercado_nombre: string;
  mercado_activo: boolean;
  total_locales: number;
  total_recaudado: number;
  total_esperado_mensual: number;
  total_esperado_anual: number;
  locales_ocupados: number;
  locales_libres: number;
  ocupacion_percentage: number;
  cumplimiento_mensual_percentage: number;
  cumplimiento_anual_percentage: number;
}

export interface LocalStats {
  local_id: string;
  local_nombre: string;
  local_numero: string;
  local_estado: string;
  mercado: {
    id: string;
    nombre: string;
  };
  estadisticas_facturas: {
    total_facturas: number;
    facturas_pendientes: number;
    facturas_pagadas: number;
    facturas_vencidas: number;
    facturas_anuladas: number;
  };
  estadisticas_financieras: {
    total_recaudado: number;
    monto_total_facturas: number;
    monto_pendiente: number;
    recaudo_esperado_mensual: number;
    recaudo_esperado_anual: number;
    porcentaje_recaudacion: number;
  };
}

export interface FacturaStats {
  total_facturas: number;
  facturas_pendientes: number;
  facturas_pagadas: number;
  facturas_vencidas: number;
  total_monto: number;
  monto_recaudado: number;
  monto_pendiente: number;
  porcentaje_recaudacion: number;
}

export interface AuditStats {
  total_logs: number;
  logs_today: number;
  logs_by_action: { [action: string]: number };
  most_active_users: Array<{
    userId: string;
    _count: { id: number };
    user: {
      id: string;
      nombre: string;
      apellido: string;
      correo: string;
    };
  }>;
}

// Interfaces para respuestas de la API
export interface ApiResponse<T> {
  message: string;
  data?: T;
}

export interface AuthResponse {
  message: string;
  user: User;
}

// Interfaces para Bluetooth
export interface BluetoothDevice {
  deviceId: string;
  name?: string;
  localName?: string;
  rssi?: number;
  manufacturerData?: { [key: string]: DataView };
  serviceData?: { [key: string]: DataView };
  uuids?: string[];
  isConnected: boolean;
  isPrinter: boolean;
  lastSeen: Date;
}

export interface PrinterConfig {
  deviceId: string;
  name: string;
  paperWidth: 58 | 80;
  characterSet: 'CP437' | 'ISO8859-1' | 'CP850';
  autoReconnect: boolean;
  timeout: number;
  isDefault: boolean;
}

export interface PrintResult {
  success: boolean;
  error?: string;
  timestamp: Date;
  deviceId: string;
}

export interface BluetoothUIState {
  isScanning: boolean;
  connectedDevices: BluetoothDevice[];
  availableDevices: BluetoothDevice[];
  defaultPrinter: PrinterConfig | null;
  lastPrintResult: PrintResult | null;
  connectionErrors: BluetoothError[];
  signalStrength: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface BluetoothErrorHandler {
  handleError(error: BluetoothError, context?: any): void;
  showErrorMessage(error: BluetoothError): string;
  suggestSolution(error: BluetoothError): string;
}

// Interfaces para el módulo de auditoría
export interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  thisWeekLogs: number;
  thisMonthLogs: number;
  operationCounts: {
    CREATE: number;
    UPDATE: number;
    DELETE: number;
    READ: number;
  };
  tableCounts: {
    [tableName: string]: number;
  };
  userActivity: {
    userId: string;
    userName: string;
    logCount: number;
  }[];
  recentActivity: AuditLog[];
}

export interface AuditFilters {
  page?: number;
  limit?: number;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  table?: string;
  operation?: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ';
}

export interface AuditOperationCount {
  operation: string;
  count: number;
  percentage: number;
}

export interface AuditUserActivity {
  userId: string;
  userName: string;
  email: string;
  logCount: number;
  lastActivity: Date;
  actions: {
    action: string;
    count: number;
  }[];
}
