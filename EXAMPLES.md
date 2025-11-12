# Примеры настройки для разных сценариев

## Сценарий 1: Небольшая команда (2-3 проекта)

### Структура каналов Discord
- `#dev-общий` - все уведомления
- `#dev-коммиты` - только коммиты
- `#dev-важное` - PR merges, коммиты в master

### config.js
```javascript
webhooks: {
    main: 'https://discord.com/api/webhooks/111/aaa',
    commits: 'https://discord.com/api/webhooks/222/bbb',
    important: 'https://discord.com/api/webhooks/333/ccc'
}
```

### Bitbucket webhooks
Для всех репозиториев: **URL:** `/webhook-smart`

---

## Сценарий 2: Разные команды и проекты

### Структура каналов Discord
- `#team-frontend` - фронтенд команда
- `#team-backend` - бэкенд команда
- `#team-mobile` - мобильная команда
- `#all-commits` - все коммиты
- `#all-merges` - все слияния PR

### config.js
```javascript
webhooks: {
    frontend: 'https://discord.com/api/webhooks/111/aaa',
    backend: 'https://discord.com/api/webhooks/222/bbb',
    mobile: 'https://discord.com/api/webhooks/333/ccc',
    commits: 'https://discord.com/api/webhooks/444/ddd',
    merges: 'https://discord.com/api/webhooks/555/eee'
},

routing: {
    byRepository: {
        'frontend': ['frontend', 'commits'],
        'web': ['frontend', 'commits'],
        'backend': ['backend', 'commits'],
        'api': ['backend', 'commits'],
        'mobile-ios': ['mobile', 'commits'],
        'mobile-android': ['mobile', 'commits']
    },
    byEvent: {
        'pr_merged': ['merges']
    }
}
```

### Bitbucket webhooks
Для всех репозиториев: **URL:** `/webhook-smart`

---

## Сценарий 3: Один канал на репозиторий

### Структура каналов Discord
- `#project-website`
- `#project-api`
- `#project-admin`
- `#project-mobile`

### config.js
```javascript
webhooks: {
    website: 'https://discord.com/api/webhooks/111/aaa',
    api: 'https://discord.com/api/webhooks/222/bbb',
    admin: 'https://discord.com/api/webhooks/333/ccc',
    mobile: 'https://discord.com/api/webhooks/444/ddd'
}
```

### Bitbucket webhooks
- Репозиторий `company/website` → URL: `/webhook/website`
- Репозиторий `company/api-service` → URL: `/webhook/api`
- Репозиторий `company/admin-panel` → URL: `/webhook/admin`
- Репозиторий `company/mobile-app` → URL: `/webhook/mobile`

---

## Сценарий 4: Разделение по типу события

### Структура каналов Discord
- `#git-commits` - все коммиты
- `#git-pr-open` - новые PR
- `#git-pr-review` - PR готовые к ревью
- `#git-pr-merged` - слитые PR

### Настройка
Используйте **4 отдельных вебхука** в Bitbucket для каждого репозитория:

**Webhook #1: Коммиты**
- URL: `/webhook/commits`
- Triggers: ✅ Repository push

**Webhook #2: Новые PR**
- URL: `/webhook/pr-new`
- Triggers: ✅ Pull request created

**Webhook #3: Обновления PR**
- URL: `/webhook/pr-review`
- Triggers: ✅ Pull request updated

**Webhook #4: Слияния**
- URL: `/webhook/pr-merged`
- Triggers: ✅ Pull request merged

---

## Сценарий 5: Корпоративная настройка с приоритетами

### Структура каналов Discord
- `#dev-all` - все события
- `#dev-critical` - критичные события (master/main)
- `#dev-frontend` - фронтенд
- `#dev-backend` - бэкенд
- `#dev-hotfix` - хотфиксы
- `#management` - для менеджеров (только PR merges)

### config.js
```javascript
webhooks: {
    all: 'https://discord.com/api/webhooks/111/aaa',
    critical: 'https://discord.com/api/webhooks/222/bbb',
    frontend: 'https://discord.com/api/webhooks/333/ccc',
    backend: 'https://discord.com/api/webhooks/444/ddd',
    hotfix: 'https://discord.com/api/webhooks/555/eee',
    management: 'https://discord.com/api/webhooks/666/fff'
},

routing: {
    byRepository: {
        'frontend': ['all', 'frontend'],
        'web': ['all', 'frontend'],
        'backend': ['all', 'backend'],
        'api': ['all', 'backend']
    },
    byBranch: {
        'master': ['all', 'critical', 'management'],
        'main': ['all', 'critical', 'management'],
        'hotfix': ['all', 'critical', 'hotfix']
    },
    byEvent: {
        'pr_merged': ['management']
    }
}
```

### Bitbucket webhooks
Для всех репозиториев: **URL:** `/webhook-smart`

---

## Сценарий 6: Микросервисная архитектура

### Структура каналов Discord
- `#service-auth`
- `#service-users`
- `#service-payments`
- `#service-notifications`
- `#service-analytics`
- `#all-services`

### config.js
```javascript
webhooks: {
    auth: 'https://discord.com/api/webhooks/111/aaa',
    users: 'https://discord.com/api/webhooks/222/bbb',
    payments: 'https://discord.com/api/webhooks/333/ccc',
    notifications: 'https://discord.com/api/webhooks/444/ddd',
    analytics: 'https://discord.com/api/webhooks/555/eee',
    all: 'https://discord.com/api/webhooks/666/fff'
},

routing: {
    byRepository: {
        'auth-service': ['all', 'auth'],
        'user-service': ['all', 'users'],
        'payment-service': ['all', 'payments'],
        'notification-service': ['all', 'notifications'],
        'analytics-service': ['all', 'analytics']
    }
}
```

### Bitbucket webhooks
Для всех репозиториев: **URL:** `/webhook-smart`

---

## Сценарий 7: Только важные события

### Структура каналов Discord
- `#git-important` - только важные события

### Что считается важным
- Коммиты в master/main
- Любые PR merges
- Коммиты с меткой [CRITICAL] или [HOTFIX]

### Модификация server.js

Добавьте фильтрацию в функцию `determineTargetChannels()`:

```javascript
function determineTargetChannels(data) {
    const channels = new Set();

    if (data.push) {
        const branch = data.push.changes?.[0]?.new?.name?.toLowerCase() || '';
        const message = data.push.changes?.[0]?.commits?.[0]?.message || '';

        // Важные ветки
        if (branch === 'master' || branch === 'main') {
            channels.add('important');
        }

        // Важные метки в коммите
        if (message.includes('[CRITICAL]') || message.includes('[HOTFIX]')) {
            channels.add('important');
        }
    }

    // PR merges всегда важны
    if (data.pullrequest && data.pullrequest.state === 'MERGED') {
        channels.add('important');
    }

    return Array.from(channels).filter(ch => WEBHOOKS[ch]);
}
```

### Bitbucket webhooks
Для всех репозиториев: **URL:** `/webhook-smart`

---

## Сценарий 8: Персональные уведомления

### Идея
Каждый разработчик получает уведомления о своих коммитах в личный канал

### Структура каналов Discord
- `#dev-ivan` - личный канал Ивана
- `#dev-maria` - личный канал Марии
- `#dev-all` - общий канал

### Модификация server.js

```javascript
const AUTHOR_WEBHOOKS = {
    'Ivan Petrov': 'https://discord.com/api/webhooks/111/aaa',
    'Maria Sidorova': 'https://discord.com/api/webhooks/222/bbb'
};

// В обработчике коммитов:
const author = commit.author.raw;
if (AUTHOR_WEBHOOKS[author]) {
    await sendToDiscord(AUTHOR_WEBHOOKS[author], message);
}
await sendToDiscord(WEBHOOKS.all, message);
```

---

## Полезные советы

### 1. Тестирование конфигурации
После настройки всегда тестируйте:
```bash
curl http://your-server.com/test-all
```

### 2. Логирование
Включите подробное логирование для отладки:
```javascript
console.log('Целевые каналы:', targetChannels);
console.log('Репозиторий:', repository);
console.log('Ветка:', branch);
```

### 3. Мониторинг
Создайте отдельный канал `#monitoring` для ошибок сервера

### 4. Резервирование
Всегда отправляйте в `main` канал как fallback

### 5. Документация
Ведите документ с описанием логики маршрутизации для команды
