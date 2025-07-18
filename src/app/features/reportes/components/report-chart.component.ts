import { Component, ElementRef, Input, ViewChild, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { ChartableData } from '../interfaces/shared.interface';

Chart.register(...registerables);

@Component({
  selector: 'app-report-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container relative h-64 w-full">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      width: 100%;
      height: 256px;
    }
    
    canvas {
      max-width: 100%;
      max-height: 100%;
    }
  `]
})
export class ReportChartComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  @Input() datos: ChartableData[] = [];
  @Input() tipo: 'bar' | 'line' | 'pie' | 'doughnut' = 'bar';
  @Input() titulo: string = 'Reporte';
  @Input() colorPrincipal: string = '#3880ff';
  
  private chart: Chart | null = null;
  
  ngOnInit() {
    this.createChart();
  }
  
  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
  
  private createChart() {
    if (!this.chartCanvas?.nativeElement || !this.datos.length) return;
    
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Destruir gráfico anterior si existe
    if (this.chart) {
      this.chart.destroy();
    }
    
    const config = this.getChartConfig();
    this.chart = new Chart(ctx, config);
  }
  
  private getChartConfig(): ChartConfiguration {
    const { labels, values } = this.extractDataFromItems();
    
    const colors = this.generateColors(this.datos.length);
    
    const config: ChartConfiguration = {
      type: this.tipo,
      data: {
        labels,
        datasets: [{
          label: this.titulo,
          data: values,
          backgroundColor: this.tipo === 'pie' || this.tipo === 'doughnut' ? colors : this.colorPrincipal,
          borderColor: this.tipo === 'line' ? this.colorPrincipal : colors,
          borderWidth: 2,
          fill: this.tipo === 'line' ? false : true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: this.titulo,
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            display: this.tipo === 'pie' || this.tipo === 'doughnut',
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed;
                const formattedValue = typeof value === 'number' 
                  ? new Intl.NumberFormat('es-HN', { 
                      style: 'currency', 
                      currency: 'HNL' 
                    }).format(value)
                  : value;
                return `${context.label}: ${formattedValue}`;
              }
            }
          }
        },
        scales: this.getScalesConfig()
      }
    };
    
    return config;
  }
  
  private extractDataFromItems(): { labels: string[]; values: number[] } {
    const labels: string[] = [];
    const values: number[] = [];
    
    this.datos.forEach(item => {
      // Usar directamente la nueva interfaz ChartableData simplificada
      labels.push(item.etiqueta);
      values.push(item.valor);
    });
    
    return { labels, values };
  }
  
  private getScalesConfig() {
    if (this.tipo === 'pie' || this.tipo === 'doughnut') {
      return {};
    }
    
    return {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => {
            if (value >= 1000000) {
              return 'L.' + (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return 'L.' + (value / 1000).toFixed(0) + 'K';
            }
            return new Intl.NumberFormat('es-HN', { 
              style: 'currency', 
              currency: 'HNL'
            }).format(value);
          }
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0
        }
      }
    };
  }
  
  private generateColors(count: number): string[] {
    const baseColors = [
      '#3880ff', '#3dc2ff', '#2fdf75', '#ffce00',
      '#ff6b6b', '#845ec2', '#f39c12', '#e74c3c',
      '#1abc9c', '#34495e', '#9b59b6', '#16a085'
    ];
    
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    
    return colors;
  }
  
  updateChart(newDatos: ChartableData[], newTipo?: ChartType) {
    this.datos = newDatos;
    if (newTipo) {
      this.tipo = newTipo as 'bar' | 'line' | 'pie' | 'doughnut';
    }
    this.createChart();
  }
}
