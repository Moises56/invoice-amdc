import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonApp, 
  IonRouterOutlet, 
  IonMenu, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonList, 
  IonItem, 
  IonIcon, 
  IonLabel,
  IonMenuToggle,
  MenuController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  homeOutline, 
  businessOutline, 
  storefrontOutline, 
  receiptOutline, 
  peopleOutline,
  analyticsOutline,
  bluetoothOutline,
  personOutline,
  logOutOutline,
  settingsOutline,
  documentTextOutline,
  shieldCheckmarkOutline,
  statsChartOutline,
  documentAttachOutline,
  ribbonOutline
} from 'ionicons/icons';
import { AuthService } from './core/services/auth.service';
import { Role } from './shared/enums';

interface MenuItem {
  title: string;
  url: string;
  icon: string;
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonApp,
    IonRouterOutlet, 
    IonMenu, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonList, 
    IonItem, 
    IonIcon, 
    IonLabel,
    IonMenuToggle
  ],
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private menuController = inject(MenuController);

  // Signals
  user = this.authService.user;
  isAuthenticated = this.authService.isAuthenticated;
  userName = this.authService.userName;
  userRole = this.authService.userRole;

  private adminMenu: MenuItem[] = [
    { title: 'Dashboard', url: '/dashboard', icon: 'stats-chart-outline' },
    { title: 'Usuarios', url: '/usuarios', icon: 'people-outline' },
    { title: 'Mercados', url: '/mercados', icon: 'business-outline' },
    { title: 'Locales', url: '/locales', icon: 'storefront-outline' },
    { title: 'Facturas', url: '/facturas', icon: 'receipt-outline' },
    { title: 'Reportes', url: '/reportes', icon: 'document-attach-outline' },
    { title: 'Auditoría', url: '/auditoria', icon: 'analytics-outline' },
    { title: 'Config. Bluetooth', url: '/bluetooth', icon: 'bluetooth-outline' },
  ];

  private marketMenu: MenuItem[] = [
    { title: 'Dashboard', url: '/dashboard', icon: 'stats-chart-outline' },
    { title: 'Mercados', url: '/mercados', icon: 'business-outline' },
    { title: 'Locales', url: '/locales', icon: 'storefront-outline' },
    { title: 'Facturas', url: '/facturas', icon: 'receipt-outline' },
    { title: 'Reportes', url: '/reportes', icon: 'document-attach-outline' },
    { title: 'Config. Bluetooth', url: '/bluetooth', icon: 'bluetooth-outline' },
  ];

  private userMenu: MenuItem[] = [
    { title: 'Mi Dashboard', url: '/dashboard/user', icon: 'home-outline' },
    { title: 'Estado de Cuenta', url: '/estado-cuenta', icon: 'document-text-outline' },
    { title: 'Cuenta con Amnistía', url: '/estado-cuenta-amnistia', icon: 'shield-checkmark-outline' },
    { title: 'Consulta ICS', url: '/consulta-ics', icon: 'business-outline' },
    { title: 'ICS con Amnistía', url: '/consulta-ics-amnistia', icon: 'ribbon-outline' },
    { title: 'Config. Bluetooth', url: '/bluetooth', icon: 'bluetooth-outline' },
  ];

  visibleMenuItems = computed(() => {
    const role = this.authService.userRole();
    switch (role) {
      case Role.ADMIN:
        return this.adminMenu;
      case Role.MARKET:
        return this.marketMenu;
      case Role.USER:
        return this.userMenu;
      default:
        return [];
    }
  });

  constructor() {
    addIcons({
      homeOutline, businessOutline, storefrontOutline, receiptOutline, 
      peopleOutline, analyticsOutline, bluetoothOutline, personOutline, 
      logOutOutline, settingsOutline, documentTextOutline, shieldCheckmarkOutline,
      statsChartOutline, documentAttachOutline, ribbonOutline
    });
  }

  ngOnInit() {
    // La lógica de redirección ahora está en los guards
  }

  /**
   * Navegar a una página
   */
  navigateTo(url: string): void {
    this.router.navigateByUrl(url);
    this.menuController.close();
  }

  /**
   * Ir al perfil
   */
  goToProfile(): void {
    this.router.navigate(['/perfil']);
    this.menuController.close();
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.authService.logout().subscribe();
    this.menuController.close();
  }
}
