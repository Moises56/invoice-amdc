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
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonBadge,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonGrid,
  IonRow,
  IonCol,
  IonFab,
  IonFabButton,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonAvatar,
  IonAlert,
  IonToast,
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
  warningOutline
} from 'ionicons/icons';
import { UsuariosService } from '../usuarios.service';
import { User, Role } from '../../../shared/interfaces';
import { ViewEncapsulation } from '@angular/core';
import { UsuarioFormPage } from '../usuario-form/usuario-form.page';
import { ChangePasswordPage } from '../change-password/change-password.page';

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
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonGrid,
    IonRow,
    IonCol,
    IonFab,
    IonFabButton,
    IonSelect,
    IonSelectOption,
    IonItem
  ]
})
export class UsuariosListPage implements OnInit {
  private usuariosService = inject(UsuariosService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private modalController = inject(ModalController);

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

  // Enum para el template
  Role = Role;

  constructor() {
    addIcons({
      radioButtonOnOutline,
      mailOutline,
      callOutline,
      atOutline,
      addOutline,
      peopleOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      shieldOutline,
      refreshOutline,
      cardOutline,
      businessOutline,
      personOutline,
      timeOutline,
      eyeOutline,
      createOutline,
      searchOutline,
      trashOutline,
      keyOutline,
      filterOutline,
      ellipsisVerticalOutline,
      statsChartOutline,
      toggleOutline,
      warningOutline
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
              await this.showToast('Error al eliminar usuario', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
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

  // Helper methods delegated to service
  getAvatarInitials(user: User): string {
    return this.usuariosService.getAvatarInitials(user);
  }

  getFullName(user: User): string {
    return this.usuariosService.getFullName(user);
  }

  getRoleText(role: Role): string {
    return this.usuariosService.getRoleText(role);
  }

  getUserStatus(user: User): { text: string; color: string } {
    return this.usuariosService.getUserStatus(user);
  }

  formatLastLogin(date: Date | null | undefined): string {
    return this.usuariosService.formatLastLogin(date);
  }

  trackByUser(index: number, user: User): string {
    return user.id;
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
}
