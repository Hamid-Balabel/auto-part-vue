---
name: vue-auth-permission
description: Implement auth, route guards, permission guards, and sidebar visibility from backend behavior.
---

# Vue Auth Permission Skill

## Workflow

1. Inspect login, logout, profile, roles, permissions, encryption config, and user resource responses.
2. Store and send Sanctum bearer token exactly as backend expects.
3. Add Axios interceptors for `Authorization`, `401`, `403`, `422`, and `500`.
4. Implement route guards from actual backend permission names.
5. Hide sidebar/menu actions based on permissions, but rely on backend as source of truth.
6. Do not hardcode permission names until confirmed from policies/middleware or API responses.
