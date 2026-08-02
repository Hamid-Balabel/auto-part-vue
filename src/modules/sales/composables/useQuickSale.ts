import { computed, reactive, ref, watch } from 'vue'
import { ApiError } from '@/api/http'
import {
  getProduct,
  listCustomers,
  listProductItems,
  listProducts,
  listWarehouses,
} from '@/modules/inventory/api'
import type {
  Customer,
  Product,
  ProductItem,
  Stock,
  Warehouse,
} from '@/modules/inventory/types'
import { useAuthStore } from '@/stores/auth'
import {
  createOrder,
  createPaidInstallment,
  getOrder,
  updateOrder,
} from '../api'
import type {
  Order,
  OrderCreateItemPayload,
  PaymentMethod,
  QuickSaleLine,
  QuickSalePaymentMode,
} from '../types'

function newInvoiceNumber() {
  return `SALE-${Date.now()}`
}

function moneyString(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00'
}

function toCents(value: number | string) {
  const match = String(value)
    .trim()
    .match(/^(\d+)(?:\.(\d{1,2}))?$/)
  if (!match) return null
  return Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'))
}

function sameMoney(left: number | string, right: number | string) {
  return toCents(left) === toCents(right)
}

export function useQuickSale(
  orderId: number | null,
  canOverridePrice: boolean,
) {
  const auth = useAuthStore()
  const loading = ref(true)
  const productsLoading = ref(false)
  const itemsLoading = ref(false)
  const submitting = ref(false)
  const products = ref<Product[]>([])
  const productPage = ref(1)
  const productLastPage = ref(1)
  const productSearch = ref('')
  const selectedProduct = ref<Product | null>(null)
  const selectedItems = ref<ProductItem[]>([])
  const warehouses = ref<Warehouse[]>([])
  const customers = ref<Customer[]>([])
  const lines = ref<QuickSaleLine[]>([])
  const errors = ref<Record<string, string[]>>({})
  const originalOrder = ref<Order | null>(null)
  const createdOrder = ref<Order | null>(null)
  const completedOrder = ref<Order | null>(null)
  let productRequest = 0
  let itemRequest = 0
  let lineSequence = 0
  let warehousesLoaded = false
  let searchTimer: ReturnType<typeof setTimeout> | undefined

  const form = reactive({
    invoice_no: newInvoiceNumber(),
    customer_id: 0,
    payment_mode: 'cash' as QuickSalePaymentMode,
    partial_payment_method: 'cash' as Exclude<PaymentMethod, 'transfer'>,
    initial_paid_amount: '' as number | string,
  })

  const previewTotalCents = computed(() =>
    lines.value.reduce(
      (total, line) => total + (toCents(line.unitPrice) ?? 0) * line.quantity,
      0,
    ),
  )
  const previewTotal = computed(() => previewTotalCents.value / 100)
  const previewPaid = computed(() =>
    form.payment_mode === 'partial'
      ? Math.max(0, Number(form.initial_paid_amount) || 0)
      : previewTotal.value,
  )
  const previewRemaining = computed(() =>
    Math.max(0, previewTotal.value - previewPaid.value),
  )
  const hasMoreProducts = computed(
    () => productPage.value < productLastPage.value,
  )
  const priceLocked = computed(() =>
    Boolean(orderId && originalOrder.value?.installments?.length),
  )

  function nextLineId(itemId: number, warehouseId: number | null) {
    lineSequence += 1
    return `${itemId}:${warehouseId ?? 'pending'}:${lineSequence}`
  }

  function activeWarehouseStocks(
    item: ProductItem,
    includeWarehouseId?: number | null,
  ): Stock[] {
    const activeWarehouses = new Map(
      warehouses.value
        .filter((warehouse) => warehouse.is_active !== false)
        .map((warehouse) => [warehouse.id, warehouse]),
    )

    return (item.stocks ?? [])
      .map((stock) => ({
        ...stock,
        warehouse: activeWarehouses.get(stock.warehouse_id) ?? stock.warehouse,
      }))
      .filter(
        (stock) =>
          Boolean(stock.warehouse) &&
          stock.warehouse?.is_active !== false &&
          (!warehousesLoaded || activeWarehouses.has(stock.warehouse_id)) &&
          (Number(stock.quantity) > 0 ||
            stock.warehouse_id === includeWarehouseId),
      )
  }

  function applyWarehouseMetadata() {
    const byId = new Map(
      warehouses.value.map((warehouse) => [warehouse.id, warehouse]),
    )
    selectedItems.value.forEach((item) => {
      item.stocks = (item.stocks ?? []).map((stock) => ({
        ...stock,
        warehouse: byId.get(stock.warehouse_id) ?? stock.warehouse,
      }))
    })
    lines.value.forEach((line) => {
      line.warehouseStocks = line.warehouseStocks.map((stock) => ({
        ...stock,
        warehouse: byId.get(stock.warehouse_id) ?? stock.warehouse,
      }))
    })
  }

  async function refreshWarehouses() {
    const result = await listWarehouses({ per_page: -1, is_active: true })
    warehouses.value = (
      Array.isArray(result) ? result : result.data
    ).filter((warehouse) => warehouse.is_active !== false)
    warehousesLoaded = true
    applyWarehouseMetadata()
  }

  async function loadProducts(page = 1, append = false) {
    const request = ++productRequest
    productsLoading.value = true
    try {
      const search = productSearch.value.trim()
      const productResult = await listProducts({
        page,
        per_page: 24,
        is_active: 1,
        ...(search ? { search } : {}),
      })
      if (request !== productRequest) return
      const pageProducts = Array.isArray(productResult)
        ? productResult
        : productResult.data
      let merged = pageProducts

      if (search && page === 1) {
        const itemResult = await listProductItems({
          search,
          per_page: 24,
          is_active: 1,
        })
        if (request !== productRequest) return
        const matchingItems = Array.isArray(itemResult)
          ? itemResult
          : itemResult.data
        const byId = new Map(
          pageProducts.map((product) => [product.id, product]),
        )
        matchingItems.forEach((item) => {
          if (item.product) byId.set(item.product.id, item.product)
        })
        merged = [...byId.values()]
      }

      products.value = append
        ? [
            ...products.value,
            ...merged.filter(
              (product) =>
                !products.value.some((existing) => existing.id === product.id),
            ),
          ]
        : merged
      productPage.value = Array.isArray(productResult)
        ? 1
        : productResult.current_page
      productLastPage.value = Array.isArray(productResult)
        ? 1
        : productResult.last_page
    } finally {
      if (request === productRequest) productsLoading.value = false
    }
  }

  async function selectProduct(product: Product) {
    const request = ++itemRequest
    selectedProduct.value = product
    selectedItems.value = []
    itemsLoading.value = true
    try {
      const detailed = await getProduct(product.id)
      if (request !== itemRequest) return
      selectedProduct.value = detailed
      detailed.product_items?.forEach((item) => {
        item.stocks = activeWarehouseStocks(item)
      })
      selectedItems.value = (detailed.product_items ?? []).filter(
        (item) => item.is_active !== false && item.current_price !== null,
      )
    } finally {
      if (request === itemRequest) itemsLoading.value = false
    }
  }

  function loadMoreProducts() {
    if (hasMoreProducts.value && !productsLoading.value) {
      void loadProducts(productPage.value + 1, true)
    }
  }

  function closeProduct() {
    ++itemRequest
    selectedProduct.value = null
    selectedItems.value = []
    itemsLoading.value = false
  }

  async function loadDependencies() {
    loading.value = true
    try {
      const [, customersResult, , order] = await Promise.all([
        loadProducts(),
        listCustomers({ per_page: -1 }),
        refreshWarehouses(),
        orderId ? getOrder(orderId) : Promise.resolve(null),
      ])
      customers.value = (
        Array.isArray(customersResult) ? customersResult : customersResult.data
      ).filter((customer) => customer.is_active !== false)

      if (order) {
        originalOrder.value = order
        form.invoice_no = order.invoice_no
        form.customer_id = order.customer_id
        form.payment_mode = order.payment_method === 'card' ? 'card' : 'cash'
        lines.value = (order.items ?? []).flatMap((orderItem) => {
          if (!orderItem.product_item) return []
          const systemPrice = moneyString(
            orderItem.product_item.current_price ?? orderItem.price,
          )
          const persistedPrice = moneyString(orderItem.price)
          const warehouseStocks = activeWarehouseStocks(
            orderItem.product_item,
            orderItem.warehouse_id,
          ).map((stock) =>
            stock.warehouse_id === orderItem.warehouse_id
              ? {
                  ...stock,
                  quantity: Number(stock.quantity) + orderItem.quantity,
                }
              : stock,
          )
          const selectedStock = warehouseStocks.find(
            (stock) => stock.warehouse_id === orderItem.warehouse_id,
          )
          return [
            {
              lineId: nextLineId(
                orderItem.product_item.id,
                orderItem.warehouse_id ?? null,
              ),
              item: orderItem.product_item,
              quantity: orderItem.quantity,
              systemPrice,
              unitPrice: persistedPrice,
              persistedPrice,
              priceDirty: false,
              warehouseId: orderItem.warehouse_id ?? null,
              warehouseStocks,
              availableQuantity: Number(selectedStock?.quantity ?? 0),
            },
          ]
        })
      }
    } finally {
      loading.value = false
    }
  }

  function addProduct(item: ProductItem) {
    const warehouseStocks = activeWarehouseStocks(item)
    const currentStocks = warehouseStocks.filter(
      (stock) => stock.warehouse?.is_current,
    )
    const defaultStock =
      currentStocks.length > 0
        ? currentStocks[0]
        : warehouseStocks.length === 1
          ? warehouseStocks[0]
          : null
    const warehouseId = defaultStock?.warehouse_id ?? null
    const max = Number(defaultStock?.quantity ?? 0)
    const existing = warehouseId
      ? lines.value.find(
          (line) =>
            line.item.id === item.id && line.warehouseId === warehouseId,
        )
      : undefined
    if (existing) {
      existing.quantity = Math.min(
        existing.availableQuantity,
        existing.quantity + 1,
      )
    } else {
      const systemPrice = moneyString(item.current_price)
      lines.value.push({
        lineId: nextLineId(item.id, warehouseId),
        item,
        quantity: 1,
        systemPrice,
        unitPrice: systemPrice,
        priceDirty: false,
        warehouseId,
        warehouseStocks,
        availableQuantity: warehouseId ? max : 0,
      })
    }
  }

  function updateQuantity(lineId: string, quantity: number) {
    const line = lines.value.find((item) => item.lineId === lineId)
    if (line)
      line.quantity = Math.min(line.availableQuantity, Math.max(1, quantity))
  }

  function updateWarehouse(lineId: string, warehouseId: number | null) {
    const lineIndex = lines.value.findIndex((line) => line.lineId === lineId)
    const line = lines.value[lineIndex]
    if (!line) return

    const stock = line.warehouseStocks.find(
      (candidate) => candidate.warehouse_id === warehouseId,
    )
    line.warehouseId = stock ? stock.warehouse_id : null
    line.availableQuantity = Number(stock?.quantity ?? 0)
    line.quantity = Math.min(
      Math.max(1, line.quantity),
      Math.max(1, line.availableQuantity),
    )

    if (!line.warehouseId) return
    const existing = lines.value.find(
      (candidate) =>
        candidate.lineId !== line.lineId &&
        candidate.item.id === line.item.id &&
        candidate.warehouseId === line.warehouseId,
    )
    if (!existing) return

    existing.quantity = Math.min(
      existing.availableQuantity,
      existing.quantity + line.quantity,
    )
    lines.value.splice(lineIndex, 1)
  }

  function updatePrice(lineId: string, price: string) {
    const line = lines.value.find((item) => item.lineId === lineId)
    if (!line || !canOverridePrice || priceLocked.value) return
    line.unitPrice = price
    line.priceDirty = !sameMoney(price, line.persistedPrice ?? line.systemPrice)
  }

  function resetPrice(lineId: string) {
    const line = lines.value.find((item) => item.lineId === lineId)
    if (!line || !canOverridePrice || priceLocked.value) return
    line.unitPrice = line.systemPrice
    line.priceDirty = !sameMoney(
      line.unitPrice,
      line.persistedPrice ?? line.systemPrice,
    )
  }

  function removeProduct(lineId: string) {
    lines.value = lines.value.filter((line) => line.lineId !== lineId)
  }

  function selectCustomer(customer: Customer) {
    if (!customers.value.some((item) => item.id === customer.id))
      customers.value.unshift(customer)
    form.customer_id = customer.id
  }

  function validate(): boolean {
    errors.value = {}
    if (!lines.value.length) errors.value.items = ['required']
    if (!form.customer_id) errors.value.customer_id = ['required']
    if (!form.invoice_no.trim()) errors.value.invoice_no = ['required']
    lines.value.forEach((line, index) => {
      if (!line.warehouseId)
        errors.value[`items.${index}.warehouse_id`] = ['warehouseRequired']
      else if (line.availableQuantity <= 0)
        errors.value[`items.${index}.warehouse_id`] = ['warehouseUnavailable']
      if (
        line.quantity < 1 ||
        (line.warehouseId && line.quantity > line.availableQuantity)
      )
        errors.value[`items.${index}.quantity`] = ['stockExceeded']
      const cents = toCents(line.unitPrice)
      if (cents === null || cents > 9_999_999_999)
        errors.value[`items.${index}.price`] = ['invalidPrice']
    })
    if (!orderId && form.payment_mode === 'partial') {
      const paid = Number(form.initial_paid_amount)
      if (!Number.isFinite(paid) || paid <= 0)
        errors.value.amount = ['positive']
      else if (Math.round(paid * 100) > previewTotalCents.value)
        errors.value.amount = ['exceeds']
    }
    return !Object.keys(errors.value).length
  }

  function itemPayload(line: QuickSaleLine): OrderCreateItemPayload {
    return {
      item_id: line.item.id,
      quantity: line.quantity,
      warehouse_id: Number(line.warehouseId),
      ...(line.priceDirty && canOverridePrice && !priceLocked.value
        ? { price: line.unitPrice }
        : {}),
    }
  }

  async function submit(): Promise<Order | null> {
    if (!validate() || submitting.value) return null
    submitting.value = true
    errors.value = {}
    createdOrder.value = null

    try {
      const paymentMethod: PaymentMethod =
        form.payment_mode === 'partial'
          ? form.partial_payment_method
          : form.payment_mode
      if (orderId) {
        completedOrder.value = await updateOrder(orderId, {
          invoice_no: form.invoice_no,
          customer_id: Number(form.customer_id),
          items: lines.value.map(itemPayload),
        })
        return completedOrder.value
      }

      const order = await createOrder({
        invoice_no: form.invoice_no,
        customer_id: Number(form.customer_id),
        payment_method: paymentMethod,
        items: lines.value.map(itemPayload),
      })
      createdOrder.value = order
      const amount =
        form.payment_mode === 'partial'
          ? Number(form.initial_paid_amount)
          : Number(order.total)
      await createPaidInstallment({
        order_id: order.id,
        amount,
        status: 'paid',
        payment_method: paymentMethod,
      })
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

  watch(productSearch, () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => loadProducts(1), 350)
  })

  watch(
    () => auth.branchRevision,
    () => {
      if (warehousesLoaded) void refreshWarehouses()
    },
  )

  return {
    loading,
    productsLoading,
    itemsLoading,
    submitting,
    products,
    productSearch,
    selectedProduct,
    selectedItems,
    customers,
    lines,
    errors,
    form,
    originalOrder,
    createdOrder,
    completedOrder,
    previewTotal,
    previewPaid,
    previewRemaining,
    hasMoreProducts,
    priceLocked,
    loadDependencies,
    loadProducts,
    loadMoreProducts,
    selectProduct,
    closeProduct,
    addProduct,
    updateQuantity,
    updateWarehouse,
    updatePrice,
    resetPrice,
    removeProduct,
    selectCustomer,
    submit,
    reset,
  }
}
