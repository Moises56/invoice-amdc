import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { UserLocationHistoryResponse } from '../../interfaces/user.interface';
import { addIcons } from 'ionicons';
import {
  locationOutline,
  timeOutline,
  calendarOutline,
  personOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  closeOutline,
  statsChartOutline,
  listOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-user-details-modal',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Detalles del Usuario</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="user-details-content">
      <div class="user-details-container">
        <!-- User Header Section -->
        <div class="user-header-section">
          <div class="user-avatar-large">
            {{ getUserInitials() }}
          </div>
          <div class="user-basic-info">
            <h2 class="user-full-name">{{ user.nombre }} {{ user.apellido }}</h2>
            <p class="user-username">@{{ user.username }}</p>
            <div class="user-status-badge" [class.active]="user.currentLocation?.isActive" [class.inactive]="!user.currentLocation?.isActive">
              <ion-icon [name]="user.currentLocation?.isActive ? 'checkmark-circle-outline' : 'close-circle-outline'"></ion-icon>
              {{ user.currentLocation?.isActive ? 'Activo' : 'Inactivo' }}
            </div>
          </div>
        </div>

        <!-- Current Location Section -->
        <div class="details-section">
          <div class="section-header">
            <ion-icon name="location-outline"></ion-icon>
            <h3>Ubicación Actual</h3>
          </div>
          <div class="section-content">
            <div *ngIf="user.currentLocation; else noLocation" class="current-location-card">
              <div class="location-name">{{ user.currentLocation.locationName }}</div>
              <div *ngIf="user.currentLocation.locationCode" class="location-code">
                Código: {{ user.currentLocation.locationCode }}
              </div>
              <div *ngIf="user.currentLocation.description" class="location-description">
                {{ user.currentLocation.description }}
              </div>
              <div class="location-meta">
                <div class="meta-item">
                  <span class="meta-label">
                    <ion-icon name="calendar-outline"></ion-icon>
                    Asignada:
                  </span>
                  <span class="meta-value">{{ formatDateTime(user.currentLocation.assignedAt) }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">
                    <ion-icon name="time-outline"></ion-icon>
                    Duración:
                  </span>
                  <span class="meta-value">{{ getDurationText(user.currentLocation.durationDays) }}</span>
                </div>
                <div *ngIf="user.currentLocation.assignedByUsername" class="meta-item">
                  <span class="meta-label">
                    <ion-icon name="person-outline"></ion-icon>
                    Asignada por:
                  </span>
                  <span class="meta-value">{{ user.currentLocation.assignedByUsername }}</span>
                </div>
              </div>
            </div>
            <ng-template #noLocation>
              <div class="no-location-card">
                <ion-icon name="location-outline"></ion-icon>
                <p>Sin ubicación asignada actualmente</p>
              </div>
            </ng-template>
          </div>
        </div>

        <!-- Statistics Section -->
        <div class="details-section">
          <div class="section-header">
            <ion-icon name="stats-chart-outline"></ion-icon>
            <h3>Estadísticas</h3>
          </div>
          <div class="section-content">
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-number">{{ user.locationHistory.length }}</div>
                <div class="stat-label">Total Ubicaciones</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ getActiveLocationsCount() }}</div>
                <div class="stat-label">Ubicaciones Activas</div>
              </div>
            </div>
            <div *ngIf="user.locationHistory.length > 0" class="date-range">
              <div class="date-item">
                <span class="date-label">Primera asignación:</span>
                <span class="date-value">{{ formatDateTime(getFirstAssignmentDate()) }}</span>
              </div>
              <div class="date-item">
                <span class="date-label">Última asignación:</span>
                <span class="date-value">{{ formatDateTime(getLastAssignmentDate()) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- History Section -->
        <div class="details-section">
          <div class="section-header">
            <ion-icon name="list-outline"></ion-icon>
            <h3>Historial de Ubicaciones ({{ user.locationHistory.length }})</h3>
          </div>
          <div class="section-content">
            <div *ngIf="user.locationHistory.length > 0; else noHistory" class="history-list">
              <div *ngFor="let item of user.locationHistory" class="history-item" [class.active]="item.isActive" [class.inactive]="!item.isActive">
                <div class="history-header">
                  <span class="history-name">{{ item.locationName }}</span>
                  <span class="history-status" [class.active]="item.isActive" [class.inactive]="!item.isActive">
                    {{ item.isActive ? 'Activa' : 'Finalizada' }}
                  </span>
                </div>
                <div *ngIf="item.locationCode" class="history-code">
                  Código: {{ item.locationCode }}
                </div>
                <div class="history-meta">
                  <span>{{ getDurationText(item.durationDays) }}</span>
                  <span>{{ formatDateTime(item.assignedAt) }}</span>
                </div>
              </div>
            </div>
            <ng-template #noHistory>
              <div class="no-history-card">
                <ion-icon name="list-outline"></ion-icon>
                <p>No hay historial de ubicaciones disponible</p>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styleUrls: ['./user-details-modal.component.scss']
})
export class UserDetailsModalComponent {
  @Input() user!: UserLocationHistoryResponse;
  
  private readonly modalController = inject(ModalController);

  constructor() {
    addIcons({
      locationOutline,
      timeOutline,
      calendarOutline,
      personOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      closeOutline,
      statsChartOutline,
      listOutline
    });
  }

  dismiss() {
    this.modalController.dismiss();
  }

  getUserInitials(): string {
    const firstName = this.user.nombre?.charAt(0) || '';
    const lastName = this.user.apellido?.charAt(0) || '';
    return (firstName + lastName).toUpperCase();
  }

  getActiveLocationsCount(): number {
    return this.user.locationHistory.filter(item => item.isActive).length;
  }

  getFirstAssignmentDate(): string {
    if (this.user.locationHistory.length === 0) return '';
    return this.user.locationHistory[this.user.locationHistory.length - 1].assignedAt;
  }

  getLastAssignmentDate(): string {
    if (this.user.locationHistory.length === 0) return '';
    return this.user.locationHistory[0].assignedAt;
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  getDurationText(days: number): string {
    if (days === 0) return 'Menos de 1 día';
    if (days === 1) return '1 día';
    if (days < 30) return `${days} días`;
    if (days < 365) {
      const months = Math.floor(days / 30);
      return months === 1 ? '1 mes' : `${months} meses`;
    }
    const years = Math.floor(days / 365);
    return years === 1 ? '1 año' : `${years} años`;
  }
}