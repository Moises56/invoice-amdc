import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonBackButton,
  IonButtons,
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonToggle,
  IonAlert
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  printOutline, 
  settingsOutline, 
  checkmarkCircleOutline,
  closeCircleOutline,
  refreshOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-printer-config',
  templateUrl: './printer-config.page.html',
  styleUrls: ['./printer-config.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonBackButton,
    IonButtons,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonToggle,
    IonAlert
  ]
})
export class PrinterConfigPage implements OnInit {
  selectedPrinter: string = '';
  printerSettings = {
    paperSize: '80mm',
    encoding: 'UTF-8',
    autoConnect: true,
    testPrint: false
  };

  availablePrinters: any[] = [];
  isConnected = false;
  isAlertOpen = false;
  alertMessage = '';
  constructor() {
    addIcons({
      printOutline,
      settingsOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      refreshOutline
    });
  }

  ngOnInit() {
    this.loadPrinters();
  }

  loadPrinters() {
    // Placeholder for loading available printers
    this.availablePrinters = [
      { id: '1', name: 'Thermal Printer 1', type: 'Bluetooth' },
      { id: '2', name: 'Network Printer', type: 'WiFi' },
      { id: '3', name: 'USB Printer', type: 'USB' }
    ];
  }

  connectToPrinter() {
    if (!this.selectedPrinter) {
      this.showAlert('Por favor selecciona una impresora');
      return;
    }

    // Placeholder for printer connection logic
    this.isConnected = true;
    this.showAlert('Conectado exitosamente a la impresora');
  }

  disconnectPrinter() {
    this.isConnected = false;
    this.selectedPrinter = '';
    this.showAlert('Desconectado de la impresora');
  }

  testPrint() {
    if (!this.isConnected) {
      this.showAlert('Primero conecta a una impresora');
      return;
    }

    // Placeholder for test print functionality
    this.showAlert('Impresión de prueba enviada');
  }

  refreshPrinters() {
    this.loadPrinters();
    this.showAlert('Lista de impresoras actualizada');
  }

  private showAlert(message: string) {
    this.alertMessage = message;
    this.isAlertOpen = true;
  }

  onAlertDismiss() {
    this.isAlertOpen = false;
  }
}
