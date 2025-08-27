import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ModalController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner,
  IonNote,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bluetooth,
  bluetoothOutline,
  checkmarkCircle,
  radioButtonOff,
  chevronForward,
  close,
} from 'ionicons/icons';
import { BluetoothDevice } from '../../../core/interfaces';
import { BluetoothService } from '../bluetooth.service';

@Component({
  selector: 'app-device-list',
  templateUrl: './device-list.page.html',
  styleUrls: ['./device-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner,
    IonNote,
    IonIcon,
  ],
})
export class DeviceListPage implements OnInit {
  @Input() devices: BluetoothDevice[] = [];
  @Input() scanDuration?: number;

  pairedDevices: BluetoothDevice[] = [];
  unpairedDevices: BluetoothDevice[] = [];
  allDevices: BluetoothDevice[] = [];

  isLoading = true;
  isLoadingPaired = true;
  isLoadingUnpaired = true;

  constructor(
    private bluetoothService: BluetoothService,
    private modalCtrl: ModalController
  ) {
    // Agregar iconos
    addIcons({
      bluetooth,
      bluetoothOutline,
      checkmarkCircle,
      radioButtonOff,
      chevronForward,
      close,
    });
  }

  async ngOnInit() {
    console.log('🚀 Iniciando DeviceListPage...');

    // Si se proporcionaron dispositivos, usarlos
    if (this.devices && this.devices.length > 0) {
      this.allDevices = this.devices;
      this.isLoading = false;
      return;
    }

    // Cargar dispositivos de forma simple y directa
    await this.loadAllDevicesSimple();
  }

  /**
   * Carga todos los dispositivos de forma simple
   */
  private async loadAllDevicesSimple() {
    try {
      console.log('📱 Cargando dispositivos de forma simple...');

      // Paso 1: Obtener dispositivos emparejados (rápido)
      console.log('📋 Obteniendo emparejados...');
      this.pairedDevices = await this.bluetoothService.getPairedDevices();
      console.log('✅ Emparejados obtenidos:', this.pairedDevices.length);

      // Mostrar emparejados inmediatamente si los hay
      if (this.pairedDevices.length > 0) {
        this.updateAllDevices();
        this.isLoading = false;
        this.isLoadingPaired = false;
      }

      // Paso 2: Escanear nuevos dispositivos (lento)
      console.log('🔍 Escaneando nuevos dispositivos...');
      const scannedDevices = await this.bluetoothService.scanForDevices();
      console.log('✅ Nuevos dispositivos encontrados:', scannedDevices.length);

      // Filtrar duplicados
      const pairedAddresses = this.pairedDevices.map(
        (device) => device.address
      );
      this.unpairedDevices = scannedDevices.filter(
        (device) => !pairedAddresses.includes(device.address)
      );

      // Actualizar UI final
      this.updateAllDevices();
      this.isLoading = false;
      this.isLoadingPaired = false;
      this.isLoadingUnpaired = false;

      console.log(
        '🎉 Carga completa. Total dispositivos:',
        this.allDevices.length
      );
    } catch (error) {
      console.error('❌ Error cargando dispositivos:', error);
      this.isLoading = false;
      this.isLoadingPaired = false;
      this.isLoadingUnpaired = false;
    }
  }

  /**
   * Actualiza la lista combinada de dispositivos
   */
  private updateAllDevices() {
    this.allDevices = [...this.pairedDevices, ...this.unpairedDevices];
  }

  /**
   * Verifica si un dispositivo está emparejado
   */
  isPairedDevice(device: BluetoothDevice): boolean {
    return this.pairedDevices.some(
      (paired) => paired.address === device.address
    );
  }

  selectDevice(device: BluetoothDevice) {
    this.modalCtrl.dismiss(device);
  }

  closeModal() {
    this.modalCtrl.dismiss(null);
  }
}
