# Инструкция по развертыванию

## 🚀 Автоматический деплой через GitHub Actions (рекомендуется)

**Самый простой способ - ничего не нужно настраивать на VPS вручную!**

> ℹ️ **Примечание:** Файл `deploy.sh` нужен только для ручного деплоя. При использовании GitHub Actions он **НЕ НУЖЕН**.

### 1. Настройка переменных в GitHub Repository

Перейдите в Settings → Secrets and variables → Actions и добавьте:

**Secrets (секретные данные):**
```
VPS_HOST=your-server-ip-or-domain
VPS_USER=root (или другой пользователь с правами Docker)
VPS_SSH_KEY=содержимое приватного SSH ключа
VPS_PORT=22 (опционально, если используется другий порт)
VITE_API_BASE_URL=https://your-api-domain.com (URL вашего API)
```

**Variables (публичные переменные):**
```
# Основные настройки
APP_NAME=telegram-frontend
APP_PORT=8004
DEPLOY_PATH=/opt/telegram-frontend

# Настройки приложения
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG_LOGGING=false

# Настройки развертывания
CONTAINER_RESTART_POLICY=unless-stopped
STARTUP_WAIT_TIME=10
CLEANUP_OLD_IMAGES=true

# Настройки healthcheck
HEALTH_CHECK_INTERVAL=30s
HEALTH_CHECK_TIMEOUT=10s
HEALTH_CHECK_RETRIES=3
HEALTH_CHECK_START_PERIOD=40s
```

> **💡 Важно:** `VITE_API_BASE_URL` содержит секретную информацию и должен быть в Secrets, а остальные VITE_ переменные можно разместить в Variables.

### 2. Подготовка VPS (один раз)

Убедитесь что на VPS установлен только Docker:
```bash
# Установка Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Добавить пользователя в группу docker
sudo usermod -aG docker $USER

# Перезагрузиться или выйти/войти в систему
```

**Больше НИЧЕГО настраивать не нужно!** GitHub Actions сам создаст все необходимые директории и запустит контейнер.

### 3. Настройка nginx на VPS (один раз)

Добавьте в конфиг nginx (обычно `/etc/nginx/sites-available/default`):

```nginx
# Прокси для фронтенда на порт 8004
location /webapp/ {
    proxy_pass http://localhost:8004/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

Перезапустите nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Автоматический деплой - готово! 

После каждого коммита в main/master ветку GitHub Actions **полностью автоматически**:
1. ✅ Соберет Docker образ с вашими переменными
2. ✅ Загрузит его в GitHub Container Registry  
3. ✅ Подключится к VPS по SSH
4. ✅ Создаст директории `/opt/telegram-frontend/` (если нет)
5. ✅ Остановит старый контейнер (если есть)
6. ✅ Запустит новый контейнер на порту 8004
7. ✅ Проверит что приложение отвечает
8. ✅ Очистит старые образы

**Вам не нужно заходить на VPS и ничего там настраивать!**

## 🔧 Альтернативные способы деплоя (если не хотите GitHub Actions)

### 1. Создание .env файла

Создайте `.env` файл на основе `.env.example`:
```bash
cp .env.example .env
```

Отредактируйте `.env` с вашими значениями:
```env
VITE_API_BASE_URL=https://your-api-domain.com
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG_LOGGING=false
NODE_ENV=production
```

### 2. Локальная сборка:
```bash
# С переменными из .env
docker-compose build

# Или с прямой передачей переменных
docker build \
  --build-arg VITE_API_BASE_URL=https://your-api.com \
  --build-arg VITE_ENABLE_ANALYTICS=true \
  --build-arg NODE_ENV=production \
  -t telegram-frontend .

docker run -p 8004:8004 telegram-frontend
```

### 3. С использованием docker-compose:
```bash
# Убедитесь что .env файл существует
docker-compose up -d
```

### 4. Ручной деплой на VPS:

~~**Вариант A: Через GitHub Actions**~~ 
- ✅ **УЖЕ НАСТРОЕНО ВЫШЕ** - основной способ!

**Вариант B: Ручной деплой с docker-compose**
```bash
# На VPS создайте рабочую директорию
mkdir -p /opt/telegram-frontend
cd /opt/telegram-frontend

# Скопируйте файлы
scp docker-compose.yml .env user@your-server:/opt/telegram-frontend/

# На VPS запустите:
docker-compose up -d
```

**Вариант C: Ручной деплой с deploy.sh**
```bash
# На VPS в любой рабочей директории (например /home/user)
cd /home/user

# Скопируйте файлы
scp deploy.sh .env user@your-server:/home/user/

# На VPS выполните:
chmod +x deploy.sh

# С переменными из .env файла
source .env && GITHUB_TOKEN=your_token GITHUB_REPOSITORY=your_repo ./deploy.sh

# Или напрямую с переменными (без .env):
VITE_API_BASE_URL=https://your-api.com \
GITHUB_TOKEN=your_token \
GITHUB_REPOSITORY=your_repo \
./deploy.sh
```

## Проверка работы

После деплоя приложение будет доступно по адресу:
- Локально: http://localhost:8004/
- На VPS через nginx: http://your-domain/webapp/

## Мониторинг

```bash
# Статус контейнера
docker ps | grep telegram-frontend

# Логи контейнера
docker logs -f telegram-frontend

# Использование ресурсов
docker stats telegram-frontend
```

## Troubleshooting

### Контейнер не запускается:
```bash
docker logs telegram-frontend
```

### Проблемы с доступом:
```bash
# Проверка работы на 8004 порту
curl http://localhost:8004/

# Проверка nginx конфига
sudo nginx -t
```

### Очистка старых образов:
```bash
docker system prune -f
docker image prune -a -f
```

## 🔐 Переменные окружения

### Список переменных

#### 🚀 Основные настройки деплоя
| Переменная | Описание | По умолчанию |
|-----------|----------|--------------|
| `APP_NAME` | Название контейнера | `telegram-frontend` |
| `APP_PORT` | Порт приложения | `8004` |
| `DEPLOY_PATH` | Путь на сервере | `/opt/telegram-frontend` |

#### 🔧 Настройки приложения  
| Переменная | Описание | По умолчанию |
|-----------|----------|--------------|
| `VITE_API_BASE_URL` | URL бэкенд API ⚠️ | `https://api.example.com` |
| `VITE_ENABLE_ANALYTICS` | Включить аналитику | `true` |
| `VITE_ENABLE_DEBUG_LOGGING` | Включить отладку | `false` |
| `NODE_ENV` | Режим приложения | `production` |

#### 🐳 Настройки Docker
| Переменная | Описание | По умолчанию |
|-----------|----------|--------------|
| `CONTAINER_RESTART_POLICY` | Политика перезапуска | `unless-stopped` |
| `STARTUP_WAIT_TIME` | Время ожидания старта (сек) | `10` |
| `CLEANUP_OLD_IMAGES` | Очищать старые образы | `true` |

#### 🏥 Настройки healthcheck
| Переменная | Описание | По умолчанию |
|-----------|----------|--------------|
| `HEALTH_CHECK_INTERVAL` | Интервал проверки | `30s` |
| `HEALTH_CHECK_TIMEOUT` | Таймаут проверки | `10s` |
| `HEALTH_CHECK_RETRIES` | Количество попыток | `3` |
| `HEALTH_CHECK_START_PERIOD` | Период старта | `40s` |

> ⚠️ **VITE_API_BASE_URL** - единственная обязательная переменная

### Создание .env файла

**Локально (для разработки):**
```bash
# В корне проекта
cp .env.example .env
nano .env
```

**На VPS (только для ручного деплоя):**

🔸 **Если используете GitHub Actions** → `.env` файл НЕ НУЖЕН!

🔸 **Если используете docker-compose на VPS:**
```bash
# Создайте директорию для проекта
mkdir -p /opt/telegram-frontend
cd /opt/telegram-frontend

# Создайте .env файл
nano .env
# Вставьте содержимое (см. пример ниже)

# Скопируйте docker-compose.yml
scp docker-compose.yml user@your-server:/opt/telegram-frontend/
```

🔸 **Если используете deploy.sh на VPS:**
```bash
# В любой рабочей директории, например:
cd /home/user
# или
cd /opt/telegram-frontend

# Создайте .env файл
nano .env
# Вставьте содержимое (см. пример ниже)
```

Пример `.env`:
```env
# =================================
# ОСНОВНЫЕ НАСТРОЙКИ (можно изменить)
# =================================

# Основные настройки деплоя
APP_NAME=my-telegram-app
APP_PORT=9000
DEPLOY_PATH=/opt/my-app

# Настройки приложения (ОБЯЗАТЕЛЬНО настроить API!)
VITE_API_BASE_URL=https://your-backend-api.com
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG_LOGGING=false
NODE_ENV=production

# =================================
# ДОПОЛНИТЕЛЬНЫЕ НАСТРОЙКИ (опционально)
# =================================

# Настройки Docker
CONTAINER_RESTART_POLICY=unless-stopped
STARTUP_WAIT_TIME=15
CLEANUP_OLD_IMAGES=true

# Настройки healthcheck
HEALTH_CHECK_INTERVAL=30s
HEALTH_CHECK_TIMEOUT=10s
HEALTH_CHECK_RETRIES=3
HEALTH_CHECK_START_PERIOD=40s
```

### Приоритет переменных

1. **GitHub Actions**: Secrets и Variables в репозитории
2. **Docker Compose**: Переменные из `.env` файла
3. **Ручной деплой**: Переменные окружения системы
4. **По умолчанию**: Значения из Dockerfile

### Безопасность

⚠️ **Важно:**
- Никогда не коммитьте `.env` файл в git
- Секретные ключи храните в GitHub Secrets
- Используйте только `VITE_` префикс для переменных, доступных в браузере
- API URL и токены должны быть в секретах, а не в переменных

### Проверка переменных

```bash
# Локальная проверка
echo $VITE_API_BASE_URL

# В контейнере
docker exec telegram-frontend printenv | grep VITE

# Логи сборки (покажут какие переменные использованы)
docker logs telegram-frontend
```
