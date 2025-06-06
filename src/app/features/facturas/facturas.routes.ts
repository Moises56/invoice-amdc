import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./facturas-list/facturas-list.page').then(m => m.FacturasListPage)
  },
  {
    path: 'nueva',
    loadComponent: () => import('./factura-form/factura-form.page').then(m => m.FacturaFormPage)
  },
  {
    path: 'editar/:id',
    loadComponent: () => import('./factura-form/factura-form.page').then(m => m.FacturaFormPage)
  },
  {
    path: ':id',
    loadComponent: () => import('./factura-detail/factura-detail.page').then(m => m.FacturaDetailPage)
  }
];
