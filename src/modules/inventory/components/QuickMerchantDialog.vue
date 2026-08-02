<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import FormInput from "@/components/forms/FormInput.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import { ApiError } from "@/api/http";
import { createMerchant } from "../api";
import type { Merchant, MerchantPayload } from "../types";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: []; created: [merchant: Merchant] }>();
const { t } = useI18n();
const saving = ref(false);
const errors = ref<Record<string, string[]>>({});
const errorMessage = ref("");
const form = reactive<MerchantPayload>({
  name: "",
  email: "",
  phone: "",
  is_active: true,
});

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    Object.assign(form, { name: "", email: "", phone: "", is_active: true });
    errors.value = {};
    errorMessage.value = "";
  },
);

async function submit() {
  saving.value = true;
  errors.value = {};
  errorMessage.value = "";
  try {
    const merchant = await createMerchant({
      ...form,
      email: form.email || null,
      phone: form.phone || null,
    });
    emit("created", merchant);
  } catch (error) {
    if (error instanceof ApiError) {
      errors.value = error.errors ?? {};
      errorMessage.value = error.message;
    }
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[70] grid place-items-center bg-text/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      :aria-label="t('inventory.quickAddMerchant')"
    >
      <form
        class="w-full max-w-lg rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-elevated"
        @submit.prevent="submit"
      >
        <h2 class="text-lg font-bold text-text">
          {{ t("inventory.quickAddMerchant") }}
        </h2>
        <p class="mt-1 text-sm text-text-muted">
          {{ t("inventory.quickMerchantDescription") }}
        </p>
        <p
          v-if="errorMessage"
          class="mt-3 rounded-[var(--radius-md)] bg-danger/10 p-3 text-sm text-danger"
        >
          {{ errorMessage }}
        </p>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <FormInput
            id="quick_merchant_name"
            v-model="form.name"
            class="sm:col-span-2"
            :label="t('admin.name')"
            :error="errors.name?.[0]"
            required
          />
          <FormInput
            id="quick_merchant_email"
            v-model="form.email"
            :label="t('admin.email')"
            type="email"
            :error="errors.email?.[0]"
          />
          <FormInput
            id="quick_merchant_phone"
            v-model="form.phone"
            :label="t('admin.phone')"
            :error="errors.phone?.[0]"
          />
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <BaseButton
            variant="secondary"
            type="button"
            :disabled="saving"
            @click="emit('close')"
            >{{ t("actions.cancel") }}</BaseButton
          >
          <BaseButton type="submit" :loading="saving">{{
            t("actions.save")
          }}</BaseButton>
        </div>
      </form>
    </div>
  </Teleport>
</template>
