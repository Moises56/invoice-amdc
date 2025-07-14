import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ModalController,
  ToastController,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { Observable } from 'rxjs';
import { BluetoothService } from '../bluetooth.service';
import { BluetoothDevice } from '../../../core/interfaces';
import { DeviceListPage } from '../device-list/device-list.page';
import { PrintingService } from '../../../shared/services/printing.service';

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
    IonList,
    IonItem,
    IonLabel,
    IonText,
    IonButton,
    IonIcon,
  ],
})
export class BluetoothSettingsPage implements OnInit {
  defaultPrinter: BluetoothDevice | null = null;
  connectionStatus$: Observable<boolean>;

  constructor(
    private bluetoothService: BluetoothService,
    private printingService: PrintingService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {
    this.connectionStatus$ = this.bluetoothService.checkConnectionStatus();
  }

  async ngOnInit() {
    this.defaultPrinter = await this.bluetoothService.getDefaultPrinter();
  }

  async openDeviceList() {
    const modal = await this.modalCtrl.create({
      component: DeviceListPage,
    });

    await modal.present();

    const { data: selectedDevice } = await modal.onWillDismiss<BluetoothDevice>();

    if (selectedDevice) {
      await this.bluetoothService.saveDefaultPrinter(selectedDevice);
      this.defaultPrinter = selectedDevice;
      this.showToast(`Impresora ${selectedDevice.name} guardada.`);
      this.connectAndTest(selectedDevice);
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

    const formattedData = this.printingService.formatInvoiceForPrinting(testInvoice);
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
}
