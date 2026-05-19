# ROADMAP — FlowBoard

Поэтапный план разработки. Идём сверху вниз. После каждого этапа продукт работает и его можно показать.

---

## Этап 0 — Setup (1 день)

**Цель:** проект инициализирован, конфиги настроены, CI зелёный.

- [x] `pnpm create vite` → React + TypeScript + SWC
- [x] Установить и сконфигурировать Tailwind + shadcn/ui
- [x] ESLint (с typescript-eslint, react, react-hooks, jsx-a11y) + Prettier
- [x] Husky + lint-staged: на каждый коммит — lint + format + typecheck
- [x] Commitlint с Conventional Commits
- [x] Алиас `@/` в `tsconfig.json` и `vite.config.ts`
- [x] `.env.example` с шаблоном переменных
- [x] Базовая папочная структура (`features/`, `shared/`, `app/`, `db/`)
- [x] Установить TanStack Router + Query, Zustand, react-hook-form, zod
- [x] GitHub Actions: lint → typecheck → test → build
- [ ] Деплой на Vercel + preview deployments на PR

**Definition of Done:** пустой роут "/" рендерит `Hello FlowBoard`, CI зелёный, превью на Vercel открывается.

---

## Этап 1 — Foundation (3–4 дня)

**Цель:** пользователь регистрируется, логинится, видит свой список (пока пустой) досок.

- [ ] Проект в Supabase + схема БД (`users`, `boards`, `columns`, `cards`, `board_members`)
- [ ] RLS-политики на каждую таблицу
- [ ] `supabase/migrations/` с миграциями в репо
- [ ] Auth: email/password + OAuth (Google)
- [ ] Страницы: `/login`, `/register`, `/forgot-password`
- [ ] Защищённый роут `/` со списком досок
- [ ] Сайдбар: аватар, переключатель темы, переключатель языка, кнопка "+ New board"
- [ ] CRUD досок: создание, переименование, удаление, архивирование
- [ ] Skeleton states при загрузке
- [ ] Error boundary на верхнем уровне
- [ ] Базовый i18n настроен (en + ru), переключатель работает

**Definition of Done:** залогинился → создал две доски → переименовал одну → удалил вторую → перезагрузил страницу → всё на месте. Переключил язык — весь UI на другом языке.

---

## Этап 2 — Core Kanban + DnD (5–7 дней)

**Цель:** полноценная Kanban-доска уровня раннего Trello (онлайн-режим, без офлайна).

- [ ] Страница доски `/board/:id`
- [ ] CRUD колонок: создание, переименование, удаление, перетаскивание
- [ ] Inline-форма создания карточки прямо в колонке
- [ ] DnD карточек между колонок + внутри колонки (dnd-kit)
- [ ] Position через `lexorank`-подобный алгоритм или фракционные индексы
- [ ] Модалка карточки:
  - [ ] Title (inline-edit)
  - [ ] Description (markdown через react-markdown + remark-gfm)
  - [ ] Labels (multiselect с цветами)
  - [ ] Due date (date-picker с локалью)
  - [ ] Checklist (вложенные todo с прогрессом)
- [ ] Оптимистичные апдейты через TanStack Query на все мутации
- [ ] Анимации перетаскивания через Framer Motion + dnd-kit transitions

**Definition of Done:** на доске можно создать 3 колонки, накидать 10 карточек, всё двигать мышью и клавиатурой, открыть карточку, отредактировать её. Все строки UI локализованы.

---

## Этап 3 — Offline-first (4–5 дней)

**Цель:** приложение работает без интернета и синхронизируется при возврате онлайн. Это главный wow-фактор.

- [ ] Dexie schema, зеркальная Supabase
- [ ] Стратегия чтения: Dexie сначала → потом фоновое обновление из Supabase
- [ ] Стратегия записи: Dexie + sync_queue → потом Supabase
- [ ] Обработка локальных UUID (`crypto.randomUUID()`) — `id` не меняется при синхронизации
- [ ] Sync queue: очередь операций с retry, exponential backoff
- [ ] Online/offline detection через `navigator.onLine` + ping endpoint
- [ ] Conflict resolution: last-write-wins по `updated_at`
- [ ] UI-индикатор состояния синхронизации: online / offline / syncing N pending
- [ ] Тосты с уведомлениями о ключевых событиях синхронизации
- [ ] Unit-тесты на sync queue и conflict resolution

**Definition of Done:** видео-демо `network: offline → создаю 5 карточек, двигаю их → network: online → всё долетело до Supabase, на втором клиенте всё подтянулось`. ADR с описанием стратегии.

---

## Этап 4 — Realtime collaboration (3–4 дня)

**Цель:** несколько человек работают на одной доске одновременно.

- [ ] Шеринг доски по email: приглашение → роль (viewer/editor/admin)
- [ ] Страница принятия приглашения
- [ ] Supabase Realtime channels на доску
- [ ] Presence: аватары людей онлайн в правом верхнем углу
- [ ] Live updates: чужие изменения прилетают и анимированно появляются
- [ ] Комментарии к карточке + лента активности на доске
- [ ] @упоминания в комментариях с автокомплитом

**Definition of Done:** открываю доску в двух браузерах под разными аккаунтами → вижу аватар второго юзера → двигаю карточку → в другом окне она едет.

---

## Этап 5 — Polish + PWA (3–4 дня)

**Цель:** продукт ощущается зрелым.

- [ ] Полнотекстовый поиск по карточкам (MiniSearch, клиентский индекс из Dexie)
- [ ] Фильтры на доске: по label, по assignee, по дате
- [ ] Состояние фильтров и поиска в URL
- [ ] Тёмная тема через next-themes
- [ ] Клавиатурные шорткаты (`?` показывает шпаргалку, `n` — новая карточка, `/` — поиск)
- [ ] PWA: манифест, иконки, splash, install prompt
- [ ] Service worker через vite-plugin-pwa (стратегия StaleWhileRevalidate)
- [ ] Web Push: подписка + уведомления о дедлайнах и упоминаниях

**Definition of Done:** Lighthouse PWA — 100, можно установить на телефон, выглядит и работает как нативное приложение.

---

## Этап 6 — Production polish (важно для резюме) (2–3 дня)

**Цель:** проект выглядит профессионально и его не стыдно показать.

- [ ] Покрытие unit-тестами критичной логики (sync, position calc) ≥ 90%
- [ ] 5–7 E2E-сценариев на Playwright
- [ ] Storybook со всеми shared UI-компонентами
- [ ] Lighthouse: Performance 90+, A11y 100, Best Practices 100, SEO 100
- [ ] README с:
  - [ ] Демо-гифкой (запись через Kap или Peek)
  - [ ] Архитектурной диаграммой
  - [ ] Списком фич
  - [ ] Стеком с обоснованиями
  - [ ] Инструкцией по запуску
- [ ] Минимум 3 ADR в `docs/adr/`:
  - [ ] ADR-001: выбор стека
  - [ ] ADR-002: стратегия offline-sync
  - [ ] ADR-003: подход к real-time коллаборации
- [ ] LinkedIn-пост и Twitter с релизом

**Definition of Done:** даёшь ссылку на репо и развёрнутую версию любому senior'у — он не находит, к чему придраться в первые 10 минут.

---

## Дополнительные идеи (если останется время и желание)

- Undo/Redo через command pattern
- Виртуализация колонок при 1000+ карточек (TanStack Virtual)
- Templates для досок (Sprint, Bug tracker, Personal)
- Экспорт доски в JSON / импорт
- Drag-and-drop файлов прямо на карточку
- AI-агент: "опиши свою задачу — создам карточки и распределю по колонкам" (через OpenAI/Claude API)
- Третий язык (например, испанский) — покажет, что i18n заложен правильно
