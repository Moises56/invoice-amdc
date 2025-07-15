import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./usuarios-list/usuarios-list.page').then(m => m.UsuariosListPage)
  },
  {
    path: 'nuevo',
    loadComponent: () => import('./usuario-form/usuario-form.page').then(m => m.UsuarioFormPage)
  },
  {
    path: 'editar/:id',
    loadComponent: () => import('./usuario-form/usuario-form.page').then(m => m.UsuarioFormPage)
  },
  {
    path: ':id',
    loadComponent: () => import('./usuario-detail/usuario-detail.page').then(m => m.UsuarioDetailPage)
  }
];
