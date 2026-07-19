---
name: vue-module-generator
description: Generate a complete Vue module from an inspected Laravel backend resource.
---

# Vue Module Generator Skill

Generate modules only from confirmed API map entries.

## Required Files

- `src/modules/<module>/types.ts`
- `src/modules/<module>/api.ts`
- `src/modules/<module>/routes.ts`
- `src/modules/<module>/pages/*`
- Shared components only when reusable beyond one page.

## Rules

- Never call Axios directly from components.
- Use local component state for tables and forms unless state is shared.
- Add Pinia stores only for auth/user/permissions/cart/global settings or other genuine shared state.
- Match backend field names exactly.
- Match backend filters and pagination exactly.
- Add create, edit, show, delete, restore, force-delete, toggle-active, import, or export only when endpoints exist.
