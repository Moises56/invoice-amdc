import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ModalController, LoadingController, AlertController } from '@ionic/angular';
import { LocationService } from '../../shared/services/location.service';
import { UsuariosService } from '../../features/usuarios/usuarios.service';
import { AssignLocationRequest, UserLocation } from '../../shared/interfaces/user.interface';
import { User } from '../../shared/interfaces';

@Component({
  selector: 'app-assign-location-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>📍 Asignar Ubicación</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()" fill="clear">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="assignLocationForm" (ngSubmit)="onSubmit()">
        
        <!-- Seleccionar Usuario -->
        <ion-item>
          <ion-label position="stacked">👤 Usuario *</ion-label>
          <ion-select 
            formControlName="userId" 
            placeholder="Seleccionar usuario..."
            interface="popover"
            [disabled]="!!preselectedUser"
          >
            <ion-select-option 
              *ngFor="let user of availableUsers()" 
              [value]="user.id"
            >
              {{ user.username }} - {{ user.nombre }} {{ user.apellido }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        
        <!-- Error Usuario -->
        <div *ngIf="assignLocationForm.get('userId')?.invalid && assignLocationForm.get('userId')?.touched" 
             class="error-message">
          <ion-text color="danger">
            <small>El usuario es requerido</small>
          </ion-text>
        </div>

        <!-- Información del Usuario Seleccionado -->
        <ion-card *ngIf="selectedUserInfo()" class="user-info-card">
          <ion-card-content>
            <div class="user-info">
              <h3>{{ selectedUserInfo()?.username }}</h3>
              <p><strong>Nombre:</strong> {{ selectedUserInfo()?.nombre }} {{ selectedUserInfo()?.apellido }}</p>
              <p><strong>Rol:</strong> {{ selectedUserInfo()?.role }}</p>
              <p *ngIf="selectedUserInfo()?.marketId"><strong>Ubicación Actual:</strong> {{ selectedUserInfo()?.market?.nombre_mercado || selectedUserInfo()?.marketId }}</p>
              <p *ngIf="!selectedUserInfo()?.marketId" class="no-location">Sin ubicación asignada</p>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Nombre de Ubicación -->
        <ion-item>
          <ion-label position="stacked">🏢 Nombre de Ubicación *</ion-label>
          <ion-input
            formControlName="locationName"
            placeholder="Ej: Mercado Central, Oficina Principal..."
            [clearInput]="true"
            type="text"
          ></ion-input>
        </ion-item>
        
        <!-- Error Ubicación -->
        <div *ngIf="assignLocationForm.get('locationName')?.invalid && assignLocationForm.get('locationName')?.touched" 
             class="error-message">
          <ion-text color="danger">
            <small>
              <span *ngIf="assignLocationForm.get('locationName')?.errors?.['required']">
                El nombre de la ubicación es requerido
              </span>
              <span *ngIf="assignLocationForm.get('locationName')?.errors?.['maxlength']">
                El nombre no puede exceder 100 caracteres
              </span>
            </small>
          </ion-text>
        </div>

        <!-- Sugerencias de Ubicaciones -->
        <div *ngIf="locationSuggestions().length > 0" class="suggestions-container">
          <ion-label color="medium">
            <small>💡 Ubicaciones sugeridas:</small>
          </ion-label>
          <div class="suggestions">
            <ion-chip 
              *ngFor="let suggestion of locationSuggestions()" 
              (click)="selectSuggestion(suggestion)"
              color="primary"
              outline="true"
              class="suggestion-chip"
            >
              {{ suggestion }}
            </ion-chip>
          </div>
        </div>

        <!-- Código de Ubicación (Opcional) -->
        <ion-item>
          <ion-label position="stacked">🏷️ Código de Ubicación</ion-label>
          <ion-input
            formControlName="locationCode"
            placeholder="Ej: MC01, OF-PRIN..."
            [clearInput]="true"
            type="text"
          ></ion-input>
        </ion-item>
        
        <!-- Error Código -->
        <div *ngIf="assignLocationForm.get('locationCode')?.invalid && assignLocationForm.get('locationCode')?.touched" 
             class="error-message">
          <ion-text color="danger">
            <small>El código no puede exceder 20 caracteres</small>
          </ion-text>
        </div>

        <!-- Descripción (Opcional) -->
        <ion-item>
          <ion-label position="stacked">📝 Descripción</ion-label>
          <ion-textarea
            formControlName="description"
            placeholder="Información adicional sobre la ubicación..."
            rows="3"
          ></ion-textarea>
        </ion-item>
        
        <!-- Error Descripción -->
        <div *ngIf="assignLocationForm.get('description')?.invalid && assignLocationForm.get('description')?.touched" 
             class="error-message">
          <ion-text color="danger">
            <small>La descripción no puede exceder 500 caracteres</small>
          </ion-text>
        </div>

        <!-- Ubicación Actual del Usuario -->
        <ion-card *ngIf="currentUserLocation()" color="warning">
          <ion-card-header>
            <ion-card-title>⚠️ Ubicación Actual</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p><strong>Ubicación:</strong> {{ currentUserLocation()?.locationName }}</p>
            <p *ngIf="currentUserLocation()?.locationCode">
              <strong>Código:</strong> {{ currentUserLocation()?.locationCode }}
            </p>
            <p><strong>Asignada:</strong> {{ formatDate(currentUserLocation()?.assignedAt) }}</p>
            <p><strong>Asignada por:</strong> {{ currentUserLocation()?.assignedBy }}</p>
            <ion-text color="warning">
              <small>⚠️ La asignación reemplazará la ubicación actual</small>
            </ion-text>
          </ion-card-content>
        </ion-card>

        <!-- Botones de Acción -->
        <div class="action-buttons">
          <ion-button 
            expand="block" 
            fill="clear" 
            color="medium"
            (click)="dismiss()"
          >
            Cancelar
          </ion-button>
          
          <ion-button 
            expand="block" 
            type="submit"
            [disabled]="!assignLocationForm.valid || isSubmitting()"
            color="primary"
          >
            <ion-icon name="location" slot="start"></ion-icon>
            {{ isSubmitting() ? 'Asignando...' : 'Asignar Ubicación' }}
          </ion-button>
        </div>

      </form>
    </ion-content>
  `,
  styles: [`
    .user-info-card {
      margin: 16px 0;
      border-left: 4px solid var(--ion-color-primary);
    }

    .user-info h3 {
      margin: 0 0 8px 0;
      color: var(--ion-color-primary);
      font-weight: 600;
    }

    .user-info p {
      margin: 4px 0;
      font-size: 14px;
    }

    .no-location {
      color: var(--ion-color-medium);
      font-style: italic;
    }

    .error-message {
      padding: 8px 16px 0 16px;
    }

    .suggestions-container {
      margin: 16px 16px 8px 16px;
    }

    .suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }

    .suggestion-chip {
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .suggestion-chip:hover {
      transform: translateY(-1px);
    }

    .action-buttons {
      margin-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    @media (min-width: 768px) {
      .action-buttons {
        flex-direction: row;
      }
    }
  `]
})
export class AssignLocationModalComponent implements OnInit {
  private modalController = inject(ModalController);
  private loadingController = inject(LoadingController);
  private alertController = inject(AlertController);
  private fb = inject(FormBuilder);
  private locationService = inject(LocationService);
  private usersService = inject(UsuariosService);

  // Signals
  availableUsers = signal<User[]>([]);
  selectedUserInfo = signal<User | null>(null);
  currentUserLocation = signal<UserLocation | null>(null);
  locationSuggestions = signal<string[]>([]);
  isSubmitting = signal(false);

  // Form
  assignLocationForm: FormGroup;

  // Props pasadas al modal
  preselectedUser?: User;

  constructor() {
    this.assignLocationForm = this.fb.group({
      userId: ['', [Validators.required]],
      locationName: ['', [Validators.required, Validators.maxLength(100)]],
      locationCode: ['', [Validators.maxLength(20)]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  async ngOnInit() {
    await this.loadInitialData();
    this.setupFormSubscriptions();
    
    // Si hay un usuario preseleccionado, configurarlo
    if (this.preselectedUser) {
      this.assignLocationForm.patchValue({
        userId: this.preselectedUser.id
      });
      this.selectedUserInfo.set(this.preselectedUser);
      await this.loadUserCurrentLocation(this.preselectedUser.id);
    }
  }

  private async loadInitialData() {
    const loading = await this.loadingController.create({
      message: 'Cargando usuarios...'
    });
    await loading.present();

    try {
      // Cargar usuarios disponibles
      const response = await this.usersService.getUsers(1, 100).toPromise();
      if (response && response.data) {
        this.availableUsers.set(response.data);
      }

      // Cargar sugerencias de ubicaciones
      const suggestions = await this.locationService.getAvailableLocationNames().toPromise();
      if (suggestions) {
        this.locationSuggestions.set(suggestions);
      }
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      await this.showErrorAlert('Error al cargar los datos iniciales');
    } finally {
      await loading.dismiss();
    }
  }

  private setupFormSubscriptions() {
    // Monitorear cambios en el usuario seleccionado
    this.assignLocationForm.get('userId')?.valueChanges.subscribe(async (userId) => {
      if (userId) {
        const user = this.availableUsers().find(u => u.id === userId);
        this.selectedUserInfo.set(user || null);
        
        if (user) {
          await this.loadUserCurrentLocation(userId);
        }
      } else {
        this.selectedUserInfo.set(null);
        this.currentUserLocation.set(null);
      }
    });

    // Filtrar sugerencias basadas en lo que escribe el usuario
    this.assignLocationForm.get('locationName')?.valueChanges.subscribe((value) => {
      if (value && value.length > 2) {
        const filtered = this.locationSuggestions().filter(suggestion =>
          suggestion.toLowerCase().includes(value.toLowerCase())
        );
        // Limitar a 5 sugerencias
        this.locationSuggestions.set(filtered.slice(0, 5));
      }
    });
  }

  private async loadUserCurrentLocation(userId: string) {
    try {
      const currentLocation = await this.locationService.getUserActiveLocation(userId).toPromise();
      this.currentUserLocation.set(currentLocation || null);
    } catch (error) {
      console.error('Error cargando ubicación actual:', error);
      this.currentUserLocation.set(null);
    }
  }

  selectSuggestion(suggestion: string) {
    this.assignLocationForm.patchValue({
      locationName: suggestion
    });
  }

  async onSubmit() {
    if (!this.assignLocationForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting.set(true);

    const loading = await this.loadingController.create({
      message: 'Asignando ubicación...'
    });
    await loading.present();

    try {
      const formValue = this.assignLocationForm.value;
      const request: AssignLocationRequest = {
        userId: formValue.userId,
        locationName: formValue.locationName,
        locationCode: formValue.locationCode || undefined,
        description: formValue.description || undefined
      };

      // Validar datos antes de enviar
      const validationErrors = this.locationService.validateLocationAssignment(request);
      if (validationErrors.length > 0) {
        await this.showErrorAlert(validationErrors.join('\n'));
        return;
      }

      const result = await this.locationService.assignLocationToUser(request).toPromise();
      
      if (result) {
        await this.showSuccessAlert(
          `Ubicación "${result.locationName}" asignada exitosamente a ${result.username}`
        );
        this.dismiss(result);
      }

    } catch (error: any) {
      console.error('Error asignando ubicación:', error);
      const errorMessage = error.message || 'Error al asignar la ubicación';
      await this.showErrorAlert(errorMessage);
    } finally {
      this.isSubmitting.set(false);
      await loading.dismiss();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.assignLocationForm.controls).forEach(key => {
      this.assignLocationForm.get(key)?.markAsTouched();
    });
  }

  private async showSuccessAlert(message: string) {
    const alert = await this.alertController.create({
      header: '✅ Éxito',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  private async showErrorAlert(message: string) {
    const alert = await this.alertController.create({
      header: '❌ Error',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }

  dismiss(result?: UserLocation) {
    this.modalController.dismiss(result);
  }
}
