import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { UserLocationHistoryResponse } from '../../../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-location-history-modal',
  templateUrl: './location-history-modal.component.html',
  styleUrls: ['./location-history-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class LocationHistoryModalComponent implements OnInit {
  @Input() locationData: UserLocationHistoryResponse | null = null;
  @Input() isLoading: boolean = false;
  @Input() hasError: boolean = false;
  @Input() errorMessage: string = '';

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    console.log('Location data in modal:', this.locationData);
  }

  dismiss() {
    this.modalController.dismiss();
  }

  getConsultationTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'ecNormal': 'EC Normal',
      'ecAmnistia': 'EC Amnistía',
      'icsNormal': 'ICS Normal',
      'icsAmnistia': 'ICS Amnistía'
    };
    return labels[type] || type;
  }

  getConsultationTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'ecNormal': 'document-text-outline',
      'ecAmnistia': 'shield-checkmark-outline',
      'icsNormal': 'analytics-outline',
      'icsAmnistia': 'ribbon-outline'
    };
    return icons[type] || 'help-circle-outline';
  }

  getStatusColor(isActive: boolean): string {
    return isActive ? 'success' : 'medium';
  }

  getStatusIcon(isActive: boolean): string {
    return isActive ? 'checkmark-circle' : 'time-outline';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  calculateDuration(startDate: string, endDate?: string): string {
    if (!startDate) return 'N/A';
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    } else if (diffHours > 0) {
      return `${diffHours}h`;
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffMinutes}m`;
    }
  }
}