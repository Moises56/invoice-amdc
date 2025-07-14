// Core interfaces for authentication and API responses
import { Role } from '../../shared/enums';

export interface User {
  id: string;
  correo: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  dni: string;
  gerencia?: string;
  numero_empleado?: number;
  role: Role;
  username: string;
  isActive: boolean;
  // UI compatibility properties
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  marketId?: string;
  market?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  correo?: string;
  username?: string;
  contrasena: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
  data: {
    user: User;
    token: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export * from './bluetooth';
export * from './invoice';
