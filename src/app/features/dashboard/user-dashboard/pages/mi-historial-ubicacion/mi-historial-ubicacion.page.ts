import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { Subject, takeUntil } from 'rxjs';
import { StatsService } from '../../../../../shared/services/stats.service';
import { UserLocationHistoryResponse, TypeConsultaHistoryItem } from '../../../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-mi-historial-ubicacion',
  templateUrl: './mi-historial-ubicacion.page.html',
  styleUrls: ['./mi-historial-ubicacion.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class MiHistorialUbicacionPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  locationData: UserLocationHistoryResponse | null = null;
  isLoading = false;
  error: string | null = null;
  
  // Tab management
  selectedTab = 'ubicacion-actual';
  
  // Location History filters
  showLocationHistory = true;
  
  // Consultation History filters
  showConsultationHistory = true;
  selectedConsultationType = 'all';
  selectedConsultationMethod = 'all';
  consultationSortBy = 'date';
  consultationSortOrder: 'asc' | 'desc' = 'desc';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private statsService: StatsService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadLocationHistory();
  }



  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadLocationHistory() {
    this.isLoading = true;
    this.error = null;
    
    const loading = await this.loadingController.create({
      message: 'Cargando historial de ubicaciones...'
    });
    await loading.present();

    this.statsService.getMyLocationHistory()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: UserLocationHistoryResponse) => {
          // Prepare data with typeConsultaHistory at root level
          this.locationData = {
            ...response,
            typeConsultaHistory: response.currentLocation?.typeConsultaHistory || []
          };
          
          this.isLoading = false;
          loading.dismiss();
        },
        error: (error: any) => {
          console.error('Error loading location history:', error);
          this.error = 'Error al cargar el historial de ubicaciones';
          this.isLoading = false;
          loading.dismiss();
          this.showErrorToast();
        }
      });
  }

  async showErrorToast() {
    const toast = await this.toastController.create({
      message: this.error || 'Error desconocido',
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }

  // Tab management
  onTabChange(event: any) {
    this.selectedTab = event.detail.value;
  }

  // Location History methods
  toggleLocationHistory() {
    this.showLocationHistory = !this.showLocationHistory;
  }

  // Consultation History methods
  toggleConsultationHistory() {
    this.showConsultationHistory = !this.showConsultationHistory;
  }

  onConsultationTypeChange(event: any) {
    this.selectedConsultationType = event.detail.value;
  }

  onConsultationMethodChange(event: any) {
    this.selectedConsultationMethod = event.detail.value;
  }

  onConsultationSortChange(sortBy: string) {
    if (this.consultationSortBy === sortBy) {
      this.consultationSortOrder = this.consultationSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.consultationSortBy = sortBy;
      this.consultationSortOrder = 'desc';
    }
  }

  // Getters for computed properties
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
      
      if (this.consultationSortBy === 'date') {
        comparison = new Date(a.consultedAt).getTime() - new Date(b.consultedAt).getTime();
      } else if (this.consultationSortBy === 'amount') {
        comparison = parseFloat(a.total || '0') - parseFloat(b.total || '0');
      } else if (this.consultationSortBy === 'type') {
        comparison = a.type.localeCompare(b.type);
      }
      
      return this.consultationSortOrder === 'asc' ? comparison : -comparison;
    });
  }

  get consultationHistoryStats() {
    if (!this.locationData?.typeConsultaHistory) {
      return {
        total: 0,
        ec: 0,
        ics: 0,
        normal: 0,
        amnistia: 0,
        totalAmount: 0
      };
    }
    
    const history = this.locationData.typeConsultaHistory;
    
    return {
      total: history.length,
      ec: history.filter(item => item.type === 'EC').length,
      ics: history.filter(item => item.type === 'ICS').length,
      normal: history.filter(item => item.method === 'normal').length,
      amnistia: history.filter(item => item.method === 'amnistia').length,
      totalAmount: history.reduce((sum, item) => sum + parseFloat(item.total || '0'), 0)
    };
  }

  // Utility methods
  getConsultationTypeIcon(type: string): string {
    switch (type) {
      case 'EC': return 'document-text-outline';
      case 'ICS': return 'analytics-outline';
      default: return 'help-circle-outline';
    }
  }

  getConsultationTypeColor(type: string): string {
    switch (type) {
      case 'EC': return 'primary';
      case 'ICS': return 'secondary';
      default: return 'medium';
    }
  }

  getConsultationMethodIcon(method: string): string {
    switch (method) {
      case 'normal': return 'checkmark-circle-outline';
      case 'amnistia': return 'shield-checkmark-outline';
      default: return 'help-circle-outline';
    }
  }

  getConsultationMethodColor(method: string): string {
    switch (method) {
      case 'normal': return 'success';
      case 'amnistia': return 'warning';
      default: return 'medium';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goBack() {
    this.router.navigate(['/dashboard/user']);
  }

  // Helper method for template debugging
  Object = Object;
}