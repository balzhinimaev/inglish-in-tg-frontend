# 🔐 Настройка GitHub Secrets и Variables

## 📍 Где находится настройка

1. Откройте ваш GitHub репозиторий
2. Нажмите **Settings** (вкладка справа от Code)
3. В левом меню найдите **Secrets and variables** 
4. Нажмите **Actions**

## 🔒 Secrets (секретные данные)

### Путь: Settings → Secrets and variables → Actions → **Secrets** tab

**Нажмите "New repository secret" и добавьте:**

| Name | Value (что вставить) |
|------|---------------------|
| `VPS_HOST` | `123.456.789.123` (IP вашего VPS) |
| `VPS_USER` | `root` (или username для SSH) |
| `VPS_SSH_KEY` | Содержимое приватного SSH ключа* |
| `VITE_API_BASE_URL` | `https://your-backend-api.com` (URL вашего API) |

### 🔑 Как получить SSH ключ:

**На Windows:**
```bash
# Генерируем ключ (если нет)
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Копируем ПРИВАТНЫЙ ключ (не .pub!)
type C:\Users\%USERNAME%\.ssh\id_rsa
```

**На Linux/Mac:**
```bash
# Генерируем ключ (если нет)  
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Копируем ПРИВАТНЫЙ ключ (не .pub!)
cat ~/.ssh/id_rsa
```

**Содержимое должно начинаться с:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAACmFlczI1Ni1jdHIAAAAGYmNyeXB0AAAA...
...
-----END OPENSSH PRIVATE KEY-----
```

**⚠️ Публичный ключ (id_rsa.pub) нужно добавить на VPS:**
```bash
# На VPS выполните:
mkdir -p ~/.ssh
echo "ssh-rsa AAAAB3NzaC1yc..." >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

## 🌍 Variables (публичные переменные)

### Путь: Settings → Secrets and variables → Actions → **Variables** tab  

**Нажмите "New repository variable" и добавьте:**

### 🚀 Основные настройки (обязательно)
| Name | Value | Описание |
|------|-------|----------|
| `APP_NAME` | `telegram-frontend` | Название контейнера |
| `APP_PORT` | `8004` | Порт приложения |
| `DEPLOY_PATH` | `/opt/telegram-frontend` | Путь на сервере |

### 🔧 Настройки приложения (опционально)
| Name | Value | Описание |
|------|-------|----------|
| `VITE_ENABLE_ANALYTICS` | `true` | Включить аналитику |
| `VITE_ENABLE_DEBUG_LOGGING` | `false` | Отладочные логи |
| `VITE_BOT_USERNAME` | `englishintg_bot` | Username вашего Telegram бота |
| `VITE_TELEGRAM_WEB_APP_URL` | `https://t.me/englishintg_bot/webapp` | URL для QR кода |

### 🐳 Настройки Docker (опционально)
| Name | Value | Описание |
|------|-------|----------|
| `CONTAINER_RESTART_POLICY` | `unless-stopped` | Политика перезапуска |
| `STARTUP_WAIT_TIME` | `10` | Время ожидания старта |
| `CLEANUP_OLD_IMAGES` | `true` | Очищать старые образы |

### 🏥 Настройки healthcheck (опционально)
| Name | Value | Описание |
|------|-------|----------|
| `HEALTH_CHECK_INTERVAL` | `30s` | Интервал проверки |
| `HEALTH_CHECK_TIMEOUT` | `10s` | Таймаут проверки |
| `HEALTH_CHECK_RETRIES` | `3` | Количество попыток |
| `HEALTH_CHECK_START_PERIOD` | `40s` | Период старта |

## 🎯 Пример заполнения

### Secrets:
```
VPS_HOST: 167.172.184.123
VPS_USER: root  
VPS_SSH_KEY: -----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAACmFlczI1Ni1jdHIAAAAGYmNyeXB0AAAA...
...
-----END OPENSSH PRIVATE KEY-----
VITE_API_BASE_URL: https://api.myproject.com
```

### Variables (минимальный набор):
```
APP_NAME: my-telegram-app
APP_PORT: 9000
DEPLOY_PATH: /opt/my-app
VITE_ENABLE_ANALYTICS: true
VITE_ENABLE_DEBUG_LOGGING: false
```

## ✅ Проверка настройки

После добавления всех переменных:
1. Сделайте коммит в main/master ветку
2. Перейдите в **Actions** tab в GitHub
3. Посмотрите логи выполнения workflow
4. Если всё настроено правильно - приложение задеплоится автоматически!

## 🚨 Частые ошибки

❌ **Неправильно**: Добавили публичный ключ (.pub) в VPS_SSH_KEY  
✅ **Правильно**: Добавить приватный ключ (без .pub)

❌ **Неправильно**: VPS_HOST = `https://myserver.com`  
✅ **Правильно**: VPS_HOST = `myserver.com` или `123.456.789.123`

❌ **Неправильно**: Добавили VITE_API_BASE_URL в Variables  
✅ **Правильно**: VITE_API_BASE_URL должен быть в Secrets

## 🔄 Что происходит после настройки

1. **Push в main** → GitHub Actions запускается
2. **Собирается** Docker образ с вашими переменными  
3. **Загружается** в GitHub Container Registry
4. **Подключается** к VPS по SSH (используя ваши Secrets)
5. **Создает** директорию на VPS (используя DEPLOY_PATH)
6. **Запускает** контейнер на нужном порту (APP_PORT)
7. **Готово!** Приложение работает 🎉
