import { Component, OnInit, inject } from '@angular/core';
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

@Component({
  selector: 'app-location-history',
  templateUrl: './location-history.page.html',
  styleUrls: ['./location-history.page.scss'],
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
export class LocationHistoryPage implements OnInit {
  private readonly authService = inject(AuthService);

  constructor() {
    console.log('🏗️ LocationHistoryPage constructor called');
  }

  ngOnInit() {
    console.log('🔄 LocationHistoryPage ngOnInit called');
    console.log('👤 Current user:', this.authService.user());
  }

  /**
   * Get page title
   */
  getPageTitle(): string {
    return 'Historial de Ubicaciones';
  }
}
