---
name: vue-qa-playwright
description: Use Playwright MCP to test core Vue admin flows.
---

# Vue QA Playwright Skill

## Required Flows

- Login success and failure.
- Protected route redirect.
- List page loads.
- Create form validation.
- Create success when backend data is available.
- Edit success.
- Delete confirmation.
- Unauthorized and forbidden behavior.
- Open every select in Create/Edit and dialogs; verify search, selection, clear, keyboard navigation, RTL/LTR, viewport placement, and current Edit value.
- For each active CRUD, inspect Create/Edit network payloads for actual JSON booleans or the documented multipart `1`/`0` representation.
- Toggle Index status, verify the endpoint body contract, loading lock, persistence after reload, permission visibility, and rollback on failure when reproducible.

## Rules

- Prefer Playwright MCP for browser validation.
- Do not fake backend responses unless explicitly creating isolated component tests.
- Record any untestable flows and the reason.
- Check desktop and mobile viewports and finish with a console-error scan.
