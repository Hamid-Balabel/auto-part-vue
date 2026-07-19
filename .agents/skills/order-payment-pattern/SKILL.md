---
name: order-payment-pattern
description: Use when implementing Cash, Card, Partial Payment, paid/remaining totals, payment status, or first-payment behavior for Orders.
---

# Order Payment Pattern

## Backend Files To Reinspect

- `OrderPaymentStatusEnum`, `OrderPaymentMethodEnum`, `OrderStatusEnum`, `InstallemntsStatusEnum`
- `Order`, `Installment`, and unused `Payment` models
- `OrderRequest`, `InstallmentRequest`, `PayInstallmentRequest`
- `OrderController`, `InstallmentController`
- `OrderService`, `InstallmentService`
- `OrderPolicy`, `InstallmentPolicy`
- `OrderResource`, `InstallmentResource`

## Enum Rules

- Payment methods: `cash`, `card`, `transfer`.
- Payment statuses: `pending`, `partial`, `paid`.
- `partial` is a frontend payment mode and backend payment status, never an order `payment_method` value.
- Never submit `payment_status`; the backend prohibits it and calculates it from paid installments.

## Real Flows

- Cash/Card full payment:
  1. Create order with matching `payment_method`.
  2. Use authoritative returned `order.total`.
  3. Create `{ order_id, amount: order.total, status: 'paid', payment_method }` through `POST /installments`.
  4. Reload order and require backend `payment_status=paid`, `remaining_amount=0`.
- Partial first payment:
  1. Create order using first payment's `cash|card` method.
  2. Create a paid installment smaller than authoritative order total.
  3. Reload and require backend `payment_status=partial`.

## Errors And Permissions

- Order creation requires `create-order`; payment creation requires `create-installment` and order ownership or `view-all-order`.
- Amount must be positive and cannot make scheduled/paid amounts exceed order total.
- Frontend totals are assistance only. Always display refreshed `paid_amount`, `remaining_amount`, and `payment_status` from OrderResource.
- No reference or notes fields exist for payments. Do not invent them.
- Explicitly handle the non-atomic gap where the order exists but first payment fails.
