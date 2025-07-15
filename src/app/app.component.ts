import { Component, inject, OnInit } from '@angular/core';
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
  settingsOutline
} from 'ionicons/icons';
import { AuthService } from './core/services/auth.service';
import { Role } from './shared/enums';

interface MenuItem {
  title: string;
  url: string;
  icon: string;
  roles?: Role[];
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

  // Computed signals
  user = this.authService.user;
  isAuthenticated = this.authService.isAuthenticated;
  userRole = this.authService.userRole;
  userName = this.authService.userName;

  menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: 'home-outline'
    },
    {
      title: 'Usuarios',
      url: '/usuarios',
      icon: 'people-outline',
      roles: [Role.ADMIN]
    },
    {
      title: 'Mercados',
      url: '/mercados',
      icon: 'business-outline',
      roles: [Role.ADMIN, Role.MARKET]
    },
    {
      title: 'Locales',
      url: '/locales',
      icon: 'storefront-outline',
      roles: [Role.ADMIN, Role.MARKET, Role.USER]
    },
    {
      title: 'Facturas',
      url: '/facturas',
      icon: 'receipt-outline',
      roles: [Role.ADMIN, Role.MARKET, Role.USER]
    },
    {
      title: 'Auditoría',
      url: '/auditoria',
      icon: 'analytics-outline',
      roles: [Role.ADMIN]
    },
    {
      title: 'Bluetooth',
      url: '/bluetooth',
      icon: 'bluetooth-outline'
    }
  ];

  constructor() {
    addIcons({
      homeOutline,
      businessOutline,
      storefrontOutline,
      receiptOutline,
      peopleOutline,
      analyticsOutline,
      bluetoothOutline,
      personOutline,
      logOutOutline,
      settingsOutline
    });
  }

  ngOnInit() {
    // Redireccionar al login si no está autenticado
    if (!this.isAuthenticated() && this.router.url !== '/login') {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Verificar si el usuario tiene acceso a un item del menú
   */
  hasAccess(item: MenuItem): boolean {
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    return this.authService.hasAnyRole(item.roles);
  }

  /**
   * Navegar a una página
   */
  navigateTo(url: string): void {
    this.router.navigate([url]);
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
