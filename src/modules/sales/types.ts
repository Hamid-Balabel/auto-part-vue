import type {
  Customer,
  Party,
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
  party_id: number
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
  discount?: number | string
  line_total?: number | string
  total?: number | string
  product_item?: ProductItem | null
  warehouse?: Warehouse | null
  created_at?: string | null
}

export interface Installment {
  id: number
  order_id?: number | null
  purchase_id?: number | null
  source_type?: 'order' | 'purchase' | string | null
  source_id?: number | null
  source?: Order | Purchase | null
  party?: Party | null
  direction?: 'receivable' | 'payable' | string | null
  amount: number | string
  settled_amount?: number | string
  remaining_amount?: number | string
  due_date?: string | null
  paid_at?: string | null
  status: 'pending' | 'paid' | 'overdue' | 'partial'
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
  purchase_id?: number
  source_type?: string
  source_id?: number
  party_id?: number
  direction?: string
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
  source_type: 'order' | 'purchase'
  source_id: number
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
  customer_id: number | null
  party_id?: number | null
  customer?: Customer | null
  party?: Party | null
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
  party_id?: number
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
  discount: string
}

export interface QuickSaleLine {
  lineId: string
  item: ProductItem
  quantity: number
  systemPrice: string
  unitPrice: string
  discount: string
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
  party_id: number
  payment_method: PaymentMethod
  items: OrderCreateItemPayload[]
}

export type OrderUpdatePayload = Partial<OrderCreatePayload>

export interface PaidInstallmentPayload {
  source_type: 'order' | 'purchase'
  source_id: number
  amount: number | string
  status: 'paid'
  payment_method: PaymentMethod
}

export interface OrderStatusPayload {
  status: Exclude<OrderStatus, 'pending'>
  notes?: string | null
}

export interface Purchase {
  id: number
  invoice_no?: string | null
  party_id?: number | null
  supplier_party_id?: number | null
  supplier_party?: Party | null
  party?: Party | null
  total?: number | string | null
  paid_amount?: number | string | null
  remaining_amount?: number | string | null
  payment_status?: PaymentStatus | string | null
  payment_method?: PaymentMethod | string | null
  purchased_at?: string | null
  batches?: import('@/modules/inventory/types').ProductItemBatch[]
  installments?: Installment[]
  summary?: Record<string, unknown>
  details?: Record<string, unknown>
  created_at?: string | null
  updated_at?: string | null
}

export interface PurchaseListQuery extends Pick<ListQuery, 'page' | 'per_page' | 'sort_column' | 'sort_direction' | 'search'> {
  party_id?: number
  payment_status?: string
  created_from?: string
  created_to?: string
}

export interface InstallmentOffset {
  id: number
  receivable_installment_id: number
  payable_installment_id: number
  receivable_installment?: Installment | null
  payable_installment?: Installment | null
  party?: Party | null
  amount: number | string
  effective_due_date?: string | null
  reversed_at?: string | null
  created_at?: string | null
}

export interface InstallmentOffsetListQuery extends Pick<ListQuery, 'page' | 'per_page' | 'sort_column' | 'sort_direction' | 'search'> {
  party_id?: number
  is_reversed?: boolean | string
}
