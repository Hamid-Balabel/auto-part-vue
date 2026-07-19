# Auto Part Laravel API Map

Generated from source inspection of `C:\laragon\www\auto-part`. Laravel Boost MCP is configured but currently blocked by the active PHP CLI version; backend dependencies require PHP `>=8.4.0`, while `php` resolves to `8.1.10`.

## Response And Pagination

- JSON success helper: `{ status: true, code, message, data }`.
- JSON failure helper: `{ status: false, code, message, data }`.
- Authenticated routes use `auth:sanctum`.
- Pagination uses `per_page`; `per_page=-1` returns all records where `wrapPaginate` is used.
- Common sorting params are `sort_column` and `sort_direction` where controllers apply `OrderByFilter`.

## Public Auth

| Method | Endpoint | Request | Response |
| --- | --- | --- | --- |
| POST | `/api/login` | `email`, `password`, optional/required `otp` depending backend config, `meta` | `token`, `user` with `id,name,email,phone,avatar,roles,permissions`; roles/permissions may be encrypted |
| POST | `/api/logout` | authenticated; `all_devices`, `token_id` optional | success helper |
| GET | `/api/captcha` | none | `{ token, captcha_code }` |
| POST | `/api/captcha/verify` | `captcha`, `token` | success/fail helper |
| POST | `/api/send-otp` | `email`, `type` | success/fail helper |
| POST | `/api/check-otp` | `email`, `otp`, `type` | success/fail helper |
| POST | `/api/verify-otp` | `email`, `otp`, `type` | success/fail helper |
| POST | `/api/reset-password` | `email`, `otp`, `password`, `password_confirmation` | success helper |

## Authenticated Profile

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/api/me` | returns `sessions` and `user` resource |
| POST | `/api/update-profile` | multipart if `avatar`; `name`, phone fields, optional password confirmation |
| POST | `/api/destroy-avatar` | deletes current avatar |

## Core Modules

Most resource modules follow `GET`, `POST`, `GET /{id}`, `PUT/PATCH /{id}` plus module-specific bulk operations. Bulk delete bodies use `id` or `ids` from backend traits.

| Module | Base | Extra Actions | Known Permissions/Authz |
| --- | --- | --- | --- |
| Permissions | `/api/permissions` | index only registered | `read-permission` |
| Roles | `/api/roles` | `DELETE /delete` | `RolePolicy`; permissions like `view-all-role`, `create-role`, `update-role`, `delete-role` |
| Users | `/api/users` | `delete`, `force-delete`, `restore`, `toggle-active` | `UserPolicy`; root/current user protected |
| Countries | `/api/countries` | `delete`, `force-delete`, `restore`, `toggle-active` | create/update middleware; delete traits fallback to permission names |
| Categories | `/api/categories` | `delete`, `force-delete`, `restore`, `toggle-active` | create/update middleware; `CategoryPolicy` for destructive actions |
| Brands | `/api/brands` | `delete`, `force-delete`, `restore`, `toggle-active` | create/update middleware; `BrandPolicy` for destructive actions |
| Products | `/api/products` | `delete`, `force-delete`, `restore`, `toggle-active` | create/update middleware; `ProductPolicy` for destructive actions |
| Product Items | `/api/product-items` | `delete`, `force-delete`, `restore`, `toggle-active`, `POST /bulck`, image routes | create/update middleware; note typo `bulck` is real route |
| Product Options | `/api/product-options` | `delete`, `force-delete`, `restore`, `toggle-active` | create/update middleware |
| Option Values | `/api/option-values` | `delete`, `force-delete`, `restore`, `toggle-active` | create/update middleware |
| Item Prices | `/api/item-prices` | `DELETE /delete` | no visible controller Gate/middleware |
| Warehouses | `/api/warehouses` | `delete`, `force-delete`, `restore`, `toggle-active` | create/update middleware; `WarehousePolicy` destructive actions |
| Stocks | `/api/stocks` | `delete`, `restore`, `toggle-active` | stock authz appears inconsistent; no policy found |
| Customers | `/api/customers` | `delete`, `force-delete`, `restore`, `toggle-active` | create/update middleware; `CustomerPolicy` destructive actions |
| Carts | `/api/carts` | `GET /me`, `GET /summary`, `DELETE /clear` | `CartPolicy`; cart rows belong to the authenticated user |
| Orders | `/api/orders` | checkout, status, item add/remove, logs, installments | `OrderPolicy`; owner or view-all scope |
| Installments | `/api/installments` | order installments under `/orders/{order}/installments` | create/update/delete middleware |
| Order Logs | `/api/order-logs` | read-only | `view-order` on index/show |

## Global Utilities

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET/PUT | `/api/settings` | see Settings Contract below |
| POST | `/api/send-test-mail` | `update-setting`; `email`, `body` |
| GET | `/api/report` | report builder payload; filters include date range/config/chart |
| GET | `/api/export` | binary file; `start`, `end`, `page`, optional columns |
| GET | `/api/activity-logs` | `read-log`; filters search/model/user/operation/date/sort |
| GET | `/api/activity-logs/{activity}` | detail |
| GET | `/api/help-configs` | lookup helper |
| GET | `/api/help-models` | lookup helper |
| GET | `/api/help-enums` | lookup helper |
| GET/PUT | `/api/notifications` | `PUT` action `open` or `read`; ids required for read |
| POST | `/api/chunk-file` | `file_name`, `chunk_number`, `chunk_file`; controller also reads `path`, `is_final` |

## Important Backend Risks To Respect

## Settings Contract

- Routes: `GET /api/settings`, `PUT /api/settings` under authenticated API routes.
- Authorization: `PUT /api/settings` requires `update-setting`; `GET` is authenticated and applies public filtering in the current controller query.
- Filters: optional query `key` and `group`, both `LIKE` filters.
- Database: `settings` columns are `id`, `key`, `value`, `group`, `placeholder` JSON, `label` JSON, `is_multi_lang`, `is_env`, `type`, timestamps.
- Storage: unique behavior is by `key` + `group`; `SettingService::updateSettings()` upserts only `value`.
- Grouping: `SettingGroupResource::organizeNested()` groups by the first segment of `group`; second dotted segment becomes a nested tab/section. Frontend must render groups exactly from response, not hardcode keys.
- Response envelope: `{ status, code, message, data }` where `data` is `SettingGroup[]`.
- Group shape: `{ label, display_label, nested, items }`.
- Setting shape: `{ id, key, value, translated_value, label, translated_label, placeholder, translated_placeholder, group, display_group, type, display_type, is_env, is_multi_lang, last_updated_at }`.
- Labels/placeholders: `label` and `placeholder` are translation maps; `translated_label` and `translated_placeholder` follow current backend locale.
- Multi-language settings: `is_multi_lang=1` values may be objects like `{ ar, en }`; frontend must preserve object shape.
- Update request: JSON or multipart body `{ settings: [{ key, group, value }] }`; request validation only requires `settings`, `settings.*.key`, and `settings.*.group`, with nullable `value`.
- Media settings: backend `SettingService` uploads values for `imageUploader` and `file` through Media Manager. Frontend must use multipart when any setting value is a `File`.
- Backend enum currently lists `text`, `textarea`, `imageUploader`, `file`, `checkBox`, `radio`, `switchbox`; live DB also contains `select`. Frontend must normalize common future types dynamically.
- Current seeded groups include `general.info`, `general.contact`, `general.social`, `properties`, `notifications`, `theme.colors`, `theme.font`, `mail_templates.otp`, `mail_templates.theme`, `config.mail`, `config.sms`, `config.ldap`, and `config.reverb`.
- Select options are not modeled as a dedicated DB column. Existing seeded select options are embedded in placeholders like `Options: smtp, sendmail, ...`; frontend can parse these as a best-effort fallback but must not hardcode keys.
- There is no reset endpoint. Frontend reset means reset unsaved local changes to the last loaded API value.

## Remaining CRUD Contract: Products, Product Items, Categories, Brands, Customers, Warehouses, Stocks

### Shared Rules

- All routes are authenticated through Sanctum.
- Success envelope is `{ status, code, message, data }`.
- Validation errors are Laravel `422` with `message` and `errors` keyed by backend field names.
- List endpoints use `PageRequest` plus `fetchData()`: `page`, `per_page`; `per_page=-1` returns all rows where helper behavior applies.
- Sorting is only available where controllers pipe through `OrderByFilter`: `sort_column`, `sort_direction`.
- Bulk delete/toggle/restore/force-delete traits accept `{ id }` or `{ ids: [] }` where the backend trait is used.
- Do not add frontend filters unless the controller actually pipes the matching filter.
- All translatable fields must submit backend names as objects like `{ ar, en }`.

### Categories

- Endpoints: `GET/POST /api/categories`, `GET/PUT/PATCH /api/categories/{category}`, `DELETE /api/categories/delete`, `POST /api/categories/restore`, `DELETE /api/categories/force-delete`, `PUT /api/categories/toggle-active`.
- Middleware: `create-category` on store, `update-category` on update. Delete/restore/force/toggle authorize through `CategoryPolicy`.
- Policy permissions include `view-all-category`, `view-own-category`, `create-category`, `update-category`, `delete-category`, `restore-category`, `force-delete-category`, `toggle-active-category`.
- Index/show do not explicitly gate view permissions in the inspected controller.
- Request fields: `name` required translatable array, `description` optional nullable array, `parent_id` optional nullable existing `categories.id`, `is_active` optional boolean.
- Resource fields: `id`, `name`, `translation_name`, `description`, `translation_description`, `is_active`, `parent_id`, optional `parent`, optional `children`, optional `creator`, `created_at`.
- Relations: self `parent`, self `children`, has many products, belongs to creator.
- List pipeline: `JsonDisplayNameFilter`, `OrderByFilter`. Caveat: filter searches `display_name`, but table has `name`, so `search` is likely broken until backend changes to `JsonNameFilter`.
- No backend `is_active` or trashed filter is applied on index.
- Use `GET /api/categories?per_page=-1` for parent/category selects. Exclude current category on edit client-side; backend does not prevent parent loops beyond existence.

### Brands

- Endpoints: `GET/POST /api/brands`, `GET/PUT/PATCH /api/brands/{brand}`, `DELETE /api/brands/delete`, `POST /api/brands/restore`, `DELETE /api/brands/force-delete`, `PUT /api/brands/toggle-active`.
- Middleware: `create-brand` on store, `update-brand` on update. Delete/restore/force/toggle authorize through `BrandPolicy`.
- Policy permissions include `view-all-brand`, `view-own-brand`, `create-brand`, `update-brand`, `delete-brand`, `restore-brand`, `force-delete-brand`, `toggle-active-brand`.
- Request fields: `name` required translatable array, `description` optional nullable array, `is_active` optional boolean.
- Resource fields: `id`, `name`, `translation_name`, `description`, `translation_description`, `is_active`, optional `creator`, `created_at`.
- Relations: has many products, belongs to creator.
- List pipeline: `JsonDisplayNameFilter`, `OrderByFilter`. Caveat: filter searches `display_name`, but table has `name`, so `search` is likely broken until backend changes to `JsonNameFilter`.
- No backend `is_active` or trashed filter is applied on index.
- Use `GET /api/brands?per_page=-1` for product brand selects.

### Products

- Endpoints: `GET/POST /api/products`, `GET/PUT/PATCH /api/products/{product}`, `DELETE /api/products/delete`, `POST /api/products/restore`, `DELETE /api/products/force-delete`, `PUT /api/products/toggle-active`.
- Middleware: `create-product` on store, `update-product` on update. Delete/restore/force/toggle authorize through `ProductPolicy`.
- Policy permissions include `view-all-product`, `view-own-product`, `create-product`, `update-product`, `delete-product`, `restore-product`, `force-delete-product`, `toggle-active-product`.
- Request fields: `name` required translatable array, `description` optional nullable array, `category_id` required existing categories, `brand_id` required existing brands, `is_active` optional boolean.
- Resource fields: `id`, `name`, `translation_name`, `description`, `translation_description`, `is_active`, `category_id`, `brand_id`, optional `category`, optional `brand`, optional `product_items`, optional `creator`, `created_at`.
- Relations: belongs to category/brand/creator, has many product items.
- Show loads `category`, `brand`, `creator`, `items.prices`, `items.stocks`.
- Index pipeline: `JsonDisplayNameFilter`, `OrderByFilter`. Caveat: `search` likely broken because filter targets `display_name` while products use `name`.
- No product image field exists. Product item images belong to product items.
- Select dependencies: categories from `/api/categories?per_page=-1`, brands from `/api/brands?per_page=-1`.

### Product Items

- Endpoints: `GET/POST /api/product-items`, `GET/PUT/PATCH /api/product-items/{product_item}`, `DELETE /api/product-items/delete`, `POST /api/product-items/restore`, `DELETE /api/product-items/force-delete`, `PUT /api/product-items/toggle-active`, `POST /api/product-items/bulck`.
- The route typo `bulck` is real.
- Bulk create contract: `POST /api/product-items/bulck` uses multipart `ProductWithItemsRequest` and creates a new product plus all `items` in one database transaction. Product fields are `name`, optional `description`, `category_id`, `brand_id`, optional `is_active`. Each item requires unique `sku`, `price >= 0.01`; accepts nullable unique `barcode`, `option_value_ids[]`, `stocks[]` with warehouse and non-negative integer quantity, and `images[]` (`jpg/jpeg/png/webp`, max 50MB each).
- Image endpoints: `POST /api/product-items/{product_item}/images`, `POST /api/product-items/images/{item_image}/replace`, `DELETE /api/product-items/images/{item_image}`.
- Middleware: `create-product-item` on store, `update-product-item` on update. Delete/restore/force/toggle authorize through `ProductItemPolicy`.
- Request fields: `sku` required unique string, `barcode` optional nullable unique string, `product_id` required existing products, `is_active` optional boolean, `option_value_ids[]` optional existing product option values, `price` required numeric min `0.01`, `stocks[]` optional, `stocks.*.warehouse_id` required existing warehouses, `stocks.*.quantity` required integer min `0`, `images[]` optional jpg/jpeg/png/webp max 50MB.
- DB caveat: `product_items.barcode` is unique and not nullable in migration, while request allows nullable. Avoid sending null/empty barcode unless backend/schema is fixed.
- Resource fields: `id`, `sku`, `barcode`, `is_active`, `product_id`, optional `product`, optional `option_values`, optional `images`, `total_stock`, optional `stocks`, `current_price`, optional `prices`, optional `creator`, `created_at`.
- Relations: belongs to product/creator, has many images/stocks/prices, belongs to many option values, belongs to many orders through order items.
- Create/update behavior: option values sync; price creates a new active `ItemPrice` when different; stocks overwrite absolute quantity per warehouse; images append new `ItemImage` records.
- Index pipeline only has `OrderByFilter`; no backend `search`, `product_id`, warehouse, stock, or active filters.
- UX decision: product items should be managed as product variants/items inside Product detail/edit, with a dedicated product-items CRUD route available. Product update cannot update items, and bulk create has no bulk update equivalent.

### Customers

- Endpoints: `GET/POST /api/customers`, `GET/PUT/PATCH /api/customers/{customer}`, `DELETE /api/customers/delete`, `POST /api/customers/restore`, `DELETE /api/customers/force-delete`, `PUT /api/customers/toggle-active`.
- Middleware: `create-customer` on store, `update-customer` on update. Delete/restore/force/toggle authorize through `CustomerPolicy`.
- Policy permissions include `view-customer`, `view-all-customer`, `view-own-customer`, `create-customer`, `update-customer`, `delete-customer`, `restore-customer`, `force-delete-customer`, `toggle-active-customer`.
- Request fields: `name` required string max 191, `phone_code_id` optional existing countries, `phone` optional string max 191, `email` optional email unique. `prepareForValidation()` also accepts nested `phone.phone_code_id` and `phone.phone`.
- `is_active` exists in DB/model but is not accepted by `CustomerRequest`; change it only via toggle endpoint.
- Resource fields: `id`, `name`, `phone_code_id`, optional `phone_code`, `phone`, `email`, `is_active`, optional `creator`, `created_at`.
- Relations: belongs to country phoneCode, belongs to creator, has many orders.
- Index pipeline only has `OrderByFilter`; no backend `search`, phone, email, active, or trashed filter is applied.
- Select dependencies: countries from `/api/countries?per_page=-1` for phone code.

### Warehouses

- Endpoints: `GET/POST /api/warehouses`, `GET/PUT/PATCH /api/warehouses/{warehouse}`, `DELETE /api/warehouses/delete`, `POST /api/warehouses/restore`, `DELETE /api/warehouses/force-delete`, `PUT /api/warehouses/toggle-active`.
- Middleware: `create-warehouse` on store, `update-warehouse` on update. Delete/restore/force/toggle authorize through `WarehousePolicy`.
- Policy permissions include `view-warehouse`, `view-all-warehouse`, `view-own-warehouse`, `create-warehouse`, `update-warehouse`, `delete-warehouse`, `restore-warehouse`, `force-delete-warehouse`, `toggle-active-warehouse`.
- Request fields: `name` required translatable array, `description` optional nullable array, `address` optional nullable string max 191, `is_active` optional boolean.
- Resource fields: `id`, `name`, `translation_name`, `description`, `translation_description`, `address`, `is_active`, optional `stocks`, optional `creator`, `created_at`.
- Relations: has many stocks, belongs to creator.
- Index pipeline only has `OrderByFilter`; no backend search, active, address, or trashed filter.
- Force-deleting a warehouse can cascade-delete stock rows due to DB FK cascade.

### Stocks

- Endpoints: `GET/POST /api/stocks`, `GET/PUT/PATCH /api/stocks/{stock}`, `DELETE /api/stocks/delete`, `POST /api/stocks/restore`, `PUT /api/stocks/toggle-active`.
- Create/update permission middleware is commented out in `StockController`; currently auth-only for index/show/store/update.
- No `StockPolicy` is registered/found.
- Request fields: `warehouse_id` required existing warehouses, `item_id` required existing product items, `quantity` required integer min 0.
- Store behavior is upsert by `(warehouse_id, item_id)` and sets absolute quantity. It is not a movement/increment.
- Update validates `warehouse_id` and `item_id`, but only updates `quantity`; warehouse/item changes are ignored.
- Resource fields: `id`, `warehouse_id`, optional `warehouse`, `item_id`, `quantity`, `created_at`. Controller loads `item`, but `StockResource` does not expose it.
- DB unique key: `warehouse_id + item_id`.
- Index pipeline only has `OrderByFilter`; no warehouse/product/item/quantity filters.
- Unsupported/broken actions: hide stock delete/restore/toggle in frontend for now. `DELETE /api/stocks/delete` route lacks a `{stock}` parameter for `destroy(Stock $stock)`, `restore` is invalid because Stock has no SoftDeletes, and toggle is invalid because Stock has no `is_active` column.
- Stock UI must label quantity changes as setting/overwriting quantity, not adding stock. For item details, fetch product item/product separately because stock index does not expose item relation.

- Do not rely on client-calculated order/cart totals; backend resolves prices and stock changes transactionally.
- Roles and permissions returned by login may be encrypted by backend config.
- `stocks/delete` appears mismatched with `StockController::destroy(Stock $stock)` because route has no `{stock}` parameter.
- Several read endpoints are authenticated only, without visible read middleware or Gate checks.
- Some filters target `display_name` while resources use `name`; do not add frontend filters until confirmed per controller.

## Cart, Checkout And Orders Contract

### Cart

- A cart row is a line item; there is no separate CartItem model. Unique key is authenticated `user_id + item_id`.
- Endpoints: `GET/POST /api/carts`, `GET/PUT/PATCH/DELETE /api/carts/{cart}`, `GET /api/carts/me`, `GET /api/carts/summary`, `DELETE /api/carts/clear`.
- `GET /api/carts` accepts only `page`, `per_page`, `sort_column`, and `sort_direction`. Users without `view-all-cart` are scoped to their own rows.
- Create payload: `{ item_id, quantity }`. Update payload is not partial and requires `{ item_id, quantity }`, even with PATCH.
- A client `price` is accepted by validation but ignored. The backend selects the active effective price and stores it on the cart row.
- Adding an existing item increases its quantity. Updating can replace item and quantity, but duplicate user/item rows are rejected.
- Cart resource: `id`, `user_id`, optional `user`, `item_id`, nested `item`, `quantity`, `price`, `line_total`, `created_at`.
- Nested item can include product, option values, images, current price, and stock. `line_total` and all displayed totals must be treated as backend values.
- `GET /carts/summary` returns `{ count, total }`; count is line count, not summed units.
- Cart stock validation sums stock from active warehouses. Cart does not reserve/decrement stock.
- Errors use 422 field keys: `item_id` for unavailable/missing-price items and `quantity` for insufficient stock.
- Permissions: list requires `view-all-cart` or `view-own-cart`; create requires `create-cart`; owners can show/update/delete their own rows; clear is allowed for authenticated users and affects only their cart.

### Checkout

- Endpoint: `POST /api/orders/checkout`; permission `create-order`.
- Payload: `{ invoice_no, customer_id, payment_method? }`; payment methods are `cash`, `card`, `transfer`.
- Customer must be active and not deleted. Invoice number is required, unique, string, max 191.
- Checkout locks the authenticated user's cart, rejects an empty cart, revalidates products/prices/stock, creates the order and items, decrements stock, writes a `created` log, and clears the cart in one transaction.
- Cart prices are not trusted at checkout; every line is repriced from the current effective backend price.
- Checkout requires one active warehouse stock row to fulfill an entire line, although cart validation uses aggregate active-warehouse stock. Checkout can therefore reject a previously valid cart.
- Empty cart error is keyed by `cart`; item/price/stock checkout failures are keyed by `items`.

### Orders

- Endpoints: `GET/POST /api/orders`, `GET/PUT/PATCH/DELETE /api/orders/{order}`, `POST /api/orders/{order}/items`, `DELETE /api/orders/{order}/items/{itemId}`, `PUT /api/orders/{order}/status`, `GET /api/orders/{order}/logs`.
- List supports pagination and generic sorting only. It has no backend filters for invoice, customer, phone, status, payment, payment method, or date; the frontend must not expose fake filters that break pagination.
- Order resource: `id`, `invoice_no`, `total`, `paid_amount`, `remaining_amount`, `status`, `payment_method`, `payment_status`, `stock_restored_at`, optional `customer`, `items`, `installments`, `logs`, `creator`, `created_at`, `updated_at`.
- `OrderResource` now has contexts. List/index uses summary fields only and does not include items/installments/logs/buttons. Show/create/update/status responses use `details` and additionally return `buttons`, `stock_restored_at`, `items`, `installments`, and `logs`.
- Detailed `buttons` are generated by the current status strategy then filtered through `OrderPolicy::changeStatus`; frontend status actions must come from this array rather than duplicate a transition matrix.
- For every detailed action button, display the backend-provided `label` and submit its `key` as the `status` value. Do not replace the backend label with a frontend translation.
- Order item resource: `id`, `order_id`, `item_id`, `warehouse_id`, `price`, `quantity`, `subtotal`, optional `product_item`, optional `warehouse`, `created_at`.
- Statuses: `pending`, `paid`, `completed`, `cancelled`, `refunded`. Payment statuses: `pending`, `partial`, `paid`.
- Status payload: `{ status, notes? }`; target can only be `paid`, `cancelled`, `completed`, or `refunded`; notes are nullable string max 1500 and `payment_status` is prohibited.
- Allowed transitions: pending -> paid only when payment status is paid; pending -> cancelled; paid -> completed only when payment status is paid; paid -> refunded; completed -> refunded. Cancelled/refunded are terminal.
- Successful transitions write a status log. Cancellation/refund restores stock once. Completion does not restore stock.
- Order mutation and status actions require `update-order` plus ownership or `view-all-order`. Delete requires `delete-order` plus ownership/view-all and only works for pending orders without installments.
- Order totals are authoritative: item subtotal is backend price times quantity; order total is sum of item subtotals; paid amount is paid installments; remaining amount is total minus paid.
- There are no backend tax, discount, shipping cost, shipping status, coupon, attachment, invoice-file, or print endpoints/fields. Currency is configured server-side as EGP but not returned in resources.
- Invalid status transitions normally fail policy authorization with HTTP 403. Business validation remains HTTP 422 with backend field keys.

### Quick Sale And Payments

- Quick Sale creates orders directly with `POST /api/orders`; the standalone Cart UI is intentionally not registered or linked.
- Direct create payload is `{ invoice_no, customer_id, payment_method, items: [{ item_id, quantity, warehouse_id? }] }`. Client `total`, item `price`, and item `subtotal` are not sent because the backend recalculates them.
- `OrderPaymentMethodEnum` values are `cash`, `card`, and `transfer`. `partial` is not a payment method.
- `OrderPaymentStatusEnum` values are `pending`, `paid`, and `partial`. The request prohibits setting `payment_status`; `InstallmentService` calculates it from paid installments.
- `InstallemntsStatusEnum` values are `pending`, `paid`, and `overdue`.
- Every direct order starts with `payment_status=pending`, including cash/card. There is no atomic create-and-pay endpoint.
- Full cash/card frontend sequence:
  1. `POST /api/orders` with order `payment_method=cash|card`.
  2. Read authoritative `order.total` from the response.
  3. `POST /api/installments` with `{ order_id, amount: order.total, status: 'paid', payment_method: cash|card }`.
  4. Reload `GET /api/orders/{id}`; payment status becomes `paid`, paid amount equals total, and remaining is zero.
- Partial frontend sequence:
  1. `POST /api/orders` using the first payment's actual `cash|card` method.
  2. `POST /api/installments` with `{ order_id, amount: initial_amount, status: 'paid', payment_method: cash|card }`.
  3. Reload the order; if `0 < amount < total`, payment status becomes `partial`.
- Later free-form payments use the same `POST /api/installments` paid payload. `POST /api/installments/{installment}/pay` is only for paying a pre-existing scheduled installment and requires the submitted amount to equal that installment exactly.
- `POST /api/installments` requires `create-installment`; amount must be at least `0.01`; scheduled/paid totals cannot exceed the order total; cancelled/refunded orders are not payable.
- Payment status calculation is authoritative: paid sum `0 => pending`, `0 < paid < total => partial`, `paid == total => paid`.
- Installment resource fields are `id`, `order_id`, `amount`, `due_date`, `paid_at`, `status`, `payment_method`, optional `creator`, optional `order`, `created_at`, and `updated_at`.
- There is no payment transaction reference, receipt reference, payment notes, or standalone operational Payment endpoint/table. Do not render or submit these fields.
- Important atomicity gap: order creation and first payment are separate HTTP transactions. If payment creation fails after order creation, the pending order remains with reserved stock and must be completed from Order Details.
