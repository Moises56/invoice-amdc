import { Component, computed, inject } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, documentTextOutline, shieldCheckmarkOutline, bluetoothOutline, personCircleOutline, statsChartOutline, peopleOutline, businessOutline, documentAttachOutline } from 'ionicons/icons';
import { AuthService } from '../core/services/auth.service';
import { Role } from '../shared/enums';
import { CommonModule } from '@angular/common';

interface Tab {
  name: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, CommonModule],
})
export class TabsPage {
  private authService = inject(AuthService);
  
  userTabs: Tab[] = [
    { name: 'Dashboard', path: '/dashboard/user', icon: 'home-outline' },
    { name: 'Estado Cuenta', path: '/estado-cuenta', icon: 'document-text-outline' },
    { name: 'Amnistía', path: '/estado-cuenta-amnistia', icon: 'shield-checkmark-outline' },
    { name: 'Bluetooth', path: '/bluetooth', icon: 'bluetooth-outline' },
    { name: 'Perfil', path: '/perfil', icon: 'person-circle-outline' },
  ];

  adminTabs: Tab[] = [
    { name: 'Dashboard', path: '/dashboard', icon: 'stats-chart-outline' },
    { name: 'Usuarios', path: '/usuarios', icon: 'people-outline' },
    { name: 'Mercados', path: '/mercados', icon: 'business-outline' },
    { name: 'Reportes', path: '/reportes', icon: 'document-attach-outline' },
    { name: 'Perfil', path: '/perfil', icon: 'person-circle-outline' },
  ];

  marketTabs: Tab[] = [
    { name: 'Dashboard', path: '/dashboard', icon: 'stats-chart-outline' },
    { name: 'Locales', path: '/locales', icon: 'business-outline' },
    { name: 'Facturas', path: '/facturas', icon: 'document-text-outline' },
    { name: 'Reportes', path: '/reportes', icon: 'document-attach-outline' },
    { name: 'Perfil', path: '/perfil', icon: 'person-circle-outline' },
  ];

  visibleTabs = computed(() => {
    const userRole = this.authService.userRole();
    switch (userRole) {
      case Role.ADMIN:
        return this.adminTabs;
      case Role.MARKET:
        return this.marketTabs;
      case Role.USER:
        return this.userTabs;
      default:
        return [];
    }
  });

  constructor() {
    addIcons({ homeOutline, documentTextOutline, shieldCheckmarkOutline, bluetoothOutline, personCircleOutline, statsChartOutline, peopleOutline, businessOutline, documentAttachOutline });
  }
}
