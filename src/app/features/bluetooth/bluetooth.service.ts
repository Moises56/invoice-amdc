import { Injectable } from '@angular/core';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx';
import { BehaviorSubject, from, Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { BluetoothDevice } from '../../core/interfaces';
import { ToastController } from '@ionic/angular';
import { PermissionsService } from '../../core/services/permissions.service';

const PRINTER_KEY = 'default_printer';

@Injectable({
  providedIn: 'root',
})
export class BluetoothService {
  private connectionStatus = new BehaviorSubject<boolean>(false);

  constructor(
    private bluetoothSerial: BluetoothSerial,
    private toastCtrl: ToastController,
    private permissionsService: PermissionsService
  ) {
    this.bluetoothSerial.isConnected().then(
      () => this.connectionStatus.next(true),
      () => this.connectionStatus.next(false)
    );
  }

  async scanForDevices(): Promise<BluetoothDevice[]> {
    try {
      const hasPermission = await this.permissionsService.checkAndRequestBluetoothPermissions();
      if (!hasPermission) {
        this.showToast('Permisos necesarios no concedidos.');
        return [];
      }

      await this.bluetoothSerial.isEnabled();
      const devices = await this.bluetoothSerial.discoverUnpaired();
      return devices;
    } catch (error) {
      console.error('Error scanning for bluetooth devices', error);
      this.showToast('Error al escanear. Verifique que el Bluetooth y la Localización estén activados.');
      return [];
    }
  }

  connect(address: string): Observable<void> {
    return this.bluetoothSerial.connect(address).pipe(
      switchMap(() => {
        this.connectionStatus.next(true);
        return of(undefined);
      }),
      catchError((error) => {
        console.error('Error connecting to device', error);
        this.showToast(`Error al conectar: ${error}`);
        this.connectionStatus.next(false);
        throw error;
      })
    );
  }

  async disconnect(): Promise<void> {
    try {
      await this.bluetoothSerial.disconnect();
      this.connectionStatus.next(false);
    } catch (error) {
      console.error('Error disconnecting', error);
      this.showToast('Error al desconectar la impresora.');
    }
  }

  async print(data: string): Promise<void> {
    try {
      await this.bluetoothSerial.write(data);
    } catch (error) {
      console.error('Error printing data', error);
      this.showToast('Error al enviar datos a la impresora.');
      throw error;
    }
  }

  saveDefaultPrinter(device: BluetoothDevice): Promise<void> {
    localStorage.setItem(PRINTER_KEY, JSON.stringify(device));
    return Promise.resolve();
  }

  getDefaultPrinter(): Promise<BluetoothDevice | null> {
    const device = localStorage.getItem(PRINTER_KEY);
    return Promise.resolve(device ? JSON.parse(device) : null);
  }

  checkConnectionStatus(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  /**
   * Devuelve una promesa que resuelve a true si está conectado, de lo contrario a false.
   */
  async isConnected(): Promise<boolean> {
    try {
      await this.bluetoothSerial.isConnected();
      return true;
    } catch (error) {
      return false;
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
    });
    toast.present();
  }
}
