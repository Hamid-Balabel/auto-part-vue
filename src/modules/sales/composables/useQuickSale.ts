import { computed, reactive, ref, watch } from 'vue'
import { ApiError } from '@/api/http'
import {
  getProduct,
  listParties,
  listProductItems,
  listProducts,
  listWarehouses,
} from '@/modules/inventory/api'
import type {
  Party,
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
  syncOrderStock,
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
  const scanning = ref(false)
  const submitting = ref(false)
  const syncingStock = ref(false)
  const products = ref<Product[]>([])
  const productPage = ref(1)
  const productLastPage = ref(1)
  const productSearch = ref('')
  const selectedProduct = ref<Product | null>(null)
  const selectedItems = ref<ProductItem[]>([])
  const warehouses = ref<Warehouse[]>([])
  const customers = ref<Party[]>([])
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
  const productCache = new Map<number, Product>()
  const productLookups = new Map<number, Promise<Product | null>>()

  const form = reactive({
    invoice_no: newInvoiceNumber(),
    customer_id: 0,
    payment_mode: 'cash' as QuickSalePaymentMode,
    partial_payment_method: 'cash' as Exclude<PaymentMethod, 'transfer'>,
    initial_paid_amount: '' as number | string,
  })

  function maxDiscountCents(line: QuickSaleLine) {
    return toCents(line.item.effective_max_discount ?? 0) ?? 0
  }

  function grossLineCents(line: QuickSaleLine) {
    return (toCents(line.unitPrice) ?? 0) * line.quantity
  }

  function lineDiscountCents(line: QuickSaleLine) {
    return toCents(line.discount) ?? 0
  }

  function lineTotalCents(line: QuickSaleLine) {
    return Math.max(0, grossLineCents(line) - lineDiscountCents(line))
  }

  const previewTotalCents = computed(() =>
    lines.value.reduce(
      (total, line) => total + lineTotalCents(line),
      0,
    ),
  )
  const previewTotal = computed(() => previewTotalCents.value / 100)
  const previewSubtotal = computed(
    () =>
      lines.value.reduce((total, line) => total + grossLineCents(line), 0) / 100,
  )
  const previewDiscount = computed(
    () =>
      lines.value.reduce((total, line) => total + lineDiscountCents(line), 0) /
      100,
  )
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
  const hasStockConflicts = computed(() =>
    lines.value.some(
      (line) =>
        !line.warehouseId ||
        line.availableQuantity <= 0 ||
        line.quantity > line.availableQuantity,
    ),
  )

  function nextLineId(itemId: number, warehouseId: number | null) {
    lineSequence += 1
    return `${itemId}:${warehouseId ?? 'pending'}:${lineSequence}`
  }

  function rememberProduct(product?: Product | null) {
    if (!product?.id) return
    productCache.set(product.id, product)
  }

  function cachedProduct(productId?: number | null) {
    return productId ? productCache.get(productId) : undefined
  }

  async function resolveProductForItem(
    item: ProductItem,
  ): Promise<Product | null> {
    if (item.product) {
      rememberProduct(item.product)
      return item.product
    }

    const cached = cachedProduct(item.product_id)
    if (cached) {
      item.product = cached
      return cached
    }

    if (!item.product_id) return null

    let lookup = productLookups.get(item.product_id)
    if (!lookup) {
      lookup = getProduct(item.product_id)
        .then((product) => {
          rememberProduct(product)
          return product
        })
        .catch(() => null)
        .finally(() => {
          productLookups.delete(item.product_id)
        })
      productLookups.set(item.product_id, lookup)
    }

    const product = await lookup
    if (product) item.product = product
    return product
  }

  function enrichItemWithKnownProduct(item: ProductItem) {
    if (item.product) {
      rememberProduct(item.product)
      return
    }

    const selected = selectedProduct.value
    if (selected?.id === item.product_id) {
      item.product = selected
      rememberProduct(selected)
      return
    }

    const cached = cachedProduct(item.product_id)
    if (cached) item.product = cached
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
      pageProducts.forEach(rememberProduct)
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
          if (item.product) {
            rememberProduct(item.product)
            byId.set(item.product.id, item.product)
          } else {
            const product = cachedProduct(item.product_id)
            if (product) byId.set(product.id, product)
          }
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
      rememberProduct(detailed)
      selectedProduct.value = detailed
      detailed.product_items?.forEach((item) => {
        item.product = detailed
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
        listParties({ per_page: -1, is_active: true }),
        refreshWarehouses(),
        orderId ? getOrder(orderId) : Promise.resolve(null),
      ])
      customers.value = (
        Array.isArray(customersResult) ? customersResult : customersResult.data
      ).filter((customer) => customer.is_active !== false)

      if (order) {
        originalOrder.value = order
        form.invoice_no = order.invoice_no
        form.customer_id = order.party_id ?? order.customer_id ?? 0
        form.payment_mode = order.payment_method === 'card' ? 'card' : 'cash'
        const hydratedLines = await Promise.all(
          (order.items ?? []).map(
            async (orderItem): Promise<QuickSaleLine | null> => {
              if (!orderItem.product_item) return null
              await resolveProductForItem(orderItem.product_item)
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
              return {
                lineId: nextLineId(
                  orderItem.product_item.id,
                  orderItem.warehouse_id ?? null,
                ),
                item: orderItem.product_item,
                quantity: orderItem.quantity,
                systemPrice,
                unitPrice: persistedPrice,
                discount: moneyString(orderItem.discount),
                persistedPrice,
                priceDirty: false,
                warehouseId: orderItem.warehouse_id ?? null,
                warehouseStocks,
                availableQuantity: Number(selectedStock?.quantity ?? 0),
                reservedWarehouseId: orderItem.warehouse_id ?? null,
                reservedQuantity: orderItem.quantity,
                stockChanged: false,
              }
            },
          ),
        )
        lines.value = hydratedLines.filter((line): line is QuickSaleLine =>
          Boolean(line),
        )
      }
    } finally {
      loading.value = false
    }
  }

  function addProduct(item: ProductItem) {
    enrichItemWithKnownProduct(item)
    if (!item.product) void resolveProductForItem(item)
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
        discount: '0.00',
        priceDirty: false,
        warehouseId,
        warehouseStocks,
        availableQuantity: warehouseId ? max : 0,
        reservedWarehouseId: null,
        reservedQuantity: 0,
        stockChanged: false,
      })
    }
  }

  async function addScannedProduct(value: string): Promise<boolean> {
    const sku = value.trim()
    if (!sku || scanning.value) return false

    scanning.value = true
    try {
      const result = await listProductItems({
        search: sku,
        per_page: 24,
        is_active: 1,
      })
      const items = Array.isArray(result) ? result : result.data
      items.forEach((candidate) => {
        if (candidate.product) rememberProduct(candidate.product)
      })
      const item = items.find(
        (candidate) =>
          [candidate.sku, candidate.movement_code, candidate.barcode].some(
            (field) => field?.toLocaleLowerCase() === sku.toLocaleLowerCase(),
          ),
      )

      if (!item || item.current_price === null) return false

      await resolveProductForItem(item)
      item.stocks = activeWarehouseStocks(item)
      addProduct(item)
      productSearch.value = ''

      return true
    } finally {
      scanning.value = false
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

  function selectCustomer(customer: Party) {
    if (!customers.value.some((item) => item.id === customer.id))
      customers.value.unshift(customer)
    form.customer_id = customer.id
  }

  async function synchronizeStock(): Promise<boolean> {
    if (syncingStock.value) return !hasStockConflicts.value
    if (!lines.value.length) return true

    syncingStock.value = true
    try {
      const itemIds = [...new Set(lines.value.map((line) => line.item.id))]
      const syncedItems = await syncOrderStock(itemIds)
      const syncedById = new Map(syncedItems.map((item) => [item.id, item]))

      selectedItems.value.forEach((item) => {
        const syncedItem = syncedById.get(item.id)
        if (syncedItem) item.stocks = syncedItem.stocks ?? []
      })

      lines.value.forEach((line) => {
        const previousAvailable = line.availableQuantity
        const syncedItem = syncedById.get(line.item.id)
        let warehouseStocks = activeWarehouseStocks(
          { ...line.item, stocks: syncedItem?.stocks ?? [] },
          line.warehouseId,
        )

        if (line.reservedWarehouseId && line.reservedQuantity) {
          warehouseStocks = warehouseStocks.map((stock) =>
            stock.warehouse_id === line.reservedWarehouseId
              ? {
                  ...stock,
                  quantity: Number(stock.quantity) + line.reservedQuantity!,
                }
              : stock,
          )
        }

        line.item.stocks = syncedItem?.stocks ?? []
        line.warehouseStocks = warehouseStocks
        line.availableQuantity = Number(
          warehouseStocks.find(
            (stock) => stock.warehouse_id === line.warehouseId,
          )?.quantity ?? 0,
        )
        line.stockChanged = previousAvailable !== line.availableQuantity
      })

      return !hasStockConflicts.value
    } finally {
      syncingStock.value = false
    }
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
      const discountCents = toCents(line.discount)
      if (discountCents === null)
        errors.value[`items.${index}.discount`] = ['invalidDiscount']
      else if (discountCents > maxDiscountCents(line))
        errors.value[`items.${index}.discount`] = ['discountExceedsMax']
      else if (discountCents > grossLineCents(line))
        errors.value[`items.${index}.discount`] = ['discountExceedsSubtotal']
    })
    if (lines.value.length && previewTotalCents.value <= 0)
      errors.value.items = ['netTotalPositive']
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
      discount: moneyString(line.discount),
      ...(line.priceDirty && canOverridePrice && !priceLocked.value
        ? { price: line.unitPrice }
        : {}),
    }
  }

  async function submit(): Promise<Order | null> {
    if (submitting.value || syncingStock.value) return null
    submitting.value = true
    errors.value = {}
    createdOrder.value = null

    try {
      await synchronizeStock()
      if (!validate()) return null

      const paymentMethod: PaymentMethod =
        form.payment_mode === 'partial'
          ? form.partial_payment_method
          : form.payment_mode
      if (orderId) {
        completedOrder.value = await updateOrder(orderId, {
          invoice_no: form.invoice_no,
          party_id: Number(form.customer_id),
          items: lines.value.map(itemPayload),
        })
        return completedOrder.value
      }

      const order = await createOrder({
        invoice_no: form.invoice_no,
        party_id: Number(form.customer_id),
        payment_method: paymentMethod,
        items: lines.value.map(itemPayload),
      })
      createdOrder.value = order
      if (form.payment_mode === 'partial') {
        await createPaidInstallment({
          source_type: 'order',
          source_id: order.id,
          amount: Number(form.initial_paid_amount),
          status: 'paid',
          payment_method: paymentMethod,
        })
      }
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
    scanning,
    submitting,
    syncingStock,
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
    previewSubtotal,
    previewDiscount,
    previewPaid,
    previewRemaining,
    hasMoreProducts,
    priceLocked,
    hasStockConflicts,
    loadDependencies,
    loadProducts,
    loadMoreProducts,
    selectProduct,
    closeProduct,
    addProduct,
    addScannedProduct,
    updateQuantity,
    updateWarehouse,
    updatePrice,
    resetPrice,
    removeProduct,
    selectCustomer,
    synchronizeStock,
    submit,
    reset,
  }
}
