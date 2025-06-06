import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonChip,
  IonBadge,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonPopover,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
  IonMenuButton,
  IonSkeletonText,
  IonToast,
  IonNote,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  RefresherCustomEvent,
  InfiniteScrollCustomEvent,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  searchOutline,
  filterOutline,
  eyeOutline,
  downloadOutline,
  calendarOutline,
  personOutline,
  timeOutline,
  documentTextOutline,
  refreshOutline,
  closeOutline
} from 'ionicons/icons';
import { AuditService, AuditFilters } from '../audit.service';
import { AuditLog } from '../../../shared/interfaces';

@Component({
  selector: 'app-audit-list',
  templateUrl: './audit-list.page.html',
  styleUrls: ['./audit-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonChip,
    IonBadge,
    IonSelect,
    IonSelectOption,
    IonDatetime,
    IonPopover,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonRefresher,
    IonRefresherContent,
    IonMenuButton,
    IonSkeletonText,
    IonToast,
    IonNote,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonGrid,
    IonRow,
    IonCol
  ]
})
export class AuditListPage implements OnInit {
  private auditService = inject(AuditService);
  private router = inject(Router);
  private toastController = inject(ToastController);

  // Signals
  auditLogs = signal<AuditLog[]>([]);
  loading = signal(false);
  searchText = signal('');
  currentPage = signal(1);
  totalPages = signal(1);
  isInfiniteDisabled = signal(false);
  showFilters = signal(false);
  
  // Filter signals
  selectedAction = signal<string>('');
  selectedTable = signal<string>('');
  selectedUser = signal<string>('');
  startDate = signal<string>('');
  endDate = signal<string>('');
  
  // Filter options
  availableActions = signal<string[]>([]);
  availableTables = signal<string[]>([]);
  
  // Toast
  isToastOpen = signal(false);
  toastMessage = signal('');
  toastColor = signal('');

  // Computed
  filteredAuditLogs = computed(() => {
    const search = this.searchText().toLowerCase();
    if (!search) return this.auditLogs();
    
    return this.auditLogs().filter(log => 
      log.accion.toLowerCase().includes(search) ||
      log.tabla.toLowerCase().includes(search) ||
      log.user?.nombre?.toLowerCase().includes(search) ||
      log.user?.apellido?.toLowerCase().includes(search) ||
      log.user?.correo?.toLowerCase().includes(search)
    );
  });

  hasActiveFilters = computed(() => {
    return this.selectedAction() || 
           this.selectedTable() || 
           this.selectedUser() || 
           this.startDate() || 
           this.endDate();
  });

  constructor() {
    addIcons({
      searchOutline,
      filterOutline,
      eyeOutline,
      downloadOutline,
      calendarOutline,
      personOutline,
      timeOutline,
      documentTextOutline,
      refreshOutline,
      closeOutline
    });
  }

  ngOnInit() {
    this.loadAuditLogs();
    this.loadFilterOptions();
  }

  /**
   * Cargar logs de auditoría
   */
  async loadAuditLogs(refresh = false) {
    this.loading.set(true);
    
    try {
      const page = refresh ? 1 : this.currentPage();
      const filters: AuditFilters = {
        page,
        search: this.searchText() || undefined,
        accion: this.selectedAction() || undefined,
        tabla: this.selectedTable() || undefined,
        userId: this.selectedUser() || undefined,
        startDate: this.startDate() || undefined,
        endDate: this.endDate() || undefined
      };

      const response = await this.auditService.getAuditLogs(filters).toPromise();
      
      if (response) {
        if (refresh) {
          this.auditLogs.set(response.data);
          this.currentPage.set(1);
        } else {
          this.auditLogs.update(logs => [...logs, ...response.data]);
        }
        
        this.totalPages.set(response.pagination.total_pages);
        this.isInfiniteDisabled.set(this.currentPage() >= response.pagination.total_pages);
      }
    } catch (error) {
      await this.showToast('Error al cargar logs de auditoría', 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Cargar opciones para filtros
   */
  async loadFilterOptions() {
    try {
      const [actions, tables] = await Promise.all([
        this.auditService.getUniqueActions().toPromise(),
        this.auditService.getUniqueTables().toPromise()
      ]);

      if (actions) this.availableActions.set(actions);
      if (tables) this.availableTables.set(tables);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  }

  /**
   * Manejar búsqueda
   */
  onSearchChange(event: any) {
    this.searchText.set(event.detail.value);
    this.currentPage.set(1);
    this.loadAuditLogs(true);
  }

  /**
   * Aplicar filtros
   */
  applyFilters() {
    this.currentPage.set(1);
    this.loadAuditLogs(true);
    this.showFilters.set(false);
    this.showToast('Filtros aplicados', 'success');
  }

  /**
   * Limpiar filtros
   */
  clearFilters() {
    this.selectedAction.set('');
    this.selectedTable.set('');
    this.selectedUser.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.currentPage.set(1);
    this.loadAuditLogs(true);
    this.showFilters.set(false);
    this.showToast('Filtros limpiados', 'success');
  }

  /**
   * Refrescar datos
   */
  async onRefresh(event: RefresherCustomEvent) {
    await this.loadAuditLogs(true);
    event.target.complete();
  }

  /**
   * Cargar más datos (infinite scroll)
   */
  async onLoadMore(event: InfiniteScrollCustomEvent) {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(page => page + 1);
      await this.loadAuditLogs();
    }
    event.target.complete();
  }

  /**
   * Ver detalles del log
   */
  viewDetails(log: AuditLog) {
    this.router.navigate(['/audit/detail', log.id]);
  }

  /**
   * Exportar logs
   */
  async exportLogs() {
    try {
      this.loading.set(true);
      
      const filters: AuditFilters = {
        search: this.searchText() || undefined,
        accion: this.selectedAction() || undefined,
        tabla: this.selectedTable() || undefined,
        userId: this.selectedUser() || undefined,
        startDate: this.startDate() || undefined,
        endDate: this.endDate() || undefined
      };

      const blob = await this.auditService.exportAuditLogs(filters).toPromise();
      
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-logs-${new Date().getTime()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.showToast('Logs exportados correctamente', 'success');
      }
    } catch (error) {
      this.showToast('Error al exportar logs', 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Mostrar toast
   */
  async showToast(message: string, color: string) {
    this.toastMessage.set(message);
    this.toastColor.set(color);
    this.isToastOpen.set(true);
  }

  /**
   * Obtener color del chip por acción
   */
  getActionColor(action: string): string {
    const colors: Record<string, string> = {
      'CREATE': 'success',
      'UPDATE': 'warning',
      'DELETE': 'danger',
      'LOGIN': 'primary',
      'LOGOUT': 'medium'
    };
    return colors[action.toUpperCase()] || 'medium';
  }

  /**
   * Obtener ícono por acción
   */
  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      'CREATE': 'add-circle-outline',
      'UPDATE': 'create-outline',
      'DELETE': 'trash-outline',
      'LOGIN': 'log-in-outline',
      'LOGOUT': 'log-out-outline'
    };
    return icons[action.toUpperCase()] || 'document-text-outline';
  }
  /**
   * Formatear fecha
   */
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  /**
   * Obtener fecha de inicio formateada
   */
  getFormattedStartDate(): string {
    const date = this.startDate();
    if (!date) return '';
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(date));
  }

  /**
   * Obtener fecha de fin formateada
   */
  getFormattedEndDate(): string {
    const date = this.endDate();
    if (!date) return '';
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(date));
  }

  /**
   * Track by function para optimizar el renderizado
   */
  trackByFn(index: number, item: AuditLog): string {
    return item.id;
  }
}
