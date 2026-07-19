import type { Order, OrderStatus } from './types'

export type OrderActionStatus = Exclude<OrderStatus, 'pending'>

export function availableOrderTransitions(order: Order, canUpdate: boolean): OrderActionStatus[] {
  if (!canUpdate) return []

  if (order.status === 'pending') {
    return order.payment_status === 'paid' ? ['paid', 'cancelled'] : ['cancelled']
  }

  if (order.status === 'paid') {
    return order.payment_status === 'paid' ? ['completed', 'refunded'] : ['refunded']
  }

  if (order.status === 'completed') return ['refunded']
  return []
}

export function canDeleteOrder(order: Order, hasDeletePermission: boolean): boolean {
  return hasDeletePermission && order.status === 'pending' && !(order.installments?.length)
}
