import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  ModalController
} from '@ionic/angular/standalone';
import { UserLocationHistoryResponse } from '../../interfaces/user.interface';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  personOutline,
  mailOutline,
  callOutline,
  businessOutline,
  calendarOutline,
  timeOutline,
  locationOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  alertCircleOutline,
  analyticsOutline,
  barChartOutline,
  documentText,
  shieldCheckmark,
  cash,
  checkmarkCircle,
  closeCircle,
  business
} from 'ionicons/icons';

@Component({
  selector: 'app-user-details-modal',
  templateUrl: './user-details-modal.component.html',
  styleUrls: ['./user-details-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon
  ]
})
export class UserDetailsModalComponent {
  @Input() user!: UserLocationHistoryResponse;

  private modalController = inject(ModalController);

  constructor() {
    addIcons({
      closeOutline,
      locationOutline,
      businessOutline,
      calendarOutline,
      timeOutline,
      personOutline,
      analyticsOutline,
      barChartOutline,
      documentText,
      checkmarkCircle,
      closeCircle,
      business,
      shieldCheckmark,
      cash,
      mailOutline,
      callOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      alertCircleOutline
    });
  }

  dismiss() {
    this.modalController.dismiss();
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'activo':
        return 'success';
      case 'inactive':
      case 'inactivo':
        return 'danger';
      case 'pending':
      case 'pendiente':
        return 'warning';
      default:
        return 'medium';
    }
  }

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'activo':
        return 'checkmark-circle-outline';
      case 'inactive':
      case 'inactivo':
        return 'close-circle-outline';
      default:
        return 'alert-circle-outline';
    }
  }

  formatDate(date: string | Date): string {
    if (!date) return 'No disponible';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }
}