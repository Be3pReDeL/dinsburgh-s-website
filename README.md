# Dinsburgh — сайт-визитка художника

Одностраничное портфолио художника Dinsburgh с темной эстетикой, стеклянными панелями и модальным просмотром работ.

## Быстрый старт

```bash
npm install
npm run dev
```

## Сборка

```bash
npm run build
npm run preview
```

## Как добавлять работы

Контент подтягивается автоматически из папок в `content/portfolio` — код менять не нужно.

Структура:

```
content/portfolio/
  01-digital/
    01-work-slug/
      image.webp
      meta.json
  02-painting/
    01-work-slug/
      image.webp
      meta.json
  03-fashion/
    01-work-slug/
      image.webp
      meta.json
```

Формат `meta.json`:

```json
{
  "title": "Название работы",
  "description": "Описание работы в 1–5 предложениях."
}
```

Правила:
- Внутри папки работы должен быть один файл изображения (`.jpg`, `.png` или `.webp`).
- Нумерация в названии папок помогает управлять порядком в табах и сетке.
- Название раздела берется из имени папки категории (например `01-digital` → `Digital`).

## Стек

- React + TypeScript + Vite
- Чистый CSS (без внешних UI-библиотек)

## Палитра

Теплота цвета повышена через базовые CSS-переменные (вариант A). См. `src/styles.css` — блок `:root` с пометкой о warm palette shift.
