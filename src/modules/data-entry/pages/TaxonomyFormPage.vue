<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import FormInput from '@/components/forms/FormInput.vue'
import BooleanField from '@/components/forms/BooleanField.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormPageLayout from '@/components/ui/FormPageLayout.vue'
import { usePermissions } from '@/composables/usePermissions'
import { ApiError } from '@/api/http'
import { createTaxonomy, getResource, listCategoryTree, updateTaxonomy } from '../api'
import CategoryTreePicker from '../components/CategoryTreePicker.vue'
import type { CategoryTreeNode, TaxonomyPayload } from '../types'
import { normalizeBoolean } from '@/utils/boolean'

const props = defineProps<{
  resource: 'categories' | 'brands'
  title: string
  id?: string
}>()

const router = useRouter()
const { t } = useI18n()
const { can } = usePermissions()
const saving = ref(false)
const loading = ref(false)
const errors = ref<Record<string, string[]>>({})
const errorMessage = ref('')
const categoryTree = ref<CategoryTreeNode[]>([])
const categoryTreeLoading = ref(false)

const form = reactive<TaxonomyPayload>({
  name: { ar: '', en: '' },
  description: { ar: '', en: '' },
  parent_id: null,
  is_active: true,
})

const isCategory = computed(() => props.resource === 'categories')
const isEdit = computed(() => Boolean(props.id))
const indexRoute = computed(() => `${props.resource}.index`)
const displayTitle = computed(() => t(props.resource === 'categories' ? 'dataEntry.categoriesTitle' : 'dataEntry.brandsTitle'))
const permissionBase = computed(() => (props.resource === 'categories' ? 'category' : 'brand'))
const canSave = computed(() => can(`${isEdit.value ? 'update' : 'create'}-${permissionBase.value}`))
async function loadOptions() {
  if (!isCategory.value) return
  categoryTreeLoading.value = true
  try {
    categoryTree.value = await listCategoryTree()
  } finally {
    categoryTreeLoading.value = false
  }
}

async function loadRecord() {
  if (!props.id) return
  loading.value = true
  try {
    const record = await getResource(props.resource, props.id)
    form.name = record.translation_name ?? { ar: '', en: '' }
    form.description = record.translation_description ?? { ar: '', en: '' }
    form.is_active = normalizeBoolean(record.is_active, true)
    if ('parent_id' in record) form.parent_id = record.parent_id ?? null
  } finally {
    loading.value = false
  }
}

async function submit() {
  saving.value = true
  errors.value = {}
  errorMessage.value = ''

  try {
    const payload: TaxonomyPayload = {
      name: form.name,
      description: form.description,
      is_active: form.is_active,
      ...(isCategory.value ? { parent_id: form.parent_id ?? null } : {}),
    }

    if (props.id) {
      await updateTaxonomy(props.resource, props.id, payload)
    } else {
      await createTaxonomy(props.resource, payload)
    }

    await router.push({ name: indexRoute.value })
  } catch (error) {
    if (error instanceof ApiError) {
      errors.value = error.errors ?? {}
      errorMessage.value = error.message
    }
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadOptions(), loadRecord()])
})
</script>

<template>
  <FormPageLayout
    :title="t(isEdit ? 'dataEntry.editTitle' : 'dataEntry.createTitle', { title: displayTitle })"
    :description="t('dataEntry.taxonomyFormHint')"
    :error-message="errorMessage"
    :loading-text="loading ? t('dataEntry.loadingRecord') : ''"
    @submit="submit"
  >
    <div class="grid gap-4 md:grid-cols-2">
      <FormInput id="name_ar" v-model="form.name.ar" :label="t('dataEntry.nameAr')" required :error="errors.name?.[0] ?? errors['name.ar']?.[0]" />
      <FormInput id="name_en" v-model="form.name.en" :label="t('dataEntry.nameEn')" :error="errors['name.en']?.[0]" />
      <FormInput id="description_ar" v-model="form.description.ar" :label="t('dataEntry.descriptionAr')" :error="errors['description.ar']?.[0]" />
      <FormInput id="description_en" v-model="form.description.en" :label="t('dataEntry.descriptionEn')" :error="errors['description.en']?.[0]" />
      <CategoryTreePicker v-if="isCategory" id="parent_id" v-model="form.parent_id" class="md:col-span-2" :label="t('dataEntry.parentCategory')" :nodes="categoryTree" :current-id="props.id" :loading="categoryTreeLoading" :error="errors.parent_id?.[0]" />
      <BooleanField id="is_active" v-model="form.is_active" :label="t('dataEntry.status')" :on-label="t('dataEntry.active')" :off-label="t('dataEntry.inactive')" :error="errors.is_active?.[0]" :data-testid="`${resource}-active-field`" />
    </div>

    <template #actions>
      <BaseButton variant="secondary" :to="{ name: indexRoute }">{{ t('actions.cancel') }}</BaseButton>
      <BaseButton v-if="canSave" variant="primary" type="submit" :loading="saving">{{ saving ? t('actions.saving') : t('actions.save') }}</BaseButton>
    </template>
  </FormPageLayout>
</template>
