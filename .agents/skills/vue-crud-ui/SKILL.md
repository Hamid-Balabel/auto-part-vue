---
name: vue-crud-ui
description: Build index/create/edit/show/delete flows following shared Vue components.
---

# Vue CRUD UI Skill

## Workflow

1. Start from API map and resource mapping.
2. Build list page with `DataTable`, loading, empty state, pagination, and backend-supported filters.
3. Build create/edit forms from Laravel Form Request rules.
4. Build details view from API resource fields.
5. Add confirmation dialogs for destructive actions.
6. Add toast feedback for successful mutations and user-friendly failures.
7. Do not add search, sorting, archive, restore, force-delete, or status toggles unless backend supports them.

## Table Rules

1. Use the shared `DataTable` and declare every visible column exactly once in the `columns` configuration.
2. RTL must not be implemented by reversing the configured table columns. Column order, header order, and row cell order must remain identical. RTL should only control direction, spacing, and text alignment.
3. The Actions column must be declared once in the shared columns configuration and must not be injected separately into both the header and body.
4. Render table headers and body cells from the same `columns` array so each row has the same number and order of cells as the header.
5. Keep semantic table markup: `table`, `thead`, `tr`, `th`, `tbody`, and `td`. Do not turn desktop table rows into flex or grid layouts.
6. Use logical alignment classes such as `text-start` and `text-end`; avoid hardcoded left/right alignment unless there is a concrete design reason.
7. On small screens, preserve real table structure and use a horizontal scroll wrapper instead of reordering columns or moving actions outside the table.
8. The Actions column must be the final configured column for CRUD tables. Do not move it based on locale or visual direction.
9. Use `RowActions` for edit/delete actions. Actions must be icon-only buttons with accessible labels/titles, not text buttons.
10. Simple active/inactive mutations must live in the Status column using `ActiveStatusSwitch`, not inside `RowActions`.
11. Do not add a status switch for workflow/enums or resources without a backend `toggle-active` contract. Use a read-only badge for those statuses.

## Select Rules

1. Use `BaseSelect` for every finite or relationship selection. `SelectInput` and `SearchableSelectInput` are compatibility wrappers around `BaseSelect`; never add a native `<select>` to a page.
2. Use searchable mode for API relationships and long lists, multiple mode for relationship arrays, and preserve the option value type returned by the component.
3. Pass translated labels, placeholders, search text, empty text, loading, disabled, and validation error states.
4. `BaseSelect` teleports its menu to `body`; do not add page-specific z-index or overflow workarounds for dialogs, cards, or drawers.
5. Keep Role permissions on the grouped `PermissionGroup` pattern. Use `BaseSelect multiple` for ordinary multi-relations such as User roles and Product option values.

## Boolean Rules

1. Inspect the migration default, model cast, Form Request, Resource, and controller before adding a Boolean field. Do not infer a field name or contract.
2. Use `BooleanField` in Create/Edit forms and `ActiveStatusSwitch` in Index status cells. Never model active/inactive as a select.
3. Normalize API values with `normalizeBoolean`; never use `Boolean(value)` for persisted values because `Boolean('false')` is true.
4. JSON requests must send actual `true`/`false`. Multipart requests use the shared `toFormData`, which serializes booleans as Laravel-compatible `1`/`0` strings.
5. A flip-only `toggle-active` endpoint receives only `{ id }`. Do not send a desired state that the backend ignores. Prevent repeat clicks, optimistically update only with rollback, and show translated success/error feedback.
