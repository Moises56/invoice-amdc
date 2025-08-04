import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { SearchIcsInputComponent } from 'src/app/shared/components/search-ics-input/search-ics-input.component';
import { ConsultaIcsService } from './consulta-ics.service';
import { PrintingService } from 'src/app/shared/services/printing.service';
import {
  SearchICSParams,
  ConsultaICSParams,
  ConsultaICSResponse,
  ConsultaICSResponseMultiple,
  ConsultaICSResponseReal,
  PropiedadICS,
  DetalleMoraICS,
  DetalleMoraReal,
  EmpresaICS
} from 'src/app/shared/interfaces/consulta-ics.interface';

@Component({
  selector: 'app-consulta-ics',
  templateUrl: './consulta-ics.page.html',
  styleUrls: ['./consulta-ics.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, SearchIcsInputComponent]
})
export class ConsultaIcsPage implements OnInit {

  // Señales para el estado del componente
  isLoading = signal<boolean>(false);
  searchError = signal<string>('');
  consultaResponse = signal<ConsultaICSResponseReal | null>(null);
  empresaSeleccionada = signal<any | null>(null);
  indiceEmpresaSeleccionada = signal<number>(0);
  mostrarMultiplesEmpresas = signal<boolean>(false);
  lastSearchParams: SearchICSParams | null = null;

  constructor(
    private consultaIcsService: ConsultaIcsService,
    private printingService: PrintingService,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    // Inicialización sin búsqueda automática
  }

  onSearch(searchParams: SearchICSParams) {
    if (!searchParams.dni && !searchParams.rtn && !searchParams.ics) {
      this.presentToast('Por favor, ingrese un valor de búsqueda.', 'warning');
      return;
    }

    this.isLoading.set(true);
    this.searchError.set('');
    this.lastSearchParams = searchParams;
    this.limpiarDatos();

    // Convertir SearchICSParams a ConsultaICSParams
    const consultaParams = {
      ...searchParams,
      conAmnistia: false
    };

    this.consultaIcsService.consultarICS(consultaParams).subscribe({
      next: (response) => {
        this.procesarRespuestaConsulta(response);
        this.isLoading.set(false);
        this.presentToast('Consulta ICS realizada exitosamente.', 'success');
      },
      error: (err) => {
        console.error('Error al consultar ICS:', err);
        this.isLoading.set(false);
        this.limpiarDatos();
        
        // Manejo específico de errores
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
          this.searchError.set('Error al consultar ICS. Verifique su conexión.');
          this.presentToast('Error al consultar ICS.', 'danger');
        }
      }
    });
  }

  private procesarRespuestaConsulta(response: any) {
    console.log('Respuesta recibida:', response);
    console.log('Empresas en respuesta:', response.empresas);
    console.log('Número de empresas:', response.empresas?.length);
    
    // Verificar si la respuesta tiene el formato esperado con array de empresas
    if (response.empresas && Array.isArray(response.empresas) && response.empresas.length > 0) {
      // Formato estándar con array de empresas
      this.consultaResponse.set(response);
      this.mostrarMultiplesEmpresas.set(response.empresas.length > 1);
      this.empresaSeleccionada.set(response.empresas[0]);
      this.indiceEmpresaSeleccionada.set(0);
      console.log('Empresa seleccionada:', response.empresas[0]);
    } else if (response.numeroEmpresa && response.nombre) {
      // Formato directo - la respuesta es directamente los datos de la empresa
      console.log('Respuesta en formato directo, adaptando estructura...');
      
      // Crear estructura compatible
      const empresaAdaptada: EmpresaICS = {
        numeroEmpresa: response.numeroEmpresa,
        mes: response.mes || '',
        detallesMora: response.detallesMora || [],
        totalPropiedad: response.totalPropiedad || response.totalGeneral || '0',
        totalPropiedadNumerico: response.totalPropiedadNumerico || response.totalGeneralNumerico || 0
      };
      
      const responseAdaptada: ConsultaICSResponseReal = {
        nombre: response.nombre,
        identidad: response.identidad,
        fecha: response.fecha,
        hora: response.hora,
        empresas: [empresaAdaptada],
        totalGeneral: response.totalGeneral || '0',
        totalGeneralNumerico: response.totalGeneralNumerico || 0,
        descuentoProntoPago: response.descuentoProntoPago,
        descuentoProntoPagoNumerico: response.descuentoProntoPagoNumerico,
        totalAPagar: response.totalAPagar || response.totalGeneral || '0',
        totalAPagarNumerico: response.totalAPagarNumerico || response.totalGeneralNumerico || 0,
        amnistiaVigente: response.amnistiaVigente || false,
        fechaFinAmnistia: response.fechaFinAmnistia,
        tipoConsulta: response.tipoConsulta || 'rtn',
        ubicacionConsulta: response.ubicacionConsulta || ''
      };
      
      this.consultaResponse.set(responseAdaptada);
      this.mostrarMultiplesEmpresas.set(false);
      this.empresaSeleccionada.set(empresaAdaptada);
      this.indiceEmpresaSeleccionada.set(0);
      console.log('Estructura adaptada:', responseAdaptada);
      console.log('Empresa seleccionada:', empresaAdaptada);
    } else {
      console.log('No hay empresas en la respuesta o el formato no es reconocido');
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

  // Métodos para manejo de múltiples empresas
  seleccionarEmpresa(index: number) {
    const response = this.consultaResponse();
    if (response && response.empresas && response.empresas[index]) {
      this.indiceEmpresaSeleccionada.set(index);
      this.empresaSeleccionada.set(response.empresas[index]);
    }
  }

  // Métodos para obtener datos de la propiedad seleccionada
  getDetallesMoraActual(): DetalleMoraICS[] {
    const empresa = this.empresaSeleccionada();
    if (!empresa || !empresa.detallesMora) {
      return [];
    }

    return empresa.detallesMora.map((detalle: DetalleMoraReal) => ({
      anio: parseInt(detalle.year ?? '0'),
      mes: this.getMonthName(parseInt(detalle.mes ?? '0')),
      monto: (detalle.impuestoNumerico ?? 0) + (detalle.trenDeAseoNumerico ?? 0) + (detalle.tasaBomberosNumerico ?? 0) + (detalle.otrosNumerico ?? 0),
      interes: detalle.recargoNumerico ?? 0,
      total: detalle.totalNumerico ?? 0,
      fechaVencimiento: '',
      estado: detalle.amnistiaAplicada ? 'PENDIENTE' : 'VENCIDO',
      diasVencido: detalle.dias ?? 0
    }));
  }

  getResumenActual() {
    const response = this.consultaResponse();
    const empresa = this.empresaSeleccionada();
    if (!response || !empresa) return null;

    const totalInteres = empresa.detallesMora?.reduce((sum: number, detalle: DetalleMoraReal) => sum + (detalle.recargoNumerico ?? 0), 0) || 0;
    const totalDeuda = empresa.totalPropiedadNumerico - totalInteres;

    return {
      totalDeuda: totalDeuda,
      totalInteres: totalInteres,
      totalGeneral: empresa.totalPropiedadNumerico,
      cantidadCuotas: empresa.detallesMora?.length || 0
    };
  }

  private getMonthName(month: number): string {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[month - 1] || 'Desconocido';
  }

  // Métodos de utilidad
  async presentToast(message: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color
    });
    toast.present();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDate(dateString: string): string {
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

  getFechaConsulta(): string {
    const response = this.consultaResponse();
    if (!response) return '';
    
    return `${response.fecha} ${response.hora}`;
  }

  // Getters para la vista
  get tieneResultados(): boolean {
    const response = this.consultaResponse();
    return response !== null && response.empresas && response.empresas.length > 0;
  }

  get esBusquedaMultiple(): boolean {
    return this.mostrarMultiplesEmpresas();
  }

  get propietario() {
    const response = this.consultaResponse();
    if (!response) return null;

    // Obtener RTN de los parámetros de búsqueda si fue una búsqueda por RTN
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

  get totalEmpresas(): number {
    const response = this.consultaResponse();
    return response?.empresas?.length || 0;
  }

  getEmpresas(): any[] {
    const response = this.consultaResponse();
    return response?.empresas || [];
  }

  propiedadSeleccionada() {
    const empresa = this.empresaSeleccionada();
    if (!empresa) return null;

    return {
      ics: empresa.numeroEmpresa,
      direccion: 'Información no disponible',
      zona: 'N/A',
      tipoPropiedad: empresa.mes,
      valorCatastral: 0,
      impuestoAnual: 0,
      estado: 'ACTIVO'
    };
  }

  indicePropiedadSeleccionada() {
    return this.indiceEmpresaSeleccionada();
  }

  // Método para imprimir la consulta ICS
  imprimirICS(): void {
    if (!this.consultaResponse()) {
      console.warn('No hay datos para imprimir');
      return;
    }

    // Crear contenido HTML para imprimir
    const printContent = this.generarContenidoImpresion();
    
    // Abrir ventana de impresión
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  }

  private generarContenidoImpresion(): string {
    const response = this.consultaResponse();
    if (!response) return '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Consulta ICS - ${response.nombre}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .info-section { margin-bottom: 20px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .table th { background-color: #f2f2f2; }
          .total-row { font-weight: bold; background-color: #f9f9f9; }
          .summary { background-color: #f5f5f5; padding: 15px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Consulta ICS</h1>
          <h2>${response.nombre}</h2>
          <p>Identidad: ${response.identidad}</p>
          <p>Fecha: ${response.fecha} - Hora: ${response.hora}</p>
        </div>
        
        ${this.empresaSeleccionada() ? `
        <div class="info-section">
          <h3>Información de la Empresa</h3>
          <p><strong>Número de Empresa:</strong> ${this.empresaSeleccionada()?.numeroEmpresa}</p>
          <p><strong>Período:</strong> ${this.empresaSeleccionada()?.mes}</p>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th>Año</th>
              <th>Impuesto</th>
              <th>Tren de Aseo</th>
              <th>Tasa Bomberos</th>
              <th>Otros</th>
              <th>Recargo</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${this.empresaSeleccionada()?.detallesMora.map((detalle: DetalleMoraReal) => `
              <tr>
                <td>${detalle.year}</td>
                <td>${detalle.impuesto}</td>
                <td>${detalle.trenDeAseo}</td>
                <td>${detalle.tasaBomberos}</td>
                <td>${detalle.otros}</td>
                <td>${detalle.recargo}</td>
                <td>${detalle.total}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="6">TOTAL EMPRESA</td>
              <td>${this.empresaSeleccionada()?.totalPropiedad}</td>
            </tr>
            ${response.totalGeneral ? `
            <tr class="grand-total-row">
              <td colspan="6">TOTAL GENERAL</td>
              <td>${response.totalGeneral}</td>
            </tr>
            ` : ''}
          </tfoot>
        </table>
        ` : ''}
        
        <div class="summary">
          <h3>Resumen Financiero</h3>
          <p><strong>Total General:</strong> ${response.totalGeneral}</p>
          ${response.descuentoProntoPago ? `<p><strong>Descuento Pronto Pago:</strong> -${response.descuentoProntoPago}</p>` : ''}
          <p><strong>Total a Pagar:</strong> ${response.totalAPagar}</p>
          ${response.amnistiaVigente ? `
            <p><strong>Amnistía Vigente:</strong> Sí (Válida hasta: ${response.fechaFinAmnistia})</p>
          ` : ''}
        </div>
      </body>
      </html>
    `;
  }
}