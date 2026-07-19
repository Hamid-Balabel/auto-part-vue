import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ToastMessage {
  id: number
  type: 'success' | 'error'
  message: string
}

let nextId = 1

export const useToastStore = defineStore('toast', () => {
  const messages = ref<ToastMessage[]>([])

  function push(type: ToastMessage['type'], message: string): void {
    const id = nextId++
    messages.value = [...messages.value, { id, type, message }]
    window.setTimeout(() => dismiss(id), 3500)
  }

  function success(message: string): void {
    push('success', message)
  }

  function error(message: string): void {
    push('error', message)
  }

  function dismiss(id: number): void {
    messages.value = messages.value.filter((message) => message.id !== id)
  }

  return { messages, success, error, dismiss }
})
