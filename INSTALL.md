# Инструкция по установке на LXC контейнер Debian в Proxmox

## 1. Создание LXC контейнера в Proxmox

### 1.1. Скачать шаблон Debian
В веб-интерфейсе Proxmox:
1. Перейдите в **local (pve)** → **CT templates**
2. Нажмите **Templates**
3. Найдите и скачайте **debian-12-standard** (или новее)

### 1.2. Создать контейнер
1. Нажмите **Create CT** (правый верхний угол)
2. Заполните параметры:
   - **Hostname**: `contract-registry` (или любое имя)
   - **Password**: задайте пароль root
   - **Template**: выберите скачанный debian-12
   - **Disk size**: 8-16 GB (достаточно)
   - **CPU**: 2 cores
   - **Memory**: 2048 MB
   - **Network**: DHCP или статический IP
   - **DNS**: используйте настройки хоста
3. Нажмите **Finish**

### 1.3. Запустить контейнер
```bash
# В веб-интерфейсе Proxmox или через консоль:
pct start <CTID>
```

## 2. Подключение к контейнеру

### Вариант A: Через консоль Proxmox
```bash
pct enter <CTID>
```

### Вариант B: Через SSH
```bash
ssh root@<IP-адрес-контейнера>
```

## 3. Обновление системы

```bash
apt update && apt upgrade -y
```

## 4. Установка Node.js и npm

```bash
# Установка Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Проверка установки
node --version  # Должно показать v20.x.x
npm --version   # Должно показать 10.x.x
```

## 5. Установка Nginx

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

## 6. Развёртывание приложения

### 6.1. Создать директорию для приложения
```bash
mkdir -p /opt/contract-registry
cd /opt/contract-registry
```

### 6.2. Скопировать файлы приложения

**Вариант A: Через SCP (с локальной машины)**
```bash
# На вашем компьютере, где собран проект:
scp -r dist/* root@<IP-контейнера>:/opt/contract-registry/
```

**Вариант B: Через git (если проект в репозитории)**
```bash
apt install -y git
git clone <URL-репозитория> /opt/contract-registry
cd /opt/contract-registry
npm install
npm run build
```

**Вариант C: Через файловый менеджер Proxmox**
1. В веб-интерфейсе Proxmox выберите контейнер
2. Перейдите в **Console**
3. Используйте `nano` или `vim` для создания файлов
4. Или загрузите через **Backup/Restore**

### 6.3. Установить права
```bash
chown -R www-data:www-data /opt/contract-registry
chmod -R 755 /opt/contract-registry
```

## 7. Настройка Nginx

### 7.1. Создать конфигурацию сайта
```bash
nano /etc/nginx/sites-available/contract-registry
```

Вставьте следующий конфиг:

```nginx
server {
    listen 80;
    server_name _;  # Или ваш домен/IP

    root /opt/contract-registry;
    index index.html;

    # Кэширование статических файлов
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Основной маршрут (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Логирование
    access_log /var/log/nginx/contract-registry.access.log;
    error_log /var/log/nginx/contract-registry.error.log;
}
```

### 7.2. Активировать сайт
```bash
# Удалить стандартный сайт
rm /etc/nginx/sites-enabled/default

# Создать символическую ссылку
ln -s /etc/nginx/sites-available/contract-registry /etc/nginx/sites-enabled/

# Проверить конфигурацию
nginx -t

# Перезагрузить Nginx
systemctl reload nginx
```

## 8. Настройка firewall (опционально)

```bash
apt install -y ufw

# Разрешить SSH
ufw allow 22/tcp

# Разрешить HTTP
ufw allow 80/tcp

# Разрешить HTTPS (если настроите SSL)
ufw allow 443/tcp

# Включить firewall
ufw enable
```

## 9. Настройка HTTPS (опционально, но рекомендуется)

### 9.1. Установить Certbot
```bash
apt install -y certbot python3-certbot-nginx
```

### 9.2. Получить SSL сертификат
```bash
# Замените your-domain.com на ваш домен
certbot --nginx -d your-domain.com
```

Следуйте инструкциям:
- Введите email
- Согласитесь с условиями
- Выберите перенаправление HTTP → HTTPS (рекомендуется)

### 9.3. Автоматическое обновление
Certbot автоматически настроит cron для обновления сертификатов.

## 10. Резервное копирование данных

Данные приложения хранятся в localStorage браузера пользователя. Для резервного копирования на сервере:

### 10.1. Создать скрипт бэкапа
```bash
nano /opt/contract-registry/backup.sh
```

Вставьте:

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/contract-registry"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Бэкап конфигурации Nginx
tar -czf $BACKUP_DIR/nginx_config_$DATE.tar.gz /etc/nginx/sites-available/contract-registry

# Бэкап файлов приложения
tar -czf $BACKUP_DIR/app_files_$DATE.tar.gz /opt/contract-registry

# Бэкап логов
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz /var/log/nginx/contract-registry.*

# Удалить бэкапы старше 30 дней
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

### 10.2. Сделать скрипт исполняемым
```bash
chmod +x /opt/backup.sh
```

### 10.3. Добавить в cron
```bash
crontab -e
```

Добавьте строку для ежедневного бэкапа в 2:00:
```
0 2 * * * /opt/backup.sh
```

## 11. Мониторинг и логи

### Просмотр логов Nginx
```bash
# Логи доступа
tail -f /var/log/nginx/contract-registry.access.log

# Логи ошибок
tail -f /var/log/nginx/contract-registry.error.log
```

### Статус сервисов
```bash
systemctl status nginx
systemctl status nodejs  # Если используете backend
```

## 12. Обновление приложения

Когда нужно обновить приложение:

```bash
cd /opt/contract-registry

# Если используете git
git pull origin main

# Переустановить зависимости (если изменились)
npm install

# Пересобрать
npm run build

# Скопировать новые файлы
cp -r dist/* /opt/contract-registry/

# Перезагрузить Nginx
systemctl reload nginx
```

## 13. Решение проблем

### Проблема: Сайт не открывается
```bash
# Проверить статус Nginx
systemctl status nginx

# Проверить логи
tail -50 /var/log/nginx/error.log

# Проверить firewall
ufw status
```

### Проблема: 502 Bad Gateway
```bash
# Проверить, что файлы на месте
ls -la /opt/contract-registry/

# Проверить права
chown -R www-data:www-data /opt/contract-registry
```

### Проблема: Белый экран
```bash
# Проверить, что index.html существует
cat /opt/contract-registry/index.html

# Очистить кэш браузера (Ctrl+Shift+R)
```

## 14. Доступ к приложению

После установки приложение доступно по адресу:
- **HTTP**: `http://<IP-контейнера>`
- **HTTPS**: `https://<ваш-домен>` (если настроили SSL)

## 15. Важные замечания

1. **Данные хранятся в localStorage** каждого браузера. Если пользователь очистит данные браузера, архив договоров будет потерян.

2. **Для многопользовательского доступа** рекомендуется настроить серверную часть с базой данных (PostgreSQL/MySQL).

3. **Регулярно делайте бэкапы** конфигурации и файлов приложения.

4. **Обновляйте систему** регулярно:
   ```bash
   apt update && apt upgrade -y
   ```

5. **Мониторьте ресурсы** контейнера в Proxmox и при необходимости увеличивайте CPU/RAM.

## 16. Быстрая установка (одной командой)

Создайте скрипт `install.sh`:

```bash
#!/bin/bash
set -e

echo "=== Установка Реестра договоров ==="

# Обновление
apt update && apt upgrade -y

# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Nginx
apt install -y nginx
systemctl enable nginx

# Создание директории
mkdir -p /opt/contract-registry
cd /opt/contract-registry

# Клонирование (замените на ваш репозиторий)
# git clone <URL> .

# Установка и сборка
# npm install
# npm run build

# Настройка Nginx
cat > /etc/nginx/sites-available/contract-registry << 'EOF'
server {
    listen 80;
    server_name _;
    root /opt/contract-registry;
    index index.html;
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/contract-registry /etc/nginx/sites-enabled/

# Права
chown -R www-data:www-data /opt/contract-registry
chmod -R 755 /opt/contract-registry

# Перезагрузка
nginx -t
systemctl reload nginx

echo "=== Установка завершена ==="
echo "Приложение доступно по адресу: http://$(hostname -I | awk '{print $1}')"
```

Запуск:
```bash
chmod +x install.sh
./install.sh
```

---

**Готово!** Приложение установлено и готово к использованию.
