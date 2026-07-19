---
name: order-installments-pattern
description: Use when adding payment history, installments, later payments, final payments, or Add Payment actions to Order Details.
---

# Order Installments Pattern

## Current Implementation

- Details: `src/modules/sales/pages/OrderDetailsPage.vue`
- Summary/history: `PaymentSummary.vue`, `PaymentsHistory.vue`
- Add action: `AddPaymentDialog.vue`
- API: `createPaidInstallment()` in `src/modules/sales/api.ts`

## Add Payment Action

- Show only with `create-installment`, remaining amount greater than zero, non-paid payment status, and an order not cancelled/refunded.
- Submit `{ order_id, amount, status: 'paid', payment_method: 'cash'|'card' }` to `POST /installments`.
- Use `/installments/{id}/pay` only for an existing pending scheduled installment and exact amount; it is not a free-form payment endpoint.
- Validate positive and not above remaining as user assistance, then display backend 422 errors.
- Reload the order after success. The backend moves partial to paid automatically when paid sum equals total.
- Hide Add Payment after backend returns `payment_status=paid`.

## History

- Show amount, payment method, `paid_at` fallback to `created_at`, creator, and installment status.
- Show order total, paid amount, remaining amount, payment status, and base payment method.
- Do not show transaction reference or notes because InstallmentResource does not expose them.

## QA

- Test partial first payment, second payment, final payment, over-remaining, zero, negative, backend failure, reload persistence, paid action hiding, permissions, and cancelled/refunded blocking.
