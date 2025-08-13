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
  IonInput,
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
  arrowBackOutline, createOutline, closeOutline, refreshOutline, shieldOutline, logOutOutline } from 'ionicons/icons';

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
    IonInput,
    IonBackButton,
    IonSpinner
  ]
})
export class ProfilePage implements OnInit {
  editMode = false;
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
    addIcons({refreshOutline,shieldOutline,createOutline,saveOutline,logOutOutline,keyOutline,closeOutline,personOutline,mailOutline,phonePortraitOutline,locationOutline,arrowBackOutline});

    this.profileForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      name: ['', [Validators.required, Validators.minLength(2)]],
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
    // Forzar que el formulario siempre muestre los datos actuales del usuario
    const user = this.currentUser();
    if (user) {
      this.profileForm.patchValue({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }

  cancelEdit() {
    this.editMode = false;
    // Restaurar los valores originales del usuario en el formulario
    const user = this.currentUser();
    if (user) {
      this.profileForm.patchValue({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: user.address || ''
      });
    }
    this.profileForm.markAsPristine();
    this.profileForm.markAsUntouched();
  }

  /**
   * Cargar perfil del usuario usando el endpoint más seguro /api/users/me
   */
  async loadProfile() {
    this.isLoading.set(true);
    try {
      console.log('🔧 Profile: Cargando perfil del usuario...');
      
      // Usar el nuevo método getMyProfile() que consume /api/users/me
      const user = await this.usuariosService.getMyProfile().toPromise();
      
      if (user) {
        console.log('✅ Profile: Datos del usuario recibidos:', user);
        
        // Mapear los campos de la API a los campos del formulario
        const mappedUser = {
          ...user,
          name: user.nombre && user.apellido ? `${user.nombre} ${user.apellido}`.trim() : user.username || '',
          email: user.correo || '',
          phone: user.telefono || '',
          address: '',  // Campo no disponible en la API actual
        };
        
        this.currentUser.set(mappedUser);
        
        // Actualizar el formulario con los datos reales del usuario
        this.profileForm.patchValue({
          username: user.username || '',
          email: user.correo || '',
          firstName: user.nombre || '',
          lastName: user.apellido || '',
          name: mappedUser.name,
          phone: mappedUser.phone,
          address: mappedUser.address
        });
        
        console.log('✅ Profile: Formulario actualizado con datos del usuario');
      } else {
        console.warn('⚠️ Profile: Respuesta sin datos de usuario');
        await this.showToast('No se pudieron cargar los datos del perfil', 'warning');
      }
    } catch (error: any) {
      console.error('❌ Profile: Error al cargar perfil:', error);
      await this.showToast('Error al cargar perfil del usuario', 'danger');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Actualizar perfil usando el endpoint más seguro /api/users/me
   */
  async updateProfile() {
    if (this.profileForm.valid) {
      this.editMode = false;
      const loading = await this.loadingController.create({
        message: 'Actualizando perfil...'
      });
      await loading.present();

      try {
        const formData = this.profileForm.value;
        
        // Mapear los campos del formulario a los campos de la API
        const updateData = {
          nombre: formData.firstName,
          apellido: formData.lastName,
          correo: formData.email,
          telefono: formData.phone
        };
        
        // Usar el método más seguro updateMyProfile() que usa /api/users/me
        const updatedUser = await this.usuariosService.updateMyProfile(updateData).toPromise();
        
        if (updatedUser) {
          // Actualizar el estado local con los datos actualizados
          const mappedUser = {
            ...updatedUser,
            name: updatedUser.nombre && updatedUser.apellido ? `${updatedUser.nombre} ${updatedUser.apellido}`.trim() : updatedUser.username || '',
            email: updatedUser.correo || '',
            phone: updatedUser.telefono || '',
            address: '',
          };
          
          this.currentUser.set(mappedUser);
          
          // Actualizar el formulario con los datos actualizados
          this.profileForm.patchValue({
            username: updatedUser.username || '',
            email: updatedUser.correo || '',
            firstName: updatedUser.nombre || '',
            lastName: updatedUser.apellido || '',
            name: mappedUser.name,
            phone: mappedUser.phone,
            address: mappedUser.address
          });
        }
        
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
   * Obtener nombre del rol para mostrar
   */
  getRoleDisplay(role: string | undefined): string {
    switch (role) {
      case 'ADMIN':
      case 'USER-ADMIN':
        return 'Administrator';
      case 'USER':
        return 'User';
      default:
        return 'User';
    }
  }

  /**
   * Alternar modo de edición
   */
  toggleEditMode() {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      // Cancelar edición - restaurar valores originales
      this.loadProfile();
    }
  }

  /**
   * Refrescar perfil
   */
  async refreshProfile() {
    await this.loadProfile();
    this.showToast('Profile refreshed successfully', 'success');
  }

  /**
   * Cerrar sesión
   */
  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      this.showToast('Error logging out', 'danger');
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
