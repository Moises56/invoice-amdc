import { Injectable } from '@angular/core';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx';
import { BehaviorSubject, Observable, Subject, timer } from 'rxjs';
import { takeUntil, timeout, catchError, retry, delay } from 'rxjs/operators';
import { BluetoothDevice } from '../../core/interfaces';
import { BluetoothPermissionsEnhancedService } from '../../core/services/bluetooth-permissions-enhanced.service';
import { ToastController, LoadingController } from '@ionic/angular';

export enum ScanState {
  IDLE = 'idle',
  CHECKING_PERMISSIONS = 'checking_permissions',
  CHECKING_BLUETOOTH = 'checking_bluetooth',
  SCANNING = 'scanning',
  COMPLETED = 'completed',
  ERROR = 'error',
  TIMEOUT = 'timeout'
}

export interface ScanResult {
  devices: BluetoothDevice[];
  state: ScanState;
  error?: string;
  duration?: number;
  deviceSpecificIssues?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class BluetoothScanEnhancedService {
  
  private scanState$ = new BehaviorSubject<ScanState>(ScanState.IDLE);
  private scanResult$ = new BehaviorSubject<ScanResult>({
    devices: [],
    state: ScanState.IDLE
  });
  
  private cancelScan$ = new Subject<void>();
  private currentScanTimeout: number = 30000;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  // Filtros para identificar impresoras
  private readonly PRINTER_NAME_PATTERNS = [
    /printer/i,
    /print/i,
    /pos/i,
    /thermal/i,
    /receipt/i,
    /ticket/i,
    /epson/i,
    /citizen/i,
    /star/i,
    /bixolon/i,
    /sewoo/i,
    /custom/i,
    /xprinter/i,
    /goojprt/i,
    /milestone/i,
    /rpp/i,
    /mtp/i,
    /bt\-/i,
    /rp\-/i
  ];

  constructor(
    private bluetoothSerial: BluetoothSerial,
    private permissionsService: BluetoothPermissionsEnhancedService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {
    this.initializeDeviceSpecificSettings();
  }

  /**
   * Inicializa configuraciones específicas del dispositivo
   */
  private async initializeDeviceSpecificSettings() {
    this.currentScanTimeout = this.permissionsService.getRecommendedScanTimeout();
    this.retryDelay = this.permissionsService.getRecommendedRetryDelay();
    
    // Ajustar número de reintentos según el dispositivo
    if (this.permissionsService.requiresSpecialHandling()) {
      this.maxRetries = 5; // Más reintentos para dispositivos problemáticos
    }
  }

  /**
   * Escanea dispositivos Bluetooth con manejo avanzado de errores
   */
  async scanForDevices(): Promise<ScanResult> {
    const startTime = Date.now();
    let loading: HTMLIonLoadingElement | null = null;

    try {
      // Mostrar loading
      loading = await this.showScanningLoader();
      
      // Resetear estado
      this.cancelScan$ = new Subject<void>();
      this.updateScanState(ScanState.CHECKING_PERMISSIONS);

      // Verificar permisos
      const permissionResult = await this.permissionsService.requestAllBluetoothPermissions();
      if (!permissionResult.granted) {
        const result: ScanResult = {
          devices: [],
          state: ScanState.ERROR,
          error: 'Permisos insuficientes para escanear dispositivos Bluetooth',
          deviceSpecificIssues: permissionResult.deviceSpecificIssues,
          duration: Date.now() - startTime
        };
        
        this.updateScanResult(result);
        await this.showPermissionError(permissionResult);
        return result;
      }

      // Verificar estado de Bluetooth
      this.updateScanState(ScanState.CHECKING_BLUETOOTH);
      await this.ensureBluetoothEnabled();

      // Realizar escaneo con reintentos
      this.updateScanState(ScanState.SCANNING);
      const devices = await this.performScanWithRetry();

      // Filtrar dispositivos de impresora
      const printerDevices = this.filterPrinterDevices(devices);

      const result: ScanResult = {
        devices: printerDevices,
        state: ScanState.COMPLETED,
        duration: Date.now() - startTime
      };

      this.updateScanResult(result);
      await this.showScanResults(printerDevices.length);
      
      return result;

    } catch (error) {
      const result: ScanResult = {
        devices: [],
        state: ScanState.ERROR,
        error: this.getErrorMessage(error),
        duration: Date.now() - startTime
      };

      this.updateScanResult(result);
      await this.showScanError(error);
      
      return result;
    } finally {
      if (loading) {
        await loading.dismiss();
      }
    }
  }

  /**
   * Realiza el escaneo con reintentos automáticos
   */
  private async performScanWithRetry(): Promise<BluetoothDevice[]> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`Intento de escaneo ${attempt}/${this.maxRetries}`);
        
        const devices = await this.performSingleScan();
        
        if (devices.length > 0) {
          console.log(`Escaneo exitoso en intento ${attempt}, encontrados ${devices.length} dispositivos`);
          return devices;
        }
        
        // Si no se encontraron dispositivos, intentar de nuevo (excepto en el último intento)
        if (attempt < this.maxRetries) {
          console.log(`No se encontraron dispositivos en intento ${attempt}, reintentando...`);
          await this.delay(this.retryDelay * attempt); // Backoff exponencial
        }
        
      } catch (error) {
        lastError = error;
        console.error(`Error en intento de escaneo ${attempt}:`, error);
        
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }
    
    // Si llegamos aquí, todos los intentos fallaron
    throw lastError || new Error('No se encontraron dispositivos después de múltiples intentos');
  }

  /**
   * Realiza un escaneo individual con timeout
   */
  private async performSingleScan(): Promise<BluetoothDevice[]> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout de escaneo (${this.currentScanTimeout}ms)`));
      }, this.currentScanTimeout);

      // Cancelar si se solicita
      const cancelSubscription = this.cancelScan$.subscribe(() => {
        clearTimeout(timeoutId);
        reject(new Error('Escaneo cancelado por el usuario'));
      });

      this.bluetoothSerial.discoverUnpaired()
        .then(devices => {
          clearTimeout(timeoutId);
          cancelSubscription.unsubscribe();
          resolve(devices || []);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          cancelSubscription.unsubscribe();
          reject(error);
        });
    });
  }

  /**
   * Verifica y habilita Bluetooth si es necesario
   */
  private async ensureBluetoothEnabled(): Promise<void> {
    try {
      await this.bluetoothSerial.isEnabled();
    } catch (error) {
      // Bluetooth no está habilitado, intentar habilitarlo
      try {
        await this.bluetoothSerial.enable();
        // Esperar un momento para que se habilite completamente
        await this.delay(2000);
      } catch (enableError) {
        throw new Error('Bluetooth no está habilitado. Por favor, habilítelo manualmente en Configuración.');
      }
    }
  }

  /**
   * Filtra dispositivos que probablemente sean impresoras
   */
  private filterPrinterDevices(devices: BluetoothDevice[]): BluetoothDevice[] {
    return devices.filter(device => {
      if (!device.name) {
        return false; // Excluir dispositivos sin nombre
      }

      // Verificar si el nombre coincide con patrones de impresora
      return this.PRINTER_NAME_PATTERNS.some(pattern => 
        pattern.test(device.name)
      );
    });
  }

  /**
   * Cancela el escaneo actual
   */
  cancelCurrentScan(): void {
    this.cancelScan$.next();
    this.updateScanState(ScanState.IDLE);
  }

  /**
   * Obtiene el estado actual del escaneo
   */
  getScanState(): Observable<ScanState> {
    return this.scanState$.asObservable();
  }

  /**
   * Obtiene el resultado actual del escaneo
   */
  getScanResult(): Observable<ScanResult> {
    return this.scanResult$.asObservable();
  }

  /**
   * Actualiza el estado del escaneo
   */
  private updateScanState(state: ScanState): void {
    this.scanState$.next(state);
  }

  /**
   * Actualiza el resultado del escaneo
   */
  private updateScanResult(result: ScanResult): void {
    this.scanResult$.next(result);
  }

  /**
   * Muestra loader durante el escaneo
   */
  private async showScanningLoader(): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingCtrl.create({
      message: 'Escaneando dispositivos Bluetooth...',
      spinner: 'crescent',
      duration: this.currentScanTimeout + 5000 // Un poco más que el timeout
    });
    
    await loading.present();
    return loading;
  }

  /**
   * Muestra error de permisos con información específica del dispositivo
   */
  private async showPermissionError(permissionResult: any): Promise<void> {
    let message = 'Permisos de Bluetooth insuficientes.';
    
    if (permissionResult.deviceSpecificIssues.length > 0) {
      message += '\n\nSugerencias para su dispositivo:\n' + 
                 permissionResult.deviceSpecificIssues.join('\n');
    }

    const toast = await this.toastCtrl.create({
      message,
      duration: 8000,
      position: 'bottom',
      color: 'warning',
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });
    
    await toast.present();
  }

  /**
   * Muestra resultados del escaneo
   */
  private async showScanResults(deviceCount: number): Promise<void> {
    const message = deviceCount > 0 
      ? `Se encontraron ${deviceCount} impresora(s) Bluetooth`
      : 'No se encontraron impresoras Bluetooth. Asegúrese de que estén encendidas y en modo de emparejamiento.';

    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: deviceCount > 0 ? 'success' : 'warning'
    });
    
    await toast.present();
  }

  /**
   * Muestra error de escaneo
   */
  private async showScanError(error: any): Promise<void> {
    const message = this.getErrorMessage(error);
    
    const toast = await this.toastCtrl.create({
      message: `Error al escanear: ${message}`,
      duration: 5000,
      position: 'bottom',
      color: 'danger',
      buttons: [
        {
          text: 'Reintentar',
          handler: () => {
            this.scanForDevices();
          }
        },
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });
    
    await toast.present();
  }

  /**
   * Obtiene mensaje de error legible
   */
  private getErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    // Errores comunes de Bluetooth
    const errorString = error?.toString() || '';
    
    if (errorString.includes('timeout')) {
      return 'Tiempo de espera agotado. Intente de nuevo.';
    }
    
    if (errorString.includes('permission')) {
      return 'Permisos insuficientes. Verifique la configuración de la aplicación.';
    }
    
    if (errorString.includes('bluetooth')) {
      return 'Error de Bluetooth. Asegúrese de que esté habilitado.';
    }
    
    return 'Error desconocido durante el escaneo';
  }

  /**
   * Obtiene información de diagnóstico
   */
  async getDiagnosticInfo(): Promise<any> {
    const deviceDebugInfo = await this.permissionsService.getDeviceDebugInfo();
    
    return {
      ...deviceDebugInfo,
      scanSettings: {
        timeout: this.currentScanTimeout,
        maxRetries: this.maxRetries,
        retryDelay: this.retryDelay
      },
      currentState: this.scanState$.value,
      lastResult: this.scanResult$.value
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}