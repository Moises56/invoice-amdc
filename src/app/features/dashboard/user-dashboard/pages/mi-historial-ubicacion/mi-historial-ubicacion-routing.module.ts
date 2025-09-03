import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MiHistorialUbicacionPage } from './mi-historial-ubicacion.page';

const routes: Routes = [
  {
    path: '',
    component: MiHistorialUbicacionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MiHistorialUbicacionPageRoutingModule {}