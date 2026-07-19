import { http, unwrapData } from '@/api/http'
import { toFormData } from '@/api/formData'
import type { ApiEnvelope, ListQuery, Paginated } from '@/types/api'
import type { Customer, CustomerPayload, Product, ProductItem, ProductItemPayload, ProductOption, ProductOptionValue, ProductPayload, ProductWithItemsPayload, Stock, StockPayload, Warehouse, WarehousePayload } from './types'

export async function listCustomers(query: ListQuery = {}): Promise<Paginated<Customer> | Customer[]> {
  const response = await http.get<ApiEnvelope<Paginated<Customer> | Customer[]>>('/customers', { params: query })
  return unwrapData(response)
}

export async function getCustomer(id: string | number): Promise<Customer> {
  const response = await http.get<ApiEnvelope<Customer>>(`/customers/${id}`)
  return unwrapData(response)
}

export async function createCustomer(payload: CustomerPayload): Promise<Customer> {
  const response = await http.post<ApiEnvelope<Customer>>('/customers', payload)
  return unwrapData(response)
}

export async function updateCustomer(id: string | number, payload: CustomerPayload): Promise<Customer> {
  const response = await http.put<ApiEnvelope<Customer>>(`/customers/${id}`, payload)
  return unwrapData(response)
}

export async function deleteCustomer(id: number): Promise<void> {
  await http.delete('/customers/delete', { data: { id } })
}

export async function toggleCustomer(id: number): Promise<void> {
  await http.put('/customers/toggle-active', { id })
}

export async function listWarehouses(query: ListQuery = {}): Promise<Paginated<Warehouse> | Warehouse[]> {
  const response = await http.get<ApiEnvelope<Paginated<Warehouse> | Warehouse[]>>('/warehouses', { params: query })
  return unwrapData(response)
}

export async function getWarehouse(id: string | number): Promise<Warehouse> {
  const response = await http.get<ApiEnvelope<Warehouse>>(`/warehouses/${id}`)
  return unwrapData(response)
}

export async function createWarehouse(payload: WarehousePayload): Promise<Warehouse> {
  const response = await http.post<ApiEnvelope<Warehouse>>('/warehouses', payload)
  return unwrapData(response)
}

export async function updateWarehouse(id: string | number, payload: WarehousePayload): Promise<Warehouse> {
  const response = await http.put<ApiEnvelope<Warehouse>>(`/warehouses/${id}`, payload)
  return unwrapData(response)
}

export async function deleteWarehouse(id: number): Promise<void> {
  await http.delete('/warehouses/delete', { data: { id } })
}

export async function toggleWarehouse(id: number): Promise<void> {
  await http.put('/warehouses/toggle-active', { id })
}

export async function listProductItems(query: ListQuery = {}): Promise<Paginated<ProductItem> | ProductItem[]> {
  const response = await http.get<ApiEnvelope<Paginated<ProductItem> | ProductItem[]>>('/product-items', { params: query })
  return unwrapData(response)
}

export async function listProducts(query: ListQuery = {}): Promise<Paginated<Product> | Product[]> {
  const response = await http.get<ApiEnvelope<Paginated<Product> | Product[]>>('/products', { params: query })
  return unwrapData(response)
}

export async function getProduct(id: string | number): Promise<Product> {
  const response = await http.get<ApiEnvelope<Product>>(`/products/${id}`)
  return unwrapData(response)
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  const response = await http.post<ApiEnvelope<Product>>('/products', payload)
  return unwrapData(response)
}

export async function createProductWithItems(payload: ProductWithItemsPayload): Promise<Product> {
  const response = await http.post<ApiEnvelope<Product>>('/product-items/bulck', toFormData({ ...payload }), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return unwrapData(response)
}

export async function updateProduct(id: string | number, payload: ProductPayload): Promise<Product> {
  const response = await http.put<ApiEnvelope<Product>>(`/products/${id}`, payload)
  return unwrapData(response)
}

export async function deleteProduct(id: number): Promise<void> {
  await http.delete('/products/delete', { data: { id } })
}

export async function toggleProduct(id: number): Promise<void> {
  await http.put('/products/toggle-active', { id })
}

export async function getProductItem(id: string | number): Promise<ProductItem> {
  const response = await http.get<ApiEnvelope<ProductItem>>(`/product-items/${id}`)
  return unwrapData(response)
}

export async function createProductItem(payload: ProductItemPayload): Promise<ProductItem> {
  const response = await http.post<ApiEnvelope<ProductItem>>('/product-items', toFormData({ ...payload }), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return unwrapData(response)
}

export async function updateProductItem(id: string | number, payload: ProductItemPayload): Promise<ProductItem> {
  const response = await http.post<ApiEnvelope<ProductItem>>(`/product-items/${id}`, toFormData({ ...payload, _method: 'PUT' }), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return unwrapData(response)
}

export async function deleteProductItem(id: number): Promise<void> {
  await http.delete('/product-items/delete', { data: { id } })
}

export async function toggleProductItem(id: number): Promise<void> {
  await http.put('/product-items/toggle-active', { id })
}

export async function listOptionValues(query: ListQuery = {}): Promise<Paginated<ProductOptionValue> | ProductOptionValue[]> {
  const response = await http.get<ApiEnvelope<Paginated<ProductOptionValue> | ProductOptionValue[]>>('/option-values', { params: query })
  return unwrapData(response)
}

export async function listProductOptions(query: ListQuery = {}): Promise<Paginated<ProductOption> | ProductOption[]> {
  const response = await http.get<ApiEnvelope<Paginated<ProductOption> | ProductOption[]>>('/product-options', { params: query })
  return unwrapData(response)
}

export async function listStocks(query: ListQuery = {}): Promise<Paginated<Stock> | Stock[]> {
  const response = await http.get<ApiEnvelope<Paginated<Stock> | Stock[]>>('/stocks', { params: query })
  return unwrapData(response)
}

export async function getStock(id: string | number): Promise<Stock> {
  const response = await http.get<ApiEnvelope<Stock>>(`/stocks/${id}`)
  return unwrapData(response)
}

export async function createStock(payload: StockPayload): Promise<Stock> {
  const response = await http.post<ApiEnvelope<Stock>>('/stocks', payload)
  return unwrapData(response)
}

export async function updateStock(id: string | number, payload: StockPayload): Promise<Stock> {
  const response = await http.put<ApiEnvelope<Stock>>(`/stocks/${id}`, payload)
  return unwrapData(response)
}
