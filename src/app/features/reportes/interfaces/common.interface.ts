export interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
  priority: 'high' | 'medium' | 'low';
  category: 'financial' | 'operational' | 'analytical';
  actions: {
    pdf: () => void;
    excel: () => void;
    view: () => void;
  };
  // Propiedad adicional para compatibilidad con SmartLayoutComponent
  type?: string;
}

export interface ChartData {
  label: string;
  value: number;
}

export interface LayoutSettings {
  mode: 'auto' | 'grid' | 'masonry' | 'priority';
  viewportWidth: number;
}
