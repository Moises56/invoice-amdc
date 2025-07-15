import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonChip,
  IonIcon,
  IonButton,
  IonSkeletonText,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  mailOutline,
  keyOutline,
  businessOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  createOutline,
  keypadOutline,
  callOutline,
  cardOutline,
  briefcaseOutline, calendarOutline, refreshOutline, arrowBackOutline, alertCircleOutline } from 'ionicons/icons';

import { firstValueFrom } from 'rxjs';

import { UsuariosService } from '../usuarios.service';
import { User, Role } from '../../../shared/interfaces';

@Component({
  selector: 'app-usuario-detail',
  templateUrl: './usuario-detail.page.html',
  styleUrl: './usuario-detail.page.scss',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonChip,
    IonIcon,
    IonButton,
    IonSkeletonText
  ]
})
export class UsuarioDetailPage implements OnInit {
  private usuariosService = inject(UsuariosService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  // Signals
  user = signal<User | null>(null);
  isLoading = signal(true);
  userId = signal<string>('');

  constructor() {
    addIcons({createOutline,personOutline,mailOutline,callOutline,cardOutline,briefcaseOutline,businessOutline,keypadOutline,keyOutline,calendarOutline,refreshOutline,arrowBackOutline,alertCircleOutline,checkmarkCircleOutline,closeCircleOutline});
  }

  ngOnInit() {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (id) {
      this.userId.set(id);
      this.loadUser(id);
    } else {
      this.router.navigate(['/usuarios']);
    }
  }

  /**
   * Cargar datos del usuario
   */
  async loadUser(id: string) {
    this.isLoading.set(true);
    
    try {
      const userData = await firstValueFrom(this.usuariosService.getUserById(id));
      this.user.set(userData);
    } catch (error: any) {
      console.error('Error al cargar usuario:', error);
      await this.showToast('Error al cargar el usuario', 'danger');
      this.router.navigate(['/usuarios']);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Obtener texto del rol
   */
  getRoleText(role: Role): string {
    const roleTexts = {
      [Role.ADMIN]: 'Administrador',
      [Role.MARKET]: 'Gerente de Mercado',
      [Role.USER]: 'Usuario'
    };
    return roleTexts[role] || role;
  }

  /**
   * Obtener color del rol
   */
  getRoleColor(role: Role): string {
    const roleColors = {
      [Role.ADMIN]: 'danger',
      [Role.MARKET]: 'warning',
      [Role.USER]: 'primary'
    };
    return roleColors[role] || 'medium';
  }

  /**
   * Ir a editar usuario
   */
  editUser() {
    this.router.navigate(['/usuarios/editar', this.userId()]);
  }

  /**
   * Volver a la lista
   */
  goBack() {
    this.router.navigate(['/usuarios']);
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
}
