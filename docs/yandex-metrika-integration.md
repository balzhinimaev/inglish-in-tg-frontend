# Yandex.Metrika Integration

Интеграция Yandex.Metrika для отслеживания аналитики в SPA приложении.

## Обзор

Yandex.Metrika интегрирована в проект для отслеживания:
- Просмотров страниц (экранов)
- Пользовательских действий
- Конверсий (покупок)
- Событий обучения

## Файлы

### `src/utils/yandexMetrika.ts`
Основная утилита для работы с Yandex.Metrika:
- `initYandexMetrika()` - инициализация счетчика
- `trackPageView(url, title)` - отслеживание просмотров страниц
- `trackEvent(action, category, label, value)` - отслеживание событий
- `trackEcommerce(action, data)` - отслеживание ecommerce событий

### `src/hooks/useYandexMetrika.ts`
React хуки для интеграции:
- `useYandexMetrika()` - автоматическое отслеживание переходов между экранами
- `useTrackAction()` - методы для отслеживания пользовательских действий

## Использование

### Автоматическое отслеживание экранов

В `App.tsx` уже подключен хук `useYandexMetrika()`, который автоматически отслеживает переходы между экранами:

```tsx
import { useYandexMetrika } from './hooks/useYandexMetrika';

const App: React.FC = () => {
  // Автоматически отслеживает переходы между экранами
  useYandexMetrika();
  
  // ... остальной код
};
```

### Отслеживание пользовательских действий

Используйте хук `useTrackAction()` в компонентах:

```tsx
import { useTrackAction } from '../hooks/useYandexMetrika';

const MyComponent = () => {
  const { 
    trackLessonStart, 
    trackLessonComplete, 
    trackPaywallView, 
    trackPurchase 
  } = useTrackAction();

  const handleLessonStart = (lessonId: string, moduleRef: string) => {
    trackLessonStart(lessonId, moduleRef);
  };

  const handlePurchase = (productId: string, price: number) => {
    trackPurchase(productId, price);
  };

  // ... остальной код
};
```

### Доступные методы отслеживания

- `trackLessonStart(lessonId, moduleRef)` - начало урока
- `trackLessonComplete(lessonId, moduleRef)` - завершение урока
- `trackModuleStart(moduleRef)` - начало модуля
- `trackModuleComplete(moduleRef)` - завершение модуля
- `trackPaywallView()` - просмотр paywall
- `trackPurchase(productId, price)` - покупка
- `trackProfileAction(action)` - действие в профиле

## Настройка

### ID счетчика

ID счетчика Yandex.Metrika настроен в `src/utils/yandexMetrika.ts`:

```typescript
const YANDEX_METRIKA_ID = 104180061;
```

### Инициализация

Счетчик автоматически инициализируется в `src/main.tsx`:

```typescript
import { initYandexMetrika } from './utils/yandexMetrika';

// Initialize Yandex.Metrika
initYandexMetrika();
```

## Отслеживаемые события

### Автоматические события

1. **Переходы между экранами** - автоматически отслеживаются при изменении `appState`
2. **Просмотры экранов** - отправляются в Yandex.Metrika как page views

### Пользовательские события

1. **Обучение:**
   - `lesson_start` - начало урока
   - `lesson_complete` - завершение урока
   - `module_start` - начало модуля
   - `module_complete` - завершение модуля

2. **Конверсии:**
   - `paywall_view` - просмотр paywall
   - `purchase` - покупка подписки

3. **Профиль:**
   - `profile_action` - действия в профиле

## Структура данных

### Page Views
```typescript
{
  url: "/screen-name",
  title: "Screen: screen-name",
  referer: "previous-page"
}
```

### Custom Events
```typescript
{
  action: "lesson_start",
  category: "learning",
  label: "module-ref-lesson-id",
  value: undefined
}
```

## Отладка

Для отладки откройте консоль браузера и проверьте:
1. Загрузку скрипта Yandex.Metrika
2. Вызовы `window.ym()` функций
3. Отправку событий в сетевой вкладке

## Дополнительные возможности

### Ecommerce отслеживание

Для отслеживания покупок используйте:

```typescript
import { trackEcommerce } from '../utils/yandexMetrika';

// Отслеживание покупки
trackEcommerce('purchase', {
  orderId: 'order-123',
  total: 1990,
  currency: 'RUB',
  products: [{
    id: 'product-1',
    name: 'Monthly Subscription',
    price: 1990,
    quantity: 1
  }]
});
```

### Дополнительные события

Для отслеживания дополнительных событий:

```typescript
import { trackEvent } from '../utils/yandexMetrika';

// Отслеживание клика по кнопке
trackEvent('button_click', 'ui', 'subscribe_button');

// Отслеживание ошибки
trackEvent('error', 'system', 'payment_failed', 1);
```
