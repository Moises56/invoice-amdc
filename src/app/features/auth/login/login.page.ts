import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonCard, 
  IonCardContent, 
  IonCardHeader, 
  IonCardTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonCheckbox
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logInOutline, eyeOutline, eyeOffOutline, personOutline, lockClosedOutline, businessOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { VALIDATION_CONFIG } from '../../../shared/constants';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
    IonCheckbox
  ]
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  showPassword = signal<boolean>(false);
  rememberMe = signal<boolean>(false);

  // Signals computados
  isLoading = this.authService.isLoading;
  isAuthenticated = this.authService.isAuthenticated;

  constructor() {
    addIcons({businessOutline,personOutline,lockClosedOutline,logInOutline,eyeOutline,eyeOffOutline});
    
    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required]],
      contrasena: ['', [Validators.required, Validators.minLength(VALIDATION_CONFIG.PASSWORD.MIN_LENGTH)]]
    });

    // Redirigir si ya está autenticado
    if (this.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Alternar visibilidad de contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  /**
   * Alternar recordar sesión
   */
  toggleRememberMe(): void {
    this.rememberMe.set(!this.rememberMe());
  }

  /**
   * Enviar formulario de login
   */
  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading()) {
      const formValue = this.loginForm.value;
      const credentials = {
        contrasena: formValue.contrasena,
        // Detectar si es email o username
        ...(this.isEmail(formValue.identifier) 
          ? { correo: formValue.identifier }
          : { username: formValue.identifier }
        )
      };

      this.authService.login(credentials).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Error en login:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  /**
   * Verificar si el identificador es un email
   */
  private isEmail(identifier: string): boolean {
    return VALIDATION_CONFIG.EMAIL.PATTERN.test(identifier);
  }

  /**
   * Marcar todos los campos como tocados para mostrar errores
   */
  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Obtener mensaje de error para un campo
   */
  getErrorMessage(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return fieldName === 'identifier' ? 'El correo o usuario es requerido' : 'La contraseña es requerida';
      }
      if (control.errors['minlength']) {
        return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }

  /**
   * Verificar si un campo tiene errores
   */
  hasError(fieldName: string): boolean {
    const control = this.loginForm.get(fieldName);
    return !!(control?.errors && control.touched);
  }
}
