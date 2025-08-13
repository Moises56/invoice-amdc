import { Component, OnInit, inject, signal, Input } from '@angular/core';
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
  IonCheckbox,
  IonToggle,
  IonBackButton,
  IonSpinner,
  IonToast,
  ToastController,
  LoadingController,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline,
  arrowBackOutline,
  personOutline,
  mailOutline,
  keyOutline,
  businessOutline,
  checkmarkCircleOutline,
  closeOutline
} from 'ionicons/icons';

import { UsuariosService } from '../usuarios.service';
import { AuthService } from '../../../core/services/auth.service';
import { User, Role, CreateUserDto, UpdateUserDto } from '../../../shared/interfaces';

@Component({
  selector: 'app-usuario-form',
  templateUrl: './usuario-form.page.html',
  styleUrls: ['./usuario-form.page.scss'],
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
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonBackButton,
    IonSpinner
  ]
})
export class UsuarioFormPage implements OnInit {
  @Input() isEdit: boolean = false;
  @Input() user?: User;

  private formBuilder = inject(FormBuilder);
  private usuariosService = inject(UsuariosService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private modalController = inject(ModalController);

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
      checkmarkCircleOutline,
      closeOutline
    });

    this.form = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      correo: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      dni: ['', [Validators.required, Validators.minLength(8)]],
      password: ['', [Validators.minLength(6)]],
      confirmPassword: [''],
      role: [Role.USER, [Validators.required]],
      isActive: [true],
      telefono: [''],
      gerencia: [''],
      numero_empleado: [null]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    if (this.isEdit && this.user) {
      this.isEditing.set(true);
      this.currentUser.set(this.user);
      this.loadUserData(this.user);
      // En edición, el password no es requerido
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
    } else {
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
  }

  /**
   * Cargar datos del usuario en el formulario
   */
  loadUserData(user: User) {
    this.form.patchValue({
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      correo: user.correo || user.email || '',
      username: user.username || '',
      dni: user.dni || '',
      role: user.role,
      isActive: user.isActive,
      telefono: user.telefono || user.phone || '',
      gerencia: user.gerencia || '',
      numero_empleado: user.numero_empleado || null
    });
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
        this.loadUserData(user);
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
        
        if (this.isEditing()) {
          // Actualizar usuario
          const updateData: UpdateUserDto = {
            correo: formData.correo,
            nombre: formData.nombre,
            apellido: formData.apellido,
            username: formData.username,
            dni: formData.dni,
            role: formData.role,
            telefono: formData.telefono || undefined,
            gerencia: formData.gerencia || undefined,
            numero_empleado: formData.numero_empleado || undefined,
            isActive: formData.isActive
          };

          // Solo incluir password si se proporcionó
          if (formData.password) {
            updateData.contrasena = formData.password;
          }

          // Verificar si el usuario está editando su propio perfil
          const authenticatedUser = this.authService.user();
          const isEditingOwnProfile = authenticatedUser && this.currentUser()?.id === authenticatedUser.id;
          
          if (isEditingOwnProfile) {
            // Usar el método más seguro para auto-edición
            const selfUpdateData = {
              nombre: updateData.nombre,
              apellido: updateData.apellido,
              correo: updateData.correo,
              telefono: updateData.telefono
            };
            await this.usuariosService.updateMyProfile(selfUpdateData).toPromise();
            await this.showToast('Perfil actualizado correctamente', 'success');
          } else {
            // Usar el método administrativo para edición de otros usuarios
            await this.usuariosService.updateUser(this.currentUser()!.id, updateData).toPromise();
            await this.showToast('Usuario actualizado correctamente', 'success');
          }
          
          // Cerrar modal si estamos en modo modal
          if (this.isEdit) {
            await this.modalController.dismiss({ success: true });
            return;
          }
        } else {
          // Crear usuario
          const createData: CreateUserDto = {
            correo: formData.correo,
            nombre: formData.nombre,
            apellido: formData.apellido,
            contrasena: formData.password,
            username: formData.username,
            dni: formData.dni,
            role: formData.role,
            telefono: formData.telefono || undefined,
            gerencia: formData.gerencia || undefined,
            numero_empleado: formData.numero_empleado || undefined
          };

          await this.usuariosService.createUser(createData).toPromise();
          await this.showToast('Usuario creado correctamente', 'success');
          
          // Si estamos en modo modal (crear desde lista), cerrar modal
          if (this.isEdit !== undefined) {
            await this.modalController.dismiss({ success: true });
            return;
          }
        }

        // Solo navegar si no estamos en modal (página independiente)
        if (!this.isEdit) {
          this.router.navigate(['/usuarios']);
        }
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
    
    if (errors['required']) {
      const fieldNames: Record<string, string> = {
        'nombre': 'El nombre',
        'apellido': 'El apellido', 
        'correo': 'El correo electrónico',
        'username': 'El nombre de usuario',
        'dni': 'El DNI',
        'role': 'El rol',
        'password': 'La contraseña'
      };
      return `${fieldNames[fieldName] || 'Este campo'} es requerido`;
    }
    
    if (errors['email']) return 'Ingrese un correo electrónico válido';
    if (errors['minlength']) {
      const requiredLength = errors['minlength'].requiredLength;
      const fieldMessages: Record<string, string> = {
        'nombre': `El nombre debe tener al menos ${requiredLength} caracteres`,
        'apellido': `El apellido debe tener al menos ${requiredLength} caracteres`,
        'username': `El nombre de usuario debe tener al menos ${requiredLength} caracteres`,
        'dni': `El DNI debe tener al menos ${requiredLength} caracteres`,
        'password': `La contraseña debe tener al menos ${requiredLength} caracteres`
      };
      return fieldMessages[fieldName] || `Mínimo ${requiredLength} caracteres`;
    }
    if (errors['passwordMismatch']) return 'Las contraseñas no coinciden';
    
    return 'Campo inválido';
  }

  /**
   * Volver a la lista o cerrar modal
   */
  async goBack() {
    // Si estamos en modal (componente creado desde ModalController), cerrar modal
    try {
      await this.modalController.dismiss({ success: false });
    } catch (error) {
      // Si falla el dismiss del modal, significa que no estamos en modal, navegar normalmente
      this.router.navigate(['/usuarios']);
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
   * Obtener texto del rol
   */
  getRoleText(role: Role): string {
    const texts: Record<Role, string> = {
      [Role.ADMIN]: 'Administrador',
      [Role.MARKET]: 'Mercado',
      [Role.USER]: 'Usuario',
      [Role['USER-ADMIN']]: 'Super Usuario'
    };
    return texts[role] || role;
  }
}
