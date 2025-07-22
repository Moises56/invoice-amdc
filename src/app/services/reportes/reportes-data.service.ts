import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ChartableData } from '../../features/reportes/interfaces/shared.interface';

export interface MercadoEndpoint {
  id: string;
  nombre_mercado: string;
  direccion: string;
  _count: {
    locales: number;
  };
  total_recaudado?: number;
}

export interface ConfiguracionReportes {
  success: boolean;
  configuracion: {
    tipos_reporte: Array<{
      value: string;
      label: string;
      icon: string;
    }>;
    periodos: Array<{
      value: string;
      label: string;
    }>;
    formatos: Array<{
      value: string;
      label: string;
      icon: string;
    }>;
    mercados_disponibles: MercadoEndpoint[];
    tipos_local: string[];
  };
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportesDataService {
  private http = inject(HttpClient);
  
  // Datos reales del endpoint cacheados
  private configuracionCache = signal<ConfiguracionReportes | null>(null);
  
  async getConfiguracionReportes(): Promise<ConfiguracionReportes> {
    try {
      if (this.configuracionCache()) {
        return this.configuracionCache()!;
      }

      const response = await this.http.get<ConfiguracionReportes>(
        `${environment.apiUrl}/reportes-demo/configuracion`
      ).toPromise();
      
      if (response) {
        this.configuracionCache.set(response);
        return response;
      }
      
      // Fallback con datos del endpoint proporcionado
      return this.getFallbackConfig();
    } catch (error) {
      console.warn('Error obteniendo configuración, usando fallback:', error);
      return this.getFallbackConfig();
    }
  }

  private getFallbackConfig(): ConfiguracionReportes {
    return {
      "success": true,
      "configuracion": {
        "tipos_reporte": [
          {
            "value": "FINANCIERO",
            "label": "Reporte Financiero",
            "icon": "cash-outline"
          },
          {
            "value": "OPERACIONAL",
            "label": "Reporte Operacional",
            "icon": "analytics-outline"
          },
          {
            "value": "MERCADO",
            "label": "Por Mercado",
            "icon": "business-outline"
          },
          {
            "value": "LOCAL",
            "label": "Por Local",
            "icon": "storefront-outline"
          }
        ],
        "periodos": [
          {
            "value": "MENSUAL",
            "label": "Mensual"
          },
          {
            "value": "TRIMESTRAL",
            "label": "Trimestral"
          },
          {
            "value": "ANUAL",
            "label": "Anual"
          }
        ],
        "formatos": [
          {
            "value": "json",
            "label": "Vista Previa",
            "icon": "eye-outline"
          },
          {
            "value": "pdf",
            "label": "PDF",
            "icon": "document-text-outline"
          },
          {
            "value": "xlsx",
            "label": "Excel",
            "icon": "grid-outline"
          }
        ],
        "mercados_disponibles": [
          {
            "id": "4604695e-b177-44b8-93c3-3fa5f90a8263",
            "nombre_mercado": "Mercado Zonal Belén",
            "direccion": "Sendero Costarrisence, Distrito Belén, Comayagüela",
            "_count": {
              "locales": 1277
            },
            "total_recaudado": 1050
          },
          {
            "id": "7f82f552-4d7f-477b-8ab4-e54b5c82a24e",
            "nombre_mercado": "Test de puebas",
            "direccion": "Dirección  Pruebas",
            "_count": {
              "locales": 0
            },
            "total_recaudado": 0
          },
          {
            "id": "866595cc-c500-4eec-a625-92dee38bc244",
            "nombre_mercado": "Mercado Jacaleapa",
            "direccion": "Bulevar Centroamérica, Colonia Miraflores, Distrito Kennedy",
            "_count": {
              "locales": 183
            },
            "total_recaudado": 930
          },
          {
            "id": "a2564f93-d208-4d63-a394-2d0cf89bd23b",
            "nombre_mercado": "Mercado San Miguel",
            "direccion": "Avenida Juan Gutemberg, Barrio La Plazuela, Distrito Histórico",
            "_count": {
              "locales": 95
            },
            "total_recaudado": 5550
          },
          {
            "id": "b52495e3-ff73-43a1-b0aa-f68bf82a0c3c",
            "nombre_mercado": "Mercado de los Dolores",
            "direccion": "Avenida Paulino Valladares, Barrio Los Dolores, Distrito Histórico",
            "_count": {
              "locales": 341
            },
            "total_recaudado": 1200
          },
          {
            "id": "b9a05043-c4b4-4472-b8ec-b53095730ed6",
            "nombre_mercado": "Mercado San Pablo",
            "direccion": "Paseo El Manchén, El Manchen, Distrito El Picacho",
            "_count": {
              "locales": 171
            },
            "total_recaudado": 1200
          }
        ],
        "tipos_local": [
          "ABARROTERIA", "ACHINERÍA", "GOLOSINAS", "DULCERIA", "VARIOS", 
          "VERDURAS", "FRUTAS", "GRANOS", "VARIEDADES", "COCINA",
          "PLASTICOS Y DESECHABLES", "LÁCTEOS", "EMBUTIDOS", "CARNICERÍA",
          "BARBERIA", "FRUTAS Y VERDURAS", "CONFECCION DE ROPA",
          "FERRETERÍA", "MISCELANEOS", "REFRESQUERIA", "COMEDOR",
          "FOTOCOPIA", "ZAPATOS Y ROPAS", "SASTRERIA", "VENTA DE POLLO",
          "POLLO", "CAFÉ Y PAN", "LLANTERA", "VENTA DE DULCES",
          "CLINICA DENTAL", "COOPERATIVA", "ROPA", "TORTILLAS",
          "MINI FERRETERIA", "HIERBAS MEDICINALES", "ELECTRODOMÉSTICO",
          "COMIDA", "PLASTICO", "TALLER DE COSTURA", "ROPA Y CALZADOS",
          "MUEBLES", "PAN", "MEDICINA NATURAL", "SALON DE BELLEZA",
          "FLORISTERIA", "AGROPECUARIA", "BODEGA", "PESCADERIA",
          "REPOSTERIA Y HELADOS", "MOLINOS", "TALLER ELECTRONICO",
          "COSMETICOS", "JOYERIA", "CALZADO", "MARISCOS", "FARMACIA",
          "ZAPATERIA", "HOJALATERIA", "CLINICA MEDICA", "BANCO"
        ]
      },
      "timestamp": "2025-07-18T19:00:38.766Z"
    };
  }

  /**
   * Formatear moneda hondureña con precisión decimal
   */
  formatLempira(amount: number, showDecimals: boolean = true): string {
    const formatter = new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0
    });
    
    return formatter.format(amount).replace('HNL', 'L.');
  }

  /**
   * Formatear números con separadores de miles
   */
  formatNumber(number: number): string {
    return new Intl.NumberFormat('es-HN').format(number);
  }

  /**
   * Generar datos de ejemplo basados en los mercados reales
   */
  generateRealisticChartData(mercados: MercadoEndpoint[]) {
    return {
      monthlyData: mercados.slice(0, 6).map((mercado, index) => ({
        etiqueta: mercado.nombre_mercado.replace('Mercado ', ''),
        valor: Math.floor(Math.random() * 50000) + ((mercado._count?.locales || 0) * 100),
        color: this.getColorForIndex(index)
      } as ChartableData)),
      
      marketData: mercados.filter(m => (m._count?.locales || 0) > 0).map((mercado, index) => ({
        etiqueta: mercado.nombre_mercado,
        valor: Math.floor((mercado._count?.locales || 0) * (Math.random() * 1000 + 500)),
        color: this.getColorForIndex(index)
      } as ChartableData)),
      
      trendData: Array.from({ length: 6 }, (_, i) => ({
        etiqueta: `Mes ${i + 1}`,
        valor: Math.floor(Math.random() * 75000) + 25000,
        color: '#2fdf75'
      } as ChartableData))
    };
  }

  // Método para obtener datos de gráficos
  getDatosGraficos() {
    return {
      monthlyData: [
        { etiqueta: 'Enero', valor: 85000, color: '#3880ff' },
        { etiqueta: 'Febrero', valor: 92000, color: '#3dc2ff' },
        { etiqueta: 'Marzo', valor: 78000, color: '#5260ff' }
      ] as ChartableData[],
      marketData: [
        { etiqueta: 'Mercado Central', valor: 125000, color: '#3880ff' },
        { etiqueta: 'Mercado Norte', valor: 85000, color: '#36d399' },
        { etiqueta: 'Mercado Sur', valor: 95000, color: '#fbbf24' }
      ] as ChartableData[],
      trendData: [
        { etiqueta: 'Sem 1', valor: 82000, color: '#2fdf75' },
        { etiqueta: 'Sem 2', valor: 87000, color: '#2fdf75' },
        { etiqueta: 'Sem 3', valor: 91000, color: '#2fdf75' },
        { etiqueta: 'Sem 4', valor: 89000, color: '#2fdf75' }
      ] as ChartableData[]
    };
  }

  private getColorForIndex(index: number): string {
    const colors = ['#3880ff', '#36d399', '#fbbf24', '#f87171', '#a78bfa', '#2fdf75'];
    return colors[index % colors.length];
  }

  // Método para obtener mercados desde datos del endpoint (simulación)
  getMercadosFromEndpoint(): MercadoEndpoint[] {
    const config = this.getFallbackConfig();
    return config.configuracion.mercados_disponibles;
  }
}
