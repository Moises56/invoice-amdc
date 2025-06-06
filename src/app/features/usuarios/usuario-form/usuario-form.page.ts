import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonCheckbox,
  IonToggle,
  IonBackButton,
  IonSpinner,
  IonToast,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline,
  arrowBackOutline,
  personOutline,
  mailOutline,
  keyOutline,
  businessOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';

import { UsuariosService } from '../usuarios.service';
import { User, Role, CreateUserDto, UpdateUserDto } from '../../../shared/interfaces';

@Component({
  selector: 'app-usuario-form',
  templateUrl: './usuario-form.page.html',
  styleUrls: ['./usuario-form.page.scss'],
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
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonToggle,
    IonBackButton,
    IonSpinner
  ]
})
export class UsuarioFormPage implements OnInit {
  private formBuilder = inject(FormBuilder);
  private usuariosService = inject(UsuariosService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  // Signals
  isEditing = signal(false);
  isLoading = signal(false);
  currentUser = signal<User | null>(null);

  form: FormGroup;
  availableRoles = Object.values(Role);

  constructor() {
    addIcons({
      saveOutline,
      arrowBackOutline,
      personOutline,
      mailOutline,
      keyOutline,
      businessOutline,
      checkmarkCircleOutline
    });    this.form = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      confirmPassword: [''],
      role: [Role.USER, [Validators.required]],
      isActive: [true],
      phone: [''],
      address: [''],
      marketId: [null]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.isEditing.set(true);
      this.loadUser(userId);
      // En edición, el password no es requerido
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
    } else {
      // En creación, el password es requerido
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  /**
   * Cargar usuario para edición
   */
  async loadUser(id: string) {
    this.isLoading.set(true);
    
    try {
      const user = await this.usuariosService.getUserById(id).toPromise();
      if (user) {
        this.currentUser.set(user);
        this.form.patchValue({
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          phone: user.phone || '',
          address: user.address || '',
          marketId: user.marketId || null
        });
      }
    } catch (error) {
      await this.showToast('Error al cargar usuario', 'danger');
      this.router.navigate(['/usuarios']);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Enviar formulario
   */
  async onSubmit() {
    if (this.form.valid) {
      const loading = await this.loadingController.create({
        message: this.isEditing() ? 'Actualizando usuario...' : 'Creando usuario...'
      });
      await loading.present();

      try {
        const formData = this.form.value;
        
        if (this.isEditing()) {          // Actualizar usuario
          const updateData: UpdateUserDto = {
            correo: formData.email,
            nombre: formData.name,
            role: formData.role,
            telefono: formData.phone || undefined
          };

          // Solo incluir password si se proporcionó
          if (formData.password) {
            updateData.password = formData.password;
          }

          await this.usuariosService.updateUser(this.currentUser()!.id, updateData).toPromise();
          await this.showToast('Usuario actualizado correctamente', 'success');
        } else {          // Crear usuario
          const createData: CreateUserDto = {
            correo: formData.email,
            nombre: formData.name,
            apellido: '', // TODO: Add apellido field to form
            contrasena: formData.password,
            role: formData.role,
            telefono: formData.phone || undefined,
            dni: '', // TODO: Add DNI field to form
            username: formData.email // Use email as username for now
          };

          await this.usuariosService.createUser(createData).toPromise();
          await this.showToast('Usuario creado correctamente', 'success');
        }

        this.router.navigate(['/usuarios']);
      } catch (error: any) {
        const message = error?.error?.message || 'Error al procesar la solicitud';
        await this.showToast(message, 'danger');
      } finally {
        await loading.dismiss();
      }
    } else {
      await this.showToast('Por favor, complete todos los campos requeridos', 'warning');
      this.markFormGroupTouched();
    }
  }

  /**
   * Validador para confirmar password
   */
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password?.value && confirmPassword?.value && password.value !== confirmPassword.value) {
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
    
    if (errors['required']) return 'Este campo es requerido';
    if (errors['email']) return 'Ingrese un email válido';
    if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['passwordMismatch']) return 'Las contraseñas no coinciden';
    
    return 'Campo inválido';
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
      position: 'top'
    });
    await toast.present();
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
}
