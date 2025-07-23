import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { PrintingService } from '../../services/printing.service';
import { BluetoothService } from 'src/app/features/bluetooth/bluetooth.service';
import { EstadoCuentaResponse } from '../../interfaces/estado-cuenta.interface';

@Component({
  selector: 'app-print-receipt',
  templateUrl: './print-receipt.component.html',
  styleUrls: ['./print-receipt.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class PrintReceiptComponent {
  @Input() data: EstadoCuentaResponse | null = null;

  private printingService = inject(PrintingService);
  private bluetoothService = inject(BluetoothService);
  private toastController = inject(ToastController);

  async print() {
    if (!this.data) {
      this.presentToast('No hay datos para imprimir.', 'warning');
      return;
    }

    const isConnected = await this.bluetoothService.isConnected();
    if (!isConnected) {
      this.presentToast('No hay ninguna impresora conectada.', 'danger');
      return;
    }

    try {
      const receiptText = this.printingService.formatEstadoCuenta(this.data);
      await this.bluetoothService.print(receiptText);
      this.presentToast('Imprimiendo recibo...', 'success');
    } catch (error) {
      this.presentToast('Error al imprimir el recibo.', 'danger');
    }
  }

  async presentToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    toast.present();
  }
}
