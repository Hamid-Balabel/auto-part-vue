<script setup lang="ts">
import { Plus, Trash2 } from "@lucide/vue";
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import FormInput from "@/components/forms/FormInput.vue";
import BooleanField from "@/components/forms/BooleanField.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import DetailsSection from "@/components/ui/DetailsSection.vue";
import FormPageLayout from "@/components/ui/FormPageLayout.vue";
import { ApiError } from "@/api/http";
import { useResourcePermissions } from "@/composables/useResourcePermissions";
import { useToastStore } from "@/stores/toast";
import { normalizeBoolean } from "@/utils/boolean";
import {
  createProductOption,
  getProductOption,
  updateProductOption,
} from "../api";
import type { ProductOptionPayload, ProductOptionValuePayload } from "../types";

const props = defineProps<{ id?: string }>();
const { t } = useI18n();
const router = useRouter();
const toast = useToastStore();
const permissions = useResourcePermissions("product-option");
const loading = ref(false);
const saving = ref(false);
const errors = ref<Record<string, string[]>>({});
const errorMessage = ref("");
let nextKey = 1;
type ValueRow = ProductOptionValuePayload & { key: number };
const form = reactive<
  Omit<ProductOptionPayload, "values"> & { values: ValueRow[] }
>({
  name: { ar: "", en: "" },
  description: { ar: "", en: "" },
  is_active: true,
  values: [],
});
const isEdit = computed(() => Boolean(props.id));
const canSave = computed(() =>
  isEdit.value ? permissions.canUpdate.value : permissions.canCreate.value,
);

function emptyValue(): ValueRow {
  return {
    key: nextKey++,
    name: { ar: "", en: "" },
    description: { ar: "", en: "" },
    is_active: true,
  };
}

async function loadRecord() {
  if (!props.id) {
    form.values = [emptyValue()];
    return;
  }
  loading.value = true;
  try {
    const option = await getProductOption(props.id);
    form.name = option.translation_name ?? { ar: "", en: "" };
    form.description = option.translation_description ?? { ar: "", en: "" };
    form.is_active = normalizeBoolean(option.is_active, true);
    form.values = (option.values ?? []).map((value) => ({
      id: value.id,
      key: nextKey++,
      name: value.translation_name ?? { ar: "", en: "" },
      description: value.translation_description ?? { ar: "", en: "" },
      is_active: normalizeBoolean(value.is_active, true),
    }));
    if (!form.values.length) form.values.push(emptyValue());
  } finally {
    loading.value = false;
  }
}

async function submit() {
  saving.value = true;
  errors.value = {};
  errorMessage.value = "";
  try {
    const payload: ProductOptionPayload = {
      name: form.name,
      description: form.description,
      is_active: form.is_active,
      values: form.values.map(({ key: _key, ...value }) => value),
    };
    if (props.id) await updateProductOption(props.id, payload);
    else await createProductOption(payload);
    toast.success(t("crud.saved"));
    await router.push({ name: "product-options.index" });
  } catch (error) {
    if (error instanceof ApiError) {
      errors.value = error.errors ?? {};
      errorMessage.value = error.message;
    }
  } finally {
    saving.value = false;
  }
}

onMounted(loadRecord);
</script>

<template>
  <FormPageLayout
    :title="t(isEdit ? 'inventory.editOption' : 'inventory.addOption')"
    :description="t('inventory.optionFormDescription')"
    :error-message="errorMessage"
    :loading-text="loading ? t('common.loading') : ''"
    data-testid="product-option-form"
    @submit="submit"
  >
    <div class="grid gap-5">
      <DetailsSection :title="t('details.mainInformation')"
        ><div class="grid gap-4 md:grid-cols-2">
          <FormInput
            id="option_name_ar"
            v-model="form.name.ar"
            :label="t('dataEntry.nameAr')"
            :error="errors['name.ar']?.[0] ?? errors.name?.[0]"
            required
          /><FormInput
            id="option_name_en"
            v-model="form.name.en"
            :label="t('dataEntry.nameEn')"
            :error="errors['name.en']?.[0]"
          /><FormInput
            id="option_description_ar"
            v-model="form.description.ar"
            :label="t('dataEntry.descriptionAr')"
            :error="errors['description.ar']?.[0]"
          /><FormInput
            id="option_description_en"
            v-model="form.description.en"
            :label="t('dataEntry.descriptionEn')"
            :error="errors['description.en']?.[0]"
          /><BooleanField
            id="option_status"
            v-model="form.is_active"
            class="md:col-span-2"
            :label="t('dataEntry.status')"
            :on-label="t('dataEntry.active')"
            :off-label="t('dataEntry.inactive')"
          /></div
      ></DetailsSection>
      <DetailsSection :title="t('inventory.optionValues')">
        <div class="grid gap-3">
          <div
            v-for="(value, index) in form.values"
            :key="value.id ?? value.key"
            class="grid gap-3 rounded-[var(--radius-lg)] border border-border p-4 md:grid-cols-[1fr_1fr_auto]"
          >
            <FormInput
              :id="`option_value_${value.key}_ar`"
              v-model="value.name.ar"
              :label="t('inventory.valueNameAr')"
              :error="
                errors[`values.${index}.name.ar`]?.[0] ??
                errors[`values.${index}.name`]?.[0]
              "
              required
            /><FormInput
              :id="`option_value_${value.key}_en`"
              v-model="value.name.en"
              :label="t('inventory.valueNameEn')"
              :error="errors[`values.${index}.name.en`]?.[0]"
            /><BaseButton
              v-if="form.values.length > 1"
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
          }}</span
          ><BaseButton
            class="justify-self-start"
            variant="secondary"
            type="button"
            @click="form.values.push(emptyValue())"
            ><Plus class="size-4" />{{
              t("inventory.addOptionValue")
            }}</BaseButton
          >
        </div>
      </DetailsSection>
    </div>
    <template #actions
      ><BaseButton
        variant="secondary"
        :to="{ name: 'product-options.index' }"
        >{{ t("actions.cancel") }}</BaseButton
      ><BaseButton v-if="canSave" type="submit" :loading="saving">{{
        t("actions.save")
      }}</BaseButton></template
    >
  </FormPageLayout>
</template>
