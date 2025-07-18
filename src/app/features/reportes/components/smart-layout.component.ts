import { Component, OnInit, Input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonIcon,
  IonText,
  IonButton,
  IonRippleEffect,
  IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  gridOutline,
  listOutline,
  swapVerticalOutline,
  eyeOutline,
  downloadOutline,
  shareOutline,
  trendingUpOutline,
  barChartOutline,
  businessOutline,
  storefrontOutline,
  analyticsOutline
} from 'ionicons/icons';
import { ReportCard } from '../interfaces/common.interface';

@Component({
  selector: 'app-smart-layout',
  templateUrl: './smart-layout.component.html',
  styleUrls: ['./smart-layout.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
    IonIcon,
    IonText,
    IonButton,
    IonRippleEffect,
    IonBadge
  ]
})
export class SmartLayoutComponent implements OnInit {
  @Input() layoutMode: 'auto' | 'grid' | 'masonry' | 'priority' = 'auto';
  @Input() reportCards: ReportCard[] = [];

  // Señales para layout dinámico
  currentLayout = signal<'grid' | 'masonry' | 'priority'>('grid');
  viewportWidth = signal(window.innerWidth);
  
  // Cards organizadas por categoría
  organizedCards = computed(() => {
    const cards = this.reportCards.length > 0 ? this.reportCards : this.getDefaultCards();
    
    switch (this.currentLayout()) {
      case 'priority':
        return this.organizeBypriority(cards);
      case 'masonry':
        return this.organizeForMasonry(cards);
      default:
        return this.organizeByCategory(cards);
    }
  });

  // Layout responsivo automático
  autoLayout = computed(() => {
    const width = this.viewportWidth();
    if (width < 768) return 'priority'; // Móvil: prioridad
    if (width < 1200) return 'grid';    // Tablet: grid
    return 'masonry';                   // Desktop: masonry
  });

  // Configuración de columnas por pantalla
  columnConfig = computed(() => {
    const width = this.viewportWidth();
    const layout = this.currentLayout();
    
    if (width < 576) return { size: '12', sizeMd: '12', sizeLg: '12' }; // 1 columna móvil
    if (width < 768) return { size: '12', sizeMd: '6', sizeLg: '6' };   // 2 columnas tablet pequeña
    if (width < 992) return { size: '6', sizeMd: '6', sizeLg: '4' };    // 3 columnas tablet
    if (layout === 'masonry') return { size: '4', sizeMd: '4', sizeLg: '3' }; // 4 columnas masonry
    return { size: '6', sizeMd: '4', sizeLg: '3' }; // 4 columnas estándar
  });

  constructor() {
    this.addAllIcons();
    this.setupViewportListener();
  }

  ngOnInit() {
    if (this.layoutMode === 'auto') {
      this.currentLayout.set(this.autoLayout());
    } else {
      this.currentLayout.set(this.layoutMode);
    }
  }

  // Configurar listener para viewport
  private setupViewportListener() {
    if (typeof window !== 'undefined') {
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          this.viewportWidth.set(entry.contentRect.width);
          if (this.layoutMode === 'auto') {
            this.currentLayout.set(this.autoLayout());
          }
        }
      });
      
      resizeObserver.observe(document.body);
    }
  }

  // Organizar por categoría
  private organizeByCategory(cards: ReportCard[]): ReportCard[][] {
    const categories = ['financial', 'operational', 'geographic', 'analytics'];
    const organized: ReportCard[][] = [];
    
    categories.forEach(category => {
      const categoryCards = cards.filter(card => card.category === category);
      if (categoryCards.length > 0) {
        organized.push(categoryCards);
      }
    });
    
    return organized;
  }

  // Organizar por prioridad
  private organizeBypriority(cards: ReportCard[]): ReportCard[][] {
    const high = cards.filter(card => card.priority === 'high');
    const medium = cards.filter(card => card.priority === 'medium');
    const low = cards.filter(card => card.priority === 'low');
    
    return [high, medium, low].filter(group => group.length > 0);
  }

  // Organizar para masonry
  private organizeForMasonry(cards: ReportCard[]): ReportCard[][] {
    const columns = Math.min(4, Math.ceil(cards.length / 3));
    const organized: ReportCard[][] = Array.from({ length: columns }, () => []);
    
    cards.forEach((card, index) => {
      const columnIndex = index % columns;
      organized[columnIndex].push(card);
    });
    
    return organized.filter(column => column.length > 0);
  }

  // Cards por defecto
  private getDefaultCards(): ReportCard[] {
    return [
      {
        id: 'financiero',
        title: 'Reporte Financiero',
        description: 'Análisis completo de ingresos, recaudación y estado financiero',
        type: 'FINANCIERO',
        icon: 'trending-up-outline',
        color: 'success',
        features: ['Recaudación total', 'Análisis por estado', 'Comparativas'],
        priority: 'high',
        category: 'financial',
        actions: {
          pdf: () => console.log('Export PDF'),
          excel: () => console.log('Export Excel'),
          view: () => console.log('View Report')
        }
      },
      {
        id: 'operacional',
        title: 'Reporte Operacional',
        description: 'Estadísticas de operación y eficiencia del sistema',
        type: 'OPERACIONAL',
        icon: 'bar-chart-outline',
        color: 'primary',
        features: ['Facturas procesadas', 'Eficiencia', 'Rendimiento'],
        priority: 'high',
        category: 'operational',
        actions: {
          pdf: () => console.log('Export PDF'),
          excel: () => console.log('Export Excel'),
          view: () => console.log('View Report')
        }
      },
      {
        id: 'mercado',
        title: 'Reporte por Mercado',
        description: 'Análisis detallado por mercado individual',
        type: 'MERCADO',
        icon: 'business-outline',
        color: 'tertiary',
        features: ['Por mercado', 'Comparativas', 'Locales activos'],
        priority: 'medium',
        category: 'operational',
        actions: {
          pdf: () => console.log('Export PDF'),
          excel: () => console.log('Export Excel'),
          view: () => console.log('View Report')
        }
      },
      {
        id: 'local',
        title: 'Reporte por Local',
        description: 'Estadísticas específicas de locales comerciales',
        type: 'LOCAL',
        icon: 'storefront-outline',
        color: 'warning',
        features: ['Por local', 'Facturación', 'Estado de pago'],
        priority: 'medium',
        category: 'operational',
        actions: {
          pdf: () => console.log('Export PDF'),
          excel: () => console.log('Export Excel'),
          view: () => console.log('View Report')
        }
      },
      {
        id: 'analytics',
        title: 'Analytics Avanzado',
        description: 'Análisis predictivo y tendencias',
        type: 'ANALYTICS',
        icon: 'analytics-outline',
        color: 'secondary',
        features: ['Predicciones', 'Tendencias', 'KPIs'],
        priority: 'low',
        category: 'analytical',
        actions: {
          pdf: () => console.log('Export PDF'),
          excel: () => console.log('Export Excel'),
          view: () => console.log('View Report')
        }
      }
    ];
  }

  // Cambiar modo de layout
  toggleLayout() {
    const layouts: ('grid' | 'masonry' | 'priority')[] = ['grid', 'masonry', 'priority'];
    const currentIndex = layouts.indexOf(this.currentLayout());
    const nextIndex = (currentIndex + 1) % layouts.length;
    this.currentLayout.set(layouts[nextIndex]);
  }

  // Eventos de interacción
  onCardView(card: ReportCard) {
    // Emitir evento para la página padre
    console.log('Ver reporte:', card.type);
  }

  onCardGenerate(card: ReportCard) {
    console.log('Generar reporte:', card.type);
  }

  onCardExport(card: ReportCard, format: string) {
    console.log('Exportar reporte:', card.type, 'formato:', format);
  }

  // Obtener tamaño de columna para una card específica
  getColumnSize(card: ReportCard, index: number): string {
    const config = this.columnConfig();
    const layout = this.currentLayout();
    
    // Lógica especial para layout de prioridad
    if (layout === 'priority' && card.priority === 'high') {
      return '12'; // Cards de alta prioridad ocupan todo el ancho en móvil
    }
    
    // Lógica especial para masonry
    if (layout === 'masonry') {
      return config.sizeLg || '3';
    }
    
    return config.size;
  }

  private addAllIcons() {
    addIcons({
      gridOutline,
      listOutline,
      swapVerticalOutline,
      eyeOutline,
      downloadOutline,
      shareOutline,
      trendingUpOutline,
      barChartOutline,
      businessOutline,
      storefrontOutline,
      analyticsOutline
    });
  }
}
