import { Injectable } from '@angular/core';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class PermissionsService {

  constructor(
    private platform: Platform,
    private androidPermissions: AndroidPermissions
  ) {}

  async checkAndRequestBluetoothPermissions(): Promise<boolean> {
    if (!this.platform.is('android')) {
      return true; // Not on android, assume permissions are fine
    }

    try {
      console.log('🔐 Solicitando permisos de Bluetooth...');
      
      // Permisos básicos + dispositivos cercanos para Android 12+
      const permissions = [
        this.androidPermissions.PERMISSION.BLUETOOTH,
        this.androidPermissions.PERMISSION.BLUETOOTH_ADMIN,
        this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION,
        // Permisos para Android 12+ (dispositivos cercanos)
        'android.permission.BLUETOOTH_SCAN',
        'android.permission.BLUETOOTH_CONNECT',
        'android.permission.BLUETOOTH_ADVERTISE'
      ];

      console.log('📋 Permisos a solicitar:', permissions);

      // Verificar y solicitar permisos de forma simple
      const result = await this.androidPermissions.requestPermissions(permissions);
      
      console.log('✅ Resultado de permisos:', result.hasPermission);
      return result.hasPermission;
      
    } catch (error) {
      console.error('❌ Error with permissions:', error);
      return false;
    }
  }

}
