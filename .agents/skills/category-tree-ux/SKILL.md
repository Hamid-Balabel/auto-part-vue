---
name: category-tree-ux
description: Use when implementing, fixing, or reviewing category tree selects, pickers, breadcrumbs, search, hierarchy rendering, or collapse/expand in this Vue frontend.
---

# Category Tree UX

## Source Files

- `src/modules/data-entry/components/CategoryTreeSelect.vue` — dropdown combobox select used in Product/ProductItem forms.
- `src/modules/data-entry/components/CategoryTreePicker.vue` — inline always-visible picker used in TaxonomyFormPage.
- `src/modules/data-entry/utils/categoryTree.ts` — flatten, collapse, display-name, path, and disabled-set logic.
- `src/modules/inventory/pages/ProductFormPage.vue`, `ProductWithItemsFormPage.vue` — CategoryTreeSelect consumers.
- `src/modules/data-entry/pages/TaxonomyFormPage.vue` — CategoryTreePicker consumer (inline picker exception).
- `src/modules/sales/components/ProductBrowser.vue` — Quick Sale category badge display.

## Rules

1. **Form selectors are closed selects.** Product/category form selectors are normal closed select inputs with a popup. Never use always-open panels for these.
2. **Popup parents collapsed by default.** All parent nodes start collapsed; user toggles expand/collapse children.
3. **User toggles do not select.** The expand/collapse chevron must not also select the row.
4. **Compact rows, logical RTL indentation.** Use `paddingInlineStart` for depth; no hardcoded left/right.
5. **No Root prefix in user-facing breadcrumbs.** Path text should be `ancestor / child`, not `Root / ancestor / child`.
6. **Never show raw i18n keys, translation objects, or duplicate selectedPath/path/parent text.** Only show meaningful `ancestor / child` paths where useful.
7. **Quick Sale category is a small badge.** Use `bg-primary-soft` rounded-full badge with translated name, not a full tree widget.
8. **Parent-name search includes descendants.** Verify backend semantics for paginated APIs; do not assume client-only filtering.
9. **Accessible button-group semantics.** Use standard button group roles unless a complete ARIA tree keyboard model is implemented. Do NOT add `role=tree` without arrow-key behavior.
10. **TaxonomyFormPage inline-picker exception.** Preserve the CategoryTreePicker inline pattern only where explicitly intended for taxonomy management.
11. **Validate AR/EN and build.** Test Arabic RTL, English LTR, and run `npm run build` with zero errors.
