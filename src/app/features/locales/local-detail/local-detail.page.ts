import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonLabel,
  IonBadge, IonButton, IonSpinner, IonIcon, IonFab, IonFabButton,
  IonSearchbar, IonInfiniteScroll, IonInfiniteScrollContent,
  IonSelect, IonSelectOption,
  IonModal,
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
  closeOutline, add, pauseOutline, playOutline, cashOutline, close, 
  chevronDownOutline, chatbubbleOutline, addCircleOutline, walletOutline,
  documentAttachOutline, informationCircleOutline, storefrontOutline, printOutline,
  trendingUpOutline, pieChartOutline, barChartOutline, analyticsOutline,
  cardOutline as cardIcon, cashOutline as cashIcon, person, storefront, 
  calendar, time, checkmarkCircle, alertCircle, receipt, chatbubble,
  print, create, trash, trophy, trophyOutline, medal, ribbon } from 'ionicons/icons';

import { LocalesService } from '../locales.service';
import { FacturasService } from '../../facturas/facturas.service';
import { AuthService } from '../../../core/services/auth.service';
import { 
  Local, Factura, EstadoLocal, EstadoFactura, 
  TipoLocal, Role, User, CreateFacturaRequest, LocalStats 
} from '../../../shared/interfaces';
import { PrintingService } from '../../../shared/services/printing.service';
import { BluetoothService } from '../../bluetooth/bluetooth.service';

@Component({
  selector: 'app-local-detail',
  templateUrl: './local-detail.page.html',
  styleUrls: ['./local-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonBadge, IonButton, IonSpinner, IonIcon, IonFab, IonFabButton,
    IonSearchbar, IonInfiniteScroll, IonInfiniteScrollContent,
    IonSelect, IonSelectOption,
    IonModal
  ]
})
export class LocalDetailPage implements OnInit {
  // Nombre del mercado para mostrar en el modal
  mercadoNombre: string = '';
  /**
   * Devuelve la fecha de vencimiento (15 del mes siguiente al seleccionado)
   */
  getNextDueDate(selectedMonth: number): string {
    if (!selectedMonth || selectedMonth < 1 || selectedMonth > 12) return '';
    // Usar el año y día actuales, pero calcular el mes siguiente al seleccionado
    const today = new Date();
    let year = today.getFullYear();
    let day = today.getDate();
    let nextMonth = selectedMonth + 1;
    let nextYear = year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear = year + 1;
    }
    // Ajustar el día si el mes siguiente no tiene ese día
    const daysInNextMonth = new Date(nextYear, nextMonth, 0).getDate();
    if (day > daysInNextMonth) {
      day = daysInNextMonth;
    }
    // Formato YYYY-MM-DD
    return `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  isCloseHovered = false;
  // Modal de detalle de factura
  showFacturaDetailModal = signal(false);
  facturaSeleccionada = signal<Factura | null>(null);
  
  // Service injections
  private localesService = inject(LocalesService);
  private facturasService = inject(FacturasService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private printingService = inject(PrintingService);
  private bluetoothService = inject(BluetoothService);

  // Signals
  local = signal<Local | null>(null);
  facturas = signal<Factura[]>([]);
  estadisticas = signal<LocalStats | null>(null);
  isLoading = signal(true);
  isLoadingFacturas = signal(false);
  isLoadingStats = signal(false);
  localId = signal<string>('');
  searchTerm = signal<string>('');
  currentPage = signal(1);
  totalPages = signal(1);
  isInfiniteDisabled = signal(false);
  // Signals adicionales
  error = signal<string | null>(null);
  mercadoId = signal<string>('');
  
  // Computed values for legacy compatibility
  estadisticasFacturas = computed(() => {
    const stats = this.estadisticas();
    return stats ? {
      total: stats.estadisticas_facturas.total_facturas,
      pagadas: stats.estadisticas_facturas.facturas_pagadas,
      pendientes: stats.estadisticas_facturas.facturas_pendientes,
      vencidas: stats.estadisticas_facturas.facturas_vencidas
    } : {
      total: 0,
      pagadas: 0,
      pendientes: 0,
      vencidas: 0
    };
  });
  
  // Invoice Modal signals
  showInvoiceModal = signal(false);
  selectedMonth = signal<number>(0);
  isCreatingInvoice = signal(false);
  
  // Filtros como signals para reactividad
  filtroEstado = signal<string>('');
  filtroMes = signal<string>('');
  filtroAnio = signal<string>('');

  // Computed signals adicionales
  canEditLocal = computed(() => this.canEdit());
  hasMoreFacturas = computed(() => this.currentPage() < this.totalPages());

  // Computed signals
  filteredFacturas = computed(() => {
    const facturasArray = this.facturas();
    const search = this.searchTerm().toLowerCase().trim();
    
    let filtered = facturasArray;
    
    // Filtro de búsqueda por texto
    if (search) {
      filtered = filtered.filter(factura => 
        factura.numero_factura?.toLowerCase().includes(search) ||
        factura.correlativo?.toLowerCase().includes(search) ||
        factura.concepto?.toLowerCase().includes(search) ||
        factura.mes?.toLowerCase().includes(search) ||
        factura.anio?.toString().includes(search) ||
        factura.propietario_nombre?.toLowerCase().includes(search)
      );
    }
    
    // Filtro por estado
    if (this.filtroEstado()) {
      filtered = filtered.filter(factura => factura.estado === this.filtroEstado());
    }
    
    // Filtro por mes
    if (this.filtroMes()) {
      const mesNumber = parseInt(this.filtroMes());
      filtered = filtered.filter(factura => {
        // Manejar formato "2025-08" del endpoint
        if (factura.mes?.includes('-')) {
          const mesFromDate = parseInt(factura.mes.split('-')[1]);
          return mesFromDate === mesNumber;
        }
        // Formato legacy "MES_01", "MES_02", etc.
        const facturaMonth = factura.mes?.match(/MES_(\d+)/)?.[1];
        return facturaMonth ? parseInt(facturaMonth) === mesNumber : false;
      });
    }
    
    // Filtro por año
    if (this.filtroAnio()) {
      const anioNumber = parseInt(this.filtroAnio());
      filtered = filtered.filter(factura => factura.anio === anioNumber);
    }
    
    return filtered;
  });

  // Permisos específicos para facturas
  canEdit = computed(() => {
    const user = this.authService.user();
    return user && [Role.ADMIN, Role.MARKET].includes(user.role);
  });

  // Solo ADMIN puede eliminar facturas físicamente
  canDeleteFactura = computed(() => {
    const user = this.authService.user();
    return user && user.role === Role.ADMIN;
  });

  canCreateFactura = computed(() => {
    const user = this.authService.user();
    return user && [Role.ADMIN, Role.MARKET, Role.USER].includes(user.role);
  });

  // Permisos específicos solo para administradores
  canEditFactura = computed(() => {
    const user = this.authService.user();
    return user && user.role === Role.ADMIN;
  });

  // ADMIN y MARKET pueden anular facturas (cambiar estado)
  canAnularFactura = computed(() => {
    const user = this.authService.user();
    return user && [Role.ADMIN, Role.MARKET].includes(user.role);
  });  constructor() {
    addIcons({eyeOutline,createOutline,refreshOutline,alertCircleOutline,storefrontOutline,personOutline,callOutline,businessOutline,locationOutline,cashOutline,calendarOutline,analyticsOutline,documentTextOutline,checkmarkCircleOutline,timeOutline,closeCircleOutline,trendingUpOutline,walletOutline,pieChartOutline,barChartOutline,receiptOutline,addOutline,filterOutline,documentOutline,person,storefront,checkmarkCircle,alertCircle,checkmarkOutline,closeOutline,add,addCircleOutline,close,receipt,calendar,time,chatbubble,print,create,trash,printOutline,chevronDownOutline,chatbubbleOutline,closeSharp,cardOutline,mailOutline,helpCircleOutline,trashOutline,searchOutline,statsChartOutline,downloadOutline,pauseOutline,playOutline,documentAttachOutline,informationCircleOutline,cardIcon,cashIcon,trophy,trophyOutline,medal,ribbon});
  }

  ngOnInit() {
    console.log('LocalDetailPage: ngOnInit ejecutado');
    const id = this.route.snapshot.paramMap.get('id');
    console.log('Local ID obtenido:', id);
    if (id) {
      this.localId.set(id);
      this.loadLocal(id);
      this.loadFacturas(true);
      this.cargarEstadisticasFacturas();
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
        // Cargar estadísticas después de cargar el local
        this.cargarEstadisticasFacturas();
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
   * Abrir modal de crear factura
   */
  openInvoiceModal() {
    this.selectedMonth.set(new Date().getMonth() + 1);
    this.isCreatingInvoice.set(false);
    this.showInvoiceModal.set(true);
  }

  /**
   * Cerrar modal de crear factura
   */
  closeInvoiceModal() {
    this.showInvoiceModal.set(false);
    this.selectedMonth.set(0);
    this.isCreatingInvoice.set(false);
  }

  /**
   * Crear factura desde el modal
   */
  async createInvoice() {
    // 1. Verificar conexión Bluetooth primero
    const isConnected = await this.bluetoothService.isConnected();
    if (!isConnected) {
      const alert = await this.alertController.create({
        header: 'Impresora no conectada',
        message: 'Para crear una factura, primero debe conectar una impresora Bluetooth.',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
          },
          {
            text: 'Configurar Impresora',
            handler: () => {
              this.router.navigate(['/bluetooth-settings']);
            },
          },
        ],
      });
      await alert.present();
      return;
    }

    if (!this.selectedMonth() || this.selectedMonth() === 0) {
      this.showToast('Debe seleccionar un mes', 'warning');
      return;
    }

    this.isCreatingInvoice.set(true);

    try {
      const local = this.local();
      const currentUser = this.authService.user();
      if (!local || !currentUser) {
        this.showToast('Error: Información insuficiente', 'danger');
        this.isCreatingInvoice.set(false);
        return;
      }
      const currentYear = new Date().getFullYear();
      const monthName = this.getMonthName(this.selectedMonth());
      const mes = `${currentYear}-${String(this.selectedMonth()).padStart(2, '0')}`;
      // Calcular fecha de vencimiento correctamente usando el mes seleccionado y el día actual
      let nextMonth = this.selectedMonth() + 1;
      let nextYear = currentYear;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear = currentYear + 1;
      }
      let day = new Date().getDate();
      const daysInNextMonth = new Date(nextYear, nextMonth, 0).getDate();
      if (day > daysInNextMonth) {
        day = daysInNextMonth;
      }
      const dueDate = new Date(nextYear, nextMonth - 1, day);
      const montoMensual = typeof local.monto_mensual === 'string' 
        ? parseFloat(local.monto_mensual) 
        : (local.monto_mensual || 0);
      const facturaData: CreateFacturaRequest = {
        concepto: `Cuota mensual ${monthName} ${currentYear}`,
        mes: mes,
        anio: currentYear,
        monto: montoMensual,
        estado: EstadoFactura.PENDIENTE,
        fecha_vencimiento: dueDate.toISOString(),
        observaciones: `Factura generada para ${monthName} ${currentYear}`,
        localId: local.id,
        createdByUserId: currentUser.id
      };
      const response = await this.facturasService.createFactura(facturaData).toPromise();
      // Manejo robusto: aceptar ApiResponse<Factura> o Factura directa
      let facturaCreada: Factura | null = null;
      if (response && typeof response === 'object') {
        if ('data' in response && response.data && typeof response.data === 'object' && 'id' in response.data) {
          facturaCreada = response.data;
        } else if ('id' in response) {
          facturaCreada = response as unknown as Factura;
        }
      }
      if (facturaCreada) {
        this.closeInvoiceModal();
        this.loadFacturas(true);
        this.cargarEstadisticasFacturas();
        this.imprimirFactura(facturaCreada);
      } else {
        // Log para depuración
        console.error('Respuesta inesperada al crear factura:', response);
        this.showToast('No se pudo crear la factura. Respuesta inesperada.', 'danger');
      }
    } catch (error: any) {
      if (error.status === 409) {
        this.showToast('Ya existe una factura para este mes', 'danger');
      } else {
        this.showToast('Error al crear la factura', 'danger');
      }
    } finally {
      this.isCreatingInvoice.set(false);
    }
  }

  /**
   * Imprimir factura con manejo de errores y reintentos
   */
  async imprimirFactura(factura: Factura) {
    const loading = await this.loadingController.create({
      message: 'Preparando impresión...',
      spinner: 'crescent',
    });
    await loading.present();
    try {
      // Usar directamente los datos de la factura recibida
      const printData = {
        numero_factura: factura.correlativo || factura.numero_factura || factura.id,
        fecha: factura.createdAt ? new Date(factura.createdAt) : new Date(),
        fecha_vencimiento: factura.fecha_vencimiento ? new Date(factura.fecha_vencimiento) : undefined,
        concepto: factura.concepto,
        monto: factura.monto,
        mes: factura.mes,
        anio: factura.anio,
        nombre_local: factura.local?.nombre_local || `Local ${factura.local?.numero_local}`,
        numero_local: factura.local?.numero_local,
        nombre_mercado: factura.mercado_nombre || factura.local?.mercado?.nombre_mercado,
        direccion_mercado: factura.local?.mercado?.direccion,
        propietario_nombre: factura.propietario_nombre || factura.local?.propietario,
        propietario_dni: factura.propietario_dni || factura.local?.dni_propietario,
        // estado_factura: factura.estado, // Eliminado del ticket
      };
      const printString = this.printingService.formatDetailedInvoice(printData);
      loading.message = 'Enviando a la impresora...';
      await this.bluetoothService.print(printString);
      await loading.dismiss();
      this.showToast('Factura enviada a la impresora correctamente.', 'success');
    } catch (error) {
      await loading.dismiss();
      const alert = await this.alertController.create({
        header: 'Error de Impresión',
        message: 'No se pudo imprimir la factura. Verifique la conexión de la impresora Bluetooth.',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
          },
          {
            text: 'Reintentar',
            handler: () => {
              this.imprimirFactura(factura);
            },
          },
          {
            text: 'Configurar Impresora',
            handler: () => {
              this.router.navigate(['/bluetooth-settings']);
            },
          },
        ],
      });
      await alert.present();
    }
  }

  /**
   * Crear nueva factura (método original mantenido para compatibilidad)
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
   */
  async procesarCreacionFactura(mes: string, observaciones: string = '') {
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
        : (local.monto_mensual || 0);
      const facturaData: CreateFacturaRequest = {
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
      if (response && response.data) {
        this.showToast('Factura creada exitosamente', 'success');
        this.loadFacturas(true);
        this.cargarEstadisticasFacturas();
        // --- INICIO INTEGRACIÓN IMPRESIÓN ---
        try {
          const factura = response.data;
          // Adaptar datos para el formato de impresión
          const printData = {
            id: factura.numero_factura || factura.id,
            date: factura.createdAt ? new Date(factura.createdAt) : new Date(),
            customerName: factura.propietario_nombre || local.propietario || 'N/A',
            items: [
              {
                quantity: 1,
                description: factura.concepto,
                price: factura.monto
              }
            ],
            subtotal: factura.monto,
            tax: 0,
            total: factura.monto
          };
          const printString = this.printingService.formatInvoiceForPrinting(printData);
          const printing = await this.loadingController.create({
            message: 'Imprimiendo factura...',
            spinner: 'dots'
          });
          await printing.present();
          await this.bluetoothService.print(printString);
          await printing.dismiss();
          this.showToast('Factura enviada a la impresora', 'success');
        } catch (printError) {
          this.showToast('Error al imprimir la factura', 'danger');
        }
        // --- FIN INTEGRACIÓN IMPRESIÓN ---
      }
    } catch (error: any) {
      await loading.dismiss();
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
  getMonthName(month: number): string {
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
    this.isLoadingStats.set(true);
    try {
      const localId = this.localId();
      console.log('Cargando estadísticas para local:', localId);
      if (!localId) return;
      
      const stats = await this.localesService.getLocalStats(localId).toPromise();
      console.log('Estadísticas recibidas:', stats);
      this.estadisticas.set(stats || null);
      
      // Actualizar el nombre del mercado para el modal
      if (stats?.mercado?.nombre) {
        this.mercadoNombre = stats.mercado.nombre;
      }
    } catch (error) {
      console.error('Error loading estadisticas:', error);
      this.estadisticas.set(null);
    } finally {
      this.isLoadingStats.set(false);
    }
  }

  /**
   * Forzar recarga de estadísticas para debugging
   */
  async recargarEstadisticas() {
    console.log('Forzando recarga de estadísticas...');
    await this.cargarEstadisticasFacturas();
  }

  /**
   * Ver detalle de factura
   */
  verDetalleFactura(factura: Factura) {
    this.facturaSeleccionada.set(factura);
    this.showFacturaDetailModal.set(true);
  }

  cerrarFacturaDetailModal() {
    this.showFacturaDetailModal.set(false);
    this.facturaSeleccionada.set(null);
  }

  /**
   * Marcar como pagada
   */
  async marcarComoPagada(factura: Factura) {
    const alert = await this.alertController.create({
      header: 'Confirmar Pago',
      message: `¿Confirmar el pago de la factura ${factura.correlativo}?`,
      inputs: [
        {
          name: 'fechaPago',
          type: 'date',
          value: new Date().toISOString().split('T')[0],
          placeholder: 'Fecha de pago'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar Pago',
          handler: async (data) => {
            const loading = await this.loadingController.create({
              message: 'Procesando pago...'
            });
            await loading.present();

            try {
              await this.facturasService.payFactura(factura.id, data.fechaPago).toPromise();
              await loading.dismiss();
              
              this.showToast('Factura marcada como pagada exitosamente', 'success');
              this.loadFacturas(true);
              this.cargarEstadisticasFacturas();
              this.cerrarFacturaDetailModal();
            } catch (error) {
              await loading.dismiss();
              console.error('Error al marcar como pagada:', error);
              this.showToast('Error al procesar el pago', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Editar factura
   */
  editarFactura(factura: Factura) {
    this.router.navigate(['/facturas/editar', factura.id]);
  }

  /**
   * Anular factura (cambiar estado a ANULADA) - ADMIN y MARKET
   */
  async anularFactura(factura: Factura) {
    const alert = await this.alertController.create({
      header: 'Anular Factura',
      message: `¿Está seguro de que desea anular la factura ${factura.correlativo}?`,
      subHeader: 'La factura cambiará su estado a ANULADA pero se mantendrá en el sistema para auditoría',
      inputs: [
        {
          name: 'observaciones',
          type: 'textarea',
          placeholder: 'Motivo de la anulación (opcional)',
          attributes: {
            maxlength: 255,
            rows: 3
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Anular Factura',
          role: 'destructive',
          handler: async (data) => {
            const loading = await this.loadingController.create({
              message: 'Anulando factura...'
            });
            await loading.present();

            try {
              await this.facturasService.anularFactura(factura.id, data.observaciones).toPromise();
              await loading.dismiss();
              
              this.showToast('Factura anulada correctamente', 'success');
              this.loadFacturas(true);
              this.cargarEstadisticasFacturas();
              this.cerrarFacturaDetailModal();
            } catch (error) {
              await loading.dismiss();
              console.error('Error al anular factura:', error);
              this.showToast('Error al anular la factura', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Eliminar factura físicamente (Solo ADMIN)
   */
  async eliminarFactura(factura: Factura) {
    const alert = await this.alertController.create({
      header: '⚠️ Eliminar Factura Permanentemente',
      message: `¿Está seguro de que desea ELIMINAR DEFINITIVAMENTE la factura ${factura.correlativo}?`,
      subHeader: '🚨 ADVERTENCIA: Esta acción NO se puede deshacer. La factura será eliminada permanentemente del sistema.',
      inputs: [
        {
          name: 'confirmacion',
          type: 'text',
          placeholder: 'Escriba "ELIMINAR" para confirmar',
          attributes: {
            maxlength: 20
          }
        },
        {
          name: 'observaciones',
          type: 'textarea',
          placeholder: 'Motivo de la eliminación (obligatorio)',
          attributes: {
            maxlength: 500,
            rows: 3
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: '🗑️ Eliminar Permanentemente',
          role: 'destructive',
          handler: async (data) => {
            // Validar confirmación
            if (data.confirmacion?.toUpperCase() !== 'ELIMINAR') {
              this.showToast('Debe escribir "ELIMINAR" para confirmar', 'warning');
              return false;
            }

            if (!data.observaciones?.trim()) {
              this.showToast('Debe especificar el motivo de la eliminación', 'warning');
              return false;
            }

            const loading = await this.loadingController.create({
              message: 'Eliminando factura permanentemente...'
            });
            await loading.present();

            try {
              await this.facturasService.deleteFactura(factura.id).toPromise();
              await loading.dismiss();
              
              this.showToast('Factura eliminada permanentemente', 'success');
              this.loadFacturas(true);
              this.cargarEstadisticasFacturas();
              this.cerrarFacturaDetailModal();
              return true;
            } catch (error) {
              await loading.dismiss();
              console.error('Error al eliminar factura:', error);
              this.showToast('Error al eliminar la factura', 'danger');
              return false;
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
    // Los filtros se aplican automáticamente a través del computed signal
    // No necesitamos hacer nada más aquí ya que filteredFacturas() se actualiza reactivamente
  }

  /**
   * Limpiar filtros
   */
  limpiarFiltros() {
    this.filtroEstado.set('');
    this.filtroMes.set('');
    this.filtroAnio.set('');
    this.searchTerm.set('');
  }

  /**
   * Obtener años disponibles para el filtro
   * Empezando desde 2025 hacia adelante
   */
  getAvailableYears(): number[] {
    const currentYear = new Date().getFullYear();
    const startYear = 2025;
    const endYear = Math.max(currentYear + 1, startYear + 1); // Al menos hasta el próximo año
    
    const years: number[] = [];
    for (let year = endYear; year >= startYear; year--) {
      years.push(year);
    }
    return years;
  }

  /**
   * Verificar si hay filtros activos
   */
  hasActiveFilters(): boolean {
    return !!(this.filtroEstado() || this.filtroMes() || this.filtroAnio() || this.searchTerm().trim());
  }

  /**
   * Handlers para cambios en filtros
   */
  onEstadoChange(event: any) {
    this.filtroEstado.set(event.detail.value || '');
  }

  onMesChange(event: any) {
    this.filtroMes.set(event.detail.value || '');
  }

  onAnioChange(event: any) {
    this.filtroAnio.set(event.detail.value || '');
  }

  onSearchTermChange(value: string) {
    this.searchTerm.set(value);
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
  }  /**
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

  /**
   * Obtener fecha actual formateada
   */
  getCurrentFormattedDate(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  }
  /**
   * Obtener año actual
   */
  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  /**
   * Obtener mes actual formateado
   */
  getCurrentFormattedMonth(): string {
    return String(new Date().getMonth() + 1).padStart(2, '0');
  }

  /**
   * Obtener mes seleccionado formateado
   */
  getFormattedSelectedMonth(): string {
    return String(this.selectedMonth()).padStart(2, '0');
  }

  /**
   * Formatear el mes desde el formato del endpoint (ej: "2025-08") a texto legible
   */
  formatMesFromEndpoint(mes: string): string {
    if (!mes) return 'Mes no especificado';
    
    // Si viene en formato "2025-08"
    if (mes.includes('-')) {
      const [year, month] = mes.split('-');
      const monthNumber = parseInt(month);
      const monthName = this.getMonthName(monthNumber);
      return `${monthName} ${year}`;
    }
    
    // Si viene como número simple, asumimos el año actual
    const monthNumber = parseInt(mes);
    if (monthNumber >= 1 && monthNumber <= 12) {
      return `${this.getMonthName(monthNumber)} ${this.getCurrentYear()}`;
    }
    
    return mes; // Devolver tal como viene si no se puede parsear
  }

  /**
   * Extraer número de mes desde el formato del endpoint
   */
  extractMonthNumber(mes: string): number {
    if (!mes) return 0;
    
    if (mes.includes('-')) {
      const [, month] = mes.split('-');
      return parseInt(month) || 0;
    }
    
    return parseInt(mes) || 0;
  }

  /**
   * Extraer año desde el formato del endpoint
   */
  extractYearFromMes(mes: string): number {
    if (!mes) return this.getCurrentYear();
    
    if (mes.includes('-')) {
      const [year] = mes.split('-');
      return parseInt(year) || this.getCurrentYear();
    }
    
    return this.getCurrentYear();
  }

  /**
   * Reimprimir factura
   */
  async reimprimirFactura(factura: Factura) {
    // Verificar conexión Bluetooth
    const isConnected = await this.bluetoothService.isConnected();
    if (!isConnected) {
      const alert = await this.alertController.create({
        header: 'Impresora no conectada',
        message: 'Para reimprimir la factura, primero debe conectar una impresora Bluetooth.',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
          },
          {
            text: 'Configurar Impresora',
            handler: () => {
              this.router.navigate(['/bluetooth-settings']);
            },
          },
        ],
      });
      await alert.present();
      return;
    }

    // Confirmar reimpresión
    const alert = await this.alertController.create({
      header: 'Reimprimir Factura',
      message: `¿Desea reimprimir la factura ${factura.correlativo || factura.numero_factura}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Reimprimir',
          handler: async () => {
            await this.imprimirFactura(factura);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Obtener acciones disponibles para una factura según su estado
   */
  getFacturaActions(factura: Factura): Array<{
    icon: string;
    label: string;
    color: string;
    action: () => void;
    condition?: boolean;
  }> {
    const actions = [];

    // Ver detalles (siempre disponible)
    actions.push({
      icon: 'eye-outline',
      label: 'Ver',
      color: 'primary',
      action: () => this.verDetalleFactura(factura)
    });

    // Marcar como pagada (solo si está pendiente y el usuario es administrador)
    if (factura.estado === 'PENDIENTE' && this.canEditFactura()) {
      actions.push({
        icon: 'checkmark-circle-outline',
        label: 'Pagar',
        color: 'success',
        action: () => this.marcarComoPagada(factura)
      });
    }

    // Reimprimir (siempre disponible si no está anulada)
    if (factura.estado !== 'ANULADA') {
      actions.push({
        icon: 'print-outline',
        label: 'Imprimir',
        color: 'secondary',
        action: () => this.reimprimirFactura(factura)
      });
    }

    // Editar (solo si no está anulada y el usuario es administrador)
    if (factura.estado !== 'ANULADA' && this.canEditFactura()) {
      actions.push({
        icon: 'create-outline',
        label: 'Editar',
        color: 'warning',
        action: () => this.editarFactura(factura)
      });
    }

    // Anular (solo si no está anulada y el usuario es administrador)
    if (factura.estado !== 'ANULADA' && this.canAnularFactura()) {
      actions.push({
        icon: 'trash-outline',
        label: 'Anular',
        color: 'danger',
        action: () => this.anularFactura(factura)
      });
    }

    return actions;
  }

  // ...existing code...
}
