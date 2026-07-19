---
name: vue-resource-mapping
description: Map Laravel API Resources to TypeScript interfaces and UI display.
---

# Vue Resource Mapping Skill

## Workflow

1. Read the matching `app/Http/Resources/**` class.
2. Convert returned fields into TypeScript interfaces.
3. Mark `whenLoaded` relations as optional or nullable.
4. Preserve backend field names in API types.
5. Create display helpers only for UI labels, money, dates, and statuses.
6. Use optional chaining in views for relations that may not be loaded.
