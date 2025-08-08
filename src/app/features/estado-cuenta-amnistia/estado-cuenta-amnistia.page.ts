import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { EstadoCuentaService, SearchParams } from '../estado-cuenta/estado-cuenta.service';
import { 
  EstadoCuentaResponse, 
  ConsultaECResponseNueva, 
  ConsultaParams,
  OpcionesImpresion,
  PropiedadDto 
} from 'src/app/shared/interfaces/estado-cuenta.interface';
import { AuthService } from 'src/app/core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { EstadoCuentaPrinterService } from 'src/app/shared/services/estado-cuenta-printer.service';
import { BluetoothService } from '../bluetooth/bluetooth.service';
import { SearchInputComponent } from 'src/app/shared/components/search-input/search-input.component';

@Component({
  selector: 'app-estado-cuenta-amnistia',
  templateUrl: './estado-cuenta-amnistia.page.html',
  styleUrls: ['./estado-cuenta-amnistia.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, SearchInputComponent]
})
export class EstadoCuentaAmnistiaPage implements OnInit {
  private estadoCuentaService = inject(EstadoCuentaService);
  private authService = inject(AuthService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private estadoCuentaPrinterService = inject(EstadoCuentaPrinterService);
  private bluetoothService = inject(BluetoothService);

  // Datos de respuesta unificada
  consultaResponse = signal<ConsultaECResponseNueva | null>(null);
  
  // Compatibilidad con formato legacy
  estadoCuenta = signal<EstadoCuentaResponse | null>(null);
  
  // Estados de la aplicación
  isLoading = signal<boolean>(false);
  lastSearchParams: SearchParams | undefined = undefined;
  searchError = signal<string>('');
  
  // Configuración de vista
  mostrarMultiplesPropiedades = signal<boolean>(false);
  propiedadSeleccionada = signal<PropiedadDto | null>(null);
  indicePropiedadSeleccionada = signal<number>(0);

  constructor() { }

  ngOnInit() {
    // Inicialización automática removida para permitir búsqueda manual
    // El usuario ahora debe usar el componente de búsqueda
  }

  onSearch(searchParams: SearchParams) {
    if (!searchParams.claveCatastral && !searchParams.dni) {
      this.presentToast('Por favor, ingrese un valor de búsqueda.', 'warning');
      return;
    }

    this.isLoading.set(true);
    this.searchError.set('');
    this.lastSearchParams = searchParams;
    this.limpiarDatos();

    const consultaParams: ConsultaParams = {
      conAmnistia: true // Para amnistía
    };

    if (searchParams.claveCatastral) {
      consultaParams.claveCatastral = searchParams.claveCatastral;
    } else if (searchParams.dni) {
      consultaParams.dni = searchParams.dni;
    }

    this.estadoCuentaService.consultarEstadoCuenta(consultaParams).subscribe({
      next: (response) => {
        this.procesarRespuestaConsulta(response);
        this.isLoading.set(false);
        this.presentToast('Estado de cuenta con amnistía consultado exitosamente.', 'success');
      },
      error: (err) => {
        console.error('Error al consultar estado de cuenta con amnistía:', err);
        this.isLoading.set(false);
        this.limpiarDatos();
        
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

  private procesarRespuestaConsulta(response: ConsultaECResponseNueva) {
    this.consultaResponse.set(response);
    
    if (response.tipoConsulta === 'dni' && response.propiedades && response.propiedades.length > 0) {
      // Consulta por DNI - múltiples propiedades
      this.mostrarMultiplesPropiedades.set(true);
      this.propiedadSeleccionada.set(response.propiedades[0]);
      this.indicePropiedadSeleccionada.set(0);
      
      // Generar formato legacy para la primera propiedad
      this.estadoCuenta.set(this.estadoCuentaService.convertirAFormatoLegacy(response, 0));
    } else {
      // Consulta por clave catastral - individual
      this.mostrarMultiplesPropiedades.set(false);
      this.propiedadSeleccionada.set(null);
      
      // Generar formato legacy
      this.estadoCuenta.set(this.estadoCuentaService.convertirAFormatoLegacy(response));
    }
  }

  private limpiarDatos() {
    this.consultaResponse.set(null);
    this.estadoCuenta.set(null);
    this.mostrarMultiplesPropiedades.set(false);
    this.propiedadSeleccionada.set(null);
    this.indicePropiedadSeleccionada.set(0);
  }

  onClearSearch() {
    this.limpiarDatos();
    this.searchError.set('');
    this.lastSearchParams = undefined;
  }

  seleccionarPropiedad(propiedad: PropiedadDto, index: number) {
    this.propiedadSeleccionada.set(propiedad);
    this.indicePropiedadSeleccionada.set(index);
    
    const response = this.consultaResponse();
    if (response) {
      this.estadoCuenta.set(this.estadoCuentaService.convertirAFormatoLegacy(response, index));
    }
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

  async mostrarOpcionesImpresion() {
    const response = this.consultaResponse();
    if (!response) return;

    if (response.tipoConsulta === 'dni' && response.propiedades) {
      // Para consultas por DNI, mostrar opciones de impresión
      const alert = await this.alertController.create({
        header: 'Opciones de Impresión',
        message: 'Seleccione el tipo de impresión que desea realizar:',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Imprimir Individual',
            handler: () => {
              this.imprimirIndividual();
            }
          },
          {
            text: 'Imprimir Grupal',
            handler: () => {
              this.imprimirGrupal();
            }
          },
          // PDF temporalmente deshabilitado
          /*
          {
            text: 'Vista Previa (PDF)',
            handler: () => {
              this.imprimirNavegador();
            }
          }
          */
        ]
      });
      await alert.present();
    } else {
      // Para consultas por clave catastral, mostrar opciones
      const alert = await this.alertController.create({
        header: 'Opciones de Impresión',
        message: 'Seleccione el tipo de impresión:',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Ticket Térmico',
            handler: () => {
              this.imprimirRecibo();
            }
          }
          // PDF temporalmente deshabilitado
          /*
          ,{
            text: 'Vista Previa (PDF)',
            handler: () => {
              this.imprimirNavegador();
            }
          }
          */
        ]
      });
      await alert.present();
    }
  }

  /**
   * Imprime usando el navegador (PDF/impresora)
   */
  imprimirNavegador() {
    window.print();
  }

  async imprimirIndividual() {
    const data = this.estadoCuenta();
    const propiedad = this.propiedadSeleccionada();
    
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
      this.presentToast('Preparando impresión individual...', 'success');
      const receiptText = this.estadoCuentaPrinterService.formatEstadoCuentaConAmnistia(
        data, 
        this.lastSearchParams
      );
      await this.bluetoothService.print(receiptText);
      this.presentToast('Recibo individual con amnistía enviado a la impresora exitosamente.', 'success');
    } catch (error) {
      console.error('Error al imprimir:', error);
      this.presentToast('Error al imprimir el recibo. Verifique la conexión de la impresora.', 'danger');
    }
  }

  async imprimirGrupal() {
    const response = this.consultaResponse();
    
    if (!response || !response.propiedades) {
      this.presentToast('No hay datos para imprimir.', 'warning');
      return;
    }

    const isConnected = await this.bluetoothService.isConnected();
    if (!isConnected) {
      this.presentToast('No hay ninguna impresora conectada. Configure la impresora en Configuración > Bluetooth.', 'danger');
      return;
    }

    try {
      this.presentToast('Preparando impresión grupal...', 'success');
      
      const receiptText = this.estadoCuentaPrinterService.formatEstadoCuentaGrupalConAmnistia(
        response,
        this.lastSearchParams
      );
      
      await this.bluetoothService.print(receiptText);
      this.presentToast('Recibo grupal con amnistía enviado a la impresora exitosamente.', 'success');
    } catch (error) {
      console.error('Error al imprimir:', error);
      this.presentToast('Error al imprimir el recibo grupal. Verifique la conexión de la impresora.', 'danger');
    }
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
      const receiptText = this.estadoCuentaPrinterService.formatEstadoCuentaConAmnistia(
        data, 
        this.lastSearchParams
      );
      await this.bluetoothService.print(receiptText);
      this.presentToast('Recibo con amnistía enviado a la impresora exitosamente.', 'success');
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

  // Getters para la vista de múltiples propiedades
  get esDNI(): boolean {
    const response = this.consultaResponse();
    return response?.tipoConsulta === 'dni';
  }

  get tienePropiedades(): boolean {
    const response = this.consultaResponse();
    return this.esDNI && !!response?.propiedades && response.propiedades.length > 0;
  }

  get numeroPropiedades(): number {
    const response = this.consultaResponse();
    return response?.propiedades?.length || 0;
  }

  get totalGeneralGrupal(): string {
    const response = this.consultaResponse();
    return response?.totalGeneral || '0.00';
  }

  get propiedades() {
    const response = this.consultaResponse();
    return response?.propiedades || [];
  }
}
