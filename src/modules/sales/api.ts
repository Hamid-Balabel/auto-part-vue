import { http, unwrapData } from '@/api/http'
import type { ApiEnvelope, Paginated } from '@/types/api'
import type { CartLine, CartPayload, CartSummary, CheckoutPayload, Installment, Order, OrderCreatePayload, OrderListQuery, OrderStatusPayload, PaidInstallmentPayload } from './types'

export async function listMyCart(): Promise<CartLine[]> {
  const response = await http.get<ApiEnvelope<{ cart?: CartLine[] }>>('/carts/me')
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

export async function updateCartLine(id: number, payload: CartPayload): Promise<CartLine> {
  const response = await http.put<ApiEnvelope<CartLine>>(`/carts/${id}`, payload)
  return unwrapData(response)
}

export async function deleteCartLine(id: number): Promise<void> {
  await http.delete(`/carts/${id}`)
}

export async function clearCart(): Promise<void> {
  await http.delete('/carts/clear')
}

export async function checkout(payload: CheckoutPayload): Promise<Order> {
  const response = await http.post<ApiEnvelope<Order>>('/orders/checkout', payload)
  return unwrapData(response)
}

export async function listOrders(query: OrderListQuery = {}): Promise<Paginated<Order> | Order[]> {
  const response = await http.get<ApiEnvelope<Paginated<Order> | Order[]>>('/orders', { params: query })
  return unwrapData(response)
}

export async function createOrder(payload: OrderCreatePayload): Promise<Order> {
  const response = await http.post<ApiEnvelope<Order>>('/orders', payload)
  return unwrapData(response)
}

export async function createPaidInstallment(payload: PaidInstallmentPayload): Promise<Installment> {
  const response = await http.post<ApiEnvelope<Installment>>('/installments', payload)
  return unwrapData(response)
}

export async function getOrder(id: number | string): Promise<Order> {
  const response = await http.get<ApiEnvelope<Order>>(`/orders/${id}`)
  return unwrapData(response)
}

export async function deleteOrder(id: number): Promise<void> {
  await http.delete(`/orders/${id}`)
}

export async function changeOrderStatus(id: number, payload: OrderStatusPayload): Promise<Order> {
  const response = await http.put<ApiEnvelope<Order>>(`/orders/${id}/status`, payload)
  return unwrapData(response)
}
