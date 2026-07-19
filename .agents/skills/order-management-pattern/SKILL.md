---
name: order-management-pattern
description: Use when implementing or extending Orders lists, Order Details pages, order items, totals, customers, logs, or installments in this Vue frontend.
---

# Order Management Pattern

## Contracts First

- Reinspect Laravel `OrderController`, requests, resources, models, policy, `OrderService`, and logs before implementation.
- Update `docs/api-map.md` before changing frontend behavior.
- Preserve backend field names in `src/modules/sales/types.ts`.

## Current Structure

- API: `src/modules/sales/api.ts`.
- Routes: `src/modules/sales/routes.ts`.
- Quick Sale: `src/modules/sales/pages/QuickSalePage.vue` with `useQuickSale.ts`.
- List: `src/modules/sales/pages/OrdersIndexPage.vue`.
- Details: `src/modules/sales/pages/OrderDetailsPage.vue`.
- Status badge: `src/modules/sales/components/SalesStatusBadge.vue`.
- Item identity: `src/modules/sales/components/ProductItemIdentity.vue`.
- Totals: `src/modules/sales/components/OrderSummary.vue`.

## List Rules

- Use `DataTable`; configure `actions` once and as the final column.
- Arabic table direction places the final Actions column on the left; English places it on the right.
- Use icon-only actions with accessible labels and titles.
- Do not add invoice/customer/status/date/payment filters until the backend list endpoint supports them. Client filtering a paginated page is misleading.
- Order list responses are summary context and do not include items, installments, logs, or buttons. Do not show counts or mutation actions that require those missing details.
- Preserve backend pagination and sorting parameters only.

## Details Rules

- Details must call `GET /orders/{id}` and use nested customer, items, installments, logs, creator, and totals from that response.
- Separate order information, customer, items, summary, payment schedule, and history into sections.
- Never render tax, discount, shipping, shipping status, attachment, invoice file, or address fields unless the resource adds them.
- Treat `total`, `paid_amount`, and `remaining_amount` as authoritative.
- Render payment summary/history from loaded installments and use the Add Payment contract from `order-installments-pattern`.

## Permissions And Errors

- List/show require `view-all-order` or `view-own-order`.
- Mutation controls require the exact policy permission and current-state condition.
- Show backend 403/422 messages; do not infer success from hidden controls.
- Add all labels to Arabic and English locale files.
