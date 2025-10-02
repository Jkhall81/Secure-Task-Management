import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-task-analytics',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './task-analytics.component.html',
  styleUrls: ['./task-analytics.component.css'],
})
export class TaskAnalyticsComponent implements OnChanges {
  @Input() tasks: any[] = [];

  private changeCount = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks']) {
      console.log(
        'Tasks changed, updating chart. Change count:',
        ++this.changeCount
      );
      // Force a small delay to ensure Angular change detection completes
      setTimeout(() => {
        this.updateChartData();
      }, 0);
    }
  }

  // Pie Chart Configuration with proper typing
  public pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#e5e7eb',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#f3f4f6',
        bodyColor: '#f3f4f6',
        borderColor: '#4b5563',
        borderWidth: 1,
      },
    },
  };

  public pieChartLabels = ['To Do', 'In Progress', 'Done'];
  public pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: this.pieChartLabels,
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: [
          '#8B5CF6', // purple-500
          '#F59E0B', // yellow-500
          '#10B981', // green-500
        ],
        hoverBackgroundColor: [
          '#7C3AED', // purple-600
          '#D97706', // yellow-600
          '#059669', // green-600
        ],
        borderColor: '#1f2937',
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
    ],
  };

  public pieChartType: ChartConfiguration<'pie'>['type'] = 'pie';

  private updateChartData(): void {
    if (!this.tasks || this.tasks.length === 0) {
      this.pieChartData = {
        ...this.pieChartData,
        datasets: [
          {
            ...this.pieChartData.datasets[0],
            data: [0, 0, 0],
          },
        ],
      };
      return;
    }

    const statusCounts = {
      todo: this.tasks.filter((t) => t.status === 'todo').length,
      'in-progress': this.tasks.filter((t) => t.status === 'in-progress')
        .length,
      done: this.tasks.filter((t) => t.status === 'done').length,
    };

    this.pieChartData = {
      ...this.pieChartData,
      datasets: [
        {
          ...this.pieChartData.datasets[0],
          data: [
            statusCounts.todo,
            statusCounts['in-progress'],
            statusCounts.done,
          ],
        },
      ],
    };
  }
}
