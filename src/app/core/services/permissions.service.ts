import { Injectable } from '@angular/core';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {

  constructor(
    private platform: Platform,
    private androidPermissions: AndroidPermissions
  ) { }

  async checkAndRequestBluetoothPermissions(): Promise<boolean> {
    if (!this.platform.is('android')) {
      return true; // Not on android, assume permissions are fine
    }

    try {
      // Check for all permissions
      const hasScanPermission = await this.hasPermission(this.androidPermissions.PERMISSION.BLUETOOTH_SCAN);
      const hasConnectPermission = await this.hasPermission(this.androidPermissions.PERMISSION.BLUETOOTH_CONNECT);
      const hasLocationPermission = await this.hasPermission(this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION);

      if (hasScanPermission && hasConnectPermission && hasLocationPermission) {
        return true;
      }

      // Request permissions if not granted
      const result = await this.androidPermissions.requestPermissions([
        this.androidPermissions.PERMISSION.BLUETOOTH_SCAN,
        this.androidPermissions.PERMISSION.BLUETOOTH_CONNECT,
        this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION
      ]);

      return result.hasPermission;

    } catch (error) {
      console.error('Error checking or requesting permissions', error);
      return false;
    }
  }

  private async hasPermission(permission: string): Promise<boolean> {
    const result = await this.androidPermissions.checkPermission(permission);
    return result.hasPermission;
  }
}
