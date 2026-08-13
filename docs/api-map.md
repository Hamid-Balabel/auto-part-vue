# Auto Part Laravel API Map

Verified from source inspection of `D:\Me\auto-part`.

## Response And Pagination

- JSON success helper: `{ status: true, code, message, data }`.
- JSON failure helper: `{ status: false, code, message, data }`.
- Authenticated routes use `auth:sanctum`.
- Pagination uses `per_page`; `per_page=-1` returns all records where `wrapPaginate` is used.
- Common sorting params are `sort_column` and `sort_direction` where controllers apply `OrderByFilter`.

## CRUD Index Search And Filter Contracts

- Every endpoint below is `GET`, requires `auth:sanctum`, accepts `page` and `per_page`, and uses `per_page=-1` for an unpaginated result.
- `D` below means created-date filters `created_from`/`created_to` (aliases `start`/`end`), formatted `YYYY-MM-DD`. `A` means boolean `is_active`. `T` means `trashed=with|only`; `is_trashed=true` is also accepted for only-trashed rows. ID arrays use query arrays such as `product_ids[]=1`.
- Search on translated JSON names checks configured locales (currently Arabic and English). Unless stated otherwise, matching is partial; fields described as exact are equality filters.
- All listed indexes use allowlisted sorting: `sort_column` (legacy alias `order_by`) and `sort_direction=asc|desc`; default and invalid-column fallback are `id desc`. Every module allows `id`, `created_at`, and `updated_at`; the table lists additional allowed columns.

| Resource / endpoint | `search` fields | Supported filters (besides pagination/search/sort) | Additional sortable columns | Index authorization / owner scope |
| --- | --- | --- | --- | --- |
| Users `/api/users` | `name`, `email`, `phone` | `phone_code_id`, `created_by`, `gender`, `last_login_from`, `last_login_to`, `role_id`, exact role `role`, A, T, D | `name`, `email`, `phone`, `gender`, `is_active`, `last_login`, `phone_code_id`, `created_by`, `deleted_at` | Gate requires `view-all-user` or `view-own-user`; without view-all, `related()` scopes the query to `created_by=auth()->id()`. |
| Roles `/api/roles` | translated `display_name` | exact `guard_name`, `created_by`, `permission_id`, A, D | `name`, `display_name.ar`, `display_name.en`, `guard_name`, `is_active`, `created_by` | Gate requires `view-all-role` or `view-own-role`; without view-all, `related()` scopes to `created_by=auth()->id()`. Root and the authenticated user's assigned roles are always excluded. |
| Permissions `/api/permissions` | translated `display_name` | exact `group`, exact `guard_name`, `role_id`, D | `name`, `display_name.ar`, `display_name.en`, `group`, `guard_name` | Requires `read-permission`; no owner scope. |
| Countries `/api/countries` | translated `name` | exact `code`, exact `phone_code`, `phone_length_min`, `phone_length_max`, A, T, D | localized `name`, `name.ar`, `name.en`, `nationality.ar`, `nationality.en`, `code`, `phone_code`, `phone_length`, `is_active`, `deleted_at` | Authenticated only; no index read permission or owner scope. |
| Categories `/api/categories` | translated `name` | `parent_id`, `created_by`, `is_root=true`, `has_products`, A, T, D | localized `name`, `name.ar`, `name.en`, `is_active`, `parent_id`, `created_by`, `deleted_at` | Authenticated only; no index read permission or owner scope. |
| Brands `/api/brands` | translated `name` | `created_by`, `has_products`, A, T, D | localized `name`, `name.ar`, `name.en`, `is_active`, `created_by`, `deleted_at` | Authenticated only; no index read permission or owner scope. |
| Branches `/api/branches` | translated `name` | translated-name `name`, partial `address`, `is_current`, `created_by`, A, T, D | localized `name`, `name.ar`, `name.en`, `address`, `is_current`, `is_active`, `created_by`, `deleted_at` | Requires `read-branch`; no owner scope. |
| Warehouses `/api/warehouses` | translated `name` | partial `address`, `branch_id`, `created_by`, `has_stock`, `item_id`, A, T, D | localized `name`, `name.ar`, `name.en`, `branch_id`, `address`, `is_active`, `created_by`, `deleted_at` | Authenticated only; no index read permission or owner scope. |
| Products `/api/products` | translated `name` | `category_id`, `brand_id`, `category_ids[]`, `brand_ids[]`, `created_by`, `has_items`, partial item `sku`, partial item `barcode`, A, T, D | localized `name`, `name.ar`, `name.en`, `is_active`, `category_id`, `brand_id`, `created_by`, `deleted_at` | Authenticated only; no index read permission or owner scope. |
| Product items `/api/product-items` | `sku`, `barcode`, translated product `name`, translated option `name`, translated option value `name` | partial `sku`, partial `barcode`, `product_id`, `product_ids[]`, `merchant_id`, `merchant_ids[]`, `created_by`, `category_id`, `brand_id`, `option_value_id`, `warehouse_id`, A, T, D | `sku`, `barcode`, `is_active`, `product_id`, `merchant_id`, `created_by`, `deleted_at` | Authenticated only; no index read permission or owner scope. |
| Product options `/api/product-options` | translated `name` | `created_by`, `has_values`, A, T, D | localized `name`, `name.ar`, `name.en`, `is_active`, `created_by`, `deleted_at` | Authenticated only; no index read permission or owner scope. |
| Stocks `/api/stocks` | item `sku`/`barcode`, translated product name, translated warehouse name, warehouse address | `warehouse_id`, `warehouse_ids[]`, `item_id`, `item_ids[]`, `quantity_min`, `quantity_max`, `in_stock`, `product_id`, `category_id`, `brand_id`, D | `warehouse_id`, `item_id`, `quantity` | Authenticated only; no index read permission or owner scope. |
| Stock transfer logs `/api/stock-transfer-logs` | `reference_number`, `notes`, source/destination warehouse names, item SKU/product name, creator name | partial `reference_number`, `from_warehouse_id` (alias `source_warehouse_id`), `to_warehouse_id` (alias `destination_warehouse_id`), either-side `warehouse_id`, `product_item_id`, `created_by`, transferred-date `from_date`/`to_date`, D | `reference_number`, `from_warehouse_id`, `to_warehouse_id`, `created_by`, `transferred_at` | Requires `read-stock-transfer`; no owner scope. |
| Customers `/api/customers` | `name`, `email`, `phone`, country `phone_code` | partial `name`, exact `email`, partial `phone`, `phone_code_id`, `created_by`, `has_orders`, A, T, D | `name`, `email`, `phone`, `phone_code_id`, `is_active`, `created_by`, `deleted_at` | Authenticated only; no index read permission or owner scope. |
| Merchants `/api/merchants` | `name`, `email`, `phone` | partial `name`, exact `email`, partial `phone`, `created_by`, `has_product_items`, A, T, D | `name`, `email`, `phone`, `is_active`, `created_by`, `deleted_at` | Requires `read-merchant` plus `view-all-merchant` or `view-own-merchant`; without view-all, query is scoped to `created_by=auth()->id()`. |
| Orders `/api/orders` | `invoice_no`; customer `name`/`email`/`phone`; creator `name`/`email` | partial `invoice_no`, `customer_id`, `created_by`, exact enum `status`, `payment_method`, `payment_status`, `total_min`, `total_max`, `paid_amount_min`, `paid_amount_max`, `remaining_amount_min`, `remaining_amount_max`, `stock_restored_at_from`, `stock_restored_at_to`, D | `invoice_no`, `total`, `status`, `payment_method`, `payment_status`, `customer_id`, `created_by`, `stock_restored_at` | Requires `view-all-order` or `view-own-order`; without view-all, query is scoped to `created_by=auth()->id()`. |
| Installments `/api/installments` | order `invoice_no`; customer `name`/`email`/`phone`; creator `name`/`email` | `order_id`, `customer_id`, `created_by`, exact enum `status`, `payment_method`, `amount_min`, `amount_max`, `due_date_from`, `due_date_to`, `paid_at_from`, `paid_at_to`, `is_paid`, D | `order_id`, `amount`, `due_date`, `paid_at`, `status`, `payment_method`, `created_by` | Requires `view-all-installment` or `view-own-installment`; without `view-all-order`, rows are scoped to orders created by the authenticated user. |

## Public Auth

| Method | Endpoint              | Request                                                                       | Response                                                                                                |
| ------ | --------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| POST   | `/api/login`          | `email`, `password`, optional/required `otp` depending backend config, `meta` | `token`, `user` with `id,name,email,phone,avatar,roles,permissions`; roles/permissions may be encrypted |
| POST   | `/api/logout`         | authenticated; `all_devices`, `token_id` optional                             | success helper                                                                                          |
| GET    | `/api/captcha`        | none                                                                          | `{ token, captcha_code }`                                                                               |
| POST   | `/api/captcha/verify` | `captcha`, `token`                                                            | success/fail helper                                                                                     |
| POST   | `/api/send-otp`       | `email`, `type`                                                               | success/fail helper                                                                                     |
| POST   | `/api/check-otp`      | `email`, `otp`, `type`                                                        | success/fail helper                                                                                     |
| POST   | `/api/verify-otp`     | `email`, `otp`, `type`                                                        | success/fail helper                                                                                     |
| POST   | `/api/reset-password` | `email`, `otp`, `password`, `password_confirmation`                           | success helper                                                                                          |

## Authenticated Profile

| Method | Endpoint              | Notes                                                                       |
| ------ | --------------------- | --------------------------------------------------------------------------- |
| GET    | `/api/me`             | returns `sessions` and `user` resource                                      |
| POST   | `/api/update-profile` | multipart if `avatar`; `name`, phone fields, optional password confirmation |
| POST   | `/api/destroy-avatar` | deletes current avatar                                                      |

## Core Modules

Most resource modules follow `GET`, `POST`, `GET /{id}`, `PUT/PATCH /{id}` plus module-specific bulk operations. Bulk delete bodies use `id` or `ids` from backend traits.

| Module          | Base                   | Extra Actions                                                                     | Known Permissions/Authz                                                                     |
| --------------- | ---------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Permissions     | `/api/permissions`     | index only registered                                                             | `read-permission`                                                                           |
| Roles           | `/api/roles`           | `DELETE /delete`                                                                  | `RolePolicy`; permissions like `view-all-role`, `create-role`, `update-role`, `delete-role` |
| Users           | `/api/users`           | `delete`, `force-delete`, `restore`, `toggle-active`                              | `UserPolicy`; root/current user protected                                                   |
| Countries       | `/api/countries`       | `delete`, `force-delete`, `restore`, `toggle-active`                              | create/update middleware; delete traits fallback to permission names                        |
| Categories      | `/api/categories`      | `delete`, `force-delete`, `restore`, `toggle-active`                              | create/update middleware; `CategoryPolicy` for destructive actions                          |
| Brands          | `/api/brands`          | `delete`, `force-delete`, `restore`, `toggle-active`                              | create/update middleware; `BrandPolicy` for destructive actions                             |
| Products        | `/api/products`        | `delete`, `force-delete`, `restore`, `toggle-active`                              | create/update middleware; `ProductPolicy` for destructive actions                           |
| Product Items   | `/api/product-items`   | `delete`, `force-delete`, `restore`, `toggle-active`, `POST /bulck`, image routes | create/update middleware; note typo `bulck` is real route                                   |
| Product Options | `/api/product-options` | `delete`, `force-delete`, `restore`, `toggle-active`                              | create/update middleware                                                                    |
| Option Values   | `/api/option-values`   | `delete`, `force-delete`, `restore`, `toggle-active`                              | create/update middleware                                                                    |
| Item Prices     | `/api/item-prices`     | `DELETE /delete`                                                                  | no visible controller Gate/middleware                                                       |
| Warehouses      | `/api/warehouses`      | `delete`, `force-delete`, `restore`, `toggle-active`                              | create/update middleware; `WarehousePolicy` destructive actions                             |
| Stocks          | `/api/stocks`          | `delete`, `restore`, `toggle-active`                                              | stock authz appears inconsistent; no policy found                                           |
| Stock Transfer Logs | `/api/stock-transfer-logs` | read-only index/show                                                           | exact permission `read-stock-transfer`                                                       |
| Customers       | `/api/customers`       | `delete`, `force-delete`, `restore`, `toggle-active`                              | create/update middleware; `CustomerPolicy` destructive actions                              |
| Carts           | `/api/carts`           | `GET /me`, `GET /summary`, `DELETE /clear`                                        | `CartPolicy`; cart rows belong to the authenticated user                                    |
| Orders          | `/api/orders`          | checkout, status, item add/remove, logs, installments                             | `OrderPolicy`; owner or view-all scope                                                      |
| Installments    | `/api/installments`    | order installments under `/orders/{order}/installments`                           | create/update/delete middleware                                                             |
| Order Logs      | `/api/order-logs`      | read-only                                                                         | `view-order` on index/show                                                                  |

## Global Utilities

| Method  | Endpoint                        | Notes                                                                               |
| ------- | ------------------------------- | ----------------------------------------------------------------------------------- |
| GET/PUT | `/api/settings`                 | see Settings Contract below                                                         |
| POST    | `/api/send-test-mail`           | `update-setting`; `email`, `body`                                                   |
| GET     | `/api/report`                   | Authenticated report builder. `page=product|user` (backend defaults to `user`), optional `start`, `end` (`end >= start`), `advanced[]`, `config[]`, `prefer_chart=high_chart`. Returns `data.report` with localized `title`, `page`, four summary items in `cards.data`, and five tables (`title`, `data`, translated `columns`, responsive `size`). Product cards: active products created in the period, active product items created in the period, stock rows created in the period, and completed/paid sales revenue. User cards: active users created in the period, completed/paid sales count, sales value, and units sold. Without dates these include all records. Product tables: top-selling products/items, low-stock items, highest-revenue products, slow-moving items. User tables: most sales, highest sales value, most units sold, most product items created, most stock transferred. |
| GET     | `/api/export`                   | binary file; `start`, `end`, `page`, optional columns                               |
| GET     | `/api/activity-logs`            | `read-log`; filters search/model/user/operation/date/sort                           |
| GET     | `/api/activity-logs/{activity}` | detail                                                                              |
| GET     | `/api/help-configs`             | lookup helper                                                                       |
| GET     | `/api/help-models`              | lookup helper                                                                       |
| GET     | `/api/help-enums`               | lookup helper                                                                       |
| GET/PUT | `/api/notifications`            | `PUT` action `open` or `read`; ids required for read                                |
| POST    | `/api/chunk-file`               | `file_name`, `chunk_number`, `chunk_file`; controller also reads `path`, `is_final` |

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
- Index search/filter/sort behavior is defined in **CRUD Index Search And Filter Contracts** above.
- Use `GET /api/categories?per_page=-1` for parent/category selects. Exclude current category on edit client-side; backend does not prevent parent loops beyond existence.

### Brands

- Endpoints: `GET/POST /api/brands`, `GET/PUT/PATCH /api/brands/{brand}`, `DELETE /api/brands/delete`, `POST /api/brands/restore`, `DELETE /api/brands/force-delete`, `PUT /api/brands/toggle-active`.
- Middleware: `create-brand` on store, `update-brand` on update. Delete/restore/force/toggle authorize through `BrandPolicy`.
- Policy permissions include `view-all-brand`, `view-own-brand`, `create-brand`, `update-brand`, `delete-brand`, `restore-brand`, `force-delete-brand`, `toggle-active-brand`.
- Request fields: `name` required translatable array, `description` optional nullable array, `is_active` optional boolean.
- Resource fields: `id`, `name`, `translation_name`, `description`, `translation_description`, `is_active`, optional `creator`, `created_at`.
- Relations: has many products, belongs to creator.
- Index search/filter/sort behavior is defined in **CRUD Index Search And Filter Contracts** above.
- Use `GET /api/brands?per_page=-1` for product brand selects.

### Products

- Endpoints: `GET/POST /api/products`, `GET/PUT/PATCH /api/products/{product}`, `DELETE /api/products/delete`, `POST /api/products/restore`, `DELETE /api/products/force-delete`, `PUT /api/products/toggle-active`.
- Middleware: `create-product` on store, `update-product` on update. Delete/restore/force/toggle authorize through `ProductPolicy`.
- Policy permissions include `view-all-product`, `view-own-product`, `create-product`, `update-product`, `delete-product`, `restore-product`, `force-delete-product`, `toggle-active-product`.
- Request fields: `name` required translatable array, `description` optional nullable array, `category_id` required existing categories, `brand_id` required existing brands, `is_active` optional boolean.
- Resource fields: `id`, `name`, `translation_name`, `description`, `translation_description`, `is_active`, `category_id`, `brand_id`, optional `category`, optional `brand`, optional `product_items`, optional `creator`, `created_at`.
- Relations: belongs to category/brand/creator, has many product items.
- Show loads `category`, `brand`, `creator`, `items.merchant`, `items.prices`, and `items.stocks`.
- Index search/filter/sort behavior is defined in **CRUD Index Search And Filter Contracts** above.
- No product image field exists. Product item images belong to product items.
- Select dependencies: categories from `/api/categories?per_page=-1`, brands from `/api/brands?per_page=-1`.

### Product Items

- Endpoints: `GET/POST /api/product-items`, `GET/PUT/PATCH /api/product-items/{product_item}`, `DELETE /api/product-items/delete`, `POST /api/product-items/restore`, `DELETE /api/product-items/force-delete`, `PUT /api/product-items/toggle-active`, `POST /api/product-items/bulck`.
- The route typo `bulck` is real.
- Bulk create contract: `POST /api/product-items/bulck` uses multipart `ProductWithItemsRequest` and creates a new product plus all `items` in one database transaction. Product fields are `name`, optional `description`, `category_id`, `brand_id`, optional `is_active`. Each item requires `price >= 0.01`; accepts nullable existing `merchant_id`, `option_value_ids[]`, `stocks[]` with warehouse and non-negative integer quantity, and `images[]` (`jpg/jpeg/png/webp`, max 50MB each). `items.*.sku` and `items.*.barcode` are prohibited.
- Image endpoints: `POST /api/product-items/{product_item}/images`, `POST /api/product-items/images/{item_image}/replace`, `DELETE /api/product-items/images/{item_image}`.
- Middleware: `create-product-item` on store, `update-product-item` on update. Delete/restore/force/toggle authorize through `ProductItemPolicy`.
- Request fields: `sku` and `barcode` prohibited, `product_id` required existing products, `merchant_id` optional nullable existing non-deleted merchant, `is_active` optional boolean, `option_value_ids[]` optional existing product option values, `price` required numeric min `0.01`, `stocks[]` optional, `stocks.*.warehouse_id` required existing warehouses, `stocks.*.quantity` required integer min `0`, `images[]` optional jpg/jpeg/png/webp max 50MB.
- SKU is generated as a unique eight-character uppercase alphanumeric string by `ProductItemService`. Frontend must never generate or submit it.
- `BarcodeGeneratorService` generates a Code 128 SVG from the SKU once during creation. The media path is stored in `product_items.barcode` under `barcodes/`.
- Resource fields: `id`, `sku`, `barcode` (resolved media URL), `is_active`, `product_id`, optional `product`, `merchant_id`, optional `merchant`, optional `option_values`, optional `images`, `total_stock`, optional `stocks`, `current_price`, optional `prices`, optional `creator`, `created_at`.
- Relations: belongs to product/merchant/creator, has many images/stocks/prices, belongs to many option values, belongs to many orders through order items.
- Create/update behavior: option values sync; price creates a new active `ItemPrice` when different; stocks overwrite absolute quantity per warehouse; images append new `ItemImage` records.
- Index supports search by SKU, barcode, translated product name, translated option name, and translated option value name, plus product, merchant, category, brand, option, warehouse, active, trashed, date, and sorting filters.
- UX decision: product items should be managed as product variants/items inside Product detail/edit, with a dedicated product-items CRUD route available. Product update cannot update items, and bulk create has no bulk update equivalent.

### Customers

- Endpoints: `GET/POST /api/customers`, `GET/PUT/PATCH /api/customers/{customer}`, `DELETE /api/customers/delete`, `POST /api/customers/restore`, `DELETE /api/customers/force-delete`, `PUT /api/customers/toggle-active`.
- Middleware: `create-customer` on store, `update-customer` on update. Delete/restore/force/toggle authorize through `CustomerPolicy`.
- Policy permissions include `view-customer`, `view-all-customer`, `view-own-customer`, `create-customer`, `update-customer`, `delete-customer`, `restore-customer`, `force-delete-customer`, `toggle-active-customer`.
- Request fields: `name` required string max 191, `phone_code_id` optional existing countries, `phone` optional string max 191, `email` optional email unique. `prepareForValidation()` also accepts nested `phone.phone_code_id` and `phone.phone`.
- `is_active` exists in DB/model but is not accepted by `CustomerRequest`; change it only via toggle endpoint.
- Resource fields: `id`, `name`, `phone_code_id`, optional `phone_code`, `phone`, `email`, `is_active`, optional `creator`, `created_at`.
- Relations: belongs to country phoneCode, belongs to creator, has many orders.
- Index search/filter/sort behavior is defined in **CRUD Index Search And Filter Contracts** above.
- Select dependencies: countries from `/api/countries?per_page=-1` for phone code.

### Merchants

- Endpoints: `GET/POST /api/merchants`, `GET/PUT/PATCH /api/merchants/{merchant}`, `DELETE /api/merchants/delete`, `POST /api/merchants/restore`, `DELETE /api/merchants/force-delete`, `PUT /api/merchants/toggle-active`.
- Request fields: `name` required string max 191, `email` optional nullable email max 191 unique across merchants including soft-deleted rows, `phone` optional nullable string max 191, `is_active` optional boolean.
- Resource fields: `id`, `name`, `email`, `phone`, `is_active`, optional `creator`, `created_at`, `updated_at`. Product items are not included in the merchant resource.
- Filters: `search` across name/email/phone, `name`, exact `email`, `phone`, `created_by`, `has_product_items`, active/trashed/date filters, pagination, and allowlisted sorting.
- Exact permissions: `read-merchant`, `view-all-merchant`, `view-own-merchant`, `create-merchant`, `update-merchant`, `delete-merchant`, `restore-merchant`, `force-delete-merchant`, `toggle-active-merchant`.
- Index/show require `read-merchant` plus ownership through `view-own-merchant` or global access through `view-all-merchant`. Mutations also require the matching operation permission and ownership/global access.

### Warehouses

- Endpoints: `GET/POST /api/warehouses`, `GET/PUT/PATCH /api/warehouses/{warehouse}`, `DELETE /api/warehouses/delete`, `POST /api/warehouses/restore`, `DELETE /api/warehouses/force-delete`, `PUT /api/warehouses/toggle-active`.
- Middleware: `create-warehouse` on store, `update-warehouse` on update. Delete/restore/force/toggle authorize through `WarehousePolicy`.
- Policy permissions include `view-warehouse`, `view-all-warehouse`, `view-own-warehouse`, `create-warehouse`, `update-warehouse`, `delete-warehouse`, `restore-warehouse`, `force-delete-warehouse`, `toggle-active-warehouse`.
- Request fields: required `branch_id` referencing an active, non-deleted branch; `name` required translatable array, `description` optional nullable array, `address` optional nullable string max 191, `is_active` optional boolean. The same request is used for create and update, so `branch_id` and `name` remain required on update.
- Resource fields: `id`, `branch_id`, `name`, `translation_name`, `description`, `translation_description`, `address`, `is_active`, `is_current`, optional `branch`, optional `stocks`, optional `creator`, `created_at`.
- `is_current` means the related branch has `is_current=true`; it is not a warehouse-level selection field. Warehouse CRUD controller responses eager-load `branch`, so this value is accurate there.
- Relations: belongs to branch/creator and has many stocks.
- Index search/filter/sort behavior is defined in **CRUD Index Search And Filter Contracts** above.
- Force-deleting a warehouse can cascade-delete stock rows due to DB FK cascade.

### Branches

- Endpoints: `GET/POST /api/branches`, `GET/PUT/PATCH /api/branches/{branch}`, `PATCH /api/branches/{branch}/status`, `PATCH /api/branches/{branch}/set-current`, `DELETE /api/branches/delete`, `POST /api/branches/restore`, `DELETE /api/branches/force-delete`.
- Exact permissions: `read-branch`, `create-branch`, `update-branch`, `delete-branch`, `restore-branch`, `force-delete-branch`, `toggle-active-branch`, `set-current-branch`.
- Create fields: required translated `name` with Arabic required and optional English; optional nullable `address`; optional boolean `is_active`; optional boolean `is_current`.
- Update accepts the same fields as optional partial values. `PATCH /status` requires `{ is_active: boolean }`. `PATCH /set-current` has no request body.
- Resource fields: `id`, localized `name`, `translation_name`, `address`, `is_current`, `is_active`, optional `creator`, `created_at`.
- Index supports `search`, `name`, `address`, `is_current`, `is_active`, `created_by`, trashed/date filters, pagination, and allowlisted sorting.
- Current branch is one global database flag, not a per-user or per-session preference. Setting a branch current unsets all other branches transactionally. An inactive branch cannot be current; deactivating the current branch clears current state.
- There is no dedicated current-branch GET endpoint and login/profile resources do not include branch context. Query `GET /api/branches?is_current=true` or the cached active branch list after authentication.
- Current branches and branches with any warehouses, including soft-deleted warehouses, cannot be deleted.

### Stocks

- Endpoints: `GET/POST /api/stocks`, `GET/PUT/PATCH /api/stocks/{stock}`, `POST /api/stocks/transfer`, `DELETE /api/stocks/delete`, `POST /api/stocks/restore`, `PUT /api/stocks/toggle-active`.
- Quick Sale synchronization: `GET /api/stocks/sync` requires authentication and `create-order`. Optional query `product_item_ids[]` accepts up to 100 distinct active Product Item IDs. The response uses the standard envelope and returns `ProductItemResource[]` with product details and current stock rows, including warehouse and branch metadata, restricted to active warehouses accessible through the existing warehouse ownership/view permissions.
- Create/update permission middleware is commented out in `StockController`; currently auth-only for index/show/store/update.
- No `StockPolicy` is registered/found.
- Request fields: `warehouse_id` required existing warehouses, `item_id` required existing product items, `quantity` required integer min 0.
- Store behavior is upsert by `(warehouse_id, item_id)` and sets absolute quantity. It is not a movement/increment.
- Update validates `warehouse_id` and `item_id`, but only updates `quantity`; warehouse/item changes are ignored.
- Resource fields: `id`, `warehouse_id`, optional `warehouse`, `item_id`, optional `item`, `quantity`, `created_at`.
- DB unique key: `warehouse_id + item_id`.
- Index filters include search, warehouse/item IDs, quantity ranges, `in_stock`, product/category/brand, dates, pagination, and sorting.
- Unsupported/broken actions: hide stock delete/restore/toggle in frontend for now. `DELETE /api/stocks/delete` route lacks a `{stock}` parameter for `destroy(Stock $stock)`, `restore` is invalid because Stock has no SoftDeletes, and toggle is invalid because Stock has no `is_active` column.
- Stock UI must label quantity changes as setting/overwriting quantity, not adding stock. For item details, fetch product item/product separately because stock index does not expose item relation.
- Transfer payload: `{ from_warehouse_id, to_warehouse_id, product_item_id, quantity, notes? }`. Warehouses must differ and be active/non-deleted, item must be active/non-deleted, quantity must be a positive integer, and source/destination stock rows must already exist.
- Transfer requires exact permission `transfer-stock`. The transaction locks warehouses, item, and both stock rows; decrements source, increments destination, and creates `stock_transfers` audit data atomically.
- Successful transfer returns `StockTransferResource`, including `id`, `reference_number`, warehouse aliases, creator, item summaries, item snapshots, and transient top-level `source_quantity` and `destination_quantity`.
- Transfer logs are read through `GET /api/stock-transfer-logs` and `GET /api/stock-transfer-logs/{stock_transfer_log}` with exact permission `read-stock-transfer`. There are no create/update/delete/reversal log endpoints.
- Log index filters: `search`, `reference_number`, `from_warehouse_id`/`source_warehouse_id`, `to_warehouse_id`/`destination_warehouse_id`, `warehouse_id`, `product_item_id`, `created_by`, `from_date`, `to_date`, `created_from`, and `created_to`. Dates use `YYYY-MM-DD`.
- Log sorting uses `sort_column`/`sort_direction`; allowed columns are `id`, timestamps, `reference_number`, source/destination IDs, `created_by`, and `transferred_at`. Default is `id desc`.
- Log list responses include `items_count` and `total_quantity` but return `items: []`. Show responses include item-level `quantity`, `source_quantity_before/after`, and `destination_quantity_before/after` historical snapshots.

### Product Options And Values

- Product option endpoints: `GET/POST /api/product-options`, `GET/PUT/PATCH /api/product-options/{product_option}`, `DELETE /api/product-options/delete`, `POST /api/product-options/restore`, `DELETE /api/product-options/force-delete`, `PUT /api/product-options/toggle-active`.
- Product option create payload: `name` required translation map with required Arabic and optional English, optional translation-map `description`, optional boolean `is_active`, and required nonempty `values[]`.
- Nested value create fields: `name` translation map with required Arabic and optional English, optional translation-map `description`, optional boolean `is_active`; `id` and `product_option_id` are prohibited on option create.
- Product option update uses full replacement semantics for active values. `values` remains required and nonempty. Existing entries must include an `id` belonging to that option; new entries omit `id`; omitted existing values are soft-deleted unless attached to a product item, in which case the complete transaction fails with a `422 values` error.
- Duplicate translated value signatures inside one option request fail validation at `values.{index}.name`.
- Product option resource: `id`, localized `name`, `translation_name`, localized `description`, `translation_description`, `is_active`, loaded `values`, optional `creator`, and `created_at`.
- Product option filters: `search`, `created_by`, `has_values`, active/trashed/date filters, pagination, and sorting. Allowed option sorts include `id`, timestamps, `name`, `name.ar`, `name.en`, `is_active`, `created_by`, and `deleted_at`.
- Standalone value endpoints use `/api/option-values` with the same CRUD lifecycle. Create/update payload is `name`, optional `description`, required `product_option_id`, and optional `is_active`.
- Standalone value creation is the supported quick-add-value contract. It persists a value before the frontend associates its ID with a product item.
- Product items associate values with `option_value_ids: number[]`; create syncs a nonempty array and update syncs whenever the key is present, including clearing with an empty array. SKU remains prohibited.
- Exact generated permissions use `product-option` and `product-option-value`, including `create-*`, `read-*`, `update-*`, `delete-*`, `view-all-*`, `view-own-*`, `restore-*`, `force-delete-*`, and `toggle-active-*`.
- Current authorization caveat: product option/value index and show do not enforce read/view policies, while store/update enforce create/update middleware and lifecycle actions invoke policies. Nested option creation manages nested values under the product-option permission and does not require separate value permissions.

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
- Index search/filter/sort and owner-scope behavior is defined in **CRUD Index Search And Filter Contracts** above.
- Order resource: `id`, `invoice_no`, `total`, `paid_amount`, `remaining_amount`, `status`, `payment_method`, `payment_status`, `stock_restored_at`, optional `customer`, `items`, `installments`, `logs`, `creator`, `created_at`, `updated_at`.
- `OrderResource` now has contexts. List/index uses summary fields only and does not include items/installments/logs/buttons. Show/create/update/status responses use `details` and additionally return `buttons`, `stock_restored_at`, `items`, `installments`, and `logs`.
- Detailed `buttons` are generated by the current status strategy then filtered through `OrderPolicy::changeStatus`; frontend status actions must come from this array rather than duplicate a transition matrix.
- For every detailed action button, display the backend-provided `label` and submit its `key` as the `status` value. Do not replace the backend label with a frontend translation.
- Order item resource: `id`, `order_id`, `item_id`, `warehouse_id`, `price`, `quantity`, `subtotal`, optional `product_item`, optional `warehouse`, `created_at`. An order-line identity is `order_id + item_id + warehouse_id`, so one item may be sold from multiple warehouses as separate rows.
- Direct create/update/add-item requests accept optional `items.*.price`. The validated range is `0..99999999.99` with at most two decimal places. Supplying a non-null price requires `override-price-order`; otherwise the backend selects the current effective system price. The value is stored only in `order_items.price`, and subtotal/total are recalculated from it without updating `product_items` or `item_prices`.
- Pending orders can be updated through `PUT/PATCH /api/orders/{order}`. Supplying `items` replaces the line set. Existing stored prices are preserved when `price` is omitted. Explicit price changes are rejected once the order has installments.
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
- Direct create payload is `{ invoice_no, customer_id, payment_method, items: [{ item_id, quantity, warehouse_id, price? }] }`. `warehouse_id` is required and must reference an active, non-deleted warehouse. Duplicate `item_id + warehouse_id` pairs are rejected, while the same item may appear once per warehouse. `price` is sent only for an authorized custom order-item selling price. Client `total` and item `subtotal` are never sent because the backend recalculates them.
- Direct order creation/update verifies that every selected warehouse is accessible to the user. Inside the order transaction, affected stock rows are locked in deterministic warehouse/item order before validation and deduction. A stale quantity returns `422` on the exact `items.N.quantity` key and includes the latest quantity available to that line.
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

### Installment Management

- CRUD endpoints: `GET/POST /api/installments`, `GET/PUT/PATCH/DELETE /api/installments/{installment}`. Show is owner-or-`view-all-order`; create/update/delete additionally require `create-installment`, `update-installment`, or `delete-installment`.
- Create requires `order_id` and `amount`; accepts nullable `due_date`, status `pending|paid|overdue`, and payment method `cash|card|transfer`. `paid_at` is prohibited and is set by the service when a paid installment is created.
- Update is partial, but the service only permits non-paid installments. Moving an installment to another order and setting status to `paid` through update are rejected; use the pay action. Scheduled totals cannot exceed order total.
- Delete only permits non-paid installments. Creating/updating/paying is rejected for cancelled or refunded orders.
- `POST /api/installments/{installment}/pay` requires `update-installment` and exact payload `{ amount, payment_method }`; amount must exactly equal the existing scheduled amount.
- `POST /api/orders/{order}/installments/generate` requires `create-installment` and payload `{ installment_count: 1..120, initial_paid_amount?: >=0, first_due_date: today-or-later, interval_months?: 1..12, payment_method }`. It only works when the order has no installments and the initial payment is less than total.
- `GET /api/orders/{order}/installments` uses order view authorization and supports the same installment filters, sorting, and pagination.
