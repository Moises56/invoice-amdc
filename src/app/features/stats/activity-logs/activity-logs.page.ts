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
  analytics, playSkipBackOutline, playSkipForwardOutline, arrowForwardOutline } from 'ionicons/icons';

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
    IonSearchbar,
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
  hasMoreData = signal<boolean>(true);
  searchTerm = signal<string>('');
  availableLocations = signal<string[]>([]);
  selectedLog = signal<ActivityLog | null>(null);
  isModalOpen = signal<boolean>(false);

  // Filtros
  currentFilter = signal<LogsFilter>({
    page: 1,
    per_page: 20,
    consulta: '',
    tipoConsulta: '',
    resultado: ''
  });
  isFilterModalOpen = signal<boolean>(false);

  // Computed para logs filtrados
  filteredLogs = computed(() => {
    const logs = this.activityLogs();
    const searchTerm = this.searchTerm().toLowerCase().trim();
    const filter = this.currentFilter();

    if (!searchTerm && !filter.consulta && !filter.tipoConsulta && !filter.resultado) {
      return logs;
    }

    return logs.filter(log => {
      // Filtro por término de búsqueda
      if (searchTerm) {
        const searchableText = [
          log.consultaType || '',
          log.consultaSubtype || '',
          log.resultado || '',
          log.parametros || '',
          log.userAgent || '',
          log.ip || ''
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Filtro por consulta
      if (filter.consulta && log.consultaType !== filter.consulta) {
        return false;
      }

      // Filtro por tipo de consulta
      if (filter.tipoConsulta && log.consultaSubtype !== filter.tipoConsulta) {
        return false;
      }

      // Filtro por resultado
      if (filter.resultado && log.resultado !== filter.resultado) {
        return false;
      }

      return true;
    });
  });

  constructor() {
    // Configurar iconos
    addIcons({
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
      analytics,
      playSkipBackOutline,
      playSkipForwardOutline,
      arrowForwardOutline
    });

    // Effect para actualizar páginas cuando cambian los logs filtrados
    effect(() => {
      const totalRecords = this.filteredLogs().length;
      if (totalRecords > 0) {
        const totalPages = Math.ceil(totalRecords / this.itemsPerPage);
        this.totalPages.set(totalPages);
        
        // Si la página actual es mayor que el total, resetear a la primera
        if (this.currentPage() > totalPages) {
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
    try {
      const logs = this.filteredLogs();
      
      if (logs.length === 0) {
        await this.showToast('No hay datos para exportar', 'warning');
        return;
      }

      // Preparar datos para Excel
      const excelData = logs.map(log => {
        const userInfo = this.parseUserAgent(log.userAgent);
        
        return {
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
          'Tipo Dispositivo': userInfo.type
        };
      });

      // Generar archivo Excel
      this.excelService.exportActivityLogsToExcel(
        logs,
        'logs-actividad'
      );

      await this.showToast('Archivo Excel generado exitosamente', 'success');
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      await this.showToast('Error al generar archivo Excel', 'danger');
    }
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
   * Cargar logs de actividad
   */
  async loadActivityLogs(loadMore: boolean = false) {
    if (!loadMore) {
      this.isLoading.set(true);
      this.hasError.set(false);
      this.errorMessage.set('');
    } else {
      this.isLoadingMore.set(true);
    }

    // Verificar autenticación
    if (!this.authService.isAuthenticated()) {
      this.hasError.set(true);
      this.errorMessage.set('Usuario no autenticado');
      this.isLoading.set(false);
      this.isLoadingMore.set(false);
      return;
    }

    // Verificar permisos
    if (!this.canAccessGeneralStats()) {
      this.hasError.set(true);
      this.errorMessage.set('No tienes permisos para ver los logs de actividad');
      this.isLoading.set(false);
      this.isLoadingMore.set(false);
      return;
    }

    try {
      // Cargar todos los registros haciendo múltiples peticiones si es necesario
      await this.loadAllActivityLogs();
      
    } catch (error: any) {
      console.error('❌ Error al cargar logs de actividad:', error);
      this.handleLoadError(error);
    } finally {
      this.isLoading.set(false);
      this.isLoadingMore.set(false);
    }
  }

  /**
   * Cargar todos los logs de actividad haciendo múltiples peticiones
   */
  private async loadAllActivityLogs() {
    let allLogs: ActivityLog[] = [];
    let currentPage = 1;
    let totalRecords = 0;
    let hasMorePages = true;

    while (hasMorePages) {
      const filter = {
        ...this.currentFilter(),
        page: currentPage,
        per_page: 100 // Usar un tamaño de página más pequeño pero confiable
      };

      console.log(`🔄 Cargando página ${currentPage}...`, filter);

      const response = await this.statsService.getActivityLogs(filter).toPromise();
      
      if (response && response.logs && Array.isArray(response.logs)) {
        allLogs = [...allLogs, ...response.logs];
        totalRecords = response.total || 0;
        
        console.log(`📊 Página ${currentPage} cargada: ${response.logs.length} registros`);
        
        // Verificar si hay más páginas
        hasMorePages = response.logs.length > 0 && allLogs.length < totalRecords;
        currentPage++;
        
        // Límite de seguridad para evitar bucles infinitos
        if (currentPage > 100) {
          console.warn('⚠️ Límite de páginas alcanzado, deteniendo carga');
          break;
        }
      } else {
        hasMorePages = false;
      }
    }

    // Establecer todos los logs cargados
    this.activityLogs.set(allLogs);
    this.currentPage.set(1);
    this.hasMoreData.set(false); // Ya tenemos todos los datos
    
    console.log(`✅ Carga completa: ${allLogs.length} de ${totalRecords} registros`);
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
      page: 1,
      per_page: 20,
      consulta: '',
      tipoConsulta: '',
      resultado: ''
    });
    this.searchTerm.set('');
    this.currentPage.set(1);
  }

  /**
   * Manejar cambio en búsqueda
   */
  onSearchChange(event: any) {
    this.searchTerm.set(event.target.value || '');
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

  /**
   * Verificar si hay filtros activos
   */
  hasActiveFilters(): boolean {
    const filter = this.currentFilter();
    return !!(filter.consulta || filter.tipoConsulta || filter.resultado || this.searchTerm());
  }

  // Computed properties para paginación
  paginatedLogs = computed(() => {
    const logs = this.filteredLogs();
    const page = this.currentPage();
    const itemsPerPage = this.itemsPerPage;
    
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return logs.slice(startIndex, endIndex);
  });

  totalRecords = computed(() => this.filteredLogs().length);

  /**
   * Calcular total de páginas basado en registros filtrados
   */
  totalPagesCalculated = computed(() => {
    const totalRecords = this.totalRecords();
    return totalRecords > 0 ? Math.ceil(totalRecords / this.itemsPerPage) : 1;
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
      const params = JSON.parse(log.parametros);
      return Object.entries(params)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    } catch {
      return log.parametros;
    }
  }

  /**
   * Formatear parámetros de forma legible
   */
  formatParametersFormatted(log: ActivityLog | null): string {
    if (!log?.parametros) return 'Sin parámetros';
    
    try {
      const params = JSON.parse(log.parametros);
      return Object.entries(params)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    } catch {
      return log.parametros;
    }
  }

  /**
   * Manejar cambios en los filtros
   */
  onFilterChange(filterType: string, event: any) {
    const value = event.target.value;
    const currentFilters = this.currentFilter();
    
    this.currentFilter.set({
      ...currentFilters,
      [filterType]: value || undefined
    });
  }

  /**
   * Limpiar todos los filtros
   */
  clearFilters() {
    this.currentFilter.set({});
    this.searchTerm.set('');
  }

  /**
   * Aplicar filtros (recarga los datos)
   */
  applyFilters() {
    this.loadActivityLogs();
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
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPagesCalculated()) {
      this.currentPage.set(page);
    }
  }

  onItemsPerPageChange(): void {
    this.currentPage.set(1); // Resetear a la primera página
  }

  jumpToPage(pageValue: string): void {
    const page = parseInt(pageValue, 10);
    if (!isNaN(page)) {
      this.goToPage(page);
    }
  }

  /**
   * Obtener páginas visibles para la paginación
   */
  getVisiblePages(): number[] {
    const total = this.totalPagesCalculated();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 5) {
      // Si hay 5 páginas o menos, mostrar todas
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para mostrar páginas con elipsis
      if (current <= 3) {
        // Mostrar las primeras 5 páginas
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (current >= total - 2) {
        // Mostrar las últimas 5 páginas
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        // Mostrar páginas alrededor de la actual
        for (let i = current - 2; i <= current + 2; i++) {
          pages.push(i);
        }
      }
    }

    return pages;
  }

  /**
   * Verificar si se debe mostrar elipsis
   */
  shouldShowEllipsis(): boolean {
    const total = this.totalPagesCalculated();
    const current = this.currentPage();
    return total > 5 && (current > 3 && current < total - 2);
  }

  /**
   * Obtener número del primer registro mostrado
   */
  getStartRecord(): number {
    const page = this.currentPage();
    const itemsPerPage = this.itemsPerPage;
    return (page - 1) * itemsPerPage + 1;
  }

  /**
   * Obtener número del último registro mostrado
   */
  getEndRecord(): number {
    const page = this.currentPage();
    const itemsPerPage = this.itemsPerPage;
    const totalRecords = this.totalRecords();
    const endRecord = page * itemsPerPage;
    return Math.min(endRecord, totalRecords);
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
}
