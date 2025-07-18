import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ConfiguracionReportes, TipoReporte } from '../../interfaces/reportes/mercado.interface';

@Injectable({
  providedIn: 'root'
})
export class ReportesConfigService {
  private configSubject = new BehaviorSubject<ConfiguracionReportes | null>(null);
  public config$ = this.configSubject.asObservable();

  constructor() {}

  /**
   * Configuración por defecto para modo offline
   */
  getDefaultConfig(): ConfiguracionReportes {
    return {
      tipos_reporte: [
        { value: 'FINANCIERO', label: 'Reporte Financiero', icon: 'cash-outline' },
        { value: 'OPERACIONAL', label: 'Reporte Operacional', icon: 'analytics-outline' },
        { value: 'MERCADO', label: 'Por Mercado', icon: 'business-outline' },
        { value: 'LOCAL', label: 'Por Local', icon: 'storefront-outline' }
      ],
      periodos: [
        { value: 'MENSUAL', label: 'Mensual' },
        { value: 'TRIMESTRAL', label: 'Trimestral' },
        { value: 'ANUAL', label: 'Anual' }
      ],
      formatos: [
        { value: 'JSON', label: 'Vista Previa', icon: 'eye-outline' },
        { value: 'PDF', label: 'PDF', icon: 'document-text-outline' },
        { value: 'EXCEL', label: 'Excel', icon: 'grid-outline' }
      ],
      mercados_disponibles: [],
      tipos_local: []
    };
  }

  /**
   * Actualizar configuración
   */
  updateConfig(config: ConfiguracionReportes): void {
    this.configSubject.next(config);
  }

  /**
   * Obtener configuración actual
   */
  getCurrentConfig(): ConfiguracionReportes | null {
    return this.configSubject.value;
  }

  /**
   * Obtener colores por tipo de reporte
   */
  getColorByTipo(tipo: string): string {
    const colors: Record<string, string> = {
      'FINANCIERO': 'bg-green-100 text-green-800',
      'OPERACIONAL': 'bg-blue-100 text-blue-800',
      'MERCADO': 'bg-purple-100 text-purple-800',
      'LOCAL': 'bg-orange-100 text-orange-800'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Obtener iconos por estado
   */
  getIconByEstado(estado: string): string {
    const icons: Record<string, string> = {
      'PENDIENTE': 'time-outline',
      'PAGADA': 'checkmark-circle-outline',
      'VENCIDA': 'alert-circle-outline',
      'ANULADA': 'close-circle-outline'
    };
    return icons[estado] || 'help-circle-outline';
  }
}
