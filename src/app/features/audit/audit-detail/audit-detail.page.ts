import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonBackButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonChip,
  IonBadge,
  IonSpinner,
  IonText,
  IonList,
  IonListHeader,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  timeOutline,
  documentTextOutline,
  codeSlashOutline,
  globeOutline,
  desktopOutline,
  informationCircleOutline,
  arrowBackOutline,
  copyOutline, alertCircleOutline } from 'ionicons/icons';
import { AuditService } from '../audit.service';
import { AuditLog } from '../../../shared/interfaces';

@Component({
  selector: 'app-audit-detail',
  templateUrl: './audit-detail.page.html',
  styleUrls: ['./audit-detail.page.scss'],
  standalone: true,  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonBackButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonItem,
    IonLabel,
    IonChip,
    IonBadge,
    IonSpinner,
    IonText,
    IonList,
    IonListHeader
  ]
})
export class AuditDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auditService = inject(AuditService);
  private toastController = inject(ToastController);

  // Signals
  auditLog = signal<AuditLog | null>(null);
  loading = signal(true);
  logId = signal<string>('');

  constructor() {
    addIcons({copyOutline,informationCircleOutline,documentTextOutline,codeSlashOutline,timeOutline,personOutline,globeOutline,desktopOutline,alertCircleOutline,arrowBackOutline});
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.logId.set(id);
      this.loadAuditLog(id);
    } else {
      this.router.navigate(['/audit']);
    }
  }

  /**
   * Cargar log de auditoría
   */
  async loadAuditLog(id: string) {
    this.loading.set(true);
    
    try {
      const log = await this.auditService.getAuditLogById(id).toPromise();
      if (log) {
        this.auditLog.set(log);
      } else {
        this.showToast('Log de auditoría no encontrado', 'danger');
        this.router.navigate(['/audit']);
      }
    } catch (error) {
      this.showToast('Error al cargar el log de auditoría', 'danger');
      this.router.navigate(['/audit']);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Copiar al portapapeles
   */
  async copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast(`${label} copiado al portapapeles`, 'success');
    } catch (error) {
      this.showToast('Error al copiar al portapapeles', 'danger');
    }
  }

  /**
   * Mostrar toast
   */
  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  /**
   * Obtener color del chip por acción
   */
  getActionColor(action: string): string {
    const colors: Record<string, string> = {
      'CREATE': 'success',
      'UPDATE': 'warning',
      'DELETE': 'danger',
      'LOGIN': 'primary',
      'LOGOUT': 'medium'
    };
    return colors[action.toUpperCase()] || 'medium';
  }

  /**
   * Obtener ícono por acción
   */
  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      'CREATE': 'add-circle-outline',
      'UPDATE': 'create-outline',
      'DELETE': 'trash-outline',
      'LOGIN': 'log-in-outline',
      'LOGOUT': 'log-out-outline'
    };
    return icons[action.toUpperCase()] || 'document-text-outline';
  }

  /**
   * Formatear fecha
   */
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(date));
  }

  /**
   * Formatear JSON para mostrar
   */
  formatJSON(obj: any): string {
    if (!obj) return 'N/A';
    return JSON.stringify(obj, null, 2);
  }

  /**
   * Verificar si hay datos anteriores o nuevos
   */
  hasDataChanges(): boolean {
    const log = this.auditLog();
    return !!(log?.datos_anteriores || log?.datos_nuevos);
  }

  /**
   * Obtener las claves cambiadas
   */
  getChangedKeys(): string[] {
    const log = this.auditLog();
    if (!log) return [];

    const oldKeys = log.datos_anteriores ? Object.keys(log.datos_anteriores) : [];
    const newKeys = log.datos_nuevos ? Object.keys(log.datos_nuevos) : [];
    
    return [...new Set([...oldKeys, ...newKeys])];
  }

  /**
   * Obtener valor anterior
   */
  getOldValue(key: string): any {
    const log = this.auditLog();
    return log?.datos_anteriores ? (log.datos_anteriores as any)[key] : null;
  }

  /**
   * Obtener valor nuevo
   */
  getNewValue(key: string): any {
    const log = this.auditLog();
    return log?.datos_nuevos ? (log.datos_nuevos as any)[key] : null;
  }

  /**
   * Verificar si un campo cambió
   */
  hasFieldChanged(key: string): boolean {
    const oldValue = this.getOldValue(key);
    const newValue = this.getNewValue(key);
    return JSON.stringify(oldValue) !== JSON.stringify(newValue);
  }
}
