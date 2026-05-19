# CLAUDE.md — контекст для Claude Code

Этот файл — память о проекте для Claude Code. Читай его при старте каждой сессии и обновляй, когда меняются ключевые решения.

## О проекте

**Название:** FlowBoard
**Тип:** Offline-first Kanban-доска с real-time коллаборацией
**Цель:** Портфолио-проект уровня middle frontend developer для резюме
**Аудитория кода:** автор (junior+/middle) + рекрутеры/тимлиды на собесах

Подробное описание фич — в `README.md`, полный план — в `ROADMAP.md`.

## Принципы разработки

1. **Качество > скорость.** Это резюме-проект, поэтому каждый коммит должен быть таким, чтобы его не стыдно показать на собесе.
2. **Типы строгие.** `strict: true`, `noUncheckedIndexedAccess: true`. Никаких `any`, `as unknown as X`, `@ts-ignore` без комментария почему.
3. **Тесты на сложную логику обязательны.** Sync queue, position calculation, conflict resolution — обязательно покрыть unit-тестами. UI можно покрывать E2E.
4. **Маленькие коммиты.** Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
5. **Документируем решения.** Когда выбираем между двумя подходами — записываем в `docs/adr/` короткий ADR.

## Технологический стек (зафиксирован)

| Слой | Выбор | Почему |
|------|-------|--------|
| Сборка | Vite 8 | Быстро, современно |
| Язык | TypeScript 6 strict | Типобезопасность |
| UI | React 19 | Свежий, последняя версия |
| Роутер | TanStack Router | Типобезопасный, лучше React Router для резюме |
| Серверный стейт | TanStack Query | Стандарт индустрии |
| UI стейт | Zustand | Минимализм, без бойлерплейта |
| Стили | Tailwind v4 + shadcn/ui | Скорость + качественные компоненты |
| Формы | react-hook-form + zod | Производительность + типобезопасная валидация |
| DnD | dnd-kit | Современнее react-dnd, a11y из коробки |
| Анимации | Framer Motion | Плавные DnD-анимации |
| Локальная БД | Dexie.js | Удобная обёртка над IndexedDB |
| Бэкенд | Supabase | Auth + Postgres + Realtime + Storage в одном |
| i18n | react-i18next | Стандарт + поддержка ICU |
| Тесты | Vitest + Testing Library + Playwright | Vitest для unit, Playwright для E2E |
| PWA | vite-plugin-pwa | Workbox внутри, минимум конфига |
| Хостинг | Vercel | Бесплатно, preview-деплои на PR |

## Конвенции кода

### Структура папок

Feature-sliced подход:

```
src/
  features/<feature>/
    api/         ← TanStack Query хуки, обращения к Supabase
    components/  ← компоненты только этой фичи
    hooks/       ← хуки только этой фичи
    types.ts     ← типы фичи
    index.ts     ← public API фичи (только то, что используется снаружи)
  shared/
    ui/          ← shadcn компоненты и общие UI-кирпичики
    lib/         ← утилиты (date, formatters, etc.)
    hooks/       ← переиспользуемые хуки
    i18n/        ← конфиг i18next + locales
  app/           ← роутер, провайдеры, App.tsx
  db/            ← Dexie schema
```

Правило: фичи не импортируют друг у друга напрямую. Если нужно — через `shared/`.

### Именование

- Компоненты: `PascalCase.tsx` (`CardModal.tsx`)
- Хуки: `camelCase.ts`, начинаются с `use` (`useBoardCards.ts`)
- Утилиты: `camelCase.ts` (`formatDate.ts`)
- Типы/интерфейсы: `PascalCase`, без префикса `I`
- Константы: `SCREAMING_SNAKE_CASE`

### Импорты

Алиасы через `@/`:

```ts
import { Button } from "@/shared/ui/button"
import { useBoards } from "@/features/boards"
```

### Компоненты

- Один компонент = один файл
- Пропсы — отдельный `type Props = { ... }` над компонентом
- Если в компоненте >150 строк — пора рефакторить или дробить
- Никаких inline-стилей через `style={{}}` — только Tailwind

### TanStack Query

- Ключи запросов хранятся в `features/<feature>/api/keys.ts`
- Хуки запросов — `useXxxQuery`, мутации — `useXxxMutation`
- Все мутации делают optimistic update + invalidate в onSuccess

## Интернационализация (i18n)

Языки: **en, ru**. Дефолт — английский, автодетект через `i18next-browser-languagedetector`.

### Правила

- **Никаких хардкоженных строк в UI.** Любой пользовательский текст — через `t('key')`.
- Ключи плоские, по фичам: `t('boards.create')`, `t('cards.dueDate')`, `t('common.save')`.
- Файлы переводов: `src/shared/i18n/locales/{en,ru}/{common,boards,cards,auth}.json`.
- Даты форматируются через `date-fns` с локалью (`enUS`, `ru`).
- Числа/валюты — через `Intl.NumberFormat` с активной локалью.
- Плюрализация через ICU: `{count, plural, one {# card} other {# cards}}`.

### Переключатель языка

В сайдбаре + в настройках. Выбор сохраняется в localStorage. Реагирует на изменения системной локали при первом визите.

## Текущая фаза

**Этап 1 — Foundation.** Этап 0 завершён. См. `ROADMAP.md` для детального плана.

## Чего НЕ делаем

- Не используем Redux/MobX — Zustand достаточно
- Не пишем свой компонент-кит — берём shadcn/ui
- Не делаем свой WebSocket-сервер — используем Supabase Realtime
- Не пишем свою auth — Supabase Auth
- Не используем CSS-in-JS — только Tailwind
- Не оставляем `console.log` в коде — только через wrapper `logger`

## Когда обновлять этот файл

- Меняется стек или ключевое решение
- Появляется новая конвенция, которую важно соблюдать
- Завершается этап из ROADMAP
- Возникает решение, которое заслуживает ADR — создаём в `docs/adr/`
