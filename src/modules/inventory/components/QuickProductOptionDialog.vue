<script setup lang="ts">
import { Plus, Trash2 } from "@lucide/vue";
import { reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import FormInput from "@/components/forms/FormInput.vue";
import BooleanField from "@/components/forms/BooleanField.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import { ApiError } from "@/api/http";
import { createOptionValue, createProductOption } from "../api";
import type {
  ProductOption,
  ProductOptionValue,
  ProductOptionValuePayload,
} from "../types";

const props = defineProps<{ open: boolean; option?: ProductOption | null }>();
const emit = defineEmits<{
  close: [];
  optionCreated: [option: ProductOption];
  valueCreated: [value: ProductOptionValue];
}>();
const { t } = useI18n();
const saving = ref(false);
const errors = ref<Record<string, string[]>>({});
const errorMessage = ref("");
let nextKey = 1;
type ValueRow = ProductOptionValuePayload & { key: number };
const form = reactive({
  name: { ar: "", en: "" },
  description: { ar: "", en: "" },
  is_active: true,
  values: [] as ValueRow[],
});

function emptyValue(): ValueRow {
  return {
    key: nextKey++,
    name: { ar: "", en: "" },
    description: { ar: "", en: "" },
    is_active: true,
  };
}

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    Object.assign(form, {
      name: { ar: "", en: "" },
      description: { ar: "", en: "" },
      is_active: true,
    });
    form.values = [emptyValue()];
    errors.value = {};
    errorMessage.value = "";
  },
);

async function submit() {
  saving.value = true;
  errors.value = {};
  errorMessage.value = "";
  try {
    if (props.option) {
      const row = form.values[0];
      const value = await createOptionValue({
        name: row.name,
        description: row.description,
        is_active: row.is_active,
        product_option_id: props.option.id,
      });
      emit("valueCreated", {
        ...value,
        product_option_id: props.option.id,
        product_option: props.option,
      });
    } else {
      const option = await createProductOption({
        name: form.name,
        description: form.description,
        is_active: form.is_active,
        values: form.values.map(({ key: _key, ...value }) => value),
      });
      emit("optionCreated", option);
    }
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
      class="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-text/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      :aria-label="
        t(option ? 'inventory.addOptionValue' : 'inventory.quickAddOption')
      "
    >
      <form
        class="my-auto w-full max-w-2xl rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-elevated"
        @submit.prevent="submit"
      >
        <h2 class="text-lg font-bold text-text">
          {{
            t(
              option
                ? "inventory.addValueToOption"
                : "inventory.quickAddOption",
              { option: option?.name },
            )
          }}
        </h2>
        <p
          v-if="errorMessage"
          class="mt-3 rounded-[var(--radius-md)] bg-danger/10 p-3 text-sm text-danger"
        >
          {{ errorMessage }}
        </p>
        <div v-if="!option" class="mt-4 grid gap-4 sm:grid-cols-2">
          <FormInput
            id="quick_option_name_ar"
            v-model="form.name.ar"
            :label="t('dataEntry.nameAr')"
            :error="errors['name.ar']?.[0] ?? errors.name?.[0]"
            required
          />
          <FormInput
            id="quick_option_name_en"
            v-model="form.name.en"
            :label="t('dataEntry.nameEn')"
            :error="errors['name.en']?.[0]"
          />
        </div>
        <div class="mt-5 grid gap-3">
          <div class="flex items-center justify-between gap-3">
            <span class="form-label">{{ t("inventory.optionValues") }}</span>
            <BaseButton
              v-if="!option"
              variant="ghost"
              size="sm"
              type="button"
              @click="form.values.push(emptyValue())"
              ><Plus class="size-4" />{{
                t("inventory.addOptionValue")
              }}</BaseButton
            >
          </div>
          <div
            v-for="(value, index) in form.values"
            :key="value.key"
            class="grid gap-3 rounded-[var(--radius-lg)] border border-border p-3 sm:grid-cols-[1fr_1fr_auto]"
          >
            <FormInput
              :id="`quick_value_${value.key}_ar`"
              v-model="value.name.ar"
              :label="t('inventory.valueNameAr')"
              :error="
                errors[`values.${index}.name.ar`]?.[0] ??
                errors[`values.${index}.name`]?.[0] ??
                (option ? errors['name.ar']?.[0] : undefined)
              "
              required
            />
            <FormInput
              :id="`quick_value_${value.key}_en`"
              v-model="value.name.en"
              :label="t('inventory.valueNameEn')"
              :error="
                errors[`values.${index}.name.en`]?.[0] ??
                (option ? errors['name.en']?.[0] : undefined)
              "
            />
            <BaseButton
              v-if="!option && form.values.length > 1"
              class="self-end"
              variant="ghost"
              size="sm"
              type="button"
              :aria-label="t('actions.delete')"
              @click="form.values.splice(index, 1)"
              ><Trash2 class="size-4 text-danger"
            /></BaseButton>
          </div>
          <span v-if="errors.values?.[0]" class="form-error">{{
            errors.values[0]
          }}</span>
          <BooleanField
            v-if="option"
            id="quick_value_status"
            v-model="form.values[0].is_active"
            :label="t('dataEntry.status')"
            :on-label="t('dataEntry.active')"
            :off-label="t('dataEntry.inactive')"
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
