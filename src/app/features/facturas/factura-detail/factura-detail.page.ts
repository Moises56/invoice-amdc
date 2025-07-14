import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton,
  IonText, IonButton, IonIcon, IonButtons, LoadingController, ToastController,
  IonList, IonItem, IonLabel
} from '@ionic/angular/standalone';
import { Invoice } from '../../../core/interfaces';
import { BluetoothService } from '../../bluetooth/bluetooth.service';
import { PrintingService } from '../../../shared/services/printing.service';
import { ActivatedRoute } from '@angular/router';
import { FacturasService } from '../facturas.service';

@Component({
  selector: 'app-factura-detail',
  templateUrl: './factura-detail.page.html',
  styleUrls: ['./factura-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonText,
    IonButton, IonIcon, IonButtons, IonList, IonItem, IonLabel
  ]
})
export class FacturaDetailPage implements OnInit {
  
  factura: Invoice | null = null; // Asumimos que este objeto se carga de alguna manera

  constructor(
    private bluetoothService: BluetoothService,
    private printingService: PrintingService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private route: ActivatedRoute,
    private facturasService: FacturasService
  ) { }

  ngOnInit() {
    // Cargar datos de la factura (simulado)
    const id = this.route.snapshot.paramMap.get('id');
    // this.facturasService.getFactura(id).subscribe(data => this.factura = data);
    
    // Datos de ejemplo mientras se implementa el servicio
    this.factura = {
      id: id || 'FAC-001',
      date: new Date(),
      customerName: 'Juan Perez',
      items: [
        { quantity: 2, description: 'Producto A', price: 10.00 },
        { quantity: 1, description: 'Producto B', price: 25.50 },
      ],
      subtotal: 45.50,
      tax: 6.83,
      total: 52.33
    };
  }

  async printInvoice() {
    if (!this.factura) {
      this.showToast('No hay datos de factura para imprimir.');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Imprimiendo...',
    });
    await loading.present();

    try {
      const printer = await this.bluetoothService.getDefaultPrinter();
      if (!printer) {
        throw new Error('No hay una impresora predeterminada configurada.');
      }

      this.bluetoothService.connect(printer.address).subscribe({
        next: async () => {
          const formattedData = this.printingService.formatInvoiceForPrinting(this.factura!);
          await this.bluetoothService.print(formattedData);
          await this.bluetoothService.disconnect();
          this.showToast('Factura impresa correctamente.');
          loading.dismiss();
        },
        error: (err) => {
          loading.dismiss();
          this.showToast(`Error de conexión: ${err.message || 'Revise la impresora.'}`);
        }
      });
    } catch (error: any) {
      loading.dismiss();
      this.showToast(`Error: ${error.message}`);
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
