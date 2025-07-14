import { Component, OnInit } from '@angular/core';
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
} from '@ionic/angular/standalone';
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
  ],
})
export class DeviceListPage implements OnInit {
  devices: BluetoothDevice[] = [];
  isLoading = true;

  constructor(
    private bluetoothService: BluetoothService,
    private modalCtrl: ModalController
  ) {}

  async ngOnInit() {
    this.devices = await this.bluetoothService.scanForDevices();
    this.isLoading = false;
  }

  selectDevice(device: BluetoothDevice) {
    this.modalCtrl.dismiss(device);
  }

  closeModal() {
    this.modalCtrl.dismiss(null);
  }
}
