<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import FileUpload from '@/components/forms/FileUpload.vue'
import FormInput from '@/components/forms/FormInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormPageLayout from '@/components/ui/FormPageLayout.vue'
import { usePermissions } from '@/composables/usePermissions'
import { ApiError } from '@/api/http'
import { createCountry, getResource, updateCountry } from '../api'
import type { CountryPayload } from '../types'

const props = defineProps<{
  id?: string
}>()

const router = useRouter()
const { t } = useI18n()
const { can } = usePermissions()
const loading = ref(false)
const saving = ref(false)
const errors = ref<Record<string, string[]>>({})
const errorMessage = ref('')

const form = reactive<CountryPayload>({
  name: { ar: '', en: '' },
  nationality: { ar: '', en: '' },
  code: '',
  phone_code: '',
  phone_length: '',
  flag: null,
})

const isEdit = computed(() => Boolean(props.id))
const canSave = computed(() => can(isEdit.value ? 'update-country' : 'create-country'))

async function load() {
  if (!props.id) return
  loading.value = true
  try {
    const country = await getResource('countries', props.id)
    form.name = country.name ?? { ar: '', en: '' }
    form.nationality = country.nationality ?? { ar: '', en: '' }
    form.code = country.code
    form.phone_code = country.phone_code
    form.phone_length = country.phone_length
  } finally {
    loading.value = false
  }
}

async function submit() {
  saving.value = true
  errors.value = {}
  errorMessage.value = ''

  try {
    if (props.id) {
      await updateCountry(props.id, form)
    } else {
      await createCountry(form)
    }
    await router.push({ name: 'countries.index' })
  } catch (error) {
    if (error instanceof ApiError) {
      errors.value = error.errors ?? {}
      errorMessage.value = error.message
    }
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <FormPageLayout
    :title="isEdit ? t('dataEntry.editCountry') : t('dataEntry.newCountry')"
    :description="t('dataEntry.countryHint')"
    :error-message="errorMessage"
    :loading-text="loading ? t('dataEntry.loadingCountry') : ''"
    @submit="submit"
  >
    <div class="grid gap-4 md:grid-cols-2">
      <FormInput id="name_ar" v-model="form.name.ar" :label="t('dataEntry.nameAr')" required :error="errors.name?.[0] ?? errors['name.ar']?.[0]" />
      <FormInput id="name_en" v-model="form.name.en" :label="t('dataEntry.nameEn')" :error="errors['name.en']?.[0]" />
      <FormInput id="nationality_ar" v-model="form.nationality.ar" :label="t('dataEntry.nationalityAr')" required :error="errors.nationality?.[0] ?? errors['nationality.ar']?.[0]" />
      <FormInput id="nationality_en" v-model="form.nationality.en" :label="t('dataEntry.nationalityEn')" :error="errors['nationality.en']?.[0]" />
      <FormInput id="code" v-model="form.code" :label="t('dataEntry.code')" required :error="errors.code?.[0]" />
      <FormInput id="phone_code" v-model="form.phone_code" :label="t('dataEntry.phoneCode')" required :error="errors.phone_code?.[0]" />
      <FormInput id="phone_length" v-model="form.phone_length" :label="t('dataEntry.phoneLength')" type="number" required :error="errors.phone_length?.[0]" />
    </div>

    <FileUpload id="flag" :label="t('dataEntry.flag')" accept="image/*" :error="errors.flag?.[0]" @change="form.flag = $event[0] ?? null" />

    <template #actions>
      <BaseButton variant="secondary" :to="{ name: 'countries.index' }">{{ t('actions.cancel') }}</BaseButton>
      <BaseButton v-if="canSave" variant="primary" type="submit" :loading="saving">{{ saving ? t('actions.saving') : t('dataEntry.saveCountry') }}</BaseButton>
    </template>
  </FormPageLayout>
</template>
