<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import FormInput from '@/components/forms/FormInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher.vue'
import { ApiError } from '@/api/http'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

const form = reactive({
  email: '',
  password: '',
})

const errors = ref<Record<string, string[]>>({})
const errorMessage = ref('')

const redirectTo = computed(() => String(route.query.redirect ?? '/'))

async function submit() {
  errors.value = {}
  errorMessage.value = ''

  try {
    await auth.login({
      email: form.email,
      password: form.password,
    })
    await router.push(redirectTo.value)
  } catch (error) {
    if (error instanceof ApiError) {
      errors.value = error.errors ?? {}
      errorMessage.value = error.message
      return
    }

    errorMessage.value = t('auth.genericError')
  }
}
</script>

<template>
  <main class="grid min-h-screen bg-text lg:grid-cols-[1.08fr_0.92fr]">
    <section class="nav-shell hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div class="inline-flex w-fit rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-secondary-soft shadow-sm backdrop-blur">{{ t('auth.badge') }}</div>
      <div>
        <h1 class="max-w-xl text-5xl font-bold tracking-tight">{{ t('auth.title') }}</h1>
        <p class="mt-5 max-w-lg text-base leading-7 text-white/70">{{ t('auth.subtitle') }}</p>
      </div>
      <p class="text-sm text-white/55">{{ t('auth.footer') }}</p>
    </section>

    <section class="flex items-center justify-center bg-[linear-gradient(135deg,var(--color-background),var(--color-surface)_55%,var(--color-secondary-soft))] p-6">
      <form data-testid="login-form" class="w-full max-w-md rounded-[2rem] border border-border bg-surface/95 p-8 shadow-soft backdrop-blur" @submit.prevent="submit">
        <div class="mb-7 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.25em] text-secondary-hover">{{ t('auth.loginLabel') }}</p>
          <h2 class="mt-3 text-3xl font-bold text-text">{{ t('auth.welcome') }}</h2>
          <p class="mt-2 text-sm leading-6 text-text-muted">{{ t('auth.description') }}</p>
        </div>

        <div v-if="errorMessage" class="alert-danger mt-6">
          {{ errorMessage }}
        </div>

        <div class="mt-6 space-y-4">
          <FormInput id="email" v-model="form.email" data-testid="login-email" :label="t('auth.email')" type="email" autocomplete="username" required :error="errors.email?.[0]" />
          <FormInput id="password" v-model="form.password" data-testid="login-password" :label="t('auth.password')" type="password" autocomplete="current-password" required :error="errors.password?.[0]" />
        </div>

        <BaseButton data-testid="login-submit" class="mt-6" variant="primary" type="submit" full-width :loading="auth.loading">
          {{ auth.loading ? t('actions.signingIn') : t('actions.signIn') }}
        </BaseButton>
      </form>
    </section>
  </main>
</template>
