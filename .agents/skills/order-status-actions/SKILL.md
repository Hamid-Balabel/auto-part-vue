---
name: order-status-actions
description: Use when adding Order status buttons, transition confirmations, status history, or workflow permission handling.
---

# Order Status Actions Pattern

## Backend Matrix

- Source: Laravel status enum, `OrderStatusRequest`, `OrderPolicy`, factory, and strategy classes.
- Current transitions:
  - `pending -> paid` only when `payment_status=paid`.
  - `pending -> cancelled`.
  - `paid -> completed` only when `payment_status=paid`.
  - `paid -> refunded`.
  - `completed -> refunded`.
  - `cancelled` and `refunded` are terminal.
- Never offer `pending` as an action target.

## Frontend Structure

- Detailed `OrderResource.buttons` is the final source for visible transition actions because it combines the status strategy and policy.
- Confirmation/notes form: `src/modules/sales/components/OrderStatusDialog.vue`.
- Status presentation: `src/modules/sales/components/SalesStatusBadge.vue`.
- Execution and refresh: `src/modules/sales/pages/OrderDetailsPage.vue`.

## Rules

- Render only keys returned by `OrderResource.buttons`; never reconstruct actions from summary rows or show a dropdown containing every enum value.
- Display each backend `button.label` verbatim to the user. Use `button.key` only as the status value sent to the change-status endpoint.
- Send exactly `{ status, notes? }` to `PUT /orders/{id}/status`; never send `payment_status`.
- Confirm every transition. Support optional notes up to 1500 characters.
- Give cancel/refund danger styling and paid/completed primary/success semantics using existing design tokens.
- Replace local order data with the backend response after success.
- Invalid transitions commonly return 403 from policy; display the backend message.
- Cancellation/refund restores stock but does not reverse installments. Make refund copy explicit.

## Verification

- Inspect visible actions for each status/payment combination.
- Confirm hidden actions for users without `update-order`.
- Verify exact status request payload and one request per confirmation.
- Verify status badge, timeline, Arabic/English labels, RTL/LTR, and responsive dialogs.
