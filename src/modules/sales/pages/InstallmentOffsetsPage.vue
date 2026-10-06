<script setup lang="ts">
import { Eye, RotateCcw } from '@lucide/vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ApiError } from '@/api/http'
import BaseSelect from '@/components/forms/BaseSelect.vue'
import ConfirmDialog from '@/components/modals/ConfirmDialog.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CrudDetailsModal from '@/components/ui/CrudDetailsModal.vue'
import CrudFilterPanel from '@/components/ui/CrudFilterPanel.vue'
import CrudToolbar from '@/components/ui/CrudToolbar.vue'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable.vue'
import DetailsField from '@/components/ui/DetailsField.vue'
import DetailsSection from '@/components/ui/DetailsSection.vue'
import MoneyDisplay from '@/components/ui/MoneyDisplay.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { useCrudList } from '@/composables/useCrudList'
import { usePermissions } from '@/composables/usePermissions'
import { listParties } from '@/modules/inventory/api'
import type { Party } from '@/modules/inventory/types'
import { useToastStore } from '@/stores/toast'
import { createInstallmentOffset, getInstallmentOffset, listInstallmentOffsets, listInstallments, reverseInstallmentOffset } from '../api'
import type { Installment, InstallmentOffset } from '../types'

const { t, locale } = useI18n()
const { can } = usePermissions()
const toast = useToastStore()
const parties = ref<Party[]>([])
const receivables = ref<Installment[]>([])
const payables = ref<Installment[]>([])
const optionsLoading = ref(false)
const formOpen = ref(false)
const saving = ref(false)
const errors = ref<Record<string, string[]>>({})
const reverseTarget = ref<InstallmentOffset | null>(null)
const detailsOpen = ref(false)
const detailsLoading = ref(false)
const detailsError = ref('')
const selectedOffset = ref<InstallmentOffset | null>(null)
const filters = reactive({ party_id: null as number | null, is_reversed: '' })
const appliedFilters = reactive({ ...filters })
const form = reactive({ party_id: null as number | null, receivable_installment_id: null as number | null, payable_installment_id: null as number | null })
const list = useCrudList<InstallmentOffset>({ list: (query) => listInstallmentOffsets({ ...query, ...(appliedFilters.party_id ? { party_id: appliedFilters.party_id } : {}), ...(appliedFilters.is_reversed !== '' ? { is_reversed: appliedFilters.is_reversed } : {}) }) })
const columns = computed<DataTableColumn<InstallmentOffset>[]>(() => [
  { key: 'id', label: t('table.id') }, { key: 'party', label: t('parties.party') }, { key: 'receivable', label: t('offsets.receivable') }, { key: 'payable', label: t('offsets.payable') }, { key: 'amount', label: t('offsets.offsetAmount') }, { key: 'effective_due_date', label: t('offsets.effectiveDueDate') }, { key: 'reversed_at', label: t('offsets.reversedAt') }, { key: 'actions', label: t('table.actions'), align: 'right' },
])
const partyOptions = computed(() => parties.value.map((party) => ({ value: party.id, label: party.name, description: party.phone ?? party.email ?? undefined })))
const reversedOptions = computed(() => [{ value: '', label: t('crud.all') }, { value: 'true', label: t('offsets.reversedOnly') }, { value: 'false', label: t('offsets.unreversedOnly') }])
const installmentOption = (item: Installment) => ({ value: item.id, label: `#${item.id} · ${item.source?.invoice_no ?? ''}`, description: `${t('sales.remainingAmount')}: ${item.remaining_amount ?? item.amount}`, searchText: [item.id, item.source?.invoice_no].filter(Boolean).join(' ') })
const receivableOptions = computed(() => receivables.value.map(installmentOption))
const payableOptions = computed(() => payables.value.map(installmentOption))
const activeFiltersCount = computed(() => Object.values(appliedFilters).filter(Boolean).length)
function formatDate(value?: string | null) { return value ? new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—' }
function cents(value: unknown) { return Math.round(Number(value ?? 0) * 100) }
function selectedReceivable() { return receivables.value.find((i) => i.id === form.receivable_installment_id) }
function selectedPayable() { return payables.value.find((i) => i.id === form.payable_installment_id) }
const preview = computed(() => { const r = cents(selectedReceivable()?.remaining_amount ?? 0); const p = cents(selectedPayable()?.remaining_amount ?? 0); const amount = Math.min(r, p); const residual = Math.abs(r - p); const direction = r > p ? 'receivable' : p > r ? 'payable' : null; const dates = [selectedReceivable()?.due_date, selectedPayable()?.due_date].filter(Boolean).sort(); return { amount: amount / 100, residual: residual / 100, direction, dueDate: dates[dates.length - 1] ?? null } })
async function loadParties() { const response = await listParties({ per_page: -1, is_active: true }); parties.value = (Array.isArray(response) ? response : response.data).filter((p) => p.classifications.includes('customer') && p.classifications.includes('supplier')) }
async function loadInstallmentsForParty(partyId: number | null) { receivables.value = []; payables.value = []; if (!partyId) return; optionsLoading.value = true; try { const [r, p] = await Promise.all([listInstallments({ per_page: -1, party_id: partyId, direction: 'receivable', is_paid: false }), listInstallments({ per_page: -1, party_id: partyId, direction: 'payable', is_paid: false })]); receivables.value = (Array.isArray(r) ? r : r.data).filter((i) => cents(i.remaining_amount ?? 0) > 0); payables.value = (Array.isArray(p) ? p : p.data).filter((i) => cents(i.remaining_amount ?? 0) > 0) } catch (e) { toast.error(e instanceof ApiError ? e.message : t('details.failedToLoad')) } finally { optionsLoading.value = false } }
function applyFilters() { Object.assign(appliedFilters, filters); list.page.value = 1; void list.load() }
function resetFilters() { Object.assign(filters, { party_id: null, is_reversed: '' }); Object.assign(appliedFilters, filters); list.page.value = 1; void list.load() }
async function openForm() { form.party_id = null; form.receivable_installment_id = null; form.payable_installment_id = null; errors.value = {}; formOpen.value = true; optionsLoading.value = true; try { await loadParties() } catch (e) { toast.error(e instanceof ApiError ? e.message : t('details.failedToLoad')) } finally { optionsLoading.value = false } }
async function openDetails(id: number) { detailsOpen.value = true; detailsLoading.value = true; detailsError.value = ''; selectedOffset.value = null; try { selectedOffset.value = await getInstallmentOffset(id) } catch (e) { detailsError.value = e instanceof ApiError ? e.message : t('details.failedToLoad') } finally { detailsLoading.value = false } }
async function reloadAffected() { await Promise.all([list.load(), loadInstallmentsForParty(form.party_id)]) }
async function submit() { if (saving.value || !form.party_id || !form.receivable_installment_id || !form.payable_installment_id) return; saving.value = true; errors.value = {}; try { await createInstallmentOffset({ receivable_installment_id: form.receivable_installment_id, payable_installment_id: form.payable_installment_id }); toast.success(t('crud.saved')); formOpen.value = false; await reloadAffected() } catch (e) { if (e instanceof ApiError) { errors.value = e.errors ?? {}; toast.error(e.message); if (e.statusCode === 409) await reloadAffected() } } finally { saving.value = false } }
async function confirmReverse() { if (!reverseTarget.value) return; try { await list.mutate(async () => { await reverseInstallmentOffset(reverseTarget.value!.id); toast.success(t('offsets.reversed')) }); reverseTarget.value = null; await loadInstallmentsForParty(form.party_id) } catch (e) { if (e instanceof ApiError) { toast.error(e.message); if (e.statusCode === 409) await reloadAffected() } } }
watch(() => form.party_id, (id) => { form.receivable_installment_id = null; form.payable_installment_id = null; void loadInstallmentsForParty(id) })
onMounted(() => { void list.load(); if (parties.value.length === 0) void loadParties() })
</script>
<template>
  <PageHeader :title="t('offsets.title')" :description="t('offsets.description')"><template #actions><BaseButton v-if="can('create-installment-offset')" @click="openForm">{{ t('offsets.create') }}</BaseButton></template></PageHeader>
  <CrudToolbar :search="list.search.value" :loading="list.loading.value" :search-placeholder="t('offsets.search')" @search="list.applySearch" @refresh="list.load" />
  <CrudFilterPanel :active-count="activeFiltersCount" :loading="list.loading.value" @apply="applyFilters" @reset="resetFilters"><BaseSelect id="offset-filter-party" v-model="filters.party_id" :label="t('parties.party')" :options="partyOptions" searchable clearable /><BaseSelect id="offset-filter-reversed" v-model="filters.is_reversed" :label="t('offsets.reversedAt')" :options="reversedOptions" /></CrudFilterPanel>
  <DataTable :columns="columns" :rows="list.rows.value" :loading="list.loading.value"><template #cell-party="{ row }">{{ row.party?.name ?? '—' }}</template><template #cell-receivable="{ row }">#{{ row.receivable_installment_id }}</template><template #cell-payable="{ row }">#{{ row.payable_installment_id }}</template><template #cell-amount="{ value }"><MoneyDisplay :value="value as string" currency="EGP" /></template><template #cell-effective_due_date="{ value }">{{ formatDate(value as string) }}</template><template #cell-reversed_at="{ value }">{{ formatDate(value as string) }}</template><template #cell-actions="{ row }"><div class="inline-flex gap-1"><BaseButton variant="ghost" size="sm" :aria-label="t('actions.view')" :title="t('actions.view')" @click="openDetails(row.id)"><Eye class="size-4" /></BaseButton><BaseButton v-if="can('reverse-installment-offset') && !row.reversed_at" variant="ghost" size="sm" :aria-label="t('offsets.reverse')" :title="t('offsets.reverse')" @click="reverseTarget = row"><RotateCcw class="size-4" /></BaseButton></div></template></DataTable>
  <Pagination v-if="list.pageData.value" :meta="list.pageData.value" @change="list.changePage" />
  <div v-if="formOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-text/55 p-3 backdrop-blur-sm"><form class="w-full max-w-xl rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-elevated" @submit.prevent="submit"><h2 class="text-xl font-bold">{{ t('offsets.create') }}</h2><div class="mt-5 grid gap-4"><BaseSelect id="offset-party" v-model="form.party_id" :label="t('parties.party')" :options="partyOptions" :loading="optionsLoading" :error="errors.party_id?.[0]" searchable required /><BaseSelect id="offset-receivable" v-model="form.receivable_installment_id" :label="t('offsets.receivable')" :options="receivableOptions" :loading="optionsLoading" :disabled="!form.party_id" :error="errors.receivable_installment_id?.[0]" searchable required /><BaseSelect id="offset-payable" v-model="form.payable_installment_id" :label="t('offsets.payable')" :options="payableOptions" :loading="optionsLoading" :disabled="!form.party_id" :error="errors.payable_installment_id?.[0]" searchable required /><div class="rounded-[var(--radius-lg)] border border-border bg-background/70 p-3 text-sm"><p>{{ t('offsets.preview') }}: <MoneyDisplay :value="preview.amount" currency="EGP" /></p><p>{{ t('offsets.residualDirection') }}: {{ preview.direction ? t(`installments.${preview.direction}`) : '—' }} · <MoneyDisplay :value="preview.residual" currency="EGP" /></p><p>{{ t('offsets.effectiveDueDate') }}: {{ formatDate(preview.dueDate) }}</p></div></div><div class="mt-6 flex justify-end gap-2"><BaseButton variant="secondary" type="button" :disabled="saving" @click="formOpen = false">{{ t('actions.cancel') }}</BaseButton><BaseButton type="submit" :loading="saving" :disabled="!form.party_id || !form.receivable_installment_id || !form.payable_installment_id">{{ t('actions.save') }}</BaseButton></div></form></div>
  <CrudDetailsModal :open="detailsOpen" :title="t('offsets.details')" :loading="detailsLoading" :error-message="detailsError" @close="detailsOpen = false"><DetailsSection v-if="selectedOffset" :title="t('details.mainInformation')"><dl class="grid gap-3 md:grid-cols-2"><DetailsField :label="t('parties.party')" :value="selectedOffset.party?.name" /><DetailsField :label="t('offsets.offsetAmount')"><MoneyDisplay :value="selectedOffset.amount" currency="EGP" /></DetailsField><DetailsField :label="t('offsets.receivable')" :value="`#${selectedOffset.receivable_installment_id}`" /><DetailsField :label="t('offsets.payable')" :value="`#${selectedOffset.payable_installment_id}`" /><DetailsField :label="t('offsets.effectiveDueDate')" :value="formatDate(selectedOffset.effective_due_date)" /><DetailsField :label="t('offsets.reversedAt')" :value="formatDate(selectedOffset.reversed_at)" /></dl></DetailsSection></CrudDetailsModal>
  <ConfirmDialog :open="reverseTarget !== null" :title="t('offsets.reverse')" :message="t('offsets.reverseMessage')" :confirm-label="t('offsets.reverse')" @close="reverseTarget = null" @confirm="confirmReverse" />
</template>
