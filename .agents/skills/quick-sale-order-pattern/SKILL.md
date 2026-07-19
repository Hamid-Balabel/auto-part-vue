---
name: quick-sale-order-pattern
description: Use when implementing or extending Quick Sale, POS, direct order creation, product search, or rapid repeated sales in this Vue frontend.
---

# Quick Sale Order Pattern

## Backend Files To Reinspect

- `routes/api.php`
- `OrderController`, `OrderRequest`, `OrderResource`, `OrderService`, `OrderPolicy`
- Product item resources, active prices, stocks, warehouses, and customer request/resource
- Payment and installment files listed in `order-payment-pattern`

## Current Implementation

- Page: `src/modules/sales/pages/QuickSalePage.vue`
- State/business orchestration: `src/modules/sales/composables/useQuickSale.ts`
- API/types: `src/modules/sales/api.ts`, `src/modules/sales/types.ts`
- Components: `ProductSearch`, `QuickSaleItems`, `QuantityControl`, `PaymentMethodSelector`, `PartialPaymentForm`, `OrderSummary`, `QuickCustomerDialog`

## Rules

- Use direct `POST /orders`, not Cart/Checkout. Cart code remains but its route/navigation are intentionally hidden.
- Load all available Product Items from the confirmed endpoint and search locally by translated product name, SKU, and barcode because the backend list has no search filter.
- Send only `invoice_no`, `customer_id`, `payment_method`, and `{ item_id, quantity, warehouse_id? }` items.
- Display `current_price * quantity` only as a preview. Never send client price, subtotal, or total.
- Customer is required by `OrderRequest`. Quick creation uses the existing customer endpoint and exact customer validation.
- Prevent duplicate submission. After success, show the authoritative order/payment response and offer View or New Sale.
- If order creation succeeds but first payment fails, retain the created order ID and provide a link to Order Details; the backend has no atomic create-and-pay endpoint.

## QA

- Test Arabic/English, RTL/LTR, desktop/mobile, name/SKU/barcode search, quantity edits, remove, stock rejection, duplicate invoice, quick customer validation, repeated submit prevention, and new-sale reset.
