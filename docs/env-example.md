# Пример настройки переменных окружения

## 📝 Содержимое файла `.env`

Создайте файл `.env` в корне проекта со следующим содержимым:

```env
# =================================
# TELEGRAM MINI APP - DEVELOPMENT CONFIG
# =================================

# 🔗 API Configuration (ОБЯЗАТЕЛЬНО)
# Замените на URL вашего бэкенд API
VITE_API_BASE_URL=https://api.example.com

# Для локальной разработки:
# VITE_API_BASE_URL=http://localhost:8000
# VITE_API_BASE_URL=https://abc123.ngrok.io

# 🛠️ Development
NODE_ENV=development

# 📱 Дополнительные настройки
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG_LOGGING=true

# 🔧 Dev Server (опционально)
VITE_DEV_HOST=0.0.0.0
VITE_DEV_PORT=3000
```

## 🌍 Различные среды

### 🧪 Для разработки
```env
VITE_API_BASE_URL=http://localhost:8000
NODE_ENV=development
VITE_ENABLE_DEBUG_LOGGING=true
```

### 🚀 Для продакшена
```env
VITE_API_BASE_URL=https://your-api-domain.com
NODE_ENV=production
VITE_ENABLE_DEBUG_LOGGING=false
```

### 🔧 Для тестирования с ngrok
```env
VITE_API_BASE_URL=https://abc123.ngrok.io
NODE_ENV=development
VITE_ENABLE_DEBUG_LOGGING=true
```

## 📋 Описание переменных

| Переменная | Описание | Обязательная |
|------------|----------|-------------|
| `VITE_API_BASE_URL` | URL вашего бэкенд API | ✅ Да |
| `NODE_ENV` | Режим сборки (development/production) | ✅ Да |
| `VITE_ENABLE_ANALYTICS` | Включить трекинг событий | ❌ Нет |
| `VITE_ENABLE_DEBUG_LOGGING` | Включить отладочные логи | ❌ Нет |
| `VITE_DEV_HOST` | Хост для dev server | ❌ Нет |
| `VITE_DEV_PORT` | Порт для dev server | ❌ Нет |

## 🔐 Безопасность

**⚠️ ВАЖНО:** 
- Никогда не добавляйте `.env` в git
- Используйте только `VITE_` префикс для переменных, доступных в браузере
- Секретные ключи (токены ботов) храните только на сервере

## 📝 Дополнительные переменные (опционально)

Если вы используете дополнительные сервисы:

```env
# 📊 Аналитика
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
VITE_MIXPANEL_TOKEN=your_mixpanel_token

# 🐛 Отслеживание ошибок
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# 💳 Платежи (публичные ключи)
VITE_STRIPE_PUBLIC_KEY=pk_test_xxx

# 🌐 CDN
VITE_CDN_URL=https://cdn.your-domain.com
```

## 🚀 Как создать

### Способ 1: Командная строка
```bash
# Windows
copy docs\env-example.md .env

# Linux/Mac  
cp docs/env-example.md .env
```

### Способ 2: Вручную
1. Создайте файл `.env` в корне проекта
2. Скопируйте содержимое из раздела "Содержимое файла .env" выше
3. Замените `https://api.example.com` на ваш реальный API URL

## ✅ Проверка

После создания `.env` файла:

```bash
npm run dev
```

Если все настроено правильно, в консоли не должно быть ошибок связанных с переменными окружения.
