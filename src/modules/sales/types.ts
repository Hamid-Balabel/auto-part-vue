import type {
  Customer,
  ProductItem,
  Stock,
  Warehouse,
} from '@/modules/inventory/types'
import type { ListQuery } from '@/types/api'

export type OrderStatus =
  'pending' | 'paid' | 'completed' | 'cancelled' | 'refunded'
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
  order?: Order | null
  creator?: { id?: number; name?: string | null; email?: string | null } | null
  created_at?: string | null
  updated_at?: string | null
}

export type InstallmentStatus = Installment['status']

export interface InstallmentListQuery extends Pick<
  ListQuery,
  'page' | 'per_page' | 'sort_column' | 'sort_direction' | 'search'
> {
  order_id?: number
  customer_id?: number
  created_by?: number
  status?: InstallmentStatus
  payment_method?: PaymentMethod
  amount_min?: string
  amount_max?: string
  due_date_from?: string
  due_date_to?: string
  paid_at_from?: string
  paid_at_to?: string
  is_paid?: boolean
  created_from?: string
  created_to?: string
}

export interface InstallmentPayload {
  order_id: number
  amount: number | string
  due_date?: string | null
  status?: InstallmentStatus
  payment_method?: PaymentMethod
}

export type InstallmentUpdatePayload = Partial<InstallmentPayload>

export interface PayInstallmentPayload {
  amount: number | string
  payment_method: PaymentMethod
}

export interface InstallmentPlanPayload {
  installment_count: number
  initial_paid_amount?: number | string
  first_due_date: string
  interval_months?: number
  payment_method: PaymentMethod
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
  buttons?: Array<{
    label: string
    key: Exclude<OrderStatus, 'pending'>
    type: 'action' | 'modal' | string
  }>
}

export interface OrderListQuery extends Pick<
  ListQuery,
  'page' | 'per_page' | 'sort_column' | 'sort_direction' | 'search'
> {
  invoice_no?: string
  customer_id?: number
  status?: OrderStatus
  payment_method?: PaymentMethod
  payment_status?: PaymentStatus
  total_min?: string
  total_max?: string
  paid_amount_min?: string
  paid_amount_max?: string
  remaining_amount_min?: string
  remaining_amount_max?: string
  created_from?: string
  created_to?: string
}

export interface OrderCreateItemPayload {
  item_id: number
  quantity: number
  warehouse_id: number
  price?: string
}

export interface QuickSaleLine {
  lineId: string
  item: ProductItem
  quantity: number
  systemPrice: string
  unitPrice: string
  persistedPrice?: string
  priceDirty: boolean
  warehouseId: number | null
  warehouseStocks: Stock[]
  availableQuantity: number
  reservedWarehouseId?: number | null
  reservedQuantity?: number
  stockChanged: boolean
}

export interface OrderCreatePayload {
  invoice_no: string
  customer_id: number
  payment_method: PaymentMethod
  items: OrderCreateItemPayload[]
}

export type OrderUpdatePayload = Partial<OrderCreatePayload>

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
