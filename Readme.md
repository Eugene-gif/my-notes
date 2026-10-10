# My notes

Личный органайзер для заметок, перечней задач и папок. Помогает держать записи и дела в одном месте: искать, группировать и менять их порядок. Данные сохраняются в браузере без регистрации.

Приложение написано на Vue 3 и TypeScript, использует Vue Router, Pinia и Vite. Поддерживает установку как PWA и запуск без сети после первоначального кеширования.

Требуется Node.js 24.15+ (ветка 24) либо другая версия из `engines` в `package.json`.

```sh
npm ci
cp .env.example .env
npm run dev
```

В PowerShell вместо `cp` можно использовать `Copy-Item .env.example .env`.

```sh
npm run build    # production-сборка в dist
npm run preview  # просмотр сборки
```

[Функциональность](docs/about.md) · [Компоненты](docs/components.md) · [Разработка и проверки](docs/development.md) · [Архитектура](docs/architecture.md) · [Использование](docs/usage.md) · [PWA](docs/pwa.md)
