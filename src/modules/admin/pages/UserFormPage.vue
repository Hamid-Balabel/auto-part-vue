<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import BasePhoneInput, { type PhoneInputValue } from '@/components/forms/BasePhoneInput.vue'
import BaseSelect from '@/components/forms/BaseSelect.vue'
import BooleanField from '@/components/forms/BooleanField.vue'
import FileUpload from '@/components/forms/FileUpload.vue'
import FormInput from '@/components/forms/FormInput.vue'
import SelectInput from '@/components/forms/SelectInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormPageLayout from '@/components/ui/FormPageLayout.vue'
import FormSection from '@/components/ui/FormSection.vue'
import { usePermissions } from '@/composables/usePermissions'
import { useLocalizedDisplayName } from '@/composables/useLocalizedName'
import { ApiError } from '@/api/http'
import { useAdminStore } from '@/stores/admin'
import { createUser, getUser, listRoles, updateUser } from '../api'
import type { Role, UserPayload } from '../types'
import { normalizeBoolean } from '@/utils/boolean'

const props = defineProps<{ id?: string }>()

const { t } = useI18n()
const localizedDisplayName = useLocalizedDisplayName()
const router = useRouter()
const { can } = usePermissions()
const adminStore = useAdminStore()
const loading = ref(false)
const saving = ref(false)
const errors = ref<Record<string, string[]>>({})
const errorMessage = ref('')
const roles = ref<Role[]>([])
const roleOptions = computed(() => roles.value.map((role) => ({ label: localizedDisplayName(role), value: role.id })))
const phoneTouched = ref(false)

const form = reactive<UserPayload>({
  name: '',
  email: '',
  phone: '',
  phone_code_id: '',
  password: '',
  password_confirmation: '',
  gender: 'male',
  roles: [],
  is_active: true,
  avatar: null,
})

const isEdit = computed(() => Boolean(props.id))
const canSave = computed(() => can(isEdit.value ? 'update-user' : 'create-user'))
const phoneValue = computed<PhoneInputValue>({
  get: () => ({ phone_code_id: form.phone_code_id || null, phone: form.phone || '' }),
  set: (value) => {
    form.phone_code_id = value.phone_code_id
    form.phone = value.phone
  },
})
const selectedCountry = computed(() => adminStore.countries.find((country) => String(country.id) === String(form.phone_code_id ?? '')))
const phoneValidationError = computed(() => {
  if (!form.phone) return ''
  if (!form.phone_code_id) return t('phone.selectCountry')
  const length = selectedCountry.value?.phone_length
  if (length && String(form.phone).length !== Number(length)) return t('phone.exactLength', { length })
  return ''
})
const visiblePhoneError = computed(() => errors.value.phone?.[0] ?? (phoneTouched.value ? phoneValidationError.value : ''))
const visibleCountryError = computed(() => errors.value.phone_code_id?.[0] ?? '')
const genderOptions = computed(() => [
  { label: t('admin.male'), value: 'male' },
  { label: t('admin.female'), value: 'female' },
])
async function loadOptions() {
  try {
    const [rolesResponse] = await Promise.all([listRoles({ per_page: -1 }), adminStore.loadCountries()])
    const roleList = Array.isArray(rolesResponse) ? rolesResponse : rolesResponse.data
    roles.value = roleList
  } catch (error) {
    if (error instanceof ApiError) errorMessage.value = error.message
  }
}

async function loadRecord() {
  if (!props.id) return
  loading.value = true
  try {
    const user = await getUser(props.id)
    form.name = user.name
    form.email = user.email
    form.phone = user.phone?.phone ?? ''
    form.phone_code_id = user.phone?.phone_code_id ?? ''
    form.gender = user.gender ?? 'male'
    form.roles = (user.roles ?? []).map((role) => role.id)
    form.is_active = normalizeBoolean(user.is_active, true)
  } finally {
    loading.value = false
  }
}

async function submit() {
  phoneTouched.value = true
  if (phoneValidationError.value) return

  saving.value = true
  errors.value = {}
  errorMessage.value = ''

  try {
    const payload: UserPayload = {
      ...form,
      password: form.password || undefined,
      password_confirmation: form.password_confirmation || undefined,
    }

    if (props.id) {
      await updateUser(props.id, payload)
    } else {
      await createUser(payload)
    }

    await router.push({ name: 'users.index' })
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
    data-testid="user-form"
    :title="isEdit ? t('admin.editUser') : t('admin.newUser')"
    :description="t('admin.userFormDescription')"
    :error-message="errorMessage || adminStore.countriesError"
    :loading-text="loading ? t('admin.loadingUser') : ''"
    @submit="submit"
  >
    <FormSection :title="t('admin.basicInformation')">
      <div class="grid gap-4 lg:grid-cols-3">
        <FormInput id="name" v-model="form.name" :label="t('admin.name')" required :error="errors.name?.[0]" />
        <FormInput id="email" v-model="form.email" :label="t('admin.email')" type="email" required :error="errors.email?.[0]" />
        <SelectInput id="gender" v-model="form.gender" :label="t('admin.gender')" :options="genderOptions" required :error="errors.gender?.[0]" />
        <BooleanField id="is_active" v-model="form.is_active" :label="t('admin.userStatus')" :on-label="t('dataEntry.active')" :off-label="t('dataEntry.inactive')" :error="errors.is_active?.[0]" data-testid="user-active-field" />
      </div>
      <div class="mt-4">
        <BasePhoneInput
          id="user_phone"
          v-model="phoneValue"
          :label="t('admin.phone')"
          :countries="adminStore.countries"
          :loading="adminStore.countriesLoading"
          :country-error="visibleCountryError"
          :phone-error="visiblePhoneError"
          @update:model-value="phoneTouched = true"
        />
      </div>
    </FormSection>

    <FormSection :title="t('admin.securityInformation')">
      <div class="grid gap-4 md:grid-cols-2">
        <FormInput id="password" v-model="form.password" :label="t('admin.password')" type="password" autocomplete="new-password" :required="!isEdit" :error="errors.password?.[0]" />
        <FormInput id="password_confirmation" v-model="form.password_confirmation" :label="t('admin.passwordConfirmation')" type="password" autocomplete="new-password" :required="!isEdit" :error="errors.password_confirmation?.[0]" />
      </div>
    </FormSection>

    <FormSection :title="t('admin.roles')">
      <BaseSelect
        id="user_roles"
        :model-value="form.roles"
        :label="t('admin.roles')"
        :options="roleOptions"
        :placeholder="t('common.select')"
        :search-placeholder="t('crud.searchPlaceholder')"
        :empty-text="t('states.emptyTitle')"
        :loading="loading"
        :error="errors.roles?.[0] ?? errors['roles.0']?.[0]"
        multiple
        searchable
        clearable
        required
        data-testid="user-roles-select"
        @update:model-value="form.roles = $event as number[]"
      />
    </FormSection>

    <FormSection :title="t('admin.avatar')">
      <FileUpload id="avatar" :label="t('admin.avatar')" accept="image/*" :error="errors.avatar?.[0]" @change="form.avatar = $event[0] ?? null" />
    </FormSection>

    <template #actions>
      <BaseButton variant="secondary" :to="{ name: 'users.index' }">{{ t('actions.cancel') }}</BaseButton>
      <BaseButton v-if="canSave" data-testid="user-save" variant="primary" type="submit" :loading="saving">{{ saving ? t('actions.saving') : t('actions.save') }}</BaseButton>
    </template>
  </FormPageLayout>
</template>
