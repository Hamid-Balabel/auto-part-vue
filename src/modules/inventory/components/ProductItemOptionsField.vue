<script setup lang="ts">
import { Plus } from "@lucide/vue";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import BaseSelect from "@/components/forms/BaseSelect.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import QuickProductOptionDialog from "./QuickProductOptionDialog.vue";
import type { ProductOption, ProductOptionValue } from "../types";

const props = defineProps<{
  id: string;
  modelValue: number[];
  options: ProductOption[];
  values: ProductOptionValue[];
  canCreateOption?: boolean;
  canCreateValue?: boolean;
  error?: string;
}>();
const emit = defineEmits<{
  "update:modelValue": [value: number[]];
  optionCreated: [option: ProductOption];
  valueCreated: [value: ProductOptionValue];
}>();
const { t } = useI18n();
const dialogOpen = ref(false);
const targetOption = ref<ProductOption | null>(null);

const groups = computed(() =>
  props.options
    .map((option) => ({
      id: option.id,
      label: displayName(option),
      option,
      values: (option.values?.length
        ? option.values
        : props.values.filter(
            (value) =>
              value.product_option_id === option.id ||
              value.product_option?.id === option.id ||
              value.productOption?.id === option.id,
          )
      ).filter((value) => value.is_active !== false),
    }))
    .filter((group) => group.values.length || props.canCreateValue),
);

function displayName(
  record?: {
    name?: string | null;
    translation_name?: { ar?: string | null; en?: string | null };
  } | null,
) {
  return (
    record?.name ??
    record?.translation_name?.ar ??
    record?.translation_name?.en ??
    "—"
  );
}

function selected(group: { values: ProductOptionValue[] }) {
  const ids = new Set(group.values.map((value) => value.id));
  return props.modelValue.filter((id) => ids.has(id));
}

function updateGroup(group: { values: ProductOptionValue[] }, value: number[]) {
  const ids = new Set(group.values.map((item) => item.id));
  emit("update:modelValue", [
    ...props.modelValue.filter((id) => !ids.has(id)),
    ...value,
  ]);
}

function openValue(option: ProductOption) {
  targetOption.value = option;
  dialogOpen.value = true;
}

function optionCreated(option: ProductOption) {
  emit("optionCreated", option);
  const firstValue = option.values?.[0];
  if (firstValue)
    emit("update:modelValue", [...props.modelValue, firstValue.id]);
  dialogOpen.value = false;
}

function valueCreated(value: ProductOptionValue) {
  emit("valueCreated", value);
  emit("update:modelValue", [...props.modelValue, value.id]);
  dialogOpen.value = false;
}
</script>

<template>
  <div class="grid gap-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <span class="form-label">{{ t("inventory.optionValues") }}</span>
      <BaseButton
        v-if="canCreateOption"
        variant="ghost"
        size="sm"
        type="button"
        @click="
          targetOption = null;
          dialogOpen = true;
        "
        ><Plus class="size-4" />{{ t("inventory.quickAddOption") }}</BaseButton
      >
    </div>
    <div v-if="groups.length" class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="group in groups" :key="group.id" class="grid gap-1.5">
        <BaseSelect
          :id="`${id}_${group.id}`"
          :model-value="selected(group)"
          :label="group.label"
          :options="
            group.values.map((value) => ({
              value: value.id,
              label: displayName(value),
            }))
          "
          :empty-text="t('inventory.noOptionValues')"
          multiple
          searchable
          clearable
          @update:model-value="updateGroup(group, $event as number[])"
        />
        <BaseButton
          v-if="canCreateValue"
          class="justify-self-start"
          variant="ghost"
          size="sm"
          type="button"
          @click="openValue(group.option)"
          ><Plus class="size-4" />{{
            t("inventory.addOptionValue")
          }}</BaseButton
        >
      </div>
    </div>
    <p
      v-else
      class="rounded-[var(--radius-lg)] border border-dashed border-border p-4 text-sm text-text-muted"
    >
      {{ t("inventory.noOptions") }}
    </p>
    <span v-if="error" class="form-error">{{ error }}</span>
    <QuickProductOptionDialog
      :open="dialogOpen"
      :option="targetOption"
      @close="dialogOpen = false"
      @option-created="optionCreated"
      @value-created="valueCreated"
    />
  </div>
</template>
