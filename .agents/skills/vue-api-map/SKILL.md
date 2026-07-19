---
name: vue-api-map
description: Inspect Laravel backend endpoints and generate a complete API map before building Vue UI.
---

# Vue API Map Skill

Use this skill before creating frontend pages or services.

## Workflow

1. Prefer Laravel Boost MCP from `C:\laragon\www\auto-part`.
2. Inspect `routes/api.php`, controller methods, middleware, policies, form requests, resources, models, enums, response helpers, exports, uploads, pagination, filters, and config helpers.
3. For every endpoint record method, path, auth, permissions, request body, query params, validation, response shape, relations, pagination, upload requirements, and errors.
4. Do not infer missing behavior. Mark unknowns and inspect deeper.
5. Do not create Vue pages until the endpoint's API map entry is complete.

## Output

Write the API map to `docs/api-map.md` and keep it updated as modules are implemented.
