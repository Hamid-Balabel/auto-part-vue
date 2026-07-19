---
name: crud-show-details
description: Use when adding CRUD View/show actions, details modals, or relationship-rich record previews to Vue admin modules.
---

# CRUD Show Details Skill

## Required Workflow

1. Inspect the backend route definition and confirm the exact show endpoint, route parameter, middleware, and policy/permission behavior.
2. Inspect the show controller method and every resource class it returns, including nested resources and `whenLoaded` relationships.
3. Fetch or inspect an actual show API response before building UI.
4. The show UI must be based on the backend show endpoint response, not only on the list endpoint response.
5. Any relationship returned by the backend should be displayed using meaningful human-readable fields rather than foreign IDs.
6. Do not add row-by-row frontend API requests to fill table relationships. If a relationship is required in a list, confirm the list endpoint returns it or identify a backend limitation.
7. Add an eye icon action only when the authenticated user has access to the show endpoint. Use the existing project permission naming strategy and backend policies; do not guess names.
8. Fetch details only after the user clicks View. Clear previous record data before loading another record.
9. Prevent duplicate requests and safely ignore stale responses if the modal closes or another record is selected before the request finishes.
10. Handle loading, API errors, empty relationships, and missing optional fields consistently.

## UI Standard

1. Use a shared modal or drawer component for CRUD details. Do not create separate duplicated details modals per module.
2. Use organized sections/cards for main information, related information, images/files, and collections.
3. Render scalar values with labels and fallbacks.
4. Render boolean values and statuses with badges.
5. Render dates with localized formatting.
6. Render numbers and prices with localized formatting.
7. Render images/files with previews when a usable URL/path is returned; show a clear empty state otherwise.
8. Render related objects with a relationship card that prioritizes `name`, translated names, `sku`, `email`, or other human-readable fields.
9. Render collections as responsive tables, lists, or timelines; include empty states.
10. Hide internal technical fields that do not help the user, unless the field is necessary to distinguish records.
11. Avoid uncontrolled recursive JSON dumps. Module-specific formatting should be intentional and extensible.

## Internationalization And Layout

1. Add missing Arabic and English translation keys, reusing equivalent existing keys where possible.
2. Respect RTL and LTR automatically through existing app layout and logical CSS classes.
3. Ensure the modal is responsive on desktop, tablet, and mobile.
4. Long content must scroll inside the modal without page overflow.
5. Use clear empty-state text for missing relationships and collections.

## Verification

1. Verify the show endpoint is called only after clicking View.
2. Verify the details response is not confused with the list row response.
3. Verify no raw foreign IDs are displayed when readable relationship data is returned.
4. Verify console errors, failed network calls, duplicate requests, translation warnings, layout overflow, loading states, and API error states.
5. Test both Arabic RTL and English LTR when the module is user-facing.
