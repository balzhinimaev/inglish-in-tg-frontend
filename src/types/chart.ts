import { ChartData, ChartOptions } from 'chart.js';

// Chart.js data types for different chart types
export type LineChartData = ChartData<'line'>;
export type BarChartData = ChartData<'bar'>;
export type DoughnutChartData = ChartData<'doughnut'>;

// Chart.js options types for different chart types
export type LineChartOptions = ChartOptions<'line'>;
export type BarChartOptions = ChartOptions<'bar'>;
export type DoughnutChartOptions = ChartOptions<'doughnut'>;

// Common chart props interface
export interface BaseChartProps {
  className?: string;
  height?: number;
}

// Progress data interface for your app
export interface ProgressData {
  date: string;
  lessonsCompleted: number;
  xpEarned: number;
  timeSpent: number; // in minutes
}

// Learning stats interface
export interface LearningStats {
  completed: number;
  inProgress: number;
  notStarted: number;
}

// Chart theme colors
export const CHART_COLORS = {
  primary: 'rgba(34, 197, 94, 0.8)',
  primaryBorder: 'rgba(34, 197, 94, 1)',
  secondary: 'rgba(251, 191, 36, 0.8)',
  secondaryBorder: 'rgba(251, 191, 36, 1)',
  tertiary: 'rgba(156, 163, 175, 0.8)',
  tertiaryBorder: 'rgba(156, 163, 175, 1)',
  success: 'rgba(34, 197, 94, 0.8)',
  warning: 'rgba(251, 191, 36, 0.8)',
  neutral: 'rgba(156, 163, 175, 0.8)',
} as const;
