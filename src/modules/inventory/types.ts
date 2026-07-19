import type { TranslationMap } from '@/modules/data-entry/types'
import type { Country } from '@/modules/data-entry/types'
import type { Brand, Category } from '@/modules/data-entry/types'

export interface Customer {
  id: number
  name: string
  phone_code_id?: number | null
  phone_code?: string | null
  phone?: string | null
  email?: string | null
  is_active?: boolean
  created_at?: string | null
}

export interface CustomerPayload {
  name: string
  phone_code_id?: number | string | null
  phone?: string | null
  email?: string | null
}

export interface Warehouse {
  id: number
  name: string | null
  translation_name: TranslationMap
  description?: string | null
  translation_description?: TranslationMap
  address?: string | null
  is_active?: boolean
  created_at?: string | null
}

export interface WarehousePayload {
  name: TranslationMap
  description: TranslationMap
  address?: string | null
  is_active: boolean
}

export interface Stock {
  id: number
  warehouse_id: number
  warehouse?: Warehouse | null
  item_id: number
  item?: ProductItem | null
  quantity: number
  created_at?: string | null
}

export interface ProductItemOption {
  id: number
  sku: string
  barcode?: string | null
  product_id: number
  product?: Product | null
  current_price?: number | string | null
  total_stock?: number
}

export interface Product {
  id: number
  name: string | null
  translation_name: TranslationMap
  description?: string | null
  translation_description?: TranslationMap
  is_active?: boolean
  category_id?: number | null
  brand_id?: number | null
  category?: Category | null
  brand?: Brand | null
  product_items?: ProductItem[]
  creator?: { id?: number | null; name?: string | null; email?: string | null; is_active?: boolean; created_at?: string | null } | null
  created_at?: string | null
}

export interface ProductPayload {
  name: TranslationMap
  description: TranslationMap
  category_id: number | null
  brand_id: number | null
  is_active: boolean
}

export interface ProductOption {
  id: number
  name?: string | null
  translation_name?: TranslationMap
}

export interface ProductOptionValue {
  id: number
  name: string | null
  translation_name?: TranslationMap
  product_option_id?: number
  product_option?: ProductOption | null
  productOption?: ProductOption | null
}

export interface ProductItem {
  id: number
  sku: string
  barcode?: string | null
  is_active?: boolean
  product_id: number
  product?: Product | null
  option_values?: ProductOptionValue[]
  optionValues?: ProductOptionValue[]
  images?: Array<{ id: number; name?: string | null; path?: string | null }>
  total_stock?: number
  stocks?: Stock[]
  current_price?: number | string | null
  prices?: Array<{ id: number; price?: number | string | null; valid_from?: string | null; valid_to?: string | null; is_active?: boolean; created_at?: string | null }>
  creator?: { id?: number | null; name?: string | null; email?: string | null; is_active?: boolean; created_at?: string | null } | null
  created_at?: string | null
}

export interface ProductItemPayload {
  sku: string
  barcode: string
  product_id: number | null
  is_active: boolean
  option_value_ids?: number[]
  price: number | string
  stocks?: Array<{ warehouse_id: number | string; quantity: number | string }>
  images?: File[]
}

export interface ProductWithItemsPayload extends ProductPayload {
  items: Array<{
    sku: string
    barcode: string
    price: number | string
    option_value_ids: number[]
    stocks: Array<{ warehouse_id: number | string; quantity: number | string }>
    images: File[]
  }>
}

export interface StockPayload {
  warehouse_id: number | string
  item_id: number | string
  quantity: number | string
}

export type { Country }
export type { Brand, Category }
