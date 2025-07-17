import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { Role } from './shared/enums';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.page').then(m => m.DashboardPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'reportes',
    loadComponent: () => import('./features/reportes/reportes.page').then(m => m.ReportesPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'usuarios',
    loadChildren: () => import('./features/usuarios/usuarios.routes').then(m => m.routes),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Role.ADMIN] }
  },
  {
    path: 'mercados',
    loadChildren: () => import('./features/mercados/mercados.routes').then(m => m.routes),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Role.ADMIN, Role.MARKET] }
  },
  {
    path: 'locales',
    loadChildren: () => import('./features/locales/locales.routes').then(m => m.routes),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Role.ADMIN, Role.MARKET, Role.USER] }
  },
  {
    path: 'facturas',
    loadChildren: () => import('./features/facturas/facturas.routes').then(m => m.routes),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Role.ADMIN, Role.MARKET, Role.USER] }
  },
  {
    path: 'auditoria',
    loadChildren: () => import('./features/auditoria/auditoria.routes').then(m => m.routes),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Role.ADMIN] }
  },
  {
    path: 'bluetooth',
    loadChildren: () => import('./features/bluetooth/bluetooth.routes').then(m => m.routes),
    canActivate: [AuthGuard]
  },
  {
    path: 'perfil',
    loadComponent: () => import('./features/profile/profile.page').then(m => m.ProfilePage),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
