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
  IonMenuButton,
  IonButton, 
  IonIcon, 
  IonSearchbar,
  IonBadge,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonFab,
  IonFabButton,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonAvatar,
  IonAlert,
  IonToast,
  IonCheckbox,
  AlertController,
  ToastController,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  addOutline, 
  searchOutline,
  personOutline,
  peopleOutline,
  createOutline,
  trashOutline,
  keyOutline,
  refreshOutline,
  filterOutline,
  eyeOutline,
  ellipsisVerticalOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  shieldOutline,
  businessOutline,
  mailOutline,
  callOutline,
  cardOutline,
  timeOutline, 
  radioButtonOnOutline, 
  atOutline,
  statsChartOutline,
  toggleOutline,
  warningOutline, 
  downloadOutline, 
  closeOutline, 
  chevronUpOutline, 
  chevronDownOutline,
  checkmarkCircle,
  locationOutline
} from 'ionicons/icons';
import { UsuariosService } from '../usuarios.service';
import { User, Role } from '../../../shared/interfaces';
import { ViewEncapsulation } from '@angular/core';
import { UsuarioFormPage } from '../usuario-form/usuario-form.page';
import { ChangePasswordPage } from '../change-password/change-password.page';
import { AssignLocationModalComponent } from '../../../components/assign-location-modal/assign-location-modal.component';
import { LocationService } from '../../../shared/services/location.service';
import { UserLocation } from '../../../shared/interfaces/user.interface';
import { AuthService } from '../../../core/services/auth.service';

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
  isActive?: boolean;
  gerencia?: string;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: {
    [key in Role]: number;
  };
}

export interface SortConfig {
  field: 'name' | 'email' | 'role' | 'status' | 'lastLogin';
  direction: 'asc' | 'desc';
}

export interface BulkAction {
  type: 'activate' | 'deactivate' | 'export' | 'delete';
  userIds: string[];
}

@Component({
  selector: 'app-usuarios-list',
  templateUrl: './usuarios-list.page.html',
  styleUrls: ['./usuarios-list.page.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonButtons, 
    IonMenuButton,
    IonButton, 
    IonIcon, 
    IonSearchbar,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonFab,
    IonFabButton,
    IonSelect,
    IonSelectOption,
    IonItem,
    IonCheckbox
  ]
})
export class UsuariosListPage implements OnInit {
  private usuariosService = inject(UsuariosService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private modalController = inject(ModalController);
  private locationService = inject(LocationService);
  private authService = inject(AuthService);

  // Signals
  usuarios = signal<User[]>([]);
  loading = signal(false);
  searchTerm = signal('');
  currentPage = signal(1);
  totalPages = signal(0);
  totalItems = signal(0);
  selectedRole = signal<Role | ''>('');
  selectedStatus = signal<boolean | ''>('');
  selectedGerencia = signal('');
  userStats = signal<UserStats | null>(null);

  // Nuevas funcionalidades - Signals
  selectedUsers = signal<Set<string>>(new Set());
  selectAll = signal(false);
  currentSort = signal<SortConfig>({ field: 'name', direction: 'asc' });
  bulkActionsLoading = signal(false);
  userActionLoading = signal<Set<string>>(new Set());
  userLocations = signal<Map<string, UserLocation>>(new Map());

  // Computed properties
  filteredByRole = computed(() => {
    return (role: Role) => this.usuarios().filter(u => u.role === role);
  });

  filteredByStatus = computed(() => {
    return (isActive: boolean) => this.usuarios().filter(u => u.isActive === isActive);
  });

  availableGerencias = computed(() => {
    const gerencias = this.usuarios()
      .map(u => u.gerencia)
      .filter(g => g && g.trim())
      .filter((value, index, self) => self.indexOf(value) === index);
    return gerencias.sort();
  });

  // Métodos de utilidad para el template
  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  getFullName(user: User): string {
    if (user.nombre && user.apellido) {
      return `${user.nombre} ${user.apellido}`.trim();
    }
    return user.username || user.nombre || user.apellido || 'Usuario';
  }

  getAvatarInitials(user: User): string {
    return this.getInitials(this.getFullName(user));
  }

  getRoleText(role: Role): string {
    return this.getRoleDisplayName(role);
  }

  getUserStatus(user: User): { text: string; class: string } {
    return {
      text: user.isActive ? 'Activo' : 'Inactivo',
      class: user.isActive ? 'active' : 'inactive'
    };
  }

  formatLastLogin(date: Date | string | null | undefined): string {
    if (!date) return 'Nunca';
    
    let dateObj: Date;
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    if (isNaN(dateObj.getTime())) return 'Nunca';
    
    return dateObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  trackByUser(index: number, user: User): any {
    return user.id || user.username || index;
  }

  formatDate(dateInput: Date | string | null | undefined): string {
    if (!dateInput) return 'Nunca';
    
    let date: Date;
    if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      date = dateInput;
    }
    
    if (isNaN(date.getTime())) return 'Nunca';
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatDateTime(dateInput: Date | string | null | undefined): string {
    if (!dateInput) return 'Nunca';
    
    let date: Date;
    if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      date = dateInput;
    }
    
    if (isNaN(date.getTime())) return 'Nunca';
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRoleDisplayName(role: Role): string {
    const roleNames: Record<Role, string> = {
      [Role.ADMIN]: 'Administrador',
      [Role.MARKET]: 'Mercado',
      [Role.USER]: 'Usuario',
      [Role['USER-ADMIN']]: 'Super Usuario'
    };
    return roleNames[role] || role;
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Activo' : 'Inactivo';
  }

  // Funciones para estadísticas
  getActiveUsersCount(): number {
    return this.usuarios().filter(user => user.isActive).length;
  }

  getInactiveUsersCount(): number {
    return this.usuarios().filter(user => !user.isActive).length;
  }

  getAdminUsersCount(): number {
    return this.usuarios().filter(user => user.role === Role.ADMIN).length;
  }

  // Enum para el template
  Role = Role;

  constructor() {
    addIcons({
      addOutline,
      peopleOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      shieldOutline,
      refreshOutline,
      checkmarkCircle,
      downloadOutline,
      closeOutline,
      chevronUpOutline,
      chevronDownOutline,
      eyeOutline,
      createOutline,
      keyOutline,
      radioButtonOnOutline,
      mailOutline,
      callOutline,
      atOutline,
      cardOutline,
      businessOutline,
      personOutline,
      timeOutline,
      searchOutline,
      trashOutline,
      filterOutline,
      ellipsisVerticalOutline,
      statsChartOutline,
      toggleOutline,
      warningOutline,
      locationOutline
    });
  }

  ngOnInit() {
    this.loadUsuarios();
    this.loadUserStats();
  }

  /**
   * Cargar usuarios
   */
  async loadUsuarios(refresh = false): Promise<void> {
    this.loading.set(true);
    
    const params: UserFilters = {
      page: refresh ? 1 : this.currentPage(),
      limit: 12 // 4 cols x 3 rows o 1 col x 12 rows
    };
    
    if (this.searchTerm()) {
      params.search = this.searchTerm();
    }
    
    if (this.selectedRole()) {
      params.role = this.selectedRole() as Role;
    }
    
    if (this.selectedStatus() !== '') {
      params.isActive = this.selectedStatus() as boolean;
    }
    
    if (this.selectedGerencia()) {
      params.gerencia = this.selectedGerencia();
    }
    
    try {
      const response = await this.usuariosService.getUsers(
        params.page || 1,
        params.limit || 12,
        params
      ).toPromise();
      
      if (response) {
        this.usuarios.set(response.data);
        this.totalPages.set(response.pagination.total_pages);
        this.totalItems.set(response.pagination.total);
        this.currentPage.set(response.pagination.current_page);
        
        // Ya no necesitamos cargar ubicaciones por separado
        // porque vienen en la respuesta de la API users como campo 'ubicacion'
        console.log('✅ Usuarios cargados con ubicaciones incluidas');
      }
    } catch (error) {
      console.error('Error loading usuarios:', error);
      await this.showToast('Error al cargar usuarios', 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Cargar estadísticas de usuarios
   */
  async loadUserStats(): Promise<void> {
    try {
      const stats = await this.usuariosService.getUserStats().toPromise();
      this.userStats.set(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  }

  /**
   * Buscar usuarios
   */
  onSearch(event: any): void {
    this.searchTerm.set(event.target.value);
    this.currentPage.set(1);
    this.loadUsuarios(true);
  }

  /**
   * Filtrar por rol
   */
  onRoleChange(event: any): void {
    this.selectedRole.set(event.detail.value);
    this.currentPage.set(1);
    this.loadUsuarios(true);
  }

  /**
   * Filtrar por estado
   */
  onStatusChange(event: any): void {
    this.selectedStatus.set(event.detail.value);
    this.currentPage.set(1);
    this.loadUsuarios(true);
  }

  /**
   * Filtrar por gerencia
   */
  onGerenciaChange(event: any): void {
    this.selectedGerencia.set(event.detail.value);
    this.currentPage.set(1);
    this.loadUsuarios(true);
  }

  /**
   * Refrescar lista
   */
  async doRefresh(event: any): Promise<void> {
    await this.loadUsuarios(true);
    await this.loadUserStats();
    event.target.complete();
  }

  /**
   * Cargar más usuarios (infinite scroll)
   */
  async loadMore(event: any): Promise<void> {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(page => page + 1);
      
      const params: UserFilters = {
        page: this.currentPage(),
        limit: 12
      };
      
      if (this.searchTerm()) {
        params.search = this.searchTerm();
      }
      
      if (this.selectedRole()) {
        params.role = this.selectedRole() as Role;
      }
      
      if (this.selectedStatus() !== '') {
        params.isActive = this.selectedStatus() as boolean;
      }
      
      if (this.selectedGerencia()) {
        params.gerencia = this.selectedGerencia();
      }
      
      try {
        const response = await this.usuariosService.getUsers(
          params.page || 1,
          params.limit || 12,
          params
        ).toPromise();
        
        if (response) {
          // Append new data to existing
          const currentUsuarios = this.usuarios();
          this.usuarios.set([...currentUsuarios, ...response.data]);
          this.totalPages.set(response.pagination.total_pages);
        }
      } catch (error) {
        console.error('Error loading more usuarios:', error);
      }
    }
    
    event.target.complete();
  }

  /**
   * Ver detalle del usuario
   */
  viewUser(user: User): void {
    this.router.navigate(['/usuarios', user.id]);
  }

  /**
   * Crear nuevo usuario
   */
  async createUser(): Promise<void> {
    const modal = await this.modalController.create({
      component: UsuarioFormPage,
      componentProps: {
        isEdit: false
      }
    });

    modal.onDidDismiss().then((result) => {
      if (result.data?.success) {
        this.loadUsuarios(true);
        this.loadUserStats();
        this.showToast('Usuario creado correctamente', 'success');
      }
    });

    await modal.present();
  }

  /**
   * Editar usuario
   */
  async editUser(user: User): Promise<void> {
    const modal = await this.modalController.create({
      component: UsuarioFormPage,
      componentProps: {
        isEdit: true,
        user: user
      }
    });

    modal.onDidDismiss().then((result) => {
      if (result.data?.success) {
        this.loadUsuarios(true);
        this.loadUserStats();
        this.showToast('Usuario actualizado correctamente', 'success');
      }
    });

    await modal.present();
  }

  /**
   * Toggle estado del usuario (activar/desactivar)
   */
  async toggleUserStatus(user: User): Promise<void> {
    const newStatus = !user.isActive;
    const action = newStatus ? 'activar' : 'desactivar';
    
    const alert = await this.alertController.create({
      header: `${action.charAt(0).toUpperCase() + action.slice(1)} usuario`,
      message: `¿Estás seguro de ${action} al usuario ${this.getFullName(user)}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          handler: async () => {
            try {
              await this.usuariosService.toggleUserStatus(user.id, newStatus).toPromise();
              await this.showToast(`Usuario ${action === 'activar' ? 'activado' : 'desactivado'} correctamente`, 'success');
              await this.loadUsuarios(true);
              await this.loadUserStats();
            } catch (error) {
              await this.showToast(`Error al ${action} usuario`, 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Resetear contraseña
   */
  async resetPassword(user: User): Promise<void> {
    const modal = await this.modalController.create({
      component: ChangePasswordPage,
      componentProps: {
        user: user,
        isAdmin: true
      }
    });

    modal.onDidDismiss().then((result) => {
      if (result.data?.success) {
        this.showToast('Contraseña restablecida correctamente', 'success');
      }
    });

    await modal.present();
  }

  /**
   * Eliminar usuario
   */
  async deleteUser(user: User): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar usuario',
      message: `¿Estás seguro de eliminar al usuario ${this.getFullName(user)}? Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.usuariosService.deleteUser(user.id).toPromise();
              await this.showToast('Usuario eliminado correctamente', 'success');
              await this.loadUsuarios(true);
            } catch (error) {
              console.error('Error al eliminar usuario:', error);
              await this.showToast('Error al eliminar usuario', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  // =====================================
  // NUEVAS FUNCIONALIDADES - SELECCIÓN MÚLTIPLE Y ORDENAMIENTO
  // =====================================

  /**
   * Verificar si un usuario está seleccionado
   */
  isUserSelected(user: User): boolean {
    return this.selectedUsers().has(user.id);
  }

  /**
   * Alternar selección de usuario individual
   */
  toggleUserSelection(user: User, event: any): void {
    const selected = new Set(this.selectedUsers());
    
    if (event.detail.checked) {
      selected.add(user.id);
    } else {
      selected.delete(user.id);
    }
    
    this.selectedUsers.set(selected);
    this.updateSelectAllState();
  }

  /**
   * Seleccionar/deseleccionar todos los usuarios
   */
  toggleSelectAll(event: any): void {
    const selected = new Set<string>();
    
    if (event.detail.checked) {
      this.usuarios().forEach(user => selected.add(user.id));
    }
    
    this.selectedUsers.set(selected);
    this.selectAll.set(event.detail.checked);
  }

  /**
   * Verificar estado indeterminado del checkbox principal
   */
  isIndeterminate(): boolean {
    const selectedCount = this.selectedUsers().size;
    const totalCount = this.usuarios().length;
    return selectedCount > 0 && selectedCount < totalCount;
  }

  /**
   * Actualizar estado del checkbox "Seleccionar todo"
   */
  private updateSelectAllState(): void {
    const selectedCount = this.selectedUsers().size;
    const totalCount = this.usuarios().length;
    
    if (selectedCount === 0) {
      this.selectAll.set(false);
    } else if (selectedCount === totalCount) {
      this.selectAll.set(true);
    }
  }

  /**
   * Limpiar selección
   */
  clearSelection(): void {
    this.selectedUsers.set(new Set());
    this.selectAll.set(false);
  }

  /**
   * Manejar clic en fila (selección vs navegación)
   */
  onRowClick(user: User, event: MouseEvent): void {
    // Si no hay usuarios seleccionados, ir a vista de detalle
    if (this.selectedUsers().size === 0) {
      this.viewUser(user);
    } else {
      // Si hay selecciones activas, alternar selección
      const selected = new Set(this.selectedUsers());
      if (selected.has(user.id)) {
        selected.delete(user.id);
      } else {
        selected.add(user.id);
      }
      this.selectedUsers.set(selected);
      this.updateSelectAllState();
    }
  }

  /**
   * Ordenar por columna
   */
  sortBy(field: SortConfig['field']): void {
    const current = this.currentSort();
    let direction: 'asc' | 'desc' = 'asc';
    
    if (current.field === field) {
      direction = current.direction === 'asc' ? 'desc' : 'asc';
    }
    
    this.currentSort.set({ field, direction });
    this.applySorting();
  }

  /**
   * Aplicar ordenamiento a la lista de usuarios
   */
  private applySorting(): void {
    const { field, direction } = this.currentSort();
    const sorted = [...this.usuarios()].sort((a, b) => {
      let valueA: any;
      let valueB: any;
      
      switch (field) {
        case 'name':
          valueA = this.getFullName(a).toLowerCase();
          valueB = this.getFullName(b).toLowerCase();
          break;
        case 'email':
          valueA = (a.correo || a.email || '').toLowerCase();
          valueB = (b.correo || b.email || '').toLowerCase();
          break;
        case 'role':
          valueA = a.role;
          valueB = b.role;
          break;
        case 'status':
          valueA = a.isActive ? 1 : 0;
          valueB = b.isActive ? 1 : 0;
          break;
        case 'lastLogin':
          valueA = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
          valueB = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
          break;
        default:
          valueA = '';
          valueB = '';
      }
      
      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    this.usuarios.set(sorted);
  }

  // =====================================
  // ACCIONES EN LOTE
  // =====================================

  /**
   * Activar usuarios seleccionados
   */
  async bulkActivateUsers(): Promise<void> {
    if (this.selectedUsers().size === 0) return;
    
    const alert = await this.alertController.create({
      header: 'Activar usuarios',
      message: `¿Activar ${this.selectedUsers().size} usuario(s) seleccionado(s)?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Activar',
          handler: () => this.executeBulkAction('activate')
        }
      ]
    });
    
    await alert.present();
  }

  /**
   * Desactivar usuarios seleccionados
   */
  async bulkDeactivateUsers(): Promise<void> {
    if (this.selectedUsers().size === 0) return;
    
    const alert = await this.alertController.create({
      header: 'Desactivar usuarios',
      message: `¿Desactivar ${this.selectedUsers().size} usuario(s) seleccionado(s)?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Desactivar',
          handler: () => this.executeBulkAction('deactivate')
        }
      ]
    });
    
    await alert.present();
  }

  /**
   * Exportar usuarios seleccionados
   */
  async bulkExportUsers(): Promise<void> {
    if (this.selectedUsers().size === 0) return;
    
    try {
      this.bulkActionsLoading.set(true);
      const selectedUserData = this.usuarios().filter(user => 
        this.selectedUsers().has(user.id)
      );
      
      // Crear CSV
      const csvContent = this.createCSV(selectedUserData);
      this.downloadCSV(csvContent, `usuarios_seleccionados_${new Date().toISOString().split('T')[0]}.csv`);
      
      await this.showToast(`${selectedUserData.length} usuarios exportados correctamente`, 'success');
      this.clearSelection();
      
    } catch (error) {
      console.error('Error al exportar usuarios:', error);
      await this.showToast('Error al exportar usuarios', 'danger');
    } finally {
      this.bulkActionsLoading.set(false);
    }
  }

  /**
   * Ejecutar acción en lote
   */
  private async executeBulkAction(action: 'activate' | 'deactivate'): Promise<void> {
    try {
      this.bulkActionsLoading.set(true);
      const userIds = Array.from(this.selectedUsers());
      const isActive = action === 'activate';
      
      // Ejecutar acciones en paralelo con límite
      const promises = userIds.map(async (userId) => {
        try {
          await this.usuariosService.updateUserStatus(userId, isActive).toPromise();
          return { success: true, userId };
        } catch (error) {
          return { success: false, userId, error };
        }
      });
      
      const results = await Promise.all(promises);
      const successes = results.filter(r => r.success);
      const failures = results.filter(r => !r.success);
      
      if (successes.length > 0) {
        await this.showToast(
          `${successes.length} usuario(s) ${action === 'activate' ? 'activado(s)' : 'desactivado(s)'} correctamente`,
          'success'
        );
      }
      
      if (failures.length > 0) {
        await this.showToast(
          `Error al procesar ${failures.length} usuario(s)`,
          'warning'
        );
      }
      
      this.clearSelection();
      await this.loadUsuarios(true);
      
    } catch (error) {
      console.error('Error en acción en lote:', error);
      await this.showToast('Error al procesar la acción', 'danger');
    } finally {
      this.bulkActionsLoading.set(false);
    }
  }

  /**
   * Crear contenido CSV
   */
  private createCSV(users: User[]): string {
    const headers = ['Nombre', 'Usuario', 'Email', 'Teléfono', 'Rol', 'Estado', 'Último Acceso', 'Gerencia'];
    const rows = users.map(user => [
      this.getFullName(user),
      user.username,
      user.correo || user.email || '',
      user.telefono || user.phone || '',
      this.getRoleDisplayName(user.role),
      user.isActive ? 'Activo' : 'Inactivo',
      this.formatLastLogin(user.lastLogin),
      user.gerencia || ''
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  /**
   * Descargar archivo CSV
   */
  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Limpiar filtros
   */
  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedRole.set('');
    this.selectedStatus.set('');
    this.selectedGerencia.set('');
    this.currentPage.set(1);
    this.loadUsuarios(true);
  }

  /**
   * Mostrar toast
   */
  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  /**
   * Verificar si el usuario actual es ADMIN
   */
  isAdmin(): boolean {
    return this.authService.hasAnyRole(['ADMIN']);
  }

  /**
   * Obtener ubicación de un usuario - actualizado para usar campo ubicacion de la API
   */
  getUserLocation(userId: string): string | null {
    const user = this.usuarios().find(u => u.id === userId);
    return user?.ubicacion || null;
  }

  /**
   * Formatear ubicación para mostrar - actualizado para usar campo ubicacion
   */
  formatUserLocation(userId: string): string {
    const user = this.usuarios().find(u => u.id === userId);
    return user?.ubicacion || 'Sin ubicación';
  }

  /**
   * Abrir modal para asignar ubicación
   */
  async assignLocation(user: User): Promise<void> {
    if (!this.isAdmin()) {
      await this.showToast('No tienes permisos para asignar ubicaciones', 'danger');
      return;
    }

    const modal = await this.modalController.create({
      component: AssignLocationModalComponent,
      componentProps: {
        preselectedUser: user
      },
      breakpoints: [0, 0.5, 0.8, 1],
      initialBreakpoint: 0.8
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      // Recargar la lista de usuarios para reflejar la ubicación actualizada
      await this.loadUsuarios(true);
      await this.showToast(`Ubicación "${data.locationName}" asignada exitosamente a ${user.nombre}`, 'success');
    }
  }
}
