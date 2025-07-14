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

    // Verificar autenticación cuando se complete la verificación inicial
    this.checkAuthenticationStatus();
  }

  /**
   * Verificar estado de autenticación de manera robusta
   */
  private async checkAuthenticationStatus(): Promise<void> {
    console.log('🔍 LoginPage: Verificando estado de autenticación...');
    
    // Esperar a que se complete la verificación de autenticación con timeout
    let attempts = 0;
    const maxAttempts = 30; // 3 segundos máximo (más rápido para UX)

    while (!this.authService.authCheckComplete() && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    // Verificar de manera robusta si ya está autenticado
    if (this.authService.isAuthenticated()) {
      console.log('✅ Usuario ya autenticado, redirigiendo al dashboard');
      this.router.navigate(['/dashboard'], { replaceUrl: true });
      return;
    }

    // Si no está autenticado y completó la verificación, mostrar form
    if (this.authService.authCheckComplete()) {
      console.log('ℹ️ Usuario no autenticado, mostrando formulario de login');
      return;
    }

    // Si hay timeout, intentar verificación manual una vez
    if (attempts >= maxAttempts) {
      console.log('⚠️ Timeout en verificación, intentando verificación manual...');
      try {
        const isAuth = await this.authService.checkAuthStatus();
        if (isAuth) {
          console.log('✅ Usuario autenticado en verificación manual');
          this.router.navigate(['/dashboard'], { replaceUrl: true });
        }
      } catch (error) {
        console.log('❌ Error en verificación manual:', error);
        // Continuar mostrando el formulario de login
      }
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
   * Enviar formulario de login con manejo robusto
   */
  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading()) {
      console.log('🔐 Enviando formulario de login...');
      
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
        next: (response) => {
          console.log('✅ Login exitoso en component:', response);
          // Navegar al dashboard con replaceUrl para limpiar historial
          this.router.navigate(['/dashboard'], { replaceUrl: true });
        },
        error: (error) => {
          console.error('❌ Error en login component:', error);
          // El AuthService ya maneja el toast de error
        }
      });
    } else {
      console.log('⚠️ Formulario inválido o cargando');
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
