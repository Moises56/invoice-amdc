import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { EstadoCuentaService, SearchParams } from './estado-cuenta.service';
import { EstadoCuentaResponse } from 'src/app/shared/interfaces/estado-cuenta.interface';
import { FormsModule } from '@angular/forms';
import { PrintingService } from 'src/app/shared/services/printing.service';
import { BluetoothService } from '../bluetooth/bluetooth.service';
import { SearchInputComponent } from 'src/app/shared/components/search-input/search-input.component';

@Component({
  selector: 'app-estado-cuenta',
  templateUrl: './estado-cuenta.page.html',
  styleUrls: ['./estado-cuenta.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, SearchInputComponent]
})
export class EstadoCuentaPage implements OnInit {
  private estadoCuentaService = inject(EstadoCuentaService);
  private toastController = inject(ToastController);
  private printingService = inject(PrintingService);
  private bluetoothService = inject(BluetoothService);

  estadoCuenta = signal<EstadoCuentaResponse | null>(null);
  isLoading = signal<boolean>(false);
  lastSearchParams: SearchParams | undefined = undefined;
  searchError = signal<string>('');

  constructor() { }

  ngOnInit() {
    // Inicialización sin búsqueda automática
  }

  onSearch(searchParams: SearchParams) {
    if (!searchParams.claveCatastral && !searchParams.dni) {
      this.presentToast('Por favor, ingrese un valor de búsqueda.', 'warning');
      return;
    }

    this.isLoading.set(true);
    this.searchError.set('');
    this.lastSearchParams = searchParams;

    this.estadoCuentaService.getEstadoDeCuentaBySearch(searchParams).subscribe({
      next: (data) => {
        this.estadoCuenta.set(data);
        this.isLoading.set(false);
        this.presentToast('Estado de cuenta consultado exitosamente.', 'success');
      },
      error: (err) => {
        console.error('Error al consultar estado de cuenta:', err);
        this.isLoading.set(false);
        this.estadoCuenta.set(null);
        
        // Manejo específico de errores
        if (err.status === 404) {
          this.searchError.set('No se encontraron datos para los parámetros de búsqueda proporcionados.');
          this.presentToast('No se encontraron datos.', 'warning');
        } else if (err.status === 400) {
          this.searchError.set('Parámetros de búsqueda inválidos. Verifique los datos ingresados.');
          this.presentToast('Datos de búsqueda inválidos.', 'danger');
        } else if (err.status === 500) {
          this.searchError.set('Error interno del servidor. Intente nuevamente más tarde.');
          this.presentToast('Error del servidor. Intente más tarde.', 'danger');
        } else {
          this.searchError.set('Error al consultar el estado de cuenta. Verifique su conexión.');
          this.presentToast('Error al consultar el estado de cuenta.', 'danger');
        }
      }
    });
  }

  onClearSearch() {
    this.estadoCuenta.set(null);
    this.searchError.set('');
    this.lastSearchParams = undefined;
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
      this.presentToast('No hay ninguna impresora conectada. Configure la impresora en Configuración > Bluetooth.', 'danger');
      return;
    }

    try {
      this.presentToast('Preparando impresión...', 'success');
      const receiptText = this.printingService.formatEstadoCuenta(
        data, 
        this.lastSearchParams, 
        false // isAmnesty = false para estado-cuenta normal
      );
      await this.bluetoothService.print(receiptText);
      this.presentToast('Recibo enviado a la impresora exitosamente.', 'success');
    } catch (error) {
      console.error('Error al imprimir:', error);
      this.presentToast('Error al imprimir el recibo. Verifique la conexión de la impresora.', 'danger');
    }
  }

  getSearchSummary(): string {
    const params = this.lastSearchParams;
    if (!params) return '';
    
    if (params.claveCatastral) {
      return `Clave Catastral: ${params.claveCatastral}`;
    } else if (params.dni) {
      return `DNI: ${params.dni}`;
    }
    return '';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2
    }).format(amount);
  }

  getTotalDeuda(): number {
    const data = this.estadoCuenta();
    return data ? data.totalGeneralNumerico : 0;
  }

  getCantidadPeriodos(): number {
    const data = this.estadoCuenta();
    return data ? data.detallesMora.length : 0;
  }
}
