import { environment } from '../../../environments/environment';

// API Configuration
export const API_CONFIG = {
  BASE_URL: environment.apiUrl || 'http://localhost:3000/api',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      PROFILE: '/auth/profile',
      CHANGE_PASSWORD: '/auth/change-password'
    },
    USERS: {
      BASE: '/usuarios',
      BY_ID: (id: string) => `/usuarios/${id}`,
      STATS: '/usuarios/stats'
    },
    MERCADOS: {
      BASE: '/mercados',
      BY_ID: (id: string) => `/mercados/${id}`,
      STATS: '/mercados/stats'
    },
    LOCALES: {
      BASE: '/locales',
      BY_ID: (id: string) => `/locales/${id}`,
      BY_MERCADO: (mercadoId: string) => `/locales/mercado/${mercadoId}`,
      STATS: '/locales/stats'
    },
    FACTURAS: {
      BASE: '/facturas',
      BY_ID: (id: string) => `/facturas/${id}`,
      BY_LOCAL: (localId: string) => `/facturas/local/${localId}`,
      MASSIVE: '/facturas/massive',
      STATS: '/facturas/stats'
    },
    AUDIT: {
      BASE: '/audit',
      BY_ID: (id: string) => `/audit/${id}`,
      BY_USER: (userId: string) => `/audit/user/${userId}`,
      STATS: '/audit/stats'
    }
  }
};

// Validation Configuration
export const VALIDATION_CONFIG = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: false
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  PHONE: {
    PATTERN: /^[+]?[\d\s\-()]+$/,
    MIN_LENGTH: 7,
    MAX_LENGTH: 15
  },
  DNI: {
    PATTERN: /^\d{8}$/
  }
};

// HTTP Configuration
export const HTTP_CONFIG = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};
