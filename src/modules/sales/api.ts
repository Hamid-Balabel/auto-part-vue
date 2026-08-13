import { http, unwrapData } from '@/api/http'
import type { ProductItem } from '@/modules/inventory/types'
import type { ApiEnvelope, Paginated } from '@/types/api'
import type {
  CartLine,
  CartPayload,
  CartSummary,
  CheckoutPayload,
  Installment,
  InstallmentListQuery,
  InstallmentPayload,
  InstallmentPlanPayload,
  InstallmentUpdatePayload,
  Order,
  OrderCreatePayload,
  OrderListQuery,
  OrderStatusPayload,
  OrderUpdatePayload,
  PaidInstallmentPayload,
  PayInstallmentPayload,
} from './types'

export async function listInstallments(
  query: InstallmentListQuery = {},
): Promise<Paginated<Installment> | Installment[]> {
  const response = await http.get<
    ApiEnvelope<Paginated<Installment> | Installment[]>
  >('/installments', { params: query })
  return unwrapData(response)
}

export async function listOrderInstallments(
  orderId: number,
  query: InstallmentListQuery = {},
): Promise<Paginated<Installment> | Installment[]> {
  const response = await http.get<
    ApiEnvelope<Paginated<Installment> | Installment[]>
  >(`/orders/${orderId}/installments`, { params: query })
  return unwrapData(response)
}

export async function getInstallment(id: number): Promise<Installment> {
  const response = await http.get<ApiEnvelope<Installment>>(`/installments/${id}`)
  return unwrapData(response)
}

export async function createInstallment(
  payload: InstallmentPayload,
): Promise<Installment> {
  const response = await http.post<ApiEnvelope<Installment>>('/installments', payload)
  return unwrapData(response)
}

export async function updateInstallment(
  id: number,
  payload: InstallmentUpdatePayload,
): Promise<Installment> {
  const response = await http.put<ApiEnvelope<Installment>>(`/installments/${id}`, payload)
  return unwrapData(response)
}

export async function deleteInstallment(id: number): Promise<void> {
  await http.delete(`/installments/${id}`)
}

export async function payInstallment(
  id: number,
  payload: PayInstallmentPayload,
): Promise<Installment> {
  const response = await http.post<ApiEnvelope<Installment>>(
    `/installments/${id}/pay`,
    payload,
  )
  return unwrapData(response)
}

export async function generateInstallmentPlan(
  orderId: number,
  payload: InstallmentPlanPayload,
): Promise<Order> {
  const response = await http.post<ApiEnvelope<Order>>(
    `/orders/${orderId}/installments/generate`,
    payload,
  )
  return unwrapData(response)
}

export async function listMyCart(): Promise<CartLine[]> {
  const response =
    await http.get<ApiEnvelope<{ cart?: CartLine[] }>>('/carts/me')
  return unwrapData(response).cart ?? []
}

export async function getCartSummary(): Promise<CartSummary> {
  const response = await http.get<ApiEnvelope<CartSummary>>('/carts/summary')
  return unwrapData(response)
}

export async function addCartLine(payload: CartPayload): Promise<CartLine> {
  const response = await http.post<ApiEnvelope<CartLine>>('/carts', payload)
  return unwrapData(response)
}

export async function updateCartLine(
  id: number,
  payload: CartPayload,
): Promise<CartLine> {
  const response = await http.put<ApiEnvelope<CartLine>>(
    `/carts/${id}`,
    payload,
  )
  return unwrapData(response)
}

export async function deleteCartLine(id: number): Promise<void> {
  await http.delete(`/carts/${id}`)
}

export async function clearCart(): Promise<void> {
  await http.delete('/carts/clear')
}

export async function checkout(payload: CheckoutPayload): Promise<Order> {
  const response = await http.post<ApiEnvelope<Order>>(
    '/orders/checkout',
    payload,
  )
  return unwrapData(response)
}

export async function listOrders(
  query: OrderListQuery = {},
): Promise<Paginated<Order> | Order[]> {
  const response = await http.get<ApiEnvelope<Paginated<Order> | Order[]>>(
    '/orders',
    { params: query },
  )
  return unwrapData(response)
}

export async function createOrder(payload: OrderCreatePayload): Promise<Order> {
  const response = await http.post<ApiEnvelope<Order>>('/orders', payload)
  return unwrapData(response)
}

export async function updateOrder(
  id: number,
  payload: OrderUpdatePayload,
): Promise<Order> {
  const response = await http.put<ApiEnvelope<Order>>(`/orders/${id}`, payload)
  return unwrapData(response)
}

export async function syncOrderStock(
  productItemIds: number[],
): Promise<ProductItem[]> {
  const response = await http.get<ApiEnvelope<ProductItem[]>>('/stocks/sync', {
    params: { product_item_ids: productItemIds },
  })
  return unwrapData(response)
}

export async function createPaidInstallment(
  payload: PaidInstallmentPayload,
): Promise<Installment> {
  const response = await http.post<ApiEnvelope<Installment>>(
    '/installments',
    payload,
  )
  return unwrapData(response)
}

export async function getOrder(id: number | string): Promise<Order> {
  const response = await http.get<ApiEnvelope<Order>>(`/orders/${id}`)
  return unwrapData(response)
}

export async function deleteOrder(id: number): Promise<void> {
  await http.delete(`/orders/${id}`)
}

export async function changeOrderStatus(
  id: number,
  payload: OrderStatusPayload,
): Promise<Order> {
  const response = await http.put<ApiEnvelope<Order>>(
    `/orders/${id}/status`,
    payload,
  )
  return unwrapData(response)
}
