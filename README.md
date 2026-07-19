# Auto Part Vue Frontend

Vue 3 + TypeScript frontend for the Laravel backend at `C:\laragon\www\auto-part`.

## Requirements

- Node compatible with Vite 5. This machine currently uses Node `20.11.1`.
- Backend running with PHP `>=8.4.0` because the Laravel project dependencies require it.
- Laravel backend base URL configured in `.env`.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Build check:

```bash
npm run build
```

## Environment

```env
VITE_API_BASE_URL=http://auto-part.test/api
VITE_APP_NAME="Auto Part Admin"
```

## OpenCode MCP Setup

Project config is in `opencode.json`.

Configured MCP servers:

- `laravel-boost`: runs `php artisan boost:mcp` from `C:\laragon\www\auto-part` using `cwd`.
- `filesystem`: scoped to the frontend project.
- `playwright`: for UI flow validation.
- `context7`: for framework/library docs.

Important: the current shell resolves `php` to `8.1.10`, but the backend requires PHP `>=8.4.0`. Update PATH or replace the MCP command with the absolute Laragon PHP 8.4+ binary before using Laravel Boost MCP.

## Skills

Frontend skills live under `.agents/skills`:

- `vue-api-map`
- `vue-module-generator`
- `vue-form-from-laravel-request`
- `vue-resource-mapping`
- `vue-auth-permission`
- `vue-crud-ui`
- `vue-sales-pricing-ui`
- `vue-qa-playwright`

Use them to inspect backend behavior first, then generate modules from confirmed API map entries.

## Current Implementation

Implemented:

- Vue 3 + Vite + TypeScript foundation.
- Tailwind CSS admin styling.
- Vue Router and Pinia.
- Axios service layer with token interceptor and centralized error handling.
- Sanctum bearer-token login/logout/profile foundation.
- Auth and permission route guard framework.
- Responsive admin layout/sidebar.
- Shared UI components: page header, data table, pagination, loading, empty state, status badge, money display, form inputs, file upload, confirm dialog.
- API map at `docs/api-map.md`.
- Data-entry CRUD modules for countries, categories, and brands.

Backend constraints respected:

- Translatable fields use `ar` and `en` based on `config/lang.php`.
- `ar` is required and `en` is optional according to backend validation.
- Country flag upload uses multipart form data.
- Delete/toggle actions use the backend's actual bulk action endpoints.

## Future Module Workflow

1. Inspect route, controller, request, resource, policy/middleware, filters, and response helper.
2. Update `docs/api-map.md`.
3. Add `types.ts` from the Laravel API Resource.
4. Add `api.ts` service methods. Do not call Axios in Vue components.
5. Add routes and pages.
6. Match backend validation fields exactly.
7. Add loading, empty, error, pagination, and confirmation states.
8. Run `npm run build`.
9. Test core flows with Playwright MCP when backend is running.

## Known Backend/MCP Blockers

- Laravel Boost MCP cannot be verified until PHP `>=8.4.0` is used by the MCP command.
- `php artisan route:list --path=api` fails with the current PHP CLI version.
- Some backend endpoints have authorization inconsistencies documented in `docs/api-map.md`.
- `stocks/delete` appears to have a route/controller parameter mismatch and should be verified before implementing stock delete UI.
