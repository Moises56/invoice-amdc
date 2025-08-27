import { Injectable } from '@angular/core';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
import { Platform } from '@ionic/angular';

export interface PermissionResult {
  granted: boolean;
  deniedPermissions: string[];
  deviceSpecificIssues: string[];
}

@Injectable({
  providedIn: 'root'
})
export class BluetoothPermissionsEnhancedService {
  
  private deviceInfo: any = null;
  
  // Permisos base para todas las versiones
  private readonly BASE_PERMISSIONS = [
    'android.permission.BLUETOOTH',
    'android.permission.BLUETOOTH_ADMIN',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION'
  ];

  // Permisos adicionales para Android 12+ (API 31+)
  private readonly ANDROID_12_PERMISSIONS = [
    'android.permission.BLUETOOTH_SCAN',
    'android.permission.BLUETOOTH_CONNECT',
    'android.permission.BLUETOOTH_ADVERTISE'
  ];

  // Permisos adicionales para Android 13+ (API 33+)
  private readonly ANDROID_13_PERMISSIONS = [
    'android.permission.NEARBY_WIFI_DEVICES'
  ];

  // Configuraciones específicas por fabricante
  private readonly MANUFACTURER_CONFIGS = {
    'honor': {
      additionalPermissions: ['android.permission.ACCESS_BACKGROUND_LOCATION'],
      requiresLocationServices: true,
      scanTimeout: 45000, // Honor necesita más tiempo
      retryDelay: 2000
    },
    'samsung': {
      additionalPermissions: ['android.permission.ACCESS_BACKGROUND_LOCATION'],
      requiresLocationServices: true,
      scanTimeout: 30000,
      retryDelay: 1500
    },
    'huawei': {
      additionalPermissions: ['android.permission.ACCESS_BACKGROUND_LOCATION'],
      requiresLocationServices: true,
      scanTimeout: 40000,
      retryDelay: 2000
    }
  };

  constructor(
    private platform: Platform,
    private androidPermissions: AndroidPermissions
  ) {
    this.initializeDeviceInfo();
  }

  private async initializeDeviceInfo() {
    if (this.platform.is('android')) {
      try {
        // Usar información básica del navegador como fallback
        this.deviceInfo = {
          manufacturer: this.getManufacturerFromUserAgent(),
          model: 'Unknown',
          androidSDKVersion: this.getAndroidVersionFromUserAgent()
        };
      } catch (error) {
        console.warn('Could not get device info:', error);
        this.deviceInfo = {
          manufacturer: 'unknown',
          model: 'unknown',
          androidSDKVersion: 30 // Asumir Android 11 por defecto
        };
      }
    }
  }

  private getManufacturerFromUserAgent(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('samsung')) return 'samsung';
    if (userAgent.includes('honor')) return 'honor';
    if (userAgent.includes('huawei')) return 'huawei';
    if (userAgent.includes('xiaomi')) return 'xiaomi';
    if (userAgent.includes('oppo')) return 'oppo';
    if (userAgent.includes('vivo')) return 'vivo';
    if (userAgent.includes('oneplus')) return 'oneplus';
    
    return 'unknown';
  }

  private getAndroidVersionFromUserAgent(): number {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/Android (\d+)/);
    
    if (match) {
      const version = parseInt(match[1], 10);
      // Convertir versión de Android a API level aproximado
      switch (version) {
        case 14: return 34;
        case 13: return 33;
        case 12: return 31;
        case 11: return 30;
        case 10: return 29;
        case 9: return 28;
        case 8: return 26;
        default: return version >= 12 ? 31 : 29; // Asumir API 31 para Android 12+ o 29 para versiones anteriores
      }
    }
    
    return 30; // Android 11 por defecto
  }

  /**
   * Solicita todos los permisos necesarios basado en la versión de Android y fabricante
   */
  async requestAllBluetoothPermissions(): Promise<PermissionResult> {
    if (!this.platform.is('android')) {
      return { granted: true, deniedPermissions: [], deviceSpecificIssues: [] };
    }

    await this.initializeDeviceInfo();
    
    const requiredPermissions = await this.getRequiredPermissions();
    const result: PermissionResult = {
      granted: false,
      deniedPermissions: [],
      deviceSpecificIssues: []
    };

    try {
      // Verificar permisos actuales
      const currentPermissions = await this.checkCurrentPermissions(requiredPermissions);
      
      if (currentPermissions.allGranted) {
        result.granted = true;
        return result;
      }

      // Solicitar permisos faltantes
      const requestResult = await this.requestPermissions(currentPermissions.missing);
      
      if (!requestResult.hasPermission) {
        result.deniedPermissions = currentPermissions.missing;
        result.deviceSpecificIssues = await this.getDeviceSpecificIssues();
        return result;
      }

      // Verificar configuraciones específicas del dispositivo
      const deviceIssues = await this.checkDeviceSpecificRequirements();
      if (deviceIssues.length > 0) {
        result.deviceSpecificIssues = deviceIssues;
      }

      result.granted = true;
      return result;

    } catch (error) {
      console.error('Error requesting Bluetooth permissions:', error);
      result.deviceSpecificIssues.push(`Error del sistema: ${error}`);
      return result;
    }
  }

  /**
   * Obtiene los permisos requeridos basado en la versión de Android
   */
  private async getRequiredPermissions(): Promise<string[]> {
    let permissions = [...this.BASE_PERMISSIONS];
    
    if (!this.deviceInfo) {
      await this.initializeDeviceInfo();
    }

    // Agregar permisos según versión de Android
    if (this.deviceInfo?.androidSDKVersion >= 31) {
      permissions = [...permissions, ...this.ANDROID_12_PERMISSIONS];
    }

    if (this.deviceInfo?.androidSDKVersion >= 33) {
      permissions = [...permissions, ...this.ANDROID_13_PERMISSIONS];
    }

    // Agregar permisos específicos del fabricante
    const manufacturerConfig = this.getManufacturerConfig();
    if (manufacturerConfig?.additionalPermissions) {
      permissions = [...permissions, ...manufacturerConfig.additionalPermissions];
    }

    return [...new Set(permissions)]; // Eliminar duplicados
  }

  /**
   * Verifica el estado actual de los permisos
   */
  private async checkCurrentPermissions(permissions: string[]): Promise<{allGranted: boolean, missing: string[]}> {
    const missing: string[] = [];
    
    for (const permission of permissions) {
      try {
        const result = await this.androidPermissions.checkPermission(permission);
        if (!result.hasPermission) {
          missing.push(permission);
        }
      } catch (error) {
        console.warn(`Could not check permission ${permission}:`, error);
        missing.push(permission);
      }
    }

    return {
      allGranted: missing.length === 0,
      missing
    };
  }

  /**
   * Solicita permisos con manejo de errores mejorado
   */
  private async requestPermissions(permissions: string[]): Promise<{hasPermission: boolean}> {
    if (permissions.length === 0) {
      return { hasPermission: true };
    }

    try {
      // Solicitar permisos en lotes para evitar problemas en algunos dispositivos
      const batchSize = 3;
      const batches = [];
      
      for (let i = 0; i < permissions.length; i += batchSize) {
        batches.push(permissions.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const result = await this.androidPermissions.requestPermissions(batch);
        if (!result.hasPermission) {
          return { hasPermission: false };
        }
        
        // Pequeña pausa entre lotes para dispositivos lentos
        await this.delay(500);
      }

      return { hasPermission: true };
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return { hasPermission: false };
    }
  }

  /**
   * Verifica requisitos específicos del dispositivo
   */
  private async checkDeviceSpecificRequirements(): Promise<string[]> {
    const issues: string[] = [];
    const manufacturerConfig = this.getManufacturerConfig();

    if (manufacturerConfig?.requiresLocationServices) {
      // Verificar si los servicios de ubicación están habilitados
      try {
        const locationResult = await this.androidPermissions.checkPermission(
          this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION
        );
        
        if (!locationResult.hasPermission) {
          issues.push('Los servicios de ubicación deben estar habilitados para este dispositivo');
        }
      } catch (error) {
        issues.push('No se pudo verificar el estado de los servicios de ubicación');
      }
    }

    return issues;
  }

  /**
   * Obtiene problemas específicos del dispositivo
   */
  private async getDeviceSpecificIssues(): Promise<string[]> {
    const issues: string[] = [];
    
    if (!this.deviceInfo) {
      return issues;
    }

    const manufacturer = this.deviceInfo.manufacturer?.toLowerCase();
    
    switch (manufacturer) {
      case 'honor':
        issues.push('Dispositivos Honor: Asegúrese de que la ubicación esté habilitada en Configuración > Privacidad');
        issues.push('Dispositivos Honor: Puede necesitar deshabilitar la optimización de batería para esta app');
        break;
        
      case 'samsung':
        if (this.deviceInfo.androidSDKVersion >= 31) {
          issues.push('Samsung Android 12+: Vaya a Configuración > Aplicaciones > Permisos especiales > Dispositivos cercanos');
        }
        issues.push('Samsung: Asegúrese de que Bluetooth esté visible para otros dispositivos');
        break;
        
      case 'huawei':
        issues.push('Dispositivos Huawei: Deshabilite la gestión automática en Configuración > Batería > Inicio de aplicaciones');
        break;
        
      default:
        if (this.deviceInfo.androidSDKVersion >= 31) {
          issues.push('Android 12+: Algunos dispositivos requieren permisos adicionales en Configuración del sistema');
        }
    }

    return issues;
  }

  /**
   * Obtiene la configuración específica del fabricante
   */
  getManufacturerConfig(): any {
    if (!this.deviceInfo) {
      return null;
    }

    const manufacturer = this.deviceInfo.manufacturer?.toLowerCase();
    return this.MANUFACTURER_CONFIGS[manufacturer as keyof typeof this.MANUFACTURER_CONFIGS] || null;
  }

  /**
   * Obtiene el timeout de escaneo recomendado para el dispositivo
   */
  getRecommendedScanTimeout(): number {
    const config = this.getManufacturerConfig();
    return config?.scanTimeout || 30000; // 30 segundos por defecto
  }

  /**
   * Obtiene el delay de retry recomendado para el dispositivo
   */
  getRecommendedRetryDelay(): number {
    const config = this.getManufacturerConfig();
    return config?.retryDelay || 1000; // 1 segundo por defecto
  }

  /**
   * Verifica si el dispositivo requiere configuraciones especiales
   */
  requiresSpecialHandling(): boolean {
    const config = this.getManufacturerConfig();
    return config !== null;
  }

  /**
   * Obtiene información del dispositivo para debugging
   */
  async getDeviceDebugInfo(): Promise<any> {
    await this.initializeDeviceInfo();
    
    return {
      deviceInfo: this.deviceInfo,
      manufacturerConfig: this.getManufacturerConfig(),
      recommendedTimeout: this.getRecommendedScanTimeout(),
      recommendedRetryDelay: this.getRecommendedRetryDelay(),
      requiresSpecialHandling: this.requiresSpecialHandling()
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}