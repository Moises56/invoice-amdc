import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
  IonInput, IonTextarea, IonButton, IonSpinner, IonToast, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline, locationOutline } from 'ionicons/icons';

import { MercadosService } from '../mercados.service';
import { Mercado, CreateMercadoRequest, UpdateMercadoRequest } from '../../../shared/interfaces';
import { EventService } from '../../../shared/services/event.service';

@Component({
  selector: 'app-mercado-form',
  templateUrl: './mercado-form.page.html',
  styleUrls: ['./mercado-form.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
    IonInput, IonTextarea, IonButton, IonSpinner, IonToast, IonIcon
  ]
})
export class MercadoFormPage implements OnInit {
  private mercadosService = inject(MercadosService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);
  public router = inject(Router);

  form!: FormGroup;
  mercado = signal<Mercado | null>(null);
  isLoading = signal(false);
  isEditing = signal(false);
  toastMessage = signal('');
  isToastOpen = signal(false);

  constructor() {
    addIcons({locationOutline, saveOutline});
    this.initializeForm();
  }
    ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      this.loadMercado(id);
    }
  }

  private initializeForm() {
    this.form = this.fb.group({
      nombre_mercado: ['', [Validators.required, Validators.minLength(3)]],
      direccion: ['', [Validators.required, Validators.minLength(10)]],
      latitud: ['', [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitud: ['', [Validators.required, Validators.min(-180), Validators.max(180)]],
      descripcion: ['']
    });
  }  private loadMercado(id: string) {
    this.isLoading.set(true);

    this.mercadosService.getMarketById(id).subscribe({
      next: (mercadoData) => {
        if (mercadoData && mercadoData.id) {
          this.mercado.set(mercadoData);
          
          // Use patchValue to populate the form
          this.form.patchValue({
            nombre_mercado: mercadoData.nombre_mercado || '',
            direccion: mercadoData.direccion || '',
            latitud: mercadoData.latitud || 0,
            longitud: mercadoData.longitud || 0,
            descripcion: mercadoData.descripcion || ''
          });
          
          // Mark as pristine to avoid showing validation errors initially
          this.form.markAsPristine();
          this.form.markAsUntouched();
        } else {
          this.showToast('No se pudo cargar la información del mercado');
        }
        this.isLoading.set(false);
      },
      error: (error: any) => {
        this.showToast('Error al cargar el mercado');
        this.isLoading.set(false);
      }
    });
  }
  
  async onSubmit() {
    if (this.form.valid) {
      try {
        this.isLoading.set(true);
        
        if (this.isEditing()) {
          const updateData: UpdateMercadoRequest = this.form.value;
          const response = await this.mercadosService.updateMarket(this.mercado()!.id, updateData).toPromise();
          this.showToast('Mercado actualizado exitosamente');
          this.eventService.emit('mercado:updated', response?.data);
        } else {
          const createData: CreateMercadoRequest = this.form.value;
          const response = await this.mercadosService.createMarket(createData).toPromise();
          this.showToast('Mercado creado exitosamente');
          this.eventService.emit('mercado:created', response?.data);
        }
        
        setTimeout(() => {
          this.router.navigate(['/mercados']);
        }, 1000);
          } catch (error) {
        this.showToast('Error al guardar el mercado');
      } finally {
        this.isLoading.set(false);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  private showToast(message: string) {
    this.toastMessage.set(message);
    this.isToastOpen.set(true);
  }

  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} es requerido`;
      if (field.errors['minlength']) return `${fieldName} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['min']) return `Valor mínimo: ${field.errors['min'].min}`;
      if (field.errors['max']) return `Valor máximo: ${field.errors['max'].max}`;
    }
    return '';
  }
  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field?.invalid && field.touched);
  }
}
