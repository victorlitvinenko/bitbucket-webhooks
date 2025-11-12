# Руководство по конфигурации config.js

Подробное описание всех параметров конфигурации для мультиканального моста Bitbucket → Discord.

## 📋 Оглавление

1. [Структура файла](#структура-файла)
2. [Базовая конфигурация](#базовая-конфигурация)
3. [Настройка webhooks](#настройка-webhooks)
4. [Правила маршрутизации](#правила-маршрутизации)
5. [Переменные окружения](#переменные-окружения)
6. [Примеры конфигураций](#примеры-конфигураций)
7. [Расширенная настройка](#расширенная-настройка)

---

## Структура файла

```javascript
module.exports = {
    port: 3000,                    // Порт сервера
    webhooks: { ... },             // Discord webhook URLs
    routing: {                     // Правила маршрутизации
        byRepository: { ... },     // По имени репозитория
        byEvent: { ... },          // По типу события
        byBranch: { ... }          // По имени ветки
    }
};
```

---

## Базовая конфигурация

### Порт сервера

```javascript
port: process.env.PORT || 3000
```

**Описание:** Порт, на котором будет работать сервер

**Значения:**
- По умолчанию: `3000`
- Через переменную окружения: `PORT=8080 node server.js`
- Фиксированное значение: `port: 5000`

**Примеры:**
```javascript
// Локальная разработка
port: 3000

// Production с переменной окружения
port: process.env.PORT || 8080

// Heroku (автоматически использует свой PORT)
port: process.env.PORT
```

---

## Настройка webhooks

### Структура webhooks

```javascript
webhooks: {
    ИМЯ_КАНАЛА: 'DISCORD_WEBHOOK_URL'
}
```

### Стандартные каналы

```javascript
webhooks: {
    // Основной канал - получает все события
    main: 'https://discord.com/api/webhooks/123456789/AbCdEfGhIjKlMnOpQrStUvWxYz',

    // Специализированные каналы
    commits: 'https://discord.com/api/webhooks/...',      // Только коммиты
    pullrequests: 'https://discord.com/api/webhooks/...', // Только PR
    important: 'https://discord.com/api/webhooks/...',    // Важные события

    // Каналы по командам/проектам
    frontend: 'https://discord.com/api/webhooks/...',     // Фронтенд команда
    backend: 'https://discord.com/api/webhooks/...',      // Бэкенд команда
    mobile: 'https://discord.com/api/webhooks/...',       // Мобильная команда

    // Дополнительные каналы
    team: 'https://discord.com/api/webhooks/...',         // Командный канал
    devops: 'https://discord.com/api/webhooks/...',       // DevOps
    qa: 'https://discord.com/api/webhooks/...'            // Тестирование
}
```

### Получение Discord Webhook URL

1. Откройте Discord → выберите сервер и канал
2. Нажмите на шестерёнку ⚙️ (Изменить канал)
3. **Интеграции** → **Вебхуки**
4. **Создать вебхук** или выберите существующий
5. Скопируйте **URL вебхука**

**Формат URL:**
```
https://discord.com/api/webhooks/WEBHOOK_ID/WEBHOOK_TOKEN
```

**Пример:**
```
https://discord.com/api/webhooks/1234567890123456789/AbCdEfGh_IjKlMnOpQrStUvWxYz-1234567890
```

### Добавление своих каналов

Вы можете добавить любые каналы с произвольными именами:

```javascript
webhooks: {
    main: 'https://discord.com/api/webhooks/...',

    // Свои кастомные каналы
    'project-alpha': 'https://discord.com/api/webhooks/...',
    'project-beta': 'https://discord.com/api/webhooks/...',
    'hotfixes': 'https://discord.com/api/webhooks/...',
    'releases': 'https://discord.com/api/webhooks/...',
    'monitoring': 'https://discord.com/api/webhooks/...',
    'errors': 'https://discord.com/api/webhooks/...'
}
```

**⚠️ Важно:**
- Используйте только строчные буквы и дефисы в именах
- Не используйте пробелы и специальные символы
- Имена должны быть уникальными

---

## Правила маршрутизации

Определяют, в какие каналы отправлять события в режиме `/webhook-smart`.

### 1. Маршрутизация по репозиторию (byRepository)

```javascript
routing: {
    byRepository: {
        'КЛЮЧЕВОЕ_СЛОВО': ['канал1', 'канал2', 'канал3']
    }
}
```

**Как работает:**
- Проверяется **имя репозитория** (full_name в Bitbucket)
- Если имя содержит ключевое слово → событие отправляется в указанные каналы
- Поиск регистронезависимый (frontend = Frontend = FRONTEND)

**Примеры:**

```javascript
byRepository: {
    // Если в названии есть "frontend" → каналы main, frontend, commits
    'frontend': ['main', 'frontend', 'commits'],

    // Если есть "backend" или "api" → каналы main, backend, commits
    'backend': ['main', 'backend', 'commits'],
    'api': ['main', 'backend', 'commits'],

    // Если есть "mobile" → каналы main, mobile, commits
    'mobile': ['main', 'mobile', 'commits'],

    // Конкретное название проекта
    'my-super-app': ['main', 'project-alpha'],

    // Микросервисы
    'auth-service': ['main', 'backend', 'auth'],
    'payment-service': ['main', 'backend', 'payments', 'important']
}
```

**Реальные примеры репозиториев:**

| Репозиторий в Bitbucket | Сработает правило | Целевые каналы |
|-------------------------|-------------------|----------------|
| `company/web-frontend` | `frontend` | main, frontend, commits |
| `company/api-gateway` | `api` | main, backend, commits |
| `company/mobile-ios-app` | `mobile` | main, mobile, commits |
| `company/auth-service` | `auth-service` | main, backend, auth |

### 2. Маршрутизация по типу события (byEvent)

```javascript
routing: {
    byEvent: {
        'ТИП_СОБЫТИЯ': ['канал1', 'канал2']
    }
}
```

**Доступные типы событий:**

| Тип события | Когда срабатывает | Рекомендуемые каналы |
|-------------|-------------------|----------------------|
| `commit` | Любой коммит | commits, main |
| `pr_created` | Pull Request создан | pullrequests, main |
| `pr_merged` | Pull Request слит | pullrequests, important, main |
| `pr_declined` | Pull Request отклонён | pullrequests, main |

**Примеры:**

```javascript
byEvent: {
    // Все коммиты → в main и commits
    'commit': ['main', 'commits'],

    // Новые PR → в main и pullrequests
    'pr_created': ['main', 'pullrequests'],

    // Слитые PR → в main, pullrequests и important (важно!)
    'pr_merged': ['main', 'pullrequests', 'important'],

    // Отклонённые PR → только в pullrequests
    'pr_declined': ['pullrequests']
}
```

**Кейсы использования:**

```javascript
// Только важные события
byEvent: {
    'pr_merged': ['important', 'team']
}

// Все PR события в один канал
byEvent: {
    'pr_created': ['pr-tracking'],
    'pr_merged': ['pr-tracking', 'releases'],
    'pr_declined': ['pr-tracking']
}

// Раздельные каналы для разных событий
byEvent: {
    'commit': ['dev-commits'],
    'pr_created': ['dev-review-needed'],
    'pr_merged': ['dev-merged'],
    'pr_declined': ['dev-declined']
}
```

### 3. Маршрутизация по ветке (byBranch)

```javascript
routing: {
    byBranch: {
        'НАЗВАНИЕ_ВЕТКИ': ['канал1', 'канал2']
    }
}
```

**Как работает:**
- Проверяется **название ветки** при коммите
- Сравнение точное и регистрозависимое
- Работает только для коммитов (не для PR)

**Примеры:**

```javascript
byBranch: {
    // Главные ветки → важные каналы
    'master': ['main', 'important', 'releases'],
    'main': ['main', 'important', 'releases'],

    // Ветка разработки → обычные каналы
    'develop': ['main', 'commits'],
    'development': ['main', 'commits'],

    // Staging/Production
    'staging': ['main', 'staging', 'qa'],
    'production': ['main', 'important', 'releases', 'team'],

    // Feature ветки
    'feature': ['main', 'commits'],

    // Hotfix ветки → критично!
    'hotfix': ['main', 'important', 'hotfixes', 'team']
}
```

**⚠️ Важно:**
- `master` ≠ `Master` ≠ `MASTER` (регистр важен!)
- Проверяется точное совпадение, не подстрока
- Ветка `hotfix-123` НЕ попадёт под правило `hotfix`

**Решение для паттернов веток:**

Если нужно отлавливать `hotfix-*`, `feature/*` и т.д., измените код:

```javascript
// В server.js, функция determineTargetChannels()
const branch = data.push.changes?.[0]?.new?.name?.toLowerCase() || '';

// Проверка по паттернам
if (branch.startsWith('hotfix-') || branch.startsWith('hotfix/')) {
    channels.add('hotfixes');
    channels.add('important');
}

if (branch.startsWith('feature/')) {
    channels.add('features');
}

if (branch.startsWith('release/')) {
    channels.add('releases');
    channels.add('important');
}
```

### Комбинированная маршрутизация

Все правила работают **совместно** и результаты объединяются:

```javascript
routing: {
    byRepository: {
        'frontend': ['frontend', 'commits']
    },
    byEvent: {
        'pr_merged': ['important']
    },
    byBranch: {
        'master': ['releases']
    }
}
```

**Пример работы:**

**Событие:** Коммит в ветку `master` репозитория `company/web-frontend`

**Срабатывают правила:**
1. `byRepository: 'frontend'` → добавляет `frontend`, `commits`
2. `byEvent: 'commit'` → добавляет (если настроено)
3. `byBranch: 'master'` → добавляет `releases`
4. Всегда добавляется → `main`

**Итоговые каналы:** `main`, `frontend`, `commits`, `releases`

---

## Переменные окружения

### Зачем нужны?

✅ **Безопасность:** Не храните webhook URLs в Git
✅ **Гибкость:** Разные настройки для dev/staging/production
✅ **Удобство:** Легко менять без редактирования кода

### Настройка через .env

**1. Создайте файл `.env` в корне проекта:**

```bash
# Порт сервера
PORT=3000

# Discord Webhooks
DISCORD_MAIN=https://discord.com/api/webhooks/111/aaa
DISCORD_COMMITS=https://discord.com/api/webhooks/222/bbb
DISCORD_PR=https://discord.com/api/webhooks/333/ccc
DISCORD_FRONTEND=https://discord.com/api/webhooks/444/ddd
DISCORD_BACKEND=https://discord.com/api/webhooks/555/eee
DISCORD_MOBILE=https://discord.com/api/webhooks/666/fff
DISCORD_IMPORTANT=https://discord.com/api/webhooks/777/ggg
DISCORD_TEAM=https://discord.com/api/webhooks/888/hhh
```

**2. Установите dotenv:**

```bash
npm install dotenv
```

**3. Добавьте в начало server.js:**

```javascript
require('dotenv').config();
```

**4. Обновите config.js:**

```javascript
module.exports = {
    port: process.env.PORT || 3000,

    webhooks: {
        main: process.env.DISCORD_MAIN || '',
        commits: process.env.DISCORD_COMMITS || '',
        pullrequests: process.env.DISCORD_PR || '',
        frontend: process.env.DISCORD_FRONTEND || '',
        backend: process.env.DISCORD_BACKEND || '',
        mobile: process.env.DISCORD_MOBILE || '',
        important: process.env.DISCORD_IMPORTANT || '',
        team: process.env.DISCORD_TEAM || ''
    },

    routing: { ... }
};
```

**5. Добавьте .env в .gitignore:**

```bash
echo ".env" >> .gitignore
```

### Переменные окружения на хостинге

**Heroku:**
```bash
heroku config:set DISCORD_MAIN=https://discord.com/api/webhooks/...
heroku config:set DISCORD_COMMITS=https://discord.com/api/webhooks/...
```

**VPS/VDS (через systemd):**
```ini
[Service]
Environment="DISCORD_MAIN=https://discord.com/api/webhooks/..."
Environment="DISCORD_COMMITS=https://discord.com/api/webhooks/..."
```

**Docker:**
```yaml
environment:
  - DISCORD_MAIN=https://discord.com/api/webhooks/...
  - DISCORD_COMMITS=https://discord.com/api/webhooks/...
```

---

## Примеры конфигураций

### Минимальная конфигурация

**Подходит для:** Один небольшой проект

```javascript
module.exports = {
    port: 3000,

    webhooks: {
        main: 'https://discord.com/api/webhooks/...'
    },

    routing: {
        byRepository: {},
        byEvent: {},
        byBranch: {}
    }
};
```

**Использование в Bitbucket:**
```
URL: /webhook/main
```

---

### Базовая конфигурация

**Подходит для:** Малая команда, 2-3 репозитория

```javascript
module.exports = {
    port: 3000,

    webhooks: {
        main: 'https://discord.com/api/webhooks/111/aaa',
        commits: 'https://discord.com/api/webhooks/222/bbb',
        important: 'https://discord.com/api/webhooks/333/ccc'
    },

    routing: {
        byRepository: {},

        byEvent: {
            'commit': ['main', 'commits'],
            'pr_merged': ['main', 'important']
        },

        byBranch: {
            'master': ['main', 'important'],
            'main': ['main', 'important']
        }
    }
};
```

**Использование в Bitbucket:**
```
URL: /webhook-smart
```

---

### Продвинутая конфигурация

**Подходит для:** Средняя команда, несколько проектов

```javascript
module.exports = {
    port: process.env.PORT || 3000,

    webhooks: {
        main: process.env.DISCORD_MAIN,
        commits: process.env.DISCORD_COMMITS,
        pullrequests: process.env.DISCORD_PR,
        frontend: process.env.DISCORD_FRONTEND,
        backend: process.env.DISCORD_BACKEND,
        important: process.env.DISCORD_IMPORTANT
    },

    routing: {
        byRepository: {
            'frontend': ['main', 'frontend', 'commits'],
            'web': ['main', 'frontend', 'commits'],
            'backend': ['main', 'backend', 'commits'],
            'api': ['main', 'backend', 'commits']
        },

        byEvent: {
            'commit': ['main', 'commits'],
            'pr_created': ['main', 'pullrequests'],
            'pr_merged': ['main', 'pullrequests', 'important'],
            'pr_declined': ['main', 'pullrequests']
        },

        byBranch: {
            'master': ['main', 'important'],
            'main': ['main', 'important'],
            'develop': ['main'],
            'staging': ['main']
        }
    }
};
```

**Использование в Bitbucket:**
```
URL: /webhook-smart
```

---

### Корпоративная конфигурация

**Подходит для:** Большая команда, микросервисы

```javascript
module.exports = {
    port: process.env.PORT || 3000,

    webhooks: {
        // Общие каналы
        main: process.env.DISCORD_MAIN,
        commits: process.env.DISCORD_COMMITS,
        pullrequests: process.env.DISCORD_PR,
        important: process.env.DISCORD_IMPORTANT,

        // Команды
        frontend: process.env.DISCORD_FRONTEND,
        backend: process.env.DISCORD_BACKEND,
        mobile: process.env.DISCORD_MOBILE,
        devops: process.env.DISCORD_DEVOPS,
        qa: process.env.DISCORD_QA,

        // Сервисы
        'auth-service': process.env.DISCORD_AUTH,
        'payment-service': process.env.DISCORD_PAYMENTS,
        'notification-service': process.env.DISCORD_NOTIFICATIONS,

        // Специальные
        releases: process.env.DISCORD_RELEASES,
        hotfixes: process.env.DISCORD_HOTFIXES,
        monitoring: process.env.DISCORD_MONITORING
    },

    routing: {
        byRepository: {
            // Frontend проекты
            'frontend': ['main', 'frontend', 'commits'],
            'web': ['main', 'frontend', 'commits'],
            'admin-panel': ['main', 'frontend', 'commits'],

            // Backend проекты
            'backend': ['main', 'backend', 'commits'],
            'api': ['main', 'backend', 'commits'],

            // Mobile проекты
            'mobile-ios': ['main', 'mobile', 'commits'],
            'mobile-android': ['main', 'mobile', 'commits'],

            // Микросервисы
            'auth-service': ['main', 'backend', 'auth-service', 'commits'],
            'payment-service': ['main', 'backend', 'payment-service', 'commits', 'important'],
            'notification-service': ['main', 'backend', 'notification-service', 'commits'],

            // Infrastructure
            'infrastructure': ['main', 'devops', 'important'],
            'docker': ['main', 'devops'],
            'kubernetes': ['main', 'devops', 'important']
        },

        byEvent: {
            'commit': ['main', 'commits'],
            'pr_created': ['main', 'pullrequests'],
            'pr_merged': ['main', 'pullrequests', 'important', 'releases'],
            'pr_declined': ['main', 'pullrequests']
        },

        byBranch: {
            // Production ветки
            'master': ['main', 'important', 'releases', 'monitoring'],
            'main': ['main', 'important', 'releases', 'monitoring'],
            'production': ['main', 'important', 'releases', 'monitoring'],

            // Development
            'develop': ['main', 'commits'],
            'development': ['main', 'commits'],

            // Staging
            'staging': ['main', 'qa'],
            'qa': ['main', 'qa'],

            // Hotfixes - критично!
            'hotfix': ['main', 'important', 'hotfixes', 'monitoring']
        }
    }
};
```

**Использование в Bitbucket:**
```
URL: /webhook-smart
```

---

## Расширенная настройка

### Добавление кастомной логики маршрутизации

Если стандартных правил недостаточно, можно модифицировать функцию `determineTargetChannels()` в `server.js`:

```javascript
function determineTargetChannels(data) {
    const channels = new Set(['main']);
    const repository = (data.repository?.full_name || '').toLowerCase();

    // Стандартная логика...

    // === ДОБАВЬТЕ СВОЮ ЛОГИКУ ЗДЕСЬ ===

    // Пример 1: Маршрутизация по автору коммита
    if (data.push) {
        const author = data.push.changes?.[0]?.commits?.[0]?.author?.raw || '';

        if (author.includes('Senior')) {
            channels.add('senior-commits');
        }

        if (author.includes('John Doe')) {
            channels.add('john-personal');
        }
    }

    // Пример 2: Маршрутизация по количеству изменённых файлов
    if (data.push) {
        const filesChanged = data.push.changes?.[0]?.commits?.[0]?.files?.length || 0;

        if (filesChanged > 10) {
            channels.add('large-commits');
            channels.add('important');
        }
    }

    // Пример 3: Маршрутизация по меткам в коммите
    if (data.push) {
        const message = data.push.changes?.[0]?.commits?.[0]?.message || '';

        if (message.includes('[CRITICAL]')) {
            channels.add('critical');
            channels.add('important');
        }

        if (message.includes('[WIP]')) {
            // Не отправляем WIP коммиты в important
            channels.delete('important');
        }

        if (message.includes('[DOCS]')) {
            channels.add('documentation');
        }
    }

    // Пример 4: Маршрутизация по времени суток
    const hour = new Date().getHours();

    if (hour >= 22 || hour <= 6) {
        // Ночные коммиты → отдельный канал
        channels.add('night-commits');
    }

    // Пример 5: Маршрутизация по размеру PR
    if (data.pullrequest) {
        const additions = data.pullrequest.diff_stats?.additions || 0;
        const deletions = data.pullrequest.diff_stats?.deletions || 0;
        const total = additions + deletions;

        if (total > 500) {
            channels.add('large-prs');
            channels.add('important');
        }
    }

    // Пример 6: Паттерны в названии веток
    if (data.push) {
        const branch = data.push.changes?.[0]?.new?.name || '';

        if (branch.startsWith('hotfix-') || branch.startsWith('hotfix/')) {
            channels.add('hotfixes');
            channels.add('important');
        }

        if (branch.startsWith('feature/')) {
            channels.add('features');
        }

        if (branch.startsWith('release/')) {
            channels.add('releases');
            channels.add('important');
        }

        if (branch.includes('experimental')) {
            channels.add('experiments');
        }
    }

    return Array.from(channels).filter(ch => WEBHOOKS[ch]);
}
```

### Условная отправка (фильтрация)

Иногда нужно НЕ отправлять определённые события:

```javascript
function determineTargetChannels(data) {
    const channels = new Set(['main']);

    // Игнорируем merge commits
    if (data.push) {
        const message = data.push.changes?.[0]?.commits?.[0]?.message || '';

        if (message.startsWith('Merge ')) {
            return []; // Не отправляем никуда
        }
    }

    // Игнорируем WIP PR
    if (data.pullrequest) {
        const title = data.pullrequest.title || '';

        if (title.includes('[WIP]') || title.includes('WIP:')) {
            return []; // Не отправляем
        }
    }

    // Остальная логика...

    return Array.from(channels).filter(ch => WEBHOOKS[ch]);
}
```

### Приоритизация каналов

Отправка в важные каналы в первую очередь:

```javascript
async function sendToChannels(channels, message) {
    // Определяем приоритеты
    const priority = {
        'critical': 1,
        'important': 2,
        'main': 3,
        'commits': 4
    };

    // Сортируем каналы по приоритету
    const sorted = channels.sort((a, b) => {
        return (priority[a] || 99) - (priority[b] || 99);
    });

    // Отправляем по порядку
    for (const channel of sorted) {
        await sendToDiscord(WEBHOOKS[channel], message);
    }
}
```

---

## Проверка конфигурации

### Валидация при запуске

Добавьте в конец `server.js`:

```javascript
// Проверка конфигурации при запуске
function validateConfig() {
    console.log('\n🔍 Проверка конфигурации...\n');

    let errors = 0;
    let warnings = 0;

    // Проверка webhooks
    for (const [name, url] of Object.entries(WEBHOOKS)) {
        if (!url) {
            console.log(`❌ Канал "${name}": URL не задан`);
            errors++;
        } else if (url.includes('YOUR_')) {
            console.log(`⚠️  Канал "${name}": URL не настроен (placeholder)`);
            warnings++;
        } else if (!url.startsWith('https://discord.com/api/webhooks/')) {
            console.log(`❌ Канал "${name}": Неверный формат URL`);
            errors++;
        } else {
            console.log(`✅ Канал "${name}": OK`);
        }
    }

    // Проверка правил маршрутизации
    for (const [repo, channels] of Object.entries(config.routing.byRepository || {})) {
        for (const ch of channels) {
            if (!WEBHOOKS[ch]) {
                console.log(`⚠️  Правило byRepository["${repo}"]: канал "${ch}" не существует`);
                warnings++;
            }
        }
    }

    console.log(`\n📊 Результат: ${errors} ошибок, ${warnings} предупреждений\n`);

    if (errors > 0) {
        console.log('❌ Конфигурация содержит ошибки. Исправьте и перезапустите.\n');
        process.exit(1);
    }
}

// Вызов при запуске
validateConfig();
```

### Тестирование конфигурации

```bash
# Просмотр настроенных каналов
curl http://localhost:3000/channels

# Тест конкретного канала
curl http://localhost:3000/test/main

# Тест всех каналов
curl http://localhost:3000/test-all
```

---

## Полезные советы

### 1. Организация каналов в Discord

Рекомендуемая структура:

```
📁 DEVELOPMENT
   #dev-main
   #dev-commits
   #dev-pull-requests

📁 TEAMS
   #team-frontend
   #team-backend
   #team-mobile

📁 IMPORTANT
   #important-releases
   #important-hotfixes
   #important-errors

📁 MONITORING
   #monitoring-logs
   #monitoring-alerts
```

### 2. Именование каналов

- Используйте префиксы: `dev-`, `team-`, `project-`
- Будьте последовательны
- Избегайте слишком длинных имён

### 3. Безопасность

- ❌ НЕ коммитьте webhook URLs в Git
- ✅ Используйте переменные окружения
- ✅ Добавьте `.env` в `.gitignore`
- ✅ Ограничьте доступ к серверу
- ✅ Используйте HTTPS

### 4. Производительность

- Ограничьте количество каналов на одно событие (максимум 5-7)
- Используйте умную маршрутизацию вместо `/webhook-all`
- Не дублируйте события без необходимости

### 5. Отладка

Включите подробное логирование:

```javascript
console.log('Репозиторий:', repository);
console.log('Ветка:', branch);
console.log('Целевые каналы:', targetChannels);
console.log('Правила сработали:', matchedRules);
```

---

## Частые вопросы

**Q: Как добавить новый канал?**
A: Добавьте webhook в `config.js` и обновите правила `routing`.

**Q: Можно ли использовать один webhook для нескольких каналов?**
A: Нет, каждый Discord канал имеет уникальный webhook URL.

**Q: Как отключить канал временно?**
A: Закомментируйте его в `config.js` или удалите из правил маршрутизации.

**Q: Сколько каналов можно настроить?**
A: Технически - неограниченно. Практически - до 20-30 для удобства.

**Q: Можно ли отправлять в каналы на разных Discord серверах?**
A: Да, просто используйте webhooks с разных серверов.

---

## Заключение

Файл `config.js` - это центр управления вашим мостом Bitbucket → Discord. Потратьте время на правильную настройку, и вы получите гибкую систему уведомлений, которая растёт вместе с вашим проектом.

**Рекомендуемый workflow:**

1. Начните с минимальной конфигурации
2. Добавляйте каналы по мере необходимости
3. Настраивайте правила маршрутизации постепенно
4. Тестируйте каждое изменение
5. Документируйте свою конфигурацию

**Помните:** Лучше меньше, да лучше. Не создавайте слишком много каналов сразу - начните с базовых и расширяйте по мере роста команды.
