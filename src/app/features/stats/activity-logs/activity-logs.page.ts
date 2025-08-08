import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
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
  InfiniteScrollCustomEvent
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
  helpOutline, chevronBackOutline, chevronForwardOutline, analytics } from 'ionicons/icons';

import { StatsService } from '../../../shared/services/stats.service';
import { LocationService } from '../../../shared/services/location.service';
import { AuthService } from '../../../core/services/auth.service';
import { 
  ActivityLog, 
  ActivityLogResponse,
  LogsFilter,
  UserLocation,
  LocationStatsResponse 
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
    IonSearchbar
  ]
})
export class ActivityLogsPage implements OnInit {
  private statsService = inject(StatsService);
  private locationService = inject(LocationService);
  private router = inject(Router);
  private loadingController = inject(LoadingController);
  private toastController = inject(ToastController);
  private authService = inject(AuthService);

  // Signals
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

  // Filtros
  currentFilter = signal<LogsFilter>({
    page: 1,
    per_page: 20
  });
  isFilterModalOpen = signal<boolean>(false);

  // Computed
  filteredLogs = computed(() => {
    const logs = this.activityLogs();
    const search = this.searchTerm().toLowerCase().trim();
    
    if (!search) return logs;
    
    return logs.filter(log => 
      log.consultaType.toLowerCase().includes(search) ||
      log.consultaSubtype.toLowerCase().includes(search) ||
      log.resultado.toLowerCase().includes(search) ||
      log.username?.toLowerCase().includes(search) ||
      log.userLocation?.toLowerCase().includes(search)
    );
  });

  constructor() {
    addIcons({analytics,refreshOutline,warningOutline,chevronBackOutline,chevronForwardOutline,documentOutline,documentTextOutline,filterOutline,listOutline,bugOutline,close,timeOutline,businessOutline,checkmarkOutline,personOutline,arrowBackOutline,searchOutline,eyeOutline,settingsOutline,calendarOutline,logInOutline,logOutOutline,informationCircleOutline,helpOutline});
    
    // Efecto para actualizar paginación cuando cambien los logs filtrados
    effect(() => {
      this.filteredLogs(); // Trigger computation
      this.updateTotalPages();
      // Reset to first page when filters change
      if (this.currentPage() > this.totalPages()) {
        this.currentPage.set(1);
      }
    });
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
    return this.authService.hasAnyRole(['USER-ADMIN']);
  }

  /**
   * Cargar logs de actividad
   */
  async loadActivityLogs(loadMore: boolean = false) {
    // Verificar autenticación y permisos
    if (!this.authService.isAuthenticated()) {
      console.error('❌ Usuario no autenticado');
      this.hasError.set(true);
      this.errorMessage.set('Usuario no autenticado');
      return;
    }

    if (!this.canAccessGeneralStats()) {
      console.error('❌ Usuario sin permisos para logs');
      this.hasError.set(true);
      this.errorMessage.set('No tienes permisos para ver los logs de actividad. Se requiere rol USER-ADMIN.');
      return;
    }

    if (loadMore) {
      this.isLoadingMore.set(true);
    } else {
      this.isLoading.set(true);
      this.currentPage.set(1);
      this.hasError.set(false);
      this.errorMessage.set('');
    }
    
    try {
      const filter = {
        ...this.currentFilter(),
        page: loadMore ? this.currentPage() + 1 : 1
      };

      console.log('🔄 Cargando logs de actividad...', { filter, loadMore });
      console.log('🔧 StatsService disponible:', !!this.statsService);
      console.log('🔧 Método getActivityLogs disponible:', typeof this.statsService.getActivityLogs);
      
      const response = await this.statsService.getActivityLogs(filter).toPromise();
      
      console.log('📊 Respuesta del servidor (logs):', response);
      console.log('📊 Tipo de respuesta:', typeof response);
      
      // El backend devuelve la estructura { logs: [...], total: number }
      if (response && response.logs && Array.isArray(response.logs)) {
        const logs = response.logs;
        
        if (loadMore) {
          // Agregar nuevos logs a la lista existente
          this.activityLogs.update(currentLogs => [...currentLogs, ...logs]);
          this.currentPage.update(page => page + 1);
        } else {
          // Reemplazar lista completa
          this.activityLogs.set(logs);
          this.currentPage.set(1);
        }

        // Calcular si hay más datos basado en el total del servidor
        const totalLoaded = loadMore ? this.activityLogs().length : logs.length;
        this.hasMoreData.set(totalLoaded < response.total);
        
        console.log('✅ Logs cargados exitosamente:', logs.length, 'registros,', 'total en servidor:', response.total);
      } else {
        console.warn('⚠️ Respuesta sin datos válidos:', response);
        this.hasError.set(true);
        this.errorMessage.set('No se pudieron obtener los logs de actividad - respuesta inválida');
      }
    } catch (error: any) {
      console.error('❌ Error al cargar logs de actividad:', error);
      console.error('❌ Error completo:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        error: error.error
      });
      
      this.hasError.set(true);
      
      // Mensaje de error más específico
      if (error.status === 403) {
        this.errorMessage.set('No tienes permisos para ver los logs de actividad');
      } else if (error.status === 404) {
        this.errorMessage.set('Endpoint de logs no encontrado');
      } else if (error.status === 0) {
        this.errorMessage.set('No se puede conectar con el servidor');
      } else {
        this.errorMessage.set(`Error del servidor: ${error.status || 'Desconocido'} - ${error.message || error.statusText || 'Sin detalles'}`);
      }
    } finally {
      this.isLoading.set(false);
      this.isLoadingMore.set(false);
    }
  }

  /**
   * Refrescar logs
   */
  async refreshLogs(event?: any) {
    await this.loadActivityLogs(false);
    
    if (event) {
      event.target.complete();
    }
  }

  /**
   * Cargar más logs (infinite scroll)
   */
  async loadMoreLogs(event: InfiniteScrollCustomEvent) {
    if (this.hasMoreData() && !this.isLoadingMore()) {
      await this.loadActivityLogs(true);
    }
    
    event.target.complete();
  }

  /**
   * Aplicar filtros
   */
  async applyFilters() {
    this.currentFilter.update(filter => ({
      ...filter,
      page: 1
    }));
    
    this.isFilterModalOpen.set(false);
    await this.loadActivityLogs(false);
  }

  /**
   * Limpiar filtros
   */
  async clearFilters() {
    this.currentFilter.set({
      page: 1,
      per_page: 20,
      fechaInicio: undefined,
      fechaFin: undefined,
      ubicacion: undefined
    });
    await this.loadActivityLogs(false);
  }

  /**
   * Manejar búsqueda
   */
  onSearchChange(event: any) {
    this.searchTerm.set(event.detail.value || '');
  }

  /**
   * Obtener color del módulo
   */
  getModuleColor(modulo: string): string {
    const colors: { [key: string]: string } = {
      'ics': 'warning',
      'amnistia': 'success',
      'ec': 'primary',
      'login': 'secondary',
      'logout': 'medium'
    };
    return colors[modulo] || 'medium';
  }

  /**
   * Obtener nombre del módulo/tipo de consulta
   */
  getModuleName(consultaType: string): string {
    const names: { [key: string]: string } = {
      'ICS': 'ICS',
      'EC': 'Estado de Cuenta'
    };
    return names[consultaType] || consultaType;
  }

  /**
   * Obtener color del resultado
   */
  getActionColor(resultado: string): string {
    switch (resultado) {
      case 'SUCCESS': return 'success';
      case 'ERROR': return 'danger';
      case 'NOT_FOUND': return 'warning';
      default: return 'medium';
    }
  }

  /**
   * Obtener icono del tipo de consulta
   */
  getActionIcon(consultaType: string): string {
    switch (consultaType) {
      case 'ICS': return 'search-outline';
      case 'EC': return 'document-text-outline';
      default: return 'information-circle-outline';
    }
  }

  /**
   * Formatear fecha
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtener tiempo relativo
   */
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `Hace ${diffMinutes}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString();
  }

  /**
   * Obtener iniciales del usuario
   */
  getUserInitials(log: ActivityLog): string {
    if (!log.username) return '?';
    
    // Si el username contiene espacios, usar las primeras letras de cada palabra
    const parts = log.username.split(' ');
    if (parts.length > 1) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    
    // Si no tiene espacios, usar las primeras dos letras
    return log.username.substring(0, 2).toUpperCase();
  }

  /**
   * Obtener nombre completo del usuario
   */
  getUserFullName(log: ActivityLog): string {
    return log.username || 'Usuario desconocido';
  }

  /**
   * Track by function para ngFor
   */
  trackByLogId(index: number, log: ActivityLog): string {
    return log.id;
  }

  /**
   * Volver al dashboard
   */
  goBack() {
    this.router.navigate(['/dashboard/user']);
  }

  /**
   * Método de prueba temporal para debugear
   */
  async testEndpoint() {
    console.log('🧪 Probando endpoint directamente...');
    try {
      // Probar con una simple consulta HTTP sin filtros
      const response = await this.statsService.getActivityLogs().toPromise();
      console.log('🧪 Respuesta de prueba:', response);
      console.log('🧪 Tipo:', typeof response);
      console.log('🧪 Es array:', Array.isArray(response));
      
      this.showToast('Endpoint funciona correctamente', 'success');
    } catch (error: any) {
      console.error('🧪 Error en prueba:', error);
      this.showToast(`Error: ${error.status} - ${error.message || error.statusText || 'Sin detalles'}`, 'danger');
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
   * Cargar ubicaciones disponibles para filtros
   */
  async loadAvailableLocations() {
    try {
      if (this.authService.hasAnyRole(['ADMIN'])) {
        const locations = await this.locationService.getAllLocations().toPromise();
        // Extraer solo los nombres de ubicaciones únicas
        const locationNames = locations?.map(loc => loc.locationName).filter((name, index, array) => 
          array.indexOf(name) === index
        ) || [];
        this.availableLocations.set(locationNames);
        console.log('📍 Ubicaciones cargadas para filtros:', locationNames.length);
      }
    } catch (error) {
      console.error('❌ Error cargando ubicaciones para filtros:', error);
    }
  }

  /**
   * Verificar si hay filtros aplicados
   */
  hasActiveFilters(): boolean {
    const filter = this.currentFilter();
    return !!(filter.fechaInicio || filter.fechaFin || filter.ubicacion);
  }

  // ===== NUEVOS MÉTODOS PARA TABLA Y PAGINACIÓN =====
  
  /**
   * Configuración de paginación
   */
  private readonly ITEMS_PER_PAGE = 10;

  /**
   * Logs paginados para la tabla
   */
  paginatedLogs = computed(() => {
    const logs = this.filteredLogs();
    const page = this.currentPage();
    const startIndex = (page - 1) * this.ITEMS_PER_PAGE;
    const endIndex = startIndex + this.ITEMS_PER_PAGE;
    
    return logs.slice(startIndex, endIndex);
  });

  /**
   * Total de registros
   */
  totalRecords = computed(() => this.filteredLogs().length);

  /**
   * Calcular total de páginas
   */
  totalPagesCalculated = computed(() => {
    const total = this.totalRecords();
    return Math.ceil(total / this.ITEMS_PER_PAGE);
  });

  /**
   * Actualizar total de páginas cuando cambien los datos
   */
  private updateTotalPages() {
    this.totalPages.set(this.totalPagesCalculated());
  }

  /**
   * Formatear parámetros para mostrar en tabla
   */
  formatParameters(log: ActivityLog): string {
    if (!log.parametros) return 'N/A';
    
    try {
      if (typeof log.parametros === 'string') {
        const params = JSON.parse(log.parametros);
        return Object.entries(params)
          .map(([key, value]) => `'${key}': '${value}'`)
          .join(', ');
      }
      return JSON.stringify(log.parametros);
    } catch {
      return log.parametros.toString();
    }
  }

  /**
   * Obtener clase CSS para el badge de resultado
   */
  getResultClass(resultado: string | undefined): string {
    const result = (resultado || '').toLowerCase();
    switch (result) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'unknown';
    }
  }

  /**
   * Ir a página específica
   */
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  /**
   * Obtener páginas visibles para paginación
   */
  getVisiblePages(): number[] {
    const current = this.currentPage();
    const total = this.totalPages();
    const pages: number[] = [];
    
    // Mostrar máximo 5 páginas
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);
    
    // Ajustar inicio si estamos cerca del final
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  /**
   * Verificar si mostrar puntos suspensivos en paginación
   */
  shouldShowEllipsis(): boolean {
    const total = this.totalPages();
    const current = this.currentPage();
    return total > 5 && current < total - 2;
  }

  /**
   * Obtener registro de inicio para mostrar
   */
  getStartRecord(): number {
    const page = this.currentPage();
    return (page - 1) * this.ITEMS_PER_PAGE + 1;
  }

  /**
   * Obtener registro final para mostrar
   */
  getEndRecord(): number {
    const page = this.currentPage();
    const total = this.totalRecords();
    const end = page * this.ITEMS_PER_PAGE;
    return Math.min(end, total);
  }
}
