import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { LocationService } from '../../shared/services/location.service';
import { LocationStats, TopLocation, LocationDistribution } from '../../shared/interfaces/user.interface';

@Component({
  selector: 'app-location-stats-widget',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-card class="location-stats-card">
      <ion-card-header>
        <ion-card-title>
          <ion-icon name="location-outline"></ion-icon>
          Estadísticas de Ubicaciones
        </ion-card-title>
      </ion-card-header>

      <ion-card-content>
        <div *ngIf="loading()" class="loading-container">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando estadísticas...</p>
        </div>

        <div *ngIf="!loading() && stats()" class="stats-content">
          <!-- Resumen General -->
          <div class="stats-overview">
            <div class="stat-item">
              <div class="stat-value">{{ stats()?.totalLocations || 0 }}</div>
              <div class="stat-label">Ubicaciones Totales</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-value">{{ stats()?.usersWithLocation || 0 }}</div>
              <div class="stat-label">Usuarios Asignados</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-value warning">{{ stats()?.usersWithoutLocation || 0 }}</div>
              <div class="stat-label">Sin Ubicación</div>
            </div>
          </div>

          <!-- Top Ubicaciones -->
          <div class="top-locations" *ngIf="stats()?.topLocations?.length">
            <h3>📍 Top Ubicaciones</h3>
            <div class="location-list">
              <div 
                *ngFor="let location of stats()?.topLocations?.slice(0, 3)" 
                class="location-item"
              >
                <div class="location-info">
                  <div class="location-name">
                    {{ location.locationName }}
                    <span *ngIf="location.locationCode" class="location-code">
                      ({{ location.locationCode }})
                    </span>
                  </div>
                  <div class="location-stats">
                    <span class="user-count">👥 {{ location.userCount }}</span>
                    <span class="consulta-count">📊 {{ location.totalConsultas }}</span>
                  </div>
                </div>
                <div class="location-percentage">
                  {{ getLocationPercentage(location.userCount) }}%
                </div>
              </div>
            </div>
          </div>

          <!-- Distribución Visual -->
          <div class="distribution-chart" *ngIf="stats()?.locationDistribution?.length">
            <h3>📊 Distribución por Ubicación</h3>
            <div class="chart-bars">
              <div 
                *ngFor="let dist of stats()?.locationDistribution?.slice(0, 5)" 
                class="chart-bar"
              >
                <div class="bar-container">
                  <div 
                    class="bar-fill" 
                    [style.width.%]="dist.percentage"
                    [style.background-color]="getBarColor(dist.percentage)"
                  ></div>
                </div>
                <div class="bar-label">
                  <span class="location-name">{{ dist.locationName }}</span>
                  <span class="percentage">{{ dist.percentage.toFixed(1) }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Asignaciones Recientes -->
          <div class="recent-assignments" *ngIf="stats()?.recentAssignments?.length">
            <h3>🕒 Asignaciones Recientes</h3>
            <div class="assignment-list">
              <div 
                *ngFor="let assignment of stats()?.recentAssignments?.slice(0, 3)" 
                class="assignment-item"
              >
                <div class="assignment-info">
                  <div class="username">{{ assignment.username }}</div>
                  <div class="assignment-details">
                    <span class="location">{{ assignment.locationName }}</span>
                    <span class="timestamp">{{ formatDate(assignment.assignedAt) }}</span>
                  </div>
                </div>
                <div class="assigned-by">
                  Por: {{ assignment.assignedBy }}
                </div>
              </div>
            </div>
          </div>

          <!-- Acciones Rápidas -->
          <div class="quick-actions">
            <ion-button 
              fill="outline" 
              size="small"
              (click)="refreshStats()"
              [disabled]="loading()"
            >
              <ion-icon name="refresh-outline" slot="start"></ion-icon>
              Actualizar
            </ion-button>
            
            <ion-button 
              fill="outline" 
              size="small"
              (click)="viewAllLocations()"
            >
              <ion-icon name="list-outline" slot="start"></ion-icon>
              Ver Todo
            </ion-button>
          </div>
        </div>

        <div *ngIf="!loading() && !stats()" class="empty-state">
          <ion-icon name="location-outline" class="empty-icon"></ion-icon>
          <p>No hay datos de ubicaciones disponibles</p>
          <ion-button fill="outline" (click)="refreshStats()">
            <ion-icon name="refresh-outline" slot="start"></ion-icon>
            Recargar
          </ion-button>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .location-stats-card {
      margin: 16px 0;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      
      ion-card-header {
        background: linear-gradient(135deg, #8b5cf6, #3b82f6);
        color: white;
        
        ion-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.1rem;
          font-weight: 600;
        }
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      
      ion-spinner {
        margin-bottom: 1rem;
      }
      
      p {
        color: var(--ion-color-medium);
        margin: 0;
      }
    }

    .stats-overview {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
      
      .stat-item {
        text-align: center;
        padding: 1rem;
        background: rgba(139, 92, 246, 0.1);
        border-radius: 12px;
        
        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--ion-color-primary);
          
          &.warning {
            color: var(--ion-color-warning);
          }
        }
        
        .stat-label {
          font-size: 0.8rem;
          color: var(--ion-color-medium);
          margin-top: 0.5rem;
        }
      }
    }

    .top-locations,
    .distribution-chart,
    .recent-assignments {
      margin-bottom: 1.5rem;
      
      h3 {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--ion-color-dark);
      }
    }

    .location-list {
      .location-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 8px;
        margin-bottom: 0.5rem;
        border-left: 4px solid var(--ion-color-primary);
        
        .location-info {
          .location-name {
            font-weight: 600;
            margin-bottom: 0.25rem;
            
            .location-code {
              color: var(--ion-color-medium);
              font-weight: normal;
            }
          }
          
          .location-stats {
            display: flex;
            gap: 1rem;
            font-size: 0.8rem;
            color: var(--ion-color-medium);
          }
        }
        
        .location-percentage {
          font-weight: 700;
          color: var(--ion-color-primary);
        }
      }
    }

    .chart-bars {
      .chart-bar {
        margin-bottom: 1rem;
        
        .bar-container {
          height: 8px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
          
          .bar-fill {
            height: 100%;
            transition: width 0.3s ease;
            border-radius: 4px;
          }
        }
        
        .bar-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          
          .location-name {
            color: var(--ion-color-dark);
          }
          
          .percentage {
            color: var(--ion-color-medium);
            font-weight: 600;
          }
        }
      }
    }

    .assignment-list {
      .assignment-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        background: rgba(45, 211, 111, 0.1);
        border-radius: 8px;
        margin-bottom: 0.5rem;
        border-left: 4px solid var(--ion-color-success);
        
        .assignment-info {
          .username {
            font-weight: 600;
            margin-bottom: 0.25rem;
          }
          
          .assignment-details {
            display: flex;
            gap: 1rem;
            font-size: 0.8rem;
            color: var(--ion-color-medium);
            
            .location {
              color: var(--ion-color-primary);
            }
          }
        }
        
        .assigned-by {
          font-size: 0.8rem;
          color: var(--ion-color-medium);
        }
      }
    }

    .quick-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
      margin-top: 1rem;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      
      .empty-icon {
        font-size: 3rem;
        color: var(--ion-color-medium);
        margin-bottom: 1rem;
      }
      
      p {
        color: var(--ion-color-medium);
        margin-bottom: 1rem;
      }
    }

    @media (max-width: 768px) {
      .stats-overview {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }
      
      .location-item,
      .assignment-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }
  `]
})
export class LocationStatsWidgetComponent implements OnInit {
  private locationService = inject(LocationService);

  // Signals
  stats = signal<LocationStats | null>(null);
  loading = signal(false);

  ngOnInit() {
    this.loadStats();
  }

  async loadStats() {
    this.loading.set(true);
    try {
      // Simular datos para el widget - en producción sería una llamada al backend
      await this.simulateLocationStats();
    } catch (error) {
      console.error('Error cargando estadísticas de ubicación:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private async simulateLocationStats() {
    // Simular llamada al backend
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockStats: LocationStats = {
      totalLocations: 8,
      usersWithLocation: 24,
      usersWithoutLocation: 6,
      topLocations: [
        {
          locationName: 'Mercado Central',
          locationCode: 'MC01',
          userCount: 8,
          totalConsultas: 1250,
          consultasEC: 780,
          consultasICS: 470,
          avgResponseTime: 1.2,
          lastActivity: new Date().toISOString()
        },
        {
          locationName: 'Oficina Principal',
          locationCode: 'OF01',
          userCount: 6,
          totalConsultas: 980,
          consultasEC: 620,
          consultasICS: 360,
          avgResponseTime: 0.8,
          lastActivity: new Date().toISOString()
        },
        {
          locationName: 'Sucursal Norte',
          locationCode: 'SN01',
          userCount: 5,
          totalConsultas: 750,
          consultasEC: 450,
          consultasICS: 300,
          avgResponseTime: 1.5,
          lastActivity: new Date().toISOString()
        }
      ],
      locationDistribution: [
        { locationName: 'Mercado Central', userCount: 8, percentage: 33.3, consultasCount: 1250 },
        { locationName: 'Oficina Principal', userCount: 6, percentage: 25.0, consultasCount: 980 },
        { locationName: 'Sucursal Norte', userCount: 5, percentage: 20.8, consultasCount: 750 },
        { locationName: 'Sucursal Sur', userCount: 3, percentage: 12.5, consultasCount: 450 },
        { locationName: 'Punto Móvil', userCount: 2, percentage: 8.3, consultasCount: 200 }
      ],
      recentAssignments: [
        {
          id: '1',
          username: 'carlos.mendez',
          locationName: 'Mercado Central',
          locationCode: 'MC01',
          assignedBy: 'admin',
          assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          username: 'ana.rodriguez',
          locationName: 'Oficina Principal',
          assignedBy: 'admin',
          assignedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          username: 'luis.garcia',
          locationName: 'Sucursal Norte',
          locationCode: 'SN01',
          assignedBy: 'admin',
          assignedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

    this.stats.set(mockStats);
  }

  getLocationPercentage(userCount: number): number {
    const total = this.stats()?.usersWithLocation || 1;
    return Math.round((userCount / total) * 100);
  }

  getBarColor(percentage: number): string {
    if (percentage >= 30) return '#10b981'; // Verde
    if (percentage >= 20) return '#3b82f6'; // Azul
    if (percentage >= 10) return '#f59e0b'; // Naranja
    return '#ef4444'; // Rojo
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Hace menos de 1h';
    if (diffHours < 24) return `Hace ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  }

  async refreshStats() {
    await this.loadStats();
  }

  viewAllLocations() {
    // Navegar a la vista completa de ubicaciones
    console.log('🔍 Navegando a vista completa de ubicaciones');
  }
}
