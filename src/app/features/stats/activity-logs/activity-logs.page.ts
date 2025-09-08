import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonChip,
  IonIcon,
  IonButton,
  IonList,
  IonAvatar,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  LoadingController,
  ToastController,
  InfiniteScrollCustomEvent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  listOutline,
  timeOutline,
  personOutline,
  refreshOutline,
  arrowBackOutline,
  filterOutline,
  searchOutline,
  documentTextOutline,
  businessOutline,
  eyeOutline,
  settingsOutline,
  calendarOutline,
  checkmarkOutline,
  warningOutline,
  documentOutline,
  logInOutline,
  logOutOutline,
  informationCircleOutline,
  bugOutline,
  close,
  closeOutline,
  downloadOutline,
  helpOutline,
  chevronBackOutline,
  chevronForwardOutline,
  analytics, playSkipBackOutline, playSkipForwardOutline, arrowForwardOutline, analyticsOutline } from 'ionicons/icons';

import { StatsService } from '../../../shared/services/stats.service';
import { ExcelService } from '../../../shared/services/excel.service';
import { LocationService } from '../../../shared/services/location.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  ActivityLog,
  ActivityLogResponse,
  LogsFilter,
  UserLocation,
  LocationStatsResponse,
} from '../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-activity-logs',
  templateUrl: './activity-logs.page.html',
  styleUrls: ['./activity-logs.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonButton,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
  ],
})
export class ActivityLogsPage implements OnInit {
  private statsService = inject(StatsService);
  private locationService = inject(LocationService);
  private router = inject(Router);
  private loadingController = inject(LoadingController);
  private toastController = inject(ToastController);
  private authService = inject(AuthService);
  private excelService = inject(ExcelService);

  // Configuración de paginación
  private readonly ITEMS_PER_PAGE = 20;
  public itemsPerPage = 20;

  // Signals para el estado de la página
  activityLogs = signal<ActivityLog[]>([]);
  isLoading = signal<boolean>(false);
  isLoadingMore = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  totalRecordsFromServer = signal<number>(0); // Total de registros del servidor
  hasMoreData = signal<boolean>(true);
  searchTerm = signal<string>('');
  availableLocations = signal<string[]>([]);
  selectedLog = signal<ActivityLog | null>(null);
  isModalOpen = signal<boolean>(false);

  // Signals para filtros y estado
  currentFilter = signal<LogsFilter>({
    limit: 20, // Paginación del servidor - 20 registros por página
    offset: 0,
    timeRange: undefined,
    // Nuevos filtros específicos
    consultaType: '',           // Tipo de consulta (EC, RNP, CATASTRO)
    consultaSubtype: '',        // Subtipo de consulta (amnistia, etc.)
    resultado: '',              // Resultado (SUCCESS, ERROR)
    username: '',               // Usuario específico
    userLocation: '',           // Ubicación del usuario
    parametros: '',             // Parámetros específicos (dni, claveCatastral)
    // Filtros legacy mantenidos para compatibilidad
    consulta: '',
    tipoConsulta: ''
  });

  // Propiedades para el binding de los filtros en el HTML
  get filterConsultaType() { return this.currentFilter().consultaType || ''; }
  set filterConsultaType(value: string) { this.updateFilterField('consultaType', value); }
  
  get filterConsultaSubtype() { return this.currentFilter().consultaSubtype || ''; }
  set filterConsultaSubtype(value: string) { this.updateFilterField('consultaSubtype', value); }
  
  get filterResultado() { return this.currentFilter().resultado || ''; }
  set filterResultado(value: string) { this.updateFilterField('resultado', value); }
  
  get filterUsername() { return this.currentFilter().username || ''; }
  set filterUsername(value: string) { this.updateFilterField('username', value); }
  
  get filterUserLocation() { return this.currentFilter().userLocation || ''; }
  set filterUserLocation(value: string) { this.updateFilterField('userLocation', value); }
  
  get filterParametros() { return this.currentFilter().parametros || ''; }
  set filterParametros(value: string) { this.updateFilterField('parametros', value); }
  
  get filterTimeRange() { return this.currentFilter().timeRange || 'week'; }
  set filterTimeRange(value: string) { this.updateFilterField('timeRange', value); }

  // Filtros legacy mantenidos para compatibilidad
  get filterConsulta() { return this.currentFilter().consulta || ''; }
  set filterConsulta(value: string) { this.updateFilterField('consulta', value); }
  
  get filterTipoConsulta() { return this.currentFilter().tipoConsulta || ''; }
  set filterTipoConsulta(value: string) { this.updateFilterField('tipoConsulta', value); }

  private updateFilterField(field: string, value: string) {
    this.currentFilter.update(filter => ({
      ...filter,
      [field]: value
    }));
  }
  isFilterModalOpen = signal<boolean>(false);

  // Computed para logs filtrados
  // Los logs ya vienen filtrados del servidor, no necesitamos filtrado del lado del cliente
  filteredLogs = computed(() => this.activityLogs());

  constructor() {
    // Configurar iconos
    addIcons({analytics,refreshOutline,warningOutline,downloadOutline,analyticsOutline,checkmarkOutline,documentTextOutline,documentOutline,closeOutline,filterOutline,eyeOutline,playSkipBackOutline,chevronBackOutline,chevronForwardOutline,playSkipForwardOutline,arrowForwardOutline,listOutline,timeOutline,personOutline,arrowBackOutline,searchOutline,businessOutline,settingsOutline,calendarOutline,logInOutline,logOutOutline,informationCircleOutline,bugOutline,close,helpOutline});

    // Effect para actualizar páginas cuando cambian los logs filtrados
    effect(() => {
      const totalRecords = this.filteredLogs().length;
      if (totalRecords > 0) {
        const totalPages = Math.ceil(totalRecords / this.itemsPerPage);
        this.totalPages.set(totalPages);
        
        // Si la página actual es mayor que el total, resetear a la primera
        if (this.currentPage() > totalPages) {
          console.warn('🚨 RESETEO: currentPage reseteada a 1 porque currentPage > totalPages', {
            currentPage: this.currentPage(),
            totalPages: totalPages
          });
          this.currentPage.set(1);
        }
      }
    });
  }

  /**
   * Abrir detalles del log
   */
  openLogDetails(log: ActivityLog) {
    this.selectedLog.set(log);
    this.isModalOpen.set(true);
  }

  /**
   * Cerrar detalles del log
   */
  closeLogDetails() {
    this.isModalOpen.set(false);
    this.selectedLog.set(null);
  }

  /**
   * Exportar logs a Excel
   */
  async exportToExcel() {
    let loading: any = null;
    
    try {
      console.log('📊 Iniciando exportación a Excel con filtros aplicados...');
      
      // Mostrar loading inicial
      loading = await this.loadingController.create({
        message: 'Iniciando obtención de registros...',
        spinner: 'crescent'
      });
      await loading.present();
      
      // Obtener TODOS los registros usando método de múltiples llamadas
      const allLogs = await this.getAllLogsForExport(loading);
      
      // Cerrar el loading de obtención de registros
      if (loading) {
        await loading.dismiss();
        loading = null;
      }
      
      if (allLogs.length === 0) {
        await this.showToast('No hay datos para exportar con los filtros aplicados', 'warning');
        return;
      }

      console.log(`📊 Total de registros obtenidos para exportar: ${allLogs.length}`);

      // Mostrar loading para generación de Excel
      loading = await this.loadingController.create({
        message: `Generando Excel con ${allLogs.length} registros...`,
        spinner: 'crescent'
      });
      await loading.present();

      // Preparar datos para Excel
      const excelData = allLogs.map((log, index) => {
        const userInfo = this.parseUserAgent(log.userAgent);
        
        return {
          'No.': index + 1,
          'Fecha': this.formatDate(log.createdAt),
          'Usuario': this.getUserFullName(log),
          'Consulta': log.consultaType || 'N/A',
          'Tipo': log.consultaSubtype || 'N/A',
          'Resultado': log.resultado || 'N/A',
          'Parámetros': this.formatParameters(log),
          'IP': log.ip || 'N/A',
          'Navegador': userInfo.browser,
          'SO': userInfo.os,
          'Dispositivo': userInfo.device,
          'Tipo Dispositivo': userInfo.type,
          'Ubicación': log.userLocation || 'N/A'
        };
      });

      // Generar archivo Excel
      this.excelService.exportActivityLogsToExcel(
        allLogs,
        'logs-actividad-completos'
      );

      await this.showToast(
        `✅ Archivo Excel generado exitosamente con ${allLogs.length} registros`, 
        'success'
      );
      
    } catch (error) {
      console.error('❌ Error al exportar a Excel:', error);
      await this.showToast('Error al generar archivo Excel', 'danger');
    } finally {
      // Asegurar que el loading se cierre siempre
      if (loading) {
        try {
          await loading.dismiss();
        } catch (dismissError) {
          console.warn('⚠️ Error al cerrar loading:', dismissError);
        }
      }
    }
  }

  /**
   * Contar total de registros que se exportarían
   */
  async countTotalRecords() {
    try {
      console.log('🔢 Contando total de registros...');
      
      const loading = await this.loadingController.create({
        message: 'Contando registros...',
        spinner: 'dots'
      });
      await loading.present();
      
      // Hacer una petición simple para obtener el total
      const countFilter: LogsFilter = {
        ...this.currentFilter(),
        limit: 1,  // Solo necesitamos 1 registro para obtener el total
        offset: 0
      };
      
      const response = await this.statsService.getActivityLogs(countFilter).toPromise();
      
      await loading.dismiss();
      
      if (response && typeof response.total === 'number') {
        const totalRecords = response.total;
        console.log(`📊 Total de registros disponibles: ${totalRecords}`);
        
        const message = totalRecords > 0 
          ? `📊 Se exportarían ${totalRecords} registros con los filtros actuales`
          : 'No hay registros que coincidan con los filtros aplicados';
          
        const color = totalRecords > 0 ? 'primary' : 'warning';
        
        await this.showToast(message, color);
        
        // También mostrar en consola para debugging
        console.log(`📋 Filtros aplicados:`, this.currentFilter());
        
      } else {
        await this.showToast('No se pudo obtener el conteo de registros', 'warning');
      }
      
    } catch (error) {
      console.error('❌ Error al contar registros:', error);
      await this.showToast('Error al contar registros', 'danger');
    }
  }

  /**
   * Obtener TODOS los logs para exportación usando múltiples llamadas si es necesario
   */
  private async getAllLogsForExport(loadingRef?: any): Promise<ActivityLog[]> {
    console.log('🔄 Iniciando obtención de todos los registros...');
    
    const allLogs: ActivityLog[] = [];
    let currentOffset = 0;
    const batchSize = 1000; // Tamaño de lote más grande
    let hasMoreData = true;
    let totalRecords = 0;
    
    while (hasMoreData) {
      const exportFilter: LogsFilter = {
        ...this.currentFilter(),
        limit: batchSize,
        offset: currentOffset,
        page: undefined,
        per_page: undefined
      };
      
      console.log(`📋 Obteniendo lote: offset=${currentOffset}, limit=${batchSize}`);
      
      // Actualizar mensaje de loading (sin recrear)
      if (loadingRef) {
        loadingRef.message = `Obteniendo registros... ${allLogs.length}${totalRecords > 0 ? `/${totalRecords}` : ''}`;
      }
      
      try {
        const response = await this.statsService.getActivityLogs(exportFilter).toPromise();
        
        if (!response || !response.logs || !Array.isArray(response.logs)) {
          console.error('❌ Respuesta inválida en lote:', response);
          break;
        }
        
        const logs = response.logs;
        totalRecords = response.total || 0;
        
        console.log(`📊 Lote obtenido: ${logs.length} registros (total server: ${totalRecords})`);
        console.log(`📋 Ejemplo de parámetros del primer log:`, logs[0]?.parametros);
        
        // Log específico para debugging de parámetros
        if (logs.length > 0) {
          const firstLog = logs[0];
          console.log('🔍 DEBUGGING PARÁMETROS:', {
            original: firstLog.parametros,
            type: typeof firstLog.parametros,
            consultaType: firstLog.consultaType,
            consultaSubtype: firstLog.consultaSubtype
          });
          
          // Intentar parsear para ver qué pasa
          try {
            if (firstLog.parametros) {
              let parsed = JSON.parse(firstLog.parametros);
              console.log('🔍 PRIMER PARSING:', parsed, typeof parsed);
              
              if (typeof parsed === 'string') {
                let secondParsed = JSON.parse(parsed);
                console.log('🔍 SEGUNDO PARSING:', secondParsed, typeof secondParsed);
              }
            }
          } catch (e) {
            console.log('🔍 ERROR EN PARSING:', e);
          }
        }
        
        if (logs.length === 0) {
          // No hay más registros
          hasMoreData = false;
        } else {
          // Agregar logs al array total
          allLogs.push(...logs);
          currentOffset += logs.length;
          
          // Verificar si hemos obtenido todos los registros
          if (allLogs.length >= totalRecords || logs.length < batchSize) {
            hasMoreData = false;
          }
        }
        
      } catch (error) {
        console.error('❌ Error obteniendo lote:', error);
        hasMoreData = false;
      }
      
      // Límite de seguridad para evitar bucles infinitos
      if (allLogs.length > 50000) {
        console.warn('⚠️ Límite de seguridad alcanzado (50,000 registros)');
        break;
      }
    }
    
    console.log(`✅ Total de registros obtenidos: ${allLogs.length} de ${totalRecords}`);
    return allLogs;
  }

  ngOnInit() {
    console.log('🔧 ActivityLogsPage inicializada');
    console.log('🔧 Usuario autenticado:', this.authService.isAuthenticated());
    console.log('🔧 Rol del usuario:', this.authService.userRole());
    console.log('🔧 Puede acceder a stats generales:', this.canAccessGeneralStats());
    
    this.loadActivityLogs();
    this.loadAvailableLocations();
  }

  /**
   * Verificar si el usuario puede acceder a estadísticas generales
   */
  canAccessGeneralStats(): boolean {
    return this.authService.hasRole('SUPER-ADMIN') || this.authService.hasRole('USER-ADMIN');
  }

  /**
   * Cargar logs de actividad con paginación completa
   */
  async loadActivityLogs() {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.errorMessage.set('');

    try {
      // Verificar autenticación
      if (!this.authService.isAuthenticated()) {
        await this.showToast('Sesión expirada. Por favor, inicia sesión nuevamente.', 'warning');
        return;
      }

      // Verificar permisos
      if (!this.canAccessGeneralStats()) {
        await this.showToast('No tienes permisos para ver los logs de actividad.', 'warning');
        return;
      }

      // Cargar todos los logs usando el método existente que funciona
      await this.loadAllActivityLogs();
      
    } catch (error: any) {
      console.error('❌ Error al cargar logs:', error);
      let errorMessage = 'Error al cargar los logs de actividad';
      
      if (error?.status === 401) {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      } else if (error?.status === 403) {
        errorMessage = 'No tienes permisos para ver los logs de actividad.';
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      }
      
      await this.showToast(errorMessage, 'danger');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Cargar logs de actividad con parámetros específicos (bypass del signal)
   */
  private async loadPageDataWithParams(page: number, limit: number, offset: number) {
    console.log('🚀 loadPageDataWithParams:', { page, limit, offset });
    
    try {
      // Crear filtro con los parámetros específicos
      const currentFilters = this.currentFilter();
      const filter: LogsFilter = {
        ...currentFilters,
        limit: limit,
        offset: offset
      };

      console.log(`🔄 Cargando página ${page} con filtros directos:`, filter);
      console.log(`📄 URL que se llamará: /api/user-stats/logs?limit=${filter.limit}&offset=${filter.offset}`);

      this.isLoading.set(true);
      const response = await this.statsService.getActivityLogs(filter).toPromise();
      
      if (response && response.logs && Array.isArray(response.logs)) {
        this.activityLogs.set(response.logs);
        
        const totalRecords = response.total || 0;
        const totalPages = Math.ceil(totalRecords / limit);
        
        this.totalRecordsFromServer.set(totalRecords);
        this.totalPages.set(totalPages);
        this.hasMoreData.set(page < totalPages);
        
        console.log(`✅ Cargados: ${response.logs.length} registros de ${totalRecords} totales`);
        console.log(`📄 Página ${page} de ${totalPages} páginas`);
        
        this.hasError.set(false);
        this.errorMessage.set('');
      } else {
        console.error('❌ Respuesta inválida del servidor:', response);
        this.hasError.set(true);
        this.errorMessage.set('No se pudieron cargar los logs');
      }
    } catch (error) {
      console.error('❌ Error cargando logs:', error);
      this.hasError.set(true);
      this.errorMessage.set(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Cargar logs de actividad con paginación del lado del servidor
   */
  private async loadAllActivityLogs() {
    console.log('🚀 Iniciando loadAllActivityLogs');
    try {
      // Validar y corregir el estado de la paginación antes de cargar
      this.validatePaginationState();
      
      const currentFilters = this.currentFilter();
      const page = this.currentPage();
      const limit = currentFilters.limit || 20;
      const offset = currentFilters.offset || 0;
      
      console.log('📋 Estado actual:', { 
        currentFilters, 
        page, 
        limit, 
        offset,
        calculatedOffset: (page - 1) * limit 
      });
      
      // Verificar si el offset es correcto
      const expectedOffset = (page - 1) * limit;
      if (offset !== expectedOffset) {
        console.warn('⚠️ Offset inconsistente después de validación:', { 
          current: offset, 
          expected: expectedOffset 
        });
      }
      
      const filter: LogsFilter = {
        ...currentFilters,
        limit: limit,
        offset: offset
      };

      console.log(`🔄 Cargando página ${page} con filtros:`, filter);
      console.log(`📄 URL que se llamará: /api/user-stats/logs?limit=${filter.limit}&offset=${filter.offset}`);

      const response = await this.statsService.getActivityLogs(filter).toPromise();
      
      if (response && response.logs && Array.isArray(response.logs)) {
        this.activityLogs.set(response.logs);
        
        const totalRecords = response.total || 0;
        const totalPages = Math.ceil(totalRecords / limit);
        
        this.totalRecordsFromServer.set(totalRecords);
        this.totalPages.set(totalPages);
        this.hasMoreData.set(page < totalPages);
        
        console.log(`✅ Cargados: ${response.logs.length} registros de ${totalRecords} totales`);
        console.log(`📄 Página ${page} de ${totalPages} páginas`);
      } else {
        this.activityLogs.set([]);
        this.totalPages.set(1);
        this.hasMoreData.set(false);
      }
    } catch (error) {
      console.error('Error cargando logs:', error);
      this.activityLogs.set([]);
      this.totalPages.set(1);
      this.hasMoreData.set(false);
      throw error;
    }
  }

  /**
   * Manejar errores de carga
   */
  private handleLoadError(error: any) {
    console.error('❌ Error completo:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      error: error.error,
    });

    this.hasError.set(true);

    // Mensaje de error más específico
    if (error.status === 403) {
      this.errorMessage.set(
        'No tienes permisos para ver los logs de actividad'
      );
    } else if (error.status === 404) {
      this.errorMessage.set('Endpoint de logs no encontrado');
    } else if (error.status === 0) {
      this.errorMessage.set('No se puede conectar con el servidor');
    } else {
      this.errorMessage.set(
        `Error del servidor: ${error.status || 'Desconocido'} - ${
          error.message || error.statusText || 'Sin detalles'
        }`
      );
    }
  }

  /**
   * Refrescar logs
   */
  async refreshLogs(event?: any) {
    await this.loadActivityLogs();
    if (event) {
      event.target.complete();
    }
  }

  /**
   * Cargar más logs (infinite scroll)
   * Como ahora cargamos todos los registros de una vez, este método ya no es necesario
   */
  async loadMoreLogs(event: InfiniteScrollCustomEvent) {
    // Ya no necesitamos cargar más datos porque cargamos todo de una vez
    console.log('ℹ️ LoadMoreLogs llamado, pero todos los datos ya están cargados');
    event.target.complete();
  }

  /**
   * Aplicar filtros (versión simplificada)
   */
  async applyFiltersOld() {
    this.isFilterModalOpen.set(false);
    this.currentPage.set(1); // Resetear a la primera página
    // Los filtros se aplican automáticamente a través del computed filteredLogs
  }

  /**
   * Limpiar filtros (versión simplificada)
   */
  async clearFiltersOld() {
    this.currentFilter.set({
      limit: 20,
      offset: 0,
      timeRange: undefined,
      consulta: '',
      tipoConsulta: '',
      resultado: '',
      username: '',
      userLocation: ''
    });
    this.searchTerm.set('');
    this.currentPage.set(1);
  }

  /**
   * Obtener color del módulo
   */
  getModuleColor(modulo: string): string {
    const colors: { [key: string]: string } = {
      'EC': 'primary',
      'RNP': 'secondary',
      'CATASTRO': 'tertiary',
      'ADMIN': 'warning'
    };
    return colors[modulo] || 'medium';
  }

  /**
   * Obtener nombre del módulo
   */
  getModuleName(consultaType: string): string {
    const names: { [key: string]: string } = {
      'EC': 'Estado Civil',
      'RNP': 'Registro Nacional',
      'CATASTRO': 'Catastro'
    };
    return names[consultaType] || consultaType;
  }

  /**
   * Obtener color de la acción
   */
  getActionColor(resultado: string): string {
    switch (resultado?.toUpperCase()) {
      case 'SUCCESS':
        return 'success';
      case 'ERROR':
        return 'danger';
      case 'WARNING':
        return 'warning';
      default:
        return 'medium';
    }
  }

  /**
   * Obtener icono de la acción
   */
  getActionIcon(consultaType: string): string {
    const icons: { [key: string]: string } = {
      'EC': 'document-text-outline',
      'RNP': 'person-outline',
      'CATASTRO': 'business-outline'
    };
    return icons[consultaType] || 'document-outline';
  }

  /**
   * Formatear fecha
   */
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  }

  /**
   * Obtener tiempo relativo
   */
  getRelativeTime(dateString: string): string {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Ahora mismo';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)} h`;
      return `Hace ${Math.floor(diffMins / 1440)} días`;
    } catch {
      return 'Fecha inválida';
    }
  }

  /**
   * Obtener iniciales del usuario
   */
  getUserInitials(log: ActivityLog): string {
    if (!log?.username) return 'U';
    const username = log.username;
    if (username.length >= 2) {
      return username.substring(0, 2).toUpperCase();
    }
    return username.charAt(0).toUpperCase();
  }

  /**
   * Obtener nombre completo del usuario
   */
  getUserFullName(log: ActivityLog | null): string {
    if (!log?.username) return 'Usuario desconocido';
    return log.username;
  }

  /**
   * Track by function para optimizar renderizado
   */
  trackByLogId(index: number, log: ActivityLog): string {
    return log.id;
  }

  /**
   * Navegar hacia atrás
   */
  goBack() {
    this.router.navigate(['/stats']);
  }

  /**
   * Probar endpoint directamente
   */
  async testEndpoint() {
    console.log('🧪 Probando endpoint directamente...');
    try {
      const testFilter = { page: 1, per_page: 5 };
      const response = await this.statsService.getActivityLogs(testFilter).toPromise();
      console.log('🧪 Respuesta de prueba:', response);
    } catch (error) {
      console.error('🧪 Error en prueba:', error);
    }
  }

  /**
   * Mostrar toast
   */
  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  /**
   * Actualizar filtro
   */
  updateFilter(field: string, value: any) {
    this.currentFilter.update(filter => ({
      ...filter,
      [field]: value
    }));
  }

  /**
   * Manejar cambio de filtro (versión antigua)
   */
  onFilterChangeOld(field: string, event: Event) {
    const target = event.target as HTMLSelectElement;
    this.updateFilter(field, target.value);
  }

  /**
   * Cargar ubicaciones disponibles
   */
  async loadAvailableLocations() {
    try {
      // Por ahora, usar ubicaciones mock hasta que el endpoint esté disponible
      const mockLocations = [
        'Mercado Central',
        'Mercado Norte',
        'Mercado Sur',
        'Mercado Este',
        'Mercado Oeste'
      ];
      this.availableLocations.set(mockLocations);
    } catch (error) {
      console.error('Error al cargar ubicaciones:', error);
    }
  }



  // Computed properties para paginación
  paginatedLogs = computed(() => {
    // Los logs ya vienen paginados del servidor, no necesitamos slice
    return this.activityLogs();
  });

  totalRecords = computed(() => {
    // El total de registros viene del servidor
    return this.totalRecordsFromServer();
  });

  /**
   * Calcular total de páginas basado en registros filtrados
   */
  totalPagesCalculated = computed(() => {
    // Calcular páginas basándose en el total de registros del servidor
    const totalRecords = this.totalRecordsFromServer();
    const limit = this.currentFilter().limit || 50;
    return totalRecords > 0 ? Math.ceil(totalRecords / limit) : 1;
  });

  /**
   * Actualizar total de páginas
   */
  private updateTotalPages() {
    this.totalPages.set(this.totalPagesCalculated());
  }

  /**
   * Formatear parámetros del log
   */
  formatParameters(log: ActivityLog): string {
    if (!log.parametros) return 'Sin parámetros';
    
    try {
      // Doble parsing para manejar JSON strings anidados
      let params = log.parametros;
      
      // Primer parsing: del string JSON a objeto
      if (typeof params === 'string') {
        params = JSON.parse(params);
      }
      
      // Si el resultado es aún un string, hacer segundo parsing
      if (typeof params === 'string') {
        params = JSON.parse(params);
      }
      
      // Debug: mostrar parámetros parseados
      console.log('🔍 Debug formatParameters:', {
        original: log.parametros,
        firstParse: typeof log.parametros === 'string' ? JSON.parse(log.parametros) : log.parametros,
        finalParams: params,
        keys: typeof params === 'object' ? Object.keys(params) : 'no keys'
      });
      
      if (typeof params === 'object' && params !== null) {
        return Object.entries(params)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
      } else {
        return String(params);
      }
    } catch (error) {
      console.error('Error parsing parameters:', error);
      return log.parametros;
    }
  }

  /**
   * Formatear parámetros de forma legible
   */
  formatParametersFormatted(log: ActivityLog | null): string {
    if (!log?.parametros) return 'Sin parámetros';
    
    try {
      // Doble parsing para manejar JSON strings anidados
      let params = log.parametros;
      
      // Primer parsing: del string JSON a objeto
      if (typeof params === 'string') {
        params = JSON.parse(params);
      }
      
      // Si el resultado es aún un string, hacer segundo parsing
      if (typeof params === 'string') {
        params = JSON.parse(params);
      }
      
      if (typeof params === 'object' && params !== null) {
        return Object.entries(params)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
      } else {
        return String(params);
      }
    } catch (error) {
      console.error('Error parsing formatted parameters:', error);
      return log.parametros;
    }
  }

  /**
   * Manejar cambios en los filtros
   */
  // Método eliminado - ahora se usan los getters/setters para el binding directo

  /**
   * Limpiar todos los filtros
   */
  clearFilters() {
    this.currentFilter.set({
      limit: 20, // Paginación del servidor - 20 registros por página
      offset: 0,
      timeRange: undefined,
      // Nuevos filtros específicos
      consultaType: '',
      consultaSubtype: '',
      resultado: '',
      username: '',
      userLocation: '',
      parametros: '',
      // Filtros legacy
      consulta: '',
      tipoConsulta: ''
    });
    this.searchTerm.set('');
    
    // Resetear página actual
    this.currentPage.set(1);
    
    // Recargar datos
    this.loadAllActivityLogs();
  }

  /**
   * Verificar si hay filtros activos
   */
  private hasActiveFilters(): boolean {
    const filter = this.currentFilter();
    return !!(
      // Nuevos filtros específicos
      filter.consultaType || filter.consultaSubtype || filter.resultado || 
      filter.username || filter.userLocation || filter.parametros ||
      // Filtros legacy
      filter.consulta || filter.tipoConsulta || 
      // Término de búsqueda
      this.searchTerm()
    );
  }

  /**
   * Aplicar filtros (recarga los datos)
   */
  applyFilters() {
    console.log('🔍 Aplicando filtros actualizados:', this.currentFilter());
    
    // Mostrar en consola los endpoints que se utilizarán
    this.logFilterExamples();
    
    // Resetear a la primera página cuando se aplican filtros
    this.currentPage.set(1);
    
    // Mantener el límite actual pero resetear el offset a 0
    this.currentFilter.update(filter => ({
      ...filter,
      offset: 0  // Solo resetear offset, mantener el límite actual
    }));
    
    // Usar setTimeout para asegurar que el signal se actualice
    setTimeout(() => {
      this.loadAllActivityLogs();
    }, 0);
  }

  /**
   * Mostrar ejemplos de endpoints basados en los filtros aplicados
   */
  private logFilterExamples() {
    const filter = this.currentFilter();
    const baseUrl = '/api/user-stats/logs';
    const examples: string[] = [];

    if (filter.consultaType) {
      examples.push(`${baseUrl}?consultaType=${filter.consultaType}`);
    }

    if (filter.consultaSubtype && filter.resultado) {
      examples.push(`${baseUrl}?consultaSubtype=${filter.consultaSubtype}&resultado=${filter.resultado}`);
    }

    if (filter.username) {
      examples.push(`${baseUrl}?username=${filter.username}`);
    }

    if (filter.userLocation) {
      examples.push(`${baseUrl}?userLocation=${encodeURIComponent(filter.userLocation)}`);
    }

    // Corregido: usar 'dni' o 'claveCatastral' como valores del parámetro
    if (filter.parametros) {
      if (filter.parametros === 'dni') {
        examples.push(`${baseUrl}?parametros=dni`);
      } else if (filter.parametros === 'claveCatastral') {
        examples.push(`${baseUrl}?parametros=claveCatastral`);
      } else {
        // Si es un valor personalizado, asumir que es el tipo de parámetro
        examples.push(`${baseUrl}?parametros=${filter.parametros}`);
      }
    }

    if (examples.length > 0) {
      console.log('📡 Endpoints que se utilizarán:');
      examples.forEach((example, index) => {
        console.log(`  ${index + 1}. ${example}`);
      });
    }
  }

  /**
   * Obtener clase CSS para el resultado
   */
  getResultClass(resultado: string | undefined): string {
    switch (resultado?.toUpperCase()) {
      case 'SUCCESS':
        return 'result-success';
      case 'ERROR':
        return 'result-error';
      case 'WARNING':
        return 'result-warning';
      default:
        return 'result-default';
    }
  }

  // Métodos de paginación

  /**
   * Método auxiliar para calcular el offset correcto basado en la página y límite
   */
  private calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Validar y corregir el estado de la paginación
   */
  private validatePaginationState(): void {
    const currentFilters = this.currentFilter();
    const page = this.currentPage();
    const limit = currentFilters.limit || 20;
    const expectedOffset = this.calculateOffset(page, limit);
    
    if (currentFilters.offset !== expectedOffset) {
      console.warn('⚠️ Corrigiendo inconsistencia en paginación:', {
        currentOffset: currentFilters.offset,
        expectedOffset: expectedOffset,
        page: page,
        limit: limit
      });
      
      this.currentFilter.update(filter => ({
        ...filter,
        offset: expectedOffset
      }));
    }
  }

  /**
   * Método auxiliar para actualizar página y offset de forma sincronizada
   */
  private updatePageAndOffset(page: number): void {
    const limit = this.currentFilter().limit || 20;
    const offset = this.calculateOffset(page, limit);
    
    console.log('� Actualizando página y offset:', { page, limit, offset });
    
    // Actualizar página
    this.currentPage.set(page);
    
    // Actualizar filtro con nuevo offset
    this.currentFilter.update(filter => ({
      ...filter,
      offset: offset
    }));
    
    console.log('✅ Estado actualizado:', {
      currentPage: this.currentPage(),
      currentFilter: this.currentFilter()
    });
  }

  goToPage(page: number): void {
    console.log('🔄 Cambiando a página:', page);
    console.log('DEBUG: totalPagesCalculated:', this.totalPagesCalculated());
    console.log('FILTRO ANTES:', this.currentFilter());
    console.log('� Filtro antes:', this.currentFilter());
    
    if (page >= 1 && page <= this.totalPagesCalculated()) {
      console.log('DEBUG: Entró al IF - validación pasada');
      console.log('DEBUG: totalPagesCalculated value:', this.totalPagesCalculated());
      // Calcular parámetros directamente
      const limit = this.currentFilter().limit || 20;
      const offset = (page - 1) * limit;
      
      console.log('� Parámetros calculados:', { page, limit, offset });
      
      // Actualizar página y filtro
      this.currentPage.set(page);
      console.log('DEBUG: currentPage actualizada a:', this.currentPage());
      
      // Forzar detección de cambios
      setTimeout(() => {
        console.log('DEBUG: currentPage después de timeout:', this.currentPage());
      }, 100);
      
      this.currentFilter.update(filter => ({
        ...filter,
        offset: offset
      }));
      
      // Cargar datos con parámetros específicos (bypass del signal)
      console.log('LLAMANDO loadPageDataWithParams con parametros:', { page, limit, offset });
      console.log('DEBUG: getCurrentPageFromOffset():', this.getCurrentPageFromOffset());
      console.log('DEBUG: getStartRecord():', this.getStartRecord(), 'getEndRecord():', this.getEndRecord());
      this.loadPageDataWithParams(page, limit, offset);
    } else {
      console.error('DEBUG: Página fuera de rango o totalPages inválido');
      console.error('DEBUG: page =', page, 'totalPagesCalculated() =', this.totalPagesCalculated());
    }
  }

  onItemsPerPageChange(): void {
    this.currentPage.set(1); // Resetear a la primera página
    this.currentFilter.update(filter => ({
      ...filter,
      limit: this.itemsPerPage,
      offset: 0
    }));
    // Cargar datos con parámetros específicos
    this.loadPageDataWithParams(1, this.itemsPerPage, 0);
  }

  jumpToPage(pageValue: string): void {
    const page = parseInt(pageValue, 10);
    if (!isNaN(page)) {
      this.goToPage(page);
    }
  }

  /**
   * Ir a la página anterior
   */
  previousPage() {
    const currentPageValue = this.getCurrentPageFromOffset();
    console.log('⬅️ previousPage - currentPage:', currentPageValue);
    
    if (currentPageValue > 1) {
      const newPage = currentPageValue - 1;
      console.log('⬅️ Navegando a página anterior:', newPage);
      this.goToPage(newPage);
    } else {
      console.log('⬅️ Ya estamos en la primera página');
    }
  }

  /**
   * Ir a la página siguiente
   */
  nextPage() {
    const currentPageValue = this.getCurrentPageFromOffset();
    const totalPages = this.totalPagesCalculated();
    console.log('➡️ nextPage - currentPage:', currentPageValue, 'totalPages:', totalPages);
    
    if (currentPageValue < totalPages) {
      const newPage = currentPageValue + 1;
      console.log('➡️ Navegando a página siguiente:', newPage);
      this.goToPage(newPage);
    } else {
      console.log('➡️ Ya estamos en la última página');
    }
  }

  /**
   * Cargar datos de una página específica
   */
  private loadPageData() {
    this.loadAllActivityLogs();
  }

  /**
   * Obtener páginas visibles para la paginación
   */
  getVisiblePages(): number[] {
    const total = this.totalPagesCalculated();
    const current = this.getCurrentPageFromOffset(); // Usar método basado en offset
    const pages: number[] = [];

    console.log('🔢 getVisiblePages - total:', total, 'current:', current);

    if (total <= 7) {
      // Si hay 7 páginas o menos, mostrar todas
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Lógica mejorada para mostrar páginas con elipsis
      if (current <= 4) {
        // Mostrar las primeras 5 páginas (sin la primera porque se muestra por separado)
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (current >= total - 3) {
        // Mostrar las últimas 5 páginas (sin la última porque se muestra por separado)
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        // Mostrar páginas alrededor de la actual (sin primera y última)
        for (let i = current - 2; i <= current + 2; i++) {
          pages.push(i);
        }
      }
    }

    console.log('🔢 getVisiblePages result:', pages);
    return pages;
  }

  /**
   * Verificar si se debe mostrar elipsis antes
   */
  shouldShowEllipsisBefore(): boolean {
    const total = this.totalPagesCalculated();
    const current = this.getCurrentPageFromOffset();
    return total > 7 && current > 4;
  }

  /**
   * Verificar si se debe mostrar elipsis después
   */
  shouldShowEllipsisAfter(): boolean {
    const total = this.totalPagesCalculated();
    const current = this.getCurrentPageFromOffset();
    return total > 7 && current < total - 3;
  }

  /**
   * Verificar si se debe mostrar elipsis (método original mantenido para compatibilidad)
   */
  shouldShowEllipsis(): boolean {
    const total = this.totalPagesCalculated();
    const current = this.getCurrentPageFromOffset(); // Usar método basado en offset
    return total > 7 && (current > 4 && current < total - 3);
  }

  /**
   * Obtener la página actual basada en el offset
   */
  getCurrentPageFromOffset(): number {
    const currentFilters = this.currentFilter();
    const offset = currentFilters.offset || 0;
    const limit = currentFilters.limit || 20;
    return Math.floor(offset / limit) + 1;
  }

  /**
   * Obtener número del primer registro mostrado
   */
  getStartRecord(): number {
    const currentFilters = this.currentFilter();
    const offset = currentFilters.offset || 0;
    const limit = currentFilters.limit || 20;
    const totalRecords = this.totalRecords();
    
    console.log('DEBUG getStartRecord:', { offset, limit, totalRecords });
    
    if (totalRecords === 0) return 0;
    
    const result = offset + 1;
    console.log('DEBUG getStartRecord result:', result);
    return result;
  }

  /**
   * Obtener número del último registro mostrado
   */
  getEndRecord(): number {
    const currentFilters = this.currentFilter();
    const offset = currentFilters.offset || 0;
    const totalRecords = this.totalRecords();
    const logsInCurrentPage = this.activityLogs().length;
    
    console.log('DEBUG getEndRecord:', { offset, totalRecords, logsInCurrentPage });
    
    if (totalRecords === 0) return 0;
    
    const result = offset + logsInCurrentPage;
    console.log('DEBUG getEndRecord result:', result);
    return result;
  }

  /**
   * Analizar el user agent para obtener información del navegador y dispositivo
   */
  parseUserAgent(userAgent?: string): { browser: string; os: string; device: string; type: string } {
    // Si no hay user agent, devolver valores por defecto
    if (!userAgent) {
      return {
        browser: 'Desconocido',
        os: 'Desconocido',
        device: 'Desconocido',
        type: 'Desconocido'
      };
    }

    // Detectar navegador
    let browser = 'Desconocido';
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browser = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      browser = 'Firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browser = 'Safari';
    } else if (userAgent.includes('Edg')) {
      browser = 'Edge';
    } else if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) {
      browser = 'Internet Explorer';
    } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
      browser = 'Opera';
    }

    // Detectar sistema operativo
    let os = 'Desconocido';
    if (userAgent.includes('Windows')) {
      // Extraer versión de Windows si está disponible
      const windowsMatch = userAgent.match(/Windows NT ([\d\.]+)/);
      if (windowsMatch) {
        const version = windowsMatch[1];
        const windowsVersions: { [key: string]: string } = {
          '10.0': '10',
          '6.3': '8.1',
          '6.2': '8',
          '6.1': '7'
        };
        os = `Windows ${windowsVersions[version] || version}`;
      } else {
        os = 'Windows';
      }
    } else if (userAgent.includes('Mac OS')) {
      // Extraer versión de macOS si está disponible
      const macMatch = userAgent.match(/Mac OS X ([\d_]+)/);
      if (macMatch) {
        const version = macMatch[1].replace(/_/g, '.');
        os = `macOS ${version}`;
      } else {
        os = 'Mac OS';
      }
    } else if (userAgent.includes('Android')) {
      // Extraer versión de Android
      const androidMatch = userAgent.match(/Android ([\d\.]+)/);
      if (androidMatch) {
        os = `Android ${androidMatch[1]}`;
      } else {
        os = 'Android';
      }
    } else if (
      userAgent.includes('iOS') ||
      userAgent.includes('iPhone') ||
      userAgent.includes('iPad')
    ) {
      // Extraer versión de iOS si está disponible
      const iosMatch = userAgent.match(/OS ([\d_]+)/);
      if (iosMatch) {
        const version = iosMatch[1].replace(/_/g, '.');
        os = `iOS ${version}`;
      } else {
        os = 'iOS';
      }
    } else if (userAgent.includes('Linux')) {
      os = 'Linux';
    }

    // Detectar dispositivo
    let device = 'Desconocido';
    let type = 'Desconocido';
    if (userAgent.includes('Mobile')) {
      type = 'Móvil';
      if (userAgent.includes('iPhone')) {
        device = 'iPhone';
      } else if (userAgent.includes('Android')) {
        // Extraer modelo de Android si está disponible
        const androidMatch = userAgent.match(/Android [\d\.]+; ([^;]+)/);
        device = androidMatch ? androidMatch[1] : 'Android';
      } else {
        device = 'Smartphone';
      }
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      type = 'Tablet';
      if (userAgent.includes('iPad')) {
        device = 'iPad';
      } else {
        device = 'Tablet';
      }
    } else {
      type = 'Desktop';
      if (userAgent.includes('Windows')) {
        device = 'PC Windows';
      } else if (userAgent.includes('Mac')) {
        device = 'Mac';
      } else if (userAgent.includes('Linux')) {
        device = 'PC Linux';
      } else {
        device = 'PC';
      }
    }

    return { browser, os, device, type };
  }

  /**
   * Obtener el número de registro considerando la paginación
   */
  getRecordNumber(index: number): number {
    const currentPageValue = this.currentPage();
    const itemsPerPageValue = this.currentFilter().limit || 50;
    return (currentPageValue - 1) * itemsPerPageValue + index + 1;
  }

  /**
   * Validar formato de DNI hondureño
   */
  isValidDNI(dni: string): boolean {
    // DNI hondureño: 13 dígitos (DDMMAAAANNNNNN)
    const dniRegex = /^\d{13}$/;
    return dniRegex.test(dni);
  }

  /**
   * Validar formato de clave catastral
   */
  isValidClaveCatastral(clave: string): boolean {
    // Formato típico de clave catastral: números y posibles separadores
    const claveRegex = /^[\d\-\.]+$/;
    return claveRegex.test(clave) && clave.length >= 6;
  }

  /**
   * Obtener sugerencias para filtros de parámetros
   */
  getParameterSuggestions(value: string): string[] {
    const suggestions: string[] = [];
    
    if (value === 'dni') {
      suggestions.push('✓ Filtrar por consultas que usen DNI como parámetro');
    } else if (value === 'claveCatastral') {
      suggestions.push('✓ Filtrar por consultas que usen Clave Catastral como parámetro');
    } else if (value === '') {
      suggestions.push('Seleccionar tipo de parámetro para filtrar');
    }
    
    return suggestions;
  }

  /**
   * Manejar cambios en el filtro de parámetros
   */
  onParameterFilterChange(value: string) {
    this.filterParametros = value;
    
    const suggestions = this.getParameterSuggestions(value);
    console.log('💡 Filtro de parámetros:', suggestions);
  }

  /**
   * Limpiar filtro específico
   */
  clearSpecificFilter(filterName: string) {
    this.currentFilter.update(filter => ({
      ...filter,
      [filterName]: ''
    }));
    
    console.log(`🧹 Filtro '${filterName}' limpiado`);
    this.applyFilters();
  }

  /**
   * Aplicar filtro rápido predefinido
   */
  applyQuickFilter(type: 'amnistia-success' | 'ec-only' | 'ics-only' | 'errors-today' | 'user-specific', value?: string) {
    let newFilter: Partial<LogsFilter> = {};
    
    switch (type) {
      case 'amnistia-success':
        newFilter = {
          consultaSubtype: 'amnistia',
          resultado: 'SUCCESS'
        };
        break;
      case 'ec-only':
        newFilter = {
          consultaType: 'EC'
        };
        break;
      case 'ics-only':
        newFilter = {
          consultaType: 'ICS'
        };
        break;
      case 'errors-today':
        newFilter = {
          resultado: 'ERROR',
          timeRange: 'day'
        };
        break;
      case 'user-specific':
        if (value) {
          newFilter = {
            username: value
          };
        }
        break;
    }
    
    this.currentFilter.update(filter => ({
      ...filter,
      ...newFilter,
      offset: 0
    }));
    
    this.currentPage.set(1);
    console.log(`⚡ Filtro rápido aplicado: ${type}`, newFilter);
    this.loadAllActivityLogs();
  }
}
