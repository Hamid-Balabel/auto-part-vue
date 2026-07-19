import type { Customer, ProductItem, Warehouse } from '@/modules/inventory/types'
import type { ListQuery } from '@/types/api'

export type OrderStatus = 'pending' | 'paid' | 'completed' | 'cancelled' | 'refunded'
export type PaymentStatus = 'pending' | 'partial' | 'paid'
export type PaymentMethod = 'cash' | 'card' | 'transfer'
export type QuickSalePaymentMode = 'cash' | 'card' | 'partial'

export interface CartLine {
  id: number
  user_id: number
  item_id: number
  item?: ProductItem | null
  quantity: number
  price: number | string
  line_total: number | string
  created_at?: string | null
}

export interface CartSummary {
  count: number
  total: number | string
}

export interface CartPayload {
  item_id: number
  quantity: number
}

export interface CheckoutPayload {
  invoice_no: string
  customer_id: number
  payment_method?: PaymentMethod
}

export interface OrderItem {
  id: number
  order_id: number
  item_id: number
  warehouse_id?: number | null
  price: number | string
  quantity: number
  subtotal: number | string
  product_item?: ProductItem | null
  warehouse?: Warehouse | null
  created_at?: string | null
}

export interface Installment {
  id: number
  order_id: number
  amount: number | string
  due_date?: string | null
  paid_at?: string | null
  status: 'pending' | 'paid' | 'overdue'
  payment_method: PaymentMethod
  creator?: { id?: number; name?: string | null; email?: string | null } | null
  created_at?: string | null
  updated_at?: string | null
}

export interface OrderLog {
  id: number
  order_id: number
  notes?: string | null
  message?: string | null
  action: string
  old_status?: OrderStatus | null
  new_status?: OrderStatus | null
  old_payment_status?: PaymentStatus | null
  new_payment_status?: PaymentStatus | null
  metadata?: Record<string, unknown> | null
  creator?: { id?: number; name?: string | null; email?: string | null } | null
  created_at?: string | null
  updated_at?: string | null
}

export interface Order {
  id: number
  invoice_no: string
  total: number | string
  paid_amount: number | string
  remaining_amount: number | string
  status: OrderStatus
  display_status?: string
  payment_method: PaymentMethod
  display_payment_method?: string
  payment_status: PaymentStatus
  display_payment_status?: string
  stock_restored_at?: string | null
  customer_id: number
  customer?: Customer | null
  items?: OrderItem[]
  installments?: Installment[]
  logs?: OrderLog[]
  creator?: { id?: number; name?: string | null; email?: string | null } | null
  created_at?: string | null
  updated_at?: string | null
  buttons?: Array<{ label: string; key: Exclude<OrderStatus, 'pending'>; type: 'action' | 'modal' | string }>
}

export interface OrderListQuery extends Pick<ListQuery, 'page' | 'per_page' | 'sort_column' | 'sort_direction'> {}

export interface OrderCreateItemPayload {
  item_id: number
  quantity: number
  warehouse_id?: number | null
}

export interface QuickSaleLine {
  item: ProductItem
  quantity: number
}

export interface OrderCreatePayload {
  invoice_no: string
  customer_id: number
  payment_method: PaymentMethod
  items: OrderCreateItemPayload[]
}

export interface PaidInstallmentPayload {
  order_id: number
  amount: number | string
  status: 'paid'
  payment_method: PaymentMethod
}

export interface OrderStatusPayload {
  status: Exclude<OrderStatus, 'pending'>
  notes?: string | null
}
