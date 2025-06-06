import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,  IonTextarea,
  IonAvatar,
  IonChip,
  IonBackButton,
  IonSpinner,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline,
  personOutline,
  mailOutline,
  phonePortraitOutline,
  locationOutline,
  keyOutline,
  arrowBackOutline
} from 'ionicons/icons';

import { AuthService } from '../../core/services/auth.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { User } from '../../core/interfaces';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,    IonInput,
    IonTextarea,
    IonAvatar,
    IonChip,
    IonBackButton,
    IonSpinner
  ]
})
export class ProfilePage implements OnInit {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private usuariosService = inject(UsuariosService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  // Signals
  isLoading = signal(false);
  currentUser = signal<User | null>(null);

  profileForm: FormGroup;
  passwordForm: FormGroup;

  constructor() {
    addIcons({
      saveOutline,
      personOutline,
      mailOutline,
      phonePortraitOutline,
      locationOutline,
      keyOutline,
      arrowBackOutline
    });

    this.profileForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: ['']
    });    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.loadProfile();
  }

  /**
   * Cargar perfil del usuario
   */
  async loadProfile() {
    this.isLoading.set(true);
    
    try {
      const user = this.authService.user();
      if (user) {
        this.currentUser.set(user);
        this.profileForm.patchValue({
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          address: user.address || ''
        });
      }
    } catch (error) {
      await this.showToast('Error al cargar perfil', 'danger');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Actualizar perfil
   */
  async updateProfile() {
    if (this.profileForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Actualizando perfil...'
      });
      await loading.present();

      try {
        const user = this.currentUser();
        if (!user) return;

        const formData = this.profileForm.value;
        await this.usuariosService.updateUser(user.id, formData).toPromise();
          // Actualizar el usuario en el servicio de auth
        // Reload user data from service
        
        await this.showToast('Perfil actualizado correctamente', 'success');
      } catch (error: any) {
        const message = error?.error?.message || 'Error al actualizar perfil';
        await this.showToast(message, 'danger');
      } finally {
        await loading.dismiss();
      }
    } else {
      await this.showToast('Por favor, complete todos los campos requeridos', 'warning');
      this.markFormGroupTouched(this.profileForm);
    }
  }

  /**
   * Cambiar contraseña
   */
  async changePassword() {
    if (this.passwordForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Cambiando contraseña...'
      });
      await loading.present();

      try {
        const user = this.currentUser();
        if (!user) return;

        const { newPassword } = this.passwordForm.value;
        await this.usuariosService.changePassword(user.id, newPassword).toPromise();
        
        this.passwordForm.reset();
        await this.showToast('Contraseña cambiada correctamente', 'success');
      } catch (error: any) {
        const message = error?.error?.message || 'Error al cambiar contraseña';
        await this.showToast(message, 'danger');
      } finally {
        await loading.dismiss();
      }
    } else {
      await this.showToast('Por favor, complete todos los campos requeridos', 'warning');
      this.markFormGroupTouched(this.passwordForm);
    }
  }

  /**
   * Validador para confirmar password
   */
  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword?.value && confirmPassword?.value && newPassword.value !== confirmPassword.value) {
      confirmPassword?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.errors?.['passwordMismatch']) {
      const errors = { ...confirmPassword.errors };
      delete errors['passwordMismatch'];
      confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
    }
    
    return null;
  }

  /**
   * Marcar todos los campos como tocados
   */
  markFormGroupTouched(form: FormGroup) {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Verificar si un campo tiene errores
   */
  hasError(form: FormGroup, fieldName: string, errorType?: string): boolean {
    const field = form.get(fieldName);
    if (!field) return false;
    
    if (errorType) {
      return field.hasError(errorType) && field.touched;
    }
    
    return field.invalid && field.touched;
  }

  /**
   * Obtener mensaje de error para un campo
   */
  getErrorMessage(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    const errors = field.errors;
    
    if (errors['required']) return 'Este campo es requerido';
    if (errors['email']) return 'Ingrese un email válido';
    if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['passwordMismatch']) return 'Las contraseñas no coinciden';
    
    return 'Campo inválido';
  }

  /**
   * Volver al dashboard
   */
  goBack() {
    this.router.navigate(['/dashboard']);
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
   * Obtener iniciales del nombre
   */
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
