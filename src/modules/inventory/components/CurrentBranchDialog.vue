<script setup lang="ts">
import { Building2 } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SearchableSelectInput from '@/components/forms/SearchableSelectInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { ApiError } from '@/api/http'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const auth = useAuthStore()
const toast = useToastStore()
const { t } = useI18n()
const selectedBranchId = ref<number | null>(null)
const errorMessage = ref('')

const branchOptions = computed(() =>
  auth.branches.map((branch) => ({
    value: branch.id,
    label: branch.name ?? branch.translation_name?.ar ?? branch.translation_name?.en ?? '—',
    description: branch.address || undefined,
  })),
)

watch(
  () => auth.branchPromptOpen,
  (open) => {
    if (!open) return
    selectedBranchId.value = auth.currentBranch?.id ?? null
    errorMessage.value = ''
  },
)

async function confirmSelection() {
  if (!selectedBranchId.value || auth.selectingCurrentBranch) return
  errorMessage.value = ''
  try {
    await auth.selectCurrentBranch(selectedBranchId.value)
    toast.success(t('inventory.branchSelected'))
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError
        ? error.message
        : t('inventory.branchSelectionFailed')
  }
}
</script>

<template>
  <div
    v-if="auth.branchPromptOpen"
    class="fixed inset-0 z-[60] flex items-center justify-center bg-text/55 p-4 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="'current-branch-title'"
    data-testid="current-branch-dialog"
  >
    <section
      class="w-full max-w-lg overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-elevated"
    >
      <header class="border-b border-border bg-primary-soft/45 p-5 sm:p-6">
        <div
          class="mb-4 flex size-11 items-center justify-center rounded-[var(--radius-lg)] bg-primary text-primary-contrast"
        >
          <Building2 class="size-5" />
        </div>
        <h2 id="current-branch-title" class="text-xl font-bold text-text">
          {{ t('inventory.selectCurrentBranch') }}
        </h2>
        <p class="mt-2 text-sm leading-6 text-text-muted">
          {{ t('inventory.selectCurrentBranchDescription') }}
        </p>
      </header>

      <div class="p-5 sm:p-6">
        <div v-if="errorMessage" class="alert-danger mb-4">
          {{ errorMessage }}
        </div>
        <SearchableSelectInput
          id="current-branch-select"
          v-model="selectedBranchId"
          :label="t('inventory.branch')"
          :options="branchOptions"
          :placeholder="t('inventory.selectBranch')"
          :search-placeholder="t('inventory.searchBranches')"
          :empty-text="t('inventory.noBranchesAvailable')"
          :loading="auth.branchesLoading"
          data-testid="current-branch-select"
        />
        <p v-if="!auth.branchesLoading && !branchOptions.length" class="mt-3 text-sm text-text-muted">
          {{ t('inventory.noBranchesAvailable') }}
        </p>
      </div>

      <footer class="flex flex-wrap justify-end gap-3 border-t border-border px-5 py-4 sm:px-6">
        <BaseButton
          variant="secondary"
          type="button"
          :disabled="auth.selectingCurrentBranch"
          data-testid="skip-current-branch"
          @click="auth.skipBranchPrompt"
        >{{ t('inventory.skipForNow') }}</BaseButton>
        <BaseButton
          type="button"
          :loading="auth.selectingCurrentBranch"
          :disabled="!selectedBranchId"
          data-testid="confirm-current-branch"
          @click="confirmSelection"
        >{{ t('inventory.confirmCurrentBranch') }}</BaseButton>
      </footer>
    </section>
  </div>
</template>
