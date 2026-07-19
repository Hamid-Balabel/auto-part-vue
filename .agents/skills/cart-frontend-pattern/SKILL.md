---
name: cart-frontend-pattern
description: Use when implementing or extending Cart quantity controls, cart API integration, or Checkout flows in this Vue frontend.
---

# Cart Frontend Pattern

The Cart UI is currently intentionally hidden. Do not register `CartPage.vue` in routes or navigation unless the product requirement explicitly re-enables standalone carts. Quick sales use direct Orders.

## Source Of Truth

- Reinspect Laravel routes, `CartRequest`, `CartResource`, `CartService`, `CheckoutOrderRequest`, and `OrderService` before changing behavior.
- Keep API contracts in `src/modules/sales/api.ts` and types in `src/modules/sales/types.ts`.
- Backend prices, stock validation, line totals, and order totals are authoritative. Never send client totals.

## Current Structure

- Page orchestration: `src/modules/sales/pages/CartPage.vue`.
- API layer: `src/modules/sales/api.ts`.
- Load the authenticated user's current lines through `GET /carts/me`; do not require the administrative cart-list permission for checkout UI.
- Quantity control: `src/modules/sales/components/QuantityControl.vue`.
- Product identity/image/options: `src/modules/sales/components/ProductItemIdentity.vue`.
- Totals: `src/modules/sales/components/OrderSummary.vue`.

## Quantity Updates

- Update requires both `item_id` and `quantity`; PATCH is not partial.
- Reflect the desired quantity immediately, but serialize requests per cart row.
- While a request is running, store the latest desired quantity. After each response, send another request only if the desired quantity changed.
- On any backend stock/price/validation error, show the backend message and reload the cart to restore authoritative values.
- Do not debounce plus/minus into parallel requests and do not reload the whole page.

## Checkout

- Send only `invoice_no`, `customer_id`, and `payment_method` to `/orders/checkout`.
- Map 422 keys including `invoice_no`, `customer_id`, `payment_method`, `cart`, and `items`.
- Disable checkout while any line update is pending.
- Explain that checkout reprices items and can reject stock even after cart validation.
- On success, route to `orders.show`; the backend clears the cart atomically.

## UX And QA

- Confirm line deletion and full cart clearing.
- Use backend-returned images/options and EGP money presentation.
- Empty cart gets a dedicated empty state; initial fetch gets a loading state.
- Test Arabic RTL, English LTR, mobile layout, repeated quantity clicks, 422 stock errors, delete, clear, empty cart, and checkout network payload.
