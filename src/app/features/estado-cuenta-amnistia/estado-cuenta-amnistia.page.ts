import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { EstadoCuentaService } from '../estado-cuenta/estado-cuenta.service';
import { EstadoCuentaResponse } from 'src/app/shared/interfaces/estado-cuenta.interface';
import { AuthService } from 'src/app/core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { PrintingService } from 'src/app/shared/services/printing.service';
import { BluetoothService } from '../bluetooth/bluetooth.service';

@Component({
  selector: 'app-estado-cuenta-amnistia',
  templateUrl: './estado-cuenta-amnistia.page.html',
  styleUrls: ['./estado-cuenta-amnistia.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class EstadoCuentaAmnistiaPage implements OnInit {
  private estadoCuentaService = inject(EstadoCuentaService);
  private authService = inject(AuthService);
  private toastController = inject(ToastController);
  private printingService = inject(PrintingService);
  private bluetoothService = inject(BluetoothService);

  estadoCuenta = signal<EstadoCuentaResponse | null>(null);
  isLoading = signal<boolean>(false);
  claveCatastral = signal<string>('');

  constructor() { }

  ngOnInit() {
    const user = this.authService.user();
    if (user && user.claveCatastral) {
      this.claveCatastral.set(user.claveCatastral);
      this.consultarEstadoCuenta();
    }
  }

  consultarEstadoCuenta() {
    const clave = this.claveCatastral();
    if (!clave) {
      this.presentToast('Por favor, ingrese una clave catastral.', 'warning');
      return;
    }

    this.isLoading.set(true);
    this.estadoCuentaService.getEstadoDeCuentaConAmnistia(clave).subscribe({
      next: (data) => {
        this.estadoCuenta.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
        this.presentToast('Error al consultar el estado de cuenta.', 'danger');
      }
    });
  }

  async presentToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    toast.present();
  }

  async imprimirRecibo() {
    const data = this.estadoCuenta();
    if (!data) {
      this.presentToast('No hay datos para imprimir.', 'warning');
      return;
    }

    const isConnected = await this.bluetoothService.isConnected();
    if (!isConnected) {
      this.presentToast('No hay ninguna impresora conectada.', 'danger');
      return;
    }

    try {
      const receiptText = this.printingService.formatEstadoCuenta(data);
      await this.bluetoothService.print(receiptText);
      this.presentToast('Imprimiendo recibo...', 'success');
    } catch (error) {
      this.presentToast('Error al imprimir el recibo.', 'danger');
    }
  }
}
