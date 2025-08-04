import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { SearchIcsInputComponent } from 'src/app/shared/components/search-ics-input/search-ics-input.component';
import { ConsultaIcsService } from '../consulta-ics/consulta-ics.service';
import { PrintingService } from 'src/app/shared/services/printing.service';
import {
  SearchICSParams,
  ConsultaICSResponseReal,
  EmpresaICS
} from 'src/app/shared/interfaces/consulta-ics.interface';

@Component({
  selector: 'app-consulta-ics-amnistia',
  templateUrl: './consulta-ics-amnistia.page.html',
  styleUrls: ['./consulta-ics-amnistia.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, SearchIcsInputComponent]
})
export class ConsultaIcsAmnistiaPage implements OnInit {
  isLoading = signal<boolean>(false);
  searchError = signal<string>('');
  consultaResponse = signal<ConsultaICSResponseReal | null>(null);
  empresaSeleccionada = signal<EmpresaICS | null>(null);
  indiceEmpresaSeleccionada = signal<number>(0);
  mostrarMultiplesEmpresas = signal<boolean>(false);
  lastSearchParams: SearchICSParams | null = null;

  constructor(
    private consultaIcsService: ConsultaIcsService,
    private printingService: PrintingService,
    private toastController: ToastController
  ) { }

  ngOnInit() {}

  onSearch(searchParams: SearchICSParams) {
    if (!searchParams.dni && !searchParams.rtn && !searchParams.ics) {
      this.presentToast('Por favor, ingrese un valor de búsqueda.', 'warning');
      return;
    }
    this.isLoading.set(true);
    this.searchError.set('');
    this.lastSearchParams = searchParams;
    this.limpiarDatos();
    const consultaParams = {
      ...searchParams,
      conAmnistia: true
    };
    this.consultaIcsService.consultarICS(consultaParams).subscribe({
      next: (response) => {
        this.procesarRespuestaConsulta(response);
        this.isLoading.set(false);
        this.presentToast('Consulta ICS con amnistía realizada exitosamente.', 'success');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.limpiarDatos();
        if (err.status === 404) {
          this.searchError.set('No se encontraron propiedades ICS para los parámetros de búsqueda proporcionados.');
          this.presentToast('No se encontraron datos.', 'warning');
        } else if (err.status === 400) {
          this.searchError.set('Parámetros de búsqueda inválidos. Verifique los datos ingresados.');
          this.presentToast('Datos de búsqueda inválidos.', 'danger');
        } else if (err.status === 500) {
          this.searchError.set('Error interno del servidor. Intente nuevamente más tarde.');
          this.presentToast('Error del servidor. Intente más tarde.', 'danger');
        } else {
          this.searchError.set('Error al consultar ICS con amnistía. Verifique su conexión.');
          this.presentToast('Error al consultar ICS con amnistía.', 'danger');
        }
      }
    });
  }

  private procesarRespuestaConsulta(response: any) {
    if (response.empresas && Array.isArray(response.empresas) && response.empresas.length > 0) {
      this.consultaResponse.set(response);
      this.mostrarMultiplesEmpresas.set(response.empresas.length > 1);
      this.empresaSeleccionada.set(response.empresas[0]);
      this.indiceEmpresaSeleccionada.set(0);
    } else if (response.numeroEmpresa && response.nombre) {
      const empresaAdaptada: EmpresaICS = {
        numeroEmpresa: response.numeroEmpresa || '',
        mes: response.mes || '',
        detallesMora: response.detallesMora || [],
        totalPropiedad: response.totalPropiedad || response.totalGeneral || '0',
        totalPropiedadNumerico: response.totalPropiedadNumerico || response.totalGeneralNumerico || 0
      };
      const responseAdaptada: ConsultaICSResponseReal = {
        nombre: response.nombre || '',
        identidad: response.identidad || '',
        fecha: response.fecha || '',
        hora: response.hora || '',
        empresas: [empresaAdaptada],
        totalGeneral: response.totalGeneral || empresaAdaptada.totalPropiedad || '0',
        totalGeneralNumerico: response.totalGeneralNumerico || empresaAdaptada.totalPropiedadNumerico || 0,
        descuentoProntoPago: response.descuentoProntoPago || '0',
        descuentoProntoPagoNumerico: response.descuentoProntoPagoNumerico || 0,
        totalAPagar: response.totalAPagar || response.totalGeneral || empresaAdaptada.totalPropiedad || '0',
        totalAPagarNumerico: response.totalAPagarNumerico || response.totalGeneralNumerico || empresaAdaptada.totalPropiedadNumerico || 0,
        amnistiaVigente: response.amnistiaVigente || false,
        fechaFinAmnistia: response.fechaFinAmnistia || '',
        tipoConsulta: response.tipoConsulta || 'rtn',
        ubicacionConsulta: response.ubicacionConsulta || ''
      };
      this.consultaResponse.set(responseAdaptada);
      this.mostrarMultiplesEmpresas.set(false);
      this.empresaSeleccionada.set(empresaAdaptada);
      this.indiceEmpresaSeleccionada.set(0);
    } else {
      this.mostrarMultiplesEmpresas.set(false);
      this.empresaSeleccionada.set(null);
    }
  }

  private limpiarDatos() {
    this.consultaResponse.set(null);
    this.empresaSeleccionada.set(null);
    this.indiceEmpresaSeleccionada.set(0);
    this.mostrarMultiplesEmpresas.set(false);
  }

  onClear() {
    this.limpiarDatos();
    this.searchError.set('');
    this.lastSearchParams = null;
  }

  seleccionarEmpresa(index: number) {
    const response = this.consultaResponse();
    if (response && response.empresas && response.empresas[index]) {
      this.indiceEmpresaSeleccionada.set(index);
      this.empresaSeleccionada.set(response.empresas[index]);
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2
    }).format(amount);
  }

  get tieneResultados(): boolean {
    const response = this.consultaResponse();
    return (
      !!response &&
      ((Array.isArray(response.empresas) && response.empresas.length > 0) || !!this.empresaSeleccionada())
    );
  }

  // Propietario para la vista
  get propietario() {
    const response = this.consultaResponse();
    if (!response) return null;
    const rtn = this.lastSearchParams?.rtn || undefined;
    const dni = this.lastSearchParams?.dni || response.identidad;
    return {
      nombre: response.nombre,
      dni: dni,
      rtn: rtn,
      telefono: undefined,
      email: undefined,
      direccion: undefined
    };
  }

  getFechaConsulta(): string {
    const response = this.consultaResponse();
    if (!response) return '';
    return `${response.fecha} ${response.hora}`;
  }

  get esBusquedaMultiple(): boolean {
    return this.mostrarMultiplesEmpresas();
  }

  get totalPropiedades(): number {
    const response = this.consultaResponse();
    return response?.empresas?.length || 0;
  }

  indicePropiedadSeleccionada() {
    return this.indiceEmpresaSeleccionada();
  }

  seleccionarPropiedad(index: number) {
    this.seleccionarEmpresa(index);
  }

  getPropiedades() {
    const response = this.consultaResponse();
    return response?.empresas || [];
  }

  getResumenActual() {
    const response = this.consultaResponse();
    if (!response) return null;
    return {
      totalGeneral: response.totalGeneralNumerico,
      totalAPagar: response.totalAPagarNumerico,
      descuentoProntoPago: response.descuentoProntoPagoNumerico,
      fechaFinAmnistia: response.fechaFinAmnistia,
      totalImpuesto: response.totalGeneralNumerico,
      totalRecargo: 0,
      totalConDescuento: response.totalAPagarNumerico,
      porcentajeDescuento: (response.descuentoProntoPagoNumerico && response.descuentoProntoPagoNumerico > 0) ? 
        (response.descuentoProntoPagoNumerico / response.totalGeneralNumerico) * 100 : 0
    };
  }

  get ahorroConAmnistia(): number {
    const response = this.consultaResponse();
    if (!response || !response.descuentoProntoPagoNumerico) return 0;
    return response.descuentoProntoPagoNumerico;
  }

  imprimirICS() {
    this.presentToast('Función de impresión en desarrollo.', 'warning');
  }

  getDetallesMoraActual() {
    const response = this.consultaResponse();
    if (!response || !response.empresas || response.empresas.length === 0) return [];
    const empresa = response.empresas[this.indicePropiedadSeleccionada()] || response.empresas[0];
    if (!empresa || !empresa.detallesMora) return [];
    return empresa.detallesMora;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-HN');
  }

  getSearchSummary(): string {
    const params = this.lastSearchParams;
    if (!params) return '';
    if (params.dni) {
      return `DNI: ${params.dni}`;
    } else if (params.rtn) {
      return `RTN: ${params.rtn}`;
    } else if (params.ics) {
      return `Código ICS: ${params.ics}`;
    }
    return '';
  }

  getCurrentDate(): string {
    return new Date().toISOString();
  }

  async presentToast(message: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color
    });
    toast.present();
  }
}