<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import BooleanField from '@/components/forms/BooleanField.vue'
import FormInput from '@/components/forms/FormInput.vue'
import TranslatableFields from '@/components/forms/TranslatableFields.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormPageLayout from '@/components/ui/FormPageLayout.vue'
import { ApiError } from '@/api/http'
import { usePermissions } from '@/composables/usePermissions'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { normalizeBoolean } from '@/utils/boolean'
import { createBranch, getBranch, updateBranch } from '../api'
import type { BranchPayload } from '../types'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const { t } = useI18n()
const toast = useToastStore()
const auth = useAuthStore()
const { can } = usePermissions()
const loading = ref(false)
const saving = ref(false)
const errors = ref<Record<string, string[]>>({})
const errorMessage = ref('')
const form = reactive<Required<Pick<BranchPayload, 'name' | 'is_active' | 'is_current'>> & { address: string }>({
  name: { ar: '', en: '' },
  address: '',
  is_active: true,
  is_current: false,
})
const isEdit = computed(() => Boolean(props.id))
const canSave = computed(() => can(isEdit.value ? 'update-branch' : 'create-branch'))
const canSetCurrent = computed(() => can('set-current-branch'))

async function loadRecord() {
  if (!props.id) return
  loading.value = true
  try {
    const branch = await getBranch(props.id)
    form.name = branch.translation_name ?? { ar: '', en: '' }
    form.address = branch.address ?? ''
    form.is_active = normalizeBoolean(branch.is_active, true)
    form.is_current = normalizeBoolean(branch.is_current)
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : t('details.failedToLoad')
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!canSave.value) return
  saving.value = true
  errors.value = {}
  errorMessage.value = ''
  try {
    const payload: BranchPayload = {
      name: form.name,
      address: form.address || null,
      is_active: form.is_active,
      ...(canSetCurrent.value ? { is_current: form.is_current } : {}),
    }
    const branch = props.id
      ? await updateBranch(props.id, payload)
      : await createBranch(payload)
    auth.applyBranch(branch)
    toast.success(t('crud.saved'))
    await router.push({ name: 'branches.index' })
  } catch (error) {
    if (error instanceof ApiError) {
      errors.value = error.errors ?? {}
      errorMessage.value = error.message
    } else errorMessage.value = t('inventory.branchSaveFailed')
  } finally {
    saving.value = false
  }
}

onMounted(loadRecord)
</script>

<template>
  <FormPageLayout
    :title="t(isEdit ? 'inventory.editBranch' : 'inventory.createBranch')"
    :description="t('inventory.branchFormDescription')"
    :error-message="errorMessage"
    :loading-text="loading ? t('inventory.loadingBranch') : ''"
    @submit="submit"
  >
    <div class="grid gap-4 md:grid-cols-2">
      <TranslatableFields
        id="branch_name"
        v-model="form.name"
        :label-ar="t('dataEntry.nameAr')"
        :label-en="t('dataEntry.nameEn')"
        required-ar
        :error-ar="errors.name?.[0] ?? errors['name.ar']?.[0]"
        :error-en="errors['name.en']?.[0]"
      />
      <FormInput
        id="branch_address"
        v-model="form.address"
        :label="t('table.address')"
        :error="errors.address?.[0]"
      />
      <BooleanField
        id="branch_status"
        v-model="form.is_active"
        :label="t('dataEntry.status')"
        :on-label="t('dataEntry.active')"
        :off-label="t('dataEntry.inactive')"
        :error="errors.is_active?.[0]"
        data-testid="branch-active-field"
      />
      <BooleanField
        v-if="canSetCurrent"
        id="branch_current"
        v-model="form.is_current"
        :label="t('inventory.currentBranch')"
        :on-label="t('inventory.currentBranch')"
        :off-label="t('inventory.notCurrentBranch')"
        :disabled="!form.is_active"
        :error="errors.is_current?.[0]"
        data-testid="branch-current-field"
      />
    </div>

    <template #actions>
      <BaseButton variant="secondary" :to="{ name: 'branches.index' }">{{
        t('actions.cancel')
      }}</BaseButton>
      <BaseButton v-if="canSave" type="submit" :loading="saving">{{
        saving ? t('actions.saving') : t('actions.save')
      }}</BaseButton>
    </template>
  </FormPageLayout>
</template>
