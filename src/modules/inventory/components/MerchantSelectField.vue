<script setup lang="ts">
import { Plus } from "@lucide/vue";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import SearchableSelectInput, {
  type SearchableSelectOption,
} from "@/components/forms/SearchableSelectInput.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import QuickMerchantDialog from "./QuickMerchantDialog.vue";
import type { Merchant } from "../types";

const props = defineProps<{
  id: string;
  modelValue?: number | null;
  merchants: Merchant[];
  loading?: boolean;
  error?: string;
  canCreate?: boolean;
}>();
const emit = defineEmits<{
  "update:modelValue": [value: number | null];
  created: [merchant: Merchant];
}>();
const { t } = useI18n();
const dialogOpen = ref(false);
const options = computed<SearchableSelectOption<number>[]>(() =>
  props.merchants.map((merchant) => ({
    label: merchant.name,
    value: merchant.id,
    description: merchant.email ?? merchant.phone ?? undefined,
    searchText: [merchant.name, merchant.email, merchant.phone]
      .filter(Boolean)
      .join(" "),
  })),
);

function created(merchant: Merchant) {
  emit("created", merchant);
  emit("update:modelValue", merchant.id);
  dialogOpen.value = false;
}
</script>

<template>
  <div class="grid gap-2">
    <SearchableSelectInput
      :id="id"
      :model-value="modelValue"
      :label="t('inventory.merchant')"
      :options="options"
      :placeholder="t('inventory.selectMerchant')"
      :search-placeholder="t('inventory.searchMerchants')"
      :empty-text="t('states.emptyTitle')"
      :loading="loading"
      :error="error"
      clearable
      @update:model-value="emit('update:modelValue', $event as number | null)"
    />
    <BaseButton
      v-if="canCreate"
      class="justify-self-start"
      variant="ghost"
      size="sm"
      type="button"
      @click="dialogOpen = true"
    >
      <Plus class="size-4" />{{ t("inventory.quickAddMerchant") }}
    </BaseButton>
    <QuickMerchantDialog
      :open="dialogOpen"
      @close="dialogOpen = false"
      @created="created"
    />
  </div>
</template>
