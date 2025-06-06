import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
  IonBadge, IonButton, IonSpinner, IonIcon, IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  locationOutline, businessOutline, calendarOutline, createOutline,
  mapOutline, listOutline, statsChartOutline
} from 'ionicons/icons';

import { MercadosService } from '../mercados.service';
import { Mercado } from '../../../shared/interfaces';

@Component({
  selector: 'app-mercado-detail',
  templateUrl: './mercado-detail.page.html',
  styleUrls: ['./mercado-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
    IonBadge, IonButton, IonSpinner, IonIcon, IonFab, IonFabButton
  ]
})
export class MercadoDetailPage implements OnInit {
  private mercadosService = inject(MercadosService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  mercado = signal<Mercado | null>(null);
  isLoading = signal(true);
  mercadoId = signal<string>('');

  constructor() {
    addIcons({ 
      locationOutline, businessOutline, calendarOutline, createOutline,
      mapOutline, listOutline, statsChartOutline
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.mercadoId.set(id);
      this.loadMercado(id);
    }
  }

  private async loadMercado(id: string) {
    try {
      this.isLoading.set(true);
      const response = await this.mercadosService.getMarketById(id).toPromise();
      if (response?.data) {
        this.mercado.set(response.data);
      }
    } catch (error) {
      console.error('Error loading mercado:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  editMercado() {
    if (this.mercadoId()) {
      this.router.navigate(['/mercados/editar', this.mercadoId()]);
    }
  }

  viewInMap() {
    const market = this.mercado();
    if (market) {
      const url = `https://www.google.com/maps?q=${market.latitud},${market.longitud}`;
      window.open(url, '_blank');
    }
  }

  viewLocales() {
    if (this.mercadoId()) {
      this.router.navigate(['/locales'], { 
        queryParams: { mercado: this.mercadoId() } 
      });
    }
  }

  getStatusColor(isActive: boolean): string {
    return isActive ? 'success' : 'danger';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Activo' : 'Inactivo';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
