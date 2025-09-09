import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { Role } from './shared/enums';
import { userRoleRedirectGuard } from './core/guards/user-role-redirect.guard';
import { smartRedirectGuard } from './core/guards/smart-redirect.guard';

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
    canActivate: [AuthGuard, smartRedirectGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard.page').then(m => m.DashboardPage),
        data: { roles: [Role.ADMIN, Role.MARKET] }
      },
      {
        path: 'user',
        loadComponent: () => import('./features/dashboard/user-dashboard/user-dashboard.page').then(m => m.UserDashboardPage),
        data: { roles: [Role.USER, Role['USER-ADMIN']] }
      }
    ]
  },
  {
    path: 'estado-cuenta',
    loadChildren: () => import('./features/estado-cuenta/estado-cuenta.routes').then(m => m.routes),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Role.USER, Role['USER-ADMIN']] }
  },
  {
    path: 'estado-cuenta-amnistia',
    loadChildren: () => import('./features/estado-cuenta-amnistia/estado-cuenta-amnistia.routes').then(m => m.routes),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Role.USER, Role['USER-ADMIN']] }
  },
  {
    path: 'consulta-ics',
    loadComponent: () => import('./features/consulta-ics/consulta-ics.page').then(m => m.ConsultaIcsPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Role.USER, Role['USER-ADMIN']] }
  },
  {
    path: 'consulta-ics-amnistia',
    loadComponent: () => import('./features/consulta-ics-amnistia/consulta-ics-amnistia.page').then(m => m.ConsultaIcsAmnistiaPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Role.USER, Role['USER-ADMIN']] }
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
    path: 'general-stats',
    loadComponent: () => import('./features/stats/general-stats/general-stats.page').then(m => m.GeneralStatsPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Role['USER-ADMIN']] }
  },
  {
    path: 'recaudacion-stats',
    loadComponent: () => import('./features/stats/recaudacion-stats/recaudacion-stats.page').then(m => m.RecaudacionStatsPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Role.ADMIN, Role['USER-ADMIN']] }
  },
  {
    path: 'activity-logs',
    loadComponent: () => import('./features/stats/activity-logs/activity-logs.page').then(m => m.ActivityLogsPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Role['USER-ADMIN']] }
  },
  {
    path: 'location-history',
    loadComponent: () => import('./features/location-history/location-history.page').then(m => m.LocationHistoryPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'all-users-locations',
    loadComponent: () => import('./features/all-users-locations/all-users-locations.page').then(m => m.AllUsersLocationsPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Role['USER-ADMIN']] }
  },
  {
    path: 'mi-historial-ubicacion',
    loadChildren: () => import('./features/dashboard/user-dashboard/pages/mi-historial-ubicacion/mi-historial-ubicacion.module').then(m => m.MiHistorialUbicacionPageModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Role.USER, Role['USER-ADMIN']] }
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
