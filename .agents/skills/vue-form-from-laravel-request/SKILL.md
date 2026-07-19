---
name: vue-form-from-laravel-request
description: Build Vue forms from Laravel Form Request validation rules.
---

# Vue Form From Laravel Request Skill

## Workflow

1. Read the relevant `app/Http/Requests/**` class.
2. Capture `rules()`, route parameter behavior, `prepareForValidation()`, custom messages, enum rules, file rules, unique/exists constraints, and conditional rules.
3. Build form state using backend field names.
4. Add frontend validation only as user assistance; backend validation remains authoritative.
5. Map `422` errors by field and preserve nested keys such as `items.0.quantity`.
6. Use multipart `FormData` only when backend request expects files.
7. For select fields, preserve backend IDs/enums by using the original typed `BaseSelect` option value; do not stringify numeric IDs.
8. For Boolean JSON rules, keep form state as `boolean`, normalize Resource values with `normalizeBoolean`, and send actual `true`/`false`.
9. For multipart forms, keep frontend state Boolean and let `toFormData` serialize it to `1`/`0`; do not store transport strings in form state.
10. Use `BooleanField` rather than a status select for active/inactive. Match the Create default to the migration or backend default.
