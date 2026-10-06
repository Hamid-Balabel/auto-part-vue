<script setup lang="ts">
import { CreditCard, Edit3, Trash2 } from '@lucide/vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ApiError } from '@/api/http'
import ConfirmDialog from '@/components/modals/ConfirmDialog.vue'
import BaseSelect from '@/components/forms/BaseSelect.vue'
import DateInput from '@/components/forms/DateInput.vue'
import FormInput from '@/components/forms/FormInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CrudDetailsModal from '@/components/ui/CrudDetailsModal.vue'
import CrudFilterPanel from '@/components/ui/CrudFilterPanel.vue'
import CrudShowButton from '@/components/ui/CrudShowButton.vue'
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
import { createInstallment, deleteInstallment, getInstallment, listInstallments, listOrders, listPurchases, payInstallment, updateInstallment } from '../api'
import SalesStatusBadge from '../components/SalesStatusBadge.vue'
import type { Installment, InstallmentListQuery, InstallmentStatus, Order, PaymentMethod, Purchase } from '../types'

type SourceType = 'order' | 'purchase'
type DirectionTab = '' | 'receivable' | 'payable'
const { t, locale } = useI18n()
const { can } = usePermissions()
const toast = useToastStore()
const parties = ref<Party[]>([])
const orders = ref<Order[]>([])
const purchases = ref<Purchase[]>([])
const optionsLoading = ref(false)
const detailsOpen = ref(false)
const detailsLoading = ref(false)
const detailsError = ref('')
const selectedInstallment = ref<Installment | null>(null)
const deleteTarget = ref<Installment | null>(null)
const formMode = ref<'create' | 'edit' | 'pay' | null>(null)
const formTarget = ref<Installment | null>(null)
const formLoading = ref(false)
const formErrors = ref<Record<string, string[]>>({})
interface Filters { source_type: SourceType | ''; source_id: number | null; party_id: number | null; direction: DirectionTab; status: InstallmentStatus | null; payment_method: PaymentMethod | null; amount_min: string; amount_max: string; due_date_from: string; due_date_to: string; paid_at_from: string; paid_at_to: string; is_paid: string }
const emptyFilters = (): Filters => ({ source_type: '', source_id: null, party_id: null, direction: '', status: null, payment_method: null, amount_min: '', amount_max: '', due_date_from: '', due_date_to: '', paid_at_from: '', paid_at_to: '', is_paid: '' })
const filters = reactive<Filters>(emptyFilters())
const appliedFilters = ref<Filters>(emptyFilters())
const installmentForm = reactive({ source_type: 'order' as SourceType, source_id: null as number | null, amount: '', due_date: '', status: 'pending' as InstallmentStatus, payment_method: 'cash' as PaymentMethod })
const list = useCrudList<Installment>({ list: (query) => listInstallments({ ...query, ...toFilterQuery(appliedFilters.value) }), defaultSortColumn: 'id', defaultSortDirection: 'desc' })
const columns = computed<DataTableColumn<Installment>[]>(() => [
  { key: 'id', label: t('table.id'), sortable: true }, { key: 'party', label: t('parties.party') }, { key: 'direction', label: t('installments.direction') }, { key: 'source', label: t('installments.source') }, { key: 'amount', label: t('sales.installmentAmount'), sortable: true }, { key: 'remaining_amount', label: t('sales.remainingAmount') }, { key: 'due_date', label: t('sales.dueDate'), sortable: true }, { key: 'status', label: t('table.status'), sortable: true }, { key: 'actions', label: t('table.actions'), align: 'right' },
])
const statusOptions = computed(() => (['pending', 'partial', 'paid', 'overdue'] as InstallmentStatus[]).map((value) => ({ value, label: t(`sales.statuses.${value}`) })))
const editableStatusOptions = computed(() => [{ value: 'pending', label: t('sales.statuses.pending') }])
const paymentMethodOptions = computed(() => (['cash', 'card', 'transfer'] as PaymentMethod[]).map((value) => ({ value, label: t(`sales.paymentMethods.${value}`) })))
const sourceTypeOptions = computed(() => [{ value: '', label: t('crud.all') }, { value: 'order', label: t('sales.order') }, { value: 'purchase', label: t('purchases.details') }])
const createSourceTypeOptions = computed(() => sourceTypeOptions.value.filter((o) => o.value))
const sourceOptions = computed(() => installmentForm.source_type === 'purchase' ? purchases.value.map((p) => ({ value: p.id, label: p.invoice_no ?? `#${p.id}`, description: p.party?.name })) : orders.value.map((o) => ({ value: o.id, label: o.invoice_no, description: o.party?.name ?? o.customer?.name })))
const filterSourceOptions = computed(() => filters.source_type === 'purchase' ? purchases.value.map((p) => ({ value: p.id, label: p.invoice_no ?? `#${p.id}` })) : filters.source_type === 'order' ? orders.value.map((o) => ({ value: o.id, label: o.invoice_no })) : [])
const partyOptions = computed(() => parties.value.map((p) => ({ value: p.id, label: p.name, description: p.phone ?? p.email ?? undefined, searchText: [p.name, p.phone, p.email].filter(Boolean).join(' ') })))
const paidOptions = computed(() => [{ value: '', label: t('crud.all') }, { value: 'true', label: t('crud.yes') }, { value: 'false', label: t('crud.no') }])
const directionTabs = computed(() => [{ value: '', label: t('crud.all') }, { value: 'receivable', label: t('installments.receivable') }, { value: 'payable', label: t('installments.payable') }])
const activeFilterCount = computed(() => Object.values(appliedFilters.value).filter((v) => v !== '' && v !== null).length)
function toFilterQuery(value: Filters): InstallmentListQuery { const q = Object.fromEntries(Object.entries(value).filter(([, v]) => v !== '' && v !== null)) as InstallmentListQuery; if (value.is_paid !== '') q.is_paid = value.is_paid === 'true'; return q }
function fieldError(field: string) { return formErrors.value[field]?.[0] }
function cents(value: unknown) { return Math.round(Number(value ?? 0) * 100) }
function outstanding(row: Installment) { return cents(row.remaining_amount ?? row.amount) > 0 }
function isUnsettledPending(row: Installment) { return row.status === 'pending' && cents(row.settled_amount ?? 0) === 0 }
function sourceId(row: Installment) { return row.source_id ?? row.order_id ?? row.purchase_id ?? null }
function sourceLabel(row: Installment) { return row.source?.invoice_no ?? (sourceId(row) ? `#${sourceId(row)}` : '—') }
function sourceRoute(row: Installment) { const id = sourceId(row); if (!id) return undefined; return row.source_type === 'purchase' ? { name: 'purchases.show', params: { id } } : { name: 'orders.show', params: { id } } }
function formatDate(value?: string | null, withTime = false) { return value ? new Intl.DateTimeFormat(locale.value, withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(new Date(value)) : '—' }
function applyTab(direction: DirectionTab) { filters.direction = direction; appliedFilters.value = { ...filters }; list.page.value = 1; void list.load() }
function applyFilters() { appliedFilters.value = { ...filters }; list.page.value = 1; void list.load() }
function resetFilters() { Object.assign(filters, emptyFilters()); appliedFilters.value = emptyFilters(); list.page.value = 1; void list.load() }
async function loadOptions() { optionsLoading.value = true; try { const [partyResponse, orderResponse, purchaseResponse] = await Promise.all([listParties({ per_page: -1, is_active: true }), listOrders({ per_page: -1 }), listPurchases({ per_page: -1 })]); parties.value = Array.isArray(partyResponse) ? partyResponse : partyResponse.data; orders.value = Array.isArray(orderResponse) ? orderResponse : orderResponse.data; purchases.value = Array.isArray(purchaseResponse) ? purchaseResponse : purchaseResponse.data } catch (e) { toast.error(e instanceof ApiError ? e.message : t('sales.optionsLoadFailed')) } finally { optionsLoading.value = false } }
async function openDetails(id: number) { detailsOpen.value = true; detailsLoading.value = true; detailsError.value = ''; selectedInstallment.value = null; try { selectedInstallment.value = await getInstallment(id) } catch (e) { detailsError.value = e instanceof ApiError ? e.message : t('details.failedToLoad') } finally { detailsLoading.value = false } }
function closeDetails() { detailsOpen.value = false; selectedInstallment.value = null; detailsError.value = '' }
function openCreate() { formTarget.value = null; Object.assign(installmentForm, { source_type: 'order', source_id: null, amount: '', due_date: '', status: 'pending', payment_method: 'cash' }); formErrors.value = {}; formMode.value = 'create' }
function openEdit(row: Installment) { formTarget.value = row; Object.assign(installmentForm, { source_type: (row.source_type === 'purchase' ? 'purchase' : 'order'), source_id: sourceId(row), amount: String(row.amount), due_date: row.due_date?.slice(0, 10) ?? '', status: 'pending', payment_method: row.payment_method }); formErrors.value = {}; formMode.value = 'edit' }
function openPay(row: Installment) { formTarget.value = row; Object.assign(installmentForm, { source_type: (row.source_type === 'purchase' ? 'purchase' : 'order'), source_id: sourceId(row), amount: String(row.remaining_amount ?? row.amount), due_date: row.due_date?.slice(0, 10) ?? '', status: row.status, payment_method: row.payment_method }); formErrors.value = {}; formMode.value = 'pay' }
function closeForm() { if (formLoading.value) return; formMode.value = null; formTarget.value = null; formErrors.value = {} }
async function submitForm() { if (formLoading.value) return; formLoading.value = true; formErrors.value = {}; try { if (formMode.value === 'pay' && formTarget.value) { await payInstallment(formTarget.value.id, { amount: formTarget.value.remaining_amount ?? formTarget.value.amount, payment_method: installmentForm.payment_method }); toast.success(t('sales.installmentPaid')) } else if (formMode.value === 'edit' && formTarget.value) { await updateInstallment(formTarget.value.id, { amount: installmentForm.amount, due_date: installmentForm.due_date || null, status: 'pending', payment_method: installmentForm.payment_method }); toast.success(t('crud.saved')) } else if (formMode.value === 'create' && installmentForm.source_id) { await createInstallment({ source_type: installmentForm.source_type, source_id: installmentForm.source_id, amount: installmentForm.amount, due_date: installmentForm.due_date || null, status: installmentForm.status, payment_method: installmentForm.payment_method }); toast.success(t('crud.saved')) } else return; formMode.value = null; formTarget.value = null; await list.load() } catch (e) { if (e instanceof ApiError) { formErrors.value = e.errors ?? {}; toast.error(e.message) } else toast.error(t('sales.installmentSaveFailed')) } finally { formLoading.value = false } }
async function confirmDelete() { if (!deleteTarget.value) return; try { await list.mutate(async () => { await deleteInstallment(deleteTarget.value!.id); toast.success(t('crud.deleted')) }); deleteTarget.value = null } catch (e) { toast.error(e instanceof ApiError ? e.message : t('sales.installmentDeleteFailed')) } }
onMounted(() => { void list.load(); void loadOptions() })
</script>
<template>
  <PageHeader :title="t('sales.installmentsTitle')" :description="t('sales.installmentsDescription')"><template #actions><BaseButton v-if="can('create-installment')" @click="openCreate">{{ t('sales.createInstallment') }}</BaseButton></template></PageHeader>
  <div class="mb-4 flex flex-wrap gap-2"><BaseButton v-for="tab in directionTabs" :key="tab.value" type="button" :variant="filters.direction === tab.value ? 'primary' : 'secondary'" @click="applyTab(tab.value as DirectionTab)">{{ tab.label }}</BaseButton></div>
  <CrudToolbar :search="list.search.value" :loading="list.loading.value" :search-placeholder="t('sales.searchInstallments')" @search="list.applySearch" @refresh="list.load" />
  <CrudFilterPanel :active-count="activeFilterCount" :loading="list.loading.value" @apply="applyFilters" @reset="resetFilters">
    <BaseSelect id="installment-source-type-filter" v-model="filters.source_type" :label="t('installments.sourceType')" :options="sourceTypeOptions" />
    <BaseSelect id="installment-source-filter" v-model="filters.source_id" :label="t('installments.source')" :options="filterSourceOptions" :disabled="!filters.source_type" searchable clearable />
    <BaseSelect id="installment-party-filter" v-model="filters.party_id" :label="t('parties.party')" :options="partyOptions" :loading="optionsLoading" searchable clearable />
    <BaseSelect id="installment-status-filter" v-model="filters.status" :label="t('table.status')" :options="statusOptions" clearable />
    <BaseSelect id="installment-method-filter" v-model="filters.payment_method" :label="t('sales.paymentMethod')" :options="paymentMethodOptions" clearable />
    <FormInput id="installment-amount-min" v-model="filters.amount_min" type="number" :label="t('sales.amountMin')" />
    <FormInput id="installment-amount-max" v-model="filters.amount_max" type="number" :label="t('sales.amountMax')" />
    <DateInput id="installment-due-from" v-model="filters.due_date_from" :label="t('sales.dueDateFrom')" />
    <DateInput id="installment-due-to" v-model="filters.due_date_to" :label="t('sales.dueDateTo')" />
    <DateInput id="installment-paid-from" v-model="filters.paid_at_from" :label="t('sales.paidAtFrom')" />
    <DateInput id="installment-paid-to" v-model="filters.paid_at_to" :label="t('sales.paidAtTo')" />
    <BaseSelect id="installment-is-paid" v-model="filters.is_paid" :label="t('sales.isPaid')" :options="paidOptions" />
  </CrudFilterPanel>
  <DataTable :columns="columns" :rows="list.rows.value" :loading="list.loading.value" :sort-column="list.sortColumn.value" :sort-direction="list.sortDirection.value" @sort="list.sortBy">
    <template #cell-party="{ row }"><div><p class="font-semibold truncate">{{ row.party?.name ?? '—' }}</p><p class="text-xs text-text-muted">{{ row.party?.phone ?? row.party?.email ?? '' }}</p></div></template>
    <template #cell-direction="{ value }">{{ value ? t(`installments.${value}`) : '—' }}</template>
    <template #cell-source="{ row }"><BaseButton v-if="sourceRoute(row)" variant="link" :to="sourceRoute(row)">{{ sourceLabel(row) }}</BaseButton><span v-else>{{ sourceLabel(row) }}</span></template>
    <template #cell-amount="{ value }"><MoneyDisplay :value="value as string" currency="EGP" /></template>
    <template #cell-remaining_amount="{ value }"><MoneyDisplay :value="value as string" currency="EGP" /></template>
    <template #cell-due_date="{ value }">{{ formatDate(value as string) }}</template>
    <template #cell-status="{ value }"><SalesStatusBadge :value="String(value)" /></template>
    <template #cell-actions="{ row }"><div class="inline-flex items-center justify-end gap-1.5"><CrudShowButton @click="openDetails(row.id)" /><BaseButton v-if="can('update-installment') && outstanding(row)" variant="outline" size="sm" :aria-label="t('sales.payInstallment')" :title="t('sales.payInstallment')" @click="openPay(row)"><CreditCard class="size-4" /></BaseButton><BaseButton v-if="can('update-installment') && isUnsettledPending(row)" variant="ghost" size="sm" :aria-label="t('actions.edit')" :title="t('actions.edit')" @click="openEdit(row)"><Edit3 class="size-4" /></BaseButton><BaseButton v-if="can('delete-installment') && isUnsettledPending(row)" variant="danger" size="sm" :aria-label="t('actions.delete')" :title="t('actions.delete')" @click="deleteTarget = row"><Trash2 class="size-4" /></BaseButton></div></template>
  </DataTable>
  <Pagination v-if="list.pageData.value" :meta="list.pageData.value" @change="list.changePage" />
  <CrudDetailsModal :open="detailsOpen" :title="t('sales.installmentDetails')" :subtitle="selectedInstallment ? sourceLabel(selectedInstallment) : undefined" :loading="detailsLoading" :error-message="detailsError" @close="closeDetails"><DetailsSection v-if="selectedInstallment" :title="t('details.mainInformation')"><dl class="grid gap-3 md:grid-cols-2 lg:grid-cols-3"><DetailsField :label="t('table.id')" :value="selectedInstallment.id" /><DetailsField :label="t('parties.party')" :value="selectedInstallment.party?.name" /><DetailsField :label="t('installments.direction')" :value="selectedInstallment.direction ? t(`installments.${selectedInstallment.direction}`) : '—'" /><DetailsField :label="t('installments.source')" :value="sourceLabel(selectedInstallment)" /><DetailsField :label="t('sales.installmentAmount')"><MoneyDisplay :value="selectedInstallment.amount" currency="EGP" /></DetailsField><DetailsField :label="t('installments.settledAmount')"><MoneyDisplay :value="selectedInstallment.settled_amount ?? 0" currency="EGP" /></DetailsField><DetailsField :label="t('sales.remainingAmount')"><MoneyDisplay :value="selectedInstallment.remaining_amount ?? selectedInstallment.amount" currency="EGP" /></DetailsField><DetailsField :label="t('sales.dueDate')" :value="formatDate(selectedInstallment.due_date)" /><DetailsField :label="t('sales.paymentDate')" :value="formatDate(selectedInstallment.paid_at, true)" /><DetailsField :label="t('sales.paymentMethod')" :value="selectedInstallment.payment_method ? t(`sales.paymentMethods.${selectedInstallment.payment_method}`) : '—'" /><DetailsField :label="t('table.status')"><SalesStatusBadge :value="selectedInstallment.status" /></DetailsField><DetailsField :label="t('sales.createdBy')" :value="selectedInstallment.creator?.name ?? selectedInstallment.creator?.email" /></dl></DetailsSection></CrudDetailsModal>
  <div v-if="formMode" class="fixed inset-0 z-50 flex items-center justify-center bg-text/55 p-3 backdrop-blur-sm" role="dialog" aria-modal="true"><form class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-elevated sm:p-6" @submit.prevent="submitForm"><h2 class="text-xl font-bold">{{ formMode === 'edit' ? t('sales.editInstallment') : formMode === 'pay' ? t('sales.payInstallment') : t('sales.createInstallment') }}</h2><p v-if="formMode === 'pay'" class="mt-2 text-sm text-text-muted">{{ t('sales.exactInstallmentPaymentHint') }}</p><div class="mt-5 grid gap-4 md:grid-cols-2"><BaseSelect id="installment-source-type" v-model="installmentForm.source_type" :label="t('installments.sourceType')" :options="createSourceTypeOptions" :disabled="formMode !== 'create'" :error="fieldError('source_type')" required /><BaseSelect id="installment-source" v-model="installmentForm.source_id" :label="t('installments.source')" :options="sourceOptions" :loading="optionsLoading" :disabled="formMode !== 'create'" :error="fieldError('source_id')" searchable required /><FormInput id="installment-amount" v-model="installmentForm.amount" type="number" step="0.01" :label="t('sales.installmentAmount')" :readonly="formMode === 'pay'" :error="fieldError('amount')" required /><DateInput v-if="formMode !== 'pay'" id="installment-due-date" v-model="installmentForm.due_date" :label="t('sales.dueDate')" :error="fieldError('due_date')" /><BaseSelect v-if="formMode !== 'pay'" id="installment-status" v-model="installmentForm.status" :label="t('table.status')" :options="formMode === 'edit' ? editableStatusOptions : statusOptions.filter((option) => option.value === 'pending' || option.value === 'paid')" :error="fieldError('status')" required /><BaseSelect id="installment-method" v-model="installmentForm.payment_method" :label="t('sales.paymentMethod')" :options="paymentMethodOptions" :error="fieldError('payment_method')" required /></div><div class="mt-6 flex justify-end gap-2"><BaseButton variant="secondary" type="button" :disabled="formLoading" @click="closeForm">{{ t('actions.cancel') }}</BaseButton><BaseButton type="submit" :loading="formLoading" :disabled="formLoading">{{ formMode === 'pay' ? t('sales.payInstallment') : t('actions.save') }}</BaseButton></div></form></div>
  <ConfirmDialog :open="deleteTarget !== null" :title="t('sales.deleteInstallment')" :message="t('sales.deleteInstallmentMessage')" :confirm-label="t('actions.delete')" :loading="list.mutating.value" @close="deleteTarget = null" @confirm="confirmDelete" />
</template>
