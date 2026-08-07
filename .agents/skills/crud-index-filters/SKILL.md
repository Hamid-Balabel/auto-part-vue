---
name: crud-index-filters
description: Use when adding or extending backend-supported search, filtering, sorting, or collapsible filter panels on Vue CRUD index pages.
---

# CRUD Index Filters Skill

## Required Workflow

1. Inspect the Laravel index route, controller, `PageRequest`, filter pipeline, model relationships, enums, policy, and feature tests before changing the Vue page.
2. Record every supported `search`, filter, sort, pagination, ownership, and permission behavior in `docs/api-map.md`. Never infer query parameters from database columns.
3. Wire `CrudToolbar` search only when the backend supports `search`. Submit through `useCrudList.applySearch` or equivalent route-synchronized list logic, reset to page 1, and trim blank values.
4. Use the shared `CrudFilterPanel` for advanced filters. It must be closed by default, preserve active values while closed, display the active-filter count, and expose explicit Apply and Reset actions.
5. Use `BaseSelect` for enums, booleans, and relationships; `DateInput` for strict `Y-m-d` dates; and `FormInput` for text and numeric ranges.
6. Send only non-empty supported values. Keep boolean false distinguishable from an unset value and use backend enum values exactly.
7. Load relationship options from confirmed list endpoints, respect permissions, and use human-readable labels rather than raw IDs.
8. Applying or resetting filters must reset pagination to page 1. Do not reload once per field change.
9. Keep filters responsive in one column on mobile, two on medium screens, and four on wide screens through the shared component.

## UI Snapshot

The canonical visual and behavior snapshot is `snapshots/CrudFilterPanel.vue`. The runtime source is `src/components/ui/CrudFilterPanel.vue`.

- Do not hand-copy the panel markup into index pages.
- If the runtime component intentionally changes, update the snapshot in the same change.
- Page-specific code belongs in the default slot; panel chrome, animation, buttons, accessibility, and test IDs stay shared.

## Verification

1. Build with `npm run build`.
2. Open the index page and verify `crud-filter-toggle` starts with `aria-expanded=false` and `crud-filter-content` is hidden.
3. Toggle twice and verify the slide animation, arrow rotation, keyboard focus, RTL, LTR, desktop, and mobile layout.
4. Submit search and inspect the network request for the exact trimmed `search` parameter.
5. Apply at least two filters together, inspect the request, verify the count badge, pagination reset, and table result.
6. Reset filters and verify parameters disappear from the next request.
7. Scan browser console errors and failed requests.
