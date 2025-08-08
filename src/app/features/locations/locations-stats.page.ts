import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController, AlertController, ModalController } from '@ionic/angular';
import { LocationService } from '../../shared/services/location.service';
import { LocationStatsResponse } from '../../shared/interfaces/user.interface';
import { AssignLocationModalComponent } from '../../components/assign-location-modal/assign-location-modal.component';

@Component({
  selector: 'app-locations-stats',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header style="background:#5ccedf;">
      <ion-toolbar style="background:#5ccedf; min-height: env(safe-area-inset-top, 24px) + 56px; padding-top: env(safe-area-inset-top, 24px);">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title style="color:#fff; font-weight:bold;">📍 Estadísticas de Ubicaciones</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="loadData()" fill="clear">
            <ion-icon name="refresh-outline" style="color:#fff;"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true" class="locations-page">
      <!-- Header con estadísticas -->
      <div class="stats-header">
        <h1>📊 Resumen de Ubicaciones</h1>
        <div class="stats-cards">
          <div class="stat-card active">
            <ion-icon name="location-outline"></ion-icon>
            <div>
              <span class="stat-number">{{ getActiveLocationsCount() }}</span>
              <span class="stat-label">Activas</span>
            </div>
          </div>
          <div class="stat-card inactive">
            <ion-icon name="location-off-outline"></ion-icon>
            <div>
              <span class="stat-number">{{ getInactiveLocationsCount() }}</span>
              <span class="stat-label">Inactivas</span>
            </div>
          </div>
          <div class="stat-card users">
            <ion-icon name="people-outline"></ion-icon>
            <div>
              <span class="stat-number">{{ getTotalAssignedUsers() }}</span>
              <span class="stat-label">Usuarios Asignados</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Refresher -->
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content
          pulling-icon="chevron-down-circle-outline"
          pulling-text="Desliza para actualizar"
          refreshing-spinner="circles"
          refreshing-text="Actualizando...">
        </ion-refresher-content>
      </ion-refresher>

      <!-- Loading -->
      <div *ngIf="loading()" class="loading-container">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p>Cargando estadísticas de ubicaciones...</p>
      </div>

      <!-- Lista de ubicaciones -->
      <div *ngIf="!loading()" class="locations-content">
        
        <!-- Ubicaciones Activas -->
        <div *ngIf="getActiveLocations().length > 0" class="section">
          <h2>🟢 Ubicaciones Activas</h2>
          
          <div class="location-card" *ngFor="let location of getActiveLocations(); trackBy: trackByLocation">
            <div class="location-header">
              <div class="location-info">
                <h3>{{ location.locationName }}</h3>
                <p *ngIf="location.locationCode" class="location-code">Código: {{ location.locationCode }}</p>
                <p *ngIf="location.description" class="location-desc">{{ location.description }}</p>
              </div>
              <div class="location-stats">
                <ion-badge color="primary">{{ location.usersCount }} usuario(s)</ion-badge>
                <ion-badge color="success">Activa</ion-badge>
              </div>
            </div>

            <!-- Usuarios asignados -->
            <div *ngIf="location.users.length > 0" class="users-section">
              <h4>👥 Usuarios Asignados</h4>
              <div class="users-list">
                <div class="user-item" *ngFor="let user of location.users">
                  <div class="user-info">
                    <div class="user-avatar">{{ getAvatarInitials(user) }}</div>
                    <div class="user-details">
                      <span class="user-name">{{ user.nombre }} {{ user.apellido }}</span>
                      <span class="user-username">{{ user.username }}</span>
                      <span class="user-role">{{ getRoleText(user.role) }}</span>
                    </div>
                  </div>
                  <div class="assignment-info">
                    <p class="assigned-date">{{ formatDate(user.assignedAt) }}</p>
                    <ion-badge [color]="user.isActive ? 'success' : 'medium'">
                      {{ user.isActive ? 'Activo' : 'Inactivo' }}
                    </ion-badge>
                  </div>
                </div>
              </div>
            </div>

            <!-- Información adicional -->
            <div class="location-footer">
              <p class="creation-date">
                <ion-icon name="calendar-outline"></ion-icon>
                Creada: {{ formatDate(location.createdAt) }}
              </p>
              <p class="update-date">
                <ion-icon name="time-outline"></ion-icon>
                Actualizada: {{ formatDate(location.updatedAt) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Ubicaciones Inactivas -->
        <div *ngIf="getInactiveLocations().length > 0" class="section">
          <h2>🔴 Ubicaciones Inactivas</h2>
          
          <div class="location-card inactive" *ngFor="let location of getInactiveLocations(); trackBy: trackByLocation">
            <div class="location-header">
              <div class="location-info">
                <h3>{{ location.locationName }}</h3>
                <p *ngIf="location.locationCode" class="location-code">Código: {{ location.locationCode }}</p>
                <p *ngIf="location.description" class="location-desc">{{ location.description }}</p>
              </div>
              <div class="location-stats">
                <ion-badge color="medium">{{ location.usersCount }} usuario(s)</ion-badge>
                <ion-badge color="danger">Inactiva</ion-badge>
              </div>
            </div>

            <!-- Usuarios que estuvieron asignados -->
            <div *ngIf="location.users.length > 0" class="users-section">
              <h4>👥 Usuarios Previamente Asignados</h4>
              <div class="users-list">
                <div class="user-item" *ngFor="let user of location.users">
                  <div class="user-info">
                    <div class="user-avatar">{{ getAvatarInitials(user) }}</div>
                    <div class="user-details">
                      <span class="user-name">{{ user.nombre }} {{ user.apellido }}</span>
                      <span class="user-username">{{ user.username }}</span>
                      <span class="user-role">{{ getRoleText(user.role) }}</span>
                    </div>
                  </div>
                  <div class="assignment-info">
                    <p class="assigned-date">{{ formatDate(user.assignedAt) }}</p>
                    <ion-badge color="medium">Histórico</ion-badge>
                  </div>
                </div>
              </div>
            </div>

            <!-- Información adicional -->
            <div class="location-footer">
              <p class="creation-date">
                <ion-icon name="calendar-outline"></ion-icon>
                Creada: {{ formatDate(location.createdAt) }}
              </p>
              <p class="update-date">
                <ion-icon name="time-outline"></ion-icon>
                Desactivada: {{ formatDate(location.updatedAt) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Estado vacío -->
        <div *ngIf="locations().length === 0" class="empty-state">
          <ion-icon name="location-outline" size="large"></ion-icon>
          <h3>📍 No hay ubicaciones registradas</h3>
          <p>Aún no se han creado ubicaciones en el sistema.</p>
          <ion-button (click)="openAssignLocationModal()" color="primary">
            <ion-icon name="add-outline" slot="start"></ion-icon>
            Asignar Primera Ubicación
          </ion-button>
        </div>

      </div>

      <!-- FAB para asignar nueva ubicación -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button (click)="openAssignLocationModal()" color="primary">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

    </ion-content>
  `,
  styles: [`
    .locations-page {
      --background: #f5f7fa;
    }

    .stats-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      margin-bottom: 1rem;
    }

    .stats-header h1 {
      margin: 0 0 1.5rem 0;
      font-size: 1.8rem;
      font-weight: 600;
    }

    .stats-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1rem;
      text-align: center;
      backdrop-filter: blur(10px);
    }

    .stat-card ion-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .stat-number {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .stat-label {
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
    }

    .loading-container p {
      margin-top: 1rem;
      color: var(--ion-color-medium);
    }

    .locations-content {
      padding: 1rem;
    }

    .section {
      margin-bottom: 2rem;
    }

    .section h2 {
      margin: 0 0 1rem 0;
      font-size: 1.4rem;
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    .location-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 1rem;
      overflow: hidden;
      border-left: 4px solid var(--ion-color-primary);
    }

    .location-card.inactive {
      border-left-color: var(--ion-color-medium);
      opacity: 0.8;
    }

    .location-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.5rem;
      border-bottom: 1px solid #f0f0f0;
    }

    .location-info h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.3rem;
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    .location-code {
      margin: 0.25rem 0;
      font-size: 0.9rem;
      color: var(--ion-color-primary);
      font-weight: 500;
    }

    .location-desc {
      margin: 0.25rem 0 0 0;
      font-size: 0.9rem;
      color: var(--ion-color-medium);
    }

    .location-stats {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-end;
    }

    .users-section {
      padding: 1.5rem;
    }

    .users-section h4 {
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    .users-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .user-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--ion-color-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }

    .user-name {
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    .user-username {
      font-size: 0.85rem;
      color: var(--ion-color-medium);
    }

    .user-role {
      font-size: 0.8rem;
      color: var(--ion-color-primary);
      font-weight: 500;
    }

    .assignment-info {
      text-align: right;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      align-items: flex-end;
    }

    .assigned-date {
      margin: 0;
      font-size: 0.8rem;
      color: var(--ion-color-medium);
    }

    .location-footer {
      padding: 1rem 1.5rem;
      background: #f8f9fa;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .location-footer p {
      margin: 0;
      font-size: 0.8rem;
      color: var(--ion-color-medium);
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .location-footer ion-icon {
      font-size: 0.9rem;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .empty-state ion-icon {
      color: var(--ion-color-medium);
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      color: var(--ion-color-dark);
    }

    .empty-state p {
      margin: 0 0 2rem 0;
      color: var(--ion-color-medium);
    }

    @media (max-width: 768px) {
      .stats-header {
        padding: 1.5rem;
      }

      .stats-cards {
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
      }

      .stat-card {
        padding: 0.75rem;
      }

      .location-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .location-stats {
        align-items: flex-start;
      }

      .user-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .assignment-info {
        align-items: flex-start;
        text-align: left;
      }

      .location-footer {
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-start;
      }
    }
  `]
})
export class LocationsStatsPage implements OnInit {
  private locationService = inject(LocationService);
  private loadingController = inject(LoadingController);
  private alertController = inject(AlertController);
  private modalController = inject(ModalController);

  // Signals
  locations = signal<LocationStatsResponse[]>([]);
  loading = signal(false);

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    
    try {
      const locationsData = await this.locationService.getAllLocations().toPromise();
      if (locationsData) {
        this.locations.set(locationsData);
      }
    } catch (error) {
      console.error('Error cargando ubicaciones:', error);
      await this.showErrorAlert('Error al cargar las estadísticas de ubicaciones');
    } finally {
      this.loading.set(false);
    }
  }

  async doRefresh(event: any) {
    await this.loadData();
    event.target.complete();
  }

  getActiveLocations(): LocationStatsResponse[] {
    return this.locations().filter(location => location.isActive);
  }

  getInactiveLocations(): LocationStatsResponse[] {
    return this.locations().filter(location => !location.isActive);
  }

  getActiveLocationsCount(): number {
    return this.getActiveLocations().length;
  }

  getInactiveLocationsCount(): number {
    return this.getInactiveLocations().length;
  }

  getTotalAssignedUsers(): number {
    return this.locations().reduce((total, location) => total + location.usersCount, 0);
  }

  getAvatarInitials(user: any): string {
    const firstName = user.nombre || '';
    const lastName = user.apellido || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || user.username?.charAt(0).toUpperCase() || '?';
  }

  getRoleText(role: string): string {
    const roleMap: { [key: string]: string } = {
      'ADMIN': '🛡️ Admin',
      'MARKET': '🏪 Gerente',
      'USER': '👤 Usuario'
    };
    return roleMap[role] || role;
  }

  formatDate(dateString: string): string {
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
      return dateString;
    }
  }

  trackByLocation(index: number, location: LocationStatsResponse): string {
    return location.locationCode || location.locationName;
  }

  async openAssignLocationModal() {
    const modal = await this.modalController.create({
      component: AssignLocationModalComponent,
      componentProps: {
        preselectedUser: null
      }
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        // Ubicación asignada exitosamente, recargar datos
        this.loadData();
      }
    });

    return await modal.present();
  }

  private async showErrorAlert(message: string) {
    const alert = await this.alertController.create({
      header: '❌ Error',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
