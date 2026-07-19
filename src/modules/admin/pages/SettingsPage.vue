<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SettingsGroup from '@/components/settings/SettingsGroup.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { ApiError } from '@/api/http'
import { useSettingsForm } from '@/composables/useSettingsForm'
import { usePermissions } from '@/composables/usePermissions'
import { listSettings, updateSettings } from '../api'
import type { SettingValue } from '../types'

const { t } = useI18n()
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const { can } = usePermissions()
const canUpdateSettings = can('update-setting')

const form = useSettingsForm()
const groups = form.groups
const values = form.values
const errors = form.errors
const flatSettings = form.flatSettings
const isDirty = form.isDirty

async function load() {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    form.setGroups(await listSettings())
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : t('states.emptyMessage')
  } finally {
    loading.value = false
  }
}

async function submit() {
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  form.clearErrors()

  try {
    await updateSettings(form.payload())
    await load()
    successMessage.value = t('settings.saved')
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message
      form.setApiErrors(error.errors)
    } else {
      errorMessage.value = t('states.emptyMessage')
    }
  } finally {
    saving.value = false
  }
}

function updateValue(id: number, value: SettingValue) {
  form.values[id] = value
  delete form.errors[id]
}

onMounted(load)
</script>

<template>
  <PageHeader :title="t('admin.settingsTitle')" :description="t('admin.settingsDescription')">
    <template #actions>
      <BaseButton variant="outline" :disabled="loading || saving || !isDirty" @click="form.resetAll()">
        {{ t('settings.resetAll') }}
      </BaseButton>
      <BaseButton
        v-if="canUpdateSettings"
        variant="primary"
        :loading="saving"
        :disabled="loading || !flatSettings.length || !isDirty"
        data-testid="settings-save-button"
        @click="submit"
      >
        {{ saving ? t('actions.saving') : t('admin.saveSettings') }}
      </BaseButton>
    </template>
  </PageHeader>

  <div class="space-y-5" data-testid="settings-page">
    <div v-if="errorMessage" class="alert-danger">{{ errorMessage }}</div>
    <div v-if="successMessage" class="rounded-[var(--radius-md)] border border-success/20 bg-success-soft px-4 py-3 text-sm font-medium text-success">
      {{ successMessage }}
    </div>

    <div v-if="loading" class="panel p-6">
      <div class="flex items-center gap-3 text-sm font-medium text-text-muted">
        <span class="size-4 animate-spin rounded-full border-2 border-border border-t-primary"></span>
        {{ t('settings.loading') }}
      </div>
      <div class="mt-5 grid gap-4 md:grid-cols-2">
        <div v-for="index in 6" :key="index" class="h-28 animate-pulse rounded-[var(--radius-lg)] bg-neutral-soft"></div>
      </div>
    </div>

    <div v-else-if="!groups.length" class="panel p-8 text-center">
      <h2 class="text-lg font-bold text-text">{{ t('settings.emptyTitle') }}</h2>
      <p class="mt-2 text-sm text-text-muted">{{ t('settings.emptyMessage') }}</p>
    </div>

    <form v-else class="space-y-6" @submit.prevent="submit">
      <SettingsGroup
        v-for="group in groups"
        :key="group.label"
        :group="group"
        :values="values"
        :errors="errors"
        :disabled="saving || !canUpdateSettings"
        @update:value="updateValue"
        @reset="form.resetSetting"
      />

      <div class="sticky bottom-4 z-20 flex flex-col gap-3 rounded-[var(--radius-xl)] border border-border bg-surface/95 p-4 shadow-elevated backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm text-text-muted">
          {{ flatSettings.length }} {{ t('settings.settingsCount') }}
        </p>
        <div class="flex gap-2">
          <BaseButton variant="outline" type="button" :disabled="saving || !isDirty" @click="form.resetAll()">
            {{ t('settings.resetAll') }}
          </BaseButton>
          <BaseButton v-if="canUpdateSettings" type="submit" :loading="saving" :disabled="loading || !isDirty">
            {{ saving ? t('actions.saving') : t('admin.saveSettings') }}
          </BaseButton>
        </div>
      </div>
    </form>
  </div>
</template>
