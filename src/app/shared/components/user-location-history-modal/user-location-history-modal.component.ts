import {
  Component,
  OnInit,
  inject,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  ModalController,
} from '@ionic/angular/standalone';
import { UserLocationHistoryComponent } from '../user-location-history/user-location-history.component';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  arrowBackOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-user-location-history-modal',
  templateUrl: './user-location-history-modal.component.html',
  styleUrls: ['./user-location-history-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    UserLocationHistoryComponent,
  ],
})
export class UserLocationHistoryModalComponent implements OnInit {
  private readonly modalController = inject(ModalController);

  @Input() userId?: number;
  @Input() userName?: string;

  constructor() {
    addIcons({
      closeOutline,
      arrowBackOutline,
    });
  }

  ngOnInit() {}

  /**
   * Close modal
   */
  async closeModal(): Promise<void> {
    await this.modalController.dismiss();
  }

  /**
   * Get modal title
   */
  getModalTitle(): string {
    if (this.userName) {
      return `Historial - ${this.userName}`;
    }
    return 'Historial de Ubicaciones';
  }
}