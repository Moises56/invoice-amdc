// User Statistics Interfaces
export interface UserStatsResponse {
  success: boolean;
  message: string;
  data: UserStats;
}

export interface UserStats {
  userId: string;
  username: string;
  totalConsultas: number;
  consultasEC: number;
  consultasICS: number;
  consultasExitosas: number;
  consultasConError: number;
  consultasNoEncontradas: number;
  promedioTiempoRespuesta: number;
  totalRecaudadoConsultado: number;
  ultimaConsulta: string;
  periodoConsultado: string;
}

export interface ConsultasPorModulo {
  ics: number;
  amnistia: number;
  ec: number;
}

// General Statistics Interfaces (for USER-ADMIN role)
export interface GeneralStatsResponse {
  success: boolean;
  message: string;
  data: GeneralStats;
}

export interface GeneralStats {
  totalUsuarios: number;
  usuariosActivos: number;
  totalConsultas: number;
  consultasPorTipo: ConsultasPorTipo;
  consultasPorResultado: ConsultasPorResultado;
  estatsPorUbicacion: EstadisticasPorUbicacion[];
  topUsuarios: TopUsuario[];
}

export interface ConsultasPorTipo {
  EC: number;
  ICS: number;
}

export interface ConsultasPorResultado {
  SUCCESS: number;
  ERROR: number;
  NOT_FOUND: number;
}

export interface EstadisticasPorUbicacion {
  location: string;
  totalUsuarios: number;
  totalConsultas: number;
  consultasEC: number;
  consultasICS: number;
  promedioConsultasPorUsuario: number;
  usuariosStats: TopUsuario[];
}

export interface TopUsuario {
  userId: string;
  username: string;
  userLocation?: string;
  totalConsultas: number;
  consultasEC: number;
  consultasICS: number;
  consultasExitosas: number;
  consultasConError: number;
  consultasNoEncontradas: number;
  promedioTiempoRespuesta: number;
  totalRecaudadoConsultado: number;
  ultimaConsulta: string;
  periodoConsultado: string;
}

// Activity Log Interfaces
export interface ActivityLogResponse {
  logs: ActivityLog[];
  total: number;
}

export interface ActivityLog {
  id: string;
  consultaType: 'EC' | 'ICS';
  consultaSubtype: 'normal' | 'amnistia';
  parametros: string;
  resultado: 'SUCCESS' | 'ERROR' | 'NOT_FOUND';
  totalEncontrado?: number;
  errorMessage?: string;
  ip: string;
  userAgent?: string;
  duracionMs: number;
  userId: string;
  username: string;
  userLocation?: string;
  createdAt: string;
}

// Statistics filter interfaces
export interface StatsFilter {
  fechaInicio?: string;
  fechaFin?: string;
  modulo?: 'ics' | 'amnistia' | 'ec';
  usuario_id?: string;
}

export interface LogsFilter extends StatsFilter {
  accion?: string;
  ubicacion?: string;
  page?: number;
  per_page?: number;
}

// User Location Management Interfaces
export interface UserLocation {
  id: string;
  userId: string;
  username: string;
  locationName: string;
  locationCode?: string;
  description?: string;
  isActive: boolean;
  assignedBy: string;
  assignedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignLocationRequest {
  userId: string;
  locationName: string;
  locationCode?: string;
  description?: string;
}

export interface LocationAssignmentResponse {
  success: boolean;
  message: string;
  data: UserLocation;
}

export interface LocationError {
  message: string | string[];
}

// Location Stats Interfaces - Based on API response
export interface LocationStatsResponse {
  locationName: string;
  locationCode: string;
  description: string;
  isActive: boolean;
  usersCount: number;
  users: LocationUser[];
  createdAt: string;
  updatedAt: string;
}

export interface LocationUser {
  id: string;
  username: string;
  nombre: string;
  apellido: string;
  correo: string;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
  assignedAt: string;
  assignedBy: string;
}

// Location Statistics Interfaces
export interface LocationStats {
  totalLocations: number;
  usersWithLocation: number;
  usersWithoutLocation: number;
  topLocations: TopLocation[];
  locationDistribution: LocationDistribution[];
  recentAssignments: LocationAssignment[];
}

export interface TopLocation {
  locationName: string;
  locationCode?: string;
  userCount: number;
  totalConsultas: number;
  consultasEC: number;
  consultasICS: number;
  avgResponseTime: number;
  lastActivity: string;
}

export interface LocationDistribution {
  locationName: string;
  userCount: number;
  percentage: number;
  consultasCount: number;
}

export interface LocationAssignment {
  id: string;
  username: string;
  locationName: string;
  locationCode?: string;
  assignedBy: string;
  assignedAt: string;
}

export interface LocationStatsFilter extends StatsFilter {
  locationName?: string;
  includeInactive?: boolean;
}

// User Location History Interfaces - Based on real API responses
// Consultation Statistics Interface
export interface ConsultationStats {
  icsNormal: number;
  icsAmnistia: number;
  ecNormal: number;
  ecAmnistia: number;
  totalExitosas: number;
  totalErrores: number;
  totalConsultas: number;
  promedioDuracionMs?: number;
  totalAcumulado?: number;
}

// User Location History Interfaces
export interface UserLocationHistoryResponse {
  userId: string;
  username: string;
  nombre: string;
  apellido: string;
  currentLocation: CurrentLocationItem | null;
  locationHistory: UserLocationHistoryItem[];
  totalLocations: number;
  firstAssignedAt: string;
  lastAssignedAt: string;
  consultationStats: ConsultationStats;
}

export interface CurrentLocationItem {
  id: string;
  locationName: string;
  locationCode?: string;
  description?: string;
  isActive: boolean;
  assignedAt: string;
  assignedBy: string;
  assignedByUsername: string;
  createdAt: string;
  updatedAt: string;
  durationDays: number;
  consultationStats: ConsultationStats;
}

export interface UserLocationHistoryItem {
  id: string;
  locationName: string;
  locationCode?: string;
  description?: string;
  isActive: boolean;
  assignedAt: string;
  assignedBy: string;
  assignedByUsername: string;
  createdAt: string;
  updatedAt: string;
  durationDays: number;
  deactivatedAt?: string;
  consultationStats: ConsultationStats;
}

export interface AllUsersLocationHistoryResponse {
  success: boolean;
  data: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    limit: number;
    locations: AllUsersLocationHistoryItem[];
  };
}

export interface AllUsersLocationHistoryItem {
  id: number;
  userId: string;
  username: string;
  locationCode: string;
  description: string;
  assignedAt: string;
  deactivatedAt: string | null;
  durationDays: number;
  assignedBy: string;
  assignedByUsername: string;
  isActive: boolean;
}

export interface AssignUserLocationRequest {
  userId: string;
  locationCode: string;
  assignedBy: string;
}

export interface AssignUserLocationResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    userId: string;
    locationCode: string;
    description: string;
    assignedAt: string;
    assignedBy: string;
    assignedByUsername: string;
    isActive: boolean;
    previousLocation?: {
      id: number;
      locationCode: string;
      description: string;
      deactivatedAt: string;
      durationDays: number;
    };
  };
}

export interface LocationHistoryFilter {
  page?: number;
  limit?: number;
  sortBy?: 'assignedAt' | 'deactivatedAt' | 'durationDays';
  sortOrder?: 'asc' | 'desc';
  locationCode?: string;
  isActive?: boolean;
}

// Interface for All Users Location History (Admin view)
export interface AllUsersLocationHistoryFilter extends LocationHistoryFilter {
  userId?: string;
  username?: string;
}