import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonIcon,
  IonButton,
  IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  analyticsOutline,
  barChartOutline,
  filterOutline,
  layersOutline,
  trendingUpOutline,
  statsChartOutline
} from 'ionicons/icons';

export interface TabItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

@Component({
  selector: 'app-modern-tabs',
  standalone: true,
  imports: [
    CommonModule,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonIcon,
    IonButton,
    IonBadge
  ],
  template: `
    <div class="modern-tabs-container" style="width: 100%; min-height: 100%; background: #000;">
      <!-- Glass Tab Navigation -->
      <div class="glass-tab-nav">
        <ion-segment 
          [value]="activeTab()" 
          (ionChange)="onTabChange($event)"
          class="glass-segment">
          <ion-segment-button 
            *ngFor="let tab of tabs" 
            [value]="tab.id"
            [disabled]="tab.disabled"
            class="glass-tab-button"
            [class.active]="activeTab() === tab.id">
            
            <div class="tab-content">
              <ion-icon [name]="tab.icon" class="tab-icon"></ion-icon>
              <ion-label class="tab-label">{{ tab.label }}</ion-label>
              <ion-badge 
                *ngIf="tab.badge && tab.badge > 0" 
                [color]="tab.color || 'primary'"
                class="tab-badge">
                {{ tab.badge }}
              </ion-badge>
            </div>
            
            <!-- Active indicator -->
            <div class="active-indicator" *ngIf="activeTab() === tab.id"></div>
          </ion-segment-button>
        </ion-segment>
      </div>

      <!-- Tab Content with Glass Effect -->
      <div class="tab-content-container">
        <div class="glass-content-wrapper">
          <ng-content></ng-content>
        </div>
      </div>

      <!-- Tab Controls -->
      <div class="tab-controls" *ngIf="showControls">
        <ion-button 
          fill="clear" 
          size="small"
          (click)="previousTabClick()"
          [disabled]="isFirstTab()">
          <ion-icon name="chevron-back-outline" slot="icon-only"></ion-icon>
        </ion-button>
        
        <span class="tab-indicator">
          {{ getCurrentTabIndex() + 1 }} / {{ tabs.length }}
        </span>
        
        <ion-button 
          fill="clear" 
          size="small"
          (click)="nextTabClick()"
          [disabled]="isLastTab()">
          <ion-icon name="chevron-forward-outline" slot="icon-only"></ion-icon>
        </ion-button>
      </div>
    </div>
  `,
  styles: [`
    .modern-tabs-container {
      width: 100%;
      min-height: 100%;
      display: flex;
      flex-direction: column;
    }

    /* Glass Tab Navigation */
    .glass-tab-nav {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgb(0,0,0);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      padding: 8px 16px;
      margin-bottom: 16px;
    }

    .glass-segment {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .glass-tab-button {
      --background: transparent;
      --background-checked: rgba(var(--ion-color-primary-rgb), 0.2);
      --border-radius: 12px;
      --color: var(--ion-color-medium);
      --color-checked: var(--ion-color-primary);
      margin: 4px;
      min-height: 60px;
      position: relative;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .glass-tab-button.active {
      background: rgba(var(--ion-color-primary-rgb), 0.15);
      box-shadow: 
        0 4px 20px rgba(var(--ion-color-primary-rgb), 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    .tab-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      position: relative;
    }

    .tab-icon {
      font-size: 20px;
      transition: all 0.3s ease;
    }

    .glass-tab-button.active .tab-icon {
      transform: scale(1.1);
      color: var(--ion-color-primary);
    }

    .tab-label {
      font-size: 12px;
      font-weight: 500;
      transition: all 0.3s ease;
      white-space: nowrap;
    }

    .glass-tab-button.active .tab-label {
      font-weight: 600;
      color: var(--ion-color-primary);
    }

    .tab-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 18px;
      height: 18px;
      font-size: 10px;
      border-radius: 9px;
    }

    .active-indicator {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 24px;
      height: 3px;
      background: linear-gradient(90deg, 
        var(--ion-color-primary), 
        var(--ion-color-secondary));
      border-radius: 2px 2px 0 0;
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from {
        width: 0;
        opacity: 0;
      }
      to {
        width: 24px;
        opacity: 1;
      }
    }

    /* Tab Content */
    .tab-content-container {
      flex: 1;
      position: relative;
      min-height: 400px;
    }

    .tab-pane {
      display: none;
      width: 100%;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .tab-pane.active {
      display: block;
      opacity: 1;
      transform: translateY(0);
      animation: fadeInUp 0.3s ease-out;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .glass-content-wrapper {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 
        0 20px 40px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
      padding: 20px;
      margin: 0 16px;
      min-height: 400px;
    }

    /* Tab Controls */
    .tab-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      margin-top: 16px;
    }

    .tab-indicator {
      font-size: 14px;
      color: var(--ion-color-medium);
      font-weight: 500;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .glass-tab-nav {
        padding: 4px 8px;
      }

      .tab-content {
        padding: 6px 8px;
      }

      .tab-label {
        font-size: 11px;
      }

      .tab-icon {
        font-size: 18px;
      }

      .glass-content-wrapper {
        margin: 0 8px;
        padding: 16px;
        border-radius: 16px;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .glass-tab-nav {
        background: rgb(0,0,0);
        border-bottom-color: rgba(255, 255, 255, 0.1);
      }

      .glass-segment {
        background: rgba(0, 0, 0, 0.1);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .glass-content-wrapper {
        background: rgba(0, 0, 0, 0.1);
        border-color: rgba(255, 255, 255, 0.1);
      }
    }
  `]
})
export class ModernTabsComponent {
  @Input() tabs: TabItem[] = [];
  @Input() showControls: boolean = false;
  @Input() initialTab: string = '';
  
  @Output() tabChange = new EventEmitter<string>();
  @Output() tabChanged = new EventEmitter<{ previous: string; current: string }>();

  activeTab = signal<string>('');
  previousTab = signal<string>('');

  constructor() {
    addIcons({
      analyticsOutline,
      barChartOutline,
      filterOutline,
      layersOutline,
      trendingUpOutline,
      statsChartOutline
    });
  }

  ngOnInit() {
    if (this.initialTab) {
      this.activeTab.set(this.initialTab);
    } else if (this.tabs.length > 0) {
      this.activeTab.set(this.tabs[0].id);
    }
  }

  onTabChange(event: any) {
    const newTab = event.detail.value;
    this.changeTab(newTab);
  }

  private changeTab(newTab: string) {
    if (newTab === this.activeTab()) return;

    const oldTab = this.activeTab();
    this.previousTab.set(oldTab);
    this.activeTab.set(newTab);

    this.tabChange.emit(newTab);
    this.tabChanged.emit({ previous: oldTab, current: newTab });
  }

  getCurrentTabIndex(): number {
    return this.tabs.findIndex(tab => tab.id === this.activeTab());
  }

  isFirstTab(): boolean {
    return this.getCurrentTabIndex() === 0;
  }

  isLastTab(): boolean {
    return this.getCurrentTabIndex() === this.tabs.length - 1;
  }

  previousTabClick() {
    const currentIndex = this.getCurrentTabIndex();
    if (currentIndex > 0) {
      this.changeTab(this.tabs[currentIndex - 1].id);
    }
  }

  nextTabClick() {
    const currentIndex = this.getCurrentTabIndex();
    if (currentIndex < this.tabs.length - 1) {
      this.changeTab(this.tabs[currentIndex + 1].id);
    }
  }
}
