# Chart.js Integration Guide

## Установка

Chart.js уже установлен в проекте с помощью команды:
```bash
npm install react-chartjs-2 chart.js
```

## Компоненты

### 1. Базовый компонент Chart
Расположен в `src/components/Chart.tsx`

Поддерживает типы графиков:
- `line` - линейные графики
- `bar` - столбчатые диаграммы  
- `doughnut` - круговые диаграммы

### 2. Готовые компоненты для приложения
Расположены в `src/components/ProgressChart.tsx`:

- `ProgressChart` - график прогресса за неделю
- `LearningStatsChart` - общая статистика обучения

## Использование

### Базовое использование
```tsx
import { Chart } from '../components';

const data = {
  labels: ['Jan', 'Feb', 'Mar'],
  datasets: [{
    label: 'Progress',
    data: [65, 59, 80],
    borderColor: 'rgb(59, 130, 246)',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  }],
};

<Chart type="line" data={data} />
```

### Готовые компоненты
```tsx
import { ProgressChart, LearningStatsChart } from '../components';

<ProgressChart />
<LearningStatsChart />
```

## Типизация

Типы для Chart.js находятся в `src/types/chart.ts`:
- `LineChartData`, `BarChartData`, `DoughnutChartData`
- `LineChartOptions`, `BarChartOptions`, `DoughnutChartOptions`
- `CHART_COLORS` - константы цветов

## Примеры интеграции

График уже интегрирован в `ProfileScreen.tsx` как пример использования.

## Кастомизация

Все графики используют Tailwind CSS классы и поддерживают:
- Адаптивный дизайн
- Темную/светлую тему (через CSS переменные)
- Анимации при загрузке
- Интерактивность (hover, tooltips)

## Регистрация компонентов Chart.js

В `Chart.tsx` уже зарегистрированы основные компоненты:
- CategoryScale, LinearScale
- PointElement, LineElement, BarElement, ArcElement  
- Title, Tooltip, Legend

Для дополнительных типов графиков добавьте нужные компоненты в регистрацию.
