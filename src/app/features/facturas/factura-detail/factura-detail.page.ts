import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton,
  IonButton, IonIcon, IonButtons, LoadingController, ToastController,
  IonList, IonItem, IonLabel, IonSkeletonText, IonChip
} from '@ionic/angular/standalone';
import { Invoice } from '../../../core/interfaces';
import { BluetoothService } from '../../bluetooth/bluetooth.service';
import { PrintingService } from '../../../shared/services/printing.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FacturasService } from '../facturas.service';
import { Factura } from '../../../shared/interfaces';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-factura-detail',
  templateUrl: './factura-detail.page.html',
  styleUrl: './factura-detail.page.scss',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton,
    IonButton, IonIcon, IonButtons, IonList, IonItem, IonLabel,
    IonSkeletonText, IonChip
  ]
})
export class FacturaDetailPage implements OnInit {
  
  factura = signal<Factura | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  constructor(
    private bluetoothService: BluetoothService,
    private printingService: PrintingService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private route: ActivatedRoute,
    private router: Router,
    private facturasService: FacturasService
  ) { }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('ID de factura no válido');
      this.isLoading.set(false);
      return;
    }

    try {
      const response = await firstValueFrom(this.facturasService.getFacturaById(id));
      if (response.data) {
        this.factura.set(response.data);
      } else {
        this.error.set('Factura no encontrada');
      }
    } catch (error: any) {
      console.error('Error cargando factura:', error);
      this.error.set('Error al cargar la factura');
    } finally {
      this.isLoading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/facturas']);
  }

  editFactura() {
    if (this.factura()) {
      this.router.navigate(['/facturas/editar', this.factura()!.id]);
    }
  }

  async printInvoice() {
    const currentFactura = this.factura();
    if (!currentFactura) {
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
          // Convertir Factura a Invoice para el servicio de impresión
          const invoiceData: Invoice = {
            id: currentFactura.numero_factura,
            date: currentFactura.createdAt,
            customerName: currentFactura.propietario_nombre || 'Sin propietario',
            items: [
              {
                quantity: 1,
                description: currentFactura.concepto,
                price: currentFactura.monto
              }
            ],
            subtotal: currentFactura.monto,
            tax: 0,
            total: currentFactura.monto
          };
          
          const formattedData = this.printingService.formatInvoiceForPrinting(invoiceData);
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
