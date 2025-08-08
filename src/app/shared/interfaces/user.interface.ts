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