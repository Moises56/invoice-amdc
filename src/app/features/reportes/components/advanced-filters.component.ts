import { Component, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonChip,
  IonCheckbox,
  IonRange,
  IonDatetime,
  IonToggle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  filterOutline, 
  calendarOutline, 
  businessOutline,
  closeOutline,
  checkmarkOutline,
  refreshOutline
} from 'ionicons/icons';

export interface ReportFilter {
  dateRange: {
    start: string;
    end: string;
    preset: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  };
  markets: string[];
  locals: string[];
  categories: string[];
  amountRange: {
    min: number;
    max: number;
  };
  includeUnpaid: boolean;
  groupBy: 'date' | 'market' | 'local' | 'category';
  sortBy: 'amount' | 'date' | 'name';
  sortOrder: 'asc' | 'desc';
}

@Component({
  selector: 'app-advanced-filters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonChip,
    IonCheckbox,
    IonRange,
    IonDatetime,
    IonToggle
  ],
  template: `
    <ion-card class="advanced-filters-card">
      <ion-card-header>
        <ion-card-title class="flex items-center justify-between">
          <span class="flex items-center">
            <ion-icon name="filter-outline" class="mr-2"></ion-icon>
            Filtros Avanzados
          </span>
          <ion-button 
            fill="clear" 
            size="small"
            (click)="resetFilters()"
            class="reset-btn">
            <ion-icon name="refresh-outline" slot="start"></ion-icon>
            Limpiar
          </ion-button>
        </ion-card-title>
      </ion-card-header>

      <ion-card-content class="filter-content">
        <!-- Rango de fechas -->
        <div class="filter-section">
          <h4 class="filter-title">Período de Tiempo</h4>
          
          <div class="date-presets mb-3">
            <ion-chip 
              *ngFor="let preset of datePresets" 
              [class.selected]="filters().dateRange.preset === preset.value"
              (click)="setDatePreset(preset.value)">
              {{ preset.label }}
            </ion-chip>
          </div>

          <div *ngIf="filters().dateRange.preset === 'custom'" class="custom-dates">
            <ion-item>
              <ion-label position="stacked">Fecha Inicio</ion-label>
              <ion-datetime 
                presentation="date"
                [value]="filters().dateRange.start"
                (ionChange)="updateDateRange('start', $event)">
              </ion-datetime>
            </ion-item>
            
            <ion-item>
              <ion-label position="stacked">Fecha Fin</ion-label>
              <ion-datetime 
                presentation="date"
                [value]="filters().dateRange.end"
                (ionChange)="updateDateRange('end', $event)">
              </ion-datetime>
            </ion-item>
          </div>
        </div>

        <!-- Mercados y Locales -->
        <div class="filter-section">
          <h4 class="filter-title">Ubicaciones</h4>
          
          <ion-item>
            <ion-label>Mercados</ion-label>
            <ion-select 
              multiple="true" 
              [value]="filters().markets"
              (ionChange)="updateMarkets($event.detail.value)">
              <ion-select-option *ngFor="let market of availableMarkets()" [value]="market.id">
                {{ market.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-label>Locales</ion-label>
            <ion-select 
              multiple="true" 
              [value]="filters().locals"
              (ionChange)="updateLocals($event.detail.value)">
              <ion-select-option *ngFor="let local of availableLocals()" [value]="local.id">
                {{ local.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </div>

        <!-- Rango de montos -->
        <div class="filter-section">
          <h4 class="filter-title">Rango de Montos</h4>
          
          <div class="amount-range">
            <ion-range 
              dual-knobs="true"
              [min]="0"
              [max]="500000"
              [step]="1000"
              [value]="{ lower: filters().amountRange.min, upper: filters().amountRange.max }"
              (ionChange)="updateAmountRange($event)"
              color="primary">
              <ion-label slot="start">L. 0</ion-label>
              <ion-label slot="end">L. 500K</ion-label>
            </ion-range>
            
            <div class="range-values">
              <span>L. {{ formatCurrency(filters().amountRange.min) }}</span>
              <span>-</span>
              <span>L. {{ formatCurrency(filters().amountRange.max) }}</span>
            </div>
          </div>
        </div>

        <!-- Opciones adicionales -->
        <div class="filter-section">
          <h4 class="filter-title">Opciones</h4>
          
          <ion-item>
            <ion-checkbox 
              [checked]="filters().includeUnpaid"
              (ionChange)="updateIncludeUnpaid($event.detail.checked)">
            </ion-checkbox>
            <ion-label class="ml-3">Incluir facturas no pagadas</ion-label>
          </ion-item>

          <ion-item>
            <ion-label>Agrupar por</ion-label>
            <ion-select 
              [value]="filters().groupBy"
              (ionChange)="updateGroupBy($event.detail.value)">
              <ion-select-option value="date">Fecha</ion-select-option>
              <ion-select-option value="market">Mercado</ion-select-option>
              <ion-select-option value="local">Local</ion-select-option>
              <ion-select-option value="category">Categoría</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-label>Ordenar por</ion-label>
            <ion-select 
              [value]="filters().sortBy"
              (ionChange)="updateSortBy($event.detail.value)">
              <ion-select-option value="amount">Monto</ion-select-option>
              <ion-select-option value="date">Fecha</ion-select-option>
              <ion-select-option value="name">Nombre</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-toggle 
              [checked]="filters().sortOrder === 'desc'"
              (ionChange)="updateSortOrder($event.detail.checked ? 'desc' : 'asc')">
            </ion-toggle>
            <ion-label class="ml-3">Orden descendente</ion-label>
          </ion-item>
        </div>

        <!-- Botones de acción -->
        <div class="filter-actions">
          <ion-button 
            expand="block" 
            (click)="applyFilters()"
            class="apply-btn">
            <ion-icon name="checkmark-outline" slot="start"></ion-icon>
            Aplicar Filtros
          </ion-button>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .advanced-filters-card {
      margin: 16px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .filter-content {
      padding: 0;
    }

    .filter-section {
      padding: 16px;
      border-bottom: 1px solid var(--ion-color-light);
    }

    .filter-section:last-child {
      border-bottom: none;
    }

    .filter-title {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    .date-presets {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }

    .date-presets ion-chip {
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .date-presets ion-chip.selected {
      --background: var(--ion-color-primary);
      --color: white;
    }

    .amount-range {
      padding: 8px 0;
    }

    .range-values {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      font-size: 12px;
      color: var(--ion-color-medium);
    }

    .filter-actions {
      padding: 16px;
    }

    .apply-btn {
      --background: var(--ion-color-success);
      margin: 0;
    }

    .reset-btn {
      --color: var(--ion-color-medium);
    }

    .custom-dates {
      display: grid;
      gap: 8px;
    }

    @media (max-width: 768px) {
      .advanced-filters-card {
        margin: 8px;
      }
      
      .date-presets {
        justify-content: center;
      }
    }
  `]
})
export class AdvancedFiltersComponent {
  @Output() filtersChange = new EventEmitter<ReportFilter>();

  filters = signal<ReportFilter>({
    dateRange: {
      start: new Date().toISOString(),
      end: new Date().toISOString(),
      preset: 'month'
    },
    markets: [],
    locals: [],
    categories: [],
    amountRange: {
      min: 0,
      max: 500000
    },
    includeUnpaid: false,
    groupBy: 'date',
    sortBy: 'amount',
    sortOrder: 'desc'
  });

  datePresets = [
    { label: 'Hoy', value: 'today' as const },
    { label: 'Esta Semana', value: 'week' as const },
    { label: 'Este Mes', value: 'month' as const },
    { label: 'Este Trimestre', value: 'quarter' as const },
    { label: 'Este Año', value: 'year' as const },
    { label: 'Personalizado', value: 'custom' as const }
  ];

  availableMarkets = computed(() => [
    { id: 'central', name: 'Mercado Central' },
    { id: 'andes', name: 'Mercado Los Andes' },
    { id: 'guamilito', name: 'Mercado Guamilito' },
    { id: 'belen', name: 'Mercado Zonal Belén' }
  ]);

  availableLocals = computed(() => [
    { id: 'local1', name: 'Local A-1' },
    { id: 'local2', name: 'Local B-2' },
    { id: 'local3', name: 'Local C-3' },
    { id: 'local4', name: 'Local D-4' }
  ]);

  constructor() {
    addIcons({
      filterOutline,
      calendarOutline,
      businessOutline,
      closeOutline,
      checkmarkOutline,
      refreshOutline
    });
  }

  setDatePreset(preset: ReportFilter['dateRange']['preset']) {
    const now = new Date();
    let start: Date;
    let end = new Date(now);

    switch (preset) {
      case 'today':
        start = new Date(now);
        break;
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        start = new Date(now.getFullYear(), quarterStart, 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(now);
    }

    this.filters.update(f => ({
      ...f,
      dateRange: {
        ...f.dateRange,
        start: start.toISOString(),
        end: end.toISOString(),
        preset
      }
    }));
  }

  updateDateRange(type: 'start' | 'end', event: any) {
    this.filters.update(f => ({
      ...f,
      dateRange: {
        ...f.dateRange,
        [type]: event.detail.value
      }
    }));
  }

  updateMarkets(markets: string[]) {
    this.filters.update(f => ({ ...f, markets }));
  }

  updateLocals(locals: string[]) {
    this.filters.update(f => ({ ...f, locals }));
  }

  updateAmountRange(event: any) {
    const { lower, upper } = event.detail.value;
    this.filters.update(f => ({
      ...f,
      amountRange: { min: lower, max: upper }
    }));
  }

  updateIncludeUnpaid(includeUnpaid: boolean) {
    this.filters.update(f => ({ ...f, includeUnpaid }));
  }

  updateGroupBy(groupBy: ReportFilter['groupBy']) {
    this.filters.update(f => ({ ...f, groupBy }));
  }

  updateSortBy(sortBy: ReportFilter['sortBy']) {
    this.filters.update(f => ({ ...f, sortBy }));
  }

  updateSortOrder(sortOrder: ReportFilter['sortOrder']) {
    this.filters.update(f => ({ ...f, sortOrder }));
  }

  formatCurrency(amount: number): string {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + 'M';
    } else if (amount >= 1000) {
      return (amount / 1000).toFixed(0) + 'K';
    }
    return amount.toString();
  }

  resetFilters() {
    this.filters.set({
      dateRange: {
        start: new Date().toISOString(),
        end: new Date().toISOString(),
        preset: 'month'
      },
      markets: [],
      locals: [],
      categories: [],
      amountRange: {
        min: 0,
        max: 500000
      },
      includeUnpaid: false,
      groupBy: 'date',
      sortBy: 'amount',
      sortOrder: 'desc'
    });
  }

  applyFilters() {
    this.filtersChange.emit(this.filters());
  }
}
