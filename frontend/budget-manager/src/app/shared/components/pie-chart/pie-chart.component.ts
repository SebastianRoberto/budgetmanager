import { Component, Input, OnChanges, OnInit, OnDestroy, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ArcElement, Tooltip, Legend, DoughnutController, ChartData, ChartOptions } from 'chart.js';
import { ThemeService } from '../../../core/services/theme.service';
import { Subject, takeUntil } from 'rxjs';

// CRITICAL: Register DoughnutController to fix the error
Chart.register(ArcElement, Tooltip, Legend, DoughnutController);

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './pie-chart.component.html',
  styleUrl: './pie-chart.component.scss'
})
export class PieChartComponent implements OnChanges, OnInit, OnDestroy {
  private themeService = inject(ThemeService);
  private destroy$ = new Subject<void>();

  @Input() labels: string[] = [];
  @Input() data: number[] = [];
  @Input() currency = 'USD';

  chartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 16,
          color: '#64748b' // Will be updated by theme
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            const total = this.data.reduce((acc, curr) => acc + curr, 0);
            const percentage = total ? ((value / total) * 100).toFixed(1) : 0;
            return `${context.label}: ${new Intl.NumberFormat('es-ES', {
              style: 'currency',
              currency: this.currency,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }).format(value)} (${percentage}%)`;
          }
        }
      }
    }
  };

  get hasData(): boolean {
    return this.data && this.data.some((value) => value > 0);
  }

  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeService.theme$.pipe(takeUntil(this.destroy$)).subscribe(theme => {
      this.updateChartColors(theme);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['labels'] || changes['data']) {
      this.chartData = {
        labels: this.labels,
        datasets: [
          {
            data: this.data,
            backgroundColor: this.generateColors(this.data.length),
            borderWidth: 0
          }
        ]
      };
    }
  }

  private updateChartColors(theme: 'light' | 'dark'): void {
    const textColor = theme === 'dark' ? '#f1f5f9' : '#64748b';

    if (this.chartOptions.plugins?.legend?.labels) {
      this.chartOptions.plugins.legend.labels.color = textColor;
    }
  }

  private generateColors(length: number): string[] {
    const palette = ['#6366f1', '#14b8a6', '#f97316', '#f43f5e', '#84cc16', '#06b6d4', '#a855f7'];
    return Array.from({ length }, (_, index) => palette[index % palette.length]);
  }
}
