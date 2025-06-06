import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton,
  IonText, IonSpinner, IonIcon, IonButton, IonList, IonItem,
  IonLabel, IonListHeader, IonBadge, IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  bluetoothOutline, 
  refreshOutline, 
  printOutline, 
  hardwareChipOutline,
  bluetooth,
  refreshCircle,
  print,
  hardwareChip
} from 'ionicons/icons';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-device-list',
  templateUrl: './device-list.page.html',
  styleUrls: ['./device-list.page.scss'],
  standalone: true,  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, 
    IonButtons, IonBackButton, IonText, IonSpinner, 
    IonIcon, IonButton, IonList, IonItem,
    IonLabel, IonListHeader, IonBadge
  ]
})
export class DeviceListPage implements OnInit, OnDestroy {
  isScanning = false;
  devices: any[] = [];
  private subscription: Subscription | null = null;
    constructor() {
    addIcons({
      bluetoothOutline,
      refreshCircle,
      printOutline,
      hardwareChipOutline,
      print,
      hardwareChip,
      bluetooth,
      refreshOutline
    });
  }

  ngOnInit() {
    this.scanDevices();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  scanDevices() {
    this.isScanning = true;
    // Mock data for now - would connect to a Bluetooth service in a real app
    setTimeout(() => {
      this.devices = [
        { id: 'AB:CD:EF:12:34:56', name: 'Thermal Printer 58mm', connected: false },
        { id: '12:34:56:78:9A:BC', name: 'POS Printer 80mm', connected: false },
        { id: 'DD:EE:FF:AA:BB:CC', name: 'Bluetooth Device', connected: false }
      ];
      this.isScanning = false;
    }, 2000);
  }

  selectDevice(device: any) {
    // Would handle device selection and connection in a real app
    device.connected = !device.connected;
  }
}
