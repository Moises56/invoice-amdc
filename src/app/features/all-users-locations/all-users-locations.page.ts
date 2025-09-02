import {
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonContent,
} from '@ionic/angular/standalone';
import { AllUsersLocationHistoryComponent } from '../../shared/components/all-users-location-history/all-users-location-history.component';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-all-users-locations',
  templateUrl: './all-users-locations.page.html',
  styleUrls: ['./all-users-locations.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonContent,
    AllUsersLocationHistoryComponent,
  ],
})
export class AllUsersLocationsPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {}

  async ngOnInit() {
    // Check if user has admin permissions
    const user = this.authService.user();
    if (!user || user.role !== 'USER-ADMIN') {
      console.warn('User does not have admin permissions, redirecting to dashboard');
      await this.router.navigate(['/dashboard']);
      return;
    }
  }

  /**
   * Get page title
   */
  getPageTitle(): string {
    return 'Ubicaciones de Usuarios';
  }
}