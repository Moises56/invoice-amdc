import { Component, inject, signal, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
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
  IonInput,
  IonSpinner,
  ToastController,
  LoadingController,
  ModalController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline,
  closeOutline,
  keyOutline,
  lockClosedOutline
} from 'ionicons/icons';

import { UsuariosService } from '../usuarios.service';
import { User } from '../../../shared/interfaces';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.page.html',
  styleUrls: ['./change-password.page.scss'],
  standalone: true,
  imports: [
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
    IonLabel,
    IonInput,
    IonSpinner
  ]
})
export class ChangePasswordPage implements OnInit {
  @Input() user?: User;
  @Input() isAdmin = false; // Si es admin cambiando password de otro usuario

  private formBuilder = inject(FormBuilder);
  private usuariosService = inject(UsuariosService);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private modalController = inject(ModalController);
  private alertController = inject(AlertController);

  // Signals
  isLoading = signal(false);

  form: FormGroup;

  constructor() {
    addIcons({
      saveOutline,
      closeOutline,
      keyOutline,
      lockClosedOutline
    });

    // Inicializar formulario sin validaciones específicas
    this.form = this.formBuilder.group({
      currentPassword: [''],
      newPassword: ['', [Validators.required, Validators.minLength(6), this.passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Configurar validaciones basadas en isAdmin después de que @Input() se haya asignado
    const currentPasswordControl = this.form.get('currentPassword');
    if (this.isAdmin) {
      currentPasswordControl?.clearValidators();
    } else {
      currentPasswordControl?.setValidators([Validators.required]);
    }
    currentPasswordControl?.updateValueAndValidity();
  }

  /**
   * Enviar formulario
   */
  async onSubmit() {
    // Marcar todos los campos como tocados para mostrar errores
    this.markFormGroupTouched();
    
    if (this.form.valid) {
      // Confirmación adicional para reset admin
      if (this.isAdmin && this.user) {
        const confirmed = await this.showAdminResetConfirmation();
        if (!confirmed) return;
      }

      const loading = await this.loadingController.create({
        message: this.isAdmin ? 'Restableciendo contraseña...' : 'Cambiando contraseña...'
      });
      await loading.present();

      try {
        const formData = this.form.value;
        
        if (this.isAdmin && this.user) {
          // Admin resetea contraseña de otro usuario - ENDPOINT CORREGIDO
          await firstValueFrom(this.usuariosService.changeUserPassword(this.user.id, formData.newPassword));
          await this.showToast(`Contraseña de ${this.user.nombre || this.user.username} restablecida correctamente`, 'success');
        } else {
          // Usuario cambia su propia contraseña
          await firstValueFrom(this.usuariosService.changePassword(formData.currentPassword, formData.newPassword));
          await this.showToast('Su contraseña ha sido cambiada correctamente', 'success');
        }

        await this.modalController.dismiss({ success: true });
      } catch (error: any) {
        console.error('Error al cambiar contraseña:', error);
        let message = 'Error al cambiar la contraseña';
        
        // Mejores mensajes de error
        if (error?.status === 400) {
          message = 'La contraseña actual es incorrecta';
        } else if (error?.status === 404) {
          message = 'Usuario no encontrado';
        } else if (error?.status === 403) {
          message = 'No tiene permisos para realizar esta acción';
        } else if (error?.error?.message) {
          message = error.error.message;
        }
        
        await this.showToast(message, 'danger');
      } finally {
        await loading.dismiss();
      }
    } else {
      // Formulario inválido, mostrar errores
      await this.showToast('Por favor complete todos los campos requeridos', 'warning');
    }
  }

  /**
   * Validador de fuerza de contraseña
   */
  passwordStrengthValidator(control: AbstractControl) {
    const value = control.value;
    if (!value) return null;
    
    const hasNumber = /[0-9]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasSpecial = /[#?!@$%^&*-]/.test(value);
    
    const valid = hasNumber && hasUpper && hasLower && hasSpecial;
    return valid ? null : { passwordStrength: true };
  }

  /**
   * Obtener nivel de fuerza de contraseña
   */
  getPasswordStrength(): string {
    const password = this.form.get('newPassword')?.value;
    if (!password) return 'none';
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[#?!@$%^&*-]/.test(password)) score++;
    
    if (score < 2) return 'weak';
    if (score < 4) return 'medium';
    return 'strong';
  }

  /**
   * Obtener texto de fuerza de contraseña
   */
  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    const texts = {
      none: '',
      weak: 'Débil',
      medium: 'Moderada',
      strong: 'Fuerte'
    };
    return texts[strength as keyof typeof texts];
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
  markFormGroupTouched() {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Verificar si un campo tiene errores
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.form.get(fieldName);
    if (!field) return false;
    
    if (errorType) {
      return field.hasError(errorType) && field.touched;
    }
    
    return field.invalid && field.touched;
  }

  /**
   * Obtener mensaje de error para un campo
   */
  getErrorMessage(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    const errors = field.errors;
    
    if (errors['required']) {
      const fieldNames: Record<string, string> = {
        'currentPassword': 'La contraseña actual',
        'newPassword': 'La nueva contraseña',
        'confirmPassword': 'La confirmación de contraseña'
      };
      return `${fieldNames[fieldName] || 'Este campo'} es requerida`;
    }
    
    if (errors['minlength']) {
      return `La contraseña debe tener al menos ${errors['minlength'].requiredLength} caracteres`;
    }
    
    if (errors['passwordStrength']) {
      return 'La contraseña debe contener mayúsculas, minúsculas, números y símbolos';
    }
    
    if (errors['passwordMismatch']) return 'Las contraseñas no coinciden';
    
    return 'Campo inválido';
  }

  /**
   * Verificar si la contraseña tiene mayúsculas
   */
  hasUpperCase(): boolean {
    const password = this.form.get('newPassword')?.value;
    return password ? /[A-Z]/.test(password) : false;
  }

  /**
   * Verificar si la contraseña tiene minúsculas
   */
  hasLowerCase(): boolean {
    const password = this.form.get('newPassword')?.value;
    return password ? /[a-z]/.test(password) : false;
  }

  /**
   * Verificar si la contraseña tiene números
   */
  hasNumbers(): boolean {
    const password = this.form.get('newPassword')?.value;
    return password ? /[0-9]/.test(password) : false;
  }

  /**
   * Verificar si la contraseña tiene símbolos
   */
  hasSymbols(): boolean {
    const password = this.form.get('newPassword')?.value;
    return password ? /[#?!@$%^&*-]/.test(password) : false;
  }

  /**
   * Verificar si la contraseña tiene la longitud mínima
   */
  hasMinLength(): boolean {
    const password = this.form.get('newPassword')?.value;
    return password ? password.length >= 8 : false;
  }

  /**
   * Confirmación adicional para reset admin
   */
  async showAdminResetConfirmation(): Promise<boolean> {
    const alert = await this.alertController.create({
      header: 'Confirmar Reset de Contraseña',
      message: `¿Está seguro que desea restablecer la contraseña de ${this.user?.nombre || this.user?.username}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Confirmar',
          handler: () => true
        }
      ]
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role !== 'cancel';
  }

  /**
   * Cerrar modal
   */
  async close() {
    await this.modalController.dismiss({ success: false });
  }

  /**
   * Debug: Obtener errores del formulario
   */
  getFormErrors(): string {
    const errors: string[] = [];
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control?.errors) {
        errors.push(`${key}: ${JSON.stringify(control.errors)}`);
      }
    });
    return errors.length ? errors.join(', ') : 'No errors';
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
}
