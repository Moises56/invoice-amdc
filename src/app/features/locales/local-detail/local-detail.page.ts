import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
  IonBadge, IonButton, IonSpinner, IonIcon, IonFab, IonFabButton,
  IonSearchbar, IonInfiniteScroll, IonInfiniteScrollContent,
  IonSelect, IonSelectOption, IonItemSliding, IonItemOptions, IonItemOption,
  AlertController, ToastController, LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  businessOutline, locationOutline, calendarOutline, cardOutline, 
  personOutline, callOutline, mailOutline, checkmarkCircleOutline,
  closeCircleOutline, timeOutline, helpCircleOutline, documentTextOutline,
  addOutline, createOutline, trashOutline, eyeOutline, searchOutline,
  closeSharp, refreshOutline, receiptOutline, statsChartOutline, downloadOutline, 
  alertCircleOutline, filterOutline, documentOutline, checkmarkOutline, 
  closeOutline, add, pauseOutline, playOutline
} from 'ionicons/icons';

import { LocalesService } from '../locales.service';
import { FacturasService } from '../../facturas/facturas.service';
import { AuthService } from '../../../core/services/auth.service';
import { 
  Local, Factura, EstadoLocal, EstadoFactura, 
  TipoLocal, Role, User, CreateFacturaRequest 
} from '../../../shared/interfaces';

@Component({
  selector: 'app-local-detail',
  templateUrl: './local-detail.page.html',
  styleUrls: ['./local-detail.page.scss'],
  standalone: true,  imports: [
    CommonModule,
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
    IonBadge, IonButton, IonSpinner, IonIcon, IonFab, IonFabButton,
    IonSearchbar, IonInfiniteScroll, IonInfiniteScrollContent,
    IonSelect, IonSelectOption, IonItemSliding, IonItemOptions, IonItemOption
  ]
})
export class LocalDetailPage implements OnInit {  private localesService = inject(LocalesService);
  private facturasService = inject(FacturasService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  // Signals
  local = signal<Local | null>(null);
  facturas = signal<Factura[]>([]);
  isLoading = signal(true);
  isLoadingFacturas = signal(false);
  localId = signal<string>('');
  searchTerm = signal<string>('');
  currentPage = signal(1);
  totalPages = signal(1);
  isInfiniteDisabled = signal(false);

  // Signals adicionales
  error = signal<string | null>(null);
  mercadoId = signal<string>('');
  estadisticasFacturas = signal<any>({
    total: 0,
    pagadas: 0,
    pendientes: 0,
    vencidas: 0
  });
  
  // Filtros
  filtroEstado = '';
  filtroMes = '';
  filtroAnio = '';

  // Computed signals adicionales
  canEditLocal = computed(() => this.canEdit());
  canEditFactura = computed(() => this.canEdit());
  hasMoreFacturas = computed(() => this.currentPage() < this.totalPages());

  // Computed signals
  filteredFacturas = computed(() => {
    const facturasArray = this.facturas();
    const search = this.searchTerm().toLowerCase().trim();
    
    if (!search) {
      return facturasArray;
    }
    
    return facturasArray.filter(factura => 
      factura.numero_factura?.toLowerCase().includes(search) ||
      factura.concepto?.toLowerCase().includes(search) ||
      factura.mes?.toLowerCase().includes(search) ||
      factura.anio?.toString().includes(search)
    );
  });

  // Permisos
  canEdit = computed(() => {
    const user = this.authService.user();
    return user && [Role.ADMIN, Role.MARKET].includes(user.role);
  });

  canDelete = computed(() => {
    const user = this.authService.user();
    return user && [Role.ADMIN].includes(user.role);
  });

  canCreateFactura = computed(() => {
    const user = this.authService.user();
    return user && [Role.ADMIN, Role.MARKET, Role.USER].includes(user.role);
  });  constructor() {    addIcons({
      createOutline, refreshOutline, alertCircleOutline, documentTextOutline, 
      checkmarkCircleOutline, timeOutline, closeCircleOutline, addOutline, 
      filterOutline, documentOutline, calendarOutline, checkmarkOutline, 
      closeOutline, add, businessOutline, locationOutline, closeSharp, 
      cardOutline, personOutline, callOutline, mailOutline, helpCircleOutline, 
      trashOutline, eyeOutline, searchOutline, receiptOutline, statsChartOutline, 
      downloadOutline, pauseOutline, playOutline
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.localId.set(id);
      this.loadLocal(id);
      this.loadFacturas(true);
    }
  }  /**
   * Cargar datos del local
   */
  private async loadLocal(id: string) {
    try {
      this.isLoading.set(true);
      const local = await this.localesService.getLocalById(id).toPromise();
      
      if (local) {
        this.local.set(local);
      } else {
        this.local.set(null);
        this.showToast('Local no encontrado', 'danger');
      }
    } catch (error) {
      console.error('Error loading local:', error);
      this.local.set(null);
      this.showToast('Error al cargar los datos del local', 'danger');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Cargar facturas del local
   */
  async loadFacturas(refresh = false) {
    if (refresh) {
      this.isLoadingFacturas.set(true);
      this.currentPage.set(1);
    }

    try {
      const page = refresh ? 1 : this.currentPage();
      const response = await this.facturasService.getFacturasByLocal(
        this.localId(), 
        page, 
        10
      ).toPromise();
      
      if (response) {
        if (refresh) {
          this.facturas.set(response.data);
        } else {
          this.facturas.update(facturas => [...facturas, ...response.data]);
        }
        
        this.totalPages.set(response.pagination.total_pages);
        this.isInfiniteDisabled.set(this.currentPage() >= response.pagination.total_pages);
      }
    } catch (error) {
      console.error('Error loading facturas:', error);
      this.showToast('Error al cargar las facturas', 'danger');
    } finally {
      this.isLoadingFacturas.set(false);
    }
  }

  /**
   * Manejar refresh
   */
  async onRefresh(event: any) {
    await Promise.all([
      this.loadLocal(this.localId()),
      this.loadFacturas(true)
    ]);
    event.target.complete();
  }

  /**
   * Cargar más facturas
   */
  async onLoadMore(event: any) {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(page => page + 1);
      await this.loadFacturas();
    }
    event.target.complete();
  }

  /**
   * Refrescar local
   */
  refrescarLocal() {
    this.loadLocal(this.localId());
    this.loadFacturas(true);
  }
  /**
   * Editar local
   */
  editarLocal() {
    // Navegar a la página de edición del local
    this.router.navigate(['/mercados', this.mercadoId(), 'locales', this.localId(), 'edit']);
  }

  /**
   * Cargar local
   */
  cargarLocal() {
    this.loadLocal(this.localId());
  }

  /**
   * Toggle estado del local
   */
  async toggleEstadoLocal() {
    const local = this.local();
    if (!local) return;    const nuevoEstado = local.estado_local === EstadoLocal.ACTIVO ? EstadoLocal.INACTIVO : EstadoLocal.ACTIVO;
    
    try {
      await this.localesService.updateLocal(local.id, { estado_local: nuevoEstado }).toPromise();
      this.showToast(`Local ${nuevoEstado.toLowerCase()}`, 'success');
      this.loadLocal(this.localId());
    } catch (error) {
      this.showToast('Error al cambiar estado del local', 'danger');
    }
  }  /**
   * Crear nueva factura
   */
  async crearFactura() {
    // Generar opciones de meses (últimos 3 meses y próximos 12 meses)
    const currentDate = new Date();
    const monthOptions = [];
    
    // Mes actual como primera opción
    const currentValue = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const currentLabel = `${this.getMonthName(currentDate.getMonth() + 1)} ${currentDate.getFullYear()} (Mes Actual)`;
    
    // Últimos 3 meses
    for (let i = 3; i >= 1; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = `${this.getMonthName(date.getMonth() + 1)} ${date.getFullYear()}`;
      monthOptions.push({ text: label, value, type: 'past' });
    }
    
    // Próximos 11 meses (sin incluir el actual)
    for (let i = 1; i <= 11; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = `${this.getMonthName(date.getMonth() + 1)} ${date.getFullYear()}`;
      monthOptions.push({ text: label, value, type: 'future' });
    }

    // Preparar inputs para el alert
    const radioInputs = [
      {
        name: 'mes',
        type: 'radio' as any,
        label: currentLabel,
        value: currentValue,
        checked: true
      },
      // Separador visual (disabled option)
      ...monthOptions.map((option) => ({
        name: 'mes',
        type: 'radio' as any,
        label: option.text + (option.type === 'past' ? ' (Anterior)' : ''),
        value: option.value,
        checked: false
      }))
    ];

    const alert = await this.alertController.create({
      header: 'Crear Nueva Factura',
      message: 'Seleccione el mes para el cual desea generar la factura:',
      inputs: radioInputs,
      cssClass: 'month-selector-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Siguiente',
          handler: async (selectedMonth) => {
            if (selectedMonth) {
              await this.mostrarFormularioObservaciones(selectedMonth);
              return true;
            } else {
              this.showToast('Debe seleccionar un mes', 'warning');
              return false;
            }
          }
        }
      ]
    });
    
    await alert.present();
  }
  /**
   * Mostrar formulario de observaciones después de seleccionar el mes
   */
  async mostrarFormularioObservaciones(mesSeleccionado: string) {
    // Validar si ya existe una factura para este mes
    const facturaExiste = await this.validarFacturaExistente(mesSeleccionado);
    
    if (facturaExiste) {
      const [year, month] = mesSeleccionado.split('-');
      const monthName = this.getMonthName(parseInt(month));
        const alert = await this.alertController.create({
        header: 'Factura Ya Existente',
        message: `
          <div class="text-center">
            <ion-icon name="information-circle-outline" color="primary" style="font-size: 48px; margin-bottom: 16px;"></ion-icon>
            <p>Ya existe una factura para <strong>${monthName} ${year}</strong>.</p>
            <p>¿Desea continuar de todos modos o elegir otro mes?</p>
          </div>
        `,
        cssClass: 'error-alert',
        buttons: [
          {
            text: 'Elegir Otro Mes',
            cssClass: 'primary',
            handler: () => {
              this.crearFactura(); // Volver al selector de mes
            }
          },
          {
            text: 'Ver Factura Existente',
            cssClass: 'secondary',
            handler: () => {
              this.buscarYMostrarFacturaExistente(monthName, year);
            }
          },
          {
            text: 'Continuar Anyway',
            role: 'destructive',
            cssClass: 'danger',
            handler: () => {
              this.continuarConFormularioObservaciones(mesSeleccionado, true);
            }
          }
        ]
      });
      
      await alert.present();
      return;
    }
    
    // Si no existe, continuar normalmente
    this.continuarConFormularioObservaciones(mesSeleccionado, false);
  }

  /**
   * Continuar con el formulario de observaciones
   */
  private async continuarConFormularioObservaciones(mesSeleccionado: string, forceCreate: boolean = false) {
    const [year, month] = mesSeleccionado.split('-');
    const monthName = this.getMonthName(parseInt(month));

    const alert = await this.alertController.create({
      header: 'Crear Factura',
      message: `Generar factura para <strong>${monthName} ${year}</strong>${forceCreate ? ' (Se intentará crear aunque exista una similar)' : ''}`,
      inputs: [
        {
          name: 'observaciones',
          type: 'textarea',
          placeholder: 'Observaciones adicionales (opcional)',
          attributes: {
            rows: 3
          }
        }
      ],
      buttons: [
        {
          text: 'Atrás',
          handler: () => {
            this.crearFactura(); // Volver al selector de mes
          }
        },
        {
          text: 'Crear Factura',
          handler: (data) => {
            this.procesarCreacionFactura(mesSeleccionado, data.observaciones || '');
            return true;
          }
        }
      ]
    });
    
    await alert.present();
  }  /**
   * Procesar la creación de la factura
   */  async procesarCreacionFactura(mes: string, observaciones: string = '') {
    // Mostrar loading
    const loading = await this.loadingController.create({
      message: 'Creando factura...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const local = this.local();
      const currentUser = this.authService.user();
      
      if (!local || !currentUser) {
        await loading.dismiss();
        this.showToast('Error: Información insuficiente para crear la factura', 'danger');
        return;
      }

      // Parsear el mes seleccionado
      const [year, month] = mes.split('-');
      const monthName = this.getMonthName(parseInt(month));
      
      // Calcular fecha de vencimiento (15 del mes siguiente)
      const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
      const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
      const fechaVencimiento = new Date(nextYear, nextMonth - 1, 15);

      // Convertir monto_mensual a number de forma segura
      const montoMensual = typeof local.monto_mensual === 'string' 
        ? parseFloat(local.monto_mensual) 
        : (local.monto_mensual || 0);      const facturaData: CreateFacturaRequest = {
        concepto: `Cuota mensual ${monthName} ${year}`,
        mes: mes,
        anio: parseInt(year),
        monto: montoMensual,
        estado: EstadoFactura.PENDIENTE,
        fecha_vencimiento: fechaVencimiento.toISOString(),
        observaciones: observaciones || 'Factura generada automáticamente',
        localId: local.id,
        createdByUserId: currentUser.id
      };

      const response = await this.facturasService.createFactura(facturaData).toPromise();
      
      await loading.dismiss();
      
      if (response) {
        this.showToast('Factura creada exitosamente', 'success');
        this.loadFacturas(true);
        this.cargarEstadisticasFacturas();
      }
    } catch (error: any) {
      await loading.dismiss();
      console.error('Error creating factura:', error);
      
      // Manejar errores específicos
      if (error.status === 409) {
        // Error de conflicto - factura duplicada
        const [year, month] = mes.split('-');
        const monthName = this.getMonthName(parseInt(month));
        
        await this.mostrarErrorFacturaDuplicada(monthName, year, error);
      } else if (error.status === 400) {
        // Error de validación
        const errorMessage = error.error?.message || 'Datos inválidos para crear la factura';
        this.showToast(errorMessage, 'danger');
      } else if (error.status === 403) {
        // Error de permisos
        this.showToast('No tiene permisos para crear facturas', 'danger');
      } else if (error.status === 500) {
        // Error del servidor
        this.showToast('Error interno del servidor. Intente nuevamente', 'danger');
      } else if (error.status === 0 || !error.status) {
        // Error de conectividad
        this.showToast('Error de conexión. Verifique su red', 'danger');
      } else {
        // Error genérico
        this.showToast('Error al crear la factura. Intente nuevamente', 'danger');
      }
    }
  }
  /**
   * Mostrar error específico para factura duplicada con opciones
   */
  async mostrarErrorFacturaDuplicada(monthName: string, year: string, error: any) {
    const errorMessage = error.error?.message || `Ya existe una factura para ${monthName} ${year}`;
    
    const alert = await this.alertController.create({
      header: 'Factura Duplicada',
      message: `
        <div class="text-center">
          <ion-icon name="warning-outline" color="warning" style="font-size: 48px; margin-bottom: 16px;"></ion-icon>
          <p><strong>${errorMessage}</strong></p>
          <p>¿Qué desea hacer?</p>
        </div>
      `,
      cssClass: 'error-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Ver Factura Existente',
          cssClass: 'primary',
          handler: () => {
            this.buscarYMostrarFacturaExistente(monthName, year);
          }
        },
        {
          text: 'Elegir Otro Mes',
          cssClass: 'tertiary',
          handler: () => {
            // Volver al selector de mes
            setTimeout(() => this.crearFactura(), 300);
          }
        }
      ]
    });
    
    await alert.present();
  }

  /**
   * Buscar y mostrar la factura existente para el mes especificado
   */
  async buscarYMostrarFacturaExistente(monthName: string, year: string) {
    try {
      const facturas = this.facturas();
      const facturaExistente = facturas.find(f => 
        f.mes.includes(monthName) && f.anio.toString() === year
      );
      
      if (facturaExistente) {
        this.verDetalleFactura(facturaExistente);
      } else {
        // Si no la encontramos en la lista local, recargar las facturas
        await this.loadFacturas(true);
        this.showToast(`Busque la factura de ${monthName} ${year} en la lista`, 'medium');
      }
    } catch (error) {
      console.error('Error finding existing factura:', error);
      this.showToast('No se pudo encontrar la factura existente', 'warning');
    }
  }

  /**
   * Validar si ya existe una factura para el mes seleccionado
   */
  private async validarFacturaExistente(mes: string): Promise<boolean> {
    const [year, month] = mes.split('-');
    const monthName = this.getMonthName(parseInt(month));
    
    // Buscar en las facturas locales primero
    const facturas = this.facturas();
    const facturaExistente = facturas.find(f => 
      f.mes.includes(monthName) && f.anio.toString() === year
    );
    
    return !!facturaExistente;
  }

  /**
   * Obtener nombre del mes
   */
  private getMonthName(month: number): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1] || 'Mes desconocido';
  }

  /**
   * Cargar estadísticas de facturas
   */
  async cargarEstadisticasFacturas() {
    try {
      // Aquí deberías llamar a un servicio que obtenga las estadísticas
      // Por ahora, calculamos basado en las facturas cargadas
      const facturas = this.facturas();
      const estadisticas = {
        total: facturas.length,
        pagadas: facturas.filter(f => f.estado === 'PAGADA').length,
        pendientes: facturas.filter(f => f.estado === 'PENDIENTE').length,
        vencidas: facturas.filter(f => f.estado === 'VENCIDA').length
      };
      
      this.estadisticasFacturas.set(estadisticas);
    } catch (error) {
      console.error('Error loading estadisticas:', error);
    }
  }

  /**
   * Ver detalle de factura
   */
  verDetalleFactura(factura: Factura) {
    // Navegar al detalle de la factura
    this.router.navigate(['/facturas', factura.id]);
  }  /**
   * Marcar como pagada
   */
  async marcarComoPagada(factura: Factura) {
    try {
      await this.facturasService.payFactura(factura.id).toPromise();
      this.showToast('Factura marcada como pagada', 'success');
      this.loadFacturas(true);
    } catch (error) {
      this.showToast('Error al marcar factura como pagada', 'danger');
    }
  }

  /**
   * Editar factura
   */
  editarFactura(factura: Factura) {
    this.router.navigate(['/facturas/editar', factura.id]);
  }

  /**
   * Anular factura
   */
  async anularFactura(factura: Factura) {
    const alert = await this.alertController.create({
      header: 'Confirmar anulación',
      message: `¿Está seguro de que desea anular la factura ${factura.numero_factura}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Anular',
          role: 'destructive',          handler: async () => {
            try {
              await this.facturasService.anularFactura(factura.id).toPromise();
              this.showToast('Factura anulada correctamente', 'success');
              this.loadFacturas(true);
            } catch (error) {
              this.showToast('Error al anular factura', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Aplicar filtros
   */
  aplicarFiltros() {
    // Implementar lógica de filtros
    this.loadFacturas(true);
  }

  /**
   * Limpiar filtros
   */
  limpiarFiltros() {
    this.filtroEstado = '';
    this.filtroMes = '';
    this.filtroAnio = '';
    this.searchTerm.set('');
    this.loadFacturas(true);
  }

  /**
   * Cargar más facturas para infinite scroll
   */
  cargarMasFacturas(event: any) {
    this.onLoadMore(event);
  }

  /**
   * Obtener color del estado
   */
  getEstadoColor(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'ACTIVO':
        return 'success';
      case 'INACTIVO':
        return 'danger';
      case 'SUSPENDIDO':
        return 'warning';
      default:
        return 'medium';
    }
  }

  /**
   * Obtener color del estado de factura
   */
  getEstadoFacturaColor(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'PAGADA':
        return 'success';
      case 'PENDIENTE':
        return 'warning';
      case 'VENCIDA':
        return 'danger';
      case 'ANULADA':
        return 'medium';
      default:
        return 'medium';
    }
  }

  /**
   * Obtener color del estado del local
   */
  getLocalStatusColor(estado: EstadoLocal): string {
    switch (estado) {
      case EstadoLocal.OCUPADO:
        return 'success';
      case EstadoLocal.LIBRE:
        return 'warning';
      case EstadoLocal.ACTIVO:
        return 'primary';
      case EstadoLocal.INACTIVO:
        return 'danger';
      case EstadoLocal.SUSPENDIDO:
        return 'danger';
      case EstadoLocal.PENDIENTE:
        return 'medium';
      default:
        return 'medium';
    }
  }

  /**
   * Obtener color del estado de la factura
   */
  getFacturaStatusColor(estado: EstadoFactura): string {
    switch (estado) {
      case EstadoFactura.PAGADA:
        return 'success';
      case EstadoFactura.PENDIENTE:
        return 'warning';
      case EstadoFactura.VENCIDA:
        return 'danger';
      case EstadoFactura.ANULADA:
        return 'medium';
      default:
        return 'medium';
    }
  }

  /**
   * Obtener texto del estado del local
   */
  getLocalStatusText(estado: EstadoLocal): string {
    switch (estado) {
      case EstadoLocal.OCUPADO:
        return 'Ocupado';
      case EstadoLocal.LIBRE:
        return 'Disponible';
      case EstadoLocal.ACTIVO:
        return 'Activo';
      case EstadoLocal.INACTIVO:
        return 'Inactivo';
      case EstadoLocal.SUSPENDIDO:
        return 'Suspendido';
      case EstadoLocal.PENDIENTE:
        return 'Pendiente';
      default:
        return 'Sin estado';
    }
  }

  /**
   * Obtener texto del tipo de local
   */
  getTipoLocalText(tipo: TipoLocal): string {
    switch (tipo) {
      case TipoLocal.COMIDA:
        return 'Comida';
      case TipoLocal.ROPA:
        return 'Ropa';
      case TipoLocal.ELECTRODOMESTICOS:
        return 'Electrodomésticos';
      case TipoLocal.FARMACIA:
        return 'Farmacia';
      case TipoLocal.SERVICIOS:
        return 'Servicios';
      case TipoLocal.CARNICERIA:
        return 'Carnicería';
      case TipoLocal.OTROS:
        return 'Otros';
      default:
        return 'No especificado';
    }
  }

  /**
   * Formatear fecha
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-HN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Formatear moneda
   */
  formatCurrency(amount: number): string {
    return `L ${amount.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`;
  }

  /**
   * Track by function para facturas
   */
  trackByFacturaId(index: number, factura: Factura): string {
    return factura.id;
  }

  /**
   * Mostrar toast
   */
  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }  /**
   * Manejar cambio en la búsqueda
   */
  onSearchChange(event: any) {
    const query = event.target.value;
    this.searchTerm.set(query);
  }

  /**
   * Ver detalle completo del local en modal
   */
  async verDetalleCompleto() {
    // Por ahora, mostraremos un alert con la información
    const alert = await this.alertController.create({
      header: 'Información Completa del Local',
      message: this.buildLocalInfoMessage(),
      buttons: ['Cerrar'],
      cssClass: 'local-info-alert'
    });
    
    await alert.present();
  }

  /**
   * Construir mensaje con información del local
   */
  private buildLocalInfoMessage(): string {
    const local = this.local();
    if (!local) return 'No hay información disponible';
    
    return `
      <div class="local-info-content">
        <p><strong>ID:</strong> ${local.id}</p>
        <p><strong>Nombre:</strong> ${local.nombre_local || 'No especificado'}</p>
        <p><strong>Número:</strong> ${local.numero_local}</p>
        <p><strong>Permiso de Operación:</strong> ${local.permiso_operacion || 'No especificado'}</p>
        <p><strong>Tipo:</strong> ${local.tipo_local}</p>
        <p><strong>Dirección:</strong> ${local.direccion_local || 'No especificada'}</p>
        <p><strong>Estado:</strong> ${local.estado_local}</p>
        <p><strong>Monto Mensual:</strong> L ${local.monto_mensual}</p>
        <p><strong>Propietario:</strong> ${local.propietario || 'No especificado'}</p>
        <p><strong>DNI Propietario:</strong> ${local.dni_propietario || 'No especificado'}</p>
        <p><strong>Teléfono:</strong> ${local.telefono || 'No especificado'}</p>
        <p><strong>Email:</strong> ${local.email || 'No especificado'}</p>
        <p><strong>Coordenadas:</strong> ${local.latitud}, ${local.longitud}</p>
        <p><strong>Fecha de Creación:</strong> ${this.formatDate(local.createdAt!)}</p>
        <p><strong>Última Actualización:</strong> ${this.formatDate(local.updatedAt!)}</p>
      </div>
    `;
  }
}
