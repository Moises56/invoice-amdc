import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { UserLocationHistoryResponse, TypeConsultaHistoryItem } from '../../../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-location-history-modal',
  templateUrl: './location-history-modal.component.html',
  styleUrls: ['./location-history-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class LocationHistoryModalComponent implements OnInit {
  @Input() locationData: UserLocationHistoryResponse | null = null;
  @Input() isLoading: boolean = false;
  @Input() hasError: boolean = false;
  @Input() errorMessage: string = '';

  // Consultation history filters and state
  selectedConsultationType: string = 'all';
  selectedConsultationMethod: string = 'all';
  consultationSortBy: 'date' | 'type' | 'total' = 'date';
  consultationSortOrder: 'asc' | 'desc' = 'desc';
  showConsultationHistory: boolean = true;

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    console.log('LocationHistoryModal initialized with data:', this.locationData);
    console.log('TypeConsultaHistory data:', this.locationData?.typeConsultaHistory);
    console.log('Show consultation history:', this.showConsultationHistory);
    console.log('Consultation history stats:', this.consultationHistoryStats);
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

  // Consultation History Methods
  get filteredConsultationHistory(): TypeConsultaHistoryItem[] {
    if (!this.locationData?.typeConsultaHistory) return [];
    
    let filtered = this.locationData.typeConsultaHistory;
    
    // Filter by type
    if (this.selectedConsultationType !== 'all') {
      filtered = filtered.filter(item => item.type === this.selectedConsultationType);
    }
    
    // Filter by method
    if (this.selectedConsultationMethod !== 'all') {
      filtered = filtered.filter(item => item.method === this.selectedConsultationMethod);
    }
    
    // Sort
    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.consultationSortBy) {
        case 'date':
          comparison = new Date(a.consultedAt).getTime() - new Date(b.consultedAt).getTime();
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'total':
          const aTotal = parseFloat(a.total.replace(/[L.,]/g, ''));
          const bTotal = parseFloat(b.total.replace(/[L.,]/g, ''));
          comparison = aTotal - bTotal;
          break;
      }
      
      return this.consultationSortOrder === 'desc' ? -comparison : comparison;
    });
  }

  getConsultationTypeIcon(type: string): string {
    switch (type) {
      case 'EC':
        return 'document-text-outline';
      case 'ICS':
        return 'analytics-outline';
      default:
        return 'help-circle-outline';
    }
  }

  getConsultationMethodIcon(method: string): string {
    switch (method) {
      case 'normal':
        return 'checkmark-circle-outline';
      case 'amnistia':
        return 'shield-checkmark-outline';
      default:
        return 'help-circle-outline';
    }
  }

  getConsultationTypeColor(type: string): string {
    switch (type) {
      case 'EC':
        return 'primary';
      case 'ICS':
        return 'secondary';
      default:
        return 'medium';
    }
  }

  getConsultationMethodColor(method: string): string {
    switch (method) {
      case 'normal':
        return 'success';
      case 'amnistia':
        return 'warning';
      default:
        return 'medium';
    }
  }

  onConsultationTypeChange(event: any): void {
    this.selectedConsultationType = event.detail.value;
  }

  onConsultationMethodChange(event: any): void {
    this.selectedConsultationMethod = event.detail.value;
  }

  onConsultationSortChange(sortBy: 'date' | 'type' | 'total'): void {
    if (this.consultationSortBy === sortBy) {
      this.consultationSortOrder = this.consultationSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.consultationSortBy = sortBy;
      this.consultationSortOrder = 'desc';
    }
  }

  toggleConsultationHistory(): void {
    this.showConsultationHistory = !this.showConsultationHistory;
  }

  get consultationHistoryStats() {
    const history = this.locationData?.typeConsultaHistory || [];
    return {
      total: history.length,
      ec: history.filter(item => item.type === 'EC').length,
      ics: history.filter(item => item.type === 'ICS').length,
      normal: history.filter(item => item.method === 'normal').length,
      amnistia: history.filter(item => item.method === 'amnistia').length,
      totalAmount: history.reduce((sum, item) => {
        try {
          const amount = parseFloat(item.total?.toString().replace(/[L.,]/g, '') || '0');
          return sum + (isNaN(amount) ? 0 : amount);
        } catch (error) {
          return sum;
        }
      }, 0)
    };
  }
}