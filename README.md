# Telegram Mini App Frontend

Современный Frontend для Telegram Mini App с фокусом на обучение и подписки.

## 🚀 Технологический стек

- **React 18** - современная библиотека для UI
- **TypeScript** - типизированный JavaScript
- **Vite** - быстрый сборщик для разработки
- **TailwindCSS** - утилитарные CSS классы
- **TanStack Query** - управление серверным состоянием
- **Zustand** - легковесное управление клиентским состоянием
- **@twa-dev/sdk** - SDK для интеграции с Telegram WebApp
- **Axios** - HTTP клиент

## 🏗️ Архитектура

Проект организован по feature-based архитектуре:

```
src/
├── components/     # Переиспользуемые UI компоненты
├── features/       # Экраны приложения
├── services/       # API клиенты и внешние сервисы
├── store/          # Глобальное состояние (Zustand)
├── hooks/          # Пользовательские хуки
├── types/          # TypeScript типы
└── utils/          # Утилиты и константы
```

## 🔐 Безопасность

- Все API запросы авторизуются через `initData` из Telegram WebApp
- Заголовок авторизации: `Authorization: TWA <initData>`
- Бэкенд должен валидировать `initData` на каждом запросе

## 📱 Основные экраны

1. **LoaderScreen** - Проверка авторизации и определение следующего экрана
2. **OnboardingScreen** - Выбор уровня владения языком для новых пользователей  
3. **LessonScreen** - Основной урок с аудио и текстовым контентом
4. **PaywallScreen** - Экран покупки подписки с тарифными планами
5. **ProfileScreen** - Профиль пользователя и статус подписки
6. **ErrorScreen** - Обработка ошибок

## 🔄 User Flow

1. Запуск → `LoaderScreen` → проверка `auth/verify`
2. Новый пользователь → `OnboardingScreen` → выбор уровня
3. Существующий пользователь → `LessonScreen`
4. После урока 1 без подписки → `PaywallScreen`
5. Профиль доступен всегда через навигацию

## ⚙️ Установка и запуск

### Быстрый старт
```bash
npm install
npm run dev
```

**Если возникли ошибки 404:** смотрите [QUICK_START.md](QUICK_START.md) или [docs/troubleshooting.md](docs/troubleshooting.md)

### Полная установка

1. Установите зависимости:
```bash
npm install
```

2. Создайте `.env` файл на основе `.env.example`:
```bash
cp .env.example .env  # Linux/Mac
copy .env.example .env  # Windows
```

3. Запустите проект в режиме разработки:
```bash
npm run dev              # Обычный запуск
npm run dev:force        # С очисткой кэша (если есть проблемы)
npm run dev:host         # Доступ со всех IP
```

4. Соберите проект для продакшена:
```bash
npm run build
```

### Для Windows пользователей
Запустите `scripts\dev-setup.bat` для автоматической настройки.

## 🔧 Доступные команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск в режиме разработки |
| `npm run dev:force` | Запуск с очисткой кэша (решает 404 ошибки) |
| `npm run dev:host` | Запуск с доступом со всех IP адресов |
| `npm run build` | Сборка для продакшена |
| `npm run preview` | Предпросмотр собранного проекта |
| `npm run lint` | Проверка кода линтером |
| `npm run lint:fix` | Автоисправление ошибок линтера |
| `npm run type-check` | Проверка типов TypeScript |
| `npm run clean` | Очистка node_modules и пересборка |
| `npm run setup` | Установка зависимостей + проверка типов |

## 🐛 Решение проблем

**Ошибки 404 для client/@react-refresh?**
```bash
npm run dev:force
```

**Другие проблемы?**
- [QUICK_START.md](QUICK_START.md) - быстрые решения
- [docs/troubleshooting.md](docs/troubleshooting.md) - подробное руководство

## 🎨 UI/UX особенности

- **Mobile First** - все компоненты оптимизированы для мобильных устройств
- **Telegram Theme** - автоматическая адаптация к теме Telegram
- **Haptic Feedback** - тактильные отклики для лучшего UX
- **Smooth Animations** - плавные переходы между состояниями
- **Accessibility** - поддержка базовой доступности

## 📊 State Management

### Zustand Store (`useUserStore`)
- Данные пользователя и подписки
- Состояние приложения и навигация
- Персистентность важных данных

### TanStack Query
- Кэширование API запросов
- Автоматическая ревалидация данных
- Обработка ошибок загрузки

## 🔌 API Integration

Все API запросы проходят через единый `apiClient` с автоматическим добавлением Telegram авторизации.

### Основные endpoints:
- `GET /api/v2/auth/verify` - проверка пользователя
- `PATCH /api/v2/profile/onboarding/complete` - завершение онбординга
- `GET /api/v2/content/lesson1` - получение урока
- `GET /api/v2/content/paywall` - тарифные планы
- `GET /api/v2/entitlements/:userId` - статус подписки
- `POST /api/v2/events` - трекинг событий

## 🎯 События и аналитика

Автоматический трекинг ключевых событий:
- Начало/завершение онбординга
- Старт/завершение урока
- Просмотр paywall
- Инициация покупки

## 🚀 Deployment

1. Соберите проект: `npm run build`
2. Загрузите содержимое папки `dist/` на ваш веб-сервер
3. Настройте HTTPS (обязательно для Telegram WebApp)
4. Обновите URL в боте через BotFather

## 🔍 Разработка

### Отладка
- React DevTools для отладки компонентов
- TanStack Query DevTools для мониторинга запросов
- Console логи для Telegram WebApp событий

### Тестирование в Telegram
1. Создайте бота через @BotFather
2. Установите URL WebApp на ваш локальный сервер (с HTTPS)
3. Используйте ngrok или similar для локального HTTPS

## 📝 Примечания

- Приложение оптимизировано для работы внутри Telegram
- Требуется HTTPS для корректной работы WebApp API
- Поддержка тёмной/светлой темы через CSS переменные
- Все тексты на русском языке

## 🤝 Contributing

1. Форкните репозиторий
2. Создайте feature ветку
3. Внесите изменения с соблюдением архитектуры
4. Проверьте типы и линтер
5. Создайте Pull Request
