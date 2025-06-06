import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./audit-list/audit-list.page').then(m => m.AuditListPage)
  },
  {
    path: 'detail/:id',
    loadComponent: () => import('./audit-detail/audit-detail.page').then(m => m.AuditDetailPage)
  }
];
