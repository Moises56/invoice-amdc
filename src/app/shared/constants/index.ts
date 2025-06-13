// Configuración de la API
export const API_CONFIG = {
  // BASE_URL: 'http://localhost:3000/api',
  BASE_URL: 'https://factback.amdc.hn/api',
  // BASE_URL: 'https://merc-fact-back.onrender.com/api',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
      CHANGE_PASSWORD: '/auth/change-password',
      PROFILE: '/auth/profile'
    },
    USERS: {
      BASE: '/users',
      BY_ID: (id: string) => `/users/${id}`
    },
    MERCADOS: {
      BASE: '/mercados',
      BY_ID: (id: string) => `/mercados/${id}`,
      STATS: '/mercados/stats',
      ACTIVATE: (id: string) => `/mercados/${id}/activate`,
      LOCALES: (id: string) => `/mercados/${id}/locales`
    },
    LOCALES: {
      BASE: '/locales',
      BY_ID: (id: string) => `/locales/${id}`,
      STATS: '/locales/stats',
      ACTIVATE: (id: string) => `/locales/${id}/activate`,
      DEACTIVATE: (id: string) => `/locales/${id}/deactivate`,
      SUSPEND: (id: string) => `/locales/${id}/suspend`,
      FACTURAS: (id: string) => `/locales/${id}/facturas`
    },
    FACTURAS: {
      BASE: '/facturas',
      BY_ID: (id: string) => `/facturas/${id}`,
      STATS: '/facturas/stats',
      PAY: (id: string) => `/facturas/${id}/pay`,
      MASSIVE: '/facturas/massive'
    },
    AUDIT: {
      BASE: '/audit',
      BY_ID: (id: string) => `/audit/${id}`,
      STATS: '/audit/stats',
      BY_USER: (userId: string) => `/audit/user/${userId}`
    }
  }
} as const;

// Configuración de paginación
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100]
} as const;

// Configuración de Bluetooth
export const BLUETOOTH_CONFIG = {
  SCAN_TIMEOUT: 60000, // 60 segundos
  CONNECTION_TIMEOUT: 30000, // 30 segundos
  RECONNECT_ATTEMPTS: 3,
  RECONNECT_INTERVAL: 30000, // 30 segundos
  PRINTER_SERVICE_UUID: '00001101-0000-1000-8000-00805F9B34FB', // UUID estándar para Serial Port Profile
  CACHE_DURATION: 30 * 24 * 60 * 60 * 1000 // 30 días en millisegundos
} as const;

// Comandos ESC/POS para impresión térmica
export const ESC_POS_COMMANDS = {
  // Inicialización
  INIT: [0x1B, 0x40],
  
  // Alineación
  ALIGN_LEFT: [0x1B, 0x61, 0x00],
  ALIGN_CENTER: [0x1B, 0x61, 0x01],
  ALIGN_RIGHT: [0x1B, 0x61, 0x02],
  
  // Tamaño de texto
  TEXT_NORMAL: [0x1B, 0x21, 0x00],
  TEXT_DOUBLE_HEIGHT: [0x1B, 0x21, 0x10],
  TEXT_DOUBLE_WIDTH: [0x1B, 0x21, 0x20],
  TEXT_DOUBLE_SIZE: [0x1B, 0x21, 0x30],
  
  // Formato
  BOLD_ON: [0x1B, 0x45, 0x01],
  BOLD_OFF: [0x1B, 0x45, 0x00],
  UNDERLINE_ON: [0x1B, 0x2D, 0x01],
  UNDERLINE_OFF: [0x1B, 0x2D, 0x00],
  
  // Separadores
  LINE_FEED: [0x0A],
  CARRIAGE_RETURN: [0x0D],
  
  // Corte de papel
  CUT_PAPER: [0x1D, 0x56, 0x42, 0x00],
  
  // Feed
  FEED_3_LINES: [0x1B, 0x64, 0x03],
  FEED_5_LINES: [0x1B, 0x64, 0x05]
} as const;

// Configuración de validaciones
export const VALIDATION_CONFIG = {
  PASSWORD: {
    MIN_LENGTH: 6,
    PATTERN: /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_-]+$/
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  DNI: {
    LENGTH: 8,
    PATTERN: /^\d{8}$/
  },
  PHONE: {
    PATTERN: /^[0-9+\-\s()]+$/
  }
} as const;

// Configuración de toast/notificaciones
export const TOAST_CONFIG = {
  DURATION: 3000,
  POSITION: 'top' as const,
  COLORS: {
    SUCCESS: 'success',
    ERROR: 'danger',
    WARNING: 'warning',
    INFO: 'primary'
  }
} as const;

// Configuración de storage
export const STORAGE_KEYS = {
  USER: 'municipal_user',
  BLUETOOTH_DEVICES: 'bluetooth_devices',
  PRINTER_CONFIG: 'printer_config',
  APP_SETTINGS: 'app_settings',
  OFFLINE_DATA: 'offline_data'
} as const;

// Configuración de colores municipales
export const MUNICIPAL_COLORS = {
  PRIMARY: '#5ccedf',
  SECONDARY: '#A4C9F5',
  WARNING: '#d97706',
  ERROR: '#dc2626',
  SUCCESS: '#059669',
  NEUTRAL_50: '#f9fafb',
  NEUTRAL_100: '#f3f4f6',
  NEUTRAL_200: '#e5e7eb',
  NEUTRAL_500: '#6b7280',
  NEUTRAL_900: '#111827'
} as const;

// Configuración de breakpoints responsive
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536
} as const;

// Configuración de timeouts y reintentos
export const TIMEOUT_CONFIG = {
  API_REQUEST: 30000, // 30 segundos
  FILE_UPLOAD: 60000, // 60 segundos
  BLUETOOTH_SCAN: 60000, // 60 segundos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 segundo
} as const;
