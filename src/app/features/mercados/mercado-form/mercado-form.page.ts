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
  public router = inject(Router); // Make public for template access

  form!: FormGroup;
  mercado = signal<Mercado | null>(null);
  isLoading = signal(false);
  isEditing = signal(false);
  toastMessage = signal('');
  isToastOpen = signal(false);

  constructor() {
    addIcons({ saveOutline, locationOutline });
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
  }

  private async loadMercado(id: string) {
    try {
      this.isLoading.set(true);
      const mercado = await this.mercadosService.getMarketById(id).toPromise();
      if (mercado?.data) {
        this.mercado.set(mercado.data);
        this.form.patchValue({
          nombre_mercado: mercado.data.nombre_mercado,
          direccion: mercado.data.direccion,
          latitud: mercado.data.latitud,
          longitud: mercado.data.longitud,
          descripcion: mercado.data.descripcion || ''
        });
      }
    } catch (error) {
      console.error('Error loading mercado:', error);
      this.showToast('Error al cargar el mercado');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onSubmit() {
    if (this.form.valid) {
      try {
        this.isLoading.set(true);
        
        if (this.isEditing()) {
          const updateData: UpdateMercadoRequest = this.form.value;
          await this.mercadosService.updateMarket(this.mercado()!.id, updateData).toPromise();
          this.showToast('Mercado actualizado exitosamente');
        } else {
          const createData: CreateMercadoRequest = this.form.value;
          await this.mercadosService.createMarket(createData).toPromise();
          this.showToast('Mercado creado exitosamente');
        }
        
        setTimeout(() => {
          this.router.navigate(['/mercados']);
        }, 1500);
        
      } catch (error) {
        console.error('Error saving mercado:', error);
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
