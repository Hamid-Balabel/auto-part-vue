<script setup lang="ts">
import { CheckCircle2, XCircle } from '@lucide/vue'
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()
</script>

<template>
  <div class="fixed end-4 top-4 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
    <TransitionGroup
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-for="message in toast.messages"
        :key="message.id"
        class="flex items-start gap-3 rounded-[var(--radius-lg)] border bg-surface p-4 text-sm shadow-elevated"
        :class="message.type === 'success' ? 'border-success/20 text-success' : 'border-danger/20 text-danger'"
      >
        <CheckCircle2 v-if="message.type === 'success'" class="mt-0.5 size-5 shrink-0 text-success" />
        <XCircle v-else class="mt-0.5 size-5 shrink-0 text-danger" />
        <p class="flex-1 leading-6">{{ message.message }}</p>
        <button class="rounded-[var(--radius-sm)] px-2 text-text-muted transition hover:bg-neutral-soft hover:text-text" type="button" @click="toast.dismiss(message.id)">
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
