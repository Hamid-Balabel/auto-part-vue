# Skill: frontend-design-system

# Frontend Design System

Use this skill for every frontend UI task in this repository.

## Theme Tokens

- Theme tokens live in `src/style.css` under `:root`.
- Tailwind token mappings live in `tailwind.config.js`.
- Use `primary` for main actions, active navigation, selected states, input focus, links, checked controls, enabled switches, and progress indicators.
- Use `secondary` for supporting actions, filters, secondary selections, supporting highlights, and subtle accents.
- Use semantic colors only for their semantic meaning: `success`, `warning`, `danger`, `info`, and `neutral`.
- Never hardcode arbitrary UI colors in pages.
- Never use green, red, orange, purple, or blue for normal selected states unless they are the configured design tokens for that purpose.

## Current Palette

- Primary: `#1d4ed8` with hover `#1e40af`, active `#1e3a8a`, soft `#dbeafe`, contrast `#ffffff`.
- Secondary: `#b45309` with hover `#92400e`, active `#78350f`, soft `#fef3c7`, contrast `#ffffff`.
- Background: `#f6f8fc`.
- Surface: `#ffffff`.
- Text: `#0f172a`.
- Muted text: `#64748b`.

## Common Components

- Buttons: `src/components/ui/BaseButton.vue`.
- Badges: `src/components/ui/BaseBadge.vue` and `src/components/ui/StatusBadge.vue`.
- Tables: `src/components/ui/DataTable.vue` and `src/components/ui/Pagination.vue`.
- Page headers: `src/components/ui/PageHeader.vue`.
- Form sections: `src/components/ui/FormSection.vue`.
- Text inputs: `src/components/forms/FormInput.vue`.
- Select inputs: `src/components/forms/SelectInput.vue`.
- Date inputs: `src/components/forms/DateInput.vue`.
- File inputs: `src/components/forms/FileUpload.vue`.
- Checkboxes: `src/components/forms/BaseCheckbox.vue`.
- Switches: `src/components/forms/SwitchInput.vue`.
- Modals: `src/components/modals/ConfirmDialog.vue`.
- Permission selection: `src/components/permissions/PermissionGroup.vue` and `src/components/permissions/PermissionItem.vue`.

## Button Rules

- Use `BaseButton` instead of raw buttons or router links when styling is needed.
- Supported variants are `primary`, `secondary`, `outline`, `ghost`, `danger`, and `link`.
- Use `primary` for create/save/sign-in.
- Use `secondary` for cancel/supporting actions.
- Use `ghost` for subtle row actions such as edit.
- Use `danger` only for delete/destructive actions.
- Use `loading`, `disabled`, `fullWidth`, `ariaLabel`, and `dataTestid` props instead of duplicating behavior.

## Form Rules

- All create and edit pages must use `src/components/ui/FormPageLayout.vue`.
- Do not place `.form-shell`, fixed grid columns, page-specific max widths, or one-off centering classes directly on CRUD pages.
- `FormPageLayout` owns the page header, centered form card, full available width, large-screen maximum width, responsive padding, RTL/LTR behavior, and footer action slot.
- Form alignment must be verified with Playwright bounding-box measurements comparing `[data-testid="app-main"]` to the form `data-testid`.
- CRUD forms must fill the available content area and remain centered; left and right gaps should be balanced for RTL and LTR.
- Use `FormInput`, `SelectInput`, `DateInput`, `FileUpload`, `BaseCheckbox`, and `SwitchInput` before creating new form markup.
- Use `BasePhoneInput` for user/customer-style phone fields that submit `phone_code_id` and local `phone`.
- Phone country codes must come from the backend countries endpoint, never hardcoded lists.
- Country selectors must use the common searchable select pattern and support Arabic name, English name, ISO/code, and phone-code search.
- Phone validation must use selected country metadata from `phone_length` and mirror backend validation.
- Required markers must use `text-danger`.
- Error messages must use `.form-error` and be associated with the input through `aria-describedby` when possible.
- Inputs must use `.form-control` for height, border, focus ring, disabled state, and RTL/LTR behavior.
- Create/edit pages should use `.form-shell` and `FormSection` to keep forms centered, wide enough, and responsive.

## Table Rules

- Use `DataTable` for list pages.
- Use `Pagination` for paginated backend responses.
- Use `BaseBadge` for counters and role chips.
- Use `StatusBadge` for status values.
- Use `SwitchInput` for user active status.
- Row actions should use small `BaseButton` variants, not large colored buttons.

## Sidebar Rules

- Sidebar styles are centralized through `.nav-shell`, `.nav-item`, `.nav-item-active`, `.nav-group-button`, and `.nav-icon-accent` in `src/style.css`.
- Active routes should be clear but not overly saturated.
- Use primary for active route indication and secondary for icon/accent support.
- Keep groups closed by default unless the page logic explicitly opens one.

## Permission Selection Rules

- Use `PermissionGroup` and `PermissionItem`; do not duplicate permission checkbox markup in pages.
- Default permission item state: neutral surface, readable text, subtle border.
- Hover state: soft primary background and emphasized primary border.
- Selected state: primary soft background, primary border/ring, readable text, checked control.
- Disabled state: disabled control with reduced opacity and no active interaction.
- Group state: neutral for none selected, secondary for partial selected, primary for fully selected.
- Group select-all must expose mixed state via `BaseCheckbox` indeterminate behavior.
- Search and select-all controls belong in the page logic; item/group visuals belong in shared components.

## RTL, LTR, Responsive, Accessibility

- Always test Arabic RTL and English LTR.
- Always test at least desktop and mobile viewports.
- Labels must be clickable for checkboxes/radios where applicable.
- Switches must have accessible names.
- Icon-only buttons must provide `aria-label`.
- Disabled controls must be actually disabled.
- Focus states must remain visible through the tokenized focus ring.
- Permission groups must be keyboard accessible through their header button and controls.

## MCP Playwright Workflow

- Never consider UI work complete without Playwright MCP verification.
- For every UI change: run the app, open the relevant route, inspect rendered UI, inspect console messages, inspect failed network requests, test interactions, test RTL and LTR, test responsive layouts, fix issues, and rerun affected scenarios.
- Use section or component screenshots when dynamic data makes full-page screenshots brittle.
- Required visual states for this project include login, users list, user create/edit, roles list, role create/edit, permission selection none/partial/group/all selected, sidebar expanded/collapsed or mobile open/closed, RTL, LTR, desktop, and mobile.

## Creating Components

- Never create a duplicate component before searching `src/components`.
- Create a common component only when it centralizes meaningful styling, behavior, sizes, loading, disabled state, accessibility, RTL/LTR behavior, validation, or events.
- Do not put API requests or business rules inside base UI components.
- Keep API logic in module services, page orchestration in pages, and reusable presentation in components.

## Required Verification Before Done

- `npm run build` must pass.
- Users, Roles, and Permissions modules must be retested through Playwright MCP.
- Create/edit form pages must be measured in Playwright at desktop, tablet, and mobile sizes before being marked complete.
- Phone country dropdowns must be tested through the real countries endpoint, including search and edit preselection.
- Verify user role assignment, user active switch, role permission selection, role edit selected permissions, group select-all, all permissions select-all, delete confirmations, sidebar colors, RTL/LTR, mobile/desktop, console errors, and failed network requests.
- Record remaining issues with exact reasons.
