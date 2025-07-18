export interface ChartableData {
  etiqueta: string;
  valor: number;
  color?: string;
}

export interface TabItem {
  id: string;
  label: string;
  icon: string;
  color?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger' | 'light' | 'medium' | 'dark';
  badge?: any;
}
