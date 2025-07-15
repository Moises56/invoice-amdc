import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./auditoria-dashboard/auditoria-dashboard.page').then(m => m.AuditoriaDashboardPage)
  }
  // TODO: Agregar las siguientes rutas cuando se creen los componentes:
  // {
  //   path: 'logs',
  //   loadComponent: () => import('./auditoria-logs/auditoria-logs.page').then(m => m.AuditoriaLogsPage)
  // },
  // {
  //   path: 'stats',
  //   loadComponent: () => import('./auditoria-stats/auditoria-stats.page').then(m => m.AuditoriaStatsPage)
  // },
  // {
  //   path: 'logs/:id',
  //   loadComponent: () => import('./auditoria-detail/auditoria-detail.page').then(m => m.AuditoriaDetailPage)
  // },
  // {
  //   path: 'user/:userId',
  //   loadComponent: () => import('./auditoria-user/auditoria-user.page').then(m => m.AuditoriaUserPage)
  // }
];
