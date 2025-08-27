import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ModalController,
  ToastController,
  AlertController,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonIcon,
  IonToggle,
} from '@ionic/angular/standalone';
import { Observable, Subscription } from 'rxjs';
import { BluetoothService } from '../bluetooth.service';
// import { BluetoothScanEnhancedService, ScanState } from '../bluetooth-scan-enhanced.service';
import { BluetoothDevice } from '../../../core/interfaces';
import { DeviceListPage } from '../device-list/device-list.page';
import { PrintingService } from '../../../shared/services/printing.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { addIcons } from 'ionicons';
import {
  printOutline,
  bluetooth,
  bluetoothOutline,
  search,
  documentOutline,
  print,
  closeCircleOutline,
  closeCircle,
  settingsOutline,
  flash,
  cog,
  chevronForward,
  informationCircleOutline,
  warningOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-bluetooth-settings',
  templateUrl: './bluetooth-settings.page.html',
  styleUrls: ['./bluetooth-settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonIcon,
    IonToggle,
  ],
})
export class BluetoothSettingsPage implements OnInit, OnDestroy {
  defaultPrinter: BluetoothDevice | null = null;
  connectionStatus$: Observable<boolean>;
  autoReconnect = false;

  // Estados del escaneo mejorado
  // scanState$: Observable<ScanState>;
  isScanning = false;
  scanError: string | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private bluetoothService: BluetoothService,
    // private bluetoothScanService: BluetoothScanEnhancedService,
    private printingService: PrintingService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private permissionsService: PermissionsService
  ) {
    this.connectionStatus$ = this.bluetoothService.checkConnectionStatus();
    // this.scanState$ = this.bluetoothScanService.getScanState();

    // Add icons
    addIcons({
      printOutline,
      bluetooth,
      bluetoothOutline,
      search,
      documentOutline,
      print,
      closeCircleOutline,
      closeCircle,
      settingsOutline,
      flash,
      cog,
      chevronForward,
      informationCircleOutline,
      warningOutline,
    });
  }

  async ngOnInit() {
    // Cargar preferencia de reconexión automática
    const saved = localStorage.getItem('auto_reconnect_printer');
    this.autoReconnect = saved === 'true';
    this.defaultPrinter = await this.bluetoothService.getDefaultPrinter();

    // Suscribirse a cambios de estado de escaneo
    // const scanStateSubscription = this.scanState$.subscribe(state => {
    //   this.isScanning = state === ScanState.SCANNING ||
    //                    state === ScanState.CHECKING_PERMISSIONS ||
    //                    state === ScanState.CHECKING_BLUETOOTH;
    // });

    // this.subscriptions.push(scanStateSubscription);

    // Si está activada la reconexión automática y hay impresora guardada, reconectar
    if (this.autoReconnect && this.defaultPrinter) {
      this.connectAndTest(this.defaultPrinter);
    }
  }

  ngOnDestroy() {
    // Limpiar suscripciones
    this.subscriptions.forEach((sub) => sub.unsubscribe());

    // Cancelar escaneo si está en progreso
    // if (this.isScanning) {
    //   this.bluetoothScanService.cancelCurrentScan();
    // }
  }

  async openDeviceList() {
    try {
      // Mostrar modal inmediatamente con estado de carga
      const modal = await this.modalCtrl.create({
        component: DeviceListPage,
      });

      // Presentar modal inmediatamente
      await modal.present();

      // Iniciar escaneo en paralelo (no bloquear la UI)
      this.startBluetoothScan();

      const { data: selectedDevice } =
        await modal.onWillDismiss<BluetoothDevice>();

      if (selectedDevice) {
        await this.bluetoothService.saveDefaultPrinter(selectedDevice);
        this.defaultPrinter = selectedDevice;
        this.showToast(`Impresora ${selectedDevice.name} guardada.`);
        this.connectAndTest(selectedDevice);
      }
    } catch (error) {
      console.error('Error opening device list:', error);
      this.showToast('Error al abrir la lista de dispositivos.');
    }
  }

  /**
   * Inicia el escaneo Bluetooth de forma asíncrona
   */
  private async startBluetoothScan() {
    try {
      // El escaneo se maneja dentro del modal DeviceListPage
      // Esta función se puede usar para lógica adicional si es necesario
      console.log('Iniciando escaneo Bluetooth...');
    } catch (error) {
      console.error('Error durante el escaneo:', error);
    }
  }

  async connectAndTest(device: BluetoothDevice) {
    this.bluetoothService.connect(device.address).subscribe({
      next: () => {
        this.showToast('Conexión exitosa. Impresora lista.');
        this.printTestPage();
      },
      error: () => this.showToast('No se pudo conectar a la impresora.'),
    });
  }

  async printTestPage() {
    if (!this.defaultPrinter) {
      this.showToast('Por favor, seleccione una impresora primero.');
      return;
    }

    const testInvoice = {
      id: 'TEST-001',
      date: new Date(),
      customerName: 'Cliente de Prueba',
      items: [{ quantity: 1, description: 'Página de prueba', price: 0 }],
      subtotal: 0,
      tax: 0,
      total: 0,
    };

    const formattedData =
      this.printingService.formatInvoiceForPrinting(testInvoice);
    try {
      await this.bluetoothService.print(formattedData);
      this.showToast('Página de prueba enviada.');
    } catch (error) {
      // Toast is shown in the service
    }
  }

  disconnect() {
    this.bluetoothService.disconnect();
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
    });
    toast.present();
  }

  onAutoReconnectToggle(event: CustomEvent) {
    this.autoReconnect = event.detail.checked;
    localStorage.setItem(
      'auto_reconnect_printer',
      this.autoReconnect ? 'true' : 'false'
    );
  }

  /**
   * Muestra alerta cuando no se encuentran dispositivos
   */
  private async showNoDevicesAlert() {
    const alert = await this.alertCtrl.create({
      header: 'No se encontraron impresoras',
      message:
        'Asegúrese de que:\n• La impresora esté encendida\n• Esté en modo de emparejamiento\n• Esté cerca del dispositivo\n• Bluetooth esté habilitado',
      buttons: [
        {
          text: 'Ayuda',
          handler: () => {
            this.showTroubleshootingGuide();
          },
        },
        {
          text: 'Reintentar',
          handler: () => {
            this.openDeviceList();
          },
        },
        {
          text: 'Cerrar',
          role: 'cancel',
        },
      ],
    });

    await alert.present();
  }

  /**
   * Muestra información de diagnóstico del sistema
   */
  async showDiagnostics() {
    try {
      const userAgent = navigator.userAgent;
      const platform = this.getPlatformInfo();
      
      const alert = await this.alertCtrl.create({
        header: 'Información de Diagnóstico',
        message: `
Plataforma: ${platform}
User Agent: ${userAgent.substring(0, 100)}...
Cordova: ${this.isCordovaAvailable() ? 'Disponible' : 'No disponible'}
Bluetooth Plugin: ${(window as any).bluetoothSerial ? 'Disponible' : 'No disponible'}
        `,
        buttons: [
          {
            text: 'Cerrar',
            role: 'cancel',
          },
        ],
      });

      await alert.present();
    } catch (error) {
      console.error('Error getting diagnostics:', error);
      this.showToast('Error al obtener información de diagnóstico');
    }
  }

  /**
   * Obtiene información de la plataforma de forma segura
   */
  private getPlatformInfo(): string {
    try {
      // Usar userAgentData si está disponible (más moderno)
      if ('userAgentData' in navigator) {
        const uaData = (navigator as any).userAgentData;
        return uaData.platform || 'Desconocida';
      }

      // Fallback a navigator.platform (deprecated pero funcional)
      return (navigator as any).platform || 'Desconocida';
    } catch (error) {
      return 'No disponible';
    }
  }

  /**
   * Verifica si Bluetooth Web API está disponible
   */
  private checkBluetoothAvailability(): boolean {
    try {
      return 'bluetooth' in navigator;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verifica si Cordova/Capacitor está disponible
   */
  private isCordovaAvailable(): boolean {
    return !!(window as any).cordova || !!(window as any).Capacitor;
  }

  /**
   * Muestra guía de solución de problemas
   */
  async showTroubleshootingGuide() {
    const alert = await this.alertCtrl.create({
      header: 'Guía de Solución de Problemas',
      message: `
1. Verificar Bluetooth:
   • Asegúrese de que Bluetooth esté habilitado
   • Reinicie Bluetooth si es necesario

2. Verificar Permisos:
   • Vaya a Configuración > Aplicaciones > Factus-AMDC > Permisos
   • Habilite todos los permisos de Bluetooth y Ubicación

3. Verificar Impresora:
   • Encienda la impresora
   • Active el modo de emparejamiento
   • Mantenga la impresora cerca (menos de 10 metros)

4. Problemas específicos:
   • Honor/Huawei: Deshabilite optimización de batería
   • Samsung: Verifique permisos de "Dispositivos cercanos"
      `,
      buttons: [
        {
          text: 'Configuración',
          handler: () => {
            // Abrir configuración de la app si es posible
            this.showToast(
              'Abra Configuración > Aplicaciones > Factus-AMDC > Permisos'
            );
          },
        },
        {
          text: 'Entendido',
          role: 'cancel',
        },
      ],
    });

    await alert.present();
  }

  /**
   * Cancela el escaneo actual
   */
  cancelScan() {
    // this.bluetoothScanService.cancelCurrentScan();
    this.showToast('Escaneo cancelado');
  }
}
