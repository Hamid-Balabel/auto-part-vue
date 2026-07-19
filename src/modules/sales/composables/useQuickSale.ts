import { computed, reactive, ref } from 'vue'
import { ApiError } from '@/api/http'
import { listCustomers, listProductItems } from '@/modules/inventory/api'
import type { Customer, ProductItem } from '@/modules/inventory/types'
import { createOrder, createPaidInstallment, getOrder } from '../api'
import type { Order, PaymentMethod, QuickSaleLine, QuickSalePaymentMode } from '../types'

function newInvoiceNumber() {
  return `SALE-${Date.now()}`
}

export function useQuickSale() {
  const loading = ref(true)
  const submitting = ref(false)
  const products = ref<ProductItem[]>([])
  const customers = ref<Customer[]>([])
  const lines = ref<QuickSaleLine[]>([])
  const errors = ref<Record<string, string[]>>({})
  const createdOrder = ref<Order | null>(null)
  const completedOrder = ref<Order | null>(null)
  const form = reactive({
    invoice_no: newInvoiceNumber(),
    customer_id: 0,
    payment_mode: 'cash' as QuickSalePaymentMode,
    partial_payment_method: 'cash' as Exclude<PaymentMethod, 'transfer'>,
    initial_paid_amount: '' as number | string,
  })

  const previewTotal = computed(() => lines.value.reduce((total, line) => total + Number(line.item.current_price ?? 0) * line.quantity, 0))
  const previewPaid = computed(() => form.payment_mode === 'partial' ? Math.max(0, Number(form.initial_paid_amount) || 0) : previewTotal.value)
  const previewRemaining = computed(() => Math.max(0, previewTotal.value - previewPaid.value))

  async function loadDependencies() {
    loading.value = true
    try {
      const [productsResult, customersResult] = await Promise.all([
        listProductItems({ per_page: -1 }),
        listCustomers({ per_page: -1 }),
      ])
      products.value = (Array.isArray(productsResult) ? productsResult : productsResult.data)
        .filter((item) => item.is_active && item.product?.is_active !== false && item.current_price !== null)
      customers.value = (Array.isArray(customersResult) ? customersResult : customersResult.data)
        .filter((customer) => customer.is_active !== false)
    } finally {
      loading.value = false
    }
  }

  function addProduct(item: ProductItem) {
    const existing = lines.value.find((line) => line.item.id === item.id)
    if (existing) existing.quantity += 1
    else lines.value.push({ item, quantity: 1 })
  }

  function updateQuantity(itemId: number, quantity: number) {
    const line = lines.value.find((item) => item.item.id === itemId)
    if (line) line.quantity = Math.max(1, quantity)
  }

  function removeProduct(itemId: number) {
    lines.value = lines.value.filter((line) => line.item.id !== itemId)
  }

  function selectCustomer(customer: Customer) {
    if (!customers.value.some((item) => item.id === customer.id)) customers.value.unshift(customer)
    form.customer_id = customer.id
  }

  function validate(): boolean {
    errors.value = {}
    if (!lines.value.length) errors.value.items = ['required']
    if (!form.customer_id) errors.value.customer_id = ['required']
    if (!form.invoice_no.trim()) errors.value.invoice_no = ['required']
    if (form.payment_mode === 'partial') {
      const paid = Number(form.initial_paid_amount)
      if (!Number.isFinite(paid) || paid <= 0) errors.value.amount = ['positive']
      else if (paid > previewTotal.value) errors.value.amount = ['exceeds']
    }
    return !Object.keys(errors.value).length
  }

  async function submit(): Promise<Order | null> {
    if (!validate() || submitting.value) return null
    submitting.value = true
    errors.value = {}
    createdOrder.value = null

    try {
      const paymentMethod: PaymentMethod = form.payment_mode === 'partial' ? form.partial_payment_method : form.payment_mode
      const order = await createOrder({
        invoice_no: form.invoice_no,
        customer_id: Number(form.customer_id),
        payment_method: paymentMethod,
        items: lines.value.map((line) => ({ item_id: line.item.id, quantity: line.quantity })),
      })
      createdOrder.value = order

      const amount = form.payment_mode === 'partial' ? Number(form.initial_paid_amount) : Number(order.total)
      await createPaidInstallment({ order_id: order.id, amount, status: 'paid', payment_method: paymentMethod })
      completedOrder.value = await getOrder(order.id)
      return completedOrder.value
    } catch (error) {
      if (error instanceof ApiError) errors.value = error.errors ?? {}
      throw error
    } finally {
      submitting.value = false
    }
  }

  function reset() {
    lines.value = []
    errors.value = {}
    createdOrder.value = null
    completedOrder.value = null
    form.invoice_no = newInvoiceNumber()
    form.customer_id = 0
    form.payment_mode = 'cash'
    form.partial_payment_method = 'cash'
    form.initial_paid_amount = ''
  }

  return {
    loading,
    submitting,
    products,
    customers,
    lines,
    errors,
    form,
    createdOrder,
    completedOrder,
    previewTotal,
    previewPaid,
    previewRemaining,
    loadDependencies,
    addProduct,
    updateQuantity,
    removeProduct,
    selectCustomer,
    submit,
    reset,
  }
}
