<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import FormInput from '@/components/forms/FormInput.vue'
import PermissionGroup from '@/components/permissions/PermissionGroup.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormPageLayout from '@/components/ui/FormPageLayout.vue'
import FormSection from '@/components/ui/FormSection.vue'
import { usePermissions } from '@/composables/usePermissions'
import { ApiError } from '@/api/http'
import { useAdminStore } from '@/stores/admin'
import { createRole, getRole, updateRole } from '../api'
import type { Permission, RolePayload } from '../types'

const props = defineProps<{ id?: string }>()

const { t, locale } = useI18n()
const router = useRouter()
const { can } = usePermissions()
const adminStore = useAdminStore()
const loading = ref(false)
const saving = ref(false)
const errors = ref<Record<string, string[]>>({})
const errorMessage = ref('')
const permissionSearch = ref('')

const form = reactive<RolePayload>({
  name: '',
  display_name: { ar: '', en: '' },
  permissions: [],
})

const isEdit = computed(() => Boolean(props.id))
const canSave = computed(() => can(isEdit.value ? 'update-role' : 'create-role'))
const canAssignPermissions = computed(() => canSave.value && can('read-permission'))
const normalizedSearch = computed(() => permissionSearch.value.trim().toLowerCase())
const filteredPermissions = computed(() => {
  if (!normalizedSearch.value) return adminStore.permissions

  return adminStore.permissions.filter((permission) => {
    return [permission.name, permission.translation_display_name, permission.group, permission.display_group]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch.value))
  })
})
const groupedPermissions = computed(() => {
  return filteredPermissions.value.reduce<Record<string, Permission[]>>((groups, permission) => {
    const group = permission.display_group || permission.group || derivePermissionGroup(permission.name)
    groups[group] = groups[group] ?? []
    groups[group].push(permission)
    return groups
  }, {})
})
const totalPermissionCount = computed(() => adminStore.permissions.length)
const allVisiblePermissionNames = computed(() => filteredPermissions.value.map((permission) => permission.name))
const allVisibleSelected = computed(() => allVisiblePermissionNames.value.length > 0 && allVisiblePermissionNames.value.every((name) => form.permissions.includes(name)))

async function loadOptions() {
  try {
    await adminStore.loadPermissions()
  } catch (error) {
    if (error instanceof ApiError) errorMessage.value = error.message
  }
}

async function loadRecord() {
  if (!props.id) return
  loading.value = true
  try {
    const role = await getRole(props.id)
    form.name = role.name
    form.display_name = role.display_name ?? { ar: '', en: '' }
    form.permissions = (role.permissions ?? []).map((permission) => permission.name)
  } finally {
    loading.value = false
  }
}

function togglePermission(permissionName: string) {
  if (!canAssignPermissions.value) return

  form.permissions = form.permissions.includes(permissionName)
    ? form.permissions.filter((name) => name !== permissionName)
    : [...form.permissions, permissionName]
}

function derivePermissionGroup(permissionName: string): string {
  const parts = permissionName.split('-')

  return parts.length > 1 ? parts.slice(1).join(' ') : t('admin.otherPermissions')
}

function setGroupPermissions(items: Permission[], checked: boolean) {
  if (!canAssignPermissions.value) return

  const names = items.map((permission) => permission.name)
  form.permissions = checked
    ? Array.from(new Set([...form.permissions, ...names]))
    : form.permissions.filter((name) => !names.includes(name))
}

function toggleAllVisible() {
  if (!canAssignPermissions.value) return

  form.permissions = allVisibleSelected.value
    ? form.permissions.filter((name) => !allVisiblePermissionNames.value.includes(name))
    : Array.from(new Set([...form.permissions, ...allVisiblePermissionNames.value]))
}

async function submit() {
  saving.value = true
  errors.value = {}
  errorMessage.value = ''

  try {
    if (props.id) {
      await updateRole(props.id, form)
    } else {
      await createRole(form)
    }
    await router.push({ name: 'roles.index' })
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
watch(locale, () => { void adminStore.loadPermissions(true) })
</script>

<template>
  <FormPageLayout
    data-testid="role-form"
    :title="isEdit ? t('admin.editRole') : t('admin.newRole')"
    :description="t('admin.roleFormDescription')"
    :error-message="errorMessage"
    :loading-text="loading ? t('admin.loadingRole') : ''"
    @submit="submit"
  >
    <FormSection :title="t('admin.basicInformation')">
      <div class="grid gap-4 lg:grid-cols-3">
        <FormInput id="role_name" v-model="form.name" :label="t('admin.key')" required :error="errors.name?.[0]" />
        <FormInput id="display_name_ar" v-model="form.display_name.ar" :label="t('admin.displayNameAr')" required :error="errors.display_name?.[0] ?? errors['display_name.ar']?.[0]" />
        <FormInput id="display_name_en" v-model="form.display_name.en" :label="t('admin.displayNameEn')" :error="errors['display_name.en']?.[0]" />
      </div>
    </FormSection>

    <FormSection :title="t('admin.rolePermissions')">
      <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-sm text-text-muted">{{ form.permissions.length }} / {{ totalPermissionCount }} {{ t('admin.selected') }}</p>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            v-model="permissionSearch"
            data-testid="permission-search"
            class="form-control min-w-64"
            type="search"
            :placeholder="t('admin.searchPermissions')"
          />
          <BaseButton
            data-testid="permissions-select-all"
            variant="secondary"
            type="button"
            :disabled="!canAssignPermissions || !allVisiblePermissionNames.length"
            @click="toggleAllVisible"
          >
            {{ allVisibleSelected ? t('admin.clearSelected') : t('admin.selectAllPermissions') }}
          </BaseButton>
        </div>
      </div>

      <div v-if="adminStore.permissionsLoading" class="rounded-[var(--radius-xl)] border border-dashed border-border bg-surface p-6 text-sm text-text-muted">
        {{ t('states.loading') }}
      </div>
      <div v-else-if="!adminStore.permissions.length" class="rounded-[var(--radius-xl)] border border-dashed border-border bg-surface p-6 text-sm text-text-muted">
        {{ t('admin.noPermissionsAvailable') }}
      </div>
      <div v-else class="space-y-4">
        <PermissionGroup
          v-for="(items, group) in groupedPermissions"
          :key="group"
          :title="String(group)"
          :items="items"
          :selected-names="form.permissions"
          :disabled="!canAssignPermissions"
          :select-label="t('admin.selectAll')"
          :clear-label="t('admin.clearGroup')"
          @toggle-permission="togglePermission"
          @set-group="setGroupPermissions"
        />
      </div>
      <p v-if="errors.permissions?.[0]" class="form-error">{{ errors.permissions[0] }}</p>
    </FormSection>

    <template #actions>
      <BaseButton variant="secondary" :to="{ name: 'roles.index' }">{{ t('actions.cancel') }}</BaseButton>
      <BaseButton v-if="canSave" data-testid="role-save" variant="primary" type="submit" :loading="saving">{{ saving ? t('actions.saving') : t('actions.save') }}</BaseButton>
    </template>
  </FormPageLayout>
</template>
