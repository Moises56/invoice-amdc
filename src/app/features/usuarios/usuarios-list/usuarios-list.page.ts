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
  IonAvatar,
  IonChip,
  IonBadge,
  IonFab,
  IonFabButton,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
  IonMenuButton,
  IonSkeletonText,
  IonAlert,
  IonToast,
  IonActionSheet,
  AlertController,
  ToastController,
  ActionSheetController,
  InfiniteScrollCustomEvent,
  RefresherCustomEvent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  searchOutline,
  filterOutline,
  personOutline,
  createOutline,
  trashOutline,
  keyOutline,
  ellipsisVerticalOutline,
  refreshOutline, peopleOutline } from 'ionicons/icons';

import { UsuariosService } from '../usuarios.service';
import { User, Role } from '../../../shared/interfaces';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
  selector: 'app-usuarios-list',
  templateUrl: './usuarios-list.page.html',
  styleUrls: ['./usuarios-list.page.scss'],
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
    IonAvatar,
    IonChip,
    IonBadge,
    IonFab,
    IonFabButton,
    IonInfiniteScroll,
    IonInfiniteScrollContent,    IonRefresher,
    IonRefresherContent,
    IonMenuButton,
    IonSkeletonText
  ]
})
export class UsuariosListPage implements OnInit {
  private usuariosService = inject(UsuariosService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private actionSheetController = inject(ActionSheetController);

  // Signals
  usuarios = signal<User[]>([]);
  loading = signal(false);
  searchText = signal('');
  currentPage = signal(1);
  totalPages = signal(1);
  isInfiniteDisabled = signal(false);
  // Computed
  filteredUsuarios = computed(() => {
    const search = this.searchText().toLowerCase();
    if (!search) return this.usuarios();
    
    return this.usuarios().filter(user => 
      (user.name || user.nombre || '').toLowerCase().includes(search) ||
      (user.email || user.correo || '').toLowerCase().includes(search) ||
      user.role.toLowerCase().includes(search)
    );
  });

  constructor() {
    addIcons({refreshOutline,personOutline,ellipsisVerticalOutline,peopleOutline,addOutline,searchOutline,filterOutline,createOutline,trashOutline,keyOutline});
  }

  ngOnInit() {
    this.loadUsuarios();
  }

  /**
   * Cargar usuarios
   */
  async loadUsuarios(refresh = false) {
    this.loading.set(true);
    
    try {
      const page = refresh ? 1 : this.currentPage();
      const response = await this.usuariosService.getUsers(page).toPromise();
      
      if (response) {
        if (refresh) {
          this.usuarios.set(response.data);
          this.currentPage.set(1);
        } else {
          this.usuarios.update(users => [...users, ...response.data]);
        }
          this.totalPages.set(response.pagination.total_pages);
        this.isInfiniteDisabled.set(this.currentPage() >= response.pagination.total_pages);
      }
    } catch (error) {
      await this.showToast('Error al cargar usuarios', 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Manejar búsqueda
   */
  onSearchChange(event: any) {
    this.searchText.set(event.detail.value);
  }

  /**
   * Refrescar datos
   */
  async onRefresh(event: RefresherCustomEvent) {
    await this.loadUsuarios(true);
    event.target.complete();
  }

  /**
   * Cargar más datos (infinite scroll)
   */
  async onLoadMore(event: InfiniteScrollCustomEvent) {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(page => page + 1);
      await this.loadUsuarios();
    }
    event.target.complete();
  }

  /**
   * Ir a crear usuario
   */
  goToCreate() {
    this.router.navigate(['/usuarios/nuevo']);
  }

  /**
   * Ir a editar usuario
   */
  goToEdit(user: User) {
    this.router.navigate(['/usuarios/editar', user.id]);
  }

  /**
   * Mostrar opciones de usuario
   */
  async showUserOptions(user: User) {
    const actionSheet = await this.actionSheetController.create({
      header: `${user.name}`,
      buttons: [
        {
          text: 'Editar',
          icon: 'create-outline',
          handler: () => this.goToEdit(user)
        },
        {
          text: user.isActive ? 'Desactivar' : 'Activar',
          icon: user.isActive ? 'lock-closed-outline' : 'lock-open-outline',
          handler: () => this.toggleUserStatus(user)
        },
        {
          text: 'Resetear Contraseña',
          icon: 'key-outline',
          handler: () => this.resetPassword(user)
        },
        {
          text: 'Eliminar',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => this.confirmDelete(user)
        },
        {
          text: 'Cancelar',
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  /**
   * Cambiar estado del usuario
   */
  async toggleUserStatus(user: User) {
    try {
      await this.usuariosService.toggleUserStatus(user.id, !user.isActive).toPromise();
      await this.showToast(
        `Usuario ${user.isActive ? 'desactivado' : 'activado'} correctamente`,
        'success'
      );
      this.loadUsuarios(true);
    } catch (error) {
      await this.showToast('Error al cambiar estado del usuario', 'danger');
    }
  }

  /**
   * Resetear contraseña
   */
  async resetPassword(user: User) {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: `¿Está seguro de resetear la contraseña de ${user.name}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Resetear',
          handler: async () => {
            try {
              const response = await this.usuariosService.resetPassword(user.id).toPromise();
              
              const successAlert = await this.alertController.create({
                header: 'Contraseña Reseteada',
                message: `Nueva contraseña temporal: ${response?.tempPassword}`,
                buttons: ['OK']
              });
              
              await successAlert.present();
            } catch (error) {
              await this.showToast('Error al resetear contraseña', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Confirmar eliminación
   */
  async confirmDelete(user: User) {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Está seguro de eliminar a ${user.name}? Esta acción no se puede deshacer.`,
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
              this.loadUsuarios(true);
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
   * Mostrar toast
   */
  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  /**
   * Obtener color del chip por rol
   */
  getRoleColor(role: Role): string {
    const colors: Record<Role, string> = {
      [Role.ADMIN]: 'danger',
      [Role.MARKET]: 'primary',
      [Role.USER]: 'secondary',
      [Role.AUDITOR]: 'warning'
    };
    return colors[role] || 'medium';
  }
  /**
   * Obtener texto del rol
   */
  getRoleText(role: Role): string {
    const texts: Record<Role, string> = {
      [Role.ADMIN]: 'Administrador',
      [Role.MARKET]: 'Mercado',
      [Role.USER]: 'Usuario',
      [Role.AUDITOR]: 'Auditor'
    };
    return texts[role] || role;
  }

  /**
   * Track by function para optimizar la lista
   */
  trackByUserId(index: number, user: User): string {
    return user.id;
  }
}
