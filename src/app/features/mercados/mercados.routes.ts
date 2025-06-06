import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./mercados-list/mercados-list.page').then(m => m.MercadosListPage)
  },
  {
    path: 'nuevo',
    loadComponent: () => import('./mercado-form/mercado-form.page').then(m => m.MercadoFormPage)
  },
  {
    path: 'editar/:id',
    loadComponent: () => import('./mercado-form/mercado-form.page').then(m => m.MercadoFormPage)
  },
  {
    path: ':id',
    loadComponent: () => import('./mercado-detail/mercado-detail.page').then(m => m.MercadoDetailPage)
  }
];
