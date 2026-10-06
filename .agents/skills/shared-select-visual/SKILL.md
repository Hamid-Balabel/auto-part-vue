---
name: shared-select-visual
description: Use when styling, fixing, or reviewing BaseSelect, SelectInput, SearchableSelectInput, dropdown visibility, or form-control select borders across this Vue project.
---

# Shared Select Visual Skill

## Architecture

All select variants in this project route through `BaseSelect`. `SelectInput` and `SearchableSelectInput` are compatibility wrappers; never add a native `<select>` to any page.

## Why .form-control owns the border

`BaseSelect` renders a `<button>` as its trigger. Tailwind's `@tailwindcss/forms` reset gives `<button>` elements no default border width, so the button border becomes zero-width/invisible unless the shared `.form-control` class sets an explicit `border` utility before `border-border`.

## Rules

1. `.form-control` in `src/style.css` must carry an explicit `border` width (Tailwind `border` = 1px) followed by `border-border` for the color. This is the single source of truth for select border appearance.
2. `.form-control` owns tokenized surface background, hover/focus border, focus ring (`focus:ring-2 focus:ring-primary/20`), disabled background/opacity, and transition. Do not duplicate these styles in page-specific classes.
3. Never use native `<select>` elements. Never add page-specific z-index, overflow, or visibility hacks for dropdown menus.
4. Preserve numeric `value` types returned by the component. Do not coerce option values to strings.
5. Preserve accessibility: keyboard navigation, aria-expanded, aria-activedescendant, and screen-reader announcements must remain intact.
6. Preserve RTL layout: logical classes (`text-start`, `text-end`), not hardcoded left/right.
7. `BaseSelectOption.depth` controls tree indentation inside the dropdown menu only. It must never alter the submitted value or affect the trigger button layout.
8. `.select-control` in `src/style.css` extends `.form-control` and adds `px-4` (16px) horizontal padding. It is the single source of truth for select-trigger inner spacing. `BaseSelect` applies `select-control` on its trigger button—no local `px-` utility. Labels and the chevron must never touch control edges; page-level padding hacks for this purpose are forbidden. Every dropdown (Products index, create, edit, filters, dialogs, etc.) must route through `BaseSelect`/`select-control`; no page exceptions.

## Verification

1. Representative coverage: test a direct `<BaseSelect>`, a `SelectInput` wrapper, a multiple-mode select, and a tree/nested select at minimum.
2. Locales: verify in both Arabic (RTL) and English (LTR).
3. Viewports: check desktop and mobile widths.
4. Build: run `npm run build` and confirm zero errors.
5. Screenshot: save a representative screenshot under `docs/screenshots/`.
