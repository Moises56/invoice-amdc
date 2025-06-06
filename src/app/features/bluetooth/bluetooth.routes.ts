import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./bluetooth-settings/bluetooth-settings.page').then(m => m.BluetoothSettingsPage)
  },
  {
    path: 'devices',
    loadComponent: () => import('./device-list/device-list.page').then(m => m.DeviceListPage)
  },
  {
    path: 'printers',
    loadComponent: () => import('./printer-config/printer-config.page').then(m => m.PrinterConfigPage)
  }
];
