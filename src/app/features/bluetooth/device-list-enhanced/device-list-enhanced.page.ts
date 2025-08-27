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
  IonNote,
  IonIcon,
  IonBadge,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/angular/standalone';
import { BluetoothDevice } from '../../../core/interfaces';
import { addIcons } from 'ionicons';
import {
  bluetoothOutline,
  printOutline,
  timeOutline,
  checkmarkCircleOutline,
  informationCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-device-list-enhanced',
  templateUrl: './device-list-enhanced.page.html',
  styleUrls: ['./device-list-enhanced.page.scss'],
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
    IonNote,
    IonIcon,
    IonBadge,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
  ],
})
export class DeviceListEnhancedPage implements OnInit {
  @Input() devices: BluetoothDevice[] = [];
  @Input() scanDuration?: number;

  constructor(private modalCtrl: ModalController) {
    addIcons({
      bluetoothOutline,
      printOutline,
      timeOutline,
      checkmarkCircleOutline,
      informationCircleOutline
    });
  }

  ngOnInit() {
    // Ordenar dispositivos por nombre para mejor UX
    this.devices.sort((a, b) => {
      if (!a.name && !b.name) return 0;
      if (!a.name) return 1;
      if (!b.name) return -1;
      return a.name.localeCompare(b.name);
    });
  }

  selectDevice(device: BluetoothDevice) {
    this.modalCtrl.dismiss(device);
  }

  closeModal() {
    this.modalCtrl.dismiss(null);
  }

  /**
   * Determina si un dispositivo es probablemente una impresora
   */
  isPrinterDevice(device: BluetoothDevice): boolean {
    if (!device.name) return false;
    
    const printerPatterns = [
      /printer/i, /print/i, /pos/i, /thermal/i, /receipt/i,
      /ticket/i, /epson/i, /citizen/i, /star/i, /bixolon/i
    ];
    
    return printerPatterns.some(pattern => pattern.test(device.name));
  }

  /**
   * Obtiene el icono apropiado para el dispositivo
   */
  getDeviceIcon(device: BluetoothDevice): string {
    return this.isPrinterDevice(device) ? 'print-outline' : 'bluetooth-outline';
  }

  /**
   * Obtiene el color del badge según el tipo de dispositivo
   */
  getDeviceBadgeColor(device: BluetoothDevice): string {
    return this.isPrinterDevice(device) ? 'success' : 'medium';
  }

  /**
   * Obtiene el texto del badge
   */
  getDeviceBadgeText(device: BluetoothDevice): string {
    return this.isPrinterDevice(device) ? 'Impresora' : 'Dispositivo';
  }

  /**
   * Formatea la duración del escaneo
   */
  getFormattedScanDuration(): string {
    if (!this.scanDuration) return '';
    
    const seconds = Math.round(this.scanDuration / 1000);
    return `${seconds}s`;
  }

  /**
   * TrackBy function para optimizar el rendimiento de la lista
   */
  trackByDeviceId(index: number, device: BluetoothDevice): string {
    return device.id || device.address || index.toString();
  }
}