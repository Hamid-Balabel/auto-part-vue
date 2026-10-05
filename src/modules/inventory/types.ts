import type { TranslationMap } from "@/modules/data-entry/types";
import type { Country } from "@/modules/data-entry/types";
import type { Brand, Category } from "@/modules/data-entry/types";
import type { ListQuery } from "@/types/api";
import type { User } from "@/modules/admin/types";
import type { PaymentMethod } from "@/modules/sales/types";

export interface Merchant {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  is_active: boolean;
  creator?: {
    id?: number | null;
    name?: string | null;
    email?: string | null;
    is_active?: boolean;
    created_at?: string | null;
  } | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface MerchantPayload {
  name: string;
  email?: string | null;
  phone?: string | null;
  is_active: boolean;
}

export interface MerchantListQuery extends ListQuery {
  name?: string;
  email?: string;
  phone?: string;
  created_by?: number;
  has_product_items?: boolean | string;
  is_active?: boolean | number | string;
  trashed?: "with" | "only";
  created_from?: string;
  created_to?: string;
}

export type PartyClassification = "customer" | "supplier";

export interface Party {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  is_active: boolean;
  classifications: PartyClassification[];
  creator?: {
    id?: number | null;
    name?: string | null;
    email?: string | null;
    is_active?: boolean;
    created_at?: string | null;
  } | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
}

export interface PartyPayload {
  name: string;
  phone?: string | null;
  email?: string | null;
  is_active: boolean;
  classifications: PartyClassification[];
}

export interface PartyListQuery extends ListQuery {
  name?: string;
  email?: string;
  phone?: string;
  classification?: PartyClassification | "";
  is_active?: boolean | number | string;
  trashed?: "with" | "only";
  created_from?: string;
  created_to?: string;
}

export interface CustomerListQuery extends ListQuery {
  name?: string;
  email?: string;
  phone?: string;
  phone_code_id?: number;
  has_orders?: boolean | string;
  is_active?: boolean | number | string;
  trashed?: "with" | "only";
  created_from?: string;
  created_to?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone_code_id?: number | null;
  phone_code?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean;
  created_at?: string | null;
}

export interface CustomerPayload {
  name: string;
  phone_code_id?: number | string | null;
  phone?: string | null;
  email?: string | null;
}

export interface Branch {
  id: number;
  name: string | null;
  translation_name: TranslationMap;
  address?: string | null;
  is_current: boolean;
  is_active: boolean;
  creator?: {
    id?: number | null;
    name?: string | null;
    email?: string | null;
    is_active?: boolean;
    created_at?: string | null;
  } | null;
  created_at?: string | null;
}

export interface BranchPayload {
  name: TranslationMap;
  address?: string | null;
  is_current?: boolean;
  is_active?: boolean;
}

export interface BranchListQuery extends ListQuery {
  name?: string;
  address?: string;
  is_current?: boolean | string;
  is_active?: boolean | number | string;
  created_by?: number;
  trashed?: "with" | "only";
  created_from?: string;
  created_to?: string;
}

export interface Warehouse {
  id: number;
  branch_id: number;
  branch?: Branch | null;
  name: string | null;
  translation_name: TranslationMap;
  description?: string | null;
  translation_description?: TranslationMap;
  address?: string | null;
  is_active?: boolean;
  is_current?: boolean;
  stocks?: Stock[];
  creator?: {
    id?: number | null;
    name?: string | null;
    email?: string | null;
    is_active?: boolean;
    created_at?: string | null;
  } | null;
  created_at?: string | null;
}

export interface WarehousePayload {
  branch_id: number | null;
  name: TranslationMap;
  description: TranslationMap;
  address?: string | null;
  is_active: boolean;
}

export interface WarehouseListQuery extends ListQuery {
  branch_id?: number;
  address?: string;
  created_by?: number;
  has_stock?: boolean | string;
  item_id?: number;
  is_active?: boolean | number | string;
  trashed?: "with" | "only";
  created_from?: string;
  created_to?: string;
}

export interface Stock {
  id: number;
  warehouse_id: number;
  warehouse?: Warehouse | null;
  item_id: number;
  item?: ProductItem | null;
  quantity: number;
  created_at?: string | null;
}

export interface ProductItemOption {
  id: number;
  sku: string;
  barcode?: string | null;
  product_id: number;
  product?: Product | null;
  current_price?: number | string | null;
  max_discount?: number | string | null;
  effective_max_discount?: number | string | null;
  total_stock?: number;
}

export interface Product {
  id: number;
  name: string | null;
  translation_name: TranslationMap;
  description?: string | null;
  translation_description?: TranslationMap;
  is_active?: boolean;
  category_id?: number | null;
  brand_id?: number | null;
  category?: Category | null;
  brand?: Brand | null;
  product_items?: ProductItem[];
  creator?: {
    id?: number | null;
    name?: string | null;
    email?: string | null;
    is_active?: boolean;
    created_at?: string | null;
  } | null;
  created_at?: string | null;
}

export interface ProductPayload {
  name: TranslationMap;
  description: TranslationMap;
  category_id: number | null;
  brand_id: number | null;
  is_active: boolean;
}

export interface ProductListQuery extends ListQuery {
  category_id?: number;
  brand_id?: number;
  has_items?: boolean | string;
  sku?: string;
  barcode?: string;
  is_active?: boolean | number | string;
  trashed?: "with" | "only";
  created_from?: string;
  created_to?: string;
}

export interface ProductOption {
  id: number;
  name?: string | null;
  translation_name?: TranslationMap;
  description?: string | null;
  translation_description?: TranslationMap;
  is_active?: boolean;
  values?: ProductOptionValue[];
  creator?: {
    id?: number | null;
    name?: string | null;
    email?: string | null;
  } | null;
  created_at?: string | null;
}

export interface ProductOptionValue {
  id: number;
  name: string | null;
  translation_name?: TranslationMap;
  product_option_id?: number;
  product_option?: ProductOption | null;
  productOption?: ProductOption | null;
  description?: string | null;
  translation_description?: TranslationMap;
  is_active?: boolean;
  creator?: {
    id?: number | null;
    name?: string | null;
    email?: string | null;
  } | null;
  created_at?: string | null;
}

export interface ProductOptionValuePayload {
  id?: number;
  name: TranslationMap;
  description: TranslationMap;
  is_active: boolean;
}

export interface ProductOptionPayload {
  name: TranslationMap;
  description: TranslationMap;
  is_active: boolean;
  values: ProductOptionValuePayload[];
}

export interface ProductOptionListQuery extends ListQuery {
  created_by?: number;
  has_values?: boolean | string;
  is_active?: boolean | number | string;
  trashed?: "with" | "only";
  created_from?: string;
  created_to?: string;
}

export interface StandaloneOptionValuePayload {
  name: TranslationMap;
  description: TranslationMap;
  product_option_id: number;
  is_active: boolean;
}

export interface ProductItem {
  id: number;
  sku: string;
  movement_code: string;
  barcode?: string | null;
  is_active?: boolean;
  product_id: number;
  product?: Product | null;
  merchant_id?: number | null;
  merchant?: Merchant | null;
  option_values?: ProductOptionValue[];
  optionValues?: ProductOptionValue[];
  images?: Array<{ id: number; name?: string | null; path?: string | null }>;
  total_stock?: number;
  stocks?: Stock[];
  current_price?: number | string | null;
  max_discount?: number | string | null;
  effective_max_discount?: number | string | null;
  prices?: Array<{
    id: number;
    price?: number | string | null;
    valid_from?: string | null;
    valid_to?: string | null;
    is_active?: boolean;
    created_at?: string | null;
  }>;
  creator?: {
    id?: number | null;
    name?: string | null;
    email?: string | null;
    is_active?: boolean;
    created_at?: string | null;
  } | null;
  created_at?: string | null;
}

export interface ProductItemListQuery extends ListQuery {
  sku?: string;
  movement_code?: string;
  barcode?: string;
  product_id?: number;
  category_id?: number;
  brand_id?: number;
  warehouse_id?: number;
  is_active?: boolean | number | string;
  trashed?: "with" | "only";
  created_from?: string;
  created_to?: string;
}

export interface ProductItemPayload {
  product_id: number | null;
  movement_code: string;
  is_active: boolean;
  option_value_ids?: number[];
  price: number | string;
  max_discount?: number | string | null;
  images?: File[];
}

export interface ProductWithItemsPayload extends ProductPayload {
  items: Array<{
    movement_code: string;
    price: number | string;
    max_discount?: number | string | null;
    option_value_ids: number[];
    images: File[];
  }>;
}

export interface ProductItemBatch {
  id: number;
  product_item_id: number;
  product_item?: ProductItem | null;
  warehouse_id?: number | null;
  merchant_id: number | null;
  merchant?: Merchant | null;
  supplier_party_id?: number | null;
  supplier_party?: Party | null;
  purchase_id?: number | null;
  purchase?: import('@/modules/sales/types').Purchase | null;
  purchase_price: string | null;
  original_quantity?: number;
  remaining_quantity?: number;
  total_original_quantity: number;
  total_remaining_quantity: number;
  purchased_at?: string | null;
  is_legacy_unknown?: boolean;
  warehouse_stocks?: ProductItemBatchStock[];
}

export interface ProductItemBatchStock {
  id?: number | null;
  warehouse_id: number;
  original_quantity: number;
  remaining_quantity: number;
}

export interface PurchaseStockPayload {
  product_item_id: number;
  warehouse_id: number;
  supplier_party_id: number;
  quantity: number | string;
  purchase_price: number | string;
  purchased_at?: string | null;
  payment_method?: PaymentMethod;
  settlement_mode?: PurchaseSettlementMode;
}

export type PurchaseSettlementMode = "paid" | "plan" | "unpaid";

export interface PurchaseBulkStockLinePayload {
  warehouse_id: number;
  quantity: number;
}

export interface PurchaseBulkStockPayload {
  product_item_id: number;
  supplier_party_id: number;
  purchase_price: number | string;
  purchased_at?: string | null;
  payment_method?: PaymentMethod;
  settlement_mode?: PurchaseSettlementMode;
  warehouses: PurchaseBulkStockLinePayload[];
}

export interface StockListQuery extends ListQuery {
  warehouse_id?: number;
  item_id?: number;
  quantity_min?: number;
  quantity_max?: number;
  in_stock?: boolean | string;
  product_id?: number;
  category_id?: number;
  brand_id?: number;
  created_from?: string;
  created_to?: string;
}

export interface StockTransferPayload {
  from_warehouse_id: number | null;
  to_warehouse_id: number | null;
  product_item_id: number | null;
  quantity: number | string;
  notes?: string | null;
  batches?: StockTransferBatchPayload[];
}

export interface StockTransferBatchPayload {
  batch_id: number;
  quantity: number;
}

export interface StockTransfer {
  id: number;
  reference_number?: string | null;
  product_item_id: number;
  product_item?: ProductItem | null;
  from_warehouse_id: number;
  from_warehouse?: Warehouse | null;
  source_warehouse_id?: number;
  source_warehouse?: Warehouse | null;
  to_warehouse_id: number;
  to_warehouse?: Warehouse | null;
  destination_warehouse_id?: number;
  destination_warehouse?: Warehouse | null;
  quantity: number;
  source_quantity: number | null;
  destination_quantity: number | null;
  items_count?: number;
  total_quantity?: number;
  items?: StockTransferItem[];
  notes?: string | null;
  creator?: User | null;
  transferred_at?: string | null;
  created_at?: string | null;
}

export interface StockTransferItem {
  id: number;
  product_item_id: number;
  product_item?: ProductItem | null;
  quantity: number;
  source_quantity_before: number;
  source_quantity_after: number;
  destination_quantity_before: number;
  destination_quantity_after: number;
  batch_allocations?: StockTransferBatchAllocation[];
  batchAllocations?: StockTransferBatchAllocation[];
}

export interface StockTransferCompactBatch {
  id: number;
  merchant_id?: number | null;
  purchase_price: string | null;
  purchased_at?: string | null;
  is_legacy_unknown?: boolean;
}

export interface StockTransferBatchAllocation {
  id: number;
  batch_id?: number | null;
  source_batch_id: number | null;
  destination_batch_id: number | null;
  quantity: number;
  purchase_price: string | null;
  batch?: StockTransferCompactBatch | null;
  product_item_batch?: StockTransferCompactBatch | null;
  productItemBatch?: StockTransferCompactBatch | null;
  source_batch?: StockTransferCompactBatch | null;
  destination_batch?: StockTransferCompactBatch | null;
  sourceBatch?: StockTransferCompactBatch | null;
  destinationBatch?: StockTransferCompactBatch | null;
}

export interface StockTransferLogListQuery extends ListQuery {
  reference_number?: string;
  from_warehouse_id?: number;
  source_warehouse_id?: number;
  to_warehouse_id?: number;
  destination_warehouse_id?: number;
  warehouse_id?: number;
  product_item_id?: number;
  created_by?: number;
  from_date?: string;
  to_date?: string;
  created_from?: string;
  created_to?: string;
}

export type { Country };
export type { Brand, Category };
