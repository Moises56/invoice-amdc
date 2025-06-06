import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./locales-list/locales-list.page').then(m => m.LocalesListPage)
  },
  {
    path: 'nuevo',
    loadComponent: () => import('./local-form/local-form.page').then(m => m.LocalFormPage)
  },
  {
    path: 'editar/:id',
    loadComponent: () => import('./local-form/local-form.page').then(m => m.LocalFormPage)
  },
  {
    path: ':id',
    loadComponent: () => import('./local-detail/local-detail.page').then(m => m.LocalDetailPage)
  }
];
